import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, FileImage } from "lucide-react";

interface FileUploadProps {
  onChange?: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({ 
  onChange, 
  accept = "image/*", 
  maxFiles = 1,
  className 
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const fileArray = Array.from(newFiles).slice(0, maxFiles);
    setFiles(fileArray);
    onChange?.(fileArray);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange?.(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("w-full", className)}>
      <motion.div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        initial={false}
        animate={{
          borderColor: isDragging ? "#e23744" : "#e5e7eb",
          backgroundColor: isDragging ? "rgba(226, 55, 68, 0.02)" : "white"
        }}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-all",
          "hover:border-gray-300 hover:bg-gray-50/50",
          "flex flex-col items-center justify-center min-h-[200px]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden"
        />

        {/* Grid Background Pattern */}
        <div className="absolute inset-4 grid grid-cols-8 gap-1 opacity-20 pointer-events-none">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} className="aspect-square rounded bg-gray-200" />
          ))}
        </div>

        {/* Upload Icon */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: isDragging ? -5 : 0 }}
          className="relative z-10 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4"
        >
          <Upload className="w-6 h-6 text-gray-400" />
        </motion.div>

        <h3 className="relative z-10 text-lg font-bold text-gray-800 mb-1">
          Upload file
        </h3>
        <p className="relative z-10 text-sm text-gray-500">
          Drag or drop your files here or click to upload
        </p>
      </motion.div>

      {/* File Preview */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file, index) => (
            <motion.div
              key={file.name + index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {file.type} • modified {new Date(file.lastModified).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {formatFileSize(file.size)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
