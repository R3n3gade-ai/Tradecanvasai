"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, ChevronRight, Search, User, X } from "lucide-react";

export default function Blog() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Mock blog/newsletter data
  const blogPosts = [
    {
      id: 1,
      title: "Weekly Market Analysis: Tech Surge Amid Interest Rate Concerns",
      excerpt: "Our detailed breakdown of this week's market movements, focusing on the tech sector's surprising resilience despite rising concerns about potential interest rate hikes.",
      category: "market-analysis",
      type: "newsletter",
      date: "March 18, 2025",
      author: "Sarah Johnson",
      image: "https://picsum.photos/id/1/600/400",
      featured: true
    },
    {
      id: 2,
      title: "Options Trading Strategy for Volatile Markets",
      excerpt: "A comprehensive guide to implementing iron condor strategies in today's unpredictable market conditions. Learn how to profit regardless of market direction.",
      category: "strategy",
      type: "article",
      date: "March 15, 2025",
      author: "Michael Chen",
      image: "https://picsum.photos/id/20/600/400"
    },
    {
      id: 3,
      title: "AI Trading Insights: February Performance Review",
      excerpt: "Our AI trading system's performance analysis for February, with detailed metrics, winning trades, and areas for improvement in our algorithmic approach.",
      category: "ai-insights",
      type: "newsletter",
      date: "March 12, 2025",
      author: "Alex Rivera",
      image: "https://picsum.photos/id/61/600/400"
    },
    {
      id: 4,
      title: "Understanding Options Flow and Institutional Movement",
      excerpt: "Learn how to interpret options flow data to identify potential institutional activity and leverage this information in your trading decisions.",
      category: "education",
      type: "article",
      date: "March 10, 2025",
      author: "David Park",
      image: "https://picsum.photos/id/160/600/400"
    },
    {
      id: 5,
      title: "Sector Rotation Analysis: Energy on the Rise",
      excerpt: "Our detailed analysis of the ongoing sector rotation, with a focus on the emerging opportunities in the energy sector as global demand patterns shift.",
      category: "market-analysis",
      type: "newsletter",
      date: "March 5, 2025",
      author: "Elena Martinez",
      image: "https://picsum.photos/id/218/600/400"
    },
    {
      id: 6,
      title: "TED AI Feature Update: Enhanced Chart Pattern Recognition",
      excerpt: "Explore the latest updates to our TED AI system, including improved chart pattern recognition capabilities and backtesting results.",
      category: "product-updates",
      type: "article",
      date: "March 1, 2025",
      author: "Technical Team",
      image: "https://picsum.photos/id/180/600/400"
    }
  ];

  const categories = [
    { id: "all", name: "All Content" },
    { id: "newsletter", name: "Newsletters" },
    { id: "article", name: "Articles" },
    { id: "market-analysis", name: "Market Analysis" },
    { id: "strategy", name: "Trading Strategies" },
    { id: "education", name: "Education" },
    { id: "ai-insights", name: "AI Insights" },
    { id: "product-updates", name: "Product Updates" }
  ];

  // Filter posts based on search query and active filter
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === "all" || 
      post.category === activeFilter || 
      post.type === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const featuredPost = blogPosts.find(post => post.featured);

  return (
    <div className="min-h-screen bg-[#030822] text-foreground">
      {/* Header */}
      <header className="bg-[#030822] border-b border-white/10 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate("/")} 
              className="text-white/80 hover:text-white flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
              Blog & Newsletters
            </h1>
            <div className="w-20"></div> {/* Spacer for layout balance */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search articles and newsletters..."
              className="block w-full pl-10 pr-10 py-2 bg-black/30 border border-white/10 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-5 w-5 text-muted-foreground hover:text-white" />
              </button>
            )}
          </div>
          
          <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
            {categories.map(category => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${activeFilter === category.id 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' 
                  : 'bg-black/30 border border-white/10 text-white/70 hover:text-white'}`}
                onClick={() => setActiveFilter(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Article */}
        {featuredPost && (
          <div className="mb-12 bg-black/40 border border-white/10 rounded-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative h-64 md:h-auto overflow-hidden">
                <img 
                  src={featuredPost.image} 
                  alt={featuredPost.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-transparent to-transparent md:hidden"></div>
              </div>
              <div className="p-6 flex flex-col justify-center">
                <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-sm font-medium text-orange-400 mb-4">
                  Featured Newsletter
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">{featuredPost.title}</h2>
                <p className="text-white/70 mb-4">{featuredPost.excerpt}</p>
                <div className="flex items-center text-sm text-white/60 mb-4">
                  <User className="h-4 w-4 mr-1" />
                  <span className="mr-4">{featuredPost.author}</span>
                  <CalendarDays className="h-4 w-4 mr-1" />
                  <span>{featuredPost.date}</span>
                </div>
                <button className="self-start mt-2 inline-flex items-center text-orange-400 hover:text-orange-300">
                  Read Full Newsletter
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.filter(post => !post.featured).map(post => (
            <div key={post.id} className="bg-black/30 border border-white/10 rounded-xl overflow-hidden hover:border-orange-500/30 transition-all group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-0 right-0 m-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${post.type === 'newsletter' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {post.type === 'newsletter' ? 'Newsletter' : 'Article'}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold mb-3 line-clamp-2 group-hover:text-orange-400 transition-colors">{post.title}</h3>
                <p className="text-white/70 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 mb-2">No matching content found</div>
            <button 
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-8 border border-orange-500/20">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Subscribe to Our Weekly Newsletter</h3>
            <p className="text-white/70 mb-6">Get the latest market insights, trading strategies, and TED AI updates delivered directly to your inbox.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-4 py-2 bg-black/50 border border-white/20 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
              <button className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-medium px-6 py-2 rounded-md transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#030822] border-t border-white/10 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-white/50 text-sm">
          © 2025 Trade Canvas. All content is for informational purposes only.
        </div>
      </footer>
    </div>
  );
}
