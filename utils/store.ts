import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './userStore';
import { Stock, Sector, Watchlist, Tool, UserPortfolio, CalendarEvent, TradeEntry, CalendarEventType } from './types';

// Previously imported mock data - now using empty placeholder arrays
const mockStocks: Stock[] = [];
const mockSectors: Sector[] = [];
const mockWatchlists: Watchlist[] = [];
const mockTools: Tool[] = [
  {
    id: 'tool-1',
    name: 'Chart Analysis',
    icon: 'Activity',
    description: 'Upload and analyze chart patterns',
  },
  {
    id: 'tool-2',
    name: 'Options Flow',
    icon: 'BarChart2',
    description: 'Real-time options flow data and unusual activity',
  },
  {
    id: 'tool-3',
    name: 'Gamma Exposure',
    icon: 'LineChart',
    description: 'Options gamma visualization and strike analysis',
  },
  {
    id: 'tool-4',
    name: 'TEDs Brain',
    icon: 'Brain',
    description: 'Your personal knowledge database',
  },
  {
    id: 'tool-5',
    name: 'Market Scanner',
    icon: 'Search',
    description: 'Scan the market for specific patterns',
  },
  {
    id: 'tool-6',
    name: 'Calendar',
    icon: 'Calendar',
    description: 'Economic calendar and earnings',
  },
];
const mockPortfolio: UserPortfolio = { 
  totalValue: 0, 
  dailyChange: 0, 
  dailyChangePercent: 0, 
  items: [], 
  chartData: { 
    labels: ['1d', '5d', '1m', '3m', '6m', '1y'], 
    data: [0, 0, 0, 0, 0, 0] 
  } 
};
const mockNews: any[] = [];
const mockCalendarEvents: CalendarEvent[] = [];
const mockTradeEntries: TradeEntry[] = [];

interface DashboardState {
  // Chat panel state
  chatPanelState: 'expanded' | 'collapsed' | 'hidden';
  // Calendar and Trade Journal
  calendarEvents: CalendarEvent[];
  tradeEntries: TradeEntry[];
  selectedDate: string | null; // ISO date string
  // Market data
  stocks: Stock[];
  sectors: Sector[];
  divergenceScans: Stock[];
  topByMarketCap: Stock[];
  news: any[];
  
  // User data
  watchlists: Watchlist[];
  portfolio: UserPortfolio;
  tools: Tool[];
  
  // UI state
  selectedTimeframe: 'day' | 'week' | 'month' | 'year' | 'all';
  calendarView: 'month' | 'week' | 'day';
  calendarFilter: 'all' | CalendarEventType | 'trades';
  sidebarOpen: boolean;
  selectedStock: Stock | null;
  
  // Actions
  toggleWatchlistExpand: (id: string) => void;
  removeStockFromWatchlist: (watchlistId: string, stockId: string) => void;
  addStockToWatchlist: (watchlistId: string, stock: Stock) => void;
  toggleSidebar: () => void;
  setSelectedTimeframe: (timeframe: 'day' | 'week' | 'month' | 'year' | 'all') => void;
  setSelectedStock: (stock: Stock | null) => void;
  refreshData: () => void;
  setChatPanelState: (state: 'expanded' | 'collapsed' | 'hidden') => void;
  
  // Calendar and Trade Journal actions
  setSelectedDate: (date: string | null) => void;
  setCalendarView: (view: 'month' | 'week' | 'day') => void;
  setCalendarFilter: (filter: 'all' | CalendarEventType | 'trades') => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  addTradeEntry: (trade: Omit<TradeEntry, 'id'>) => void;
  updateTradeEntry: (id: string, trade: Partial<TradeEntry>) => void;
  deleteTradeEntry: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>(
  persist(
    (set, get) => ({
      // Migration helper for state transition
      // Chat panel state
    chatPanelState: 'collapsed',

    _getMigratedState: (state: any) => {
        // Handle transition from mostTraded to divergenceScans
        if (state && state.mostTraded && !state.divergenceScans) {
          state.divergenceScans = state.mostTraded;
          delete state.mostTraded;
        }
        return state;
      },
      // Initial data
      calendarEvents: mockCalendarEvents,
      tradeEntries: mockTradeEntries,
      selectedDate: null,
      calendarView: 'month',
      calendarFilter: 'all',
      stocks: mockStocks,
      sectors: mockSectors,
      divergenceScans: [
        // Hard-coded chart data to eliminate API dependencies
        {
          id: 'div-scan-1',
          symbol: 'AMZN',
          name: 'Amazon.com Inc',
          price: 2427.42,
          change: 13.33,
          changePercent: 1.15,
          chartData: [23, 25, 26, 28, 24, 25, 27, 29, 30, 28, 26, 29, 31],
          marketCap: 1243000000000,
          volume: 30710000,
          description: 'Resistance Level / Divergence Target',
          imageUrl: '/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/157_1683918476krNScreenshot_2023-05-13_at_12.36.06_AM_1.webp'
        },
        {
          id: 'div-scan-2',
          symbol: 'SPY',
          name: 'S&P 500 ETF Trust',
          price: 378.99,
          change: -2.17,
          changePercent: -0.57,
          chartData: [42, 45, 48, 47, 44, 46, 48, 47, 46, 44, 42, 45, 43],
          marketCap: null,
          volume: 52780000,
          description: 'Flow Index Divergence',
          imageUrl: '/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/Screenshot 2025-03-06 091034.jpg'
        },
        {
          id: 'div-scan-3',
          symbol: 'AMZN',
          name: 'Amazon.com Inc',
          price: 2144.32,
          change: -7.75,
          changePercent: -0.36,
          chartData: [35, 34, 37, 39, 38, 36, 35, 37, 40, 38, 36, 39, 41],
          marketCap: 1243000000000,
          volume: 29980000,
          description: 'Flow Index / Price Action',
          imageUrl: null
        }
      ],
      topByMarketCap: [...mockStocks].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)).slice(0, 5),
      news: mockNews,
      watchlists: mockWatchlists,
      portfolio: mockPortfolio,
      tools: mockTools,
      selectedTimeframe: 'week',
      sidebarOpen: true,
      selectedStock: null,
      
      // Actions
      toggleWatchlistExpand: (id: string) => {
        set(state => ({
          watchlists: state.watchlists.map(watchlist => 
            watchlist.id === id 
              ? { ...watchlist, isExpanded: !watchlist.isExpanded }
              : watchlist
          )
        }));
      },
      
      removeStockFromWatchlist: (watchlistId: string, stockId: string) => {
        set(state => ({
          watchlists: state.watchlists.map(watchlist => 
            watchlist.id === watchlistId
              ? { 
                  ...watchlist, 
                  stocks: watchlist.stocks.filter(stock => stock.id !== stockId) 
                }
              : watchlist
          )
        }));
      },
      
      addStockToWatchlist: (watchlistId: string, stock: Stock) => {
        const newStockItem = {
          ...stock,
          id: `${watchlistId}-${Date.now()}` // Create a unique ID for the watchlist item
        };
        
        set(state => ({
          watchlists: state.watchlists.map(watchlist => 
            watchlist.id === watchlistId
              ? { 
                  ...watchlist, 
                  stocks: [...watchlist.stocks, newStockItem] 
                }
              : watchlist
          )
        }));
      },
      
      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
      },
      
      setSelectedStock: (stock: Stock | null) => {
        set({ selectedStock: stock });
      },
      
      setSelectedTimeframe: (timeframe) => {
        set({ selectedTimeframe: timeframe });
      },
      
      // Calendar and Trade Journal actions
      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },
      
      setCalendarView: (view) => {
        set({ calendarView: view });
      },
      
      setCalendarFilter: (filter) => {
        set({ calendarFilter: filter });
      },
      
      addCalendarEvent: (event) => {
        const newEvent = {
          ...event,
          id: `event-${Date.now()}`
        };
        
        set(state => ({
          calendarEvents: [...state.calendarEvents, newEvent]
        }));
      },
      
      updateCalendarEvent: (id, updatedFields) => {
        set(state => ({
          calendarEvents: state.calendarEvents.map(event => 
            event.id === id ? { ...event, ...updatedFields } : event
          )
        }));
      },
      
      deleteCalendarEvent: (id) => {
        set(state => ({
          calendarEvents: state.calendarEvents.filter(event => event.id !== id)
        }));
      },
      
      addTradeEntry: (trade) => {
        const newTrade = {
          ...trade,
          id: `trade-${Date.now()}`
        };
        
        set(state => ({
          tradeEntries: [...state.tradeEntries, newTrade]
        }));
      },
      
      updateTradeEntry: (id, updatedFields) => {
        set(state => ({
          tradeEntries: state.tradeEntries.map(trade => 
            trade.id === id ? { ...trade, ...updatedFields } : trade
          )
        }));
      },
      
      deleteTradeEntry: (id) => {
        set(state => ({
          tradeEntries: state.tradeEntries.filter(trade => trade.id !== id)
        }));
      },
      
      setChatPanelState: (state: 'expanded' | 'collapsed' | 'hidden') => {
        set({ chatPanelState: state });
      },

      refreshData: () => {
        // In a real app, this would fetch fresh data from an API
        // For now, we'll just slightly modify the existing data to simulate updates
        set(state => {
          const updatedStocks = state.stocks.map(stock => ({
            ...stock,
            price: stock.price * (1 + (Math.random() * 0.02 - 0.01)), // +/- 1%
            change: stock.price * (Math.random() * 0.02 - 0.01),
            changePercent: stock.changePercent + (Math.random() * 0.5 - 0.25), // +/- 0.25%
            chartData: [...stock.chartData.slice(1), stock.chartData[stock.chartData.length - 1] * (1 + (Math.random() * 0.04 - 0.02))]
          }));
          
          return {
            stocks: updatedStocks,
            divergenceScans: updatedStocks.slice(0, 3),
            topByMarketCap: [...updatedStocks].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)).slice(0, 5),
          };
        });
      }
    }),
    {
      name: 'market-pulse-dashboard',
      // Add a migration function to handle the property rename
      migrate: (persistedState: any, version) => {
        // Handle the transition from mostTraded to divergenceScans
        if (persistedState && persistedState.mostTraded && !persistedState.divergenceScans) {
          persistedState.divergenceScans = persistedState.mostTraded;
          delete persistedState.mostTraded;
        }
        return persistedState;
      },
      version: 1, // Add version to enable migrations
      partialize: (state) => ({
        watchlists: state.watchlists,
        calendarEvents: state.calendarEvents,
        tradeEntries: state.tradeEntries,
        selectedTimeframe: state.selectedTimeframe,
        sidebarOpen: state.sidebarOpen,
        calendarView: state.calendarView,
        calendarFilter: state.calendarFilter,
        chatPanelState: state.chatPanelState
      })
    }
  )
);
