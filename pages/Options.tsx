import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, ChevronLeft } from 'lucide-react';
import polygonWebSocket from '../utils/polygonWebSocket';
// Removed test component import
import OptionsFlow from '../components/OptionsFlow';
import useOptionsStore from '../utils/optionsStore';
import GammaExposureCharts from '../components/GammaExposureCharts';
import { Loader2, Brain } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { AddToBrain } from '../components/AddToBrain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "../utils/store";
import { Separator } from "@/components/ui/separator";

const Options: React.FC = () => {
  const navigate = useNavigate();
  // View state (chain, flow, gamma)
  const [activeView, setActiveView] = useState<'chain' | 'flow' | 'gamma'>('chain');
  // State for the ticker input (using SPY as default)
  const [tickerInput, setTickerInput] = useState("SPY");
  const [currentTicker, setCurrentTicker] = useState("SPY");
  
  const { sidebarOpen } = useDashboardStore();
  
  const { 
    selectedSymbol, 
    availableSymbols,
    expirations,
    strikes,
    chain,
    selectedExpiration,
    underlyingPrice,
    isLoading,
    error,
    wsStatus,
    wsStatusMessage,
    setSelectedSymbol,
    setSelectedExpiration,
    fetchOptionsChain
  } = useOptionsStore();

  // Fetch initial options data when component mounts
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('Not in browser environment, skipping options chain fetch');
      return;
    }
    // Initial fetch
    try {
      fetchOptionsChain(selectedSymbol);
    } catch (error) {
      console.error('Error fetching options chain:', error);
    }
    
    // Cleanup when component unmounts
    return () => {
      // Disconnect WebSocket when component unmounts
      try {
      polygonWebSocket.disconnect();
    } catch (error) {
      console.error('Error disconnecting WebSocket:', error);
    }
    };
  }, []);  // Empty dependency array - only run once when component mounts

  // Format utilities
  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A';
    return price.toFixed(2);
  };

  const formatChange = (change: number | undefined) => {
    if (!change) return '+0.00';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  // No longer showing test component
  const showTestComponent = false;

  return (
    <DashboardLayout title="Options Chain">
      <div className="p-4 border-b border-white/10 mb-4">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center text-primary hover:underline"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
      {/* Test component removed */}
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold mr-3">Options</h2>
                {underlyingPrice && (
                  <Badge variant="outline" className="px-3 py-1 text-xl border-primary/30 bg-primary/10">
                    {selectedSymbol}: ${underlyingPrice.toFixed(2)}
                  </Badge>
                )}
                <div className="ml-6 flex space-x-2">
                  <button 
                    className={`px-3 py-1 rounded transition-colors ${activeView === 'chain' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => setActiveView('chain')}
                  >
                    Chain
                  </button>
                  <button 
                    className={`px-3 py-1 rounded transition-colors ${activeView === 'flow' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => setActiveView('flow')}
                  >
                    Flow
                  </button>
                  <button 
                    className={`px-3 py-1 rounded transition-colors ${activeView === 'gamma' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => setActiveView('gamma')}
                  >
                    Gamma
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  className="px-3 py-1 bg-indigo-900/30 text-indigo-400 border border-indigo-700/40 rounded flex items-center gap-1.5 hover:bg-indigo-800/40 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    const content = `Options data for ${selectedSymbol} with expiration on ${selectedExpiration ? new Date(selectedExpiration).toLocaleDateString() : 'N/A'}`;
                    document.querySelector('[data-add-to-brain]')?.click();
                  }}
                >
                  <Brain className="h-4 w-4" />
                  Add to Ted's Brain
                </button>
                <div className="hidden">
                  <AddToBrain
                    content={`Options data for ${selectedSymbol} with expiration on ${selectedExpiration ? new Date(selectedExpiration).toLocaleDateString() : 'N/A'}`}
                    source="options-data"
                    metadata={{ symbol: selectedSymbol, expiration: selectedExpiration }}
                    data-add-to-brain
                  />
                </div>
                <div className="bg-card border border-white/10 rounded-md px-3 py-1 flex items-center">
                  <input 
                    type="text" 
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                    className="bg-transparent border-none focus:outline-none w-24 text-center"
                    placeholder="Symbol"
                  />
                  <button 
                    className="ml-2 px-3 py-1 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm"
                    onClick={() => {
                      setCurrentTicker(tickerInput);
                      setSelectedSymbol(tickerInput);
                    }}
                  >
                    Load
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <div className="text-sm text-muted-foreground mr-1">Expirations:</div>
                {expirations.length > 0 ? (
                  expirations.map(exp => {
                    const isSelected = selectedExpiration === exp;
                    const expDate = new Date(exp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    });
                    return (
                      <button
                        key={exp}
                        onClick={() => setSelectedExpiration(exp)}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-all ${isSelected 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-card/80 border-white/10 hover:border-primary/50'}`}
                      >
                        {expDate}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-muted-foreground italic">No expirations available</div>
                )}
              </div>
            </div>

            {error && (
              <Card className="mb-4 bg-red-900/20 border-red-800">
                <CardContent className="pt-4">
                  <p>{error}</p>
                </CardContent>
              </Card>
            )}

            {activeView === 'flow' && (
              <>
                <Card className="border border-gray-800 bg-gray-900/50 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">Real-time Options Flow</h3>
                        <p className="text-sm text-muted-foreground">Monitor large block trades, unusual sweeps, and institutional activity</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          <span className="text-xs text-gray-400">Calls</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          <span className="text-xs text-gray-400">Puts</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          <span className="text-xs text-gray-400">Premium $1M+</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-gray-800 bg-gray-900/50 mb-6">
                  <CardContent className="p-0 overflow-hidden">
                    <OptionsFlow symbol={selectedSymbol} />
                  </CardContent>
                </Card>
              </>
            )}

            {activeView === 'chain' && (
              <Card className="border border-gray-800 bg-gray-900/50">
              <CardHeader className="pb-2 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold">{currentTicker} Options Chain</h3>
                      {/* WebSocket Connection Status */}
                      <div className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                        wsStatus === 'connected' ? 'bg-green-900/30 text-green-400' :
                        wsStatus === 'connecting' ? 'bg-yellow-900/30 text-yellow-400' :
                        wsStatus === 'error' ? 'bg-red-900/30 text-red-400' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {wsStatus === 'connected' && <Wifi size={12} />}
                        {wsStatus === 'connecting' && <Wifi size={12} className="animate-pulse" />}
                        {wsStatus === 'error' && <AlertTriangle size={12} />}
                        {wsStatus === 'disconnected' && <WifiOff size={12} />}
                        <span>
                          {wsStatus === 'connected' ? 'Data Connected' :
                          wsStatus === 'connecting' ? 'Connecting...' :
                          wsStatus === 'error' ? 'Connection Error' :
                          'Disconnected'}
                        </span>
                      </div>
                    </div>
                    {underlyingPrice && (
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-gray-800/50 text-white">
                          ${underlyingPrice.toFixed(2)}
                        </Badge>
                        <Badge variant="outline" className="ml-2 bg-gray-800/50 text-green-400">+0.27%</Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-gray-400">Calls</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-400">Puts</span>
                    </div>
                    {selectedExpiration && (
                      <Badge variant="outline" className="text-xs bg-primary/20 border-primary/30">
                        {new Date(selectedExpiration).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : !selectedExpiration || !chain[selectedExpiration] ? (
                  <div className="p-4 text-center text-gray-400">
                    No options data available for the selected criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-800/70 text-gray-300 border-b border-gray-700">
                          <th colSpan={7} className="py-2 text-center font-medium text-blue-400">CALLS</th>
                          <th className="py-2 text-center font-medium bg-gray-700/80 text-white">Strike</th>
                          <th colSpan={7} className="py-2 text-center font-medium text-red-400">PUTS</th>
                        </tr>
                        <tr className="text-gray-400 bg-gray-800/40 border-b border-gray-700">
                          <th className="p-2 text-left">Last</th>
                          <th className="p-2 text-left">Chg</th>
                          <th className="p-2 text-left">Bid</th>
                          <th className="p-2 text-left">Ask</th>
                          <th className="p-2 text-left">Vol</th>
                          <th className="p-2 text-left">OI</th>
                          <th className="p-2 text-left">IV</th>
                          <th className="p-2 text-center bg-gray-700/50 font-mono">Price</th>
                          <th className="p-2 text-right">Last</th>
                          <th className="p-2 text-right">Chg</th>
                          <th className="p-2 text-right">Bid</th>
                          <th className="p-2 text-right">Ask</th>
                          <th className="p-2 text-right">Vol</th>
                          <th className="p-2 text-right">OI</th>
                          <th className="p-2 text-right">IV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {strikes.map(strike => {
                          const callKey = strike.toString();
                          const putKey = strike.toString();
                          const call = chain[selectedExpiration]?.calls[callKey];
                          const put = chain[selectedExpiration]?.puts[putKey];
                          const inTheMoney = underlyingPrice ? (strike < underlyingPrice) : false;
                          const inTheMoneyPut = underlyingPrice ? (strike > underlyingPrice) : false;
                          
                          return (
                            <tr key={strike} className={`border-b border-gray-800/40 hover:bg-gray-800/30 ${(inTheMoney || inTheMoneyPut) ? 'bg-gray-800/20' : ''}`}>
                              {/* Call Side */}
                              <td className={`p-2 font-mono ${inTheMoney ? 'text-blue-400' : 'text-gray-300'} ${call?.updated ? 'relative' : ''}`}>
                                {formatPrice(call?.lastPrice)}
                                {call?.updated && (
                                  <span className="absolute top-0 right-0 h-1 w-1 rounded-full bg-blue-500 opacity-75 animate-ping"></span>
                                )}
                              </td>
                              <td className={`p-2 font-mono ${call?.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatChange(call?.change)}
                              </td>
                              <td className={`p-2 font-mono ${inTheMoney ? 'text-blue-400' : 'text-gray-300'}`}>{formatPrice(call?.bidPrice)}</td>
                              <td className={`p-2 font-mono ${inTheMoney ? 'text-blue-400' : 'text-gray-300'}`}>{formatPrice(call?.askPrice)}</td>
                              <td className={`p-2 font-mono ${inTheMoney ? 'text-blue-400' : 'text-gray-300'}`}>{call?.volume?.toLocaleString()}</td>
                              <td className={`p-2 font-mono ${inTheMoney ? 'text-blue-400' : 'text-gray-300'}`}>{call?.openInterest?.toLocaleString()}</td>
                              <td className={`p-2 font-mono ${inTheMoney ? 'text-blue-400' : 'text-gray-300'}`}>{call?.impliedVolatility}%</td>
                              
                              {/* Strike Price */}
                              <td className={`p-2 text-center font-mono font-bold bg-gray-700/30 ${inTheMoney || inTheMoneyPut ? 'text-white' : 'text-gray-400'}`}>
                                ${strike.toFixed(2)}
                              </td>
                              
                              {/* Put Side */}
                              <td className={`p-2 font-mono text-right ${inTheMoneyPut ? 'text-red-400' : 'text-gray-300'} ${put?.updated ? 'relative' : ''}`}>
                                {formatPrice(put?.lastPrice)}
                                {put?.updated && (
                                  <span className="absolute top-0 left-0 h-1 w-1 rounded-full bg-red-500 opacity-75 animate-ping"></span>
                                )}
                              </td>
                              <td className={`p-2 font-mono text-right ${put?.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatChange(put?.change)}
                              </td>
                              <td className={`p-2 font-mono text-right ${inTheMoneyPut ? 'text-red-400' : 'text-gray-300'}`}>{formatPrice(put?.bidPrice)}</td>
                              <td className={`p-2 font-mono text-right ${inTheMoneyPut ? 'text-red-400' : 'text-gray-300'}`}>{formatPrice(put?.askPrice)}</td>
                              <td className={`p-2 font-mono text-right ${inTheMoneyPut ? 'text-red-400' : 'text-gray-300'}`}>{put?.volume?.toLocaleString()}</td>
                              <td className={`p-2 font-mono text-right ${inTheMoneyPut ? 'text-red-400' : 'text-gray-300'}`}>{put?.openInterest?.toLocaleString()}</td>
                              <td className={`p-2 font-mono text-right ${inTheMoneyPut ? 'text-red-400' : 'text-gray-300'}`}>{put?.impliedVolatility}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Bottom Stats */}
                <div className="p-3 border-t border-gray-800 grid grid-cols-4 gap-4 text-xs">
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <div className="text-gray-400 mb-1">Call Volume</div>
                    <div className="text-blue-400 font-semibold">23,487</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <div className="text-gray-400 mb-1">Put Volume</div>
                    <div className="text-red-400 font-semibold">17,823</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <div className="text-gray-400 mb-1">Put/Call Ratio</div>
                    <div className="text-white font-semibold">0.76</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <div className="text-gray-400 mb-1">30-Day IV</div>
                    <div className="text-white font-semibold">28.7%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {activeView === 'gamma' && selectedExpiration && underlyingPrice && (
              <div className="mt-6">
                <GammaExposureCharts symbol={selectedSymbol} />
              </div>
            )}
          </div>
    </DashboardLayout>
  );
};

export default Options;