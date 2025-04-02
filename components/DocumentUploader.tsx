"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Upload, FilePlus, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrainStore } from "../utils/brainStore";

interface DocumentUploaderProps {
  useTedBrain?: boolean;
  className?: string;
  onUploadComplete?: (result: any) => void;
}

export function DocumentUploader({ useTedBrain = true, className = "", onUploadComplete }: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { addToTedBrain } = useBrainStore();

  // Handle file upload and processing
  const processFile = async (file: File) => {
    if (!file) return;
    
    // Check file type and process accordingly
    const documentTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/msword', // doc
      'text/plain', // txt
      'text/markdown', // md
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
      'application/vnd.ms-powerpoint' // ppt
    ];
    
    const imageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp'
    ];
    
    const videoTypes = [
      'video/mp4',
      'video/quicktime', // mov
      'video/x-msvideo', // avi
      'video/webm',
      'video/x-matroska' // mkv
    ];
    
    try {
      setIsUploading(true);
      
      if (documentTypes.includes(file.type)) {
        // Process document files
        if (file.type === 'text/plain') {
          const text = await file.text();
          const result = await addToTedBrain(
            text, 
            'document', 
            {
              filename: file.name,
              fileType: file.type,
              fileSize: file.size,
              uploadDate: new Date().toISOString()
            }
          );
          
          if (result) {
            toast.success(`Added ${file.name} to your knowledge brain!`);
            if (onUploadComplete) onUploadComplete(result);
          }
        } else {
          // For now, just extract the name and simulate success
          // In a real implementation, you would extract text from PDFs/Word docs
          toast.info(`Processing ${file.name}... (This is a simulation)`);
          
          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Simulate adding to brain with file metadata
          const result = await addToTedBrain(
            `This is simulated content extracted from ${file.name}`, 
            'document', 
            {
              filename: file.name,
              fileType: file.type,
              fileSize: file.size,
              uploadDate: new Date().toISOString()
            }
          );
          
          if (result) {
            toast.success(`Added ${file.name} to your knowledge brain!`);
            if (onUploadComplete) onUploadComplete(result);
          }
        }
      } else if (imageTypes.includes(file.type) || videoTypes.includes(file.type)) {
        // Process image or video files using the upload-media endpoint
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', 'default'); // Use default user ID for now
        
        const response = await fetch('/api/ted_brain/upload-media', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to upload media');
        }
        
        const result = await response.json();
        
        if (result) {
          toast.success(`Added ${file.name} to your knowledge brain!`);
          if (onUploadComplete) onUploadComplete(result);
        }
      } else {
        toast.error("Unsupported file type. Please upload PDF, Word, TXT, Markdown, image, or video files.");
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error("Failed to process file");
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div 
        className={`
          border border-dashed rounded-lg py-1 px-2 transition-colors text-center cursor-pointer
          ${dragActive ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-primary/70'}
        `}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.txt,.md,.pptx,.ppt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.webm,.mkv"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        <div className="flex items-center justify-center gap-1 text-xs">
          {isUploading ? (
            <>
              <Loader2 className="h-3 w-3 text-primary animate-spin" />
              <span className="text-muted-foreground">Processing...</span>
            </>
          ) : (
            <>
              <Upload className="h-3 w-3 text-primary" />
              <span>Upload Document or Media</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
