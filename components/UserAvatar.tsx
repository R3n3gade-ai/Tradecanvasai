"use client";

import React from "react";
import { useUserStore } from "../utils/userStore";
import { User } from "lucide-react";

interface Props {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

export const UserAvatar: React.FC<Props> = ({ 
  size = "md", 
  showName = false 
}) => {
  const { user, isAuthenticated } = useUserStore();
  
  // Size mapping
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };
  
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };
  
  // If not authenticated, show generic avatar
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center">
        <div className={`rounded-full bg-primary/20 flex items-center justify-center ${sizeClasses[size]}`}>
          <User className={`text-primary ${iconSizes[size]}`} />
        </div>
        {showName && <div className="ml-3 text-sm">Guest User</div>}
      </div>
    );
  }
  
  // If user has a photo
  if (user.photoUrl) {
    return (
      <div className="flex items-center">
        <img 
          src={user.photoUrl} 
          alt={user.name}
          className={`rounded-full object-cover ${sizeClasses[size]}`}
        />
        {showName && (
          <div className="ml-3">
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}
      </div>
    );
  }
  
  // User without photo - show initials
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map(name => name[0])
    .join('')
    .toUpperCase();
  
  return (
    <div className="flex items-center">
      <div className={`rounded-full bg-primary/20 flex items-center justify-center ${sizeClasses[size]}`}>
        <span className="text-primary font-medium">{initials}</span>
      </div>
      {showName && (
        <div className="ml-3">
          <p className="font-medium text-sm">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      )}
    </div>
  );
};
