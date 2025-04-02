import React, { useEffect, useState } from 'react';
import useOptionsStore from '../utils/optionsStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, LineChart, Line } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type DetailedGammaExposureResponse, type StrikeExposure, type PriceLevel } from '../types';

// Interface for local gamma exposure calculations
interface GammaExposureData {
  strike: number;
  callGamma: number;
  putGamma: number;
  totalGamma: number;
  netGamma: number;
  openInterest: number;
  callDelta: number;
  putDelta: number;
  netDelta: number;
}

// Legacy interfaces for compatibility with older endpoints
interface StrikeData {
  strike: number;
  callGamma: number;
  putGamma: number;
  netGamma: number;
  callDelta: number;
  putDelta: number;
  netDelta: number;
  callOI: number;
  putOI: number;
}

interface GammaResponse {
  symbol: string;
  expiration: string;
  data: StrikeData[];
  zeroGamma: number;
  underlyingPrice: number;
}

interface ExposurePoint {
  price: number;
  totalGamma: number;
  callGamma: number;
  putGamma: number;
  netGamma: number;
  totalDelta: number;
}

interface ExposureCurveResponse {
  symbol: string;
  currentPrice: number;
  exposureCurve: ExposurePoint[];
  zeroGammaPrice: number | null;
}

interface GammaExposureChartProps {
  symbol: string;
}

const GammaExposureCharts: React.FC<GammaExposureChartProps> = ({ symbol }) => {
  const [gammaData, setGammaData] = useState<GammaExposureData[]>([]);
  const [apiGammaData, setApiGammaData] = useState<GammaResponse | null>(null);
  const [exposureCurveData, setExposureCurveData] = useState<ExposureCurveResponse | null>(null);
  const [detailedGammaData, setDetailedGammaData] = useState<DetailedGammaExposureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'gamma' | 'delta' | 'openInterest'>('gamma');
  // Always use local calculation mode, no need to let users switch
  const viewMode = 'local';
  // Toggle between chart and table views
  const [displayMode, setDisplayMode] = useState<'chart' | 'table'>('chart');
  
  const { 
    selectedSymbol, 
    selectedExpiration,
    strikes,
    chain,
    underlyingPrice
  } = useOptionsStore();

  // Calculate Black-Scholes model gamma values
  const calculateBlackScholesGamma = (
    S: number,      // Underlying price
    K: number,      // Strike price
    T: number,      // Time to expiration (in years)
    r: number,      // Risk-free interest rate
    sigma: number,  // Implied volatility
    optionType: 'call' | 'put'
  ): { gamma: number, delta: number } => {
    // Constants for Black-Scholes calculation
    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    // Standard normal cumulative distribution function
    const cdf = (x: number): number => {
      let t = 1 / (1 + 0.2316419 * Math.abs(x));
      let d = 0.3989423 * Math.exp(-x * x / 2);
      let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return x > 0 ? 1 - p : p;
    };
    
    // Standard normal probability density function
    const pdf = (x: number): number => {
      return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    };
    
    // Calculate gamma (same for calls and puts)
    const gamma = pdf(d1) / (S * sigma * Math.sqrt(T));
    
    // Calculate delta (different for calls and puts)
    let delta: number;
    if (optionType === 'call') {
      delta = cdf(d1);
    } else { // put
      delta = cdf(d1) - 1;
    }
    
    return { gamma, delta };
  };

  // Calculate gamma exposure data
  // Effect for local gamma calculations using the component's own Black-Scholes implementation
  useEffect(() => {
    if (viewMode !== 'local' || !selectedExpiration || !chain[selectedExpiration] || !underlyingPrice) {
      setGammaData([]);
      if (viewMode === 'local') setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get days until expiration in years
      const now = new Date();
      const expiry = new Date(selectedExpiration);
      const daysToExpiry = Math.max(1, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const timeToExpiryYears = daysToExpiry / 365;

      // Constants for Black-Scholes
      const riskFreeRate = 0.05; // 5% risk-free rate

      // Calculate gamma exposure for each strike
      const exposureData: GammaExposureData[] = strikes.map(strike => {
        const callContract = chain[selectedExpiration]?.calls[strike.toString()];
        const putContract = chain[selectedExpiration]?.puts[strike.toString()];

        // Default values if contracts don't exist
        const callIV = callContract?.impliedVolatility || 0.3; // 30% default IV
        const putIV = putContract?.impliedVolatility || 0.3;
        const callOI = callContract?.openInterest || 0;
        const putOI = putContract?.openInterest || 0;

        // Calculate gamma and delta using Black-Scholes
        const callResults = calculateBlackScholesGamma(
          underlyingPrice,
          strike,
          timeToExpiryYears,
          riskFreeRate,
          callIV,
          'call'
        );

        const putResults = calculateBlackScholesGamma(
          underlyingPrice,
          strike,
          timeToExpiryYears,
          riskFreeRate,
          putIV,
          'put'
        );

        // Scale gamma by open interest and contract multiplier (100 shares per contract)
        const contractMultiplier = 100;
        const scaledCallGamma = callResults.gamma * callOI * contractMultiplier * underlyingPrice;
        const scaledPutGamma = putResults.gamma * putOI * contractMultiplier * underlyingPrice;

        // Scale delta by open interest and contract multiplier
        const scaledCallDelta = callResults.delta * callOI * contractMultiplier;
        const scaledPutDelta = putResults.delta * putOI * contractMultiplier;

        return {
          strike,
          callGamma: parseFloat(scaledCallGamma.toFixed(2)),
          putGamma: parseFloat(scaledPutGamma.toFixed(2)),
          totalGamma: parseFloat((scaledCallGamma + scaledPutGamma).toFixed(2)),
          netGamma: parseFloat((scaledCallGamma - scaledPutGamma).toFixed(2)),
          openInterest: callOI + putOI,
          callDelta: parseFloat(scaledCallDelta.toFixed(2)),
          putDelta: parseFloat(scaledPutDelta.toFixed(2)),
          netDelta: parseFloat((scaledCallDelta + scaledPutDelta).toFixed(2))
        };
      });

      setGammaData(exposureData);
      setLoading(false);
    } catch (err) {
      console.error('Error calculating gamma exposure:', err);
      setError('Failed to calculate gamma exposure');
      setLoading(false);
    }
  }, [viewMode, selectedSymbol, selectedExpiration, strikes, chain, underlyingPrice]);
  
  // This useEffect was intentionally removed as it's duplicated below
  
  // Advanced gamma API removed
  useEffect(() => {
    if (viewMode !== 'advanced' || !selectedExpiration) {
      return;
    }
    
    setLoading(false);
    setError('Detailed gamma exposure data not available - APIs have been removed');
    
    // Provide empty placeholder data so the component doesn't error out
    setDetailedGammaData({
      current_price: underlyingPrice || 400,
      analysis_by_strike: [],
      exposure_curve: [],
      metrics: null,
      symbol: symbol
    });
  }, [viewMode, symbol, selectedSymbol, selectedExpiration, underlyingPrice]);
  
  // API data fetching removed
  useEffect(() => {
    if (viewMode !== 'api') {
      return;
    }
    
    setLoading(false);
    setError('Gamma exposure data not available - APIs have been removed');
    
    // Provide empty placeholder data so the component doesn't error out
    setApiGammaData({
      symbol: symbol,
      expiration: selectedExpiration || '',
      data: [],
      zeroGamma: 0,
      underlyingPrice: underlyingPrice || 400
    });
    
    setExposureCurveData({
      symbol: symbol,
      currentPrice: underlyingPrice || 400,
      exposureCurve: [],
      zeroGammaPrice: null
    });
  }, [viewMode, symbol, selectedExpiration, underlyingPrice]);
  
  // Option chain analysis function removed
  const analyzeFullOptionsChain = async () => {
    // No-op function - all API functionality removed
  };
  
  // Trigger removed
  useEffect(() => {
    // API functionality removed
  }, [viewMode, selectedExpiration, chain, underlyingPrice]);

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-md shadow">
          <p className="font-mono text-white font-bold">Strike: ${label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="font-mono text-sm" style={{ color: item.color }}>
              {item.name}: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Find the price level where gamma exposure crosses zero
  const findZeroGammaLevel = (data: GammaExposureData[]): string => {
    // Sort data by strike price
    const sortedData = [...data].sort((a, b) => a.strike - b.strike);
    
    // Find where gamma crosses from positive to negative or vice versa
    let zeroLevel = underlyingPrice || 0;
    
    for (let i = 1; i < sortedData.length; i++) {
      const prev = sortedData[i-1];
      const curr = sortedData[i];
      
      if ((prev.netGamma > 0 && curr.netGamma < 0) || (prev.netGamma < 0 && curr.netGamma > 0)) {
        // Found a zero crossing, interpolate to estimate the exact level
        const ratio = Math.abs(prev.netGamma) / (Math.abs(prev.netGamma) + Math.abs(curr.netGamma));
        zeroLevel = prev.strike + ratio * (curr.strike - prev.strike);
        break;
      }
    }
    
    return zeroLevel.toFixed(2);
  };

  // Format number for display (K, M, etc)
  const formatNumber = (num: number): string => {
    if (Math.abs(num) >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (Math.abs(num) >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toFixed(2);
    }
  };
  
  // Calculate percentage difference between two numbers
  const calculatePercentDiff = (a: number, b: number): string => {
    return Math.abs(((b - a) / a) * 100).toFixed(2);
  };
  
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{symbol} Gamma Exposure Analysis</CardTitle>
            <CardDescription>
              Options gamma exposure by strike price
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-md overflow-hidden border border-gray-700">
              <button 
                onClick={() => setDisplayMode('chart')} 
                className={`px-3 py-1 text-sm ${displayMode === 'chart' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
              >
                Chart View
              </button>
              <button 
                onClick={() => setDisplayMode('table')} 
                className={`px-3 py-1 text-sm ${displayMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
              >
                Table View
              </button>
            </div>
            <Select value={chartType} onValueChange={(value: 'gamma' | 'delta' | 'openInterest') => setChartType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gamma">Gamma Exposure</SelectItem>
                <SelectItem value="delta">Delta Exposure</SelectItem>
                <SelectItem value="openInterest">Open Interest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="h-[300px] flex items-center justify-center text-red-400">
            {error}
          </div>
        ) : ((viewMode === 'local' && gammaData.length === 0) || 
              (viewMode === 'api' && !apiGammaData && !exposureCurveData) ||
              (viewMode === 'advanced' && !detailedGammaData)) ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available. Select an expiration date to view gamma exposure.
          </div>
        ) : displayMode === 'table' && viewMode === 'local' ? (
          <div className="overflow-auto max-h-[600px]">
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Net Gamma $</h4>
                <div className="text-xl font-bold text-blue-400">
                  {formatNumber(gammaData.reduce((sum, item) => sum + item.netGamma, 0))}
                </div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Total OI</h4>
                <div className="text-xl font-bold">
                  {formatNumber(gammaData.reduce((sum, item) => sum + item.openInterest, 0))}
                </div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Gamma Condition</h4>
                <div className="text-xl font-bold" style={{ color: gammaData.reduce((sum, item) => sum + item.netGamma, 0) > 0 ? '#4ade80' : '#f87171' }}>
                  {gammaData.reduce((sum, item) => sum + item.netGamma, 0) > 0 ? 'Call Dominated' : 'Put Dominated'}
                </div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-1">GEX Zero</h4>
                <div className="text-xl font-bold text-yellow-400">
                  ${findZeroGammaLevel(gammaData)}
                </div>
              </div>
            </div>
            
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left bg-gray-800/50">
                  <th className="px-3 py-2 text-gray-300 font-medium text-sm">Strike</th>
                  <th className="px-3 py-2 text-gray-300 font-medium text-sm">Net Delta</th>
                  <th className="px-3 py-2 text-gray-300 font-medium text-sm">Net GEX</th>
                  <th className="px-3 py-2 text-gray-300 font-medium text-sm">Total OI</th>
                  <th className="px-3 py-2 text-gray-300 font-medium text-sm">Call OI</th>
                  <th className="px-3 py-2 text-gray-300 font-medium text-sm">Put OI</th>
                  <th className="px-3 py-2 text-gray-300 font-medium text-sm">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {gammaData.map((row, idx) => {
                  // Calculate position relative to current price for color
                  const isCurrentPrice = Math.abs(row.strike - (underlyingPrice || 0)) < (strikes[1] - strikes[0]) / 2;
                  const isAbovePrice = row.strike > (underlyingPrice || 0);
                  const isBelowPrice = row.strike < (underlyingPrice || 0);
                  
                  // Calculate total OI and percentages
                  const totalOI = row.openInterest;
                  const callOI = totalOI / 2; // Approximation since we don't have actual split
                  const putOI = totalOI / 2; // Approximation since we don't have actual split
                  const percent = totalOI > 0 ? (Math.abs(row.netGamma) / Math.max(...gammaData.map(d => Math.abs(d.netGamma)))).toFixed(2) : '0.00';
                  
                  // For the bar visualization
                  const maxGamma = Math.max(...gammaData.map(d => Math.abs(d.netGamma)));
                  const gammaRatio = Math.abs(row.netGamma) / maxGamma;
                  const barWidth = Math.max(gammaRatio * 100, 2);
                  
                  return (
                    <tr key={idx} className={`
                      ${isCurrentPrice ? 'bg-blue-900/20' : ''}
                      hover:bg-gray-800/50
                    `}>
                      <td className="px-3 py-2 font-mono relative">
                        {isCurrentPrice && (
                          <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></span>
                        )}
                        <div className="flex items-center">
                          {isCurrentPrice && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                          )}
                          {row.strike.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono">
                        <span className={row.netDelta > 0 ? 'text-green-400' : 'text-red-400'}>
                          {formatNumber(row.netDelta)}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono relative">
                        <div className="flex items-center">
                          {row.netGamma > 0 ? (
                            <div className="absolute left-0 h-full flex items-center">
                              <div 
                                className="h-[10px] bg-green-500" 
                                style={{ width: `${barWidth}%`, maxWidth: '120px' }}
                              ></div>
                            </div>
                          ) : (
                            <div className="absolute left-0 h-full flex items-center">
                              <div 
                                className="h-[10px] bg-red-500" 
                                style={{ width: `${barWidth}%`, maxWidth: '120px' }}
                              ></div>
                            </div>
                          )}
                          <span className={`relative z-10 ${row.netGamma > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatNumber(row.netGamma)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono">{formatNumber(totalOI)}</td>
                      <td className="px-3 py-2 font-mono text-green-400">{formatNumber(callOI)}</td>
                      <td className="px-3 py-2 font-mono text-red-400">{formatNumber(putOI)}</td>
                      <td className="px-3 py-2 font-mono">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'advanced' ? (
          <div className="space-y-6">
            <Tabs defaultValue="curve" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-800">
                <TabsTrigger value="curve">Gamma Curve</TabsTrigger>
                <TabsTrigger value="strikes">By Strike</TabsTrigger>
              </TabsList>
              
              <TabsContent value="curve" className="mt-0">
                {detailedGammaData && (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={detailedGammaData.exposure_curve}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis 
                          dataKey="price" 
                          domain={['dataMin', 'dataMax']} 
                          tickFormatter={(tick) => `$${tick}`}
                          stroke="#666" 
                        />
                        <YAxis 
                          tickFormatter={(tick) => formatNumber(tick)}
                          stroke="#666"
                        />
                        <Tooltip content={renderCustomTooltip} />
                        <Legend />
                        <ReferenceLine x={detailedGammaData.current_price} stroke="#fff" strokeDasharray="3 3" label={{ value: 'Current Price', fill: '#fff', position: 'top' }} />
                        <Area 
                          type="monotone" 
                          dataKey="call_gamma" 
                          name="Call Gamma" 
                          fill="rgba(52, 211, 153, 0.2)" 
                          stroke="#34D399"
                          strokeWidth={2} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="put_gamma" 
                          name="Put Gamma" 
                          fill="rgba(239, 68, 68, 0.2)" 
                          stroke="#EF4444"
                          strokeWidth={2} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="net_gamma" 
                          name="Net Gamma" 
                          stroke="#3B82F6"
                          strokeWidth={2} 
                          dot={false} 
                        />
                        <Line
                          type="monotone"
                          dataKey="total_delta"
                          name="Total Delta"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          dot={false}
                          style={{ opacity: 0.6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* Zero Gamma Info */}
                {detailedGammaData && detailedGammaData.metrics?.zero_gamma_price && (
                  <div className="p-4 bg-gray-800/40 rounded-md mt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Zero Gamma Level</h4>
                    <p className="text-base">
                      The zero gamma level is at <span className="font-bold text-blue-400">${detailedGammaData.metrics.zero_gamma_price}</span>, 
                      which is <span className="font-bold">{calculatePercentDiff(detailedGammaData.current_price, detailedGammaData.metrics.zero_gamma_price)}%</span> 
                      {detailedGammaData.metrics.zero_gamma_price > detailedGammaData.current_price ? 'above' : 'below'} 
                      the current price of <span className="font-bold">${detailedGammaData.current_price}</span>.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      At this price, market maker hedging flows change direction, potentially affecting price stability.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="strikes" className="mt-0">
                {detailedGammaData && (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={detailedGammaData.analysis_by_strike}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis 
                          dataKey="strike" 
                          domain={['dataMin', 'dataMax']} 
                          tickFormatter={(tick) => `$${tick}`}
                          stroke="#666" 
                        />
                        <YAxis 
                          tickFormatter={(tick) => formatNumber(tick)}
                          stroke="#666"
                        />
                        <Tooltip content={renderCustomTooltip} />
                        <Legend />
                        <ReferenceLine x={detailedGammaData.current_price} stroke="#fff" strokeDasharray="3 3" label={{ value: 'Current Price', fill: '#fff', position: 'top' }} />
                        <Bar 
                          dataKey="call_gamma_notional" 
                          name="Call Gamma $" 
                          fill="#34D399"
                          stackId="gamma" 
                        />
                        <Bar 
                          dataKey="put_gamma_notional" 
                          name="Put Gamma $" 
                          fill="#EF4444"
                          stackId="gamma" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="net_gamma_notional" 
                          name="Net Gamma $" 
                          stroke="#3B82F6"
                          strokeWidth={2} 
                          dot={false} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* Strike Data Stats */}
                {detailedGammaData && detailedGammaData.metrics && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div className="bg-gray-800/40 p-3 rounded-md">
                      <div className="text-gray-400 text-sm mb-1">1% Move Impact</div>
                      <div className="text-blue-400 font-semibold">
                        ${formatNumber(detailedGammaData.metrics.gamma_notional_1pct)}
                      </div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-md">
                      <div className="text-gray-400 text-sm mb-1">Total Net Delta</div>
                      <div className="text-green-400 font-semibold">
                        {formatNumber(detailedGammaData.metrics.net_delta)}
                      </div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-md">
                      <div className="text-gray-400 text-sm mb-1">Put/Call Ratio</div>
                      <div className="font-semibold">
                        {detailedGammaData.metrics.put_call_ratio.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-md">
                      <div className="text-gray-400 text-sm mb-1">Largest Gamma Strike</div>
                      <div className="font-semibold text-yellow-400">
                        ${detailedGammaData.metrics.largest_gamma_strike}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : viewMode === 'api' ? (
          <div className="space-y-6">
            <Tabs defaultValue="curve" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-800">
                <TabsTrigger value="curve">Gamma Curve</TabsTrigger>
                <TabsTrigger value="strikes">By Strike</TabsTrigger>
              </TabsList>
              
              <TabsContent value="curve" className="mt-0">
                {exposureCurveData && (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={exposureCurveData.exposureCurve}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis 
                          dataKey="price" 
                          domain={['dataMin', 'dataMax']} 
                          tickFormatter={(tick) => `$${tick}`}
                          stroke="#666" 
                        />
                        <YAxis 
                          tickFormatter={(tick) => formatNumber(tick)}
                          stroke="#666"
                        />
                        <Tooltip content={renderCustomTooltip} />
                        <Legend />
                        <ReferenceLine x={exposureCurveData.currentPrice} stroke="#fff" strokeDasharray="3 3" label={{ value: 'Current Price', fill: '#fff', position: 'top' }} />
                        <Area 
                          type="monotone" 
                          dataKey="callGamma" 
                          name="Call Gamma" 
                          fill="rgba(52, 211, 153, 0.2)" 
                          stroke="#34D399"
                          strokeWidth={2} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="putGamma" 
                          name="Put Gamma" 
                          fill="rgba(239, 68, 68, 0.2)" 
                          stroke="#EF4444"
                          strokeWidth={2} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="netGamma" 
                          name="Net Gamma" 
                          stroke="#3B82F6"
                          strokeWidth={2} 
                          dot={false} 
                        />
                        <Line
                          type="monotone"
                          dataKey="totalDelta"
                          name="Total Delta"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          dot={false}
                          style={{ opacity: 0.6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* Zero Gamma Info */}
                {exposureCurveData && exposureCurveData.zeroGammaPrice && (
                  <div className="p-4 bg-gray-800/40 rounded-md mt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Zero Gamma Level</h4>
                    <p className="text-base">
                      The zero gamma level is at <span className="font-bold text-blue-400">${exposureCurveData.zeroGammaPrice}</span>, 
                      which is <span className="font-bold">{calculatePercentDiff(exposureCurveData.currentPrice, exposureCurveData.zeroGammaPrice)}%</span> 
                      {exposureCurveData.zeroGammaPrice > exposureCurveData.currentPrice ? 'above' : 'below'} 
                      the current price of <span className="font-bold">${exposureCurveData.currentPrice}</span>.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      At this price, market maker hedging flows change direction, potentially affecting price stability.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="strikes" className="mt-0">
                {apiGammaData && (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={apiGammaData.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis 
                          dataKey="strike" 
                          domain={['dataMin', 'dataMax']} 
                          tickFormatter={(tick) => `$${tick}`}
                          stroke="#666" 
                        />
                        <YAxis 
                          tickFormatter={(tick) => formatNumber(tick)}
                          stroke="#666"
                        />
                        <Tooltip content={renderCustomTooltip} />
                        <Legend />
                        <ReferenceLine x={apiGammaData.underlyingPrice} stroke="#fff" strokeDasharray="3 3" label={{ value: 'Current Price', fill: '#fff', position: 'top' }} />
                        <Bar 
                          dataKey="callGamma" 
                          name="Call Gamma" 
                          fill="#34D399"
                          stackId="gamma" 
                        />
                        <Bar 
                          dataKey="putGamma" 
                          name="Put Gamma" 
                          fill="#EF4444"
                          stackId="gamma" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="netGamma" 
                          name="Net Gamma" 
                          stroke="#3B82F6"
                          strokeWidth={2} 
                          dot={false} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* Strike Data Stats */}
                {apiGammaData && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div className="bg-gray-800/40 p-3 rounded-md">
                      <div className="text-gray-400 text-sm mb-1">Total Call Gamma</div>
                      <div className="text-blue-400 font-semibold">
                        {formatNumber(apiGammaData.data.reduce((sum, item) => sum + item.callGamma, 0))}
                      </div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-md">
                      <div className="text-gray-400 text-sm mb-1">Total Put Gamma</div>
                      <div className="text-red-400 font-semibold">
                        {formatNumber(apiGammaData.data.reduce((sum, item) => sum + item.putGamma, 0))}
                      </div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-md">
                      <div className="text-gray-400 text-sm mb-1">Net Gamma</div>
                      <div className="font-semibold">
                        {formatNumber(apiGammaData.data.reduce((sum, item) => sum + item.netGamma, 0))}
                      </div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-md">
                      <div className="text-gray-400 text-sm mb-1">Zero Gamma Strike</div>
                      <div className="font-semibold text-yellow-400">
                        ${apiGammaData.zeroGamma}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-6">
            {chartType === 'gamma' && (
              <div className="space-y-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gammaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="strike" 
                        tick={{ fill: '#aaa' }} 
                        tickFormatter={(value) => `$${value}`} 
                      />
                      <YAxis tick={{ fill: '#aaa' }} />
                      <Tooltip content={renderCustomTooltip} />
                      <Legend />
                      <ReferenceLine x={underlyingPrice} stroke="#fff" strokeDasharray="3 3" label={{ value: 'Current Price', fill: '#fff', position: 'top' }} />
                      <Bar dataKey="callGamma" name="Call Gamma" fill="#3182ce" stackId="a" />
                      <Bar dataKey="putGamma" name="Put Gamma" fill="#e53e3e" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gammaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="strike" 
                        tick={{ fill: '#aaa' }} 
                        tickFormatter={(value) => `$${value}`} 
                      />
                      <YAxis tick={{ fill: '#aaa' }} />
                      <Tooltip content={renderCustomTooltip} />
                      <Legend />
                      <ReferenceLine x={underlyingPrice} stroke="#fff" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="netGamma" name="Net Gamma" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {chartType === 'delta' && (
              <div className="space-y-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gammaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="strike" 
                        tick={{ fill: '#aaa' }} 
                        tickFormatter={(value) => `$${value}`} 
                      />
                      <YAxis tick={{ fill: '#aaa' }} />
                      <Tooltip content={renderCustomTooltip} />
                      <Legend />
                      <ReferenceLine x={underlyingPrice} stroke="#fff" strokeDasharray="3 3" label={{ value: 'Current Price', fill: '#fff', position: 'top' }} />
                      <Bar dataKey="callDelta" name="Call Delta" fill="#3182ce" stackId="a" />
                      <Bar dataKey="putDelta" name="Put Delta" fill="#e53e3e" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gammaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="strike" 
                        tick={{ fill: '#aaa' }} 
                        tickFormatter={(value) => `$${value}`} 
                      />
                      <YAxis tick={{ fill: '#aaa' }} />
                      <Tooltip content={renderCustomTooltip} />
                      <Legend />
                      <ReferenceLine x={underlyingPrice} stroke="#fff" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="netDelta" name="Net Delta" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {chartType === 'openInterest' && (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gammaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="strike" 
                      tick={{ fill: '#aaa' }} 
                      tickFormatter={(value) => `$${value}`} 
                    />
                    <YAxis tick={{ fill: '#aaa' }} />
                    <Tooltip content={renderCustomTooltip} />
                    <ReferenceLine x={underlyingPrice} stroke="#fff" strokeDasharray="3 3" label={{ value: 'Current Price', fill: '#fff', position: 'top' }} />
                    <Area type="monotone" dataKey="openInterest" name="Open Interest" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-800/40 p-3 rounded-md">
                <div className="text-gray-400 text-sm mb-1">Total Call Gamma</div>
                <div className="text-blue-400 font-semibold">
                  {formatNumber(gammaData.reduce((sum, item) => sum + item.callGamma, 0))}
                </div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-md">
                <div className="text-gray-400 text-sm mb-1">Total Put Gamma</div>
                <div className="text-red-400 font-semibold">
                  {formatNumber(gammaData.reduce((sum, item) => sum + item.putGamma, 0))}
                </div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-md">
                <div className="text-gray-400 text-sm mb-1">Net Gamma</div>
                <div className="font-semibold">
                  {formatNumber(gammaData.reduce((sum, item) => sum + item.netGamma, 0))}
                </div>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-md">
                <div className="text-gray-400 text-sm mb-1">Zero Gamma Strike</div>
                <div className="font-semibold text-yellow-400">
                  ${findZeroGammaLevel(gammaData)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Utility to find the price level where gamma exposure is close to zero
function findZeroGammaLevel(data: GammaExposureData[]): string {
  if (!data.length) return 'N/A';
  
  // Find the strike where net gamma is closest to zero
  let closestToZero = data[0];
  let minDiff = Math.abs(data[0].netGamma);
  
  for (const item of data) {
    const diff = Math.abs(item.netGamma);
    if (diff < minDiff) {
      minDiff = diff;
      closestToZero = item;
    }
  }
  
  return closestToZero.strike.toFixed(2);
}

export default GammaExposureCharts;