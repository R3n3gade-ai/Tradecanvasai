import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Loader2, Volume, VolumeX, Zap, ArrowDownAZ, ArrowDown01, Clock, DollarSign, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import brain from "brain";

interface OptionsFlowProps {
  symbol: string;
}

type FlowItem = {
  time: string;
  ticker: string;
  expiry: string;
  callPut: string;
  spot: string;
  strike: string;
  otm: string;
  price: string;
  size: number;
  openInterest: string;
  impliedVol: string;
  type: string;
  premium: string;
  sector: string;
  heatScore: number;
};

// Sample ticker choices for the ALL tickers view
const ALL_TICKERS = [
  "SPY", "QQQ", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD", 
  "JPM", "BAC", "WFC", "GS", "MS", "INTC", "NFLX", "DIS", "WMT", "XOM",
  "CVX", "JNJ", "PFE", "MRK", "UNH", "HD", "COST", "KO", "PEP", "V",
  "MA", "PYPL", "SQ", "UBER", "LYFT", "BABA", "JD", "PDD", "NIO", "SHOP"
];

export const OptionsFlow: React.FC<OptionsFlowProps> = ({ symbol }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allData, setAllData] = useState<FlowItem[]>([]);
  const [displayData, setDisplayData] = useState<FlowItem[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100); // Fixed at 100 items per page
  
  // Sort and filter state
  const [showAllTickers, setShowAllTickers] = useState(true); // Default to showing ALL tickers
  const [sortBy, setSortBy] = useState<'time' | 'premium' | null>('time'); // Default sort by time
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter state
  const [filters, setFilters] = useState({
    showCalls: true,
    showPuts: true,
    showSweeps: true,
    showBlocks: true,
    showOnlyHighPremium: false,
    minPremium: 0 // Default to show all options
  });

  // State for tracking when data was last refreshed
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch options flow data
  const fetchOptionsFlowData = async () => {
    try {
      setIsRefreshing(true);
      
      let allFlowData: FlowItem[] = [];
      
      // If showing all tickers, fetch data for multiple tickers
      if (showAllTickers || symbol === "ALL" || symbol === "ALL_TICKERS") {
        // Get data from a variety of tickers
        // For better performance, we'll fetch data for 8-10 tickers in parallel
        const tickersToFetch = ALL_TICKERS.sort(() => 0.5 - Math.random()).slice(0, 10);
        
        // Make sure the main symbol is included if it's not ALL_TICKERS
        if (symbol !== "ALL_TICKERS" && !tickersToFetch.includes(symbol)) {
          tickersToFetch[0] = symbol; // Replace first ticker with selected symbol
        }
        
        console.log("Fetching options flow data for tickers:", tickersToFetch);
        
        // Fetch data for all tickers in parallel
        const fetchPromises = tickersToFetch.map(ticker => {
          return brain.get_options_flow({
            symbol: ticker,
            min_premium: filters.showOnlyHighPremium ? 1000000 : filters.minPremium,
            show_calls: filters.showCalls,
            show_puts: filters.showPuts,
            show_sweeps: filters.showSweeps,
            show_blocks: filters.showBlocks
          });
        });
        
        // Wait for all requests to complete
        const responses = await Promise.all(fetchPromises);
        
        // Process all responses
        for (const response of responses) {
          try {
            const responseData = await response.json();
            if (!responseData.error && responseData.data) {
              allFlowData = [...allFlowData, ...responseData.data];
            }
          } catch (err) {
            console.error("Error processing ticker response:", err);
          }
        }
      } else {
        // Just fetch data for the selected symbol
        const response = await brain.get_options_flow({
          symbol: symbol,
          min_premium: filters.showOnlyHighPremium ? 1000000 : filters.minPremium,
          show_calls: filters.showCalls,
          show_puts: filters.showPuts,
          show_sweeps: filters.showSweeps,
          show_blocks: filters.showBlocks
        });

        const responseData = await response.json();
        
        if (responseData.error) {
          setError(responseData.error);
          allFlowData = [];
        } else {
          allFlowData = responseData.data || [];
        }
      }
      
      // Apply sorting if needed
      if (sortBy === 'time') {
        allFlowData = [...allFlowData].sort((a, b) => {
          // Convert time strings to comparable values (assuming format is HH:MM:SS)
          // For simplicity, we'll just compare the strings directly
          return sortDirection === 'desc' 
            ? b.time.localeCompare(a.time)
            : a.time.localeCompare(b.time);
        });
      } else if (sortBy === 'premium') {
        allFlowData = [...allFlowData].sort((a, b) => {
          // Convert premium strings ("1.2M", "500K", "200") to numeric values
          const getNumericPremium = (premium: string): number => {
            if (premium.includes('M')) {
              return parseFloat(premium.replace('M', '')) * 1000000;
            } else if (premium.includes('K')) {
              return parseFloat(premium.replace('K', '')) * 1000;
            } else {
              return parseFloat(premium);
            }
          };
          
          const premiumA = getNumericPremium(a.premium);
          const premiumB = getNumericPremium(b.premium);
          
          return sortDirection === 'desc'
            ? premiumB - premiumA
            : premiumA - premiumB;
        });
      }
      
      // Update state with all data
      console.log("Fetched options flow data:", allFlowData.length, "items");
      setAllData(allFlowData);
      setCurrentPage(1); // Reset to first page when data changes
      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error fetching options flow data:", err);
      setError("Failed to fetch options flow data. Please try again later.");
      setAllData([]);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };
  
  // Update display data whenever allData or pagination changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayData(allData.slice(startIndex, endIndex));
    
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  }, [allData, currentPage, itemsPerPage]);

  // Set up data fetching and refresh intervals
  useEffect(() => {
    // Initial data fetch
    fetchOptionsFlowData();

    console.log("Setting up options flow refresh interval");
    // Set up interval for refreshing data every 15 seconds for a more real-time experience
    const interval = setInterval(fetchOptionsFlowData, 15 * 1000); // 15 seconds
    setRefreshInterval(interval);

    // Clean up interval on component unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // Refresh data when filters change
  useEffect(() => {
    fetchOptionsFlowData();
  }, [filters.showCalls, filters.showPuts, filters.showSweeps, filters.showBlocks, filters.minPremium, filters.showOnlyHighPremium, showAllTickers, symbol, sortBy, sortDirection]);

  // Toggle sort column
  const toggleSort = (column: 'time' | 'premium') => {
    if (sortBy === column) {
      // If already sorting by this column, toggle direction
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      // Set new sort column 
      setSortBy(column);
      setSortDirection('desc'); // Default to desc (newest first or highest first)
    }
    // Apply the sort
    fetchOptionsFlowData();
  };
  
  // Toggle filter functions
  const toggleCallPut = (type: 'calls' | 'puts') => {
    setFilters(prev => ({
      ...prev,
      showCalls: type === 'calls' ? !prev.showCalls : prev.showCalls,
      showPuts: type === 'puts' ? !prev.showPuts : prev.showPuts
    }));
  };
  
  const toggleType = (type: 'sweeps' | 'blocks') => {
    setFilters(prev => ({
      ...prev,
      showSweeps: type === 'sweeps' ? !prev.showSweeps : prev.showSweeps,
      showBlocks: type === 'blocks' ? !prev.showBlocks : prev.showBlocks
    }));
  };
  
  const setPremiumFilter = (amount: number) => {
    setFilters(prev => ({
      ...prev,
      minPremium: amount
    }));
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-64 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-red-400">
        <p>{error}</p>
        <p className="text-sm text-gray-400 mt-2">Please try again later.</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* Filters */}
      <div className="flex justify-between items-center p-3 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-400">Filters:</div>
          <Badge 
            variant={filters.showCalls ? "default" : "outline"}
            className={`cursor-pointer hover:bg-blue-600/20 ${filters.showCalls ? 'bg-blue-600/80' : ''}`}
            onClick={() => toggleCallPut('calls')}
          >
            Calls
          </Badge>
          <Badge 
            variant={filters.showPuts ? "default" : "outline"}
            className={`cursor-pointer hover:bg-red-600/20 ${filters.showPuts ? 'bg-red-600/80' : ''}`}
            onClick={() => toggleCallPut('puts')}
          >
            Puts
          </Badge>
          <div className="mx-2 h-4 w-px bg-gray-700"></div>
          <Badge 
            variant={filters.showSweeps ? "default" : "outline"}
            className={`cursor-pointer ${filters.showSweeps ? 'bg-orange-600/80' : ''}`}
            onClick={() => toggleType('sweeps')}
          >
            Sweeps
          </Badge>
          <Badge 
            variant={filters.showBlocks ? "default" : "outline"}
            className={`cursor-pointer ${filters.showBlocks ? 'bg-purple-600/80' : ''}`}
            onClick={() => toggleType('blocks')}
          >
            Blocks
          </Badge>
          <div className="mx-2 h-4 w-px bg-gray-700"></div>
          <Badge 
            variant={showAllTickers ? "default" : "outline"}
            className={`cursor-pointer flex items-center ${showAllTickers ? 'bg-green-600/80' : ''}`}
            onClick={() => setShowAllTickers(!showAllTickers)}
          >
            <Tag className="w-3 h-3 mr-1" />
            ALL TICKERS
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-400">Min Premium:</div>
          <select 
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
            value={filters.minPremium}
            onChange={(e) => setPremiumFilter(Number(e.target.value))}
            disabled={filters.showOnlyHighPremium}
          >
            <option value={0}>All</option>
            <option value={10000}>$10K+</option>
            <option value={50000}>$50K+</option>
            <option value={100000}>$100K+</option>
            <option value={250000}>$250K+</option>
            <option value={500000}>$500K+</option>
            <option value={1000000}>$1M+</option>
          </select>
          <Badge 
            variant={filters.showOnlyHighPremium ? "default" : "outline"}
            className={`cursor-pointer ${filters.showOnlyHighPremium ? 'bg-yellow-600' : 'border-yellow-600/50 text-yellow-600/90'}`}
            onClick={() => setFilters(prev => ({
              ...prev,
              showOnlyHighPremium: !prev.showOnlyHighPremium,
              minPremium: prev.showOnlyHighPremium ? prev.minPremium : 1000000
            }))}
          >
            <Zap className="w-3 h-3 mr-1" />
            $1M+ Only
          </Badge>
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <Volume size={20} className="text-blue-400" />
          <h3 className="text-lg font-medium text-white">Realtime Option Flow</h3>
          {showAllTickers && (
            <Badge className="bg-green-600/80 ml-2">
              <Tag className="w-3 h-3 mr-1" />
              ALL TICKERS
            </Badge>
          )}
          {filters.showOnlyHighPremium && (
            <Badge className="bg-yellow-600 ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Premium $1M+
            </Badge>
          )}
          {isRefreshing && (
            <Loader2 size={16} className="animate-spin text-blue-400 ml-2" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          {lastRefreshed && (
            <span className="text-xs text-gray-400">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <Badge 
            className={`bg-gray-800 text-gray-300 cursor-pointer ${isRefreshing ? 'opacity-50' : 'hover:bg-gray-700'}`}
            onClick={() => !isRefreshing && fetchOptionsFlowData()}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Badge>
          {allData.length > 0 && (
            <span className="text-xs text-gray-400">
              Showing {displayData.length} of {allData.length} trades
            </span>
          )}
        </div>
      </div>
      
      <div className="relative overflow-x-auto rounded-md">
        
        <table className="w-full text-sm text-left text-white">
          {/* Table Header */}
          <thead className="text-xs uppercase bg-gray-900 text-gray-400 border-b border-gray-800">
            <tr>
              <th 
                scope="col" 
                className="px-3 py-3 cursor-pointer hover:text-white" 
                onClick={() => toggleSort('time')}
              >
                <div className="flex items-center">
                  TIME
                  {sortBy === 'time' && (
                    <Clock className="ml-1 h-3 w-3 text-blue-400" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3">TICKER</th>
              <th scope="col" className="px-3 py-3">EXPIRY</th>
              <th scope="col" className="px-3 py-3">C/P</th>
              <th scope="col" className="px-3 py-3">SPOT</th>
              <th scope="col" className="px-3 py-3">STRIKE</th>
              <th scope="col" className="px-3 py-3">OTM</th>
              <th scope="col" className="px-3 py-3">PRICE</th>
              <th scope="col" className="px-3 py-3">SIZE</th>
              <th scope="col" className="px-3 py-3">
                <div>OPEN</div>
                <div>INTEREST</div>
              </th>
              <th scope="col" className="px-3 py-3">IMPLIED VOL</th>
              <th scope="col" className="px-3 py-3">TYPE</th>
              <th 
                scope="col" 
                className="px-3 py-3 cursor-pointer hover:text-white"
                onClick={() => toggleSort('premium')}
              >
                <div className="flex items-center">
                  PREMIUM
                  {sortBy === 'premium' && (
                    <DollarSign className="ml-1 h-3 w-3 text-green-400" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-3 py-3">SECTOR</th>
              <th scope="col" className="px-3 py-3">HEAT SCORE</th>
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center text-gray-400">
                  <p>No options flow data available</p>
                  <p className="text-xs mt-2">Try changing your filters or waiting for new trades</p>
                </td>
              </tr>
            ) : (
              displayData.map((item, index) => (
                <tr key={index} className={`border-b border-gray-800 hover:bg-gray-800/50 ${item.premium.includes('M') ? 'bg-yellow-900/30' : ''} ${item.callPut === 'C' ? 'text-blue-400' : 'text-red-400'}`}>
                  <td className="px-3 py-2 text-gray-200">{item.time}</td>
                  <td className="px-3 py-2 font-medium">{item.ticker}</td>
                  <td className="px-3 py-2">{item.expiry}</td>
                  <td className="px-3 py-2 font-medium">{item.callPut}</td>
                  <td className="px-3 py-2 text-gray-300">{item.spot}</td>
                  <td className="px-3 py-2 font-medium">{item.strike}</td>
                  <td className="px-3 py-2">{item.otm}</td>
                  <td className="px-3 py-2">{item.price}</td>
                  <td className="px-3 py-2 text-gray-200">{item.size}</td>
                  <td className="px-3 py-2 text-gray-400">{item.openInterest}</td>
                  <td className="px-3 py-2">{item.impliedVol}</td>
                  <td className="px-3 py-2">
                    <Badge className={`${item.type === 'Sweep' ? 'bg-orange-600/80' : 'bg-purple-600/80'}`}>
                      {item.type}
                    </Badge>
                  </td>
                  <td className={`px-3 py-2 font-medium flex items-center ${item.premium.includes('M') ? 'text-yellow-300' : ''}`}>
                    {item.premium.includes('M') && <Zap className="w-4 h-4 mr-1 text-yellow-300" />}
                    {item.premium}
                  </td>
                  <td className="px-3 py-2 text-gray-300">{item.sector}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center">
                      {Array.from({ length: item.heatScore }).map((_, i) => (
                        <div key={i} className={`w-1.5 h-4 mx-px ${item.callPut === 'C' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                      ))}
                      {Array.from({ length: 10 - item.heatScore }).map((_, i) => (
                        <div key={i} className="w-1.5 h-4 mx-px bg-gray-700"></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      {allData.length > itemsPerPage && (
        <div className="flex justify-center items-center p-4 border-t border-gray-800">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers */}
            {(() => {
              const totalPages = Math.ceil(allData.length / itemsPerPage);
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
                  <Button
                    key={i}
                    variant={i === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i)}
                    className={i === currentPage ? 'bg-primary text-white' : ''}
                  >
                    {i}
                  </Button>
                );
              }
              
              return pageButtons;
            })()} 
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(allData.length / itemsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(allData.length / itemsPerPage)}
              className={currentPage === Math.ceil(allData.length / itemsPerPage) ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsFlow;