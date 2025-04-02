/** Attachment */
export interface Attachment {
  /** Type */
  type: string;
  /** Title */
  title?: string | null;
  /** Url */
  url?: string | null;
  /** Preview */
  preview?: string | null;
}

/**
 * Bar
 * Model for a single OHLC bar
 */
export interface Bar {
  /** T */
  t: number;
  /** O */
  o: number;
  /** H */
  h: number;
  /** L */
  l: number;
  /** C */
  c: number;
  /** V */
  v: number;
  /** Vw */
  vw?: number | null;
  /** N */
  n?: number | null;
}

/** Body_upload_media */
export interface BodyUploadMedia {
  /**
   * File
   * @format binary
   */
  file: File;
  /**
   * User Id
   * @default "default"
   */
  user_id?: string;
  /** Category Ids */
  category_ids?: string | null;
}

/** BrainItem */
export interface BrainItem {
  /** Id */
  id: string;
  /** User Id */
  user_id: string;
  /** Content */
  content: string;
  /** Metadata */
  metadata: Record<string, any>;
  /** Source */
  source: string;
  /** Timestamp */
  timestamp: string;
}

/** BrainStoreStatusResponse */
export interface BrainStoreStatusResponse {
  /**
   * Total Items
   * Total number of items in the user's brain
   */
  total_items: number;
  /**
   * Sources
   * Count of items by source
   */
  sources: Record<string, number>;
  /**
   * Last Added
   * Timestamp of last added item
   */
  last_added?: string | null;
  /**
   * Size Kb
   * Approximate size of brain data in KB
   */
  size_kb: number;
  /**
   * User Id
   * User ID of the brain
   */
  user_id: string;
}

/** CategoriesResponse */
export interface CategoriesResponse {
  /** Categories */
  categories: Category[];
}

/** Category */
export interface Category {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Icon */
  icon?: string | null;
  /** Color */
  color?: string | null;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** CategoryCreate */
export interface CategoryCreate {
  /**
   * Name
   * @minLength 1
   * @maxLength 50
   */
  name: string;
  /** Description */
  description?: string | null;
  /** Icon */
  icon?: string | null;
  /** Color */
  color?: string | null;
}

/** CategoryResponse */
export interface CategoryResponse {
  category: Category;
}

/** CategoryUpdate */
export interface CategoryUpdate {
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** Icon */
  icon?: string | null;
  /** Color */
  color?: string | null;
}

/**
 * ChartAnalysisRequest
 * Request model for chart analysis
 */
export interface ChartAnalysisRequest {
  /** Chart Base64 */
  chart_base64: string;
  /** Chart Type */
  chart_type?: string | null;
  /** Chart Symbol */
  chart_symbol?: string | null;
  /** Timeframe */
  timeframe?: string | null;
  /** Indicators */
  indicators?: string[] | null;
  /** User Query */
  user_query?: string | null;
}

/**
 * ChartAnalysisResponse
 * Response model for chart analysis
 */
export interface ChartAnalysisResponse {
  /** Id */
  id: string;
  /** Analysis */
  analysis: string;
  /** Identified Patterns */
  identified_patterns?: string[] | null;
  /** Support Levels */
  support_levels?: number[] | null;
  /** Resistance Levels */
  resistance_levels?: number[] | null;
  /** Key Indicators */
  key_indicators?: Record<string, any> | null;
  /** Possible Scenarios */
  possible_scenarios?: string[] | null;
  /** Timestamp */
  timestamp: string;
}

/** ChatHistoryItem */
export interface ChatHistoryItem {
  /** Id */
  id: string;
  /** Title */
  title: string;
  /** Timestamp */
  timestamp: string;
  /** Preview */
  preview?: string | null;
}

/** ChatHistoryResponse */
export interface ChatHistoryResponse {
  /** Conversations */
  conversations: ChatHistoryItem[];
}

/** ChatRequest */
export interface ChatRequest {
  /** Message */
  message: string;
  /** Conversation Id */
  conversation_id?: string | null;
  /** User Id */
  user_id?: string | null;
  /**
   * Include Charts
   * @default false
   */
  include_charts?: boolean;
  /**
   * Include Market Data
   * @default false
   */
  include_market_data?: boolean;
}

/** ChatResponse */
export interface ChatResponse {
  /** Id */
  id: string;
  /** Content */
  content: string;
  /** Timestamp */
  timestamp: string;
  /** Attachments */
  attachments?: Attachment[] | null;
  /** Conversation Id */
  conversation_id: string;
}

/** DarkPoolLevels */
export interface DarkPoolLevels {
  /** Ticker */
  ticker: string;
  /** Price */
  price: string;
  /** Change */
  change: string;
  /** Changepercent */
  changePercent: string;
  /** Avgdailyvolume */
  avgDailyVolume: string;
  /** Date */
  date: string;
  /** Levels */
  levels: PriceLevel[];
}

/** DarkPoolResponse */
export interface DarkPoolResponse {
  /** Trades */
  trades: DarkPoolTrade[];
  levels?: DarkPoolLevels | null;
  /** Error */
  error?: string | null;
}

/** DarkPoolTrade */
export interface DarkPoolTrade {
  /** Id */
  id: number;
  /** Time */
  time: string;
  /** Date */
  date: string;
  /** Symbol */
  symbol: string;
  /** Shares */
  shares: string;
  /** Price */
  price: string;
  /** Value */
  value: string;
  /** Type */
  type: string;
}

/** FlowItem */
export interface FlowItem {
  /** Time */
  time: string;
  /** Ticker */
  ticker: string;
  /** Expiry */
  expiry: string;
  /** Callput */
  callPut: string;
  /** Spot */
  spot: string;
  /** Strike */
  strike: string;
  /** Otm */
  otm: string;
  /** Price */
  price: string;
  /** Size */
  size: number;
  /** Openinterest */
  openInterest: string;
  /** Impliedvol */
  impliedVol: string;
  /** Type */
  type: string;
  /** Premium */
  premium: string;
  /** Sector */
  sector: string;
  /** Heatscore */
  heatScore: number;
}

/** GammaDataPoint */
export interface GammaDataPoint {
  /** Strike */
  strike: number;
  /** Net Delta */
  net_delta: number;
  /** Net Gex */
  net_gex: number;
  /** Total Oi */
  total_oi: number;
  /** Call Oi */
  call_oi: number;
  /** Put Oi */
  put_oi: number;
  /** Call Gamma */
  call_gamma: number;
  /** Put Gamma */
  put_gamma: number;
  /** Percent Diff */
  percent_diff: number;
}

/** GammaExpiryData */
export interface GammaExpiryData {
  /** Expiry */
  expiry: string;
  /** Data */
  data: GammaDataPoint[];
  /** Summary */
  summary: Record<string, any>;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/**
 * HistoricalBarsResponse
 * Response model for historical bars
 */
export interface HistoricalBarsResponse {
  /** Symbol */
  symbol: string;
  /** Bars */
  bars: Bar[];
  /** Timeframe */
  timeframe: string;
  /** Status */
  status: string;
  /** Error */
  error?: string | null;
  /** Source */
  source?: string | null;
}

/** ItemCategoryAssignment */
export interface ItemCategoryAssignment {
  /** Item Id */
  item_id: string;
  /** Category Ids */
  category_ids: string[];
}

/** ItemCategoryResponse */
export interface ItemCategoryResponse {
  /** Item Id */
  item_id: string;
  /** Category Ids */
  category_ids: string[];
}

/** ItemsByCategoryResponse */
export interface ItemsByCategoryResponse {
  /** Category Id */
  category_id: string;
  /** Item Ids */
  item_ids: string[];
}

/** MediaProcessingResponse */
export interface MediaProcessingResponse {
  /**
   * Id
   * ID of the processed media item
   */
  id: string;
  /**
   * Status
   * Status of the processing operation
   */
  status: string;
  /**
   * Content Type
   * Type of media content processed
   */
  content_type: string;
  /**
   * Description
   * AI-generated description of the media
   */
  description?: string;
  /**
   * Metadata
   * Media metadata including dimensions, size, etc.
   */
  metadata: Record<string, any>;
}

/** OptionsFlowRequest */
export interface OptionsFlowRequest {
  /** Symbol */
  symbol: string;
  /**
   * Min Premium
   * @default 0
   */
  min_premium?: number | null;
  /**
   * Show Calls
   * @default true
   */
  show_calls?: boolean | null;
  /**
   * Show Puts
   * @default true
   */
  show_puts?: boolean | null;
  /**
   * Show Sweeps
   * @default true
   */
  show_sweeps?: boolean | null;
  /**
   * Show Blocks
   * @default true
   */
  show_blocks?: boolean | null;
}

/** OptionsFlowResponse */
export interface OptionsFlowResponse {
  /** Data */
  data: FlowItem[];
  /** Error */
  error?: string | null;
}

/** OptionsGammaRequest */
export interface OptionsGammaRequest {
  /** Symbol */
  symbol: string;
  /** Expiration Date */
  expiration_date?: string | null;
}

/** OptionsGammaResponse */
export interface OptionsGammaResponse {
  /** Symbol */
  symbol: string;
  /** Expirations */
  expirations: string[];
  /** Selected Expiry */
  selected_expiry: string;
  gamma_data: GammaExpiryData;
  /** Total Stats */
  total_stats: Record<string, any>;
  /** Error */
  error?: string | null;
}

/** OptionsSymbolRequest */
export interface OptionsSymbolRequest {
  /** Symbol */
  symbol: string;
}

/** PriceLevel */
export interface PriceLevel {
  /** Price */
  price: string;
  /** Volume */
  volume: string;
  /** Notional */
  notional: string;
  /** Percentage */
  percentage: string;
  /** Spread */
  spread: string;
  /** Ishighlighted */
  isHighlighted: boolean;
}

/** QueryResult */
export interface QueryResult {
  /**
   * Id
   * ID of the brain item
   */
  id: string;
  /**
   * Content
   * Content from the brain
   */
  content: string;
  /**
   * Source
   * Source of the content
   */
  source: string;
  /**
   * Metadata
   * Additional metadata
   */
  metadata: Record<string, any>;
  /**
   * Similarity
   * Similarity score (0-1)
   */
  similarity: number;
  /**
   * Created At
   * Timestamp of creation
   */
  created_at: string;
}

/** StockScreenerRequest */
export interface StockScreenerRequest {
  /**
   * Timeframe
   * @default "1w"
   */
  timeframe?: string | null;
  /** Exchange */
  exchange?: string | null;
  /** Market Cap Min */
  market_cap_min?: number | null;
  /** Market Cap Max */
  market_cap_max?: number | null;
  /** Price Min */
  price_min?: number | null;
  /** Price Max */
  price_max?: number | null;
  /** Sector */
  sector?: string | null;
  /** Industry */
  industry?: string | null;
  /** Country */
  country?: string | null;
  /** Volume Min */
  volume_min?: number | null;
  /** Float Min */
  float_min?: number | null;
  /** Float Max */
  float_max?: number | null;
  /** Dividend Min */
  dividend_min?: number | null;
  /** Dividend Max */
  dividend_max?: number | null;
  /** Is Etf */
  is_etf?: boolean | null;
  /** Has Options */
  has_options?: boolean | null;
  /**
   * Limit
   * @default 100
   */
  limit?: number | null;
  /**
   * Page
   * @default 1
   */
  page?: number | null;
  /**
   * Sort By
   * @default "ticker"
   */
  sort_by?: string | null;
  /**
   * Sort Direction
   * @default "asc"
   */
  sort_direction?: "asc" | "desc" | null;
  /** Tickers */
  tickers?: string[] | null;
  /** Rsi Min */
  rsi_min?: number | null;
  /** Rsi Max */
  rsi_max?: number | null;
  /** Sma Comparison */
  sma_comparison?: string | null;
  /** Macd Signal */
  macd_signal?: string | null;
  /** Bollinger Signal */
  bollinger_signal?: string | null;
  /** Keltner Signal */
  keltner_signal?: string | null;
  /** Stochastic Signal */
  stochastic_signal?: string | null;
  /** Trend */
  trend?: string | null;
}

/** StockScreenerResponse */
export interface StockScreenerResponse {
  /** Results */
  results: TickerDetails[];
  /** Total Results */
  total_results: number;
  /**
   * Page
   * @default 1
   */
  page?: number;
  /** Error */
  error?: string | null;
}

/** TickerDetails */
export interface TickerDetails {
  /** Ticker */
  ticker: string;
  /** Name */
  name: string;
  /** Sector */
  sector?: string | null;
  /** Industry */
  industry?: string | null;
  /** Country */
  country?: string | null;
  /** Market Cap */
  market_cap?: number | null;
  /** Price */
  price?: number | null;
  /** Change Percent */
  change_percent?: number | null;
  /** Volume */
  volume?: number | null;
  /** Avg Volume */
  avg_volume?: number | null;
  /** Pe Ratio */
  pe_ratio?: number | null;
  /** Dividend Yield */
  dividend_yield?: number | null;
  /**
   * Is Etf
   * @default false
   */
  is_etf?: boolean;
  /**
   * Has Options
   * @default false
   */
  has_options?: boolean;
  /** Rsi */
  rsi?: number | null;
  /** Sma20 */
  sma20?: number | null;
  /** Sma50 */
  sma50?: number | null;
  /** Sma Status */
  sma_status?: string | null;
  /** Macd */
  macd?: number | null;
  /** Macd Signal */
  macd_signal?: string | null;
  /** Bollinger Position */
  bollinger_position?: string | null;
  /** Keltner Position */
  keltner_position?: string | null;
  /** Stochastic */
  stochastic?: number | null;
  /** Stochastic Signal */
  stochastic_signal?: string | null;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/** AddToBrainRequest */
export interface AppApisBrainStoreAddToBrainRequest {
  /** User Id */
  user_id: string;
  /** Content */
  content: string;
  /**
   * Source
   * Source of the content, e.g., 'stock-chart', 'market-analysis', 'user-note'
   */
  source: string;
  /**
   * Metadata
   * Additional metadata about the content
   * @default {}
   */
  metadata?: Record<string, any> | null;
  /**
   * Context
   * Contextual information about where the content was added from
   * @default {}
   */
  context?: Record<string, any> | null;
}

/** AddToBrainResponse */
export interface AppApisBrainStoreAddToBrainResponse {
  /** Id */
  id: string;
  /** Status */
  status: string;
  /** Timestamp */
  timestamp: string;
  /** Message */
  message?: string | null;
}

/** QueryBrainRequest */
export interface AppApisBrainStoreQueryBrainRequest {
  /** User Id */
  user_id: string;
  /** Query */
  query: string;
  /**
   * Limit
   * @default 5
   */
  limit?: number | null;
}

/** QueryBrainResponse */
export interface AppApisBrainStoreQueryBrainResponse {
  /** Results */
  results: BrainItem[];
  /** Query */
  query: string;
}

/** AddToBrainRequest */
export interface AppApisTedBrainAddToBrainRequest {
  /**
   * Content
   * Content to add to the brain
   */
  content: string;
  /**
   * Source
   * Source of the content (e.g., chart, message, article)
   */
  source: string;
  /**
   * Metadata
   * Additional metadata
   */
  metadata?: Record<string, any>;
  /**
   * User Id
   * User ID who's adding the content
   * @default "default"
   */
  user_id?: string;
}

/** AddToBrainResponse */
export interface AppApisTedBrainAddToBrainResponse {
  /**
   * Id
   * ID of the added brain item
   */
  id: string;
  /**
   * Status
   * Status of the operation
   */
  status: string;
  /**
   * Embedding Id
   * ID of the embedding in the vector DB
   */
  embedding_id?: string | null;
}

/** QueryBrainRequest */
export interface AppApisTedBrainQueryBrainRequest {
  /**
   * Query
   * Query to search the brain
   */
  query: string;
  /**
   * Limit
   * Maximum number of results to return
   * @default 5
   */
  limit?: number;
  /**
   * User Id
   * User ID who's brain to query
   * @default "default"
   */
  user_id?: string;
}

/** QueryBrainResponse */
export interface AppApisTedBrainQueryBrainResponse {
  /**
   * Results
   * List of query results
   */
  results: QueryResult[];
  /**
   * Query
   * Original query
   */
  query: string;
}

export type CheckHealthData = HealthResponse;

export type GetOptionsChainData = any;

export type GetOptionsChainError = HTTPValidationError;

export type GetOptionsGammaData = OptionsGammaResponse;

export type GetOptionsGammaError = HTTPValidationError;

export type AnalyzeChartData = ChartAnalysisResponse;

export type AnalyzeChartError = HTTPValidationError;

export type AnalyzeChartStreamingData = any;

export type AnalyzeChartStreamingError = HTTPValidationError;

export type AddToBrainData = AppApisTedBrainAddToBrainResponse;

export type AddToBrainError = HTTPValidationError;

export type QueryBrainData = AppApisTedBrainQueryBrainResponse;

export type QueryBrainError = HTTPValidationError;

export type UploadMediaData = MediaProcessingResponse;

export type UploadMediaError = HTTPValidationError;

export interface BrainStoreStatusParams {
  /**
   * User Id
   * @default "default"
   */
  user_id?: string;
}

export type BrainStoreStatusData = BrainStoreStatusResponse;

export type BrainStoreStatusError = HTTPValidationError;

export interface ListCategoriesParams {
  /**
   * User Id
   * @default "default"
   */
  user_id?: string;
}

export type ListCategoriesData = CategoriesResponse;

export type ListCategoriesError = HTTPValidationError;

export interface CreateCategoryParams {
  /**
   * User Id
   * @default "default"
   */
  user_id?: string;
}

export type CreateCategoryData = CategoryResponse;

export type CreateCategoryError = HTTPValidationError;

export interface GetCategoryParams {
  /**
   * User Id
   * @default "default"
   */
  user_id?: string;
  /** Category Id */
  categoryId: string;
}

export type GetCategoryData = CategoryResponse;

export type GetCategoryError = HTTPValidationError;

export interface UpdateCategoryParams {
  /**
   * User Id
   * @default "default"
   */
  user_id?: string;
  /** Category Id */
  categoryId: string;
}

export type UpdateCategoryData = CategoryResponse;

export type UpdateCategoryError = HTTPValidationError;

export interface DeleteCategoryParams {
  /**
   * User Id
   * @default "default"
   */
  user_id?: string;
  /** Category Id */
  categoryId: string;
}

export type DeleteCategoryData = any;

export type DeleteCategoryError = HTTPValidationError;

export interface AssignItemToCategoriesParams {
  /**
   * User Id
   * @default "default"
   */
  user_id?: string;
}

export type AssignItemToCategoriesData = ItemCategoryResponse;

export type AssignItemToCategoriesError = HTTPValidationError;

export interface GetItemCategoriesParams {
  /**
   * User Id
   * @default "default"
   */
  user_id?: string;
  /** Item Id */
  itemId: string;
}

export type GetItemCategoriesData = ItemCategoryResponse;

export type GetItemCategoriesError = HTTPValidationError;

export interface GetItemsByCategoryParams {
  /**
   * User Id
   * @default "default"
   */
  user_id?: string;
  /** Category Id */
  categoryId: string;
}

export type GetItemsByCategoryData = ItemsByCategoryResponse;

export type GetItemsByCategoryError = HTTPValidationError;

export type GetOptionsFlowData = OptionsFlowResponse;

export type GetOptionsFlowError = HTTPValidationError;

export interface GetDarkPoolTradesParams {
  /**
   * Symbol
   * @default "AAPL"
   */
  symbol?: string;
  /**
   * Show Dark Pool
   * @default true
   */
  show_dark_pool?: boolean;
  /**
   * Show Block Trades
   * @default true
   */
  show_block_trades?: boolean;
  /**
   * Min Value
   * @default 0
   */
  min_value?: number;
  /**
   * Lookback Days
   * @default 7
   */
  lookback_days?: number;
}

export type GetDarkPoolTradesData = DarkPoolResponse;

export type GetDarkPoolTradesError = HTTPValidationError;

export type ScreenStocksData = StockScreenerResponse;

export type ScreenStocksError = HTTPValidationError;

export type ChatData = ChatResponse;

export type ChatError = HTTPValidationError;

export type ChatStreamData = any;

export type ChatStreamError = HTTPValidationError;

export interface GetConversationsParams {
  /** User Id */
  user_id: string;
}

export type GetConversationsData = ChatHistoryResponse;

export type GetConversationsError = HTTPValidationError;

export interface GetConversationParams {
  /** Conversation Id */
  conversationId: string;
}

export type GetConversationData = any;

export type GetConversationError = HTTPValidationError;

export interface DeleteConversationParams {
  /** User Id */
  user_id: string;
  /** Conversation Id */
  conversationId: string;
}

export type DeleteConversationData = any;

export type DeleteConversationError = HTTPValidationError;

export interface ResetAiParams {
  /** User Id */
  user_id: string;
}

export type ResetAiData = any;

export type ResetAiError = HTTPValidationError;

export interface DebugMarketDataParams {
  /**
   * Symbol
   * @default "SPY"
   */
  symbol?: string;
}

export type DebugMarketDataData = any;

export type DebugMarketDataError = HTTPValidationError;

/** Stocks */
export type AnalyzePortfolioPayload = Record<string, Record<string, any>>;

export type AnalyzePortfolioData = any;

export type AnalyzePortfolioError = HTTPValidationError;

export interface AnalyzeSymbolParams {
  /** Symbol */
  symbol: string;
}

export type AnalyzeSymbolData = any;

export type AnalyzeSymbolError = HTTPValidationError;

export type CheckHealthResult = any;

export interface GetHistoricalBarsParams {
  /** Symbol */
  symbol: string;
  /**
   * Timeframe
   * @default "1day"
   */
  timeframe?: string;
  /**
   * Limit
   * @default 200
   */
  limit?: number;
  /** From Date */
  from_date?: string | null;
  /** To Date */
  to_date?: string | null;
}

export type GetHistoricalBarsData = HistoricalBarsResponse;

export type GetHistoricalBarsError = HTTPValidationError;

export type AddToBrainStoreData = AppApisBrainStoreAddToBrainResponse;

export type AddToBrainStoreError = HTTPValidationError;

export type QueryBrainStoreData = AppApisBrainStoreQueryBrainResponse;

export type QueryBrainStoreError = HTTPValidationError;

export type BrainStoreStatusCheckData = any;
