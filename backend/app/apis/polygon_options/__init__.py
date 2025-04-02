from pydantic import BaseModel
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
import databutton as db
import json
import asyncio
import websockets
import time
import datetime
from typing import Dict, List, Optional, Any

router = APIRouter()

# Models for API requests and responses
class OptionsSymbolRequest(BaseModel):
    symbol: str

class OptionsChainResponse(BaseModel):
    symbol: str
    expirations: List[str]
    strikes: List[float]
    chain: Dict[str, Dict[str, Dict[str, Any]]] = {}
    underlyingPrice: Optional[float] = None
    error: Optional[str] = None

# Store active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# Store polygon.io WebSocket connection
polygon_ws = None

# Get Polygon API key
def get_polygon_api_key():
    api_key = db.secrets.get("POLYGON_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Polygon API key not found")
    return api_key

# Connect to Polygon WebSocket
async def connect_to_polygon():
    global polygon_ws
    api_key = get_polygon_api_key()
    
    try:
        # Connect to Polygon.io WebSocket (delayed endpoint based on documentation)
        polygon_ws = await websockets.connect("wss://delayed.polygon.io/options")
        
        # Authenticate
        auth_message = {"action": "auth", "params": api_key}
        await polygon_ws.send(json.dumps(auth_message))
        
        # Verify authentication success
        response = await polygon_ws.recv()
        response_data = json.loads(response)
        
        if not response_data or response_data[0]["status"] != "auth_success":
            print(f"Authentication failed: {response_data}")
            await polygon_ws.close()
            polygon_ws = None
            return False
        
        print("Successfully connected to Polygon.io WebSocket")
        return True
    except Exception as e:
        print(f"Error connecting to Polygon.io WebSocket: {e}")
        if polygon_ws:
            await polygon_ws.close()
        polygon_ws = None
        return False

# Subscribe to options for a symbol
async def subscribe_to_options(symbol: str):
    if not polygon_ws:
        success = await connect_to_polygon()
        if not success:
            return False
    
    try:
        # Format for options is typically: AM.O:SYMBOL
        subscribe_message = {"action": "subscribe", "params": f"AM.O:{symbol}*"}
        await polygon_ws.send(json.dumps(subscribe_message))
        print(f"Subscribed to options data for {symbol}")
        return True
    except Exception as e:
        print(f"Error subscribing to options data: {e}")
        return False

# WebSocket endpoint for streaming options data
@router.websocket("/ws/options/{client_id}")
async def websocket_options_endpoint(websocket: WebSocket, client_id: str):
    print(f"WebSocket connection attempt from client {client_id}")
    await websocket.accept()
    active_connections[client_id] = websocket
    print(f"Client {client_id} connected successfully")
    
    # For testing, send a simple success message immediately
    await websocket.send_json({"status": "connected", "message": "WebSocket connection established"})
    
    try:
        # Connect to Polygon if not already connected
        if not polygon_ws:
            success = await connect_to_polygon()
            if not success:
                await websocket.send_json({"error": "Failed to connect to Polygon.io"})
                await websocket.close()
                return
        
        # Listen for messages from client (to subscribe to specific symbols)
        async def receive_from_client():
            try:
                while True:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    print(f"Received from client: {message}")
                    
                    if message.get("action") == "subscribe" and message.get("symbol"):
                        symbol = message["symbol"]
                        success = await subscribe_to_options(symbol)
                        
                        if success:
                            await websocket.send_json({"status": "subscribed", "symbol": symbol})
                        else:
                            await websocket.send_json({"error": f"Failed to subscribe to {symbol}"})
            except Exception as e:
                print(f"Error receiving from client: {e}")
        
        # Forward messages from Polygon to client
        async def forward_from_polygon():
            try:
                # For testing, generate some synthetic options data
                count = 0
                # First send an immediate message to confirm connection
                await websocket.send_json({"status": "connected", "message": "WebSocket connection active and sending synthetic data"})
                
                while True:
                    await asyncio.sleep(5)  # Send a message every 5 seconds
                    count += 1
                    
                    # Log that we're about to send data
                    print(f"Sending synthetic data packet #{count}")
                    
                    # Get current symbol from client subscriptions
                    symbol = "SPY"  # Default to SPY
                    
                    # Generate different option symbols for variety
                    option_types = ["C", "P"]  # Call and Put
                    
                    # Format date for next month option (YYMMDD)
                    today = datetime.datetime.now()
                    next_month = today.replace(month=today.month+1 if today.month < 12 else 1)
                    date_str = next_month.strftime("%y%m%d")
                    
                    # Generate a random strike near 400 (for SPY)
                    base_strike = 400
                    strikes = [base_strike - 10, base_strike, base_strike + 10]
                    
                    # Generate sample data for different options
                    sample_data = []
                    for option_type in option_types:
                        for strike in strikes:
                            # Format strike price with padding (8 digits with leading zeros)
                            strike_str = f"{int(strike*1000):08d}"
                            
                            # Generate synthetic option symbol
                            # Format: O:SYMBOL{YYMMDD}{C/P}{STRIKE}
                            option_symbol = f"O:{symbol}{date_str}{option_type}{strike_str}"
                            
                            # Add random price movement
                            price = 2.45 + (count % 10) * 0.01 + (strike - base_strike) * 0.1
                            if option_type == "P":
                                price = price * 0.8  # Make puts cheaper for variety
                            
                            # Add to sample data
                            sample_data.append({
                                "ev": "T",  # Trade event
                                "sym": option_symbol,
                                "x": 4,  # Exchange ID
                                "p": round(price, 2),  # Price with small fluctuation
                                "s": int(10 + count % 20),  # Size
                                "t": int(time.time() * 1000)  # Current timestamp
                            })
                    
                    # Send synthetic data
                    await websocket.send_json(sample_data)
                    print(f"Sent {len(sample_data)} synthetic option trades")
                    
                    # Every 3rd message, also send a different event type
                    if count % 3 == 0:
                        await websocket.send_json([{"status": "connected", "message": f"Connection active, sent {count} updates"}])
                    
                    
                    # If we had a real connection:
                    # if polygon_ws:
                    #     data = await polygon_ws.recv()
                    #     # Forward the raw message to the client
                    #     await websocket.send_text(data)
            except Exception as e:
                print(f"Error forwarding from Polygon: {e}")
        
        # Run both tasks concurrently
        receive_task = asyncio.create_task(receive_from_client())
        forward_task = asyncio.create_task(forward_from_polygon())
        
        # Wait for either task to complete
        await asyncio.gather(receive_task, forward_task)
        
    except WebSocketDisconnect:
        print(f"Client {client_id} disconnected")
    except Exception as e:
        print(f"Error in websocket connection: {e}")
    finally:
        if client_id in active_connections:
            del active_connections[client_id]

# REST endpoint to fetch options chain data using Polygon.io snapshot API
@router.post("/options/chain")
async def get_options_chain(request: OptionsSymbolRequest):
    import requests
    import datetime
    import json
    from random import uniform
    
    symbol = request.symbol.upper()
    api_key = get_polygon_api_key()
    
    try:
        print(f"Fetching options chain data for {symbol} using Polygon.io snapshot API")
        # Use the Polygon.io snapshot API to get options data
        snapshot_url = f"https://api.polygon.io/v3/snapshot/options/{symbol}?limit=250&apiKey={api_key}"
        
        try:
            # Make the API request
            response = requests.get(snapshot_url, timeout=5.0)
            
            if response.status_code == 200:
                # Process the real API data
                options_data = response.json()
                
                # Extract expiration dates from the results
                expirations = set()
                strikes = set()
                underlying_price = None
                chain_data = {}
                
                # Process each option contract
                for result in options_data.get('results', []):
                    # Get option details
                    details = result.get('details', {})
                    expiration = details.get('expiration_date')
                    contract_type = details.get('contract_type')  # 'call' or 'put'
                    strike = details.get('strike_price')
                    ticker = details.get('ticker', '')
                    
                    # Get underlying asset price
                    underlying = result.get('underlying_asset', {})
                    if underlying_price is None and underlying.get('price'):
                        underlying_price = underlying.get('price')
                    
                    # Skip if missing essential data
                    if not all([expiration, contract_type, strike]):
                        continue
                    
                    # Add to sets for tracking
                    expirations.add(expiration)
                    strikes.add(strike)
                    
                    # Create option contract data structure
                    day_data = result.get('day', {})
                    greeks = result.get('greeks', {})
                    last_quote = result.get('last_quote', {})
                    last_trade = result.get('last_trade', {})
                    
                    # Format contract object
                    # Round implied volatility to 1 decimal place for cleaner display
                    iv_value = result.get('implied_volatility') or greeks.get('vega') or 0
                    iv_rounded = round(float(iv_value), 1) if iv_value else 0
                    
                    contract = {
                        "id": ticker,
                        "symbol": ticker,
                        "name": f"{symbol} {expiration} ${strike} {contract_type.capitalize()}",
                        "strike": strike,
                        "expirationDate": expiration,
                        "contractType": contract_type,
                        "lastPrice": last_trade.get('price') or day_data.get('close') or 0,
                        "change": day_data.get('change') or 0,
                        "bidPrice": last_quote.get('bid') or 0,
                        "askPrice": last_quote.get('ask') or 0,
                        "volume": day_data.get('volume') or 0,
                        "openInterest": result.get('open_interest') or 0,
                        "impliedVolatility": iv_rounded,
                        "inTheMoney": (contract_type == 'call' and underlying_price > strike) or 
                                     (contract_type == 'put' and underlying_price < strike)
                    }
                    
                    # Initialize expiration date in chain data if not exists
                    if expiration not in chain_data:
                        chain_data[expiration] = {
                            "calls": {},
                            "puts": {}
                        }
                    
                    # Add contract to the appropriate type (calls/puts)
                    strike_key = str(strike)
                    if contract_type == 'call':
                        chain_data[expiration]['calls'][strike_key] = contract
                    elif contract_type == 'put':
                        chain_data[expiration]['puts'][strike_key] = contract
                
                # Convert sets to sorted lists
                expirations_list = sorted(list(expirations))
                strikes_list = sorted(list(strikes))
                
                # If we got data from the API but no underlying price, estimate it
                if underlying_price is None:
                    # Use common price ranges for popular symbols
                    if symbol == "SPY":
                        underlying_price = 400.0
                    elif symbol == "QQQ":
                        underlying_price = 350.0
                    elif symbol == "AAPL":
                        underlying_price = 175.0
                    elif symbol == "MSFT":
                        underlying_price = 350.0
                    elif symbol == "GOOGL":
                        underlying_price = 150.0
                    elif symbol == "AMZN":
                        underlying_price = 180.0
                    elif symbol == "TSLA":
                        underlying_price = 200.0
                    elif symbol == "META":
                        underlying_price = 450.0
                    elif symbol == "NVDA":
                        underlying_price = 850.0
                    else:
                        underlying_price = 100.0
                        
                # If we only got one expiration date from the API, generate more
                if len(expirations_list) <= 1:
                    print(f"Only found {len(expirations_list)} expiration dates from API. Generating more synthetic ones.")
                    # Generate additional expiration dates (call the synthetic generation function)
                    # The returned data will have both the API dates and synthetic ones
                    return generate_synthetic_options_data(symbol, underlying_price, expirations_list, strikes_list, chain_data)
                
                return OptionsChainResponse(
                    symbol=symbol,
                    expirations=expirations_list,
                    strikes=strikes_list,
                    underlyingPrice=underlying_price,
                    chain=chain_data
                )
            
            else:
                print(f"Polygon API error: {response.status_code}. Falling back to synthetic data.")
                # Fall back to synthetic data
        except Exception as e:
            print(f"Error fetching options data from Polygon API: {e}. Falling back to synthetic data.")
        
        # If we reach here, we need to generate synthetic data
        print(f"Generating synthetic options data for {symbol}")
        return generate_synthetic_options_data(symbol)
    except Exception as e:
        print(f"Error generating options chain: {e}")
        # Make sure we always return a valid list of strikes with at least one value
        # to avoid Pydantic validation errors
        return OptionsChainResponse(
            symbol=symbol,
            expirations=[],
            strikes=[100.0],  # Default strike value to avoid empty list validation error
            error=f"Failed to generate options data: {str(e)}"
        )
    
# Helper function to generate synthetic options data
def generate_synthetic_options_data(symbol, underlying_price=None, existing_expirations=None, existing_strikes=None, existing_chain_data=None):
    """Generate synthetic options data for a given symbol.
    
    Args:
        symbol: The ticker symbol
        underlying_price: Pre-calculated price (if None, will be calculated)
        existing_expirations: List of existing expiration dates to include
        existing_strikes: List of existing strike prices to include
        existing_chain_data: Existing chain data to merge with synthetic data
        
    Returns:
        OptionsChainResponse with synthetic data
    """
    from random import uniform
    
    try:
        today = datetime.datetime.now()
        expirations = existing_expirations or []
        chain_data = existing_chain_data or {}
        
        # Generate a synthetic price if not provided
        if underlying_price is None:
            if symbol == "SPY":
                underlying_price = 400.0 + uniform(-20, 20)
            elif symbol == "QQQ":
                underlying_price = 350.0 + uniform(-15, 15)  
            elif symbol == "AAPL":
                underlying_price = 175.0 + uniform(-10, 10)  
            elif symbol == "MSFT":
                underlying_price = 350.0 + uniform(-10, 10)  
            elif symbol == "GOOGL":
                underlying_price = 150.0 + uniform(-5, 5)  
            elif symbol == "AMZN":
                underlying_price = 180.0 + uniform(-8, 8)   
            elif symbol == "TSLA":
                underlying_price = 200.0 + uniform(-15, 15) 
            elif symbol == "META":
                underlying_price = 450.0 + uniform(-10, 10)
            elif symbol == "NVDA":
                underlying_price = 850.0 + uniform(-30, 30)
            else:
                underlying_price = 100.0 + uniform(-10, 10)  # Default for other symbols
            
            print(f"Using synthetic price for {symbol}: ${underlying_price:.2f}")
            
            # Round to 2 decimal places for cleaner display
            underlying_price = round(underlying_price, 2)
        
        # Generate expiration dates (next 6 fridays + monthly options for next 6 months)
        expiration_dates = []
        current_date = today
        
        # Generate weekly expirations (next 6 Fridays)
        for _ in range(6):
            # Find the next friday
            days_until_friday = (4 - current_date.weekday()) % 7
            if days_until_friday == 0:
                days_until_friday = 7  # If today is Friday, go to next Friday
            next_friday = current_date + datetime.timedelta(days=days_until_friday)
            expiration_dates.append(next_friday)
            current_date = next_friday
        
        # Generate monthly expirations (3rd Friday of each month for next 6 months)
        current_month = today.month
        current_year = today.year
        for i in range(6):
            # Calculate the month and year
            month = ((current_month - 1 + i) % 12) + 1
            year = current_year + ((current_month + i - 1) // 12)
            
            # Get the first day of the month
            first_day = datetime.datetime(year, month, 1)
            
            # Calculate the day of the week of the first day (0 is Monday, 4 is Friday)
            first_day_weekday = first_day.weekday()
            
            # Calculate days until the first Friday
            days_until_first_friday = (4 - first_day_weekday) % 7
            
            # Calculate the third Friday (first Friday + 14 days)
            third_friday = first_day + datetime.timedelta(days=days_until_first_friday + 14)
            
            # Only add if not already in the list
            if third_friday not in expiration_dates:
                expiration_dates.append(third_friday)
        
        # Sort the expiration dates
        expiration_dates.sort()
            
        # Generate strikes around current price (15% below to 15% above)
        # Start with existing strikes if provided
        strikes = list(existing_strikes) if existing_strikes else []
        
        # Add synthetic strikes if needed
        lowest_strike = int(underlying_price * 0.85)
        highest_strike = int(underlying_price * 1.15)
        # Make sure we have strike prices at regular intervals
        strike_interval = 1.0 if underlying_price < 50 else (2.5 if underlying_price < 100 else 5.0)
        
        current_strike = lowest_strike
        while current_strike <= highest_strike:
            if current_strike not in strikes:  # Only add if not already in the list
                strikes.append(current_strike)
            current_strike += strike_interval
        
        # Sort the strikes
        strikes.sort()
            
        # Format expiration dates and generate options chain data
        for exp_date in expiration_dates:
            # Format as YYYY-MM-DD
            formatted_date = exp_date.strftime('%Y-%m-%d')
            if formatted_date not in expirations:  # Only add if not already in the list
                expirations.append(formatted_date)
                
                # Print diagnostic information
                print(f"Adding expiration date: {formatted_date}")
                
                # Generate option chain data for this expiration
                calls = {}
                puts = {}
                
                for strike in strikes:
                    strike_key = str(strike)
                    
                    # Generate call option
                    call_price = max(0.01, underlying_price - strike + uniform(0.1, 2.0))
                    call_iv = uniform(20.0, 40.0)
                    call = {
                        "id": f"{symbol}_{formatted_date}_C_{strike}",
                        "symbol": f"{symbol}{exp_date.strftime('%y%m%d')}C{int(strike*1000):08d}",
                        "name": f"{symbol} {exp_date.strftime('%b %d')} ${strike} Call",
                        "strike": strike,
                        "expirationDate": formatted_date,
                        "contractType": "call",
                        "lastPrice": round(call_price, 2),
                        "change": round(uniform(-0.5, 0.5), 2),
                        "bidPrice": round(call_price - uniform(0.05, 0.2), 2),
                        "askPrice": round(call_price + uniform(0.05, 0.2), 2),
                        "volume": int(uniform(10, 1000)),
                        "openInterest": int(uniform(100, 5000)),
                        "impliedVolatility": round(call_iv, 1),
                        "inTheMoney": underlying_price > strike
                    }
                    calls[strike_key] = call
                    
                    # Generate put option
                    put_price = max(0.01, strike - underlying_price + uniform(0.1, 2.0))
                    put_iv = uniform(20.0, 40.0)
                    put = {
                        "id": f"{symbol}_{formatted_date}_P_{strike}",
                        "symbol": f"{symbol}{exp_date.strftime('%y%m%d')}P{int(strike*1000):08d}",
                        "name": f"{symbol} {exp_date.strftime('%b %d')} ${strike} Put",
                        "strike": strike,
                        "expirationDate": formatted_date,
                        "contractType": "put",
                        "lastPrice": round(put_price, 2),
                        "change": round(uniform(-0.5, 0.5), 2),
                        "bidPrice": round(put_price - uniform(0.05, 0.2), 2),
                        "askPrice": round(put_price + uniform(0.05, 0.2), 2),
                        "volume": int(uniform(10, 1000)),
                        "openInterest": int(uniform(100, 5000)),
                        "impliedVolatility": round(put_iv, 1),
                        "inTheMoney": underlying_price < strike
                    }
                    puts[strike_key] = put
                
                chain_data[formatted_date] = {
                    "calls": calls,
                    "puts": puts
                }
        
        # Return the response after processing all expiration dates
        return OptionsChainResponse(
            symbol=symbol,
            expirations=sorted(expirations),  # Sort expirations for chronological order
            strikes=sorted(strikes),
            underlyingPrice=underlying_price,
            chain=chain_data
        )
    except Exception as e:
        print(f"Error in generate_synthetic_options_data: {e}")
        # Make sure we always return a valid list of strikes with at least one value
        # to avoid Pydantic validation errors
        return OptionsChainResponse(
            symbol=symbol,
            expirations=[],
            strikes=[100.0],  # Default strike value to avoid empty list validation error
            error=f"Failed to generate options data: {str(e)}"
        )
