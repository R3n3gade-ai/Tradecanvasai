import {
  AddToBrainData,
  AddToBrainError,
  AddToBrainStoreData,
  AddToBrainStoreError,
  AnalyzeChartData,
  AnalyzeChartError,
  AnalyzeChartStreamingData,
  AnalyzeChartStreamingError,
  AnalyzePortfolioData,
  AnalyzePortfolioError,
  AnalyzePortfolioPayload,
  AnalyzeSymbolData,
  AnalyzeSymbolError,
  AnalyzeSymbolParams,
  AppApisBrainStoreAddToBrainRequest,
  AppApisBrainStoreQueryBrainRequest,
  AppApisTedBrainAddToBrainRequest,
  AppApisTedBrainQueryBrainRequest,
  AssignItemToCategoriesData,
  AssignItemToCategoriesError,
  AssignItemToCategoriesParams,
  BodyUploadMedia,
  BrainStoreStatusCheckData,
  BrainStoreStatusData,
  BrainStoreStatusError,
  BrainStoreStatusParams,
  CategoryCreate,
  CategoryUpdate,
  ChartAnalysisRequest,
  ChatData,
  ChatError,
  ChatRequest,
  ChatStreamData,
  ChatStreamError,
  CheckHealthData,
  CheckHealthResult,
  CreateCategoryData,
  CreateCategoryError,
  CreateCategoryParams,
  DebugMarketDataData,
  DebugMarketDataError,
  DebugMarketDataParams,
  DeleteCategoryData,
  DeleteCategoryError,
  DeleteCategoryParams,
  DeleteConversationData,
  DeleteConversationError,
  DeleteConversationParams,
  GetCategoryData,
  GetCategoryError,
  GetCategoryParams,
  GetConversationData,
  GetConversationError,
  GetConversationParams,
  GetConversationsData,
  GetConversationsError,
  GetConversationsParams,
  GetDarkPoolTradesData,
  GetDarkPoolTradesError,
  GetDarkPoolTradesParams,
  GetHistoricalBarsData,
  GetHistoricalBarsError,
  GetHistoricalBarsParams,
  GetItemCategoriesData,
  GetItemCategoriesError,
  GetItemCategoriesParams,
  GetItemsByCategoryData,
  GetItemsByCategoryError,
  GetItemsByCategoryParams,
  GetOptionsChainData,
  GetOptionsChainError,
  GetOptionsFlowData,
  GetOptionsFlowError,
  GetOptionsGammaData,
  GetOptionsGammaError,
  ItemCategoryAssignment,
  ListCategoriesData,
  ListCategoriesError,
  ListCategoriesParams,
  OptionsFlowRequest,
  OptionsGammaRequest,
  OptionsSymbolRequest,
  QueryBrainData,
  QueryBrainError,
  QueryBrainStoreData,
  QueryBrainStoreError,
  ResetAiData,
  ResetAiError,
  ResetAiParams,
  ScreenStocksData,
  ScreenStocksError,
  StockScreenerRequest,
  UpdateCategoryData,
  UpdateCategoryError,
  UpdateCategoryParams,
  UploadMediaData,
  UploadMediaError,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:polygon_options
   * @name get_options_chain
   * @summary Get Options Chain
   * @request POST:/routes/options/chain
   */
  get_options_chain = (data: OptionsSymbolRequest, params: RequestParams = {}) =>
    this.request<GetOptionsChainData, GetOptionsChainError>({
      path: `/routes/options/chain`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:options_gamma
   * @name get_options_gamma
   * @summary Get Options Gamma
   * @request POST:/routes/options/gamma
   */
  get_options_gamma = (data: OptionsGammaRequest, params: RequestParams = {}) =>
    this.request<GetOptionsGammaData, GetOptionsGammaError>({
      path: `/routes/options/gamma`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Analyze a chart image using Gemini Vision API
   *
   * @tags dbtn/module:chart_analysis
   * @name analyze_chart
   * @summary Analyze Chart
   * @request POST:/routes/analyze-chart
   */
  analyze_chart = (data: ChartAnalysisRequest, params: RequestParams = {}) =>
    this.request<AnalyzeChartData, AnalyzeChartError>({
      path: `/routes/analyze-chart`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Analyze a trading chart using Gemini Vision API with streaming response
   *
   * @tags stream, dbtn/module:chart_analysis
   * @name analyze_chart_streaming
   * @summary Analyze Chart Streaming
   * @request POST:/routes/analyze-chart/stream
   */
  analyze_chart_streaming = (data: ChartAnalysisRequest, params: RequestParams = {}) =>
    this.requestStream<AnalyzeChartStreamingData, AnalyzeChartStreamingError>({
      path: `/routes/analyze-chart/stream`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:ted_brain
   * @name add_to_brain
   * @summary Add To Brain
   * @request POST:/routes/add-to-brain
   */
  add_to_brain = (data: AppApisTedBrainAddToBrainRequest, params: RequestParams = {}) =>
    this.request<AddToBrainData, AddToBrainError>({
      path: `/routes/add-to-brain`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Search the brain with a natural language query
   *
   * @tags dbtn/module:ted_brain
   * @name query_brain
   * @summary Query Brain
   * @request POST:/routes/query-brain
   */
  query_brain = (data: AppApisTedBrainQueryBrainRequest, params: RequestParams = {}) =>
    this.request<QueryBrainData, QueryBrainError>({
      path: `/routes/query-brain`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Upload and process media files (images and videos) for the brain
   *
   * @tags dbtn/module:ted_brain
   * @name upload_media
   * @summary Upload Media
   * @request POST:/routes/upload-media
   */
  upload_media = (data: BodyUploadMedia, params: RequestParams = {}) =>
    this.request<UploadMediaData, UploadMediaError>({
      path: `/routes/upload-media`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Get the status of the brain store for a user
   *
   * @tags dbtn/module:ted_brain
   * @name brain_store_status
   * @summary Brain Store Status
   * @request GET:/routes/brain-store-status
   */
  brain_store_status = (query: BrainStoreStatusParams, params: RequestParams = {}) =>
    this.request<BrainStoreStatusData, BrainStoreStatusError>({
      path: `/routes/brain-store-status`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description List all categories for a user
   *
   * @tags dbtn/module:ted_brain_categories
   * @name list_categories
   * @summary List Categories
   * @request GET:/routes/ted_brain/categories/
   */
  list_categories = (query: ListCategoriesParams, params: RequestParams = {}) =>
    this.request<ListCategoriesData, ListCategoriesError>({
      path: `/routes/ted_brain/categories/`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create a new category
   *
   * @tags dbtn/module:ted_brain_categories
   * @name create_category
   * @summary Create Category
   * @request POST:/routes/ted_brain/categories/
   */
  create_category = (query: CreateCategoryParams, data: CategoryCreate, params: RequestParams = {}) =>
    this.request<CreateCategoryData, CreateCategoryError>({
      path: `/routes/ted_brain/categories/`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get a specific category
   *
   * @tags dbtn/module:ted_brain_categories
   * @name get_category
   * @summary Get Category
   * @request GET:/routes/ted_brain/categories/{category_id}
   */
  get_category = ({ categoryId, ...query }: GetCategoryParams, params: RequestParams = {}) =>
    this.request<GetCategoryData, GetCategoryError>({
      path: `/routes/ted_brain/categories/${categoryId}`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Update a category
   *
   * @tags dbtn/module:ted_brain_categories
   * @name update_category
   * @summary Update Category
   * @request PUT:/routes/ted_brain/categories/{category_id}
   */
  update_category = (
    { categoryId, ...query }: UpdateCategoryParams,
    data: CategoryUpdate,
    params: RequestParams = {},
  ) =>
    this.request<UpdateCategoryData, UpdateCategoryError>({
      path: `/routes/ted_brain/categories/${categoryId}`,
      method: "PUT",
      query: query,
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a category
   *
   * @tags dbtn/module:ted_brain_categories
   * @name delete_category
   * @summary Delete Category
   * @request DELETE:/routes/ted_brain/categories/{category_id}
   */
  delete_category = ({ categoryId, ...query }: DeleteCategoryParams, params: RequestParams = {}) =>
    this.request<DeleteCategoryData, DeleteCategoryError>({
      path: `/routes/ted_brain/categories/${categoryId}`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Assign an item to one or more categories
   *
   * @tags dbtn/module:ted_brain_categories
   * @name assign_item_to_categories
   * @summary Assign Item To Categories
   * @request POST:/routes/ted_brain/categories/assign
   */
  assign_item_to_categories = (
    query: AssignItemToCategoriesParams,
    data: ItemCategoryAssignment,
    params: RequestParams = {},
  ) =>
    this.request<AssignItemToCategoriesData, AssignItemToCategoriesError>({
      path: `/routes/ted_brain/categories/assign`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get categories for a specific item
   *
   * @tags dbtn/module:ted_brain_categories
   * @name get_item_categories
   * @summary Get Item Categories
   * @request GET:/routes/ted_brain/categories/items/{item_id}
   */
  get_item_categories = ({ itemId, ...query }: GetItemCategoriesParams, params: RequestParams = {}) =>
    this.request<GetItemCategoriesData, GetItemCategoriesError>({
      path: `/routes/ted_brain/categories/items/${itemId}`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get all items assigned to a specific category
   *
   * @tags dbtn/module:ted_brain_categories
   * @name get_items_by_category
   * @summary Get Items By Category
   * @request GET:/routes/ted_brain/categories/by-category/{category_id}
   */
  get_items_by_category = ({ categoryId, ...query }: GetItemsByCategoryParams, params: RequestParams = {}) =>
    this.request<GetItemsByCategoryData, GetItemsByCategoryError>({
      path: `/routes/ted_brain/categories/by-category/${categoryId}`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:options_flow
   * @name get_options_flow
   * @summary Get Options Flow
   * @request POST:/routes/options/flow
   */
  get_options_flow = (data: OptionsFlowRequest, params: RequestParams = {}) =>
    this.request<GetOptionsFlowData, GetOptionsFlowError>({
      path: `/routes/options/flow`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:dark_pool
   * @name get_dark_pool_trades
   * @summary Get Dark Pool Trades
   * @request GET:/routes/dark-pool-trades
   */
  get_dark_pool_trades = (query: GetDarkPoolTradesParams, params: RequestParams = {}) =>
    this.request<GetDarkPoolTradesData, GetDarkPoolTradesError>({
      path: `/routes/dark-pool-trades`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:stock_screener
   * @name screen_stocks
   * @summary Screen Stocks
   * @request POST:/routes/screen
   */
  screen_stocks = (data: StockScreenerRequest, params: RequestParams = {}) =>
    this.request<ScreenStocksData, ScreenStocksError>({
      path: `/routes/screen`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Chat with TED AI Assistant
   *
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name chat
   * @summary Chat
   * @request POST:/routes/chat
   */
  chat = (data: ChatRequest, params: RequestParams = {}) =>
    this.request<ChatData, ChatError>({
      path: `/routes/chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Stream chat responses from TED AI Assistant
   *
   * @tags TED AI Assistant, stream, dbtn/module:ted_ai
   * @name chat_stream
   * @summary Chat Stream
   * @request POST:/routes/chat/stream
   */
  chat_stream = (data: ChatRequest, params: RequestParams = {}) =>
    this.requestStream<ChatStreamData, ChatStreamError>({
      path: `/routes/chat/stream`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get list of conversations for a user
   *
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name get_conversations
   * @summary Get Conversations
   * @request GET:/routes/conversations
   */
  get_conversations = (query: GetConversationsParams, params: RequestParams = {}) =>
    this.request<GetConversationsData, GetConversationsError>({
      path: `/routes/conversations`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a specific conversation
   *
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name get_conversation
   * @summary Get Conversation
   * @request GET:/routes/conversation/{conversation_id}
   */
  get_conversation = ({ conversationId, ...query }: GetConversationParams, params: RequestParams = {}) =>
    this.request<GetConversationData, GetConversationError>({
      path: `/routes/conversation/${conversationId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a specific conversation
   *
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name delete_conversation
   * @summary Delete Conversation
   * @request DELETE:/routes/conversation/{conversation_id}
   */
  delete_conversation = ({ conversationId, ...query }: DeleteConversationParams, params: RequestParams = {}) =>
    this.request<DeleteConversationData, DeleteConversationError>({
      path: `/routes/conversation/${conversationId}`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Reset user context and start fresh
   *
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name reset_ai
   * @summary Reset Ai
   * @request POST:/routes/reset
   */
  reset_ai = (query: ResetAiParams, params: RequestParams = {}) =>
    this.request<ResetAiData, ResetAiError>({
      path: `/routes/reset`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Debug endpoint to test market data retrieval
   *
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name debug_market_data
   * @summary Debug Market Data
   * @request GET:/routes/debug-market-data
   */
  debug_market_data = (query: DebugMarketDataParams, params: RequestParams = {}) =>
    this.request<DebugMarketDataData, DebugMarketDataError>({
      path: `/routes/debug-market-data`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Analyze a user's portfolio
   *
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name analyze_portfolio
   * @summary Analyze Portfolio
   * @request POST:/routes/analyze-portfolio
   */
  analyze_portfolio = (data: AnalyzePortfolioPayload, params: RequestParams = {}) =>
    this.request<AnalyzePortfolioData, AnalyzePortfolioError>({
      path: `/routes/analyze-portfolio`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get comprehensive analysis for a symbol
   *
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name analyze_symbol
   * @summary Analyze Symbol
   * @request GET:/routes/analyze/{symbol}
   */
  analyze_symbol = ({ symbol, ...query }: AnalyzeSymbolParams, params: RequestParams = {}) =>
    this.request<AnalyzeSymbolData, AnalyzeSymbolError>({
      path: `/routes/analyze/${symbol}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check health of TED AI Assistant
   *
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name check_health
   * @summary Check Health
   * @request GET:/routes/health
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthResult, any>({
      path: `/routes/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get historical OHLC bars for a symbol
   *
   * @tags dbtn/module:market_data
   * @name get_historical_bars
   * @summary Get Historical Bars
   * @request GET:/routes/historical-bars
   */
  get_historical_bars = (query: GetHistoricalBarsParams, params: RequestParams = {}) =>
    this.request<GetHistoricalBarsData, GetHistoricalBarsError>({
      path: `/routes/historical-bars`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Add content to a user's brain store
   *
   * @tags Brain Store, dbtn/module:brain_store
   * @name add_to_brain_store
   * @summary Add To Brain Store
   * @request POST:/routes/add
   */
  add_to_brain_store = (data: AppApisBrainStoreAddToBrainRequest, params: RequestParams = {}) =>
    this.request<AddToBrainStoreData, AddToBrainStoreError>({
      path: `/routes/add`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Query a user's brain store
   *
   * @tags Brain Store, dbtn/module:brain_store
   * @name query_brain_store
   * @summary Query Brain Store
   * @request POST:/routes/query
   */
  query_brain_store = (data: AppApisBrainStoreQueryBrainRequest, params: RequestParams = {}) =>
    this.request<QueryBrainStoreData, QueryBrainStoreError>({
      path: `/routes/query`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the status of the brain store
   *
   * @tags Brain Store, dbtn/module:brain_store
   * @name brain_store_status_check
   * @summary Brain Store Status Check
   * @request GET:/routes/status
   */
  brain_store_status_check = (params: RequestParams = {}) =>
    this.request<BrainStoreStatusCheckData, any>({
      path: `/routes/status`,
      method: "GET",
      ...params,
    });
}
