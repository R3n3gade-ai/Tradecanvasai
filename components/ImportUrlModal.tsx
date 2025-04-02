"use client";

import React, { useState, useEffect } from "react";
import { Link, Search, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useBrainStore } from "../utils/brainStore";
import { UrlPreview } from "./UrlPreview";

interface ImportUrlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useTedBrain?: boolean;
}

export function ImportUrlModal({ open, onOpenChange, useTedBrain = false }: ImportUrlModalProps) {
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'fetching' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [urlMetadata, setUrlMetadata] = useState<{title?: string; description?: string; domain?: string} | null>(null);
  const { addToBrain, addToTedBrain } = useBrainStore();
  
  // Reset status when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setImportStatus('idle');
        setStatusMessage("");
        setUrl("");
        setUrlMetadata(null);
      }, 300); // Delay to allow animation to complete
    }
  }, [open]);
  
  // Extract domain from URL for simple preview
  const extractDomain = (urlString: string): string => {
    try {
      const url = new URL(urlString);
      return url.hostname;
    } catch {
      return "";
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }
    
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    
    setIsImporting(true);
    
    try {
      // First update status to fetching
      setImportStatus('fetching');
      setStatusMessage("Fetching webpage content...");
      
      // Use proper brain function based on the useTedBrain prop
      const content = `URL: ${url}`;
      const source = "url";
      const metadata = { url: url, imported_at: new Date().toISOString() };
      
      // Update status to processing
      setImportStatus('processing');
      setStatusMessage("Processing and analyzing content...");
      
      let result;
      if (useTedBrain) {
        result = await addToTedBrain(content, source, metadata);
      } else {
        result = await addToBrain(content, source, metadata);
      }
      
      if (result) {
        // Get metadata from the response if available
        if (result.metadata && typeof result.metadata === 'object') {
          const metadata = result.metadata;
          setUrlMetadata({
            title: metadata.title,
            description: metadata.description,
            domain: metadata.domain || extractDomain(url)
          });
        }
        
        setImportStatus('success');
        setStatusMessage("URL successfully added to your knowledge brain!");
        toast.success("URL added to your knowledge brain!");
        
        // Short delay to show success status before closing
        setTimeout(() => {
          setUrl("");
          onOpenChange(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error importing URL:", error);
      setImportStatus('error');
      setStatusMessage("Failed to import URL. Please check the URL and try again.");
      toast.error("Failed to import URL. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            Import URL to Knowledge Brain
          </DialogTitle>
          <DialogDescription>
            Add a website URL to your knowledge brain. The URL content will be processed and made available for future reference.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="relative">
              <Input
                id="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-8"
                disabled={isImporting}
              />
              <Link className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the full URL including https:// or http://
            </p>
          </div>
          
          {/* Status indicator */}
          {importStatus !== 'idle' && (
            <div className={`p-3 rounded-md text-sm flex items-center gap-2 mb-2 ${
              importStatus === 'error' ? 'bg-destructive/10 text-destructive' : 
              importStatus === 'success' ? 'bg-green-500/10 text-green-500' : 
              'bg-primary/10 text-primary'
            }`}>
              {importStatus === 'fetching' && <Loader2 className="h-4 w-4 animate-spin" />}
              {importStatus === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
              {importStatus === 'success' && <div className="h-4 w-4 rounded-full bg-green-500" />}
              {importStatus === 'error' && <X className="h-4 w-4" />}
              <span>{statusMessage}</span>
            </div>
          )}
          
          {/* URL Preview */}
          {url && url.startsWith('http') && importStatus === 'idle' && (
            <UrlPreview 
              url={url}
              domain={extractDomain(url)}
              isLoading={false}
              className="mb-2"
            />
          )}
          
          {/* URL Preview with Metadata (after fetching) */}
          {importStatus === 'success' && urlMetadata && (
            <UrlPreview 
              url={url}
              title={urlMetadata.title}
              description={urlMetadata.description}
              domain={urlMetadata.domain}
              className="mb-2"
            />
          )}
          
          {/* Loading Preview */}
          {(importStatus === 'fetching' || importStatus === 'processing') && (
            <UrlPreview 
              url={url}
              isLoading={true}
              domain={extractDomain(url)}
              className="mb-2"
            />
          )}
          
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isImporting && importStatus !== 'error'}
            >
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isImporting || !url.trim()}
              className="gap-1"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {importStatus === 'fetching' ? 'Fetching...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Import URL
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
