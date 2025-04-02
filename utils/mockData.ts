import { Stock, Sector, Watchlist, Tool, UserPortfolio } from './types';

// Helper function to generate random chart data
const generateChartData = (points: number, trend: 'up' | 'down' | 'volatile' = 'volatile', min = 50, max = 150): number[] => {
  const data: number[] = [];
  let value = Math.floor(Math.random() * (max - min)) + min;
  
  for (let i = 0; i < points; i++) {
    if (trend === 'up') {
      value += Math.random() * 5 - 1; // More likely to go up
    } else if (trend === 'down') {
      value += Math.random() * 5 - 4; // More likely to go down
    } else {
      value += Math.random() * 10 - 5; // Equally likely to go up or down
    }
    
    // Prevent negative values
    value = Math.max(value, 0);
    data.push(value);
  }
  
  return data;
};

// Mock Stocks Data
export const mockStocks: Stock[] = [
  {
    id: '1',
    symbol: 'NVDA',
    name: 'Nvidia',
    price: 329.98,
    change: 7.65,
    changePercent: 2.4,
    marketCap: 823.7e9,
    volume: 45.2e6,
    chartData: generateChartData(30, 'up')
  },
  {
    id: '2',
    symbol: 'TSLA',
    name: 'Tesla',
    price: 177.50,
    change: -2.16,
    changePercent: -1.2,
    marketCap: 561.4e9,
    volume: 78.1e6,
    chartData: generateChartData(30, 'down')
  },
  {
    id: '3',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 182.40,
    change: 1.45,
    changePercent: 0.8,
    marketCap: 2.92e12,
    volume: 58.7e6,
    chartData: generateChartData(30, 'up')
  },
  {
    id: '4',
    symbol: 'MSFT',
    name: 'Microsoft',
    price: 415.50,
    change: 4.91,
    changePercent: 1.2,
    marketCap: 3.1e12,
    volume: 22.3e6,
    chartData: generateChartData(30, 'up')
  },
  {
    id: '5',
    symbol: 'GOOGL',
    name: 'Google',
    price: 174.35,
    change: -0.52,
    changePercent: -0.3,
    marketCap: 2.21e12,
    volume: 25.8e6,
    chartData: generateChartData(30, 'volatile')
  },
  {
    id: '6',
    symbol: 'AMZN',
    name: 'Amazon',
    price: 184.65,
    change: 1.1,
    changePercent: 0.6,
    marketCap: 1.92e12,
    volume: 32.4e6,
    chartData: generateChartData(30, 'up')
  },
  {
    id: '7',
    symbol: 'META',
    name: 'Meta Platforms',
    price: 498.20,
    change: 9.85,
    changePercent: 2.0,
    marketCap: 1.28e12,
    volume: 18.1e6,
    chartData: generateChartData(30, 'up')
  },
  {
    id: '8',
    symbol: 'NFLX',
    name: 'Netflix',
    price: 658.87,
    change: -4.52,
    changePercent: -0.68,
    marketCap: 286.3e9,
    volume: 4.2e6,
    chartData: generateChartData(30, 'volatile')
  },
  {
    id: '9',
    symbol: 'ADBE',
    name: 'Adobe',
    price: 476.30,
    change: -3.95,
    changePercent: -0.8,
    marketCap: 212.5e9,
    volume: 3.8e6,
    chartData: generateChartData(30, 'down')
  },
  {
    id: '10',
    symbol: 'CRM',
    name: 'Salesforce',
    price: 285.68,
    change: 1.42,
    changePercent: 0.5,
    marketCap: 276.9e9,
    volume: 5.6e6,
    chartData: generateChartData(30, 'up')
  }
];

// Mock Sectors Data
export const mockSectors: Sector[] = [
  {
    id: '1',
    name: 'Banking',
    changePercent: 3.2,
    chartData: generateChartData(20, 'up')
  },
  {
    id: '2',
    name: 'Energy',
    changePercent: 1.8,
    chartData: generateChartData(20, 'up')
  },
  {
    id: '3',
    name: 'Healthcare',
    changePercent: -0.7,
    chartData: generateChartData(20, 'down')
  },
  {
    id: '4',
    name: 'Technology',
    changePercent: 2.1,
    chartData: generateChartData(20, 'up')
  },
  {
    id: '5',
    name: 'Automotive',
    changePercent: -1.5,
    chartData: generateChartData(20, 'down')
  },
  {
    id: '6',
    name: 'Telecom',
    changePercent: 0.9,
    chartData: generateChartData(20, 'volatile')
  },
  {
    id: '7',
    name: 'Media',
    changePercent: -0.3,
    chartData: generateChartData(20, 'volatile')
  },
  {
    id: '8',
    name: 'Retail',
    changePercent: 1.4,
    chartData: generateChartData(20, 'up')
  }
];

// Mock Watchlists
export const mockWatchlists: Watchlist[] = [
  {
    id: '1',
    name: 'Software',
    isExpanded: true,
    stocks: [
      { ...mockStocks.find(s => s.symbol === 'MSFT')!, id: 'w1-1' },
      { ...mockStocks.find(s => s.symbol === 'ADBE')!, id: 'w1-2' },
      { ...mockStocks.find(s => s.symbol === 'CRM')!, id: 'w1-3' }
    ]
  },
  {
    id: '2',
    name: 'Green energy',
    isExpanded: false,
    stocks: [
      { 
        id: 'w2-1', 
        symbol: 'ENPH', 
        name: 'Enphase Energy', 
        price: 109.50, 
        change: 2.78, 
        changePercent: 2.6, 
        chartData: generateChartData(30, 'up') 
      },
      { 
        id: 'w2-2', 
        symbol: 'SEDG', 
        name: 'SolarEdge', 
        price: 54.82, 
        change: 1.24, 
        changePercent: 2.3, 
        chartData: generateChartData(30, 'up') 
      }
    ]
  },
  {
    id: '3',
    name: 'Healthcare trending',
    isExpanded: false,
    stocks: [
      { 
        id: 'w3-1', 
        symbol: 'MRNA', 
        name: 'Moderna', 
        price: 109.76, 
        change: -2.35, 
        changePercent: -2.1, 
        chartData: generateChartData(30, 'down') 
      },
      { 
        id: 'w3-2', 
        symbol: 'PFE', 
        name: 'Pfizer', 
        price: 27.45, 
        change: 0.32, 
        changePercent: 1.2, 
        chartData: generateChartData(30, 'volatile') 
      }
    ]
  },
  {
    id: '4',
    name: 'High-risk high-return',
    isExpanded: false,
    stocks: [
      { 
        id: 'w4-1', 
        symbol: 'RIVN', 
        name: 'Rivian', 
        price: 12.85, 
        change: -0.45, 
        changePercent: -3.4, 
        chartData: generateChartData(30, 'down') 
      },
      { 
        id: 'w4-2', 
        symbol: 'PLTR', 
        name: 'Palantir', 
        price: 22.48, 
        change: 0.86, 
        changePercent: 4.0, 
        chartData: generateChartData(30, 'volatile') 
      }
    ]
  }
];

// Mock Tools
export const mockTools: Tool[] = [
  { id: '1', name: 'Charts', icon: 'BarChart2', description: 'Advanced technical analysis charts' },
  { id: '2', name: 'Events', icon: 'Calendar', description: 'Earnings and market events calendar' },
  { id: '3', name: 'Intraday', icon: 'Activity', description: 'Real-time intraday trading patterns' },
  { id: '4', name: 'IPO', icon: 'TrendingUp', description: 'Upcoming IPOs and recent listings' },
  { id: '5', name: 'Strategies', icon: 'PieChart', description: 'Pre-built trading strategies' },
  { id: '6', name: 'Backtesting', icon: 'Settings', description: 'Test strategies against historical data' }
];

// Mock Portfolio Data
export const mockPortfolio: UserPortfolio = {
  totalValue: 5837.45,
  dailyChange: 142.32,
  dailyChangePercent: 2.5,
  items: [
    {
      ...mockStocks.find(s => s.symbol === 'AAPL')!,
      id: 'p-1',
      shares: 5,
      value: 912.00
    },
    {
      ...mockStocks.find(s => s.symbol === 'MSFT')!,
      id: 'p-2',
      shares: 3,
      value: 1246.50
    },
    {
      ...mockStocks.find(s => s.symbol === 'TSLA')!,
      id: 'p-3',
      shares: 8,
      value: 1420.00
    },
    {
      ...mockStocks.find(s => s.symbol === 'AMZN')!,
      id: 'p-4',
      shares: 4,
      value: 738.60
    },
    {
      ...mockStocks.find(s => s.symbol === 'NVDA')!,
      id: 'p-5',
      shares: 4.5,
      value: 1484.91
    }
  ],
  chartData: {
    labels: ['1d', '5d', '1m', '3m', '6m', '1y', '5y'],
    data: generateChartData(7, 'up', 5000, 6000)
  }
};

// Helper function to format currency
export const formatCurrency = (value: number, options?: Intl.NumberFormatOptions): string => {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };

  const mergedOptions = { ...defaultOptions, ...options };
  return new Intl.NumberFormat('en-US', mergedOptions).format(value);
};

// Helper function to format percentage
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero'
  }).format(value / 100);
};

// Helper function to format large numbers with abbreviations (K, M, B, T)
export const formatMarketCap = (value: number): string => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

// Mock Calendar Events Data
export const mockCalendarEvents = [
  {
    id: 'event-1',
    title: 'AAPL Earnings',
    date: '2025-03-07T18:30:00.000Z',
    type: 'earnings',
    description: 'Apple Inc. Q1 2025 Earnings Release',
    ticker: 'AAPL',
    url: '#'
  },
  {
    id: 'event-2',
    title: 'Fed Interest Rate Decision',
    date: '2025-03-10T14:00:00.000Z',
    type: 'economic',
    description: 'Federal Reserve interest rate decision and statement',
    impact: 'high',
    url: '#'
  },
  {
    id: 'event-3',
    title: 'CPI Data Release',
    date: '2025-03-12T08:30:00.000Z',
    type: 'economic',
    description: 'US Consumer Price Index for February 2025',
    impact: 'high',
    url: '#'
  },
  {
    id: 'event-4',
    title: 'MSFT Earnings',
    date: '2025-03-14T20:00:00.000Z',
    type: 'earnings',
    description: 'Microsoft Corporation Q1 2025 Earnings Release',
    ticker: 'MSFT',
    url: '#'
  },
  {
    id: 'event-5',
    title: 'MarketPulse Webinar: AI Trading',
    date: '2025-03-15T16:00:00.000Z',
    type: 'internal',
    description: 'Learn how to use AI for trading with our expert panel',
    url: '#'
  },
  {
    id: 'event-6',
    title: 'Market Holiday - Good Friday',
    date: '2025-04-03T00:00:00.000Z',
    type: 'market',
    description: 'US Markets Closed for Good Friday',
    url: '#'
  }
];

// Mock Trade Journal Entries
export const mockTradeEntries = [
  {
    id: 'trade-1',
    date: '2025-03-05T10:30:00.000Z',
    ticker: 'NVDA',
    type: 'shares',
    quantity: 10,
    price: 329.98,
    amount: 3299.80,
    exitPrice: 335.42,
    pnl: 544.0,
    notes: 'Bought on technical breakout, sold after earnings beat',
    isOpen: false
  },
  {
    id: 'trade-2',
    date: '2025-03-06T09:45:00.000Z',
    ticker: 'TSLA',
    type: 'put_option',
    quantity: 2,
    price: 4.75,
    amount: 950.0,
    notes: 'Bearish thesis based on production numbers',
    isOpen: true
  },
  {
    id: 'trade-3',
    date: '2025-03-06T14:15:00.000Z',
    ticker: 'AAPL',
    type: 'call_option',
    quantity: 3,
    price: 2.35,
    amount: 705.0,
    notes: 'Bullish ahead of product launch',
    isOpen: true
  }
];

// Mock News Data
export const mockNews = [
  {
    id: '1',
    title: 'Fed signals potential rate cuts in upcoming meeting as inflation eases',
    source: 'Financial Times',
    date: '2h ago',
    url: '#',
    sentiment: 'positive'
  },
  {
    id: '2',
    title: 'Nvidia shares surge after beating earnings expectations for the fourth consecutive quarter',
    source: 'Wall Street Journal',
    date: '4h ago',
    url: '#',
    sentiment: 'positive'
  },
  {
    id: '3',
    title: 'Oil prices drop amid concerns over global demand slowdown',
    source: 'Bloomberg',
    date: '6h ago',
    url: '#',
    sentiment: 'negative'
  },
  {
    id: '4',
    title: 'U.S. housing market shows signs of cooling as mortgage rates remain high',
    source: 'CNBC',
    date: '8h ago',
    url: '#',
    sentiment: 'neutral'
  },
  {
    id: '5',
    title: 'Treasury yields fall as investors await economic data',
    source: 'Reuters',
    date: '10h ago',
    url: '#',
    sentiment: 'neutral'
  }
];
