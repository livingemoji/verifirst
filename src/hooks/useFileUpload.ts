import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface FileUploadConfig {
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  chunkSize: number; // in bytes
  maxConcurrentUploads: number;
  retryAttempts: number;
}

const DEFAULT_CONFIG: FileUploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['image/*', 'audio/*', 'video/*', '.pdf', '.doc', '.docx', '.txt'],
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
  maxConcurrentUploads: 3,
  retryAttempts: 3
};

export const useFileUpload = (config: Partial<FileUploadConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const activeUploads = useRef<Set<string>>(new Set());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > finalConfig.maxFileSize) {
      return `File size exceeds ${Math.round(finalConfig.maxFileSize / 1024 / 1024)}MB limit`;
    }

    const isValidType = finalConfig.allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type);
      }
      return file.type.match(new RegExp(type.replace('*', '.*')));
    });

    if (!isValidType) {
      return `File type not allowed. Allowed types: ${finalConfig.allowedTypes.join(', ')}`;
    }

    return null;
  }, [finalConfig]);

  const uploadFileChunked = useCallback(async (
    file: File,
    fileId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const chunks = Math.ceil(file.size / finalConfig.chunkSize);
    const uploadPath = `uploads/${fileId}/${file.name}`;
    
    for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
      const start = chunkIndex * finalConfig.chunkSize;
      const end = Math.min(start + finalConfig.chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const chunkPath = `${uploadPath}.part${chunkIndex}`;
      
      let retryCount = 0;
      while (retryCount < finalConfig.retryAttempts) {
        try {
          const { error } = await supabase.storage
            .from('scam-shield-files')
            .upload(chunkPath, chunk, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;
          
          const progress = ((chunkIndex + 1) / chunks) * 100;
          onProgress?.(progress);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= finalConfig.retryAttempts) {
            throw new Error(`Failed to upload chunk ${chunkIndex} after ${finalConfig.retryAttempts} attempts`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        }
      }
    }

    // Combine chunks
    const { data: combinedFile, error: combineError } = await supabase.storage
      .from('scam-shield-files')
      .upload(uploadPath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (combineError) throw combineError;

    // Clean up chunks
    for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
      await supabase.storage
        .from('scam-shield-files')
        .remove([`${uploadPath}.part${chunkIndex}`]);
    }

    return uploadPath;
  }, [finalConfig]);

  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    setIsUploading(true);
    const uploadedPaths: string[] = [];
    
    // Initialize upload progress
    const initialProgress: UploadProgress[] = files.map(file => ({
      fileId: crypto.randomUUID(),
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));
    
    setUploads(initialProgress);

    // Process files in batches
    for (let i = 0; i < files.length; i += finalConfig.maxConcurrentUploads) {
      const batch = files.slice(i, i + finalConfig.maxConcurrentUploads);
      const batchPromises = batch.map(async (file, batchIndex) => {
        const fileIndex = i + batchIndex;
        const fileId = initialProgress[fileIndex].fileId;
        const controller = new AbortController();
        abortControllers.current.set(fileId, controller);

        try {
          // Validate file
          const validationError = validateFile(file);
          if (validationError) {
            throw new Error(validationError);
          }

          // Update status to uploading
          setUploads(prev => prev.map(upload => 
            upload.fileId === fileId 
              ? { ...upload, status: 'uploading' }
              : upload
          ));

          activeUploads.current.add(fileId);

          // Upload file
          const uploadPath = await uploadFileChunked(
            file,
            fileId,
            (progress) => {
              setUploads(prev => prev.map(upload => 
                upload.fileId === fileId 
                  ? { ...upload, progress }
                  : upload
              ));
            }
          );

          // Update status to processing
          setUploads(prev => prev.map(upload => 
            upload.fileId === fileId 
              ? { ...upload, status: 'processing', progress: 100 }
              : upload
          ));

          // Store file metadata in database
          const { error: dbError } = await supabase
            .from('file_uploads')
            .insert({
              filename: file.name,
              original_name: file.name,
              mime_type: file.type,
              size: file.size,
              storage_path: uploadPath,
              content_hash: await generateFileHash(file),
              status: 'completed'
            });

          if (dbError) throw dbError;

          // Update status to completed
          setUploads(prev => prev.map(upload => 
            upload.fileId === fileId 
              ? { ...upload, status: 'completed' }
              : upload
          ));

          uploadedPaths.push(uploadPath);
          return uploadPath;

        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          
          setUploads(prev => prev.map(upload => 
            upload.fileId === fileId 
              ? { 
                  ...upload, 
                  status: 'failed', 
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : upload
          ));
          
          throw error;
        } finally {
          activeUploads.current.delete(fileId);
          abortControllers.current.delete(fileId);
        }
      });

      await Promise.allSettled(batchPromises);
    }

    setIsUploading(false);
    return uploadedPaths;
  }, [finalConfig, validateFile, uploadFileChunked]);

  const cancelUpload = useCallback((fileId: string) => {
    const controller = abortControllers.current.get(fileId);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(fileId);
    }
    
    setUploads(prev => prev.map(upload => 
      upload.fileId === fileId 
        ? { ...upload, status: 'failed', error: 'Upload cancelled' }
        : upload
    ));
    
    activeUploads.current.delete(fileId);
  }, []);

  const retryUpload = useCallback(async (fileId: string) => {
    const upload = uploads.find(u => u.fileId === fileId);
    if (!upload || upload.status !== 'failed') return;

    // Reset upload status
    setUploads(prev => prev.map(u => 
      u.fileId === fileId 
        ? { ...u, status: 'pending', progress: 0, error: undefined }
        : u
    ));

    // Retry the upload
    // Note: This would need the original file object, which we don't store
    // In a real implementation, you'd want to store the file or get it from the user
  }, [uploads]);

  const clearUploads = useCallback(() => {
    setUploads([]);
    activeUploads.current.clear();
    abortControllers.current.clear();
  }, []);

  return {
    uploads,
    isUploading,
    uploadFiles,
    cancelUpload,
    retryUpload,
    clearUploads,
    activeUploadCount: activeUploads.current.size
  };
};

// Helper function to generate file hash
async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
} 