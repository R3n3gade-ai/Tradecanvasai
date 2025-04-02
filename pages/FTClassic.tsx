"use client";

import React from "react";
import { useNavigate } from "react-router-dom";

export default function FTClassic() {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center text-primary mb-6 hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Return to Dashboard
        </button>

        <div className="flex items-center justify-center h-[60vh]">
          <h1 className="text-3xl font-bold text-center">Flowtrade Classic coming soon</h1>
        </div>
      </div>
    </div>
  );
}