import os
import base64
import databutton as db
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
import uuid
import io
import json
import time

# Create router for the API
router = APIRouter()

# Try to import Gemini Vision library
try:
    import google.generativeai as genai
    from PIL import Image
    GEMINI_AVAILABLE = True
    print("Google Generative AI Vision is available")
except ImportError:
    GEMINI_AVAILABLE = False
    print("Google Generative AI Vision is not available")

class ChartAnalysisRequest(BaseModel):
    """Request model for chart analysis"""
    chart_base64: str
    chart_type: Optional[str] = None  # e.g., "candlestick", "line", "technical"
    chart_symbol: Optional[str] = None  # e.g., "AAPL", "SPY"
    timeframe: Optional[str] = None  # e.g., "1d", "1w", "1m"
    indicators: Optional[List[str]] = None  # e.g., ["RSI", "MACD", "Moving Average"]
    user_query: Optional[str] = None  # Additional context or question from user

class ChartAnalysisResponse(BaseModel):
    """Response model for chart analysis"""
    id: str
    analysis: str
    identified_patterns: Optional[List[str]] = None
    support_levels: Optional[List[float]] = None
    resistance_levels: Optional[List[float]] = None
    key_indicators: Optional[dict] = None
    possible_scenarios: Optional[List[str]] = None
    timestamp: str

# Initialize Gemini Vision model
def init_gemini_vision(api_key: str = None):
    """Initialize Gemini Vision model for chart analysis"""
    if not GEMINI_AVAILABLE:
        print("Warning: Google Generative AI Vision not available")
        return None
        
    if not api_key:
        try:
            api_key = db.secrets.get("GEMINI_API_KEY")
        except Exception as e:
            print(f"Warning: GEMINI_API_KEY not found in secrets: {e}")
            return None
    
    # Configure Gemini with API key
    genai.configure(api_key=api_key)
    
    # Get the vision model
    try:
        model = genai.GenerativeModel('gemini-pro-vision')
        return model
    except Exception as e:
        print(f"Error initializing Gemini Vision model: {e}")
        return None

def analyze_chart_with_gemini(chart_data_b64: str, query: str, chart_context: dict = None) -> str:
    """Analyze a chart using Gemini Vision API"""
    if not GEMINI_AVAILABLE:
        return "Chart analysis is not available (Gemini Vision API not configured)"
    
    try:
        # Initialize model
        model = init_gemini_vision()
        if not model:
            return "Unable to initialize Gemini Vision model"
            
        # Decode base64 image
        binary_data = base64.b64decode(chart_data_b64.split(',')[1] if ',' in chart_data_b64 else chart_data_b64)
        image = Image.open(io.BytesIO(binary_data))
        
        # Prepare system prompt with context
        system_prompt = (
            "You are TED AI, a professional trading chart analyst. "
            "Analyze the provided chart image in detail and provide the following: \n"
            "1. Main trend identification\n"
            "2. Key support and resistance levels\n"
            "3. Technical pattern recognition (if any)\n"
            "4. Volume analysis (if visible)\n"
            "5. Key indicator readings (if visible)\n"
            "6. Possible future scenarios based on technical analysis\n"
            "7. Trading insights based on what you see\n\n"
            "Be specific, accurate, and detail-oriented. Focus only on what you can see in the chart."
        )
        
        # Add chart context if available
        if chart_context:
            context_str = "\n\nChart context:\n"
            if chart_context.get("chart_symbol"):
                context_str += f"Symbol: {chart_context['chart_symbol']}\n"
            if chart_context.get("chart_type"):
                context_str += f"Chart type: {chart_context['chart_type']}\n"
            if chart_context.get("timeframe"):
                context_str += f"Timeframe: {chart_context['timeframe']}\n"
            if chart_context.get("indicators") and len(chart_context["indicators"]) > 0:
                context_str += f"Indicators: {', '.join(chart_context['indicators'])}\n"
            
            system_prompt += context_str
        
        # Add specific question if provided
        if query and query.strip():
            system_prompt += f"\n\nUser question: {query.strip()}"
        
        # Generate response
        response = model.generate_content([system_prompt, image])
        return response.text
    except Exception as e:
        print(f"Error analyzing chart: {e}")
        return f"Error analyzing chart: {str(e)}"

# Extract key insights from analysis (helper for structured response)
def extract_key_insights(analysis: str) -> dict:
    """Extract key insights from analysis text to structure the response"""
    insights = {}
    
    # Extract patterns (simple approach - can be enhanced with regex or NLP)
    patterns = []
    pattern_keywords = [
        "head and shoulders", "double top", "double bottom", "triangle", 
        "wedge", "flag", "pennant", "channel", "cup and handle",
        "breakout", "breakdown", "reversal", "continuation"
    ]
    
    for keyword in pattern_keywords:
        if keyword in analysis.lower():
            patterns.append(keyword.title())
    
    insights["identified_patterns"] = patterns if patterns else None
    
    # Extract support/resistance (simple approach)
    support_levels = []
    resistance_levels = []
    
    # Split analysis into lines for easier processing
    lines = analysis.split('\n')
    for line in lines:
        if "support" in line.lower() and any(c.isdigit() for c in line):
            # Extract numbers from the line
            import re
            numbers = re.findall(r'\d+\.?\d*', line)
            support_levels.extend([float(num) for num in numbers])
        
        if "resistance" in line.lower() and any(c.isdigit() for c in line):
            # Extract numbers from the line
            import re
            numbers = re.findall(r'\d+\.?\d*', line)
            resistance_levels.extend([float(num) for num in numbers])
    
    insights["support_levels"] = support_levels if support_levels else None
    insights["resistance_levels"] = resistance_levels if resistance_levels else None
    
    # Extract possible scenarios
    scenarios = []
    scenario_markers = ["scenario", "could", "might", "possibility", "expect", "potential"]
    
    for line in lines:
        for marker in scenario_markers:
            if marker in line.lower():
                scenarios.append(line.strip())
                break
    
    insights["possible_scenarios"] = list(set(scenarios)) if scenarios else None
    
    return insights

# Save chart image for future reference
def save_chart_image(chart_base64: str, chart_id: str):
    """Save chart image to databutton storage"""
    try:
        # Remove data URL prefix if present
        if ',' in chart_base64:
            chart_base64 = chart_base64.split(',')[1]
            
        # Decode base64 to binary
        binary_data = base64.b64decode(chart_base64)
        
        # Save to databutton storage
        key = f"chart_analysis_{chart_id}"
        db.storage.binary.put(key, binary_data)
        return key
    except Exception as e:
        print(f"Error saving chart image: {e}")
        return None

def analyze_trading_chart(request: ChartAnalysisRequest) -> ChartAnalysisResponse:
    """Main function to analyze a trading chart"""
    # Generate a unique ID for this analysis
    analysis_id = str(uuid.uuid4())
    
    # Save the chart image
    image_key = save_chart_image(request.chart_base64, analysis_id)
    
    # Prepare context dict from request
    chart_context = {
        "chart_type": request.chart_type,
        "chart_symbol": request.chart_symbol,
        "timeframe": request.timeframe,
        "indicators": request.indicators
    }
    
    # Analyze chart with Gemini Vision
    analysis_text = analyze_chart_with_gemini(
        request.chart_base64, 
        request.user_query, 
        chart_context
    )
    
    # Extract structured insights from analysis text
    insights = extract_key_insights(analysis_text)
    
    # Create response object
    response = ChartAnalysisResponse(
        id=analysis_id,
        analysis=analysis_text,
        identified_patterns=insights.get("identified_patterns"),
        support_levels=insights.get("support_levels"),
        resistance_levels=insights.get("resistance_levels"),
        possible_scenarios=insights.get("possible_scenarios"),
        timestamp=datetime.now().isoformat()
    )
    
    # Save the analysis result to storage
    try:
        result_storage_key = f"chart_analysis_result_{analysis_id}"
        db.storage.json.put(result_storage_key, response.dict())
    except Exception as e:
        print(f"Error saving analysis result: {e}")
    
    return response

@router.post("/analyze-chart")
async def analyze_chart(request: ChartAnalysisRequest) -> ChartAnalysisResponse:
    """Analyze a chart image using Gemini Vision API"""
    try:
        # Process the analysis request
        return analyze_trading_chart(request)
    except Exception as e:
        print(f"Error in analyze_chart endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Chart analysis failed: {str(e)}")

@router.post("/analyze-chart/stream", tags=["stream"])
async def analyze_chart_streaming(request: ChartAnalysisRequest):
    """Analyze a trading chart using Gemini Vision API with streaming response"""
    # Generate a unique ID for this analysis
    analysis_id = str(uuid.uuid4())
    
    # Save the chart image
    image_key = save_chart_image(request.chart_base64, analysis_id)
    
    # Prepare context dict from request
    chart_context = {
        "chart_type": request.chart_type,
        "chart_symbol": request.chart_symbol,
        "timeframe": request.timeframe,
        "indicators": request.indicators
    }
    
    # For streaming, first respond with an initial message
    initial_msg = "Analyzing your chart"  
    if request.chart_symbol:
        initial_msg += f" for {request.chart_symbol}"
    if request.timeframe:
        initial_msg += f" ({request.timeframe})"
    initial_msg += "..."
    
    # Either stream from Gemini API (if available) or simulate streaming with our analysis
    def generate():
        # Initial response
        yield initial_msg + "\n\n"
        
        try:
            # Get the full analysis
            analysis_text = analyze_chart_with_gemini(
                request.chart_base64, 
                request.user_query,
                chart_context
            )
            
            # Extract insights
            insights = extract_key_insights(analysis_text)
            
            # Stream the analysis text line by line with small delays
            for line in analysis_text.split("\n"):
                if line.strip():
                    yield line + "\n"
                    time.sleep(0.1)  # Small delay between lines for streaming effect
                    
            # After text is complete, send structured data as JSON
            structured_data = {
                "id": analysis_id,
                "identified_patterns": insights.get("identified_patterns"),
                "support_levels": insights.get("support_levels"),
                "resistance_levels": insights.get("resistance_levels"),
                "possible_scenarios": insights.get("possible_scenarios")
            }
            
            # Send JSON data at the end - client can parse this separately
            yield "\n\n" + json.dumps(structured_data)
            
            # Save the full analysis
            response = ChartAnalysisResponse(
                id=analysis_id,
                analysis=analysis_text,
                identified_patterns=insights.get("identified_patterns"),
                support_levels=insights.get("support_levels"),
                resistance_levels=insights.get("resistance_levels"),
                possible_scenarios=insights.get("possible_scenarios"),
                timestamp=datetime.now().isoformat()
            )
            
            # Save to storage
            result_storage_key = f"chart_analysis_result_{analysis_id}"
            db.storage.json.put(result_storage_key, response.dict())
            
        except Exception as e:
            # Send error message
            error_msg = f"Error analyzing chart: {str(e)}"
            print(error_msg)
            yield "\n" + error_msg
            
            # Provide some fallback analysis
            fallback = ("Based on what I can see in the chart, there appears to be a general " 
                      "trend with some key support and resistance levels. Without more context, " 
                      "I would recommend looking for clear pattern confirmations before making trading decisions.")
            yield "\n\n" + fallback
    
    return StreamingResponse(generate(), media_type="text/plain")