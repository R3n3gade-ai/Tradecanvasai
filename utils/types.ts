export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
  chartData: number[];
}

export interface Sector {
  id: string;
  name: string;
  changePercent: number;
  chartData: number[];
}

export interface WatchlistItem extends Stock {}

export interface Watchlist {
  id: string;
  name: string;
  stocks: WatchlistItem[];
  isExpanded: boolean;
}

export interface PortfolioItem extends Stock {
  shares: number;
  value: number;
}

export interface UserPortfolio {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  items: PortfolioItem[];
  chartData: {
    labels: string[];
    data: number[];
  };
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export type CalendarEventType = 'earnings' | 'economic' | 'market' | 'internal';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format date string
  type: CalendarEventType;
  description?: string;
  ticker?: string; // For earnings events
  impact?: 'high' | 'medium' | 'low'; // For economic events
  url?: string; // For related information
}

export type TradeType = 'shares' | 'call_option' | 'put_option';

export interface TradeEntry {
  id: string;
  date: string; // ISO format date string
  ticker: string;
  type: TradeType;
  quantity: number;
  price: number; // Entry price
  amount: number; // Total amount spent
  exitPrice?: number; // Exit price if trade is closed
  pnl?: number; // Profit/Loss if trade is closed
  notes?: string;
  isOpen: boolean; // Whether the trade is still open
}
