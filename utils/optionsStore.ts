import { create } from 'zustand';
import polygonWebSocket, { PolygonOptionsEvent } from './polygonWebSocket';
import brain from 'brain';
import { getOptionsChain } from './optionsApi';

// Define types for option contracts and chain
export interface OptionContract {
  id: string;
  symbol: string;
  name: string;
  strike: number;
  expirationDate: string;
  contractType: 'call' | 'put';
  lastPrice: number;
  change: number;
  bidPrice: number;
  askPrice: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  inTheMoney: boolean;
  updated?: number; // Timestamp of last update
}

export interface OptionsChain {
  [expiration: string]: {
    calls: { [strike: string]: OptionContract };
    puts: { [strike: string]: OptionContract };
  };
}

// Define the interface for our options store
interface OptionsState {
  // State
  selectedSymbol: string;
  availableSymbols: string[];
  expirations: string[];
  strikes: number[];
  chain: OptionsChain;
  selectedExpiration: string | null;
  underlyingPrice: number | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedSymbol: (symbol: string) => void;
  setSelectedExpiration: (expiration: string | null) => void;
  fetchOptionsChain: (symbol: string, expiration?: string) => Promise<void>;
}

// Define interface for WebSocket status
interface WebSocketState {
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  wsStatusMessage: string;
  setWebSocketStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error', message?: string) => void;
  updateOptionsData: (event: PolygonOptionsEvent) => void;
}

// Create the options store with Polygon.io WebSocket integration
const useOptionsStore = create<OptionsState & WebSocketState>((set, get) => ({
  // Initial state with SPY as default
  selectedSymbol: 'SPY',
  availableSymbols: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD'],
  expirations: [],
  strikes: [],
  chain: {},
  selectedExpiration: null,
  underlyingPrice: null,
  isLoading: false,
  error: null,
  // Polygon WebSocket state
  wsStatus: 'disconnected' as 'connecting' | 'connected' | 'disconnected' | 'error',
  wsStatusMessage: '',
  
  // Actions
  setSelectedSymbol: (symbol) => {
    // If symbol changed, unsubscribe from old and subscribe to new
    const currentSymbol = get().selectedSymbol;
    if (currentSymbol !== symbol) {
      if (currentSymbol) {
        polygonWebSocket.unsubscribeFromSymbol(currentSymbol);
      }
      set({ selectedSymbol: symbol });
      get().fetchOptionsChain(symbol);
    }
  },
  
  setSelectedExpiration: (expiration) => {
    set({ selectedExpiration: expiration });
  },
  
  fetchOptionsChain: async (symbol, expiration) => {
    try {
      set({ isLoading: true, error: null });
      
      // Still initialize WebSocket for real-time updates if available
      // But the data will primarily come from the REST API now
      if (get().wsStatus !== 'connected' && get().wsStatus !== 'connecting') {
        initWebSocket();
      }
      
      // Set status to show we're refreshing data
      set({ wsStatus: 'connecting', wsStatusMessage: 'Fetching options data...' });
      
      // Make REST API call to get initial options chain data
      let data;
      try {
        data = await getOptionsChain(symbol);
      } catch (error) {
        console.error('Error fetching options chain:', error);
        data = {
          symbol,
          expirations: [],
          strikes: [],
          underlyingPrice: null,
          chain: {},
          error: 'Failed to fetch options data. Please try again later.'
        };
      }
      
      if (data.error) {
        set({ 
          isLoading: false, 
          error: data.error,
          chain: {},
          expirations: [],
          strikes: [],
          underlyingPrice: null,
          selectedExpiration: null
        });
        return;
      }
      
      // Subscribe to the symbol in the WebSocket (as a backup/supplement)
      polygonWebSocket.subscribeToSymbol(symbol);
      
      // Update state with API data
      set({
        isLoading: false,
        chain: data.chain || {},
        expirations: data.expirations || [],
        strikes: data.strikes || [],
        underlyingPrice: data.underlyingPrice,
        selectedExpiration: data.expirations?.[0] || null,
        wsStatus: 'connected',
        wsStatusMessage: 'Options data loaded'
      });
      
      // Set up periodic polling to refresh the data every 15 minutes
      // This ensures data stays fresh even if WebSockets don't work
      const pollInterval = setInterval(async () => {
        try {
          // Only update if this component is still mounted (store exists)
          if (get().selectedSymbol === symbol) {
            console.log('Polling for fresh options data...');
            set({ wsStatus: 'connecting', wsStatusMessage: 'Refreshing data...' });
            
            const freshData = await getOptionsChain(symbol);
            if (freshData.error) {
              console.error('Error in polling update:', freshData.error);
            } else {
              // Update only the chain data to avoid UI jumps
              set({
                chain: freshData.chain || get().chain,
                underlyingPrice: freshData.underlyingPrice || get().underlyingPrice,
                wsStatus: 'connected',
                wsStatusMessage: `Data refreshed at ${new Date().toLocaleTimeString()}`
              });
            }
          } else {
            // Symbol changed, clear this interval
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Error polling for options data:', error);
        }
      }, 900000); // 15 minutes (900,000 ms)
      
      // Return a cleanup function to clear the interval
      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error('Error fetching options chain:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to fetch options data. Please try again later.',
        chain: {},
        expirations: [],
        strikes: [],
        underlyingPrice: null,
        selectedExpiration: null
      });
    }
  },
  
  updateOptionsData: (event: PolygonOptionsEvent) => {
    // Process incoming WebSocket data and update the store
    // Polygon sends different event types (T = trade, Q = quote, etc.)
    if (!event.ev || !event.sym) {
      console.log('Invalid event format:', event);
      return;
    }
    
    console.log('Received options data:', event);
    
    // Parse the option symbol to extract information
    // Format is typically: O:TICKER[YYMMDD][C/P]STRIKE
    // Example: O:SPY230616C00410000
    try {
      const symbolPattern = /O:([A-Z]+)(\d{6})([CP])(\d+)/;
      const match = event.sym.match(symbolPattern);
      
      if (!match) {
        console.log('Could not parse option symbol:', event.sym);
        return;
      }
      
      const [_, ticker, dateStr, typeLetter, strikeStr] = match;
      
      // Format date string (YYMMDD) to expirationDate format (YYYY-MM-DD)
      const year = `20${dateStr.substring(0, 2)}`;
      const month = dateStr.substring(2, 4);
      const day = dateStr.substring(4, 6);
      const expirationDate = `${year}-${month}-${day}`;
      
      // Format strike price (divide by 1000 as many APIs use this format)
      const strike = parseInt(strikeStr) / 1000;
      
      // Determine contract type
      const contractType = typeLetter === 'C' ? 'call' : 'put';
      
      // Get current chain data
      const { chain, selectedExpiration } = get();
      
      // For now, we'll just log the parsed information
      console.log('Parsed option:', {
        ticker,
        expirationDate,
        strike,
        contractType,
        price: event.p,
        size: event.s,
        timestamp: event.t
      });
      
      // If we have a matching expiration date in our chain
      if (chain[expirationDate]) {
        // Get the current contract data
        const contracts = contractType === 'call' ? 
          chain[expirationDate].calls : 
          chain[expirationDate].puts;
        
        // Find matching strike price
        const strikeKey = strike.toString();
        
        if (contracts[strikeKey]) {
          // Update the contract with new data depending on event type
          if (event.ev === 'T') { // Trade event
            // Create a shallow copy of the chain to trigger state update
            const newChain = { ...chain };
            
            // Create a shallow copy of the expiration date's data
            newChain[expirationDate] = { 
              ...chain[expirationDate],
              [contractType === 'call' ? 'calls' : 'puts']: {
                ...contracts,
                [strikeKey]: {
                  ...contracts[strikeKey],
                  lastPrice: event.p || contracts[strikeKey].lastPrice,
                  volume: (contracts[strikeKey].volume || 0) + (event.s || 0),
                  updated: event.t, // Update timestamp
                }
              }
            };
            
            // Update the store with the new chain
            set({ chain: newChain });
          }
          // Add other event types as needed (quotes, etc.)
        }
      }
    } catch (error) {
      console.error('Error processing options data:', error);
    }
  },
  
  setWebSocketStatus: (status, message) => {
    set({
      wsStatus: status,
      wsStatusMessage: message || ''
    });
  }
}))

// Initialize WebSocket connection and handlers
function initWebSocket() {
  // Skip WebSocket initialization in certain environments
  if (typeof window !== 'undefined' && window.location.href.includes('databutton.com')) {
    console.warn('WebSocket connections are limited in this environment. Using REST API only.');
    useOptionsStore.getState().setWebSocketStatus('error', 'WebSocket not available in this environment. Using REST API only.');
    return;
  }
  // Set up message handler
  polygonWebSocket.onMessage((data) => {
    // Check if it's an array of events
    if (Array.isArray(data)) {
      data.forEach(event => {
        useOptionsStore.getState().updateOptionsData(event);
      });
    } else if ('error' in data) {
      console.error('WebSocket error:', data.error);
      useOptionsStore.getState().setWebSocketStatus('error', data.error);
    } else if ('status' in data && data.status === 'connected') {
      console.log('WebSocket connection confirmed with status message:', data.message);
      useOptionsStore.getState().setWebSocketStatus('connected', data.message);
    }
  });
  
  // Set up status handler
  polygonWebSocket.onStatusChange((status, message) => {
    useOptionsStore.getState().setWebSocketStatus(status, message);
  });
  
  // Connect to WebSocket
  polygonWebSocket.connect();
};

export default useOptionsStore;