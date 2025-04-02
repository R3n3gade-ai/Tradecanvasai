"use client";

import React, { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { Search, Bell, Settings, Menu, RefreshCw } from "lucide-react";
import { useDashboardStore } from "../utils/store";
import { UserMenuDropdown } from "./UserMenuDropdown";

interface Props {
  children: ReactNode;
  title?: string;
  showRefresh?: boolean;
}

export const DashboardLayout: React.FC<Props> = ({ 
  children, 
  title,
  showRefresh = false
}) => {
  const { toggleSidebar, refreshData } = useDashboardStore();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleSidebar} 
              className="p-2 rounded-md hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            {showRefresh && (
              <button 
                onClick={() => refreshData()} 
                className="p-2 rounded-md hover:bg-card transition-colors flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                title="Refresh market data"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs">Refresh</span>
              </button>
            )}
            {title && <h1 className="text-xl font-bold">{title}</h1>}
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search here..." 
              className="w-full pl-10 pr-4 py-2 rounded-md bg-card border border-white/10 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-md hover:bg-card transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>
            <UserMenuDropdown />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      
      {/* Chat Panel */}
      <ChatPanel />
    </div>
  );
};
