from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
import databutton as db
import requests
from typing import Dict, List, Optional, Any, Literal
import re

router = APIRouter()

# Models for API requests and responses
class StockScreenerRequest(BaseModel):
    # Timeframe for technical indicators
    timeframe: Optional[str] = "1w"  # Default to weekly timeframe (1d, 1w, 1m, 3m, 1y)
    # Filter criteria
    exchange: Optional[str] = None  # 'nasdaq', 'nyse', 'amex', or None for any
    market_cap_min: Optional[float] = None
    market_cap_max: Optional[float] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    volume_min: Optional[int] = None
    float_min: Optional[float] = None
    float_max: Optional[float] = None
    dividend_min: Optional[float] = None
    dividend_max: Optional[float] = None
    is_etf: Optional[bool] = None
    has_options: Optional[bool] = None
    limit: Optional[int] = 100  # Default to 100 results
    page: Optional[int] = 1    # Pagination support
    sort_by: Optional[str] = "ticker"  # ticker, price, market_cap, etc.
    sort_direction: Optional[Literal["asc", "desc"]] = "asc"
    tickers: Optional[List[str]] = None  # Filter to specific tickers
    # Technical indicators
    rsi_min: Optional[float] = None
    rsi_max: Optional[float] = None
    sma_comparison: Optional[str] = None  # sma20_above_sma50, sma20_below_sma50, etc.
    macd_signal: Optional[str] = None  # bullish, bearish, bullish_crossover, bearish_crossover
    bollinger_signal: Optional[str] = None  # near_upper, near_lower, near_middle, squeeze, expansion
    keltner_signal: Optional[str] = None  # above_upper, below_lower, within, narrowing, widening
    stochastic_signal: Optional[str] = None  # oversold, overbought, bullish_crossover, bearish_crossover
    trend: Optional[str] = None  # strong_uptrend, weak_uptrend, sideways, weak_downtrend, strong_downtrend

class TickerDetails(BaseModel):
    ticker: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    market_cap: Optional[float] = None
    price: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None
    avg_volume: Optional[int] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    is_etf: bool = False
    has_options: bool = False
    # Technical indicators data
    rsi: Optional[float] = None
    sma20: Optional[float] = None
    sma50: Optional[float] = None
    sma_status: Optional[str] = None  # above, below, crossing_above, crossing_below
    macd: Optional[float] = None
    macd_signal: Optional[str] = None  # bullish, bearish, crossover
    bollinger_position: Optional[str] = None  # upper, lower, middle
    keltner_position: Optional[str] = None  # above_upper, below_lower, within
    stochastic: Optional[float] = None
    stochastic_signal: Optional[str] = None  # oversold, overbought, bullish, bearish

class StockScreenerResponse(BaseModel):
    results: List[TickerDetails]
    total_results: int
    page: int = 1
    error: Optional[str] = None

# Helper function to get Polygon API key
def get_polygon_api_key():
    api_key = db.secrets.get("POLYGON_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Polygon API key not found")
    return api_key

# Stock Screener endpoint
@router.post("/screen")
async def screen_stocks(request: StockScreenerRequest) -> StockScreenerResponse:
    api_key = get_polygon_api_key()
    
    try:
        print(f"Processing stock screener request: {request}")
        
        # First, get a list of tickers that match our criteria
        tickers_list = await get_filtered_tickers(request, api_key)
        
        # Calculate total number of matching tickers
        total_results = len(tickers_list)
        
        # Apply pagination
        page = max(1, request.page or 1)  # Ensure page is at least 1
        limit = min(request.limit or 50, 100)  # Cap at 100 to avoid overwhelming API
        
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        
        # Get the subset of tickers for the current page
        page_tickers = tickers_list[start_idx:end_idx] if start_idx < len(tickers_list) else []
        
        # Get details for each ticker
        results = []
        for ticker in page_tickers:
            try:
                details = await get_ticker_details(ticker, api_key, request)
                if details:
                    # Apply post-filtering for criteria not supported directly by the Polygon API endpoints
                    if should_include_ticker(details, request):
                        results.append(details)
            except Exception as e:
                print(f"Error getting details for {ticker}: {e}")
        
        # Sort results if sort criteria provided
        if request.sort_by:
            # Convert sort_by to the corresponding attribute in TickerDetails
            sort_field = request.sort_by
            # Handle special cases and conversions
            if sort_field == "marketCap" or sort_field == "market_cap":
                sort_field = "market_cap"
            elif sort_field == "changePercent" or sort_field == "change_percent":
                sort_field = "change_percent"
            elif sort_field == "avgVolume" or sort_field == "avg_volume":
                sort_field = "avg_volume"
            elif sort_field == "dividendYield" or sort_field == "dividend_yield":
                sort_field = "dividend_yield"
            elif sort_field == "peRatio" or sort_field == "pe_ratio":
                sort_field = "pe_ratio"
            
            # Sort the results
            reverse = request.sort_direction == "desc"
            results = sorted(results, key=lambda x: getattr(x, sort_field, 0) or 0, reverse=reverse)
        
        print(f"Returning {len(results)} results for stock screener (page {page} of {(total_results + limit - 1) // limit})")
        return StockScreenerResponse(
            results=results,
            total_results=total_results,  # Return the total count of matching tickers
            page=page
        )
    except Exception as e:
        print(f"Error in screen_stocks: {e}")
        return StockScreenerResponse(
            results=[],
            total_results=0,
            error=f"Failed to screen stocks: {str(e)}"
        )

# Helper function to get list of tickers based on filter criteria
async def get_filtered_tickers(request: StockScreenerRequest, api_key: str) -> List[str]:
    try:
        # If specific tickers were requested, return those directly (allows for quick specific search)
        if request.tickers and len(request.tickers) > 0:
            return [ticker.upper() for ticker in request.tickers]
            
        # Start with listing active tickers from Polygon
        url = f"https://api.polygon.io/v3/reference/tickers?active=true&sort=ticker&order=asc&limit=1000&apiKey={api_key}"
        
        # Add filter parameters
        if request.exchange:
            url += f"&exchange={request.exchange}"
        
        if request.market_cap_min:
            url += f"&market_cap.gte={request.market_cap_min}"
        
        if request.market_cap_max:
            url += f"&market_cap.lte={request.market_cap_max}"
        
        if request.price_min:
            url += f"&price.gte={request.price_min}"
        
        if request.price_max:
            url += f"&price.lte={request.price_max}"
        
        if request.volume_min:
            url += f"&volume.gte={request.volume_min}"
        
        if request.is_etf is not None:
            url += f"&type={'ETF' if request.is_etf else 'CS'}"
        
        # Add sector filtering - note Polygon doesn't directly support industry filtering in this endpoint
        # We'll need to filter by sector in the get_ticker_details function
        if request.sector:
            # Clean up the sector name to match what Polygon expects
            cleaned_sector = request.sector.replace('_', ' ').title()
            url += f"&sic_code.sector={cleaned_sector}"

        print(f"Making request to {url}")
        response = requests.get(url, timeout=10)  # Add timeout
        if response.status_code != 200:
            print(f"Polygon API error: {response.status_code}, {response.text}")
            # Fall back to a predefined list of common tickers
            return get_fallback_tickers()
            
        data = response.json()
        tickers = [result.get('ticker') for result in data.get('results', [])]
        
        # Get more pages if available
        next_url = data.get('next_url')
        while next_url and len(tickers) < 2000:  # Limit to 2000 tickers total
            next_url = f"{next_url}&apiKey={api_key}"
            response = requests.get(next_url, timeout=10)  # Add timeout
            if response.status_code != 200:
                break
                
            data = response.json()
            tickers.extend([result.get('ticker') for result in data.get('results', [])])
            next_url = data.get('next_url')
        
        print(f"Found {len(tickers)} tickers matching criteria")
        return tickers
    except Exception as e:
        print(f"Error in get_filtered_tickers: {e}")
        # Fall back to a predefined list of common tickers
        return get_fallback_tickers()

# Helper function to determine if a ticker should be included based on post-filters
def should_include_ticker(details: TickerDetails, request: StockScreenerRequest) -> bool:
    # Apply industry filter if specified
    if request.industry and details.industry:
        # Simple case-insensitive partial matching
        if request.industry.lower() not in details.industry.lower().replace('_', ' '):
            return False
    
    # Apply country filter if specified
    if request.country and details.country:
        if request.country.lower() != details.country.lower():
            return False
    
    # Apply dividend yield filter
    if request.dividend_min is not None and (details.dividend_yield is None or details.dividend_yield < request.dividend_min):
        return False
    
    if request.dividend_max is not None and (details.dividend_yield is not None and details.dividend_yield > request.dividend_max):
        return False
    
    # Apply average volume filter if specified
    if request.volume_min is not None and (details.avg_volume is None or details.avg_volume < request.volume_min):
        return False
    
    # Apply options filter if specified
    if request.has_options is not None and details.has_options != request.has_options:
        return False
        
    # Apply ETF filter if specified
    if request.is_etf is not None and details.is_etf != request.is_etf:
        return False
    
    # Apply RSI filters if specified
    if request.rsi_min is not None and (details.rsi is None or details.rsi < request.rsi_min):
        return False
        
    if request.rsi_max is not None and (details.rsi is not None and details.rsi > request.rsi_max):
        return False
        
    # Apply SMA comparison filter
    if request.sma_comparison and details.sma_status:
        if request.sma_comparison == 'sma20_above_sma50' and details.sma_status != 'above':
            return False
        elif request.sma_comparison == 'sma20_below_sma50' and details.sma_status != 'below':
            return False
        elif request.sma_comparison == 'sma20_crossing_above_sma50' and details.sma_status != 'crossing_above':
            return False
        elif request.sma_comparison == 'sma20_crossing_below_sma50' and details.sma_status != 'crossing_below':
            return False
            
    # Apply MACD signal filter
    if request.macd_signal and details.macd_signal:
        if request.macd_signal != details.macd_signal:
            return False
            
    # Apply Bollinger Bands filter
    if request.bollinger_signal and details.bollinger_position:
        if request.bollinger_signal == 'near_upper' and details.bollinger_position != 'upper':
            return False
        elif request.bollinger_signal == 'near_lower' and details.bollinger_position != 'lower':
            return False
        elif request.bollinger_signal == 'near_middle' and details.bollinger_position != 'middle':
            return False
            
    # Apply Keltner Channels filter
    if request.keltner_signal and details.keltner_position:
        if request.keltner_signal == 'above_upper' and details.keltner_position != 'above_upper':
            return False
        elif request.keltner_signal == 'below_lower' and details.keltner_position != 'below_lower':
            return False
        elif request.keltner_signal == 'within' and details.keltner_position != 'within':
            return False
        elif request.keltner_signal in ['narrowing', 'widening'] and details.keltner_position not in ['narrowing', 'widening']:
            # If we're looking for trend signals but don't have them, filter out
            return False
            
    # Apply Stochastic filter
    if request.stochastic_signal and details.stochastic_signal:
        if request.stochastic_signal != details.stochastic_signal:
            return False
    
    # Apply trend filter - would need more data points for a real implementation
    # For now, we'll use a simple approximation based on the other indicators
    
    return True

# Helper function to get details for a specific ticker
async def get_ticker_details(ticker: str, api_key: str, request: StockScreenerRequest = None) -> Optional[TickerDetails]:
    try:
        # Get ticker details from Polygon
        ticker_url = f"https://api.polygon.io/v3/reference/tickers/{ticker}?apiKey={api_key}"
        ticker_response = requests.get(ticker_url, timeout=10)  # Add timeout
        
        if ticker_response.status_code != 200:
            print(f"Error fetching ticker details for {ticker}: {ticker_response.status_code}")
            return None
            
        ticker_data = ticker_response.json().get('results', {})
        
        # Get latest price from Polygon
        price_url = f"https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/{ticker}?apiKey={api_key}"
        price_response = requests.get(price_url, timeout=10)  # Add timeout
        
        price_data = {}
        if price_response.status_code == 200:
            price_data = price_response.json().get('ticker', {})
        
        # Extract relevant data
        name = ticker_data.get('name', '')
        market_cap = ticker_data.get('market_cap')
        
        # Extract ticker details
        price = price_data.get('day', {}).get('c') if price_data else None
        change_percent = price_data.get('todaysChangePerc') if price_data else None
        volume = price_data.get('day', {}).get('v') if price_data else None
        avg_volume = price_data.get('prevDay', {}).get('v') if price_data else None
        
        # Get more details from additional Polygon endpoint
        details_data = {}
        try:
            details_url = f"https://api.polygon.io/v1/meta/symbols/{ticker}/company?apiKey={api_key}"
            details_response = requests.get(details_url, timeout=10)  # Add timeout
            if details_response.status_code == 200:
                details_data = details_response.json()
        except Exception as e:
            print(f"Error fetching additional details for {ticker}: {e}")
        
        # Extract sector, industry, country from details_data
        sector = details_data.get('sector', None)
        industry = details_data.get('industry', None)
        country = details_data.get('country', None)
        
        # Get PE ratio and dividend yield
        pe_ratio = details_data.get('pe_ratio')
        dividend_yield = details_data.get('dividend_yield')
        
        # If essential data is missing, try to get it from a different source
        if not sector or not industry:
            try:
                alt_details_url = f"https://api.polygon.io/v3/reference/tickers/{ticker}?apiKey={api_key}"
                alt_details_response = requests.get(alt_details_url, timeout=10)  # Add timeout
                if alt_details_response.status_code == 200:
                    alt_details_data = alt_details_response.json().get('results', {})
                    if not sector:
                        sector = alt_details_data.get('sic_code', {}).get('sector')
                    if not industry:
                        industry = alt_details_data.get('sic_code', {}).get('industry')
            except Exception as e:
                print(f"Error fetching alternative details for {ticker}: {e}")
        
        # Get technical indicators data if requested
        rsi = None
        sma20 = None
        sma50 = None
        sma_status = None
        macd = None
        macd_signal = None
        bollinger_position = None
        keltner_position = None
        stochastic = None
        stochastic_signal = None
        
        # Only fetch technical indicators if they're being used in the request
        if (request and (request.rsi_min is not None or request.rsi_max is not None or 
                request.sma_comparison or request.macd_signal or 
                request.bollinger_signal or request.keltner_signal or request.stochastic_signal or 
                request.trend)):
            # Map timeframe from request to Polygon API timespan
            timespan = "day"  # Default
            window_multiplier = 1
            
            # Convert timeframe to Polygon API parameters
            if request.timeframe:
                if request.timeframe == "1d":
                    timespan = "day"
                    window_multiplier = 1
                elif request.timeframe == "1w":
                    timespan = "week"
                    window_multiplier = 1
                elif request.timeframe == "1m":
                    timespan = "month"
                    window_multiplier = 1
                elif request.timeframe == "3m":
                    timespan = "month"
                    window_multiplier = 3
                elif request.timeframe == "1y":
                    timespan = "year"
                    window_multiplier = 1
                    
            print(f"Using timespan: {timespan} with multiplier: {window_multiplier} for technical indicators")
            try:
                # Get RSI data
                rsi_url = f"https://api.polygon.io/v1/indicators/rsi/{ticker}?timespan={timespan}&window=14&apiKey={api_key}"
                rsi_response = requests.get(rsi_url, timeout=10)  # Add timeout
                if rsi_response.status_code == 200:
                    rsi_data = rsi_response.json()
                    if rsi_data and 'results' in rsi_data and rsi_data['results'].get('values'):
                        rsi = rsi_data['results']['values'][0]  # Latest RSI value
                
                # Get SMA data (20 and 50 day)
                sma20_url = f"https://api.polygon.io/v1/indicators/sma/{ticker}?timespan={timespan}&window=20&apiKey={api_key}"
                sma20_response = requests.get(sma20_url, timeout=10)  # Add timeout
                if sma20_response.status_code == 200:
                    sma20_data = sma20_response.json()
                    if sma20_data and 'results' in sma20_data and sma20_data['results'].get('values'):
                        sma20 = sma20_data['results']['values'][0]  # Latest SMA20 value
                
                sma50_url = f"https://api.polygon.io/v1/indicators/sma/{ticker}?timespan={timespan}&window=50&apiKey={api_key}"
                sma50_response = requests.get(sma50_url, timeout=10)  # Add timeout
                if sma50_response.status_code == 200:
                    sma50_data = sma50_response.json()
                    if sma50_data and 'results' in sma50_data and sma50_data['results'].get('values'):
                        sma50 = sma50_data['results']['values'][0]  # Latest SMA50 value
                
                # Determine SMA status
                if sma20 is not None and sma50 is not None:
                    if sma20 > sma50:
                        sma_status = 'above'
                    elif sma20 < sma50:
                        sma_status = 'below'
                    # Basic crossover detection would need more data points
                    # For now we're simplifying
                
                # For a real implementation, we would get MACD, Bollinger Bands, Stochastic, etc.
                # These APIs would need to be called specifically
                
                # Get data for Keltner Channels
                try:
                    # Get EMA20 data (exponential moving average)
                    ema20_url = f"https://api.polygon.io/v1/indicators/ema/{ticker}?timespan={timespan}&window=20&apiKey={api_key}"
                    ema20_response = requests.get(ema20_url, timeout=10)
                    ema20 = None
                    
                    if ema20_response.status_code == 200:
                        ema20_data = ema20_response.json()
                        if ema20_data and 'results' in ema20_data and ema20_data['results'].get('values'):
                            ema20 = ema20_data['results']['values'][0]  # Latest EMA20 value
                    
                    # Get ATR (Average True Range) for volatility measurement
                    atr_url = f"https://api.polygon.io/v1/indicators/atr/{ticker}?timespan={timespan}&window=20&apiKey={api_key}"
                    atr_response = requests.get(atr_url, timeout=10)
                    atr = None
                    
                    if atr_response.status_code == 200:
                        atr_data = atr_response.json()
                        if atr_data and 'results' in atr_data and atr_data['results'].get('values'):
                            atr = atr_data['results']['values'][0]  # Latest ATR value
                    
                    # Calculate Keltner Channels if we have both EMA and ATR
                    if ema20 is not None and atr is not None and price is not None:
                        # Standard multiplier is 2
                        multiplier = 2
                        upper_channel = ema20 + (multiplier * atr)
                        lower_channel = ema20 - (multiplier * atr)
                        
                        # Determine position relative to Keltner Channels
                        if price > upper_channel:
                            keltner_position = 'above_upper'
                        elif price < lower_channel:
                            keltner_position = 'below_lower'
                        else:
                            keltner_position = 'within'
                            
                        # Additional calculations for narrowing/widening would require historical data
                        # For a simplified approach, let's get yesterday's ATR for comparison
                        if len(atr_data['results']['values']) > 1:
                            prev_atr = atr_data['results']['values'][1]  # Yesterday's ATR value
                            atr_change = atr - prev_atr
                            
                            # If ATR is decreasing, channels are narrowing (decreasing volatility)
                            if atr_change < -0.05:  # Threshold for significance
                                keltner_position = 'narrowing'
                            # If ATR is increasing, channels are widening (increasing volatility)
                            elif atr_change > 0.05:  # Threshold for significance
                                keltner_position = 'widening'
                except Exception as e:
                    print(f"Error calculating Keltner Channels for {ticker}: {e}")
                    keltner_position = None
            except Exception as e:
                print(f"Error fetching technical indicators for {ticker}: {e}")
        
        # Determine if it has options by checking if options are available
        has_options = False
        try:
            options_url = f"https://api.polygon.io/v3/reference/options/contracts?underlying_ticker={ticker}&limit=1&apiKey={api_key}"
            options_response = requests.get(options_url, timeout=5)  # Shorter timeout
            if options_response.status_code == 200:
                options_data = options_response.json()
                has_options = len(options_data.get('results', [])) > 0
        except Exception as e:
            # Fall back to simplified check based on market cap
            has_options = market_cap is not None and market_cap > 1_000_000_000
            print(f"Error checking options for {ticker}, using fallback: {e}")
        
        return TickerDetails(
            ticker=ticker,
            name=name,
            sector=sector,
            industry=industry,
            country=country,
            market_cap=market_cap,
            price=price,
            change_percent=change_percent,
            volume=volume,
            avg_volume=avg_volume,
            pe_ratio=pe_ratio,
            dividend_yield=dividend_yield,
            is_etf=(ticker_data.get('type') == 'ETF'),
            has_options=has_options,
            # Technical indicators
            rsi=rsi,
            sma20=sma20,
            sma50=sma50,
            sma_status=sma_status,
            macd=macd,
            macd_signal=macd_signal,
            bollinger_position=bollinger_position,
            keltner_position=keltner_position,
            stochastic=stochastic,
            stochastic_signal=stochastic_signal
        )
    except Exception as e:
        print(f"Error in get_ticker_details for {ticker}: {e}")
        return None

# Fallback list of common tickers in case the API fails
def get_fallback_tickers() -> List[str]:
    return [
        "AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "NVDA", "BRK.A", "BRK.B", "JPM", 
        "JNJ", "V", "PG", "UNH", "HD", "BAC", "MA", "DIS", "ADBE", "CRM", "NFLX", "PYPL", 
        "INTC", "VZ", "CSCO", "ABT", "TMO", "PFE", "CMCSA", "KO", "PEP", "ACN", "COST", 
        "NKE", "MRK", "T", "WMT", "MCD", "ABBV", "AVGO", "LLY", "CVX", "XOM", "ORCL", 
        "DHR", "WFC", "AMD", "NEE", "LIN", "TXN", "QCOM", "MDT", "BMY", "UPS", "PM", 
        "AMGN", "HON", "UNP", "IBM", "SBUX", "RTX", "C", "GS", "CAT", "MMM", "INTU", 
        "BA", "LOW", "CHTR", "GE", "AMAT", "AMT", "BKNG", "ISRG", "DE", "MU", "AXP", 
        "BLK", "MDLZ", "GILD", "TGT", "SYK", "ZTS", "FIS", "SPGI", "ADP", "ANTM", "TJX", 
        "CCI", "CSX", "CI", "PLD", "CME", "COP", "MS", "BDX", "ICE", "CB", "SO", "MO", 
        "SPY", "QQQ", "IWM", "DIA", "EFA", "EEM", "VTI", "VEA", "VWO", "AGG", "BND"
    ]
