"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Brain, Upload, Search } from "lucide-react";
import { TedsBrainContainer2 } from "./TedsBrainContainer2";

export function TedsBrainDashboardTool() {
  const navigate = useNavigate();
  return (
    <div className="bg-card rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-full p-2">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Your personal trading companion</h3>
            <p className="text-xs text-muted-foreground">AI-powered market insights</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div 
          className="bg-background/40 p-3 rounded flex items-center gap-3 cursor-pointer hover:bg-background/60 transition-colors"
          onClick={() => navigate("/tedai")}
        >
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h4 className="font-medium text-sm">TedAI Chat</h4>
            <p className="text-xs text-muted-foreground">AI-powered market analysis and strategy</p>
          </div>
        </div>
        
        <div 
          className="bg-background/40 p-3 rounded flex items-center gap-3 cursor-pointer hover:bg-background/60 transition-colors"
          onClick={() => toast.info("Brain search module coming soon!")}
        >
          <Search className="h-8 w-8 text-primary" />
          <div>
            <h4 className="font-medium text-sm">Brain Search</h4>
            <p className="text-xs text-muted-foreground">Search your entire knowledge base</p>
          </div>
        </div>
        
        <div 
          className="bg-background/40 p-3 rounded flex items-center gap-3 cursor-pointer hover:bg-background/60 transition-colors"
          onClick={() => toast.info("Document upload capability coming soon!")}
        >
          <Upload className="h-8 w-8 text-primary" />
          <div>
            <h4 className="font-medium text-sm">Knowledge Store</h4>
            <p className="text-xs text-muted-foreground">Add new information to your brain</p>
          </div>
        </div>
      </div>
    </div>
  );
}