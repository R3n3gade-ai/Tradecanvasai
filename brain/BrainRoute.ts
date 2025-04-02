import {
  AddToBrainData,
  AddToBrainStoreData,
  AnalyzeChartData,
  AnalyzeChartStreamingData,
  AnalyzePortfolioData,
  AnalyzePortfolioPayload,
  AnalyzeSymbolData,
  AppApisBrainStoreAddToBrainRequest,
  AppApisBrainStoreQueryBrainRequest,
  AppApisTedBrainAddToBrainRequest,
  AppApisTedBrainQueryBrainRequest,
  AssignItemToCategoriesData,
  BodyUploadMedia,
  BrainStoreStatusCheckData,
  BrainStoreStatusData,
  CategoryCreate,
  CategoryUpdate,
  ChartAnalysisRequest,
  ChatData,
  ChatRequest,
  ChatStreamData,
  CheckHealthData,
  CheckHealthResult,
  CreateCategoryData,
  DebugMarketDataData,
  DeleteCategoryData,
  DeleteConversationData,
  GetCategoryData,
  GetConversationData,
  GetConversationsData,
  GetDarkPoolTradesData,
  GetHistoricalBarsData,
  GetItemCategoriesData,
  GetItemsByCategoryData,
  GetOptionsChainData,
  GetOptionsFlowData,
  GetOptionsGammaData,
  ItemCategoryAssignment,
  ListCategoriesData,
  OptionsFlowRequest,
  OptionsGammaRequest,
  OptionsSymbolRequest,
  QueryBrainData,
  QueryBrainStoreData,
  ResetAiData,
  ScreenStocksData,
  StockScreenerRequest,
  UpdateCategoryData,
  UploadMediaData,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * No description
   * @tags dbtn/module:polygon_options
   * @name get_options_chain
   * @summary Get Options Chain
   * @request POST:/routes/options/chain
   */
  export namespace get_options_chain {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OptionsSymbolRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetOptionsChainData;
  }

  /**
   * No description
   * @tags dbtn/module:options_gamma
   * @name get_options_gamma
   * @summary Get Options Gamma
   * @request POST:/routes/options/gamma
   */
  export namespace get_options_gamma {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OptionsGammaRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetOptionsGammaData;
  }

  /**
   * @description Analyze a chart image using Gemini Vision API
   * @tags dbtn/module:chart_analysis
   * @name analyze_chart
   * @summary Analyze Chart
   * @request POST:/routes/analyze-chart
   */
  export namespace analyze_chart {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChartAnalysisRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeChartData;
  }

  /**
   * @description Analyze a trading chart using Gemini Vision API with streaming response
   * @tags stream, dbtn/module:chart_analysis
   * @name analyze_chart_streaming
   * @summary Analyze Chart Streaming
   * @request POST:/routes/analyze-chart/stream
   */
  export namespace analyze_chart_streaming {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChartAnalysisRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeChartStreamingData;
  }

  /**
   * No description
   * @tags dbtn/module:ted_brain
   * @name add_to_brain
   * @summary Add To Brain
   * @request POST:/routes/add-to-brain
   */
  export namespace add_to_brain {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisTedBrainAddToBrainRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AddToBrainData;
  }

  /**
   * @description Search the brain with a natural language query
   * @tags dbtn/module:ted_brain
   * @name query_brain
   * @summary Query Brain
   * @request POST:/routes/query-brain
   */
  export namespace query_brain {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisTedBrainQueryBrainRequest;
    export type RequestHeaders = {};
    export type ResponseBody = QueryBrainData;
  }

  /**
   * @description Upload and process media files (images and videos) for the brain
   * @tags dbtn/module:ted_brain
   * @name upload_media
   * @summary Upload Media
   * @request POST:/routes/upload-media
   */
  export namespace upload_media {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadMedia;
    export type RequestHeaders = {};
    export type ResponseBody = UploadMediaData;
  }

  /**
   * @description Get the status of the brain store for a user
   * @tags dbtn/module:ted_brain
   * @name brain_store_status
   * @summary Brain Store Status
   * @request GET:/routes/brain-store-status
   */
  export namespace brain_store_status {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * User Id
       * @default "default"
       */
      user_id?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BrainStoreStatusData;
  }

  /**
   * @description List all categories for a user
   * @tags dbtn/module:ted_brain_categories
   * @name list_categories
   * @summary List Categories
   * @request GET:/routes/ted_brain/categories/
   */
  export namespace list_categories {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * User Id
       * @default "default"
       */
      user_id?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListCategoriesData;
  }

  /**
   * @description Create a new category
   * @tags dbtn/module:ted_brain_categories
   * @name create_category
   * @summary Create Category
   * @request POST:/routes/ted_brain/categories/
   */
  export namespace create_category {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * User Id
       * @default "default"
       */
      user_id?: string;
    };
    export type RequestBody = CategoryCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateCategoryData;
  }

  /**
   * @description Get a specific category
   * @tags dbtn/module:ted_brain_categories
   * @name get_category
   * @summary Get Category
   * @request GET:/routes/ted_brain/categories/{category_id}
   */
  export namespace get_category {
    export type RequestParams = {
      /** Category Id */
      categoryId: string;
    };
    export type RequestQuery = {
      /**
       * User Id
       * @default "default"
       */
      user_id?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCategoryData;
  }

  /**
   * @description Update a category
   * @tags dbtn/module:ted_brain_categories
   * @name update_category
   * @summary Update Category
   * @request PUT:/routes/ted_brain/categories/{category_id}
   */
  export namespace update_category {
    export type RequestParams = {
      /** Category Id */
      categoryId: string;
    };
    export type RequestQuery = {
      /**
       * User Id
       * @default "default"
       */
      user_id?: string;
    };
    export type RequestBody = CategoryUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateCategoryData;
  }

  /**
   * @description Delete a category
   * @tags dbtn/module:ted_brain_categories
   * @name delete_category
   * @summary Delete Category
   * @request DELETE:/routes/ted_brain/categories/{category_id}
   */
  export namespace delete_category {
    export type RequestParams = {
      /** Category Id */
      categoryId: string;
    };
    export type RequestQuery = {
      /**
       * User Id
       * @default "default"
       */
      user_id?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteCategoryData;
  }

  /**
   * @description Assign an item to one or more categories
   * @tags dbtn/module:ted_brain_categories
   * @name assign_item_to_categories
   * @summary Assign Item To Categories
   * @request POST:/routes/ted_brain/categories/assign
   */
  export namespace assign_item_to_categories {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * User Id
       * @default "default"
       */
      user_id?: string;
    };
    export type RequestBody = ItemCategoryAssignment;
    export type RequestHeaders = {};
    export type ResponseBody = AssignItemToCategoriesData;
  }

  /**
   * @description Get categories for a specific item
   * @tags dbtn/module:ted_brain_categories
   * @name get_item_categories
   * @summary Get Item Categories
   * @request GET:/routes/ted_brain/categories/items/{item_id}
   */
  export namespace get_item_categories {
    export type RequestParams = {
      /** Item Id */
      itemId: string;
    };
    export type RequestQuery = {
      /**
       * User Id
       * @default "default"
       */
      user_id?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetItemCategoriesData;
  }

  /**
   * @description Get all items assigned to a specific category
   * @tags dbtn/module:ted_brain_categories
   * @name get_items_by_category
   * @summary Get Items By Category
   * @request GET:/routes/ted_brain/categories/by-category/{category_id}
   */
  export namespace get_items_by_category {
    export type RequestParams = {
      /** Category Id */
      categoryId: string;
    };
    export type RequestQuery = {
      /**
       * User Id
       * @default "default"
       */
      user_id?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetItemsByCategoryData;
  }

  /**
   * No description
   * @tags dbtn/module:options_flow
   * @name get_options_flow
   * @summary Get Options Flow
   * @request POST:/routes/options/flow
   */
  export namespace get_options_flow {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = OptionsFlowRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetOptionsFlowData;
  }

  /**
   * No description
   * @tags dbtn/module:dark_pool
   * @name get_dark_pool_trades
   * @summary Get Dark Pool Trades
   * @request GET:/routes/dark-pool-trades
   */
  export namespace get_dark_pool_trades {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDarkPoolTradesData;
  }

  /**
   * No description
   * @tags dbtn/module:stock_screener
   * @name screen_stocks
   * @summary Screen Stocks
   * @request POST:/routes/screen
   */
  export namespace screen_stocks {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = StockScreenerRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ScreenStocksData;
  }

  /**
   * @description Chat with TED AI Assistant
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name chat
   * @summary Chat
   * @request POST:/routes/chat
   */
  export namespace chat {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChatRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ChatData;
  }

  /**
   * @description Stream chat responses from TED AI Assistant
   * @tags TED AI Assistant, stream, dbtn/module:ted_ai
   * @name chat_stream
   * @summary Chat Stream
   * @request POST:/routes/chat/stream
   */
  export namespace chat_stream {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChatRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ChatStreamData;
  }

  /**
   * @description Get list of conversations for a user
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name get_conversations
   * @summary Get Conversations
   * @request GET:/routes/conversations
   */
  export namespace get_conversations {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetConversationsData;
  }

  /**
   * @description Get a specific conversation
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name get_conversation
   * @summary Get Conversation
   * @request GET:/routes/conversation/{conversation_id}
   */
  export namespace get_conversation {
    export type RequestParams = {
      /** Conversation Id */
      conversationId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetConversationData;
  }

  /**
   * @description Delete a specific conversation
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name delete_conversation
   * @summary Delete Conversation
   * @request DELETE:/routes/conversation/{conversation_id}
   */
  export namespace delete_conversation {
    export type RequestParams = {
      /** Conversation Id */
      conversationId: string;
    };
    export type RequestQuery = {
      /** User Id */
      user_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteConversationData;
  }

  /**
   * @description Reset user context and start fresh
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name reset_ai
   * @summary Reset Ai
   * @request POST:/routes/reset
   */
  export namespace reset_ai {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResetAiData;
  }

  /**
   * @description Debug endpoint to test market data retrieval
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name debug_market_data
   * @summary Debug Market Data
   * @request GET:/routes/debug-market-data
   */
  export namespace debug_market_data {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Symbol
       * @default "SPY"
       */
      symbol?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DebugMarketDataData;
  }

  /**
   * @description Analyze a user's portfolio
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name analyze_portfolio
   * @summary Analyze Portfolio
   * @request POST:/routes/analyze-portfolio
   */
  export namespace analyze_portfolio {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AnalyzePortfolioPayload;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzePortfolioData;
  }

  /**
   * @description Get comprehensive analysis for a symbol
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name analyze_symbol
   * @summary Analyze Symbol
   * @request GET:/routes/analyze/{symbol}
   */
  export namespace analyze_symbol {
    export type RequestParams = {
      /** Symbol */
      symbol: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AnalyzeSymbolData;
  }

  /**
   * @description Check health of TED AI Assistant
   * @tags TED AI Assistant, dbtn/module:ted_ai
   * @name check_health
   * @summary Check Health
   * @request GET:/routes/health
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthResult;
  }

  /**
   * @description Get historical OHLC bars for a symbol
   * @tags dbtn/module:market_data
   * @name get_historical_bars
   * @summary Get Historical Bars
   * @request GET:/routes/historical-bars
   */
  export namespace get_historical_bars {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHistoricalBarsData;
  }

  /**
   * @description Add content to a user's brain store
   * @tags Brain Store, dbtn/module:brain_store
   * @name add_to_brain_store
   * @summary Add To Brain Store
   * @request POST:/routes/add
   */
  export namespace add_to_brain_store {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisBrainStoreAddToBrainRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AddToBrainStoreData;
  }

  /**
   * @description Query a user's brain store
   * @tags Brain Store, dbtn/module:brain_store
   * @name query_brain_store
   * @summary Query Brain Store
   * @request POST:/routes/query
   */
  export namespace query_brain_store {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisBrainStoreQueryBrainRequest;
    export type RequestHeaders = {};
    export type ResponseBody = QueryBrainStoreData;
  }

  /**
   * @description Get the status of the brain store
   * @tags Brain Store, dbtn/module:brain_store
   * @name brain_store_status_check
   * @summary Brain Store Status Check
   * @request GET:/routes/status
   */
  export namespace brain_store_status_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = BrainStoreStatusCheckData;
  }
}
