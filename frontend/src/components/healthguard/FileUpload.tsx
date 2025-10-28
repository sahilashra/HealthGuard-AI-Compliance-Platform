import React, { useState, useCallback } from 'react';
import { FileUploadProps, UploadState } from '@/types/healthguard';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onUploadComplete,
  maxSize = 10,
  acceptedFormats = ['.pdf', '.docx', '.doc']
}) => {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('idle');
  }, []);

  const processFile = async (file: File) => {
    setFileName(file.name);
    setUploadState('uploading');
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgress(i);
    }
    
    if (onFileUpload) {
      onFileUpload(file);
    }
    
    setUploadState('success');
    
    if (onUploadComplete) {
      onUploadComplete(file.name);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, [onFileUpload, onUploadComplete]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const getStateIcon = () => {
    switch (uploadState) {
      case 'dragging':
        return <Upload className="w-12 h-12 text-blue-500" />;
      case 'uploading':
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return <FileText className="w-12 h-12 text-gray-400" />;
    }
  };

  const getStateText = () => {
    switch (uploadState) {
      case 'dragging':
        return 'Drop your file here';
      case 'uploading':
        return `Uploading ${fileName}... ${progress}%`;
      case 'success':
        return `Successfully uploaded ${fileName}`;
      case 'error':
        return 'Upload failed. Please try again.';
      default:
        return 'Drag & drop your compliance document here';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${uploadState === 'dragging' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
          ${uploadState === 'uploading' ? 'border-blue-400 bg-blue-50' : ''}
          ${uploadState === 'success' ? 'border-green-400 bg-green-50' : ''}
          ${uploadState === 'error' ? 'border-red-400 bg-red-50' : ''}
          hover:border-blue-400 hover:bg-blue-50 cursor-pointer
        `}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          accept={acceptedFormats.join(',')}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadState === 'uploading'}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            {getStateIcon()}
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">
              {getStateText()}
            </p>
            {uploadState === 'idle' && (
              <p className="text-sm text-gray-500">
                or click to browse (Max {maxSize}MB)
              </p>
            )}
          </div>

          {uploadState === 'uploading' && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {uploadState === 'idle' && (
            <div className="flex justify-center gap-2 pt-4">
              {acceptedFormats.map((format) => (
                <span
                  key={format}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                >
                  {format}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {uploadState === 'success' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ File uploaded successfully! Processing compliance analysis...
          </p>
        </div>
      )}
    </div>
  );
};
