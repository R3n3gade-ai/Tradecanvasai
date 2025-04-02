import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Search, Info, ArrowUpDown, Zap, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardStore } from "../utils/store";
import { AddToBrain } from "../components/AddToBrain";
import brain from "../brain";
import { toast } from "sonner";

// Types for dark pool data
type DarkPoolTrade = {
  id: number;
  time: string;
  date: string;
  symbol: string;
  shares: string;
  price: string;
  value: string;
  type: string;
};

type PriceLevel = {
  price: string;
  volume: string;
  notional: string;
  percentage: string;
  spread: string;
  isHighlighted: boolean;
};

type DarkPoolLevels = {
  ticker: string;
  price: string;
  change: string;
  changePercent: string;
  avgDailyVolume: string;
  date: string;
  levels: PriceLevel[];
};

// Fallback data for dark pool trades in case the API fails
const fallbackDarkPoolData: DarkPoolTrade[] = [
  { 
    id: 1, 
    time: "10:41:10", 
    date: "03/06/25",
    symbol: "AAPL", 
    shares: "703,000", 
    price: "$142.42", 
    value: "$100M",
    type: "BLOCK"
  },
  { 
    id: 2, 
    time: "10:39:27", 
    date: "03/06/25",
    symbol: "AAPL", 
    shares: "153,000", 
    price: "$142.40", 
    value: "$22M",
    type: "DARK"
  },
  { 
    id: 3, 
    time: "10:35:52", 
    date: "03/06/25",
    symbol: "AAPL", 
    shares: "532,000", 
    price: "$142.38", 
    value: "$76M",
    type: "BLOCK"
  },
  { 
    id: 4, 
    time: "10:33:18", 
    date: "03/06/25",
    symbol: "AAPL", 
    shares: "215,000", 
    price: "$142.42", 
    value: "$31M",
    type: "DARK"
  },
  { 
    id: 5, 
    time: "10:31:04", 
    date: "03/06/25",
    symbol: "MSFT", 
    shares: "300,000", 
    price: "$410.30", 
    value: "$123M",
    type: "BLOCK"
  },
  { 
    id: 6, 
    time: "10:29:42", 
    date: "03/06/25",
    symbol: "AAPL", 
    shares: "265,000", 
    price: "$142.40", 
    value: "$38M",
    type: "DARK"
  },
  { 
    id: 7, 
    time: "10:28:15", 
    date: "03/06/25",
    symbol: "AMZN", 
    shares: "145,000", 
    price: "$178.52", 
    value: "$26M",
    type: "BLOCK"
  },
  { 
    id: 8, 
    time: "10:26:33", 
    date: "03/06/25",
    symbol: "AAPL", 
    shares: "180,000", 
    price: "$142.38", 
    value: "$26M",
    type: "DARK"
  },
  { 
    id: 9, 
    time: "10:23:14", 
    date: "03/06/25",
    symbol: "TSLA", 
    shares: "245,000", 
    price: "$175.43", 
    value: "$43M",
    type: "BLOCK"
  },
  { 
    id: 10, 
    time: "10:21:50", 
    date: "03/06/25",
    symbol: "AAPL", 
    shares: "195,000", 
    price: "$142.35", 
    value: "$28M",
    type: "DARK"
  },
  { 
    id: 11, 
    time: "10:18:29", 
    date: "03/06/25",
    symbol: "META", 
    shares: "120,000", 
    price: "$485.75", 
    value: "$58M",
    type: "BLOCK"
  },
  { 
    id: 12, 
    time: "10:15:12", 
    date: "03/06/25",
    symbol: "AAPL", 
    shares: "225,000", 
    price: "$142.32", 
    value: "$32M",
    type: "DARK"
  },
];

// Fallback data for price levels in case the API fails
const fallbackPriceLevelsData: DarkPoolLevels = {
  ticker: "AAPL",
  price: "$147.93",
  change: "+$1.29",
  changePercent: "+0.88%",
  avgDailyVolume: "83,895,811",
  date: "03/06/25",
  levels: [
    {
      price: "148.75",
      volume: "3,918,400",
      notional: "$583M",
      percentage: "8.75%",
      spread: "33",
      isHighlighted: false
    },
    {
      price: "147.83",
      volume: "3,000,000",
      notional: "$513M",
      percentage: "6.25%",
      spread: "30",
      isHighlighted: false
    },
    {
      price: "147.11",
      volume: "4,150,800",
      notional: "$610M",
      percentage: "8.56%",
      spread: "41",
      isHighlighted: false
    },
    {
      price: "146.27",
      volume: "3,600,000",
      notional: "$527M",
      percentage: "6.28%",
      spread: "30",
      isHighlighted: false
    },
    {
      price: "145.42",
      volume: "5,300,000",
      notional: "$844M",
      percentage: "11.52%",
      spread: "53",
      isHighlighted: true
    },
    {
      price: "145.07",
      volume: "2,520,000",
      notional: "$394M",
      percentage: "5.27%",
      spread: "25",
      isHighlighted: false
    },
    {
      price: "140.27",
      volume: "2,430,000",
      notional: "$341M",
      percentage: "5.25%",
      spread: "26",
      isHighlighted: false
    },
    {
      price: "144.18",
      volume: "2,070,000",
      notional: "$457M",
      percentage: "5.37%",
      spread: "30",
      isHighlighted: false
    },
    {
      price: "144.36",
      volume: "2,560,000",
      notional: "$577M",
      percentage: "6.27%",
      spread: "25",
      isHighlighted: false
    },
    {
      price: "143.79",
      volume: "3,980,000",
      notional: "$572M",
      percentage: "8.63%",
      spread: "37",
      isHighlighted: true
    },
    {
      price: "143.87",
      volume: "2,750,000",
      notional: "$434M",
      percentage: "4.23%",
      spread: "30",
      isHighlighted: false
    },
    {
      price: "143.64",
      volume: "2,510,000",
      notional: "$364M",
      percentage: "5.22%",
      spread: "25",
      isHighlighted: false
    },
    {
      price: "143.02",
      volume: "2,540,000",
      notional: "$364M",
      percentage: "5.22%",
      spread: "25",
      isHighlighted: false
    },
    {
      price: "142.77",
      volume: "4,980,000",
      notional: "$710M",
      percentage: "10.23%",
      spread: "48",
      isHighlighted: true
    },
  ]
};

export default function DarkPool() {
  const navigate = useNavigate();
  const { sidebarOpen } = useDashboardStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicker, setSelectedTicker] = useState("ALL"); // Default to ALL tickers view
  
  // State for dark pool data
  const [darkPoolData, setDarkPoolData] = useState<DarkPoolTrade[]>([]);
  const [priceLevelsData, setPriceLevelsData] = useState<DarkPoolLevels | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 50 items per page as requested
  const [displayData, setDisplayData] = useState<DarkPoolTrade[]>(fallbackDarkPoolData);
  
  // Price levels pagination
  const [currentLevelsPage, setCurrentLevelsPage] = useState(1);
  const [levelsPerPage] = useState(50); // Show 50 items per page as requested
  const [displayLevels, setDisplayLevels] = useState<PriceLevel[]>([]);
  
  
  // Filter options
  const [showDarkPool, setShowDarkPool] = useState(true);
  const [showBlockTrades, setShowBlockTrades] = useState(true);
  const [minValue, setMinValue] = useState(0); // Minimum value in dollars
  const [maxValue, setMaxValue] = useState(0); // Maximum value in dollars (0 means no limit)
  const [minShares, setMinShares] = useState(0); // Minimum shares
  const [maxShares, setMaxShares] = useState(0); // Maximum shares (0 means no limit)
  const [lookbackDays, setLookbackDays] = useState(7); // Lookback period in days (default: 7 days)
  
  // Filter data based on search term and update display data
  useEffect(() => {
    let filtered = darkPoolData;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply other filters
    filtered = filtered.filter(item => {
      // Filter by value
      if (minValue > 0) {
        const valueNum = parseFloat(item.value.replace(/[^0-9.]/g, ''));
        const multiplier = item.value.includes('M') ? 1000000 : 
                          item.value.includes('K') ? 1000 : 
                          item.value.includes('B') ? 1000000000 : 1;
        const actualValue = valueNum * multiplier;
        if (actualValue < minValue) return false;
      }
      
      if (maxValue > 0) {
        const valueNum = parseFloat(item.value.replace(/[^0-9.]/g, ''));
        const multiplier = item.value.includes('M') ? 1000000 : 
                          item.value.includes('K') ? 1000 : 
                          item.value.includes('B') ? 1000000000 : 1;
        const actualValue = valueNum * multiplier;
        if (actualValue > maxValue) return false;
      }
      
      // Filter by shares
      if (minShares > 0) {
        const sharesNum = parseInt(item.shares.replace(/[^0-9]/g, ''));
        if (sharesNum < minShares) return false;
      }
      
      if (maxShares > 0) {
        const sharesNum = parseInt(item.shares.replace(/[^0-9]/g, ''));
        if (sharesNum > maxShares) return false;
      }
      
      return true;
    });
    
    // Update display data with pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // If no data yet, use fallback
    if (filtered.length === 0 && darkPoolData.length === 0) {
      setDisplayData(fallbackDarkPoolData.slice(startIndex, endIndex));
    } else {
      setDisplayData(filtered.slice(startIndex, endIndex));
    }
  }, [darkPoolData, searchTerm, minValue, maxValue, minShares, maxShares, currentPage, itemsPerPage]);
  
  // Update price levels pagination when priceLevelsData changes
  useEffect(() => {
    if (priceLevelsData && priceLevelsData.levels) {
      // Calculate start and end index for pagination
      const startIndex = (currentLevelsPage - 1) * levelsPerPage;
      const endIndex = startIndex + levelsPerPage;
      
      // Update display levels with pagination
      setDisplayLevels(priceLevelsData.levels.slice(startIndex, endIndex));
    } else {
      setDisplayLevels([]);
    }
  }, [priceLevelsData, currentLevelsPage, levelsPerPage]);
  
  // Function to fetch dark pool data
  const fetchDarkPoolData = useCallback(async () => {
    if (!selectedTicker) return;
    
    setIsLoading(true);
    try {
      const response = await brain.get_dark_pool_trades({
        symbol: selectedTicker,
        show_dark_pool: showDarkPool,
        show_block_trades: showBlockTrades,
        min_value: minValue,
        lookback_days: lookbackDays
      });
      
      const data = await response.json();
      if (data.trades) {
        setDarkPoolData(data.trades);
      } else {
        // If API returns empty data or error, use fallback data
        // For ALL tickers view, use all fallback data
        if (selectedTicker === "ALL") {
          setDarkPoolData(fallbackDarkPoolData);
        } else {
          // Filter fallback data for specific ticker
          const filteredFallback = fallbackDarkPoolData.filter(item => 
            item.symbol === selectedTicker
          );
          setDarkPoolData(filteredFallback.length ? filteredFallback : fallbackDarkPoolData);
        }
      }
      
      // For price levels data, we want to maintain a specific symbol even when ALL is selected
      if (data.levels) {
        // If we receive levels data from API with ticker "ALL", replace with a default "AAPL"
        if (data.levels.ticker === "ALL") {
          setPriceLevelsData({
            ...data.levels,
            ticker: "AAPL"
          });
        } else {
          setPriceLevelsData(data.levels);
        }
      } else {
        // If ALL is selected but no levels data, default to AAPL or last valid symbol
        if (selectedTicker === "ALL") {
          // Maintain previous symbol if available, otherwise default to AAPL
          setPriceLevelsData(prevLevels => {
            if (prevLevels && prevLevels.ticker !== "ALL") {
              return prevLevels; // Keep previous symbol's data
            } else {
              return fallbackPriceLevelsData; // Default to AAPL
            }
          });
        } else {
          // Update with the specific selected ticker
          setPriceLevelsData(fallbackPriceLevelsData);
        }
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dark pool data:", error);
      toast.error("Failed to fetch dark pool data");
      setDarkPoolData(fallbackDarkPoolData);
      setPriceLevelsData(fallbackPriceLevelsData);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTicker, showDarkPool, showBlockTrades, minValue, lookbackDays]);
  
  // Load data on initial render and when ticker changes
  useEffect(() => {
    fetchDarkPoolData();
    
    // Set up refresh interval (every 60 seconds)
    const intervalId = setInterval(() => {
      fetchDarkPoolData();
    }, 60000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchDarkPoolData]);

  const handleSearch = () => {
    if (searchTerm) {
      setSelectedTicker(searchTerm.toUpperCase());
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header with back button */}
      <div className="p-4 border-b border-white/10">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center text-primary hover:underline"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Dark Pool Activity</h1>
          <p className="text-muted-foreground mb-6">
            Track institutional-only volume through dark pools and block trades. These trades are not visible on regular exchanges.
          </p>
          
          {/* Search and filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Enter symbol (e.g. AAPL)" 
                className="w-full pl-10 pr-4 py-2 rounded-md bg-card border border-white/10 focus:outline-none focus:border-primary transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={handleSearch}
                className="px-4 py-2 bg-primary text-background rounded-md hover:bg-primary/90 transition-colors"
              >
                View Levels
              </button>
              
              <button 
                onClick={() => fetchDarkPoolData()}
                className="px-4 py-2 bg-background border border-white/10 rounded-md hover:bg-white/5 transition-colors flex items-center gap-1.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </span>
                ) : (
                  "Refresh Data"
                )}
              </button>
            </div>
            
            <button 
              className="px-4 py-2 bg-indigo-900/30 text-indigo-400 border border-indigo-700/40 rounded flex items-center gap-1.5 hover:bg-indigo-800/40 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                const content = `Dark Pool data for ${selectedTicker} showing institutional-only volume through dark pools and block trades.`;
                document.querySelector('[data-add-to-brain]')?.click();
              }}
            >
              <Brain className="h-4 w-4" />
              Add to Ted's Brain
            </button>
            <div className="hidden">
              <AddToBrain
                content={`Dark Pool data for ${selectedTicker} showing institutional-only volume through dark pools and block trades.`}
                source="dark-pool-data"
                metadata={{ symbol: selectedTicker }}
                data-add-to-brain
              />
            </div>
          </div>
        </div>
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Dark Pool Trades */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-white/10 overflow-hidden flex flex-col h-[700px]" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
                <div>
                  <h2 className="text-lg font-semibold">Dark Pool & Block Trades</h2>
                  {lastUpdated && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showDarkPool}
                        onChange={(e) => setShowDarkPool(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="ml-1.5 text-muted-foreground">Dark Pool</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBlockTrades}
                        onChange={(e) => setShowBlockTrades(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="ml-1.5 text-muted-foreground">Block Trades</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Advanced Filters Section */}
              <div className="p-4 bg-background/40 border-b border-white/10">
                <div className="flex flex-wrap gap-4">
                  {/* Trade Type Filters */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-muted-foreground">Type:</div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showDarkPool}
                          onChange={(e) => setShowDarkPool(e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="ml-1.5 text-xs">Dark Pool</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showBlockTrades}
                          onChange={(e) => setShowBlockTrades(e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="ml-1.5 text-xs">Block Trades</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Value Range Filter */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-muted-foreground">Value ($):</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        min="0"
                        value={minValue || ''}
                        onChange={(e) => setMinValue(parseInt(e.target.value) || 0)}
                        className="w-16 h-7 px-2 py-1 text-xs rounded-md bg-card border border-white/10 focus:outline-none focus:border-primary transition-colors"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        min="0"
                        value={maxValue || ''}
                        onChange={(e) => setMaxValue(parseInt(e.target.value) || 0)}
                        className="w-16 h-7 px-2 py-1 text-xs rounded-md bg-card border border-white/10 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  
                  {/* Shares Range Filter */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-muted-foreground">Shares:</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        min="0"
                        value={minShares || ''}
                        onChange={(e) => setMinShares(parseInt(e.target.value) || 0)}
                        className="w-16 h-7 px-2 py-1 text-xs rounded-md bg-card border border-white/10 focus:outline-none focus:border-primary transition-colors"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        min="0"
                        value={maxShares || ''}
                        onChange={(e) => setMaxShares(parseInt(e.target.value) || 0)}
                        className="w-16 h-7 px-2 py-1 text-xs rounded-md bg-card border border-white/10 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  
                  {/* Lookback Period Filter */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-muted-foreground">Lookback:</div>
                    <select
                      value={lookbackDays}
                      onChange={(e) => setLookbackDays(parseInt(e.target.value))}
                      className="h-7 px-2 py-1 text-xs rounded-md bg-card border border-white/10 focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="1">Today only</option>
                      <option value="3">Last 3 days</option>
                      <option value="5">Last 5 days</option>
                      <option value="7">Last week</option>
                      <option value="14">Last 2 weeks</option>
                      <option value="30">Last month</option>
                    </select>
                  </div>
                  
                  {/* Apply Filters Button */}
                  <button
                    onClick={() => fetchDarkPoolData()}
                    className="h-7 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Apply Filters
                  </button>
                  
                  {/* ALL Tickers Button */}
                  <button
                    onClick={() => {
                      setSelectedTicker("ALL");
                      // Don't update the search term when selecting ALL
                      // This helps keep the right panel focused on a specific symbol
                      fetchDarkPoolData();
                    }}
                    className={`h-7 px-3 py-1 text-xs rounded-md transition-colors ${selectedTicker === "ALL" ? 'bg-green-600 text-white' : 'bg-background/50 border border-white/10 hover:bg-background/80'}`}
                  >
                    ALL
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto flex-grow overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background/50">
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Symbol</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Shares</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.map((item) => {
                      // Parse the value to determine if it's a high-value trade (over $100M)
                      const valueString = item.value;
                      const numericValue = parseFloat(valueString.replace(/[^0-9.]/g, ''));
                      const isMillions = valueString.includes('M');
                      const isBillions = valueString.includes('B');
                      
                      // Calculate actual value in millions
                      const valueInMillions = isMillions ? numericValue : 
                                             isBillions ? numericValue * 1000 : 
                                             numericValue / 1000000;
                      
                      // Flag for high-value trades (over $100M)
                      const isHighValueTrade = valueInMillions >= 100;
                      
                      return (
                        <tr 
                          key={item.id} 
                          className={`border-b border-white/5 ${isHighValueTrade ? 'bg-yellow-950/30 hover:bg-yellow-900/20' : 'hover:bg-background/30'} transition-colors`}
                        >
                          <td className="px-4 py-2 text-muted-foreground">{item.time}</td>
                          <td className="px-4 py-2 text-muted-foreground">{item.date}</td>
                          <td 
                            className="px-4 py-2 font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => {
                              setSelectedTicker(item.symbol);
                              setSearchTerm(item.symbol);
                            }}
                          >
                            {item.symbol}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{item.shares}</td>
                          <td className="px-4 py-2 text-muted-foreground">{item.price}</td>
                          <td className={`px-4 py-2 font-medium ${isHighValueTrade ? 'text-yellow-400' : ''}`}>{item.value}</td>
                          <td className="px-4 py-2">
                            <span 
                              className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'DARK' ? 'bg-primary/20 text-primary' : 'bg-purple-500/20 text-purple-400'}`}
                            >
                              {item.type}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination controls for dark pool trades */}
              <div className="flex justify-center items-center p-4 border-t border-white/10 flex-shrink-0 bg-background/10">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded border border-white/10 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {/* Page numbers */}
                    {(() => {
                      const totalPages = Math.ceil((darkPoolData.length || fallbackDarkPoolData.length) / itemsPerPage);
                      let pageButtons = [];
                      
                      // Logic for which page buttons to show
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, startPage + 4);
                      
                      // Adjust startPage if we're near the end
                      if (endPage - startPage < 4) {
                        startPage = Math.max(1, endPage - 4);
                      }
                      
                      // Add page buttons
                      for (let i = startPage; i <= endPage; i++) {
                        pageButtons.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`px-3 py-2 rounded ${i === currentPage ? 'bg-primary text-white' : 'border border-white/10 hover:bg-white/5'}`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      return pageButtons;
                    })()} 
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil((darkPoolData.length || fallbackDarkPoolData.length) / itemsPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil((darkPoolData.length || fallbackDarkPoolData.length) / itemsPerPage)}
                      className={`px-3 py-2 rounded border border-white/10 ${currentPage === Math.ceil((darkPoolData.length || fallbackDarkPoolData.length) / itemsPerPage) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
              </div>

            </div>
            
            {/* Pagination outside the container - removing this */}

            
            {/* Dark Pool Information Card */}
            <div className="bg-card rounded-lg p-5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">About Dark Pools</h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Dark pools are private exchanges where financial assets and securities are traded and matched. Unlike traditional exchanges, dark pools are not accessible to the investing public.
                </p>
                <div className="flex items-start gap-3">
                  <div className="min-w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Institutional Trading</h4>
                    <p>Dark pools are used by large institutions to buy and sell large blocks of securities without impacting the market price.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="min-w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Price Levels</h4>
                    <p>Price levels show where institutional traders are accumulating or distributing shares at specific prices.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="min-w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Market Intelligence</h4>
                    <p>Analyzing dark pool activity can provide insights into institutional sentiment and potential price movements.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Price Levels */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-white/10 overflow-hidden flex flex-col h-[700px]">
              <div className="p-4 border-b border-white/10 bg-indigo-900/20 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-bold">{priceLevelsData?.ticker === "ALL" ? "AAPL" : priceLevelsData?.ticker || "AAPL"}</h2>
                    <span className="text-sm text-muted-foreground">{priceLevelsData?.date || ""}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{priceLevelsData?.price || "$0.00"}</div>
                    <div className="text-sm text-green-500">{priceLevelsData?.change || "$0.00"} ({priceLevelsData?.changePercent || "0.00%"})</div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  AVG DAILY VOLUME: <span className="text-foreground">{priceLevelsData?.avgDailyVolume || "0"}</span>
                </div>
              </div>
              
              {/* Price Levels Table */}
              <div className="overflow-x-auto flex-grow overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background/80">
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left font-medium">LEVEL <ArrowUpDown className="inline h-3 w-3 ml-1" /></th>
                      <th className="px-4 py-3 text-left font-medium">VOLUME</th>
                      <th className="px-4 py-3 text-left font-medium">NOTIONAL VALUE</th>
                      <th className="px-4 py-3 text-left font-medium">% OF VOL</th>
                      <th className="px-4 py-3 text-left font-medium">SPREAD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(displayLevels || []).map((level, index) => (
                      <tr 
                        key={index} 
                        className={`border-b border-white/5 transition-colors ${level.isHighlighted ? 'bg-indigo-900/30' : 'hover:bg-background/30'}`}
                      >
                        <td className="px-4 py-3 font-medium">${level.price}</td>
                        <td className="px-4 py-3 text-muted-foreground">{level.volume}</td>
                        <td className="px-4 py-3 font-medium">{level.notional}</td>
                        <td className="px-4 py-3 text-muted-foreground">{level.percentage}</td>
                        <td className="px-4 py-3 text-muted-foreground">{level.spread}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination for Price Levels */}
              {priceLevelsData && priceLevelsData.levels && priceLevelsData.levels.length > levelsPerPage && (
                <div className="flex justify-center items-center p-4 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentLevelsPage(prev => Math.max(1, prev - 1))}
                      disabled={currentLevelsPage === 1}
                      className={`px-3 py-2 rounded border border-white/10 ${currentLevelsPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {/* Page numbers for levels */}
                    {(() => {
                      const totalPages = Math.ceil((priceLevelsData?.levels?.length || 0) / levelsPerPage);
                      let pageButtons = [];
                      
                      // Logic for which page buttons to show
                      let startPage = Math.max(1, currentLevelsPage - 2);
                      let endPage = Math.min(totalPages, startPage + 4);
                      
                      // Adjust startPage if we're near the end
                      if (endPage - startPage < 4) {
                        startPage = Math.max(1, endPage - 4);
                      }
                      
                      // Add page buttons
                      for (let i = startPage; i <= endPage; i++) {
                        pageButtons.push(
                          <button
                            key={i}
                            onClick={() => setCurrentLevelsPage(i)}
                            className={`px-3 py-2 rounded ${i === currentLevelsPage ? 'bg-primary text-white' : 'border border-white/10 hover:bg-white/5'}`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      return pageButtons;
                    })()} 
                    
                    <button
                      onClick={() => setCurrentLevelsPage(prev => Math.min(Math.ceil((priceLevelsData?.levels?.length || 0) / levelsPerPage), prev + 1))}
                      disabled={currentLevelsPage === Math.ceil((priceLevelsData?.levels?.length || 0) / levelsPerPage)}
                      className={`px-3 py-2 rounded border border-white/10 ${currentLevelsPage === Math.ceil((priceLevelsData?.levels?.length || 0) / levelsPerPage) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Price Levels Information */}
            <div className="bg-card rounded-lg p-5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Understanding Price Levels</h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Price levels aggregate institutional-only volume by price points where trades have executed. Over time, levels grow and new levels are created.
                </p>
                <div className="flex items-start gap-3">
                  <div className="min-w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Zap className="h-3 w-3 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Highlighted Levels</h4>
                    <p>Purple highlighted levels indicate significant institutional interest, potentially acting as support or resistance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="min-w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Zap className="h-3 w-3 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Volume Concentration</h4>
                    <p>Higher percentages indicate price levels where institutions have concentrated their trading activity.</p>
                  </div>
                </div>
                <p className="text-xs mt-2">
                  Available for over 5,000 symbols across US equities markets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
