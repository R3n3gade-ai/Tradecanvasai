import { API_URL } from 'app';

// Types for Polygon API responses
export interface PolygonBar {
  t: number;        // Timestamp (Unix MS)
  o: number;        // Open price
  h: number;        // High price
  l: number;        // Low price
  c: number;        // Close price
  v: number;        // Volume
  vw?: number;      // Volume weighted price
  n?: number;       // Number of trades
}

export interface HistoricalBarsResponse {
  symbol: string;      // The ticker symbol
  bars: PolygonBar[];  // The actual bar data
  timeframe: string;   // Timeframe of the data
  status: string;      // Success or error
  error?: string;      // Error message if status is error
  source?: string;     // Source of the data (polygon, mock, etc.)
}

// Timeframe types
export type Timeframe = 
  | '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour'
  | '1day' | '1week' | '1month';

export type ChartType = 'candlestick' | 'line' | 'bar' | 'area';

export interface ChartData {
  bars: PolygonBar[];
  symbol: string;
  timeframe: Timeframe;
  lastUpdated: Date;
}

// Cache for historical data to minimize API requests
const dataCache: Record<string, ChartData> = {};

// Mock data for development/testing when API is unavailable
const generateMockData = (symbol: string, count: number = 200): PolygonBar[] => {
  const bars: PolygonBar[] = [];
  let basePrice = symbol === 'SPY' ? 450 : symbol === 'AAPL' ? 180 : 100;
  const volatility = 0.02; // 2% price movement
  
  // Create a mock price curve with some randomness
  const now = new Date();
  // Set to start of day
  now.setHours(0, 0, 0, 0);
  
  let time = now.getTime() - (count * 24 * 60 * 60 * 1000); // Start count days ago
  
  for (let i = 0; i < count; i++) {
    // Add some randomness to the price
    const changePercent = (Math.random() - 0.5) * volatility;
    const priceChange = basePrice * changePercent;
    
    // Calculate OHLC values
    const open = basePrice;
    const close = basePrice + priceChange;
    const high = Math.max(open, close) + (Math.random() * basePrice * 0.01); // Add up to 1%
    const low = Math.min(open, close) - (Math.random() * basePrice * 0.01); // Subtract up to 1%
    
    // Random volume between 100k and 1M
    const volume = Math.floor(Math.random() * 900000) + 100000;
    
    // Add the bar
    bars.push({
      t: time,
      o: parseFloat(open.toFixed(2)),
      h: parseFloat(high.toFixed(2)),
      l: parseFloat(low.toFixed(2)),
      c: parseFloat(close.toFixed(2)),
      v: volume
    });
    
    // Update base price for next iteration
    basePrice = close;
    
    // Increment time
    time += 24 * 60 * 60 * 1000; // Add one day
  }
  
  return bars;
};

const makePolygonRequest = async <T>(endpoint: string, params: Record<string, any> = {}): Promise<T> => {
  try {
    // Add any additional query parameters
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    // Construct full URL
    const queryString = queryParams.toString();
    const url = `${API_URL}${endpoint}${ queryString ? `?${queryString}` : '' }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Error making API request to ${endpoint}:`, error);
    throw error;
  }
};

// Helper to get the multiplier and timespan from our timeframe format
const parseTimeframe = (timeframe: Timeframe): { multiplier: number, timespan: string } => {
  switch (timeframe) {
    case '1min': return { multiplier: 1, timespan: 'minute' };
    case '5min': return { multiplier: 5, timespan: 'minute' };
    case '15min': return { multiplier: 15, timespan: 'minute' };
    case '30min': return { multiplier: 30, timespan: 'minute' };
    case '1hour': return { multiplier: 1, timespan: 'hour' };
    case '4hour': return { multiplier: 4, timespan: 'hour' };
    case '1day': return { multiplier: 1, timespan: 'day' };
    case '1week': return { multiplier: 1, timespan: 'week' };
    case '1month': return { multiplier: 1, timespan: 'month' };
    default: return { multiplier: 1, timespan: 'day' };
  }
};

// Main service object
export const PolygonDataService = {
  /**
   * Get historical bars/candles for a symbol
   */
  getHistoricalBars: async (
    symbol: string, 
    timeframe: Timeframe = '1day',
    limit: number = 200
  ): Promise<HistoricalBarsResponse> => {
    try {
      // Check cache first
      const cacheKey = `${symbol}-${timeframe}`;
      const cachedData = dataCache[cacheKey];
      const cacheValidityMs = 5 * 60 * 1000; // 5 minutes
      
      if (cachedData && 
          (new Date().getTime() - cachedData.lastUpdated.getTime()) < cacheValidityMs) {
        console.log('Using cached data for', cacheKey);
        return {
          symbol,
          bars: cachedData.bars,
          timeframe,
          status: 'success',
          source: 'cache'
        };
      }

      // Attempt to get data from our API
      try {
        const endpoint = '/historical-bars';
        const { multiplier, timespan } = parseTimeframe(timeframe);
        
        const response = await makePolygonRequest<HistoricalBarsResponse>(endpoint, {
          symbol,
          timeframe,
          limit
        });

        // Cache the result
        if (response.status === 'success') {
          dataCache[cacheKey] = {
            bars: response.bars,
            symbol,
            timeframe,
            lastUpdated: new Date()
          };
        }

        return response;
      } catch (apiError) {
        console.error('API error, falling back to mock data:', apiError);
        // Fall back to mock data
        const mockBars = generateMockData(symbol, limit);
        
        // Cache mock data too to avoid repeated fallbacks
        dataCache[cacheKey] = {
          bars: mockBars,
          symbol,
          timeframe,
          lastUpdated: new Date()
        };
        
        return {
          symbol,
          bars: mockBars,
          timeframe,
          status: 'success',
          source: 'mock'
        };
      }
    } catch (error) {
      console.error('Error getting historical bars:', error);
      return {
        symbol,
        bars: [],
        timeframe,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  
  /**
   * Clear the cache for a specific symbol or all symbols
   */
  clearCache: (symbol?: string) => {
    if (symbol) {
      // Clear only for the specified symbol
      Object.keys(dataCache).forEach(key => {
        if (key.startsWith(`${symbol}-`)) {
          delete dataCache[key];
        }
      });
    } else {
      // Clear entire cache
      Object.keys(dataCache).forEach(key => {
        delete dataCache[key];
      });
    }
  }
};
