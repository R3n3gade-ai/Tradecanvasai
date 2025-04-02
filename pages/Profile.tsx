"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { AuthProtection } from "../components/AuthProtection";
import { useUserStore, User, UserSettings } from "../utils/userStore";
import { useBrainStore } from "../utils/brainStore";
import { Save, Upload, RefreshCw } from "lucide-react";

const Profile: React.FC = () => {
  const { user, updateUserProfile, updateUserSettings } = useUserStore();
  const { getBrainStatus } = useBrainStore();
  
  const [form, setForm] = useState<{
    name: string;
    email: string;
    defaultTicker: string;
    notifications: boolean;
  }>({name: "", email: "", defaultTicker: "", notifications: false});
  
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brainStats, setBrainStats] = useState<{
    total_items: number;
    sources: Record<string, number>;
    last_added: string | null;
    size_kb: number;
  } | null>(null);
  
  // Load user data into form
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        defaultTicker: user.settings.defaultTicker,
        notifications: user.settings.notifications,
      });
    }
  }, [user]);
  
  // Load brain stats
  useEffect(() => {
    const loadBrainStats = async () => {
      if (user) {
        const stats = await getBrainStatus(user.id);
        setBrainStats(stats);
      }
    };
    
    loadBrainStats();
  }, [user, getBrainStatus]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Update profile info
    updateUserProfile({
      name: form.name,
    });
    
    // Update settings
    updateUserSettings({
      defaultTicker: form.defaultTicker,
      notifications: form.notifications,
    });
    
    // Show success message
    setSaved(true);
    setLoading(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };
  
  if (!user) return null;
  
  return (
    <AuthProtection>
      <DashboardLayout title="Profile & Settings">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Profile info */}
            <div className="md:col-span-2">
              <div className="bg-card border border-white/10 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-md bg-background border border-white/10 focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      disabled
                      className="w-full px-4 py-2 rounded-md bg-background/50 border border-white/10 text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="defaultTicker" className="block text-sm font-medium mb-1">Default Ticker</label>
                    <input
                      id="defaultTicker"
                      type="text"
                      value={form.defaultTicker}
                      onChange={(e) => setForm({...form, defaultTicker: e.target.value})}
                      className="w-full px-4 py-2 rounded-md bg-background border border-white/10 focus:outline-none focus:border-primary transition-colors"
                      placeholder="SPY"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.notifications}
                        onChange={(e) => setForm({...form, notifications: e.target.checked})}
                        className="mr-2 h-4 w-4 rounded border-white/10 text-primary focus:ring-primary focus:ring-opacity-50"
                      />
                      <span className="text-sm">Enable email notifications</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors flex items-center space-x-2 disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Save Changes
                        </>
                      )}
                    </button>
                    
                    {saved && (
                      <span className="ml-3 text-green-500 text-sm">Changes saved successfully!</span>
                    )}
                  </div>
                </form>
              </div>
              
              <div className="bg-card border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Subscription</h2>
                
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">
                        {user.subscription === 'free' ? 'Free Plan' : user.subscription === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.subscription === 'free' 
                          ? 'Basic trading tools and market data' 
                          : user.subscription === 'pro' 
                            ? 'Advanced analytics and real-time data'
                            : 'Full enterprise solution with custom integrations'
                        }
                      </p>
                    </div>
                    {user.subscription !== 'enterprise' && (
                      <button className="px-3 py-1 bg-primary hover:bg-primary/90 text-white text-sm rounded transition-colors">
                        {user.subscription === 'free' ? 'Upgrade' : 'Manage'}
                      </button>
                    )}
                  </div>
                </div>
                
                {user.subscription === 'free' && (
                  <div className="border border-white/10 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Upgrade to Pro</h3>
                    <ul className="text-sm space-y-2 mb-4">
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Real-time options flow data
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Advanced market scanners
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Unlimited AI chart analysis
                      </li>
                    </ul>
                    <button className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded transition-colors">
                      Upgrade Now - $49/month
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right column - Brain stats */}
            <div className="md:col-span-1">
              <div className="bg-card border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Your Brain</h2>
                  <button 
                    onClick={() => {
                      setBrainStats(null);
                      setTimeout(async () => {
                        if (user) {
                          const stats = await getBrainStatus(user.id);
                          setBrainStats(stats);
                        }
                      }, 500);
                    }}
                    className="p-1 rounded-md hover:bg-primary/10 transition-colors"
                    title="Refresh brain stats"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                
                {brainStats ? (
                  <div className="space-y-4">
                    <div className="bg-background/50 p-3 rounded-lg">
                      <div className="text-3xl font-bold">{brainStats.total_items}</div>
                      <div className="text-xs text-muted-foreground">Total items in your brain</div>
                    </div>
                    
                    {brainStats.last_added && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Last added</div>
                        <div className="text-sm">
                          {new Date(brainStats.last_added).toLocaleDateString()} at {new Date(brainStats.last_added).toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Storage used</div>
                      <div className="text-sm">{brainStats.size_kb.toFixed(1)} KB</div>
                    </div>
                    
                    {Object.keys(brainStats.sources).length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Items by source</div>
                        <div className="space-y-1.5">
                          {Object.entries(brainStats.sources).map(([source, count]) => (
                            <div key={source} className="flex justify-between items-center text-sm">
                              <span className="capitalize">{source}</span>
                              <span className="text-muted-foreground">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 flex justify-center items-center">
                    <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="bg-card border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3">Upload Profile Picture</h2>
                <div className="border-2 border-dashed border-white/10 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm mb-2">Drag and drop your image, or click to browse</p>
                  <p className="text-xs text-muted-foreground mb-4">JPG, PNG or GIF, max 2MB</p>
                  <button className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-sm rounded-md transition-colors">
                    Upload Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthProtection>
  );
};

export default Profile;