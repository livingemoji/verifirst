import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  onUploadComplete?: (uploadedPaths: string[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  files, 
  onChange, 
  onUploadComplete 
}) => {
  const {
    uploads,
    isUploading,
    uploadFiles,
    cancelUpload,
    retryUpload,
    clearUploads,
    activeUploadCount
  } = useFileUpload({
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['image/*', 'audio/*', 'video/*', '.pdf', '.doc', '.docx', '.txt'],
    chunkSize: 5 * 1024 * 1024, // 5MB chunks
    maxConcurrentUploads: 3,
    retryAttempts: 3
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    onChange([...files, ...selectedFiles]);
  }, [files, onChange]);

  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  }, [files, onChange]);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    
    try {
      const uploadedPaths = await uploadFiles(files);
      if (onUploadComplete) {
        onUploadComplete(uploadedPaths);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [files, uploadFiles, onUploadComplete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 animate-spin" />;
      default:
        return <File className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'uploading':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Evidence Files (Optional)
      </label>
      
      <div className="space-y-3 sm:space-y-4">
        {/* Upload Area */}
        <motion.div
          className="border-2 border-dashed border-slate-600 rounded-lg p-4 sm:p-6 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <input
            type="file"
            multiple
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm sm:text-base text-slate-300 font-medium">Click to upload evidence</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 px-2">
              Images, audio, video, or documents (max 50MB each)
            </p>
            {isUploading && (
              <p className="text-blue-400 text-xs sm:text-sm mt-2">
                Uploading {activeUploadCount} files...
              </p>
            )}
          </label>
        </motion.div>
        
        {/* Upload Progress */}
        <AnimatePresence>
          {uploads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="text-sm font-medium text-slate-300">Upload Progress</h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {uploads.filter(u => u.status === 'completed').length}/{uploads.length} Complete
                  </Badge>
                  {isUploading && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearUploads}
                      className="text-xs bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                    >
                      Cancel All
                    </Button>
                  )}
                </div>
              </div>
              
              {uploads.map((upload) => (
                <motion.div
                  key={upload.fileId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-slate-900/50 p-3 sm:p-4 rounded-lg border border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {getStatusIcon(upload.status)}
                      <span className="text-xs sm:text-sm text-slate-300 truncate">
                        {upload.fileName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(upload.status)}`}
                      >
                        {upload.status}
                      </Badge>
                      {upload.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryUpload(upload.fileId)}
                          className="text-xs text-blue-400 hover:text-blue-300 p-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                      {upload.status === 'uploading' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelUpload(upload.fileId)}
                          className="text-xs text-red-400 hover:text-red-300 p-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {upload.status === 'uploading' && (
                    <Progress value={upload.progress} className="h-2 mt-2" />
                  )}
                  
                  {upload.error && (
                    <p className="text-xs text-red-400 mt-2">{upload.error}</p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300">Selected Files</h4>
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <File className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-slate-300 truncate block">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-slate-400 hover:text-red-400 p-1 flex-shrink-0"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
            
            {!isUploading && files.length > 0 && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleUpload}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-2 sm:py-3 text-sm sm:text-base"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {files.length} File{files.length > 1 ? 's' : ''}
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
