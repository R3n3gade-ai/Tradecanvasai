"use client";

import React from "react";
import { Search, ChevronLeft, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddToBrain } from "../components/AddToBrain";

export default function Screeners() {
  const navigate = useNavigate();
  
  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center text-primary mb-8 hover:underline"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center mb-8 space-x-4 justify-between w-full">
          <div className="flex items-center space-x-4">
          <div className="bg-primary/20 p-4 rounded-lg">
            <Search className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Stock Screeners</h1>
          </div>
          
          <div className="flex items-center">
            <button 
              className="px-4 py-2 bg-indigo-900/30 text-indigo-400 border border-indigo-700/40 rounded flex items-center gap-1.5 hover:bg-indigo-800/40 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('[data-add-to-brain]')?.click();
              }}
            >
              <Brain className="h-4 w-4" />
              Add to Ted's Brain
            </button>
            <div className="hidden">
              <AddToBrain
                content="Collection of stock screeners including technical indicators, fundamentals, and market performance."
                source="stock-screeners"
                metadata={{ page: "screeners" }}
                data-add-to-brain
              />
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div 
            className="bg-card rounded-lg border border-white/10 p-8 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => navigate("/StockScreener")}
          >
            <div className="flex items-center mb-4">
              <div className="bg-primary/20 p-3 rounded-full mr-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Stock Screener</h2>
            </div>
            <p className="text-muted-foreground">
              Find stocks by technical indicators, fundamentals, and market performance. Save your favorite screeners as presets.
            </p>
            <button className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
              Launch Screener
            </button>
          </div>
          
          <div className="bg-card rounded-lg border border-white/10 p-8 text-center">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-4">More Screeners Coming Soon</h2>
            <p className="text-muted-foreground">
              Options screener, ETF screener, and cryptocurrency screener tools are currently in development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
