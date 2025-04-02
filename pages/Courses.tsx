"use client";

import React from "react";
import { useNavigate } from "react-router-dom";

export default function Courses() {
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
        <div className="flex items-center mb-8 space-x-4">
          <h1 className="text-3xl font-bold">Education Station</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Live Trading Sessions */}
          <div 
            className="bg-card/60 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-primary/50 transition-all cursor-pointer group relative"
            onClick={() => navigate('/live-trading')}
          >
            <div className="relative h-48 overflow-hidden">
              <div className="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-bold py-1 px-2 rounded z-10 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                LIVE
              </div>
              <img 
                src="https://picsum.photos/id/237/800/400" 
                alt="Live Trading Session" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Live Trading Sessions</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Join our expert traders for live market sessions where we analyze current market conditions and execute trades in real-time.
              </p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Next stream: Today, 3:30 PM EST
                </div>
                <div className="text-xs text-muted-foreground">
                  4,235 subscribers
                </div>
              </div>
            </div>
          </div>
          
          {/* Proprietary Trading Tools and System */}
          <div 
            className="bg-card/60 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-primary/50 transition-all cursor-pointer group relative"
            onClick={() => navigate('/trading-tools')}
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src="https://picsum.photos/id/180/800/400" 
                alt="Trading Tools" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Our Proprietary Trading Tools and System</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Learn how to use our proprietary trading tools and systems designed to identify high-probability trade setups and manage risk effectively.
              </p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  12 videos
                </div>
                <div className="text-xs text-muted-foreground">
                  6 hours total
                </div>
              </div>
            </div>
          </div>
          
          {/* Personal Education Focus */}
          <div 
            className="bg-card/60 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-primary/50 transition-all cursor-pointer group relative"
            onClick={() => navigate('/personal-education')}
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src="https://picsum.photos/id/0/800/400" 
                alt="Personal Education" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Personal Education Focus</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Tailored educational content to address your specific trading goals, strengths, and weaknesses with personalized guidance from expert mentors.
              </p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Personalized curriculum
                </div>
                <div className="text-xs text-muted-foreground">
                  1-on-1 mentoring
                </div>
              </div>
            </div>
          </div>
          
          {/* Tests, Certificates and Challenges */}
          <div 
            className="bg-card/60 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-primary/50 transition-all cursor-pointer group relative"
            onClick={() => navigate('/certificates')}
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src="https://picsum.photos/id/160/800/400" 
                alt="Certificates and Challenges" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Tests, Certificates and Challenges</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Validate your trading knowledge with our certification program and participate in funded trader challenges to access proprietary capital.
              </p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  8 certifications
                </div>
                <div className="text-xs text-muted-foreground">
                  $250K funding challenge
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}