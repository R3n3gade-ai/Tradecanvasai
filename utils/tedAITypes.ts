// TED AI Types

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
}

export interface Attachment {
  type: 'chart' | 'link' | 'image';
  title?: string;
  url?: string;
  preview?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  last_updated: string;
}

export interface ConversationListItem {
  id: string;
  title: string;
  timestamp: string;
  preview?: string;
}

export interface TedAIRequest {
  message: string;
  conversation_id?: string;
  user_id?: string;
  include_charts?: boolean;
  include_market_data?: boolean;
}

export interface TedAIResponse {
  id: string;
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  conversation_id: string;
}

export interface MarketAnalysis {
  analysis: {
    overall: string;
    symbols: Record<string, SymbolAnalysis>;
  };
  market_data: Record<string, MarketData>;
  charts: Attachment[];
}

export interface SymbolAnalysis {
  current_price: number;
  daily_change: number;
  daily_change_percent: number;
  performance: 'positive' | 'negative' | 'neutral';
  support_levels: number[];
  resistance_levels: number[];
  rsi: number;
  recommendation: 'buy' | 'sell' | 'hold';
}

export interface MarketData {
  price: number;
  change: number;
  change_percent: number;
}

export interface ChartAnalysisRequest {
  chart_base64: string;
  chart_type?: string;
  chart_symbol?: string;
  timeframe?: string;
  indicators?: string[];
  user_query?: string;
}

export interface ChartAnalysisResponse {
  id: string;
  analysis: string;
  identified_patterns?: string[];
  support_levels?: number[];
  resistance_levels?: number[];
  key_indicators?: Record<string, any>;
  possible_scenarios?: string[];
  timestamp: string;
}

export interface PortfolioPosition {
  symbol: string;
  shares: number;
  cost_basis: number;
  current_price: number;
  current_value: number;
  gain_loss: number;
  gain_loss_percent: number;
  allocation: number;
}

export interface PortfolioAnalysis {
  total_value: number;
  total_gain_loss: number;
  total_gain_loss_percent: number;
  positions: PortfolioPosition[];
  risk_analysis: {
    overall_risk: string;
    sector_concentration: string;
    diversification_score: number;
    volatility: string;
    recommendations: string[];
  };
}
