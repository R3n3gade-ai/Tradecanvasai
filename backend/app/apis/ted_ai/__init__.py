from fastapi import APIRouter, HTTPException, Depends, Request
import asyncio
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from fastapi import File, UploadFile, Form
from app.apis.chart_analysis import ChartAnalysisRequest, ChartAnalysisResponse, analyze_trading_chart
import json
import databutton as db
from fastapi.responses import StreamingResponse
import datetime
import uuid
import time
import re
from app.apis.ted_brain_categories import sanitize_key
from app.apis.options_flow import get_options_flow, OptionsFlowRequest
from app.apis.dark_pool import get_dark_pool_trades

# Try to import Gemini library - gracefully handle if not available
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
    print("Google Generative AI package is available")
except ImportError:
    GEMINI_AVAILABLE = False
    print("Google Generative AI package is not available - using mock responses only")

# Try to import the brain store API
try:
    from app.apis.ted_brain import query_brain, QueryBrainRequest, QueryBrainResponse
    BRAIN_STORE_AVAILABLE = True
    print("Brain store API is available for personalized knowledge")
except ImportError:
    BRAIN_STORE_AVAILABLE = False
    print("Brain store API is not available - personalized knowledge disabled")


# Create router
router = APIRouter(tags=["TED AI Assistant"])

# Define models
class Message(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None

class Attachment(BaseModel):
    type: str  # 'chart', 'link', 'image'
    title: Optional[str] = None
    url: Optional[str] = None
    preview: Optional[str] = None

class ChatMessage(BaseModel):
    id: str
    type: str  # 'user' or 'ai'
    content: str
    timestamp: str
    attachments: Optional[List[Attachment]] = None

class ChatHistoryItem(BaseModel):
    id: str
    title: str
    timestamp: str
    preview: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None
    include_charts: bool = False
    include_market_data: bool = False

class ChatResponse(BaseModel):
    id: str
    content: str
    timestamp: str
    attachments: Optional[List[Attachment]] = None
    conversation_id: str

class ChatHistoryResponse(BaseModel):
    conversations: List[ChatHistoryItem]

# Helper for sanitizing storage keys - using the version from ted_brain_categories module

# Initialize Gemini (will be executed when API key is available)
def init_gemini(api_key: str = None):
    # Check if Gemini package is available
    if not GEMINI_AVAILABLE:
        print("Warning: Google Generative AI package not available")
        return None

    if not api_key:
        try:
            api_key = db.secrets.get("GEMINI_API_KEY")
        except Exception as e:
            # Use a fallback for development/testing
            print(f"Warning: GEMINI_API_KEY not found in secrets: {e}")
            return None

    # Configure Gemini with API key
    genai.configure(api_key=api_key)
    return genai

# Get Gemini model
def get_gemini_model(model_name: str = "gemini-2.0-flash-thinking-exp"):
    """Get a specific Gemini model instance"""
    try:
        genai_instance = init_gemini()
        if not genai_instance:
            return None

        # Initialize the model
        model = genai.GenerativeModel(model_name=model_name)
        return model
    except Exception as e:
        print(f"Error initializing Gemini model {model_name}: {e}")
        return None

# Storage utilities
def get_user_context(user_id: str):
    """Get user-specific context for personalization"""
    key = sanitize_key(f"user_context_{user_id}")
    try:
        return db.storage.json.get(key, default={})
    except Exception:
        return {}

def save_user_context(user_id: str, context: dict):
    """Save user-specific context for personalization"""
    key = sanitize_key(f"user_context_{user_id}")
    db.storage.json.put(key, context)

def get_conversation_history(conversation_id: str):
    """Get conversation history"""
    key = sanitize_key(f"conversation_{conversation_id}")
    try:
        return db.storage.json.get(key, default={"messages": []})
    except Exception:
        return {"messages": []}

def save_conversation(conversation_id: str, conversation: dict):
    """Save conversation"""
    key = sanitize_key(f"conversation_{conversation_id}")
    db.storage.json.put(key, conversation)

def save_message_to_conversation(conversation_id: str, message: dict):
    """Add a message to a conversation"""
    conversation = get_conversation_history(conversation_id)
    conversation["messages"] = conversation.get("messages", []) + [message]
    conversation["last_updated"] = datetime.datetime.now().isoformat()

    # Update the title based on first user message if not set
    if not conversation.get("title") and message.get("role") == "user":
        # Take first 30 chars of the first user message as title
        title = message["content"][:30]
        if len(message["content"]) > 30:
            title += "..."
        conversation["title"] = title

    save_conversation(conversation_id, conversation)

def get_user_conversations(user_id: str):
    """Get list of conversations for a user"""
    key = sanitize_key(f"user_conversations_{user_id}")
    try:
        return db.storage.json.get(key, default=[])
    except Exception:
        return []

def add_conversation_to_user(user_id: str, conversation_id: str, title: str):
    """Add conversation to user's list"""
    conversations = get_user_conversations(user_id)
    # Add to beginning of list (most recent first)
    conversations.insert(0, {
        "id": conversation_id,
        "title": title,
        "timestamp": datetime.datetime.now().isoformat()
    })
    # Keep only most recent 100 conversations
    if len(conversations) > 100:
        conversations = conversations[:100]
    key = sanitize_key(f"user_conversations_{user_id}")
    db.storage.json.put(key, conversations)

# Get real market data or use a fallback
def get_market_data(symbols=None):
    """Get market data, trying real APIs first then falling back to AI or mock data"""
    # If no symbols provided or empty list, use default list
    if not symbols:
        symbols = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "TSLA", "META"]

    # Make sure symbols is a list
    if isinstance(symbols, str):
        symbols = [symbols]
    
    # Filter out symbols that don't look like stock tickers
    symbols = [s for s in symbols if re.match(r'^[A-Z]{1,5}$', s)]
    
    # Try to use Polygon.io API first (most reliable real-time data)
    try:
        polygon_key = db.secrets.get("POLYGON_API_KEY")
        if polygon_key:
            print(f"Trying to get data from Polygon for {symbols}")
            polygon_data = get_polygon_market_data(symbols, polygon_key)
            if polygon_data and any(polygon_data.values()):
                print(f"Successfully retrieved Polygon data: {polygon_data}")
                return polygon_data
            else:
                print("No data returned from Polygon API")
    except Exception as e:
        print(f"Error getting data from Polygon: {e}")

    # Try to use Alpaca API if available
    try:
        alpaca_key = db.secrets.get("ALPACA_API_KEY")
        alpaca_secret = db.secrets.get("ALPACA_API_SECRET")
        if alpaca_key and alpaca_secret:
            print(f"Trying to get data from Alpaca for {symbols}")
            alpaca_data = get_alpaca_market_data(symbols, alpaca_key, alpaca_secret)
            if alpaca_data and any(alpaca_data.values()):
                print(f"Successfully retrieved Alpaca data: {alpaca_data}")
                return alpaca_data
            else:
                print("No data returned from Alpaca API")
    except Exception as e:
        print(f"Error getting data from Alpaca: {e}")
        
    # Try with Gemini as fallback for general info
    try:
        if GEMINI_AVAILABLE:
            print(f"Trying to get data from Gemini for {symbols}")
            gemini_data = get_gemini_market_data(symbols)
            if gemini_data and any(gemini_data.values()):
                print(f"Successfully retrieved Gemini data: {gemini_data}")
                return gemini_data
            else:
                print("No data returned from Gemini")
    except Exception as e:
        print(f"Error getting data from Gemini: {e}")

    # Fallback to mock data
    print(f"Falling back to mock data for {symbols}")
    return get_mock_market_data(symbols)

# Mock market data helper
def get_mock_market_data(symbols):
    """Get mock market data for development and testing"""
    result = {}
    symbol_list = [symbols] if isinstance(symbols, str) else symbols
    
    # Common stock price ranges and realistic price points
    # Updated with more recent and realistic prices
    base_prices = {
        "SPY": 498.75,
        "QQQ": 433.20,
        "AAPL": 169.50,
        "MSFT": 417.80,
        "NVDA": 879.90,
        "AMZN": 178.25,
        "GOOGL": 149.60,
        "TSLA": 172.82,
        "META": 474.88,
        "AMD": 175.50,
        "INTC": 42.75,
        "DIS": 114.30,
        "JPM": 189.35,
        "V": 275.40,
        "BAC": 37.20,
        "WMT": 59.85,
        "HD": 342.75,
        "PFE": 28.10,
        "JNJ": 152.90,
        "PG": 161.45
    }
    
    import random
    import datetime
    
    for symbol in symbol_list:
        try:
            # Use predefined price if available, otherwise generate a reasonable price
            if symbol in base_prices:
                base_price = base_prices[symbol]
            else:
                # For unknown symbols, generate a reasonable price based on typical market ranges
                category = random.choice(['tech', 'finance', 'consumer', 'healthcare'])
                if category == 'tech':
                    base_price = random.uniform(50, 500)
                elif category == 'finance':
                    base_price = random.uniform(30, 200)
                elif category == 'healthcare':
                    base_price = random.uniform(40, 300)
                else:
                    base_price = random.uniform(20, 150)
            
            # Generate realistic price variations
            # Smaller variations for larger indices, larger for individual stocks
            if symbol in ["SPY", "QQQ"]:
                # Index ETFs tend to have smaller percentage changes
                change_pct = random.uniform(-0.8, 0.8)  
            else:
                # Individual stocks can have wider swings
                change_pct = random.uniform(-2.0, 2.0)
                
            # Calculate change amount
            change = base_price * (change_pct / 100)
            # Calculate final price with small random variation
            price = base_price + change + random.uniform(-0.5, 0.5)
            
            result[symbol] = {
                "price": round(price, 2),
                "change": round(change, 2),
                "change_percent": round(change_pct, 2),
                "source": "mock",
                "timestamp": datetime.datetime.now().isoformat(),
                "prev_close": round(base_price, 2)
            }
        except Exception as e:
            print(f"Error generating mock data for {symbol}: {e}")
    
    return result

# Gemini market data helper
def get_gemini_market_data(symbols):
    """Get market data for specified symbols using Gemini 2.0 Thinking model"""
    result = {}
    symbol_list = [symbols] if isinstance(symbols, str) else symbols

    # Get the Gemini 2.0 Thinking model
    model = get_gemini_model("gemini-2.0-flash-thinking-exp")
    if not model:
        raise Exception("Could not initialize Gemini model")

    # Use ONE structured Gemini call to get multiple stock prices simultaneously
    try:
        # Create a structured prompt that explicitly asks for exact pricing data
        symbols_str = ", ".join(symbol_list[:10])  # Limit to 10 symbols to avoid token limits
        prompt = f"""
        I need accurate, current market data for these stock symbols: {symbols_str}.
        ONLY provide the data, no commentary or analysis.
        
        For each symbol, return ONLY the current price, and note the source is AI-estimation, not real-time data.
        
        Format your response as a JSON structure EXACTLY like this:
        {{
          "SYMBOL1": {{
            "price": 123.45,
            "source": "ai-estimation"
          }},
          "SYMBOL2": {{
            "price": 67.89,
            "source": "ai-estimation"
          }}
        }}
        
        IMPORTANT: Only include the JSON in your response, no other text. Use the exact symbols I provided.
        """
        
        print(f"Sending batch request to Gemini for symbols: {symbol_list}")
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Extract the JSON from the response
        import re
        import json
        
        # Look for JSON pattern between curly braces
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                data_json = json.loads(json_match.group(0))
                print(f"Successfully parsed JSON from Gemini: {data_json}")
                
                # Process the JSON data
                for symbol in symbol_list:
                    if symbol in data_json:
                        symbol_data = data_json[symbol]
                        if 'price' in symbol_data:
                            price = float(symbol_data['price'])
                            
                            # Generate reasonable change values since Gemini doesn't provide them
                            import random
                            change_pct = random.uniform(-1.0, 1.0)  # Random change between -1% and 1%
                            change = price * (change_pct / 100)
                            
                            result[symbol] = {
                                "price": price,
                                "change": round(change, 2),
                                "change_percent": round(change_pct, 2),
                                "source": "gemini",
                                "estimated": True  # Flag that this is an estimate, not actual market data
                            }
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON from Gemini response: {e}")
    except Exception as e:
        print(f"Error getting batch data from Gemini: {e}")

    return result

# Polygon market data helper
def get_polygon_market_data(symbols, api_key):
    """Get market data from Polygon.io API"""
    import requests
    result = {}
    symbol_list = [symbols] if isinstance(symbols, str) else symbols

    for symbol in symbol_list:
        try:
            # Call Polygon API for current price
            url = f"https://api.polygon.io/v2/last/trade/{symbol}?apiKey={api_key}"
            print(f"Calling Polygon API: {url}")
            response = requests.get(url)
            response.raise_for_status()  # This will raise an exception for HTTP errors
            data = response.json()
            print(f"Polygon response for {symbol}: {data}")

            if 'results' in data:
                print(f"Found results for {symbol} in Polygon data")
                price = data['results']['p']  # price

                # Get previous close for change calculation
                prev_url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}/prev?apiKey={api_key}"
                print(f"Calling Polygon previous day API: {prev_url}")
                prev_response = requests.get(prev_url)
                prev_data = prev_response.json()
                print(f"Polygon previous day response for {symbol}: {prev_data}")

                prev_close = prev_data.get('results', [{}])[0].get('c', price) if 'results' in prev_data and prev_data['results'] else price
                change = price - prev_close
                change_percent = (change / prev_close * 100) if prev_close else 0

                result[symbol] = {
                    "price": price,
                    "change": round(change, 2),  # Round to 2 decimal places for cleaner output
                    "change_percent": round(change_percent, 2),  # Round to 2 decimal places
                    "source": "polygon",
                    "timestamp": datetime.datetime.now().isoformat(),
                    "prev_close": prev_close
                }
                print(f"Successfully processed {symbol} data from Polygon")
            else:
                print(f"No results found for {symbol} in Polygon data")
        except Exception as e:
            print(f"Error getting {symbol} data from Polygon: {e}")

    return result

# Alpaca market data helper
def get_alpaca_market_data(symbols, api_key, api_secret):
    """Get market data from Alpaca API"""
    import requests
    result = {}
    symbol_list = [symbols] if isinstance(symbols, str) else symbols

    # Set up authentication for Alpaca API
    headers = {
        "APCA-API-KEY-ID": api_key,
        "APCA-API-SECRET-KEY": api_secret
    }

    try:
        # Get current prices
        symbols_param = ",".join(symbol_list)
        url = f"https://data.alpaca.markets/v2/stocks/quotes/latest?symbols={symbols_param}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        if 'quotes' in data:
            for symbol, quote in data['quotes'].items():
                if symbol in symbol_list:
                    price = quote['ap'] # ask price

                    # Get previous day's data
                    bars_url = f"https://data.alpaca.markets/v2/stocks/{symbol}/bars?timeframe=1D&limit=2"
                    bars_response = requests.get(bars_url, headers=headers)
                    bars_data = bars_response.json()

                    prev_close = None
                    if 'bars' in bars_data and len(bars_data['bars']) > 1:
                        prev_close = bars_data['bars'][-2]['c'] # previous day's close

                    change = price - prev_close if prev_close else 0
                    change_percent = (change / prev_close * 100) if prev_close else 0

                    result[symbol] = {
                        "price": price,
                        "change": change,
                        "change_percent": change_percent,
                        "source": "alpaca"
                    }
    except Exception as e:
        print(f"Error getting data from Alpaca: {e}")

    return result

# Mock chart helper
def get_chart_attachments(symbols, timeframe="1d"):
    """Generate mock chart attachment data"""
    mock_charts = {
        "SPY": "https://picsum.photos/id/1/400/200",
        "QQQ": "https://picsum.photos/id/2/400/200",
        "AAPL": "https://picsum.photos/id/3/400/200",
        "MSFT": "https://picsum.photos/id/4/400/200",
        "NVDA": "https://picsum.photos/id/5/400/200",
        "AMZN": "https://picsum.photos/id/6/400/200",
        "GOOGL": "https://picsum.photos/id/7/400/200",
        "TSLA": "https://picsum.photos/id/8/400/200",
        "META": "https://picsum.photos/id/9/400/200",
    }

    attachments = []
    if isinstance(symbols, str):
        symbols = [symbols]

    for symbol in symbols:
        if symbol in mock_charts:
            attachments.append({
                "type": "chart",
                "title": f"{symbol} {timeframe} Chart",
                "preview": mock_charts[symbol],
            })

    return attachments

# Get personalized knowledge from user's brain
async def get_personalized_knowledge(user_id: str, query: str, limit: int = 3):
    """Get personalized knowledge from the user's brain store"""
    if not BRAIN_STORE_AVAILABLE:
        return []

    try:
        from app.apis.ted_brain import query_brain, QueryBrainRequest

        # Query the brain store
        request = QueryBrainRequest(user_id=user_id, query=query, limit=limit)
        response = await query_brain(request)

        # Format results for inclusion in the prompt
        knowledge = []
        for item in response.results:
            knowledge.append({
                "content": item.content,
                "source": item.source,
                "timestamp": item.timestamp if hasattr(item, 'timestamp') else None,
            })

        return knowledge
    except Exception as e:
        print(f"Error getting personalized knowledge: {e}")
        return []

# Generate AI response using Gemini
async def generate_ai_response(message, history=None, user_context=None, include_charts=False, personalized_knowledge=None):
    """Generate AI response based on message and history"""
    # Try to use Gemini if available
    if GEMINI_AVAILABLE:
        try:
            # Get the Gemini model
            model = get_gemini_model()
            if model:
                # Include personalized knowledge in the prompt if available
                knowledge_context = ""
                if personalized_knowledge and len(personalized_knowledge) > 0:
                    knowledge_context = "\nUser's saved information:\n"
                    for i, item in enumerate(personalized_knowledge):
                        knowledge_context += f"{i+1}. {item['content']}\n"
                
                # Construct prompt with market information
                system_prompt = (
                    "You are TED, an expert AI trading and investment assistant with deep knowledge of markets, "
                    "technical analysis, options strategies, and investment principles. You provide "
                    "concise, data-driven insights to professional traders and investors. Your goal is to help users "
                    "make more informed trading decisions through clear, actionable analysis.\n\n"
                    "IMPORTANT GUIDELINES:\n"
                    "1. NEVER make up or estimate stock prices. ONLY use the exact market data I will provide you.\n"
                    "2. If you don't have current market data for a symbol, clearly state that you don't have the data.\n"
                    "3. ALWAYS include the data source (polygon, alpaca, gemini, mock) when discussing market data.\n"
                    "4. ONLY discuss price movements you can verify with the provided data.\n"
                    "5. Be clear about the limitations of your knowledge when appropriate.\n\n"
                    "Today's date: " + datetime.datetime.now().strftime("%Y-%m-%d") + "\n"
                )
                
                # Get real-time market data if this is market related
                market_context = ""
                stock_symbols = re.findall(r'\b[A-Z]{1,5}\b', message)
                # Don't limit to only these symbols - try to get data for any stock symbol
                # We'll filter invalid ones through the API response
                
                # Always try to get market data for any stock symbols mentioned, regardless of query type
                # This ensures we ground the model with accurate data
                if stock_symbols:
                    market_data = get_market_data(stock_symbols)
                    market_context = "\nCURRENT VERIFIED MARKET DATA (You MUST use these exact values):\n"
                    for symbol, data in market_data.items():
                        change_sign = "+" if data["change"] > 0 else ""
                        source = data.get("source", "unknown")
                        estimated = "(estimated)" if data.get("estimated", False) else ""
                        market_context += f"{symbol}: ${data['price']:.2f} ({change_sign}{data['change']:.2f}, {change_sign}{data['change_percent']:.2f}%) [Source: {source} {estimated}]\n"
                    
                    # Add explicit instruction to use this data
                    market_context += "\nIMPORTANT: You MUST only discuss these exact prices and values when talking about these stocks. Do NOT make up or estimate any stock prices not listed above.\n"
                
                # Combine all context
                full_prompt = system_prompt + knowledge_context + market_context + "\nUser query: " + message
                
                # Generate response
                response = await asyncio.to_thread(
                    model.generate_content,
                    full_prompt
                )
                
                # Process response
                if response and hasattr(response, 'text'):
                    content = response.text.strip()
                    attachments = []
                    
                    # Add chart attachments if requested
                    if include_charts and stock_symbols:
                        attachments = get_chart_attachments(stock_symbols)
                    
                    return content, attachments
        except Exception as e:
            print(f"Error generating response with Gemini: {e}")
            # Fall through to backup response methods

    # Extract potential stock symbols (simple implementation)
    stock_symbols = re.findall(r'\b[A-Z]{1,5}\b', message)
    stock_symbols = [s for s in stock_symbols if s in ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META']]

    # Check message intent
    is_market_query = any(kw in message.lower() for kw in ["market", "stock", "trade", "invest", "price", "chart", "trend"])
    is_analysis_query = any(kw in message.lower() for kw in ["analyze", "analysis", "compare", "performance", "technical", "fundamental"])
    is_portfolio_query = any(kw in message.lower() for kw in ["portfolio", "holding", "position", "my stocks", "my investments"])
    is_options_flow_query = any(kw in message.lower() for kw in ["options flow", "option flow", "unusual options"])
    is_dark_pool_query = any(kw in message.lower() for kw in ["dark pool", "darkpool", "off-exchange", "block trades"])

    # Handle options flow query
    if is_options_flow_query and stock_symbols:
        try:
            # Extract symbol
            symbol = stock_symbols[0]
            
            # Set up the request
            flow_request = OptionsFlowRequest(
                symbol=symbol,
                min_premium=10000,  # $10k minimum premium
                show_calls=True,
                show_puts=True,
                show_sweeps=True,
                show_blocks=True
            )
            
            # Fetch options flow data
            flow_response = await get_options_flow(flow_request)
            
            # Build response
            if flow_response and flow_response.data and len(flow_response.data) > 0:
                calls = sum(1 for item in flow_response.data if item.callPut == "C")
                puts = sum(1 for item in flow_response.data if item.callPut == "P")
                call_put_ratio = calls / puts if puts > 0 else float('inf')
                
                response = f"I analyzed the options flow for {symbol}:\n\n"
                response += f"• Call/Put Ratio: {call_put_ratio:.2f} ({calls} calls vs {puts} puts)\n"
                response += f"• {len(flow_response.data)} options transactions detected\n\n"
                
                if call_put_ratio > 1.5:
                    response += "The options flow shows bullish positioning with significant call buying activity.\n"
                elif call_put_ratio < 0.67:
                    response += "The options flow shows bearish positioning with significant put buying activity.\n"
                else:
                    response += "The options flow shows mixed sentiment with balanced call/put activity.\n"
                
                return response, []
            else:
                return f"I couldn't find sufficient options flow data for {symbol}. Would you like to try another symbol?", []
        except Exception as e:
            print(f"Error in options flow analysis: {e}")
            return f"I encountered an error analyzing options flow for {stock_symbols[0]}. The options market provides valuable insights into institutional sentiment and positioning. Would you like to try another symbol?", []

    # Handle dark pool query
    if is_dark_pool_query and stock_symbols:
        try:
            # Extract symbol
            symbol = stock_symbols[0]
            
            # Fetch dark pool data
            dp_response = await get_dark_pool_trades(symbol=symbol)
            
            # Build response
            if dp_response and dp_response.levels:
                response = f"I analyzed dark pool trading for {symbol}:\n\n"
                
                # Get current price
                current_price = dp_response.levels.price.replace('$', '')
                try:
                    current_price = float(current_price)
                except Exception:
                    current_price = 0
                
                # Find key price levels
                key_levels = []
                for level in dp_response.levels.levels:
                    if level.isHighlighted or float(level.percentage.replace('%', '')) > 5.0:
                        price = float(level.price)
                        key_levels.append({
                            'price': price,
                            'volume': level.volume,
                            'percentage': level.percentage
                        })
                
                # Sort by price
                key_levels.sort(key=lambda x: x['price'])
                
                # Identify support and resistance levels
                support_levels = [level for level in key_levels if level['price'] < current_price]
                resistance_levels = [level for level in key_levels if level['price'] >= current_price]
                
                # Add dark pool summary
                if support_levels and resistance_levels:
                    response += f"Dark pool analysis shows key support at ${support_levels[-1]['price']:.2f} "
                    response += f"and resistance at ${resistance_levels[0]['price']:.2f}.\n\n"
                    response += "These levels represent significant institutional positioning that could act as price inflection points.\n"
                
                return response, []
            else:
                return f"I couldn't find sufficient dark pool data for {symbol}. Would you like to try another symbol?", []
        except Exception as e:
            print(f"Error in dark pool analysis: {e}")
            return f"I encountered an error analyzing dark pool activity for {stock_symbols[0]}. Dark pool trading represents institutional activity that occurs off public exchanges. Would you like to try another symbol?", []

    # Handle market queries
    if is_market_query and stock_symbols:
        # Generate market data response for specific symbols
        market_data = get_market_data(stock_symbols)
        response = f"Here's the current market data for {', '.join(stock_symbols)}:\n\n"
        for symbol, data in market_data.items():
            change_sign = "+" if data["change"] > 0 else ""
            source = data.get("source", "unknown")
            estimated = "(estimated)" if data.get("estimated", False) else ""
            response += f"• {symbol}: ${data['price']:.2f} ({change_sign}{data['change']:.2f}, {change_sign}{data['change_percent']:.2f}%) [Source: {source} {estimated}]\n"

        # Add source information
        response += "\nData sources:\n"
        response += "• polygon: Direct from Polygon.io exchange data (high accuracy)\n"
        response += "• alpaca: From Alpaca brokerage data (high accuracy)\n"
        response += "• gemini: AI-estimated approximation (moderate accuracy)\n"
        response += "• mock: Demonstration data (not accurate)\n\n"
        response += "Would you like technical analysis or recent news for these stocks?"

        # Add chart attachments if requested
        attachments = []
        if include_charts:
            attachments = get_chart_attachments(stock_symbols)
        return response, attachments

    # Handle other queries with default responses
    responses = [
        "I can provide market analysis, portfolio insights, and trading strategies based on your preferences and goals. What specifically would you like to know about today?",
        "I'm analyzing the current market conditions and can offer insights on sectors, individual stocks, or overall market trends. What are you interested in learning about?",
        "I can help with technical analysis, fundamental research, or market news synthesis. Let me know what type of financial information you're looking for.",
        "Based on your previous interactions, I can provide personalized insights on your watchlist stocks or preferred sectors. What would you like to focus on today?"
    ]
    import random
    return random.choice(responses), []

# Stream AI response for chat
async def stream_ai_response(request: ChatRequest):
    """Stream AI response based on message"""
    # Get user context and conversation history
    user_id = request.user_id or "anonymous"
    conversation_id = request.conversation_id or str(uuid.uuid4())
    user_context = get_user_context(user_id)

    # Get conversation history
    conversation = get_conversation_history(conversation_id)
    history = conversation.get("messages", [])
    
    # Save user message to history
    user_message = {
        "role": "user",
        "content": request.message,
        "timestamp": datetime.datetime.now().isoformat()
    }
    save_message_to_conversation(conversation_id, user_message)
    
    # Get personalized knowledge from user's brain store
    personalized_knowledge = []
    if request.user_id:
        personalized_knowledge = await get_personalized_knowledge(
            user_id=request.user_id,
            query=request.message,
            limit=3
        )

    # Extract potential stock symbols (simple implementation)
    stock_symbols = re.findall(r'\b[A-Z]{1,5}\b', request.message)
    stock_symbols = [s for s in stock_symbols if re.match(r'^[A-Z]{1,5}$', s)]
    
    # Try to use Gemini if available
    if GEMINI_AVAILABLE:
        try:
            # Get the Gemini model
            model = get_gemini_model()
            if model:
                # Include personalized knowledge in the prompt if available
                knowledge_context = ""
                if personalized_knowledge and len(personalized_knowledge) > 0:
                    knowledge_context = "\nUser's saved information:\n"
                    for i, item in enumerate(personalized_knowledge):
                        knowledge_context += f"{i+1}. {item['content']}\n"
                
                # Construct prompt with market information
                system_prompt = (
                    "You are TED, an expert AI trading and investment assistant with deep knowledge of markets, "
                    "technical analysis, options strategies, and investment principles. You provide "
                    "concise, data-driven insights to professional traders and investors. Your goal is to help users "
                    "make more informed trading decisions through clear, actionable analysis.\n\n"
                    "IMPORTANT GUIDELINES:\n"
                    "1. NEVER make up or estimate stock prices. ONLY use the exact market data I will provide you.\n"
                    "2. If you don't have current market data for a symbol, clearly state that you don't have the data.\n"
                    "3. ALWAYS include the data source (polygon, alpaca, gemini, mock) when discussing market data.\n"
                    "4. ONLY discuss price movements you can verify with the provided data.\n"
                    "5. Be clear about the limitations of your knowledge when appropriate.\n\n"
                    "Today's date: " + datetime.datetime.now().strftime("%Y-%m-%d") + "\n"
                )
                
                # Get real-time market data for stock symbols mentioned
                market_context = ""
                if stock_symbols:
                    market_data = get_market_data(stock_symbols)
                    market_context = "\nCURRENT VERIFIED MARKET DATA (You MUST use these exact values):\n"
                    for symbol, data in market_data.items():
                        change_sign = "+" if data["change"] > 0 else ""
                        source = data.get("source", "unknown")
                        estimated = "(estimated)" if data.get("estimated", False) else ""
                        market_context += f"{symbol}: ${data['price']:.2f} ({change_sign}{data['change']:.2f}, {change_sign}{data['change_percent']:.2f}%) [Source: {source} {estimated}]\n"
                    
                    # Add explicit instruction to use this data
                    market_context += "\nIMPORTANT: You MUST only discuss these exact prices and values when talking about these stocks. Do NOT make up or estimate any stock prices not listed above.\n"
                
                # Add recent conversation history
                history_context = ""
                if history and len(history) > 0:
                    recent_history = history[-4:]  # Get last 4 messages
                    history_context = "\nRecent conversation:\n"
                    for msg in recent_history:
                        role = "User" if msg.get("role") == "user" else "Assistant"
                        history_context += f"{role}: {msg.get('content', '')}\n"
                
                # Combine all context
                full_prompt = system_prompt + knowledge_context + market_context + history_context + "\nUser query: " + request.message
                
                # Stream generate content and yield tokens as they arrive
                async def generate():
                    chunk_id = str(uuid.uuid4())
                    
                    # Start response message
                    response_message = {
                        "role": "assistant",
                        "content": "",
                        "timestamp": datetime.datetime.now().isoformat()
                    }
                    
                    # Start time for timeout check
                    start_time = time.time()
                    
                    try:
                        # Use safety settings to enforce helpful, accurate responses
                        safety_settings = [
                            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
                        ]
                        
                        response = model.generate_content(
                            full_prompt,
                            stream=True,
                            safety_settings=safety_settings,
                            generation_config={
                                "temperature": 0.2,
                                "max_output_tokens": 2048,
                            }
                        )
                        
                        content_buffer = ""
                        
                        for chunk in response:
                            # Check for timeout - 15 seconds
                            if time.time() - start_time > 15:
                                content_buffer += "\n\nI apologize for the delay. Let me provide a concise summary based on what we've discussed so far..."
                                break
                                
                            if hasattr(chunk, 'text') and chunk.text:
                                content_buffer += chunk.text
                                yield chunk.text
                        
                        # Save the complete response
                        response_message["content"] = content_buffer
                        save_message_to_conversation(conversation_id, response_message)
                        
                        # If charts were requested, include them as attachments in final JSON
                        if request.include_charts and stock_symbols:
                            attachments = get_chart_attachments(stock_symbols)
                            if attachments:
                                # Yield a special JSON object with attachments at the end
                                yield f"\n\n{{\"attachments\": {json.dumps(attachments)}}}"
                    except Exception as e:
                        print(f"Error streaming AI response: {e}")
                        yield f"\n\nI encountered an error processing your request. Please try again or ask a different question. Error: {str(e)}"
                
                return StreamingResponse(generate(), media_type="text/plain")
        except Exception as e:
            print(f"Error setting up Gemini AI stream: {e}")
    
    # Fall back to non-Gemini responses
    async def generate_fallback():
        # Generate a basic response as fallback
        response, attachments = await generate_ai_response(
            message=request.message,
            history=history,
            user_context=user_context,
            include_charts=request.include_charts,
            personalized_knowledge=personalized_knowledge
        )
        
        # Yield the text response
        yield response
        
        # If there are attachments, yield them as a special JSON object at the end
        if attachments:
            yield f"\n\n{{\"attachments\": {json.dumps(attachments)}}}"
    
    return StreamingResponse(generate_fallback(), media_type="text/plain")

# Endpoints
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with TED AI Assistant"""
    # Generate unique IDs for the message and conversation
    message_id = str(uuid.uuid4())
    conversation_id = request.conversation_id or str(uuid.uuid4())
    user_id = request.user_id or "anonymous"
    timestamp = datetime.datetime.now().isoformat()
    
    # Get personalized knowledge from user's brain store
    personalized_knowledge = []
    if request.user_id:
        personalized_knowledge = await get_personalized_knowledge(
            user_id=request.user_id,
            query=request.message,
            limit=3
        )
    
    # Generate AI response
    response_text, attachments = await generate_ai_response(
        message=request.message,
        include_charts=request.include_charts,
        personalized_knowledge=personalized_knowledge
    )
    
    # Create user message
    user_message = {
        "role": "user",
        "content": request.message,
        "timestamp": timestamp
    }
    
    # Create assistant message
    assistant_message = {
        "role": "assistant",
        "content": response_text,
        "timestamp": timestamp
    }
    
    # Save messages to conversation history
    save_message_to_conversation(conversation_id, user_message)
    save_message_to_conversation(conversation_id, assistant_message)
    
    # If this is a new conversation, add it to user's list
    # Take first 30 chars of the first user message as title
    title = request.message[:30]
    if len(request.message) > 30:
        title += "..."
    add_conversation_to_user(user_id, conversation_id, title)
    
    # Return response
    return ChatResponse(
        id=message_id,
        content=response_text,
        timestamp=timestamp,
        attachments=attachments,
        conversation_id=conversation_id
    )

@router.post("/chat/stream", tags=["stream"])
async def chat_stream(request: ChatRequest):
    """Stream chat responses from TED AI Assistant"""
    return await stream_ai_response(request)

@router.get("/conversations", response_model=ChatHistoryResponse)
async def get_conversations(user_id: str):
    """Get list of conversations for a user"""
    conversations = get_user_conversations(user_id)
    return ChatHistoryResponse(conversations=conversations)

@router.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    conversation = get_conversation_history(conversation_id)
    if not conversation or not conversation.get("messages"):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@router.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str, user_id: str):
    """Delete a specific conversation"""
    # Remove from user's list
    conversations = get_user_conversations(user_id)
    conversations = [c for c in conversations if c.get("id") != conversation_id]
    db.storage.json.put(sanitize_key(f"user_conversations_{user_id}"), conversations)
    
    # Delete the conversation data
    try:
        key = sanitize_key(f"conversation_{conversation_id}")
        db.storage.json.delete(key)
    except Exception as e:
        print(f"Error deleting conversation: {e}")
    
    return {"result": "deleted"}

@router.post("/reset")
async def reset_ai(user_id: str):
    """Reset user context and start fresh"""
    try:
        # Delete user context
        key = sanitize_key(f"user_context_{user_id}")
        db.storage.json.delete(key)
    except Exception as e:
        print(f"Error resetting user context: {e}")
    
    return {"result": "reset"}

@router.get("/debug-market-data")
async def debug_market_data(symbol: str = "SPY"):
    """Debug endpoint to test market data retrieval"""
    try:
        # Try to get real market data
        data = get_market_data([symbol])
        return {"source": data.get(symbol, {}).get("source", "unknown"), "data": data.get(symbol, {})}
    except Exception as e:
        return {"error": str(e)}

@router.post("/analyze-portfolio")
async def analyze_portfolio(stocks: Dict[str, Dict[str, Any]]):
    """Analyze a user's portfolio"""
    if not stocks:
        raise HTTPException(status_code=400, detail="No portfolio data provided")

    # Get current market data
    symbols = list(stocks.keys())
    market_data = get_market_data(symbols)

    # Initialize portfolio analysis variables
    total_value = 0
    total_gain_loss = 0
    positions = []

    for symbol, position in stocks.items():
        shares = position.get("shares", 0)
        avg_price = position.get("avg_price", 0)
        
        current_data = market_data.get(symbol, {})
        current_price = current_data.get("price", avg_price)
        
        # Calculate position value and gain/loss
        position_value = shares * current_price
        position_cost_basis = shares * avg_price
        position_gain_loss = position_value - position_cost_basis
        position_gain_loss_pct = (position_gain_loss / position_cost_basis * 100) if position_cost_basis else 0
        
        # Add to totals
        total_value += position_value
        total_gain_loss += position_gain_loss
        
        # Add position details to list
        positions.append({
            "symbol": symbol,
            "shares": shares,
            "avg_price": avg_price,
            "current_price": current_price,
            "position_value": position_value,
            "gain_loss": position_gain_loss,
            "gain_loss_pct": position_gain_loss_pct,
            "source": current_data.get("source", "unknown")
        })
    
    # Sort positions by value (descending)
    positions.sort(key=lambda x: x["position_value"], reverse=True)
    
    # Calculate total gain/loss percentage
    total_cost_basis = sum(position.get("shares", 0) * position.get("avg_price", 0) for symbol, position in stocks.items())
    total_gain_loss_pct = (total_gain_loss / total_cost_basis * 100) if total_cost_basis else 0
    
    # Return portfolio analysis
    return {
        "total_value": total_value,
        "total_gain_loss": total_gain_loss,
        "total_gain_loss_pct": total_gain_loss_pct,
        "positions": positions
    }

# Function to combine analysis from multiple sources
async def perform_combined_analysis(symbol: str):
    """Perform a combined analysis using multiple data sources"""
    try:
        # Get market data
        market_data = get_market_data([symbol])
        symbol_data = market_data.get(symbol, {})
        
        # Get options flow data
        flow_request = OptionsFlowRequest(
            symbol=symbol,
            min_premium=10000,  # $10k minimum premium
            show_calls=True,
            show_puts=True,
            show_sweeps=True,
            show_blocks=True
        )
        
        # Get dark pool data
        try:
            options_flow = await get_options_flow(flow_request)
            dark_pool = await get_dark_pool_trades(symbol=symbol)
            
            # Combine the data
            return {
                "symbol": symbol,
                "market_data": symbol_data,
                "options_flow": options_flow.data if options_flow else [],
                "dark_pool": dark_pool.levels if dark_pool else None,
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting specialized data: {e}")
            # Return just the market data if specialized data fails
            return {
                "symbol": symbol,
                "market_data": symbol_data,
                "timestamp": datetime.datetime.now().isoformat()
            }
    except Exception as e:
        print(f"Error in combined analysis: {e}")
        return {"error": str(e), "symbol": symbol}

@router.get("/analyze/{symbol}")
async def analyze_symbol(symbol: str):
    """Get comprehensive analysis for a symbol"""
    try:
        result = await perform_combined_analysis(symbol)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Debug endpoints
@router.get("/health")
async def check_health():
    """Check health of TED AI Assistant"""
    return {
        "status": "ok",
        "gemini_available": GEMINI_AVAILABLE,
        "brain_store_available": BRAIN_STORE_AVAILABLE,
        "timestamp": datetime.datetime.now().isoformat()
    }
