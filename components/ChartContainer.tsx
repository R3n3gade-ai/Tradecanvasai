"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart3, CandlestickChart, LineChart, Activity, ChevronDown, ChevronUp, ArrowDownUp, Pencil, Download, Trash2, RotateCcw, ZoomIn, Loader2, Search, ChevronLeft, Clock, Settings, Star, Scissors, Video, Camera, Maximize2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import AmStockChart from './AmStockChart';
import { PolygonBar, PolygonDataService, Timeframe, ChartType, HistoricalBarsResponse } from 'utils/polygonDataService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from 'utils/store';
import { useUserStore } from 'utils/userStore';
import brain from 'brain';

// Custom timeframe interfaces
interface CustomTimeframe {
  value: number;
  unit: TimeUnit;
  range: TimeRange;
}

type TimeUnit = 'tick' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
type TimeRange = '1hour' | '1day' | '1week' | '1month' | '3month' | '6month' | '1year' | '5year' | 'all';


export interface Annotation {
  id: string;
  text: string;
  price: number;
  time: number;
  color?: string;
}

interface FavoriteTimeframe {
  id: string;
  name: string;
  value: number;
  unit: TimeUnit;
  range: TimeRange;
}

export interface ChartContainerProps {
  symbol: string;
  initialTimeframe?: Timeframe;
  initialChartType?: ChartType;
  onSymbolChange?: (symbol: string) => void;
  showToolbar?: boolean;
  height?: number;
  width?: number;
  darkMode?: boolean;
  annotations?: Annotation[];
  isAnnotating?: boolean;
  onAnnotationAdded?: (annotation: Annotation) => void;
  onAnnotationRemoved?: (annotationId: string) => void;
  onAnalyzeClicked?: (symbol: string, timeframe: Timeframe) => void;
  selectedIndicators?: string[];
}

const TimeframeOptions: {label: string, value: Timeframe}[] = [
  { label: '1m', value: '1min' },
  { label: '5m', value: '5min' },
  { label: '15m', value: '15min' },
  { label: '30m', value: '30min' },
  { label: '1h', value: '1hour' },
  { label: '4h', value: '4hour' },
  { label: '1d', value: '1day' },
  { label: '1w', value: '1week' },
  { label: '1M', value: '1month' },
];

const ChartTypeOptions: {label: string, value: ChartType, icon: React.ReactNode}[] = [
  { 
    label: 'Candlestick', 
    value: 'candlestick', 
    icon: <CandlestickChart className="h-4 w-4" /> 
  },
  { 
    label: 'Bar', 
    value: 'bar', 
    icon: <BarChart3 className="h-4 w-4" /> 
  },
  { 
    label: 'Line', 
    value: 'line', 
    icon: <LineChart className="h-4 w-4" /> 
  },
  { 
    label: 'Area', 
    value: 'area', 
    icon: <Activity className="h-4 w-4" /> 
  },
];

const IndicatorOptions = [
  { label: 'MACD', value: 'macd' },
  { label: 'RSI', value: 'rsi' },
  { label: 'EMA 9', value: 'ema9' },
  { label: 'EMA 20', value: 'ema20' },
  { label: 'EMA 50', value: 'ema50' },
  { label: 'EMA 200', value: 'ema200' },
  { label: 'Volume', value: 'volume' },
];

export const ChartContainer: React.FC<ChartContainerProps> = ({
  symbol,
  initialTimeframe = '1day',
  initialChartType = 'candlestick',
  onSymbolChange,
  showToolbar = true,
  height = 500,
  width,
  darkMode = true,
  annotations = [],
  isAnnotating,
  onAnnotationAdded,
  onAnnotationRemoved,
  onAnalyzeClicked,
  selectedIndicators: propSelectedIndicators,
}) => {
  const [chartData, setChartData] = useState<PolygonBar[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [chartType, setChartType] = useState<ChartType>(initialChartType);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(propSelectedIndicators || ['volume']);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState<boolean>(false);
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState<boolean>(false);
  const [isAnnotatingState, setIsAnnotatingState] = useState<boolean>(isAnnotating || false);
  const [chartAnnotations, setChartAnnotations] = useState<Annotation[]>(annotations || []);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recordingRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  
  // Custom timeframe state
  const [customTimeValue, setCustomTimeValue] = useState<number>(1);
  const [customTimeUnit, setCustomTimeUnit] = useState<TimeUnit>('minute');
  const [customTimeRange, setCustomTimeRange] = useState<TimeRange>('1month');
  const [selectedPreset, setSelectedPreset] = useState<string>('1day');
  const [favorites, setFavorites] = useState<FavoriteTimeframe[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useUserStore(state => state.user);
  const userId = user?.id || 'default';
  const navigate = useNavigate();
  
  // Calculate width based on container if width prop not provided
  useEffect(() => {
    if (!width && containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      
      resizeObserver.observe(containerRef.current);
      
      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
        resizeObserver.disconnect();
      };
    }
  }, [width]);
  
  // Get active indicators from selected options
  const activeIndicators = selectedIndicators.filter(i => i !== 'volume');
  
  // Use internal or external annotation state
  const actualIsAnnotating = isAnnotating !== undefined ? isAnnotating : isAnnotatingState;
  
  // Update annotations when props change
  useEffect(() => {
    if (JSON.stringify(chartAnnotations) !== JSON.stringify(annotations)) {
      setChartAnnotations(annotations || []);
    }
  }, [annotations]);
  
  // Load chart data
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const response = await PolygonDataService.getHistoricalBars(symbol, timeframe);
        if (isMounted) {
          setChartData(response.bars);
          
          // Show data source notification if it's mock data
          if (response.source === 'mock') {
            toast.info('Using simulated market data');
          }
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        if (isMounted) {
          toast.error('Failed to load chart data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe]);
  
  // Handle indicator selection
  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators(prev => {
      if (prev.includes(indicator)) {
        return prev.filter(i => i !== indicator);
      } else {
        return [...prev, indicator];
      }
    });
  };
  
  // Safe click handler for dropdowns
  const handleSafeClick = (e: React.MouseEvent, dropdown: string) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Close all dropdowns first
    setShowTimeframeDropdown(false);
    setShowChartTypeDropdown(false);
    
    // Open the selected dropdown
    switch(dropdown) {
      case 'timeframe':
        setShowTimeframeDropdown(prev => !prev);
        break;
      case 'chartType':
        setShowChartTypeDropdown(prev => !prev);
        break;
    }
  };
  
  // Get chart type icon
  const getChartTypeIcon = () => {
    const option = ChartTypeOptions.find(opt => opt.value === chartType);
    return option ? option.icon : <CandlestickChart className="h-4 w-4" />;
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
    setShowTimeframeDropdown(false);
  };
  
  // Handle document clicks to close dropdowns
  const handleDocumentClick = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setShowTimeframeDropdown(false);
      setShowChartTypeDropdown(false);
    }
  }, []);
  
  // Add document click listener
  useEffect(() => {
    if (showTimeframeDropdown || showChartTypeDropdown) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [showTimeframeDropdown, showChartTypeDropdown, handleDocumentClick]);
  
  // Apply a favorite timeframe
  const applyFavorite = (favorite: FavoriteTimeframe) => {
    setCustomTimeValue(favorite.value);
    setCustomTimeUnit(favorite.unit);
    setCustomTimeRange(favorite.range);
    applyCustomTimeframe();
    setShowTimeframeDropdown(false);
  };
  
  // Remove a favorite timeframe
  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
    toast.success('Favorite removed');
  };
  
  // Save current settings as a favorite
  const saveAsFavorite = () => {
    const newFavorite: FavoriteTimeframe = {
      id: `favorite-${Date.now()}`,
      name: `${customTimeValue}${customTimeUnit.charAt(0)} - ${customTimeRange.replace(/([0-9]+)([a-z]+)/, '$1 $2')}`,
      value: customTimeValue,
      unit: customTimeUnit,
      range: customTimeRange
    };
    
    setFavorites(prev => [...prev, newFavorite]);
    toast.success('Saved custom timeframe as favorite');
  };
  
  // Helper to convert custom timeframe to standard timeframe
  const getTimeframeFromCustom = (): Timeframe => {
    // Map preset selections to standard timeframes
    if (selectedPreset) {
      switch (selectedPreset) {
        case '1hour': return '1min';
        case '3hours': return '5min';
        case '6hours': return '15min';
        case '12hours': return '30min';
        case '1day': return '1hour';
        case '3days': return '4hour';
        case '5days': return '4hour';
        case '10days': return '1day';
        case '1month': return '1day';
        case '3months': return '1week';
        case '6months': return '1week';
        case '1year': return '1month';
        default: return '1day';
      }
    }
    
    // Map custom values to standard timeframes
    // This is simplified - in a real app you might need more complex logic
    if (customTimeUnit === 'minute') {
      if (customTimeValue <= 1) return '1min';
      else if (customTimeValue <= 5) return '5min';
      else if (customTimeValue <= 15) return '15min';
      else return '30min';
    } else if (customTimeUnit === 'hour') {
      if (customTimeValue <= 1) return '1hour';
      else return '4hour';
    } else if (customTimeUnit === 'day') {
      return '1day';
    } else if (customTimeUnit === 'week') {
      return '1week';
    } else {
      return '1month';
    }
  };
  
  // Helper function to display the timeframe in a user-friendly format
  const getTimeframeDisplayText = () => {
    if (selectedPreset) {
      return selectedPreset.replace(/([0-9]+)([a-z]+)/, '$1 $2');
    } else {
      return `${customTimeValue}${customTimeUnit.charAt(0)} - ${customTimeRange.replace(/([0-9]+)([a-z]+)/, '$1 $2')}`;
    }
  };
  
  // Function to apply the custom timeframe
  const applyCustomTimeframe = () => {
    const newTimeframe = getTimeframeFromCustom();
    handleTimeframeChange(newTimeframe);
    toast.success(`Applied timeframe: ${newTimeframe}`);
  };
  
  // These functions were duplicated and have been removed to fix the app.
  
  // Handle chart type change
  const handleChartTypeChange = (newChartType: ChartType) => {
    setChartType(newChartType);
    setShowChartTypeDropdown(false);
  };
  
  // Function to get timeframe display label
  const getTimeframeDisplayLabel = (): string => {
    const option = TimeframeOptions.find(t => t.value === timeframe);
    const base = option ? option.label : timeframe;
    
    // Add range information based on custom settings
    let rangeText = '';
    if (selectedPreset) {
      switch (selectedPreset) {
        case '1hour': rangeText = '1 Hour'; break;
        case '3hours': rangeText = '3 Hours'; break;
        case '6hours': rangeText = '6 Hours'; break;
        case '12hours': rangeText = '12 Hours'; break;
        case '1day': rangeText = '1 Day'; break;
        case '3days': rangeText = '3 Days'; break;
        case '5days': rangeText = '5 Days'; break;
        case '10days': rangeText = '10 Days'; break;
        case '1month': rangeText = '1 Month'; break;
        case '3months': rangeText = '3 Months'; break;
        case '6months': rangeText = '6 Months'; break;
        case '1year': rangeText = '1 Year'; break;
        default: rangeText = '1 Month'; // default
      }
    } else {
      // Use custom range
      switch (customTimeRange) {
        case '1hour': rangeText = '1 Hour'; break;
        case '1day': rangeText = '1 Day'; break;
        case '1week': rangeText = '1 Week'; break;
        case '1month': rangeText = '1 Month'; break;
        case '3month': rangeText = '3 Months'; break;
        case '6month': rangeText = '6 Months'; break;
        case '1year': rangeText = '1 Year'; break;
        case '5year': rangeText = '5 Years'; break;
        case 'all': rangeText = 'All Time'; break;
        default: rangeText = '1 Month'; // default
      }
    }
    
    return `${base} (${rangeText})`;
  };
  
  // Handle analyze chart click
  const handleAnalyzeClick = () => {
    if (onAnalyzeClicked) {
      onAnalyzeClicked(symbol, timeframe);
    }
  };
  
  // Capture chart screenshot and save to AI brain
  const captureChartScreenshot = async () => {
    toast.info("Capturing chart screenshot...");
    
    try {
      // Find the chart element
      const chartElement = document.getElementById(`chart-${symbol}`);
      
      if (chartElement) {
        // Use html2canvas to capture the chart
        const canvas = await html2canvas(chartElement, {
          backgroundColor: "#121212",
          scale: 2, // Higher quality
          logging: false,
          allowTaint: true,
          useCORS: true
        });
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              // Create file from blob
              const file = new File([blob], `chart_${symbol}_${timeframe}_${Date.now()}.png`, { type: "image/png" });
              
              // Create form data for upload
              const formData = new FormData();
              formData.append("file", file);
              formData.append("user_id", userId);
              
              // Upload to brain
              const response = await brain.upload_media(formData);
              const data = await response.json();
              
              // Show success message
              toast.success("Chart screenshot saved to AI brain");
              
              // Add context to brain
              await brain.add_to_brain({
                content: `Chart screenshot of ${symbol} on ${timeframe} timeframe`,
                source: "chart-screenshot",
                metadata: {
                  symbol,
                  timeframe,
                  chartType,
                  capturedAt: new Date().toISOString()
                },
                context: {
                  added_from: window.location.pathname
                }
              });
            } catch (error) {
              console.error("Error uploading to brain:", error);
              toast.error("Failed to save screenshot to AI brain");
            }
          } else {
            toast.error("Failed to capture screenshot");
          }
        }, "image/png");
      } else {
        toast.error("Chart element not found");
      }
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      toast.error("Failed to capture screenshot");
    }
  };
  
  // Capture chart recording and save to AI brain
  const toggleChartRecording = async () => {
    // If already recording, stop the recording
    if (isRecording) {
      if (recordingRef.current) {
        recordingRef.current.stop();
        setIsRecording(false);
        toast.info("Stopping recording...");
      }
      return;
    }
    
    // Start new recording
    toast.info("Starting chart recording...");
    setIsRecording(true);
    
    try {
      // Find the chart element
      const chartElement = document.getElementById(`chart-${symbol}`);
      
      if (!chartElement) {
        toast.error("Chart element not found");
        setIsRecording(false);
        return;
      }
      
      // Reset chunks
      chunksRef.current = [];
      
      // Use canvas capture + MediaRecorder approach
      const stream = chartElement.captureStream(30); // 30 FPS
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });
      
      // Store reference to recorder
      recordingRef.current = mediaRecorder;
      
      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        try {
          // Create blob from chunks
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          
          // Create file from blob
          const file = new File([blob], `chart_recording_${symbol}_${timeframe}_${Date.now()}.webm`, { 
            type: 'video/webm' 
          });
          
          // Create form data for upload
          const formData = new FormData();
          formData.append("file", file);
          formData.append("user_id", userId);
          
          // Upload to brain
          const response = await brain.upload_media(formData);
          const data = await response.json();
          
          // Show success message
          toast.success("Chart recording saved to AI brain");
          
          // Add context to brain
          await brain.add_to_brain({
            content: `Chart recording of ${symbol} on ${timeframe} timeframe`,
            source: "chart-recording",
            metadata: {
              symbol,
              timeframe,
              chartType,
              durationSeconds: mediaRecorder.videoBitsPerSecond ? Math.round(blob.size / (mediaRecorder.videoBitsPerSecond / 8)) : null,
              capturedAt: new Date().toISOString()
            },
            context: {
              added_from: window.location.pathname
            }
          });
        } catch (error) {
          console.error("Error uploading recording to brain:", error);
          toast.error("Failed to save recording to AI brain");
        } finally {
          // Clean up
          chunksRef.current = [];
          recordingRef.current = null;
        }
      };
      
      // Start recording, save data every second
      mediaRecorder.start(1000);
      
      // Auto-stop after 15 seconds to prevent massive files
      setTimeout(() => {
        if (recordingRef.current && recordingRef.current.state === 'recording') {
          recordingRef.current.stop();
          setIsRecording(false);
          toast.info("Recording automatically stopped after 15 seconds");
        }
      }, 15000);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
      setIsRecording(false);
    }
  };
  
  // Handle annotation added
  const handleAnnotationAdded = (annotation: Annotation) => {
    setChartAnnotations(prev => [...prev, annotation]);
    if (onAnnotationAdded) {
      onAnnotationAdded(annotation);
    }
    toast.success('Annotation added');
  };
  
  // Handle annotation removed
  const handleAnnotationRemoved = (annotationId: string) => {
    setChartAnnotations(prev => prev.filter(a => a.id !== annotationId));
    if (onAnnotationRemoved) {
      onAnnotationRemoved(annotationId);
    }
    toast.success('Annotation removed');
  };
  
  // Close dropdowns when clicking outside
  /* Original click outside handler removed to avoid duplication */
  
  // Calculate effective width
  const effectiveWidth = width || containerWidth || 800;
  
  return (
    <div 
      ref={containerRef}
      className="chart-container w-full overflow-hidden rounded-md border-2 border-gray-700 bg-[#121212] shadow-lg"
    >
      {/* Chart Area with integrated controls */}
      <div className="chart-area relative">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="flex flex-col items-center gap-3 bg-[#161626] border-2 border-gray-700 p-6 shadow-lg">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <span className="text-sm font-mono text-gray-300">LOADING MARKET DATA</span>
              <span className="text-xs text-gray-500">{symbol} - {timeframe}</span>
            </div>
          </div>
        ) : (
          <div id={`chart-${symbol}`}>
            <div id="chartcontrols" className="flex justify-between items-center p-3 border-b border-gray-700 bg-[#1A1A2A]">
              {/* Left side - Symbol and type */}
              <div className="flex items-center gap-0">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-primary hover:text-primary/80 border border-gray-700 h-8 px-2 flex items-center justify-center bg-[#1A1A2A] border-r-0"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Symbol search for changing stocks */}
                {onSymbolChange && (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className="w-48 h-8 text-sm bg-[#1A1A2A] border border-gray-700 rounded-sm px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 border-r-0"
                      placeholder="Enter symbol..."
                      defaultValue={symbol}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim().toUpperCase();
                          if (value && value !== symbol) {
                            onSymbolChange(value);
                          }
                        }
                      }}
                    />
                  </div>
                )}
                
                {/* Timeframe dropdown button */}
                <div className="relative">
                  <button 
                    onClick={(e) => handleSafeClick(e, 'timeframe')}
                    className="flex items-center gap-1.5 bg-[#1A1A2A] h-8 border border-gray-700 text-xs border-l-0 px-2.5"
                    data-dropdown="timeframe"
                  >
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                    <span>Time - {getTimeframeDisplayText()}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  
                  {/* Timeframe dropdown panel */}
                  {showTimeframeDropdown && (
                    <div className="absolute left-0 top-full mt-1 z-50 bg-[#161626] border border-gray-700 shadow-lg w-96 dropdown-panel">
                      <div className="p-4 flex">
                        {/* Left side - Custom interval */}
                        <div className="w-1/2 pr-2 border-r border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs text-gray-400 font-medium">CUSTOM INTERVAL</h4>
                            <button 
                              className="text-gray-400 hover:text-yellow-400 focus:outline-none transition-colors"
                              onClick={saveAsFavorite}
                              title="Save current settings as favorite"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex gap-2 mb-4">
                            {/* Numeric input */}
                            <div className="relative">
                              <input 
                                type="number" 
                                min="1" 
                                max="999"
                                className="w-16 h-9 bg-[#0D2030] border border-gray-700 rounded-sm text-white px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={customTimeValue}
                                onChange={(e) => setCustomTimeValue(parseInt(e.target.value) || 1)}
                              />
                              <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-gray-700">
                                <button 
                                  className="h-1/2 px-1 hover:bg-gray-700/30"
                                  onClick={() => setCustomTimeValue(prev => Math.min(999, prev + 1))}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <button 
                                  className="h-1/2 px-1 hover:bg-gray-700/30 border-t border-gray-700"
                                  onClick={() => setCustomTimeValue(prev => Math.max(1, prev - 1))}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Unit selector */}
                            <div className="relative flex-1">
                              <select
                                className="w-full h-9 appearance-none bg-[#0D2030] border border-gray-700 rounded-sm text-white px-2 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={customTimeUnit}
                                onChange={(e) => setCustomTimeUnit(e.target.value as TimeUnit)}
                              >
                                <option value="tick">Tick</option>
                                <option value="second">Second</option>
                                <option value="minute">Minute</option>
                                <option value="hour">Hour</option>
                                <option value="day">Day</option>
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                                <option value="year">Year</option>
                              </select>
                              <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center pr-2">
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                          
                          <h4 className="text-xs text-gray-400 mb-3 font-medium">RANGE</h4>
                          <div className="relative flex-1">
                            <select
                              className="w-full h-9 appearance-none bg-[#0D2030] border border-gray-700 rounded-sm text-white px-2 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={customTimeRange}
                              onChange={(e) => setCustomTimeRange(e.target.value as TimeRange)}
                            >
                              <option value="1hour">1 Hour</option>
                              <option value="1day">1 Day</option>
                              <option value="1week">1 Week</option>
                              <option value="1month">1 Month</option>
                              <option value="3month">3 Months</option>
                              <option value="6month">6 Months</option>
                              <option value="1year">1 Year</option>
                              <option value="5year">5 Years</option>
                              <option value="all">All</option>
                            </select>
                            <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center pr-2">
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Right side - Presets */}
                        <div className="w-1/2 pl-3">
                          <h4 className="text-xs text-gray-400 mb-3 font-medium">FAVORITES</h4>
                          <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto pr-1">
                            {favorites.length > 0 ? (
                              favorites.map(favorite => (
                                <div 
                                  key={favorite.id} 
                                  className="flex justify-between items-center text-left px-3 py-2 hover:bg-blue-900/20 text-gray-300 text-sm rounded-sm group"
                                >
                                  <button 
                                    className="flex-grow text-left"
                                    onClick={() => applyFavorite(favorite)}
                                  >
                                    {favorite.name}
                                  </button>
                                  <button 
                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
                                    onClick={() => removeFavorite(favorite.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="flex flex-col items-center justify-center p-4 text-gray-500 text-sm">
                                <Star className="h-5 w-5 mb-2" />
                                <p>No favorites yet</p>
                                <p className="text-xs">Click the star to add</p>
                              </div>
                            )}
                            
                            {/* No default presets - removed as requested */}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-700 p-3 flex justify-end gap-2">
                        <button 
                          className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium"
                          onClick={() => setShowTimeframeDropdown(false)}
                          data-close-dropdown="true"
                        >
                          CANCEL
                        </button>
                        <button 
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                          onClick={() => {
                            applyCustomTimeframe();
                            setShowTimeframeDropdown(false);
                          }}
                          data-close-dropdown="true"
                        >
                          APPLY
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Chart Type Selector */}
                <div className="relative">
                  <button 
                    onClick={(e) => handleSafeClick(e, 'chartType')}
                    className="flex items-center justify-center bg-[#1A1A2A] h-8 w-8 border border-gray-700 text-xs border-l-0"
                    data-dropdown="chartType"
                  >
                    {ChartTypeOptions.find(t => t.value === chartType)?.icon}
                  </button>
                  
                  {/* Chart Type dropdown panel */}
                  {showChartTypeDropdown && (
                    <div className="absolute left-0 top-full mt-1 z-50 bg-[#161626] border border-gray-700 shadow-lg w-48 dropdown-panel">
                      <div className="p-3 flex flex-col gap-2">
                        {ChartTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            className={`flex items-center gap-2 text-left p-2 text-sm hover:bg-blue-900/20 ${chartType === option.value ? 'text-blue-400' : 'text-gray-300'}`}
                            onClick={() => handleChartTypeChange(option.value)}
                          >
                            {option.icon}
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Screenshot/Snip button with neo-brutalist styling */}
                <button 
                  className="p-2 rounded-none bg-[#1A1A25] hover:bg-[#252535] border border-gray-700 flex items-center justify-center border-l-0"
                  onClick={captureChartScreenshot}
                  title="Capture chart screenshot and save to AI brain"
                >
                  <Scissors className="h-4 w-4" />
                </button>
                
                {/* Record button with neo-brutalist styling */}
                <button 
                  className={`p-2 rounded-none ${isRecording ? 'bg-red-600 border-red-500' : 'bg-[#1A1A25] hover:bg-[#252535] border-gray-700'} flex items-center justify-center border-l-0`}
                  onClick={toggleChartRecording}
                  title={isRecording ? "Stop recording" : "Record chart activity"}
                >
                  <Video className="h-4 w-4" />
                </button>
                
                {/* AI Analysis with neo-brutalist styling */}
                {onAnalyzeClicked && (
                  <button 
                    className="px-3 py-1.5 text-xs font-medium rounded-none bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 border border-red-500 border-l-0"
                    onClick={handleAnalyzeClick}
                  >
                    <Activity className="h-4 w-4" />
                    ANALYZE
                  </button>
                )}
              </div>
              
              {/* Right side - Chart controls - Now empty since all controls moved left */}
              <div></div>
            </div>
            <AmStockChart
              symbol={symbol}
              timeframe={timeframe as any}
              height={height}
              width={effectiveWidth}
              darkMode={darkMode}
              showControls={true}
              controlsContainerId="chartcontrols"
              selectedIndicators={selectedIndicators}
              annotations={chartAnnotations}
              isAnnotating={actualIsAnnotating}
              onAnnotationAdded={handleAnnotationAdded}
              onAnnotationRemoved={handleAnnotationRemoved}
              chartType={chartType}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartContainer;