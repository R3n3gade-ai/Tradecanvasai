"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../utils/userStore";
import { UserAvatar } from "./UserAvatar";
import { LogOut, Settings, User, CreditCard } from "lucide-react";

export const UserMenuDropdown: React.FC = () => {
  const { user, logout, isAuthenticated } = useUserStore();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={() => navigate("/login")}
        className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium"
      >
        Login
      </button>
    );
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none"
      >
        <UserAvatar size="sm" />
        {/* Down arrow icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border border-white/10 z-50">
          <div className="py-1 rounded-md">
            {/* User info section */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.subscription === 'free' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                  {user.subscription === 'free' ? 'Free Plan' : user.subscription === 'pro' ? 'Pro Plan' : 'Enterprise'}
                </span>
              </div>
            </div>
            
            {/* Menu items */}
            <a
              href="#"
              className="block px-4 py-2 text-sm hover:bg-primary/10 flex items-center"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                navigate("/profile");
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </a>
            
            <a
              href="#"
              className="block px-4 py-2 text-sm hover:bg-primary/10 flex items-center"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                navigate("/settings");
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </a>
            
            <a
              href="#"
              className="block px-4 py-2 text-sm hover:bg-primary/10 flex items-center"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                navigate("/billing");
              }}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </a>
            
            {/* Logout */}
            <div className="border-t border-white/10 mt-1">
              <a
                href="#"
                className="block px-4 py-2 text-sm hover:bg-red-500/10 text-red-400 hover:text-red-300 flex items-center"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
