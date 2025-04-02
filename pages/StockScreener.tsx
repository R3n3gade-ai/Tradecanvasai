"use client";

import React, { useState, useEffect, useCallback } from "react";
import brain from "brain";
import { StockScreenerRequest, TickerDetails, ScreenStocksData } from "types";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, ChevronDown, Search, SlidersHorizontal, 
  Star, StarOff, ArrowUpDown, Save, Download, RefreshCw, Filter,
  ChevronRight, LineChart, Activity, Info
} from "lucide-react";

// Mock data for stocks
const mockStocks = [
  { 
    id: 1, 
    ticker: "A", 
    company: "Agilent Technologies Inc",
    sector: "Healthcare",
    industry: "Diagnostics & Research",
    country: "USA",
    marketCap: "40.37B",
    pe: "32.44",
    price: "143.60",
    change: "-1.11%",
    volume: "1,270,986",
    inWatchlist: false
  },
  { 
    id: 2, 
    ticker: "AA", 
    company: "Alcoa Corp",
    sector: "Basic Materials",
    industry: "Aluminum",
    country: "USA",
    marketCap: "9.56B",
    pe: "-",
    price: "-",
    change: "-",
    volume: "4,628,692",
    inWatchlist: true
  },
  { 
    id: 3, 
    ticker: "AAA", 
    company: "Alternative Access First Priority CLO Bond ETF",
    sector: "Financial",
    industry: "Exchange Traded Fund",
    country: "USA",
    marketCap: "-",
    pe: "-",
    price: "25.15",
    change: "0.00%",
    volume: "34,167",
    inWatchlist: false
  },
  { 
    id: 4, 
    ticker: "AAAU", 
    company: "Goldman Sachs Physical Gold ETF",
    sector: "Financial",
    industry: "Exchange Traded Fund",
    country: "USA",
    marketCap: "-",
    pe: "-",
    price: "36.72",
    change: "1.34%",
    volume: "1,526,730",
    inWatchlist: false
  },
  { 
    id: 5, 
    ticker: "AACBU", 
    company: "Aries II Acquisition Inc",
    sector: "Financial",
    industry: "Shell Companies",
    country: "USA",
    marketCap: "-",
    pe: "-",
    price: "10.40",
    change: "0.00%",
    volume: "0",
    inWatchlist: false
  },
  { 
    id: 6, 
    ticker: "AACQ", 
    company: "ATA Creativity Global ADR",
    sector: "Consumer Defensive",
    industry: "Education & Training Services",
    country: "China",
    marketCap: "26.21M",
    pe: "-",
    price: "0.82",
    change: "-2.35%",
    volume: "19,268",
    inWatchlist: false
  },
  { 
    id: 7, 
    ticker: "AACT", 
    company: "Ares Acquisition Corporation II",
    sector: "Financial",
    industry: "Shell Companies",
    country: "USA",
    marketCap: "690.62M",
    pe: "25.68",
    price: "1.05",
    change: "1.18%",
    volume: "5,553",
    inWatchlist: true
  },
  { 
    id: 8, 
    ticker: "AADI", 
    company: "Aadi Bioscience Inc",
    sector: "Healthcare",
    industry: "Biotechnology",
    country: "USA",
    marketCap: "66.43M",
    pe: "-",
    price: "2.69",
    change: "-2.82%",
    volume: "92,322",
    inWatchlist: false
  },
  { 
    id: 9, 
    ticker: "AADR", 
    company: "AdvisorShares Dorsey Wright ADR ETF",
    sector: "Financial",
    industry: "Exchange Traded Fund",
    country: "USA",
    marketCap: "-",
    pe: "-",
    price: "75.51",
    change: "0.40%",
    volume: "1,296",
    inWatchlist: false
  },
  { 
    id: 10, 
    ticker: "AAL", 
    company: "American Airlines Group Inc",
    sector: "Industrials",
    industry: "Airlines",
    country: "USA",
    marketCap: "10.94B",
    pe: "14.49",
    price: "16.85",
    change: "-2.03%",
    volume: "23,003,975",
    inWatchlist: false
  },
  { 
    id: 11, 
    ticker: "AAM", 
    company: "AA Mission Acquisition Corp",
    sector: "Financial",
    industry: "Shell Companies",
    country: "USA",
    marketCap: "594.42M",
    pe: "-",
    price: "10.10",
    change: "0.00%",
    volume: "25,141",
    inWatchlist: false
  },
  { 
    id: 12, 
    ticker: "AAM-U", 
    company: "AA Mission Acquisition Corp",
    sector: "Financial",
    industry: "Shell Companies",
    country: "USA",
    marketCap: "-",
    pe: "-",
    price: "10.30",
    change: "0.00%",
    volume: "0",
    inWatchlist: false
  },
  { 
    id: 13, 
    ticker: "AAME", 
    company: "Atlantic American Corp",
    sector: "Financial",
    industry: "Insurance - Life",
    country: "USA",
    marketCap: "32.76M",
    pe: "-",
    price: "1.61",
    change: "-4.53%",
    volume: "17,885",
    inWatchlist: false
  },
  { 
    id: 14, 
    ticker: "AAMI", 
    company: "Armada Asset Management Inc",
    sector: "Financial",
    industry: "Asset Management",
    country: "USA",
    marketCap: "938.67M",
    pe: "-",
    price: "25.19",
    change: "9.34%",
    volume: "122,274",
    inWatchlist: true
  },
  { 
    id: 15, 
    ticker: "AAOI", 
    company: "Applied Optoelectronics Inc",
    sector: "Technology",
    industry: "Communication Equipment",
    country: "USA",
    marketCap: "1.46B",
    pe: "-",
    price: "10.52",
    change: "5.02%",
    volume: "2,527,729",
    inWatchlist: false
  },
];

// Mock data for presets
const mockPresets = [
  { id: 1, name: "High Growth Tech" },
];

interface FilterOption {
  label: string;
  value: string;
}

interface FilterItem {
  label: string;
  key: string;
  options: FilterOption[];
  value: string;
}

interface Category {
  name: string;
  active: boolean;
}

const defaultCategories: Category[] = [
  { name: "Fundamental", active: true },
  { name: "Technical", active: false },
];

const defaultFilters: FilterItem[] = [
  {
    label: "Exchange",
    key: "exchange",
    options: [
      { label: "Any", value: "any" },
      { label: "NASDAQ", value: "nasdaq" },
      { label: "NYSE", value: "nyse" },
      { label: "AMEX", value: "amex" },
    ],
    value: "any"
  },
  {
    label: "Market Cap",
    key: "marketCap",
    options: [
      { label: "Any", value: "any" },
      { label: "Mega ($200B+)", value: "mega" },
      { label: "Large ($10B-$200B)", value: "large" },
      { label: "Mid ($2B-$10B)", value: "mid" },
      { label: "Small ($300M-$2B)", value: "small" },
      { label: "Micro ($50M-$300M)", value: "micro" },
      { label: "Nano (<$50M)", value: "nano" },
    ],
    value: "any"
  },
  {
    label: "Earnings Date",
    key: "earningsDate",
    options: [
      { label: "Any", value: "any" },
      { label: "Today", value: "today" },
      { label: "Tomorrow", value: "tomorrow" },
      { label: "Next 5 days", value: "next5" },
      { label: "Next 30 days", value: "next30" },
    ],
    value: "any"
  },
  {
    label: "Price",
    key: "price",
    options: [
      { label: "Any", value: "any" },
      { label: "Under $1", value: "under1" },
      { label: "Under $5", value: "under5" },
      { label: "Under $10", value: "under10" },
      { label: "Under $20", value: "under20" },
      { label: "Over $5", value: "over5" },
      { label: "Over $10", value: "over10" },
      { label: "Over $20", value: "over20" },
      { label: "Over $50", value: "over50" },
      { label: "Over $100", value: "over100" },
    ],
    value: "any"
  },
  {
    label: "Index",
    key: "index",
    options: [
      { label: "Any", value: "any" },
      { label: "S&P 500", value: "sp500" },
      { label: "DJIA", value: "djia" },
      { label: "NASDAQ 100", value: "nasdaq100" },
    ],
    value: "any"
  },
  {
    label: "Dividend Yield",
    key: "dividendYield",
    options: [
      { label: "Any", value: "any" },
      { label: "None (0%)", value: "none" },
      { label: "Positive (>0%)", value: "positive" },
      { label: "High (>3%)", value: "high" },
      { label: "Very High (>5%)", value: "veryhigh" },
      { label: "Over 10%", value: "over10" },
    ],
    value: "any"
  },
  {
    label: "Average Volume",
    key: "avgVolume",
    options: [
      { label: "Any", value: "any" },
      { label: "Under 50K", value: "under50k" },
      { label: "Over 50K", value: "over50k" },
      { label: "Over 100K", value: "over100k" },
      { label: "Over 500K", value: "over500k" },
      { label: "Over 1M", value: "over1m" },
      { label: "Over 10M", value: "over10m" },
    ],
    value: "any"
  },
  {
    label: "Target Price",
    key: "targetPrice",
    options: [
      { label: "Any", value: "any" },
      { label: "10% Above", value: "above10" },
      { label: "20% Above", value: "above20" },
      { label: "50% Above", value: "above50" },
      { label: "10% Below", value: "below10" },
      { label: "20% Below", value: "below20" },
    ],
    value: "any"
  },
];

const secondRowFilters: FilterItem[] = [
  {
    label: "Sector",
    key: "sector",
    options: [
      { label: "Any", value: "any" },
      { label: "Basic Materials", value: "basic_materials" },
      { label: "Communication Services", value: "communication_services" },
      { label: "Consumer Cyclical", value: "consumer_cyclical" },
      { label: "Consumer Defensive", value: "consumer_defensive" },
      { label: "Energy", value: "energy" },
      { label: "Financial", value: "financial" },
      { label: "Healthcare", value: "healthcare" },
      { label: "Industrials", value: "industrials" },
      { label: "Real Estate", value: "real_estate" },
      { label: "Technology", value: "technology" },
      { label: "Utilities", value: "utilities" },
    ],
    value: "any"
  },
  {
    label: "Short Float",
    key: "shortFloat",
    options: [
      { label: "Any", value: "any" },
      { label: "Low (<5%)", value: "low" },
      { label: "High (>20%)", value: "high" },
      { label: "Under 10%", value: "under10" },
      { label: "Over 10%", value: "over10" },
      { label: "Over 15%", value: "over15" },
      { label: "Over 20%", value: "over20" },
      { label: "Over 30%", value: "over30" },
    ],
    value: "any"
  },
  {
    label: "Relative Volume",
    key: "relVolume",
    options: [
      { label: "Any", value: "any" },
      { label: "Over 0.5", value: "over0_5" },
      { label: "Over 1", value: "over1" },
      { label: "Over 1.5", value: "over1_5" },
      { label: "Over 2", value: "over2" },
      { label: "Over 3", value: "over3" },
      { label: "Over 5", value: "over5" },
      { label: "Over 10", value: "over10" },
    ],
    value: "any"
  },
  {
    label: "IPO Date",
    key: "ipoDate",
    options: [
      { label: "Any", value: "any" },
      { label: "Today", value: "today" },
      { label: "Last Week", value: "lastweek" },
      { label: "Last Month", value: "lastmonth" },
      { label: "Last Quarter", value: "lastquarter" },
      { label: "Last Year", value: "lastyear" },
      { label: "Last 2 Years", value: "last2years" },
      { label: "Last 3 Years", value: "last3years" },
      { label: "Last 5 Years", value: "last5years" },
    ],
    value: "any"
  },
  {
    label: "Industry",
    key: "industry",
    options: [
      { label: "Any", value: "any" },
      { label: "Biotechnology", value: "biotechnology" },
      { label: "Software", value: "software" },
      { label: "Banks", value: "banks" },
      { label: "Semiconductors", value: "semiconductors" },
      { label: "Oil & Gas", value: "oil_gas" },
      { label: "Retail", value: "retail" },
    ],
    value: "any"
  },
  {
    label: "Current Volume",
    key: "currentVolume",
    options: [
      { label: "Any", value: "any" },
      { label: "Under 50K", value: "under50k" },
      { label: "Over 50K", value: "over50k" },
      { label: "Over 100K", value: "over100k" },
      { label: "Over 500K", value: "over500k" },
      { label: "Over 1M", value: "over1m" },
      { label: "Over 10M", value: "over10m" },
    ],
    value: "any"
  },
  {
    label: "Shares Outstanding",
    key: "sharesOutstanding",
    options: [
      { label: "Any", value: "any" },
      { label: "Under 1M", value: "under1m" },
      { label: "Under 5M", value: "under5m" },
      { label: "Under 10M", value: "under10m" },
      { label: "Under 50M", value: "under50m" },
      { label: "Under 100M", value: "under100m" },
      { label: "Over 1M", value: "over1m" },
      { label: "Over 10M", value: "over10m" },
      { label: "Over 100M", value: "over100m" },
      { label: "Over 500M", value: "over500m" },
      { label: "Over 1B", value: "over1b" },
    ],
    value: "any"
  },
];

// Define timeframe options for technical indicators
const timeframeOptions: FilterOption[] = [
  { label: "1 Day", value: "1d" },
  { label: "1 Week", value: "1w" },
  { label: "1 Month", value: "1m" },
  { label: "3 Months", value: "3m" },
  { label: "1 Year", value: "1y" },
];

// Define Technical indicators
const technicalIndicators: FilterItem[] = [
  {
    label: "RSI (14)",
    key: "rsi",
    options: [
      { label: "Any", value: "any" },
      { label: "Oversold (<30)", value: "oversold" },
      { label: "Overbought (>70)", value: "overbought" },
      { label: "Between 30-70", value: "neutral" },
      { label: "Under 50", value: "under50" },
      { label: "Over 50", value: "over50" },
    ],
    value: "any"
  },
  {
    label: "SMA (20 vs 50)",
    key: "sma_comparison",
    options: [
      { label: "Any", value: "any" },
      { label: "20 SMA Above 50 SMA", value: "sma20_above_sma50" },
      { label: "20 SMA Below 50 SMA", value: "sma20_below_sma50" },
      { label: "20 SMA Crossing Above 50 SMA", value: "sma20_crossing_above_sma50" },
      { label: "20 SMA Crossing Below 50 SMA", value: "sma20_crossing_below_sma50" },
    ],
    value: "any"
  },
  {
    label: "MACD",
    key: "macd",
    options: [
      { label: "Any", value: "any" },
      { label: "Bullish", value: "bullish" },
      { label: "Bearish", value: "bearish" },
      { label: "Bullish Crossover", value: "bullish_crossover" },
      { label: "Bearish Crossover", value: "bearish_crossover" },
    ],
    value: "any"
  },
  {
    label: "Bollinger Bands",
    key: "bollinger",
    options: [
      { label: "Any", value: "any" },
      { label: "Price Near Upper Band", value: "near_upper" },
      { label: "Price Near Lower Band", value: "near_lower" },
      { label: "Price Near Middle Band", value: "near_middle" },
      { label: "Squeeze (Low Volatility)", value: "squeeze" },
      { label: "Expansion (High Volatility)", value: "expansion" },
    ],
    value: "any"
  },
  {
    label: "Keltner Channels",
    key: "keltner",
    options: [
      { label: "Any", value: "any" },
      { label: "Price Above Upper Channel", value: "above_upper" },
      { label: "Price Below Lower Channel", value: "below_lower" },
      { label: "Price Within Channels", value: "within" },
      { label: "Narrowing (Decreasing Volatility)", value: "narrowing" },
      { label: "Widening (Increasing Volatility)", value: "widening" },
    ],
    value: "any"
  },
  {
    label: "Stochastic (14,3,3)",
    key: "stochastic",
    options: [
      { label: "Any", value: "any" },
      { label: "Oversold (<20)", value: "oversold" },
      { label: "Overbought (>80)", value: "overbought" },
      { label: "Bullish Crossover", value: "bullish_crossover" },
      { label: "Bearish Crossover", value: "bearish_crossover" },
    ],
    value: "any"
  },
  {
    label: "Trend",
    key: "trend",
    options: [
      { label: "Any", value: "any" },
      { label: "Strong Uptrend", value: "strong_uptrend" },
      { label: "Weak Uptrend", value: "weak_uptrend" },
      { label: "Sideways", value: "sideways" },
      { label: "Weak Downtrend", value: "weak_downtrend" },
      { label: "Strong Downtrend", value: "strong_downtrend" },
    ],
    value: "any"
  },
];

const thirdRowFilters: FilterItem[] = [
  {
    label: "Options/Short",
    key: "optionsShort",
    options: [
      { label: "Any", value: "any" },
      { label: "Optionable", value: "optionable" },
      { label: "Shortable", value: "shortable" },
      { label: "Both", value: "both" },
    ],
    value: "any"
  },
  {
    label: "Float",
    key: "float",
    options: [
      { label: "Any", value: "any" },
      { label: "Under 50M", value: "under50m" },
      { label: "Under 100M", value: "under100m" },
      { label: "Over 50M", value: "over50m" },
      { label: "Over 100M", value: "over100m" },
      { label: "Over 500M", value: "over500m" },
      { label: "Over 1B", value: "over1b" },
    ],
    value: "any"
  },
];

interface ResultsTab {
  name: string;
  active: boolean;
}

const defaultResultsTabs: ResultsTab[] = [
  { name: "Fundamental", active: true },
  { name: "Technical", active: false },
];

export default function StockScreener() {
  const navigate = useNavigate();
  const [stocksData, setStocksData] = useState<TickerDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(mockPresets[0]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [filters, setFilters] = useState<FilterItem[]>(defaultFilters);
  const [rowTwoFilters, setRowTwoFilters] = useState<FilterItem[]>(secondRowFilters);
  const [rowThreeFilters, setRowThreeFilters] = useState<FilterItem[]>(thirdRowFilters);
  const [resultsTabs, setResultsTabs] = useState<ResultsTab[]>(defaultResultsTabs);
  const [orderBy, setOrderBy] = useState("Ticker");
  const [orderDirection, setOrderDirection] = useState("Asc");
  const [signalFilter, setSignalFilter] = useState("None (all stocks)");
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(50);
  const [technicalFilters, setTechnicalFilters] = useState<FilterItem[]>(technicalIndicators);
  const [timeframe, setTimeframe] = useState<string>("1w"); // Default to 1 week

  // Handle filter change
  const handleFilterChange = (key: string, value: string, row: number = 1) => {
    if (row === 1) {
      setFilters(filters.map(filter => 
        filter.key === key ? { ...filter, value } : filter
      ));
    } else if (row === 2) {
      setRowTwoFilters(rowTwoFilters.map(filter => 
        filter.key === key ? { ...filter, value } : filter
      ));
    } else if (row === 3) {
      setRowThreeFilters(rowThreeFilters.map(filter => 
        filter.key === key ? { ...filter, value } : filter
      ));
    } else if (row === 4) {
      setTechnicalFilters(technicalFilters.map(filter => 
        filter.key === key ? { ...filter, value } : filter
      ));
    }
  };

  // Handle category change
  const handleCategoryChange = (name: string) => {
    setCategories(categories.map(cat => 
      ({ ...cat, active: cat.name === name })
    ));
  };

  // Handle results tab change
  const handleResultsTabChange = (name: string) => {
    setResultsTabs(resultsTabs.map(tab => 
      ({ ...tab, active: tab.name === name })
    ));
  };

  // Handle watchlist toggle
  const toggleWatchlist = (ticker: string) => {
    // This would be connected to a watchlist API/storage in a real implementation
    console.log('Toggle watchlist for:', ticker);
  };

  // Handle order by change
  const toggleOrderDirection = () => {
    setOrderDirection(orderDirection === "Asc" ? "Desc" : "Asc");
  };

  // Change sorting column
  const handleSortByColumn = (column: string) => {
    if (orderBy === column) {
      toggleOrderDirection();
    } else {
      setOrderBy(column);
      setOrderDirection("Asc"); // Default to ascending when changing columns
    }
    // Apply the sort
    fetchStockScreenerData();
  };

  // Handle preset selection
  const selectPreset = (preset: any) => {
    setSelectedPreset(preset);
    setShowPresetsDropdown(false);
    // Here you would load the preset filters
  };

  // Handle save preset
  const savePreset = () => {
    if (newPresetName.trim()) {
      // In a real app, you would save this to the backend
      const newPreset = { id: mockPresets.length + 1, name: newPresetName.trim() };
      setSelectedPreset(newPreset);
      setShowSaveDialog(false);
      setNewPresetName("");
    }
  };

  // Convert UI filter values to API parameters
  const mapFiltersToApiRequest = useCallback((): StockScreenerRequest => {
    const request: StockScreenerRequest = {
      sort_by: orderBy.toLowerCase().replace(' ', '_'),
      sort_direction: orderDirection.toLowerCase() as 'asc' | 'desc',
      limit: resultsPerPage,
      page: currentPage
    };

    // Process first row filters
    filters.forEach(filter => {
      if (filter.value !== 'any') {
        switch (filter.key) {
          case 'exchange':
            request.exchange = filter.value;
            break;
          case 'marketCap':
            // Map market cap values
            if (filter.value === 'mega') {
              request.market_cap_min = 200_000_000_000;
            } else if (filter.value === 'large') {
              request.market_cap_min = 10_000_000_000;
              request.market_cap_max = 200_000_000_000;
            } else if (filter.value === 'mid') {
              request.market_cap_min = 2_000_000_000;
              request.market_cap_max = 10_000_000_000;
            } else if (filter.value === 'small') {
              request.market_cap_min = 300_000_000;
              request.market_cap_max = 2_000_000_000;
            } else if (filter.value === 'micro') {
              request.market_cap_min = 50_000_000;
              request.market_cap_max = 300_000_000;
            } else if (filter.value === 'nano') {
              request.market_cap_max = 50_000_000;
            }
            break;
          case 'price':
            // Map price values
            if (filter.value === 'under1') {
              request.price_max = 1;
            } else if (filter.value === 'under5') {
              request.price_max = 5;
            } else if (filter.value === 'under10') {
              request.price_max = 10;
            } else if (filter.value === 'under20') {
              request.price_max = 20;
            } else if (filter.value === 'over5') {
              request.price_min = 5;
            } else if (filter.value === 'over10') {
              request.price_min = 10;
            } else if (filter.value === 'over20') {
              request.price_min = 20;
            } else if (filter.value === 'over50') {
              request.price_min = 50;
            } else if (filter.value === 'over100') {
              request.price_min = 100;
            }
            break;
          case 'dividendYield':
            if (filter.value === 'none') {
              request.dividend_max = 0.01; // Nearly zero
            } else if (filter.value === 'positive') {
              request.dividend_min = 0.01; // Slightly above zero
            } else if (filter.value === 'high') {
              request.dividend_min = 3;
            } else if (filter.value === 'veryhigh') {
              request.dividend_min = 5;
            } else if (filter.value === 'over10') {
              request.dividend_min = 10;
            }
            break;
          case 'avgVolume':
            try {
              if (filter.value.startsWith('under')) {
                const amount = parseInt(filter.value.replace('under', '').replace('k', '000').replace('m', '000000'));
                request.volume_min = amount;
              } else if (filter.value.startsWith('over')) {
                const amount = parseInt(filter.value.replace('over', '').replace('k', '000').replace('m', '000000'));
                request.volume_min = amount;
              }
            } catch (error) {
              console.warn('Invalid volume filter value:', filter.value);
            }
            break;
          // ETF/Stock filter
          case 'index':
            if (filter.value === 'sp500' || filter.value === 'djia' || filter.value === 'nasdaq100') {
              // These are usually stocks, not ETFs
              request.is_etf = false;
            }
            break;
        }
      }
    });

    // Process second row filters
    rowTwoFilters.forEach(filter => {
      if (filter.value !== 'any') {
        switch (filter.key) {
          case 'sector':
            request.sector = filter.value;
            break;
          case 'industry':
            request.industry = filter.value;
            break;
          case 'currentVolume':
            try {
              if (filter.value.startsWith('under')) {
                const amount = parseInt(filter.value.replace('under', '').replace('k', '000').replace('m', '000000'));
                request.volume_min = amount;
              } else if (filter.value.startsWith('over')) {
                const amount = parseInt(filter.value.replace('over', '').replace('k', '000').replace('m', '000000'));
                request.volume_min = amount;
              }
            } catch (error) {
              console.warn('Invalid current volume filter value:', filter.value);
            }
            break;
          case 'float':
            try {
              if (filter.value.startsWith('under')) {
                const amount = parseInt(filter.value.replace('under', '').replace('m', '000000').replace('b', '000000000'));
                request.float_max = amount;
              } else if (filter.value.startsWith('over')) {
                const amount = parseInt(filter.value.replace('over', '').replace('m', '000000').replace('b', '000000000'));
                request.float_min = amount;
              }
            } catch (error) {
              console.warn('Invalid float filter value:', filter.value);
            }
            break;
        }
      }
    });

    // Process third row filters
    rowThreeFilters.forEach(filter => {
      if (filter.value !== 'any') {
        switch (filter.key) {
          case 'optionsShort':
            if (filter.value === 'optionable' || filter.value === 'both') {
              request.has_options = true;
            }
            break;
          case 'float':
            try {
              if (filter.value.startsWith('under')) {
                const amount = parseInt(filter.value.replace('under', '').replace('m', '000000').replace('b', '000000000'));
                request.float_max = amount;
              } else if (filter.value.startsWith('over')) {
                const amount = parseInt(filter.value.replace('over', '').replace('m', '000000').replace('b', '000000000'));
                request.float_min = amount;
              }
            } catch (error) {
              console.warn('Invalid float filter value:', filter.value);
            }
            break;
        }
      }
    });

      // Add timeframe to request
    request.timeframe = timeframe;

    // Process technical indicators
    technicalFilters.forEach(filter => {
      if (filter.value !== 'any') {
        switch (filter.key) {
          case 'rsi':
            if (filter.value === 'oversold') {
              request.rsi_max = 30;
            } else if (filter.value === 'overbought') {
              request.rsi_min = 70;
            } else if (filter.value === 'neutral') {
              request.rsi_min = 30;
              request.rsi_max = 70;
            } else if (filter.value === 'under50') {
              request.rsi_max = 50;
            } else if (filter.value === 'over50') {
              request.rsi_min = 50;
            }
            break;
          case 'sma_comparison':
            // We can't directly map these to the API, but we can add them as flags
            // that the backend can use for post-filtering
            if (filter.value !== 'any') {
              request.sma_comparison = filter.value;
            }
            break;
          case 'macd':
            if (filter.value !== 'any') {
              request.macd_signal = filter.value;
            }
            break;
          case 'bollinger':
            if (filter.value !== 'any') {
              request.bollinger_signal = filter.value;
            }
            break;
          case 'keltner':
            if (filter.value !== 'any') {
              request.keltner_signal = filter.value;
            }
            break;
          case 'stochastic':
            if (filter.value !== 'any') {
              request.stochastic_signal = filter.value;
            }
            break;
          case 'trend':
            if (filter.value !== 'any') {
              request.trend = filter.value;
            }
            break;
        }
      }
    });

    // Add search term as filter for tickers if provided
    if (searchTerm.trim()) {
      // Split by comma, space, or tab, remove empty entries
      const tickers = searchTerm.trim().split(/[,\s]+/).filter(t => t.length > 0);
      if (tickers.length > 0) {
        request.tickers = tickers;
      }
    }

    // Logging for debugging
    console.log('Stock Screener API Request:', request);

    return request;
  }, [filters, rowTwoFilters, rowThreeFilters, technicalFilters, searchTerm, orderBy, orderDirection, resultsPerPage, currentPage]);

  // Only fetch data when user explicitly clicks Apply Filters
  // No automatic data fetching on mount or page changes
  const fetchStockScreenerData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Map filter values to API request
      const request = mapFiltersToApiRequest();
      
      // Make the API call
      const response = await brain.screen_stocks(request);
      
      // Handle potential HTTP errors
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }
      
      // Parse the response data
      const data: ScreenStocksData = await response.json();
      
        // Handle API-level errors
      if (data.error) {
        setError(data.error);
        setStocksData([]);
        setTotalResults(0);
      } else {
        setStocksData(data.results || []);
        setTotalResults(data.total_results || 0);
        
        // If we got no results but there's a next page, try to go back to page 1
        if (data.results?.length === 0 && currentPage > 1) {
          setCurrentPage(1);
        }
        
        // Log success info
        console.log(`Retrieved ${data.results?.length || 0} stocks out of ${data.total_results || 0} total matches (page ${data.page || 1})`);
      }
    } catch (err) {
      // Handle different types of errors
      if (err instanceof Error) {
        setError(err.message);
        console.error('Error fetching stock screener data:', err.message);
      } else {
        setError('An unexpected error occurred while fetching stock data');
        console.error('Unknown error in stock screener:', err);
      }
      
      // Clear data on error
      setStocksData([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [mapFiltersToApiRequest]);

  // Do not fetch data on initial mount
  // We'll only fetch when user clicks Apply Filters

  // Page changes should only trigger data fetch if we already have results
  // and only if initial data was loaded through the Apply button
  useEffect(() => {
    if (stocksData.length > 0) {
      fetchStockScreenerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, resultsPerPage]);
  

  // Apply button handler - only fetch data when user explicitly clicks this button
  const handleApplyFilters = () => {
    // Reset to first page when applying new filters
    setCurrentPage(1);
    fetchStockScreenerData();
  };

  // Filter stocks based on search term (client-side filtering for quick searches)
  const filteredStocks = stocksData.filter(stock => {
    if (searchTerm.trim() === "") return true;
    return stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
           stock.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header with back button */}
      <div className="p-4 border-b border-white/10">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center text-primary hover:underline"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-xl font-bold ml-4">Stock Screener</h1>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top controls */}
        <div className="bg-card border-b border-white/10 p-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Screener tabs */}
            <div className="flex gap-2 items-center">
              <button
                className={`flex items-center gap-1 px-3 py-1 rounded ${categories[0].active ? 'bg-primary text-background' : 'bg-card text-primary border border-primary'}`}
                onClick={() => handleCategoryChange('Fundamental')}
              >
                <Activity className="h-4 w-4" />
                <span>Fundamental</span>
              </button>
              <button
                className={`flex items-center gap-1 px-3 py-1 rounded ${categories[1].active ? 'bg-primary text-background' : 'bg-card text-primary border border-primary'}`}
                onClick={() => handleCategoryChange('Technical')}
              >
                <LineChart className="h-4 w-4" />
                <span>Technical</span>
              </button>
            </div>

        {/* Pagination */}
        {totalResults > resultsPerPage && (
          <div className="flex justify-between items-center px-4 py-3 bg-card border-t border-white/10">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * resultsPerPage + 1} to {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults} results
            </div>
            <div className="flex gap-2">
              <button 
                className="px-2 py-1 rounded border border-white/10 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {/* Page numbers - generate array of page numbers to display */}
                {Array.from({ length: Math.min(5, Math.ceil(totalResults / resultsPerPage)) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      className={`w-8 h-8 flex items-center justify-center rounded ${pageNum === currentPage ? 'bg-primary text-background' : 'hover:bg-accent/50'}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {/* If there are more pages than we're showing */}
                {Math.ceil(totalResults / resultsPerPage) > 5 && (
                  <>
                    <span className="px-1">...</span>
                    <button
                      className={`w-8 h-8 flex items-center justify-center rounded hover:bg-accent/50`}
                      onClick={() => setCurrentPage(Math.ceil(totalResults / resultsPerPage))}
                    >
                      {Math.ceil(totalResults / resultsPerPage)}
                    </button>
                  </>
                )}
              </div>
              
              <button 
                className="px-2 py-1 rounded border border-white/10 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(curr => curr + 1)}
                disabled={currentPage >= Math.ceil(totalResults / resultsPerPage)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

            {/* Filters button */}
            <button 
              className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-background hover:bg-primary/90"
              onClick={handleApplyFilters}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4" />
                  <span>Apply Filters</span>
                </>
              )}
            </button>
          </div>



          {/* First row of filters */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            {filters.map((filter) => (
              <div key={filter.key} className="flex items-center gap-2">
                <span className="text-sm text-right w-28 text-muted-foreground">{filter.label}</span>
                <select 
                  className="flex-grow bg-background border border-white/10 rounded px-2 py-1 text-sm"
                  value={filter.value}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Second row of filters */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            {rowTwoFilters.map((filter) => (
              <div key={filter.key} className="flex items-center gap-2">
                <span className="text-sm text-right w-28 text-muted-foreground">{filter.label}</span>
                <select 
                  className="flex-grow bg-background border border-white/10 rounded px-2 py-1 text-sm"
                  value={filter.value}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value, 2)}
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Third row of filters */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            {rowThreeFilters.map((filter) => (
              <div key={filter.key} className="flex items-center gap-2">
                <span className="text-sm text-right w-28 text-muted-foreground">{filter.label}</span>
                <select 
                  className="flex-grow bg-background border border-white/10 rounded px-2 py-1 text-sm"
                  value={filter.value}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value, 3)}
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          
          {/* Technical indicators - only shown when Technical tab is selected */}
          {categories[1].active && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between border-b border-primary/30 pb-2">
                <h3 className="font-medium text-sm text-primary">Technical Indicators</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Timeframe:</span>
                  <div className="relative">
                    <select
                      className="bg-background border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={timeframe}
                      onChange={(e) => {
                        setTimeframe(e.target.value);
                        // Immediately update when timeframe changes if results are visible
                        if (stocksData.length > 0) {
                          setCurrentPage(1); // Reset to page 1 when changing timeframe
                          fetchStockScreenerData();
                        }
                      }}
                      aria-label="Select timeframe for technical indicators"
                    >
                      {timeframeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 group">
                      <Info size={14} className="text-muted-foreground cursor-help" />
                      <div className="absolute hidden group-hover:block right-0 bottom-full mb-2 w-48 p-2 bg-card border border-border rounded shadow-md text-xs">
                        The timeframe affects how technical indicators are calculated. Longer timeframes can filter out market noise but may miss short-term opportunities.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {technicalFilters.map((filter) => (
                  <div key={filter.key} className="flex flex-col gap-1">
                    <label className="text-sm text-muted-foreground">{filter.label}</label>
                    <select 
                      className="bg-background border border-white/10 rounded px-2 py-1 text-sm"
                      value={filter.value}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value, 4)}
                    >
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>



        {/* Results status bar */}
        <div className="flex justify-between items-center px-4 py-2 bg-background/50 border-b border-white/10 text-sm">
          <div className="text-muted-foreground">
            <span className="font-medium text-primary">{filteredStocks.length}</span> / {totalResults} total
          </div>
          <div className="flex items-center gap-4">
            <div className="text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              <span>Refresh: 3min</span>
            </div>

            {/* Per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Per page:</span>
              <select 
                className="bg-background border border-white/10 rounded px-2 py-1 text-xs"
                value={resultsPerPage}
                onChange={(e) => setResultsPerPage(Number(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 m-4 bg-red-500/20 border border-red-500 rounded-md">
            <p className="text-red-500">Error: {error}</p>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !error && (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading stock data...</span>
          </div>
        )}

        {/* Results table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-white/10">
                <th className="px-4 py-2 text-left font-medium">No.</th>
                <th 
                  className="px-4 py-2 text-left font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSortByColumn('ticker')}
                >
                  <div className="flex items-center">
                    Ticker
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSortByColumn('name')}
                >
                  <div className="flex items-center">
                    Company
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSortByColumn('sector')}
                >
                  <div className="flex items-center">
                    Sector
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th className="px-4 py-2 text-left font-medium">Industry</th>
                <th className="px-4 py-2 text-left font-medium">Country</th>
                <th 
                  className="px-4 py-2 text-right font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSortByColumn('market_cap')}
                >
                  <div className="flex items-center justify-end">
                    Market Cap
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-right font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSortByColumn('pe_ratio')}
                >
                  <div className="flex items-center justify-end">
                    P/E
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-right font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSortByColumn('price')}
                >
                  <div className="flex items-center justify-end">
                    Price
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-right font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSortByColumn('change_percent')}
                >
                  <div className="flex items-center justify-end">
                    Change
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-right font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSortByColumn('volume')}
                >
                  <div className="flex items-center justify-end">
                    Volume
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock, index) => (
                <tr key={`${stock.ticker}-${index}`} className="border-b border-white/5 hover:bg-background/40 transition-colors">
                  <td className="px-4 py-2 text-muted-foreground">{(currentPage - 1) * resultsPerPage + index + 1}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleWatchlist(stock.ticker)}
                        className={`text-muted-foreground hover:text-yellow-400`}
                      >
                        <StarOff className="h-4 w-4" />
                      </button>
                      <span className="font-medium text-primary">{stock.ticker}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium">{stock.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{stock.sector || '-'}</td>
                  <td className="px-4 py-2 text-muted-foreground">{stock.industry || '-'}</td>
                  <td className="px-4 py-2 text-muted-foreground">{stock.country || '-'}</td>
                  <td className="px-4 py-2 text-right font-medium">{stock.market_cap ? `$${(stock.market_cap / 1_000_000_000).toFixed(2)}B` : '-'}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{stock.pe_ratio?.toFixed(2) || '-'}</td>
                  <td className="px-4 py-2 text-right font-medium">${stock.price?.toFixed(2) || '-'}</td>
                  <td className={`px-4 py-2 text-right font-medium ${stock.change_percent && stock.change_percent < 0 ? 'text-red-500' : stock.change_percent && stock.change_percent > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {stock.change_percent ? `${stock.change_percent.toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{stock.volume ? stock.volume.toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save preset dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-white/10 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Save Screener Preset</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Save your current screener settings as a preset for quick access later.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="presetName">
                Preset Name
              </label>
              <input
                id="presetName"
                type="text"
                className="w-full px-3 py-2 bg-background border border-white/10 rounded focus:outline-none focus:border-primary"
                placeholder="E.g., High Growth Tech"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm rounded hover:bg-accent/50"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-primary text-background rounded hover:bg-primary/90"
                onClick={savePreset}
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
