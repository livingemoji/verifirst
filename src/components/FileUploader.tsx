
import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FileUploader = ({ files, onChange }) => {
  const handleFileSelect = useCallback((event) => {
    const selectedFiles = Array.from(event.target.files);
    onChange([...files, ...selectedFiles]);
  }, [files, onChange]);

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Evidence Files (Optional)
      </label>
      
      <div className="space-y-4">
        {/* Upload Area */}
        <motion.div
          className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer"
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
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-300 font-medium">Click to upload evidence</p>
            <p className="text-slate-400 text-sm mt-1">
              Images, audio, video, or documents
            </p>
          </label>
        </motion.div>
        
        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300 text-sm truncate">
                    {file.name}
                  </span>
                  <span className="text-slate-500 text-xs">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-slate-400 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
