"use client";

import React from "react";
import { PlusCircle, Brain, X, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBrainStore } from "../utils/brainStore";
import { toast } from "sonner";

interface AddToBrainProps {
  // Content to add to brain
  content?: string;
  // Source category (e.g., 'chat', 'stock-analysis', 'chart')
  source?: string;
  // Additional metadata
  metadata?: Record<string, any>;
  // Visual variants
  variant?: "button" | "icon" | "link" | "compact";
  // Children for custom trigger
  children?: React.ReactNode;
  // Label override (default is "Add to Brain")
  label?: string;
  // Classes for styling
  className?: string;
  // Use TedBrain API instead of main brain API
  useTedBrain?: boolean;
}

export function AddToBrain({
  content,
  source = "chat",
  metadata = {},
  variant = "button",
  children,
  label,
  className = "",
  useTedBrain = false,
}: AddToBrainProps) {
  // Get from brain store
  const { 
    showBrainModal, 
    isAddingToBrain, 
    pendingContent,
    pendingSource,
    pendingMetadata,
    addToBrain, 
    addToTedBrain,
    setBrainModalOpen,
    setPendingContent,
  } = useBrainStore();
  
  // Local state for editing
  const [editedContent, setEditedContent] = React.useState("");
  const [editedSource, setEditedSource] = React.useState("");
  const [editedMetadata, setEditedMetadata] = React.useState<Record<string, string>>({});
  
  // Update local state when modal opens
  React.useEffect(() => {
    if (showBrainModal && pendingContent) {
      setEditedContent(pendingContent);
      setEditedSource(pendingSource || source);
      setEditedMetadata(pendingMetadata || metadata);
    }
  }, [showBrainModal, pendingContent, pendingSource, pendingMetadata, source, metadata]);
  
  // Handle click on trigger
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (content) {
      // If content is provided directly, open modal with it
      setPendingContent(content, source, metadata);
    } else {
      // If no content, just open empty modal
      setBrainModalOpen(true);
    }
  };
  
  // Handle save to brain
  const handleSave = async () => {
    if (!editedContent?.trim()) {
      toast.error("Please enter some content to save");
      return;
    }
    
    let result;
    if (useTedBrain) {
      result = await addToTedBrain(editedContent, editedSource, editedMetadata);
    } else {
      result = await addToBrain(editedContent, editedSource, editedMetadata);
    }
    
    if (result) {
      toast.success("Added to your knowledge brain!");
    }
  };
  
  // Render different variants
  const renderTrigger = () => {
    // If children are provided, use them as the trigger
    if (children) {
      return <div onClick={handleClick}>{children}</div>;
    }
    
    switch (variant) {
      case "icon":
        return (
          <button
            onClick={handleClick}
            className={`text-muted-foreground hover:text-foreground focus:outline-none ${className}`}
            title="Add to Brain"
          >
            <Brain className="h-4 w-4" />
          </button>
        );
      case "link":
        return (
          <button
            onClick={handleClick}
            className={`text-primary hover:underline focus:outline-none inline-flex items-center gap-1 ${className}`}
          >
            <Brain className="h-4 w-4" />
            <span>{label || "Add to Brain"}</span>
          </button>
        );
      case "compact":
        return (
          <button
            onClick={handleClick}
            className={`bg-primary/10 hover:bg-primary/20 text-primary rounded p-1 flex items-center gap-1 ${className}`}
          >
            <Brain className="h-3 w-3" />
            <span className="text-xs">{label || "Save"}</span>
          </button>
        );
      case "button":
      default:
        return (
          <Button 
            onClick={handleClick} 
            variant="default" 
            size="sm" 
            className={`gap-1 h-8 text-xs px-2 py-1 ${className}`}
          >
            <PlusCircle className="h-3 w-3" />
            <span>{label || "Add to Brain"}</span>
          </Button>
        );
    }
  };

  return (
    <>
      {renderTrigger()}
      
      <Dialog open={showBrainModal} onOpenChange={setBrainModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Add to Your Knowledge Brain
            </DialogTitle>
            <DialogDescription>
              Save important information that you want TED AI to remember and use in future conversations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter information you want to save..."
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source">Source Type</Label>
              <Input
                id="source"
                placeholder="E.g., stock-chart, market-analysis, note"
                value={editedSource}
                onChange={(e) => setEditedSource(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Categorize this information to help with retrieval
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBrainModalOpen(false)}
              disabled={isAddingToBrain}
            >
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isAddingToBrain || !editedContent.trim()}
              className="gap-1"
            >
              {isAddingToBrain ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save to Brain
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
