"use client";

import React, { useState, useEffect } from "react";
import { Brain, Link, FileText, UploadCloud, Plus, Settings, Trash2 } from "lucide-react";
import { ImportUrlModal } from "./ImportUrlModal";
import { useBrainStore } from "../utils/brainStore";
import { toast } from "sonner";
import brain from "brain";
import { AddToBrain } from "./AddToBrain";
import { DocumentUploader } from "./DocumentUploader";
import { BrainItem } from "types";

interface Props {
  compact?: boolean;
  className?: string;
}

export const TedsBrainContainer: React.FC<Props> = ({ compact = false, className = "" }) => {
  const { recentItems, queryTedBrain, getBrainStatus, showUrlImportModal, setUrlImportModalOpen } = useBrainStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BrainItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [brainStatus, setBrainStatus] = useState<{
    total_items: number;
    sources: Record<string, number>;
    size_kb: number;
    last_added: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getBrainStatus();
        setBrainStatus(status);
      } catch (error) {
        console.error('Error fetching brain status:', error);
      }
    };
    
    fetchStatus();
  }, [getBrainStatus, recentItems.length]);
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      console.log('Searching TedBrain with query:', searchQuery);
      const results = await queryTedBrain(searchQuery);
      console.log('TedBrain search results:', results);
      setSearchResults(results);
      toast.success(`Found ${results.length} results`);
    } catch (error) {
      console.error("Error searching brain:", error);
      toast.error("Failed to search brain");
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const sourceIcons: Record<string, React.ReactNode> = {
    "chart-data": <Brain className="h-3.5 w-3.5" />,
    "ted-ai-chat": <FileText className="h-3.5 w-3.5" />,
    "article": <FileText className="h-3.5 w-3.5" />,
    "user-input": <FileText className="h-3.5 w-3.5" />,
    "url": <Link className="h-3.5 w-3.5" />,
  };
  
  if (compact) {
    return (
      <div className={`bg-card rounded-lg border border-white/10 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Ted's Brain</h3>
          </div>
          <button 
            className="p-1 rounded hover:bg-background/60"
            onClick={() => setIsCollapsed(prev => !prev)}
          >
            {isCollapsed ? "Show" : "Hide"}
          </button>
        </div>
        
        {!isCollapsed && (
          <>
            <div className="text-xs text-muted-foreground mb-3">
              Your personal knowledge store for custom market insights.
            </div>
            
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(brainStatus?.sources || {}).map(([source, count]) => (
                <div key={source} className="bg-background/40 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  {sourceIcons[source] || <FileText className="h-3.5 w-3.5" />}
                  <span>{source}</span>
                  <span className="text-primary font-medium">{count}</span>
                </div>
              ))}              
            </div>
            
            <div className="flex gap-2">
              <AddToBrain 
                content="" 
                source="user-input"
                variant="button"
                label="Add Knowledge"
                useTedBrain={true}
              />
              <button 
                className="text-xs flex-1 py-1.5 px-3 flex justify-center items-center gap-1.5 bg-background/40 hover:bg-background/60 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => toast.info("Brain settings will be available soon!")}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Settings</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-white/10 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-full p-2">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Ted's Brain</h3>
            <p className="text-xs text-muted-foreground">Your personal knowledge store</p>
          </div>
        </div>
        <button 
          className="p-1 rounded hover:bg-background/60 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => toast.info("Brain settings will be available soon!")}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
      
      {brainStatus && (
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-background/40 p-2 rounded">
            <div className="text-xs text-muted-foreground">Knowledge Items</div>
            <div className="font-medium">{brainStatus.total_items}</div>
          </div>
          <div className="bg-background/40 p-2 rounded">
            <div className="text-xs text-muted-foreground">Size</div>
            <div className="font-medium">{brainStatus.size_kb.toFixed(1)} KB</div>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium">Knowledge Sources</h4>
          <span className="text-xs text-muted-foreground">
            {Object.keys(brainStatus?.sources || {}).length} types
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(brainStatus?.sources || {}).map(([source, count]) => (
            <div key={source} className="bg-background/40 text-xs px-2 py-1 rounded-md flex items-center gap-1.5">
              {sourceIcons[source] || <FileText className="h-3.5 w-3.5" />}
              <span>{source}</span>
              <span className="bg-primary/20 text-primary text-xs rounded-full px-1.5">{count}</span>
            </div>
          ))}              
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium">Recent Additions</h4>
          <button className="text-xs text-primary hover:underline">
            View all
          </button>
        </div>
        <div className="space-y-2 max-h-36 overflow-y-auto">
          {recentItems.length > 0 ? (
            recentItems.slice(0, 3).map((item, i) => (
              <div key={i} className="bg-background/40 p-2 rounded text-xs flex items-start gap-2">
                {sourceIcons[item.source] || <FileText className="h-3.5 w-3.5 mt-0.5" />}
                <div className="flex-1 truncate">
                  <div className="truncate">{item.content.substring(0, 100)}</div>
                  <div className="text-muted-foreground mt-1">
                    Added {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <button 
                  className="p-1 hover:bg-card rounded" 
                  title="Delete item"
                  onClick={() => toast.info("Deleting items will be available soon!")}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground text-xs py-2">
              No items added yet. Start building your knowledge store!
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-4">
          <AddToBrain 
            content="" 
            source="user-input" 
            variant="button" 
            label="Add Knowledge"
            useTedBrain={true}
            className="w-full"
          />
          
          <DocumentUploader useTedBrain={true} />
        </div>
        <button 
          className="flex justify-center items-center gap-1.5 py-2 px-3 border border-dashed border-white/10 rounded-md text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
          onClick={() => setUrlImportModalOpen(true)}
        >
          <Link className="h-4 w-4" />
          <span className="text-sm">Import URL</span>
        </button>
        
        {/* URL Import Modal */}
        <ImportUrlModal 
          open={showUrlImportModal} 
          onOpenChange={setUrlImportModalOpen} 
          useTedBrain={true}
        />
      </div>
    </div>
  );
};
