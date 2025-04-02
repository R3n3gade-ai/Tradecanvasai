"use client";

import React from "react";
import { MessageSquare, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChatSocial() {
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
        
        <div className="flex items-center mb-8 space-x-4">
          <div className="bg-primary/20 p-4 rounded-lg">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Chat & Social</h1>
        </div>
        
        <div className="bg-card rounded-lg border border-white/10 p-8 text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Trader Community Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join a community of like-minded traders to share insights, discuss market trends, 
            and collaborate on investment strategies in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
