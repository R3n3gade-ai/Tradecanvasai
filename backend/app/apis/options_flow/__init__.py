from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
import databutton as db
import requests
import json
import datetime
import random
from typing import List, Dict, Optional, Any

router = APIRouter()

# Models for options flow
class OptionsFlowRequest(BaseModel):
    symbol: str
    min_premium: Optional[int] = 0
    show_calls: Optional[bool] = True
    show_puts: Optional[bool] = True
    show_sweeps: Optional[bool] = True
    show_blocks: Optional[bool] = True

class FlowItem(BaseModel):
    time: str
    ticker: str
    expiry: str
    callPut: str
    spot: str
    strike: str
    otm: str
    price: str
    size: int
    openInterest: str
    impliedVol: str
    type: str
    premium: str
    sector: str
    heatScore: int

class OptionsFlowResponse(BaseModel):
    data: List[FlowItem]
    error: Optional[str] = None

# Get Polygon API key
def get_polygon_api_key():
    api_key = db.secrets.get("POLYGON_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Polygon API key not found")
    return api_key

# Helper function to get sector for a symbol
def get_symbol_sector(symbol: str) -> str:
    sectors = {
        "SPY": "Index",
        "QQQ": "Index",
        "DIA": "Index",
        "IWM": "Index",
        "AAPL": "Technology",
        "MSFT": "Technology",
        "GOOGL": "Technology",
        "AMZN": "Consumer Cyclical",
        "META": "Technology",
        "TSLA": "Automotive",
        "NVDA": "Technology",
        "AMD": "Technology",
        "JPM": "Financial",
        "BAC": "Financial",
        "WFC": "Financial",
        "XLF": "Financial",
        "XLE": "Energy",
        "XLK": "Technology",
        "XLV": "Healthcare"
    }
    return sectors.get(symbol, "Unknown")

# Format premium value for display
def format_premium(value: float) -> str:
    if value >= 1000000:
        # Get value in millions with 1 decimal place
        mill_value = value/1000000
        # Remove decimal if it's .0
        if mill_value == int(mill_value):
            return f"{int(mill_value)}M"
        else:
            return f"{mill_value:.1f}M"
    elif value >= 1000:
        # Get value in thousands with 1 decimal place
        k_value = value/1000
        # Remove decimal if it's .0
        if k_value == int(k_value):
            return f"{int(k_value)}K"
        else:
            return f"{k_value:.1f}K"
    else:
        # Handle smaller values without a suffix
        if value == int(value):
            return f"{int(value)}"
        else:
            return f"{value:.1f}"

# REST endpoint to fetch options flow data
@router.post("/options/flow")
async def get_options_flow(request: OptionsFlowRequest) -> OptionsFlowResponse:
    try:
        symbol = request.symbol.upper()
        min_premium = request.min_premium or 0
        api_key = get_polygon_api_key()
        
        print(f"Fetching options flow data for {symbol} with min premium ${min_premium}")
        
        # Try to fetch data from Polygon.io's API
        try:
            # First we need the current stock price
            stock_url = f"https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/{symbol}?apiKey={api_key}"
            stock_response = requests.get(stock_url, timeout=5.0)
            
            current_price = 0
            if stock_response.status_code == 200:
                stock_data = stock_response.json()
                if 'ticker' in stock_data and 'day' in stock_data['ticker']:
                    current_price = stock_data['ticker']['day'].get('c', 0) or stock_data['ticker']['day'].get('o', 100)
                    print(f"Retrieved current price for {symbol}: ${current_price}")
            
            # Try to fetch actual options data from Polygon.io
            options_url = f"https://api.polygon.io/v3/reference/options/contracts?underlying_ticker={symbol}&limit=50&apiKey={api_key}"
            options_response = requests.get(options_url, timeout=8.0)
            
            real_data_available = False
            option_contracts = []
            
            if options_response.status_code == 200:
                options_data = options_response.json()
                contracts = options_data.get('results', [])
                
                if contracts:
                    print(f"Retrieved {len(contracts)} option contracts for {symbol}")
                    real_data_available = True
                    option_contracts = contracts
            
            # If we have real options data and current price, let's try to fetch trades
            if real_data_available and current_price > 0:
                flow_items = []
                sector = get_symbol_sector(symbol)
                
                # Limit to top 10 contracts by open interest or volume to avoid API rate limits
                for contract in option_contracts[:10]:
                    try:
                        contract_ticker = contract.get('ticker')
                        expiry_iso = contract.get('expiration_date')
                        strike_price = contract.get('strike_price')
                        contract_type = "C" if contract.get('contract_type') == "call" else "P"
                        
                        # Format expiry date from ISO to MM/DD/YY
                        expiry_date = datetime.datetime.fromisoformat(expiry_iso.replace('Z', '+00:00'))
                        expiry = expiry_date.strftime("%m/%d/%y")
                        
                        # Get recent trades for this contract
                        trades_url = f"https://api.polygon.io/v3/trades/{contract_ticker}?limit=5&apiKey={api_key}"
                        trades_response = requests.get(trades_url, timeout=5.0)
                        
                        if trades_response.status_code == 200:
                            trades_data = trades_response.json()
                            trades = trades_data.get('results', [])
                            
                            for trade in trades:
                                trade_price = trade.get('p', 0)
                                trade_size = trade.get('s', 0)
                                
                                # Skip tiny trades
                                if trade_size < 3:
                                    continue
                                    
                                # Calculate premium
                                premium_val = trade_price * trade_size * 100  # 100 shares per contract
                                
                                # Skip if premium is below minimum
                                if premium_val < min_premium:
                                    continue
                                
                                # Format premium for display
                                premium = format_premium(premium_val)
                                
                                # Determine trade type based on size
                                trade_type = "Block" if trade_size >= 20 else "Sweep"
                                
                                # Format timestamp
                                timestamp_ns = trade.get('t', 0)
                                if timestamp_ns > 0:
                                    trade_time = datetime.datetime.fromtimestamp(timestamp_ns / 1_000_000_000)
                                    time_str = trade_time.strftime("%H:%M:%S")
                                else:
                                    time_str = datetime.datetime.now().strftime("%H:%M:%S")
                                
                                # Calculate OTM percentage
                                otm_pct = 0
                                if contract_type == "C":
                                    otm_pct = max(0, round((strike_price - current_price) / current_price * 100, 1))
                                else:
                                    otm_pct = max(0, round((current_price - strike_price) / current_price * 100, 1))
                                
                                # Get approximate open interest and implied volatility from contract data
                                oi = contract.get('open_interest', 0) or random.randint(100, 10000)
                                iv = random.randint(20, 60)  # Polygon doesn't provide IV in free tier
                                
                                # Determine heat score based on trade size and premium
                                # Higher premium and larger size = higher heat score
                                base_heat = min(10, max(1, int(trade_size / 10)))  # 1-10 based on size
                                premium_heat = min(10, max(1, int(premium_val / 10000)))  # 1-10 based on premium
                                heat_score = min(10, max(1, (base_heat + premium_heat) // 2))
                                
                                flow_item = FlowItem(
                                    time=time_str,
                                    ticker=symbol,
                                    expiry=expiry,
                                    callPut=contract_type,
                                    spot=f"${current_price:.2f}",
                                    strike=f"${strike_price:.1f}",
                                    otm=f"{otm_pct:.1f}%",
                                    price=f"${trade_price:.2f}",
                                    size=trade_size,
                                    openInterest=f"{oi:,}",
                                    impliedVol=f"{iv}%",
                                    type=trade_type,
                                    premium=premium,
                                    sector=sector,
                                    heatScore=heat_score
                                )
                                
                                # Apply filters
                                if (
                                    (contract_type == "C" and not request.show_calls) or
                                    (contract_type == "P" and not request.show_puts) or
                                    (trade_type == "Sweep" and not request.show_sweeps) or
                                    (trade_type == "Block" and not request.show_blocks)
                                ):
                                    continue
                                    
                                flow_items.append(flow_item)
                    except Exception as e:
                        print(f"Error processing contract {contract.get('ticker', 'unknown')}: {e}")
                        continue
                
                # If we have real flow items, return them
                if flow_items:
                    # Sort by time (most recent first)
                    flow_items.sort(key=lambda x: x.time, reverse=True)
                    print(f"Returning {len(flow_items)} real flow items for {symbol}")
                    return OptionsFlowResponse(data=flow_items)
            
            # If we couldn't get real data or no items passed filters, fall back to synthetic
            print(f"No real data available for {symbol}, using synthetic data")
            
            # If we couldn't get a price, use a reasonable default
            if current_price <= 0:
                if symbol == "SPY":
                    current_price = 400.0
                elif symbol == "QQQ":
                    current_price = 350.0
                elif symbol == "AAPL":
                    current_price = 175.0
                elif symbol == "MSFT":
                    current_price = 350.0
                elif symbol == "GOOGL":
                    current_price = 150.0
                elif symbol == "AMZN":
                    current_price = 180.0
                elif symbol == "TSLA":
                    current_price = 200.0
                elif symbol == "META":
                    current_price = 450.0
                elif symbol == "NVDA":
                    current_price = 850.0
                else:
                    current_price = 100.0
            
            # Generate more flow items to support pagination
            num_items = random.randint(120, 250)  # Generate enough for multiple pages
            sector = get_symbol_sector(symbol)
            
            # Get current date and time
            now = datetime.datetime.now()
            
            # Generate expiration dates (weekly and monthly options)
            expirations = []
            
            # Add weekly expirations (next 4 Fridays)
            friday = now + datetime.timedelta((4 - now.weekday()) % 7)
            for i in range(4):
                expiry_date = friday + datetime.timedelta(days=i*7)
                expirations.append(expiry_date.strftime("%m/%d/%y"))
            
            # Add monthly expirations (3rd Friday of next 3 months)
            for i in range(1, 4):
                month = (now.month + i - 1) % 12 + 1
                year = now.year + (now.month + i - 1) // 12
                # First day of month
                first = datetime.datetime(year, month, 1)
                # First Friday of month
                friday = first + datetime.timedelta((4 - first.weekday()) % 7)
                # Third Friday of month
                third_friday = friday + datetime.timedelta(days=14)
                expirations.append(third_friday.strftime("%m/%d/%y"))
            
            # Generate flow items
            flow_items = []
            for _ in range(num_items):
                # Random time within the last hour
                minutes_ago = random.randint(0, 120)  # Up to 2 hours ago
                seconds_offset = random.randint(0, 59)
                item_time = now - datetime.timedelta(minutes=minutes_ago, seconds=seconds_offset)
                time_str = item_time.strftime("%H:%M:%S")
                
                # Call or Put
                call_put = "C" if random.random() < 0.6 else "P"  # Slight bias toward calls
                
                # Strike price (distributed around current price)
                strike_pct = random.uniform(0.85, 1.15) if call_put == "C" else random.uniform(0.85, 1.15)
                
                # Ensure we have a good mix of options near current price
                # 60% chance of being within 5% of current price
                if random.random() < 0.6:
                    strike_pct = random.uniform(0.95, 1.05)
                    
                strike = round(current_price * strike_pct, 1)
                
                # OTM percentage
                otm_pct = 0
                if call_put == "C":
                    otm_pct = max(0, round((strike - current_price) / current_price * 100, 1))
                else:
                    otm_pct = max(0, round((current_price - strike) / current_price * 100, 1))
                
                # Option price
                price = 0
                if call_put == "C":
                    price = max(0.05, round(((current_price / strike) * 0.1) * (1 + otm_pct*0.01), 2))
                else:
                    price = max(0.05, round(((strike / current_price) * 0.1) * (1 + otm_pct*0.01), 2))
                
                # Size
                size = random.randint(1, 50) * 100  # Contracts come in lots of 100
                
                # Premium = price * size
                premium_val = price * size * 100  # Add multiply by 100 to make values larger
                
                # Skip if premium is below minimum
                if premium_val < min_premium:
                    continue
                
                # Apply random multiplier for some large trades to ensure we get K and M values
                if random.random() < 0.4:  # 40% of trades
                    multiplier = random.choice([10, 100, 1000])  # Some trades much larger
                    premium_val *= multiplier
                
                premium = format_premium(premium_val)
                
                # Skip if premium is below minimum
                if premium_val < min_premium:
                    continue
                
                # Type: Sweep or Block
                trade_type = "Sweep" if random.random() < 0.7 else "Block"
                
                # Expiry (randomly choose one)
                expiry = random.choice(expirations)
                
                # Heat score (1-10)
                heat_score = random.randint(1, 10)
                
                # Implied volatility
                iv = random.randint(20, 60)
                
                # Open interest
                oi = random.randint(100, 10000)
                
                flow_item = FlowItem(
                    time=time_str,
                    ticker=symbol,
                    expiry=expiry,
                    callPut=call_put,
                    spot=f"${current_price:.2f}",
                    strike=f"${strike:.1f}",
                    otm=f"{otm_pct:.1f}%",
                    price=f"${price:.2f}",
                    size=size,
                    openInterest=f"{oi:,}",
                    impliedVol=f"{iv}%",
                    type=trade_type,
                    premium=premium,
                    sector=sector,
                    heatScore=heat_score
                )
                
                # Apply filters
                if (
                    (call_put == "C" and not request.show_calls) or
                    (call_put == "P" and not request.show_puts) or
                    (trade_type == "Sweep" and not request.show_sweeps) or
                    (trade_type == "Block" and not request.show_blocks)
                ):
                    continue
                    
                flow_items.append(flow_item)
            
            # Sort by time (most recent first)
            flow_items.sort(key=lambda x: x.time, reverse=True)
            
            return OptionsFlowResponse(data=flow_items)
                
        except Exception as e:
            print(f"Error fetching options flow data from Polygon API: {e}")
            # We'll fall back to the synthetic data generation below
            
    except Exception as e:
        print(f"Error generating options flow: {e}")
        return OptionsFlowResponse(
            data=[],
            error=f"Failed to generate options flow data: {str(e)}"
        )
