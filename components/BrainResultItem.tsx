"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileText, Calendar, Tag, Image, Film, Globe, MessageSquare } from "lucide-react";

interface BrainResultItemProps {
  result: any;
  index: number;
  className?: string;
}

interface MediaPreviewProps {
  result: any;
  expanded: boolean;
  onToggle: () => void;
}

const MediaPreview = ({ result, expanded, onToggle }: MediaPreviewProps) => {
  const isImage = result.source === "image";
  const isVideo = result.source === "video";
  const storageKey = result.metadata?.storage_key;
  
  // This is a simplified version for demo purposes
  // In production, you would use actual media URLs from your storage
  const mediaUrl = isImage 
    ? `https://picsum.photos/seed/${result.id}/400/300`
    : isVideo
    ? `https://picsum.photos/seed/${result.id}/400/225`
    : "";
  
  if (!isImage && !isVideo) return null;
  
  return (
    <div className="relative mt-2 mb-2">
      <div 
        className={cn(
          "overflow-hidden transition-all rounded-md cursor-pointer",
          expanded ? "max-h-80" : "max-h-32"
        )}
        onClick={onToggle}
      >
        {isImage && (
          <img 
            src={mediaUrl} 
            alt={result.content || "Image preview"} 
            className="w-full h-auto object-cover rounded-md"
          />
        )}
        {isVideo && (
          <div className="relative bg-black/10 rounded-md">
            <img 
              src={mediaUrl} 
              alt={result.content || "Video preview"} 
              className="w-full h-auto object-cover rounded-md opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 rounded-full p-2">
                <Film className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-1 text-center">
        {expanded ? "Click to collapse" : "Click to expand"}
      </div>
    </div>
  );
};

export function BrainResultItem({ result, index, className }: BrainResultItemProps) {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpanded = () => setExpanded(!expanded);
  
  const sourceIcon = {
    document: <FileText className="h-4 w-4" />,
    url: <Globe className="h-4 w-4" />,
    chat: <MessageSquare className="h-4 w-4" />,
    image: <Image className="h-4 w-4" />,
    video: <Film className="h-4 w-4" />,
  }[result.source] || <FileText className="h-4 w-4" />;

  return (
    <Card className={cn("mb-4", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-1">
          <div className="bg-primary/10 p-1 rounded-full">
            {sourceIcon}
          </div>
          <CardTitle className="text-base">
            {result.source === "document" && "Document"}
            {result.source === "url" && "Web Page"}
            {result.source === "chat" && "Chat History"}
            {result.source === "image" && "Image"}
            {result.source === "video" && "Video"}
          </CardTitle>
          <div className="ml-auto flex items-center space-x-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {result.created_at ? new Date(result.created_at).toLocaleDateString() : "Unknown date"}
            </span>
          </div>
        </div>
        <CardDescription className="text-xs truncate">
          {result.metadata?.filename || result.metadata?.url || `Result ${index + 1}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4 pt-0 text-sm text-card-foreground">
        {(result.source === "image" || result.source === "video") && (
          <MediaPreview 
            result={result} 
            expanded={expanded} 
            onToggle={toggleExpanded} 
          />
        )}
        <p>{result.content}</p>
      </CardContent>
      {result.metadata && Object.keys(result.metadata).length > 0 && (
        <CardFooter className="pt-0 pb-2 px-6">
          <div className="flex flex-wrap gap-1">
            {Object.entries(result.metadata)
              .filter(([key]) => !['storage_key', 'url', 'filename'].includes(key))
              .slice(0, 3)
              .map(([key, value]) => (
                <div 
                  key={key}
                  className="bg-background/40 text-xs rounded-full py-0.5 px-2 flex items-center gap-1"
                >
                  <Tag className="h-3 w-3" />
                  <span>{key}:</span>
                  <span className="font-medium">
                    {typeof value === 'string' ? value.slice(0, 20) : String(value).slice(0, 20)}
                    {typeof value === 'string' && value.length > 20 ? '...' : ''}
                  </span>
                </div>
              ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
