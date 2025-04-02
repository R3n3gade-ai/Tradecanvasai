"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, Activity, LineChart, PieChart, TrendingUp, Settings, Calendar, Search, Brain } from "lucide-react";
import { useDashboardStore } from "../utils/store";
import { DashboardLayout } from "../components/DashboardLayout";
import { MiniChart } from "../components/MiniChart";
import { PercentageChange } from "../components/PercentageChange";
import { WatchlistCard } from "../components/WatchlistCard";
import { MarketNewsCard } from "../components/MarketNewsCard";
import { MarketCapTable } from "../components/MarketCapTable";
import { StockDetailModal } from "../components/StockDetailModal";
import { TedsBrainContainer2 } from "../components/TedsBrainContainer2";
import { TedsBrainDashboardTool } from "../components/TedsBrainDashboardTool";
import { formatCurrency, formatMarketCap } from "../utils/formatters";

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    divergenceScans, 
    topByMarketCap, 
    sectors, 
    portfolio, 
    watchlists, 
    tools,
    news,
    selectedStock,
    toggleWatchlistExpand,
    removeStockFromWatchlist,
    sidebarOpen,
    toggleSidebar,
    setSelectedStock,
    refreshData
  } = useDashboardStore();
  return (
    <DashboardLayout showRefresh={true}>
          {/* User Profile Section */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            <div className="col-span-12 flex flex-col lg:flex-row items-start lg:items-center justify-between bg-card/50 rounded-lg p-4 border border-white/10">
              {/* User profile information */}
              <div className="flex-1 flex flex-col lg:flex-row items-start gap-4">
                {/* Profile image - Updated to match NFT size */}
                <div className="flex flex-col items-center">
                  <div className="relative group w-40 h-40 rounded-lg border border-white/20 bg-background/80 overflow-hidden flex items-center justify-center">
                    <img 
                      src="https://static.databutton.com/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/piclumen-1741397201580.png" 
                      alt="User profile" 
                      className="h-full w-full object-cover"
                    />
                    <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 text-xs text-white">
                      Edit Photo
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">NFT</p>
                </div>
                
                {/* User information */}
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">TradingMaster42</h2>
                    <div className="text-xs inline-flex items-center bg-primary/10 text-primary px-2 py-1 rounded">
                      Advanced Trader
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 max-w-lg">
                    Day trader focusing on tech & energy sectors. 5 years experience in options trading. Following momentum strategies with risk management focus.
                  </p>
                  <div className="flex gap-3 text-xs">
                    <button className="text-primary hover:underline">Edit Profile</button>
                    <button className="text-primary hover:underline">Manage Status</button>
                    <button className="text-primary hover:underline">Settings</button>
                  </div>
                </div>
              </div>
              
              {/* Right side of profile - Left blank for now */}
              <div className="hidden lg:block lg:w-40"></div>
            </div>
          </div>

          {/* Ted's Brain Container - Moved up right after user profile */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            <div className="col-span-12">
              <TedsBrainContainer2 />
            </div>
          </div>
          
          {/* Dashboard content */}
          <div className="grid grid-cols-12 gap-6">
            {/* Most traded section - 9 columns wide */}
            <div className="col-span-12 lg:col-span-9">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Divergence Scans</h2>
                <a href="#" className="text-xs text-primary">See all</a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {divergenceScans.map(stock => (
                  <div 
                    key={stock.id} 
                    className="bg-card rounded-lg p-4 border border-white/10 hover:border-primary/50 transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedStock(stock)}
                  >
                    <div className="flex justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{stock.symbol}</h3>
                        <p className="text-xs text-muted-foreground">{stock.name}</p>
                      </div>
                      <PercentageChange value={stock.changePercent} />
                    </div>
                    
                    {/* Chart image or fallback */}
                    <div className="relative w-full aspect-video mb-2 bg-background/50 rounded overflow-hidden flex items-center justify-center">
                      {stock.imageUrl ? (
                        <img 
                          src={stock.imageUrl} 
                          alt={`${stock.symbol} divergence scan`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center">
                          <div className="w-full h-20">
                            <MiniChart 
                              data={stock.chartData} 
                              width={210} 
                              height={80} 
                              trend={stock.changePercent > 0 ? 'up' : 'down'}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Chart image pending</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Stock information row */}
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium">{formatCurrency(stock.price)}</p>
                      <p className="text-xs text-muted-foreground">Vol: {(stock.volume / 1000).toFixed(1)}K</p>
                    </div>
                    
                    {/* Divergence description */}
                    <p className="text-xs bg-background/50 p-1.5 rounded text-muted-foreground/70">{stock.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Your investments section - 3 columns wide */}
            <div className="col-span-12 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Investments</h2>
                <a href="#" className="text-xs text-primary">Portfolio</a>
              </div>
              
              <div className="bg-card rounded-lg p-4 border border-white/10 h-[calc(100%-2rem)]">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold">{formatCurrency(portfolio.totalValue)}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs flex items-center">
                      <PercentageChange 
                        value={portfolio.dailyChangePercent} 
                        iconSize={3}
                      />
                      <span className="ml-1 text-muted-foreground">today</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(portfolio.dailyChange)}</p>
                  </div>
                </div>
                <div className="h-32 w-full mb-4">
                  <MiniChart 
                    data={portfolio.chartData.data} 
                    width={210} 
                    height={128} 
                    trend="up"
                    fillOpacity={0.1}
                    lineWidth={2}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  {portfolio.chartData.labels.map((label, index) => (
                    <button 
                      key={label}
                      className={`hover:text-foreground transition-colors ${index === 2 ? 'text-primary font-medium' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Products & Tools section */}
            <div className="col-span-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Products & Tools</h2>
                <a href="#" className="text-xs text-primary">See all</a>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {tools.map(tool => {
                  // Dynamically render the icon based on the name in the tool object
                  const IconComponent = {
                    'BarChart2': BarChart2,
                    'Activity': Activity,
                    'LineChart': LineChart,
                    'TrendingUp': TrendingUp,
                    'PieChart': PieChart,
                    'Settings': Settings,
                    'Calendar': Calendar,
                    'Search': Search,
                    'Brain': Brain,
                  }[tool.icon] || Activity;
                  
                  return (
                    <div 
                      key={tool.id}
                      className="bg-card hover:bg-card/80 rounded-lg p-4 border border-white/10 text-center transition-colors cursor-pointer"
                      title={tool.description}
                    >
                      <div className="bg-background h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium">{tool.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar and Trade Journal - Placeholder */}
            <div className="col-span-12">
              <div className="bg-card rounded-lg p-4 border border-white/10">
                <div className="flex items-center mb-4">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-semibold">Trading Calendar</h3>
                </div>
                <p className="text-sm text-muted-foreground">Calendar content will be implemented in a future update.</p>
              </div>
            </div>


          </div>
      {/* Stock Detail Modal */}
      {selectedStock && (
        <StockDetailModal 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </DashboardLayout>
  );
}
