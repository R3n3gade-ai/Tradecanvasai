import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { ChevronDown, Edit, RefreshCw, ChevronLeft, ChevronRight, LayoutGrid, BarChart as BarChartIcon } from 'lucide-react';
import { DashboardLayout as PageLayout } from "components/DashboardLayout";
import { SymbolSearch } from "components/SymbolSearch";
import brain from "brain";
import { useNavigate, useLocation } from "react-router-dom";

const DEFAULT_SYMBOL = "SPY";

interface GammaDataPoint {
  strike: number;
  net_delta: number;
  net_gex: number;
  total_oi: number;
  call_oi: number;
  put_oi: number;
  call_gamma: number;
  put_gamma: number;
  percent_diff: number;
}

interface GammaSummary {
  total_call_gamma: number;
  total_put_gamma: number;
  net_gamma: number;
  net_gamma_dollars: number;
  gamma_notional_move: number;
  total_oi: number;
  call_put_ratio: number;
  put_call_ratio: number;
  gamma_condition: string;
  gex_supply: number;
  gex_demand: number;
  zero_gamma_level: number;
}

interface GammaExpiryData {
  expiry: string;
  data: GammaDataPoint[];
  summary: GammaSummary;
}

interface OptionsGammaResponse {
  symbol: string;
  expirations: string[];
  selected_expiry: string;
  gamma_data: GammaExpiryData;
  total_stats: {
    current_price: number;
    days_to_expiry: number;
    last_updated: string;
  };
  error?: string;
}

export default function OptionsGamma() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [symbol, setSymbol] = useState<string>(queryParams.get('symbol') || DEFAULT_SYMBOL);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [gammaData, setGammaData] = useState<OptionsGammaResponse | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Format large numbers with commas
  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toFixed(2);
    }
  };
  
  // Format large numbers with commas for table display
  const formatTableNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };
  
  // Format percentage values
  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };
  
  // Handle symbol change
  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    navigate(`/OptionsGamma?symbol=${newSymbol}`);
  };
  
  // Handle view toggle
  const toggleView = () => {
    setView(view === 'chart' ? 'table' : 'chart');
  };
  
  // Handle expiry selection
  const handleExpirySelect = (expiry: string) => {
    setSelectedExpiry(expiry);
    fetchGammaData(symbol, expiry);
  };
  
  // Fetch gamma data from API
  const fetchGammaData = async (symbol: string, expiryDate?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await brain.get_options_gamma({
        symbol: symbol,
        expiration_date: expiryDate
      });
      
      const data = await response.json();
      console.log("Gamma data:", data);
      
      if (data.error) {
        setError(data.error);
      } else {
        setGammaData(data);
        if (!expiryDate && data.selected_expiry) {
          setSelectedExpiry(data.selected_expiry);
        }
      }
    } catch (err) {
      console.error("Error fetching gamma data:", err);
      setError("Failed to fetch gamma data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize data on component mount
  useEffect(() => {
    fetchGammaData(symbol);
  }, [symbol]);
  
  // Format the expiry date for display
  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  };
  
  return (
    <PageLayout>
      <div className="flex flex-col w-full h-full overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="flex items-center text-primary hover:underline"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
        {/* Header row */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold mr-2">{symbol}</h1>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                    <Edit size={14} />
                  </Button>
                </div>
                <div className="text-xs text-gray-400">
                  Net GEX by Expiration
                </div>
              </div>
            </div>
            <SymbolSearch onSymbolSelect={handleSymbolChange} currentSymbol={symbol} />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Button 
                variant={view === 'chart' ? "default" : "outline"} 
                size="sm"
                className="h-8"
                onClick={() => setView('chart')}
              >
                <BarChartIcon size={16} className="mr-1" />
                Chart
              </Button>
              <Button 
                variant={view === 'table' ? "default" : "outline"} 
                size="sm"
                className="h-8"
                onClick={() => setView('table')}
              >
                <LayoutGrid size={16} className="mr-1" />
                Table
              </Button>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8"
              onClick={() => fetchGammaData(symbol, selectedExpiry)}
              disabled={isLoading}
            >
              <RefreshCw size={14} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex flex-grow h-full overflow-hidden">
          {/* Left side - Gamma visualization */}
          <div className="flex-grow p-4 overflow-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4">{error}</div>
            ) : gammaData ? (
              <div className="h-full">
                {view === 'chart' ? (
                  <GammaChartView data={gammaData} formatNumber={formatNumber} />
                ) : (
                  <GammaTableView data={gammaData} formatNumber={formatNumber} formatTableNumber={formatTableNumber} formatPercent={formatPercent} />
                )}
              </div>
            ) : null}
          </div>
          
          {/* Right side - Expiry selection */}
          <div className="w-64 border-l border-gray-800 p-4 overflow-auto">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Filter by Expiry Date</h3>
              <p className="text-xs text-gray-400 mb-4">
                Click to select Single date. Use CTRL+Click to select or deselect multiple dates. Drag across dates to select a range.
              </p>
              <Button size="sm" variant="outline" className="w-full mb-2 text-xs">
                Select All
              </Button>
              <Button size="sm" variant="outline" className="w-full mb-4 text-xs">
                Reset
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {gammaData?.expirations.map((expiry) => (
                <Button 
                  key={expiry}
                  variant={expiry === selectedExpiry ? "default" : "outline"}
                  className={`text-xs py-1 ${expiry === selectedExpiry ? 'bg-purple-600' : ''}`}
                  onClick={() => handleExpirySelect(expiry)}
                >
                  {formatExpiryDate(expiry)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Component for the chart view of gamma data
interface GammaChartViewProps {
  data: OptionsGammaResponse;
  formatNumber: (num: number) => string;
}

const GammaChartView: React.FC<GammaChartViewProps> = ({ data, formatNumber }) => {
  // Prepare data for the chart
  const chartData = data.gamma_data.data.map(point => ({
    strike: point.strike,
    callGamma: point.call_gamma,
    putGamma: -point.put_gamma, // Negative for visual display
    netGex: point.net_gex
  }));
  
  return (
    <div className="h-full bg-gray-900 p-4 rounded-lg">
      <div className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
            <XAxis 
              dataKey="strike" 
              stroke="#888" 
              tickFormatter={(value) => value.toString()}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              stroke="#888"
              tickFormatter={(value) => formatNumber(value)}
              tick={{ fontSize: 10 }}
            />
            <Tooltip 
              formatter={(value: any, name: string) => [
                formatNumber(Number(value)), 
                name === 'callGamma' ? 'Call Gamma' : 
                name === 'putGamma' ? 'Put Gamma' : 'Net GEX'
              ]}
              labelFormatter={(label) => `Strike: $${label}`}
            />
            <ReferenceLine y={0} stroke="#666" />
            <Bar dataKey="callGamma" fill="#22c55e" name="Call Gamma" />
            <Bar dataKey="putGamma" fill="#ef4444" name="Put Gamma" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Component for the table view of gamma data
interface GammaTableViewProps {
  data: OptionsGammaResponse;
  formatNumber: (num: number) => string;
  formatTableNumber: (num: number) => string;
  formatPercent: (num: number) => string;
}

const GammaTableView: React.FC<GammaTableViewProps> = ({ 
  data, 
  formatNumber, 
  formatTableNumber,
  formatPercent 
}) => {
  const { gamma_data, total_stats } = data;
  const currentPrice = total_stats.current_price;
  
  // Determine color based on value
  const getValueColor = (value: number) => {
    if (value > 0) return "text-green-500";
    if (value < 0) return "text-red-500";
    return "";
  };
  
  // Get background color for rows
  const getRowBackground = (strike: number) => {
    const isNearCurrentPrice = Math.abs(strike - currentPrice) < (currentPrice * 0.005); // Within 0.5% of current price
    if (isNearCurrentPrice) return "bg-blue-900/30";
    return strike > currentPrice ? "bg-gray-900" : "bg-gray-900/60";
  };
  
  // Function to normalize value for bar width (0-100%)
  const normalizeForBar = (value: number, isPositive: boolean, maxValue: number) => {
    const absValue = Math.abs(value);
    const percentage = Math.min((absValue / maxValue) * 100, 100);
    return {
      width: `${percentage}%`,
      backgroundColor: isPositive ? "#22c55e" : "#ef4444", // green or red
      marginLeft: isPositive ? "0" : "auto", // Align right for negative values
    };
  };
  
  // Find max values for scaling bars
  const maxNetGex = Math.max(...gamma_data.data.map(d => Math.abs(d.net_gex)));
  const maxNetDelta = Math.max(...gamma_data.data.map(d => Math.abs(d.net_delta)));
  
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="text-lg font-medium">
            Net GEX by Expiration
          </div>
          <div className="text-xs text-gray-400">
            Strike
          </div>
        </div>
        
        <div className="overflow-auto max-h-[calc(100vh-320px)]">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-800 text-xs border-b border-gray-700">
              <tr>
                <th className="p-2 text-left font-medium">Strike</th>
                <th className="p-2 text-right font-medium">Net Delta</th>
                <th className="p-2 text-right font-medium">Net GEX</th>
                <th className="p-2 text-right font-medium">Total OI</th>
                <th className="p-2 text-right font-medium">Call OI</th>
                <th className="p-2 text-right font-medium">Put OI</th>
                <th className="p-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {gamma_data.data.map((row, index) => {
                const isAboveCurrentPrice = row.strike >= currentPrice;
                const isAtPrice = Math.abs(row.strike - currentPrice) < (currentPrice * 0.005);
                const rowIndicator = isAtPrice ? "•" : "";
                
                return (
                  <tr 
                    key={index} 
                    className={`border-b border-gray-800 ${getRowBackground(row.strike)}`}
                  >
                    <td className="p-2 text-sm font-medium flex items-center">
                      {isAtPrice && <span className="text-blue-500 mr-2 text-lg">•</span>}
                      {row.strike.toFixed(1)}
                    </td>
                    <td className="p-2 relative">
                      <div className="flex justify-end items-center space-x-2">
                        {row.net_delta !== 0 && (
                          <div 
                            className="absolute h-5 left-0"
                            style={normalizeForBar(row.net_delta, row.net_delta > 0, maxNetDelta)}
                          ></div>
                        )}
                        <span className={`text-right relative z-10 ${getValueColor(row.net_delta)}`}>
                          {formatNumber(row.net_delta)}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 relative">
                      <div className="flex justify-end items-center space-x-2">
                        {row.net_gex !== 0 && (
                          <div 
                            className="absolute h-5 left-0"
                            style={normalizeForBar(row.net_gex, row.net_gex > 0, maxNetGex)}
                          ></div>
                        )}
                        <span className={`text-right relative z-10 ${getValueColor(row.net_gex)}`}>
                          {formatNumber(row.net_gex)}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      {formatTableNumber(row.total_oi)}
                    </td>
                    <td className="p-2 text-right text-green-500">
                      {formatTableNumber(row.call_oi)}
                    </td>
                    <td className="p-2 text-right text-red-500">
                      {formatTableNumber(row.put_oi)}
                    </td>
                    <td className="p-2 text-right">
                      {formatPercent(row.percent_diff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1 bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">Gamma, OI, and Others</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <div className="text-sm text-gray-400">Net Gamma $</div>
              <div className={`text-xl font-semibold ${getValueColor(gamma_data.summary.net_gamma_dollars)}`}>
                {formatNumber(gamma_data.summary.net_gamma_dollars)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Total OI</div>
              <div className="text-xl font-semibold">
                {formatTableNumber(gamma_data.summary.total_oi)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Expected Move</div>
              <div className="text-lg font-medium">
                {gamma_data.summary.gamma_notional_move.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">COTMP</div>
              <div className="text-lg font-medium">
                {(gamma_data.summary.total_oi / 1000).toFixed(2)}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-400 mb-1">COTMC</div>
              <div className="text-lg font-medium">
                {(gamma_data.summary.total_oi / 50000).toFixed(1)}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm text-gray-400 mb-1">Gamma Condition:</h4>
            <div className={`text-center p-2 rounded-md text-white font-semibold ${gamma_data.summary.gamma_condition.includes("Call") ? "bg-green-600" : "bg-purple-600"}`}>
              {gamma_data.summary.gamma_condition}
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">GEX Indicators</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">GEX Supply</div>
              <div className="text-xl font-semibold text-green-500">
                {formatNumber(gamma_data.summary.gex_supply)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">GEX Demand</div>
              <div className="text-xl font-semibold text-red-500">
                {formatNumber(gamma_data.summary.gex_demand)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Net GEX</div>
              <div className="text-xl font-semibold">
                {formatNumber(gamma_data.summary.net_gamma_dollars)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Equity Spot</div>
              <div className="text-xl font-semibold">
                {total_stats.current_price.toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-1">Last Data Updated:</div>
            <div className="text-sm">{total_stats.last_updated}</div>
          </div>
          
          {/* GEX Gauge */}
          <div className="mt-4 h-16 relative">
            <div className="absolute bottom-0 w-full h-6 bg-gradient-to-r from-red-600 via-yellow-500 to-green-600 rounded-full overflow-hidden"></div>
            <div 
              className="absolute bottom-1 w-3 h-10 bg-white rounded-full transform -translate-x-1/2"
              style={{ left: `${50 + (gamma_data.summary.net_gamma_dollars / (gamma_data.summary.gex_supply + gamma_data.summary.gex_demand) * 100 * 0.5)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
