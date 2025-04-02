import brain from 'brain';

// Define types for options chain API responses
export interface OptionsChainResponse {
  symbol: string;
  expirations: string[];
  strikes: number[];
  underlyingPrice: number | null;
  chain: Record<string, {
    calls: Record<string, OptionContract>;
    puts: Record<string, OptionContract>;
  }>;
  error?: string;
}

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
  updated?: number;
}

// Helper function to get options chain for a symbol
export async function getOptionsChain(symbol: string): Promise<OptionsChainResponse> {
  try {
    const response = await brain.get_options_chain({ symbol });
    const data = await response.json();
    
    // Check if the response contains actual data
    if (!data || !data.expirations || data.expirations.length === 0) {
      console.warn('API returned empty data, using fallback data');
      return getOptionsFallbackData(symbol);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching options chain:', error);
    return getOptionsFallbackData(symbol);
  }
}

// Provide fallback data when the API is unavailable
function getOptionsFallbackData(symbol: string): OptionsChainResponse {
  // Current date for expiration calculation
  const now = new Date();
  
  // Create fallback expirations (current month + next 2 months)
  const expirations = [];
  for (let i = 0; i < 3; i++) {
    const expDate = new Date(now.getFullYear(), now.getMonth() + i, 15);
    expirations.push(expDate.toISOString().split('T')[0]);
  }
  
  // Base price based on the symbol
  let basePrice = 400; // Default for SPY
  if (symbol === 'QQQ') basePrice = 350;
  if (symbol === 'AAPL') basePrice = 150;
  if (symbol === 'MSFT') basePrice = 300;
  if (symbol === 'GOOGL') basePrice = 130;
  if (symbol === 'AMZN') basePrice = 170;
  if (symbol === 'NVDA') basePrice = 700;
  
  // Generate strikes around the base price
  const strikes = [];
  for (let i = -10; i <= 10; i++) {
    strikes.push(Math.round(basePrice + (i * basePrice * 0.025)));
  }
  
  // Create empty chain structure
  const chain: Record<string, {
    calls: Record<string, OptionContract>;
    puts: Record<string, OptionContract>;
  }> = {};
  
  // Populate chain with mock data
  expirations.forEach(exp => {
    const expObj = {
      calls: {} as Record<string, OptionContract>,
      puts: {} as Record<string, OptionContract>
    };
    
    strikes.forEach(strike => {
      const strikeStr = strike.toString();
      const daysToExp = Math.round((new Date(exp).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const iv = 0.2 + (Math.random() * 0.1);
      
      // Generate mock option data
      expObj.calls[strikeStr] = createMockOption(symbol, strike, exp, 'call', basePrice, iv, daysToExp);
      expObj.puts[strikeStr] = createMockOption(symbol, strike, exp, 'put', basePrice, iv, daysToExp);
    });
    
    chain[exp] = expObj;
  });
  
  return {
    symbol,
    expirations,
    strikes,
    underlyingPrice: basePrice,
    chain,
    error: undefined
  };
}

// Helper to create mock option contracts
function createMockOption(
  symbol: string, 
  strike: number, 
  expDate: string, 
  type: 'call' | 'put', 
  underlyingPrice: number,
  iv: number,
  daysToExp: number
): OptionContract {
  const inTheMoney = type === 'call' ? strike < underlyingPrice : strike > underlyingPrice;
  const distanceFromStrike = Math.abs(strike - underlyingPrice) / underlyingPrice;
  
  // Calculate a somewhat realistic price based on ITM/OTM status
  let price = 0;
  if (inTheMoney) {
    price = type === 'call' ? underlyingPrice - strike : strike - underlyingPrice;
    price = Math.max(price, 0.1) + (iv * underlyingPrice * Math.sqrt(daysToExp / 365));
  } else {
    price = (iv * underlyingPrice * Math.sqrt(daysToExp / 365)) * Math.exp(-distanceFromStrike * 2);
    price = Math.max(price, 0.01);
  }
  
  const volume = Math.round(Math.random() * 1000) * (1 - distanceFromStrike);
  const openInterest = Math.round(volume * (2 + Math.random() * 8));
  
  return {
    id: `${symbol}-${expDate}-${type}-${strike}`,
    symbol: `${symbol}${expDate.replace(/-/g, '')}${type === 'call' ? 'C' : 'P'}${strike}`,
    name: `${symbol} ${expDate} ${strike} ${type.toUpperCase()}`,
    strike,
    expirationDate: expDate,
    contractType: type,
    lastPrice: price,
    change: (Math.random() * 0.2 - 0.1) * price,
    bidPrice: price * 0.95,
    askPrice: price * 1.05,
    volume,
    openInterest,
    impliedVolatility: iv * 100, // Convert to percentage
    inTheMoney
  };
}