import databutton as db
import json
import requests
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import re

# Create router for the API
router = APIRouter()

# Define models
class Bar(BaseModel):
    """Model for a single OHLC bar"""
    t: int  # Timestamp in milliseconds
    o: float  # Open price
    h: float  # High price
    l: float  # Low price
    c: float  # Close price
    v: float  # Volume
    vw: Optional[float] = None  # Volume weighted average price
    n: Optional[int] = None  # Number of trades

class HistoricalBarsResponse(BaseModel):
    """Response model for historical bars"""
    symbol: str
    bars: List[Bar]
    timeframe: str
    status: str
    error: Optional[str] = None
    source: Optional[str] = None  # Indicates the source of data (polygon, local cache, etc.)

# Constants
TIMEFRAME_MAPPING = {
    '1min': {'multiplier': 1, 'timespan': 'minute'},
    '5min': {'multiplier': 5, 'timespan': 'minute'},
    '15min': {'multiplier': 15, 'timespan': 'minute'},
    '30min': {'multiplier': 30, 'timespan': 'minute'},
    '1hour': {'multiplier': 1, 'timespan': 'hour'},
    '4hour': {'multiplier': 4, 'timespan': 'hour'},
    '1day': {'multiplier': 1, 'timespan': 'day'},
    '1week': {'multiplier': 1, 'timespan': 'week'},
    '1month': {'multiplier': 1, 'timespan': 'month'},
}

# Cache system for historical data
historical_data_cache = {}

# Helper to get Polygon API key
def get_polygon_api_key():
    """Get Polygon API key from secrets"""
    try:
        api_key = db.secrets.get("POLYGON_API_KEY")
        if not api_key:
            raise ValueError("Polygon API key not found in secrets")
        return api_key
    except Exception as e:
        print(f"Error getting Polygon API key: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve API credentials")

# Function to get historical bars from Polygon API
def fetch_historical_bars_from_polygon(
    symbol: str,
    multiplier: int,
    timespan: str,
    from_date: str,
    to_date: str,
    limit: int = 5000,  # Maximum allowed by Polygon
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """Fetch historical bars from Polygon API"""
    if not api_key:
        api_key = get_polygon_api_key()
    
    # Ensure symbol is uppercase
    symbol = symbol.upper()
    
    # Construct Polygon API URL
    polygon_base_url = "https://api.polygon.io/v2/aggs/ticker"
    url = f"{polygon_base_url}/{symbol}/range/{multiplier}/{timespan}/{from_date}/{to_date}?adjusted=true&sort=asc&limit={limit}"
    
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        data = response.json()
        
        # Check if the request was successful
        if response.status_code == 200 and data.get("status") == "OK":
            return {
                "status": "success",
                "data": data,
                "source": "polygon"
            }
        else:
            error_message = data.get("error", "Unknown error")
            print(f"Polygon API error: {error_message}")
            return {
                "status": "error",
                "error": error_message,
                "source": "polygon"
            }
    except Exception as e:
        print(f"Error fetching data from Polygon: {e}")
        return {
            "status": "error",
            "error": str(e),
            "source": "polygon"
        }

# Generate mock data for development and fallback
def generate_mock_bars(symbol: str, count: int = 200) -> List[Bar]:
    """Generate mock OHLC bars for testing and fallback"""
    bars = []
    
    # Use symbol name to vary the base price for realism
    base_price = 100  # Default
    
    # Common stock approximate prices
    if symbol == "SPY":
        base_price = 450
    elif symbol == "QQQ":
        base_price = 380
    elif symbol == "AAPL":
        base_price = 180
    elif symbol == "MSFT":
        base_price = 350
    elif symbol == "GOOGL":
        base_price = 140
    elif symbol == "AMZN":
        base_price = 180
    elif symbol == "TSLA":
        base_price = 230
    elif symbol == "META":
        base_price = 500
    
    volatility = 0.02  # 2% price movement maximum
    
    # Start from 'count' days ago
    now = datetime.now()
    timestamp = int((now - timedelta(days=count)).timestamp() * 1000)  # Convert to ms
    
    for _ in range(count):
        # Random price change percent
        change_percent = (2 * volatility * (0.5 - abs(0.5 - ((_ % 100) / 100)))) - (volatility / 2)
        price_change = base_price * change_percent
        
        open_price = base_price
        close_price = base_price + price_change
        high_price = max(open_price, close_price) + (abs(price_change) * 0.2)
        low_price = min(open_price, close_price) - (abs(price_change) * 0.2)
        
        # Volume between 100K and 5M
        volume = 100000 + ((_ % 10) * 490000)
        
        # Create bar
        bar = Bar(
            t=timestamp,
            o=open_price,
            h=high_price,
            l=low_price,
            c=close_price,
            v=volume,
            n=int(volume / 100)  # Estimated number of trades
        )
        
        bars.append(bar)
        
        # Update base price for next bar
        base_price = close_price
        
        # Move timestamp forward by one day
        timestamp += 24 * 60 * 60 * 1000  # 1 day in ms
    
    return bars

@router.get("/historical-bars")
async def get_historical_bars(
    symbol: str,
    timeframe: str = "1day",
    limit: int = 200,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
) -> HistoricalBarsResponse:
    """Get historical OHLC bars for a symbol"""
    # Validate timeframe
    if timeframe not in TIMEFRAME_MAPPING:
        raise HTTPException(status_code=400, detail=f"Invalid timeframe: {timeframe}. Supported values: {list(TIMEFRAME_MAPPING.keys())}")
    
    # Validate symbol (basic check)
    if not re.match(r'^[A-Za-z]{1,5}$', symbol):
        raise HTTPException(status_code=400, detail=f"Invalid symbol: {symbol}")
    
    symbol = symbol.upper()
    
    # Check cache first
    cache_key = f"{symbol}_{timeframe}_{limit}"
    cached_data = historical_data_cache.get(cache_key)
    
    # Use cache if it's less than 5 minutes old
    if cached_data and (datetime.now() - cached_data["timestamp"]).total_seconds() < 300:
        print(f"Using cached data for {cache_key}")
        return HistoricalBarsResponse(
            symbol=symbol,
            bars=cached_data["bars"],
            timeframe=timeframe,
            status="success",
            source="cache"
        )
    
    # Calculate date range if not provided
    if not to_date:
        to_date = datetime.now().strftime("%Y-%m-%d")
    
    if not from_date:
        # Calculate based on timeframe and limit
        timespan = TIMEFRAME_MAPPING[timeframe]["timespan"]
        multiplier = TIMEFRAME_MAPPING[timeframe]["multiplier"]
        
        if timespan == "minute":
            from_date = (datetime.now() - timedelta(minutes=multiplier * limit)).strftime("%Y-%m-%d")
        elif timespan == "hour":
            from_date = (datetime.now() - timedelta(hours=multiplier * limit)).strftime("%Y-%m-%d")
        elif timespan == "day":
            from_date = (datetime.now() - timedelta(days=multiplier * limit)).strftime("%Y-%m-%d")
        elif timespan == "week":
            from_date = (datetime.now() - timedelta(weeks=multiplier * limit)).strftime("%Y-%m-%d")
        elif timespan == "month":
            # Approximate a month as 30 days
            from_date = (datetime.now() - timedelta(days=30 * multiplier * limit)).strftime("%Y-%m-%d")
    
    try:
        # Try to fetch data from Polygon
        polygon_response = fetch_historical_bars_from_polygon(
            symbol=symbol,
            multiplier=TIMEFRAME_MAPPING[timeframe]["multiplier"],
            timespan=TIMEFRAME_MAPPING[timeframe]["timespan"],
            from_date=from_date,
            to_date=to_date,
            limit=limit
        )
        
        if polygon_response["status"] == "success":
            # Process Polygon response
            polygon_data = polygon_response["data"]
            results = polygon_data.get("results", [])
            
            # Convert to our Bar model
            bars = []
            for result in results:
                bar = Bar(
                    t=result["t"],  # Timestamp
                    o=result["o"],  # Open
                    h=result["h"],  # High
                    l=result["l"],  # Low
                    c=result["c"],  # Close
                    v=result["v"],  # Volume
                    vw=result.get("vw"),  # VWAP (optional)
                    n=result.get("n")   # Number of trades (optional)
                )
                bars.append(bar)
            
            # Update cache
            historical_data_cache[cache_key] = {
                "bars": bars,
                "timestamp": datetime.now()
            }
            
            return HistoricalBarsResponse(
                symbol=symbol,
                bars=bars,
                timeframe=timeframe,
                status="success",
                source="polygon"
            )
        else:
            # If Polygon fails, fall back to mock data
            print(f"Using mock data for {symbol} due to Polygon API error: {polygon_response.get('error')}")
            mock_bars = generate_mock_bars(symbol, limit)
            
            # Update cache with mock data
            historical_data_cache[cache_key] = {
                "bars": mock_bars,
                "timestamp": datetime.now()
            }
            
            return HistoricalBarsResponse(
                symbol=symbol,
                bars=mock_bars,
                timeframe=timeframe,
                status="success",
                source="mock",
                error=f"Polygon API error: {polygon_response.get('error')}. Using mock data."
            )
    
    except Exception as e:
        print(f"Error in get_historical_bars: {e}")
        # If anything fails, fall back to mock data
        mock_bars = generate_mock_bars(symbol, limit)
        
        return HistoricalBarsResponse(
            symbol=symbol,
            bars=mock_bars,
            timeframe=timeframe,
            status="success", # Return success with mock data
            source="mock",
            error=f"Error fetching data: {str(e)}. Using mock data instead."
        )
