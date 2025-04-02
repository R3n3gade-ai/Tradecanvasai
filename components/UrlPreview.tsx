"use client";

import React from "react";
import { Link, ExternalLink } from "lucide-react";

interface UrlPreviewProps {
  url: string;
  title?: string;
  description?: string;
  domain?: string;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function UrlPreview({
  url,
  title,
  description,
  domain,
  isLoading = false,
  onClick,
  className = "",
}: UrlPreviewProps) {
  // Extract domain from URL if not provided
  const displayDomain = domain || (() => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  })();
  
  // Format description to be a reasonable length
  const formattedDescription = description && description.length > 120 
    ? `${description.substring(0, 120)}...` 
    : description;
  
  return (
    <div 
      className={`flex flex-col gap-2 p-3 rounded-md border border-white/10 bg-card/60 hover:bg-card/80 transition-colors ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Link className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="text-xs text-muted-foreground overflow-hidden text-ellipsis">
          {displayDomain}
        </div>
        
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="ml-auto text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      
      {isLoading ? (
        <>
          <div className="h-5 w-3/4 bg-white/5 animate-pulse rounded"></div>
          <div className="h-3 w-full bg-white/5 animate-pulse rounded"></div>
          <div className="h-3 w-5/6 bg-white/5 animate-pulse rounded"></div>
        </>
      ) : (
        <>
          <h4 className="text-sm font-medium line-clamp-2">
            {title || url}
          </h4>
          
          {formattedDescription && (
            <p className="text-xs text-muted-foreground line-clamp-3">
              {formattedDescription}
            </p>
          )}
        </>
      )}
    </div>
  );
}
