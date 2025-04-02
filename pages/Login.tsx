"use client";

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TrendingUp, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useUserStore } from "../utils/userStore";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useUserStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto">
        {/* Logo */}
        <div className="flex justify-center items-center mb-8">
          <TrendingUp className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold">MarketPulse</h1>
        </div>
        
        <div className="bg-card rounded-xl border border-white/10 shadow-lg p-8">
          <h2 className="text-xl font-bold mb-6 text-center">Log in to your account</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md bg-background border border-white/10 focus:outline-none focus:border-primary transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            
            {/* Password field */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-md bg-background border border-white/10 focus:outline-none focus:border-primary transition-colors"
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors disabled:opacity-70 flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </button>
            
            {/* Demo credentials */}
            <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">Demo credentials:</p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                <strong>Email:</strong> demo@marketpulse.com<br />
                <strong>Password:</strong> demo123
              </p>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>© 2025 MarketPulse. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;