"use client";

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../utils/userStore";

interface Props {
  children: React.ReactNode;
}

export const AuthProtection: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, isLoading } = useUserStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only redirect once we know the user is not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Show loading state if we're still checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-muted-foreground">Loading user information...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, navigation to login happens via the useEffect
  // This check is just to prevent a flash of the protected page before redirect
  if (!isAuthenticated) {
    return null;
  }
  
  // Render children only if authenticated
  return <>{children}</>;
};
