"use client";

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  TrendingUp, Layout, BarChart2, CheckSquare, Search, 
  MessageSquare, GraduationCap, Trophy,
  LineChart, PieChart
} from "lucide-react";
import { useDashboardStore } from "../utils/store";
import { UserAvatar } from "./UserAvatar";
import { useUserStore } from "../utils/userStore";

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen } = useDashboardStore();
  
  // Determine which link is active based on current path
  const isActive = (path: string) => {
    if (path === "/dashboard" && (location.pathname === "/dashboard" || location.pathname === "/")) return true;
    if (path !== "/dashboard" && location.pathname === path) return true;
    return false;
  };
  
  // Navigation items
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Layout },
    { path: "/amcharts", label: "AmCharts", icon: LineChart },
    { path: "/charts", label: "Charts", icon: BarChart2 },
    { path: "/charting", label: "Charting", icon: LineChart },
    { path: "/options", label: "Options Chain", icon: CheckSquare },
    { path: "/dark-pool", label: "Dark Pool", icon: LineChart },
    { path: "/stock-screener", label: "Screeners", icon: Search },
    { path: "/ted-ai", label: "TED AI", icon: () => <span className="h-4 w-4 flex items-center justify-center font-bold text-xs text-primary">AI</span> },
    { path: "/social", label: "Social", icon: MessageSquare },
    { path: "/courses", label: "Education Station", icon: GraduationCap },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/ft-classic", label: "FT Classic", icon: PieChart }
  ];

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} border-r border-white/10 flex flex-col h-full transition-all duration-300`}>
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center">
          <TrendingUp className="h-6 w-6 text-primary mr-2" />
          <span className={`text-xl font-bold ${!sidebarOpen ? 'hidden' : ''}`}>Trade Canvas AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="pb-4">
          <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Menu</h3>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a 
                  key={item.path}
                  onClick={() => navigate(item.path)} 
                  className={`flex items-center px-3 py-2 rounded-md ${isActive(item.path) ? 'bg-primary/10 text-primary' : 'hover:bg-primary/10 text-muted-foreground hover:text-foreground'} transition-colors cursor-pointer`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  <span className={!sidebarOpen ? 'hidden' : ''}>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center">
          <div className="mr-3">
            <UserAvatar size="sm" />
          </div>
          <div className={!sidebarOpen ? 'hidden' : ''}>
            {useUserStore().isAuthenticated ? (
              <>
                <p className="font-medium">{useUserStore().user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{useUserStore().user?.email || ''}</p>
              </>
            ) : (
              <button 
                onClick={() => navigate("/login")} 
                className="text-sm text-primary hover:underline"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
