import databutton as db
import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
import json

router = APIRouter()

# Initialize Gemini model with API key
API_KEY = db.secrets.get("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(model_name="gemini-1.5-pro")

# Models
class Course(BaseModel):
    id: str = Field(..., description="Unique identifier for the course")
    title: str = Field(..., description="Course title")
    description: str = Field(..., description="Course description")
    difficulty: str = Field(..., description="Course difficulty level")
    topics: List[str] = Field(..., description="List of topics covered")
    estimated_hours: int = Field(..., description="Estimated hours to complete")
    thumbnail_url: Optional[str] = Field(None, description="URL to course thumbnail")
    recommended_reason: Optional[str] = Field(None, description="Reason this course is recommended")

class CourseRecommendationRequest(BaseModel):
    user_id: str = Field("default", description="User ID to get recommendations for")
    limit: int = Field(3, description="Number of recommendations to return")

class CourseRecommendationResponse(BaseModel):
    recommendations: List[Course] = Field(..., description="List of recommended courses")
    last_updated: str = Field(..., description="When recommendations were last updated")

class CourseOutlineRequest(BaseModel):
    topic: str = Field(..., description="Topic to create a course outline for")
    user_id: str = Field("default", description="User ID for personalization")

class CourseModule(BaseModel):
    title: str = Field(..., description="Module title")
    description: str = Field(..., description="Module description")
    key_topics: List[str] = Field(..., description="Key topics covered in this module")
    estimated_minutes: int = Field(..., description="Estimated minutes to complete")

class CourseOutlineResponse(BaseModel):
    course_title: str = Field(..., description="Generated course title")
    course_description: str = Field(..., description="Generated course description")
    difficulty: str = Field(..., description="Estimated difficulty level")
    prerequisites: List[str] = Field(..., description="Prerequisites for this course")
    learning_outcomes: List[str] = Field(..., description="Learning outcomes")
    modules: List[CourseModule] = Field(..., description="Course modules")
    total_hours: int = Field(..., description="Total estimated hours")
    generated_at: str = Field(..., description="When this outline was generated")

def get_brain_items(user_id: str = "default"):
    """Get the user's brain items"""
    try:
        brain_items_key = f"brain_items_{user_id}"
        return db.storage.json.get(brain_items_key, default={})
    except Exception as e:
        print(f"Error getting brain items: {e}")
        return {}

def get_recommended_courses_storage_key(user_id: str):
    """Get storage key for recommended courses"""
    return f"recommended_courses_{user_id}"

@router.post("/get-course-recommendations")
async def get_course_recommendations(request: CourseRecommendationRequest) -> CourseRecommendationResponse:
    """Get personalized course recommendations based on user's brain data"""
    try:
        # Check if we have cached recommendations that are less than a week old
        storage_key = get_recommended_courses_storage_key(request.user_id)
        try:
            stored_recommendations = db.storage.json.get(storage_key)
            stored_date = datetime.fromisoformat(stored_recommendations.get("last_updated"))
            current_date = datetime.now()
            
            # If recommendations are less than a week old, return them
            if (current_date - stored_date).days < 7:
                return CourseRecommendationResponse(**stored_recommendations)
        except Exception as e:
            print(f"No cached recommendations or error: {e}")
        
        # Get user's brain items
        brain_items = get_brain_items(request.user_id)
        
        # If the user has no brain items, generate generic recommendations
        if not brain_items:
            recommendations = generate_generic_recommendations(request.limit)
        else:
            # Generate personalized recommendations based on brain items
            recommendations = generate_personalized_recommendations(brain_items, request.limit)
        
        # Create response
        response = CourseRecommendationResponse(
            recommendations=recommendations,
            last_updated=datetime.now().isoformat()
        )
        
        # Cache the recommendations
        db.storage.json.put(storage_key, response.dict())
        
        return response
    except Exception as e:
        print(f"Error getting course recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_generic_recommendations(limit: int) -> List[Course]:
    """Generate generic course recommendations"""
    # Default courses for users with no brain data
    default_courses = [
        Course(
            id="technicals-101",
            title="Technical Analysis Fundamentals",
            description="Learn the basics of technical analysis for financial markets, including chart patterns, indicators, and price action.",
            difficulty="Beginner",
            topics=["Chart Patterns", "Technical Indicators", "Support & Resistance", "Trend Analysis"],
            estimated_hours=6,
            thumbnail_url="https://picsum.photos/id/239/300/200",
            recommended_reason="Essential knowledge for all traders"
        ),
        Course(
            id="risk-management",
            title="Risk Management Strategies",
            description="Master essential risk management techniques to protect your capital and maximize returns in volatile markets.",
            difficulty="Intermediate",
            topics=["Position Sizing", "Stop Loss Strategies", "Risk/Reward Ratios", "Portfolio Allocation"],
            estimated_hours=4,
            thumbnail_url="https://picsum.photos/id/260/300/200",
            recommended_reason="Crucial for long-term trading success"
        ),
        Course(
            id="market-psychology",
            title="Trading Psychology Masterclass",
            description="Understand the psychological aspects of trading and develop a mindset for consistent profitability.",
            difficulty="Intermediate",
            topics=["Emotional Control", "Cognitive Biases", "Discipline", "Trader's Mindset"],
            estimated_hours=5,
            thumbnail_url="https://picsum.photos/id/160/300/200",
            recommended_reason="Address the psychological challenges of trading"
        ),
        Course(
            id="options-basics",
            title="Options Trading Fundamentals",
            description="Understand the basics of options contracts, strategies, and how to use them to enhance your trading portfolio.",
            difficulty="Intermediate",
            topics=["Options Basics", "Call & Put Options", "Greeks", "Basic Strategies"],
            estimated_hours=8,
            thumbnail_url="https://picsum.photos/id/28/300/200",
            recommended_reason="Expand your trading capabilities"
        ),
        Course(
            id="macro-analysis",
            title="Macroeconomic Analysis for Traders",
            description="Learn how macroeconomic factors influence financial markets and how to incorporate them into your trading decisions.",
            difficulty="Advanced",
            topics=["Economic Indicators", "Central Bank Policies", "Geopolitical Analysis", "Market Correlations"],
            estimated_hours=7,
            thumbnail_url="https://picsum.photos/id/180/300/200",
            recommended_reason="Enhance your broader market understanding"
        )
    ]
    
    return default_courses[:limit]

def generate_personalized_recommendations(brain_items: Dict[str, Any], limit: int) -> List[Course]:
    """Generate personalized course recommendations based on user's brain data"""
    try:
        # Extract content from brain items
        contents = []
        for item_id, item in brain_items.items():
            if len(contents) < 10:  # Limit to 10 most recent items to avoid token limits
                contents.append(item["content"])
        
        # If no contents, return generic recommendations
        if not contents:
            return generate_generic_recommendations(limit)
        
        # Create prompt for Gemini
        prompt = f"""
        Based on the following user data, recommend {limit} trading or investment courses that would be most beneficial 
        for this user's learning and development. For each course, provide a title, brief description, difficulty level, 
        key topics covered, estimated hours to complete, and a specific reason why this course would be valuable to the user.
        
        Here is the user's recent activity and interests:
        {contents[:5]}  # Limiting to 5 items to avoid token limits
        
        Return your response in JSON format with the following structure for each course:
        {{"id": "unique-id", "title": "Course Title", "description": "Course description", "difficulty": "Beginner/Intermediate/Advanced", 
        "topics": ["Topic 1", "Topic 2"], "estimated_hours": X, "recommended_reason": "Specific reason"}}
        """
        
        # Generate recommendations using Gemini
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Parse JSON from response
        # Find JSON in the response (it might be wrapped in ```json blocks)
        json_match = re.search(r'```json\n(.+?)\n```', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find a direct JSON array
            json_match = re.search(r'\[\s*{.+}\s*\]', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                # Fallback - try to use the entire response
                json_str = response_text
        
        # Parse JSON
        try:
            recommendations_data = json.loads(json_str)
            
            # Ensure we have a list of dictionaries
            if isinstance(recommendations_data, dict) and "recommendations" in recommendations_data:
                recommendations_data = recommendations_data["recommendations"]
            elif not isinstance(recommendations_data, list):
                # Fallback to generic recommendations
                return generate_generic_recommendations(limit)
            
            # Convert to Course objects
            recommendations = []
            for i, rec in enumerate(recommendations_data[:limit]):
                # Ensure we have all required fields
                if "title" not in rec or "description" not in rec:
                    continue
                    
                # Generate thumbnail URL if not provided
                if "thumbnail_url" not in rec or not rec["thumbnail_url"]:
                    # Use a deterministic image ID based on course title
                    img_id = hash(rec["title"]) % 1000
                    rec["thumbnail_url"] = f"https://picsum.photos/id/{img_id}/300/200"
                
                # Generate ID if not provided
                if "id" not in rec or not rec["id"]:
                    rec["id"] = f"course-{i+1}"
                
                try:
                    recommendations.append(Course(**rec))
                except Exception as e:
                    print(f"Error creating Course object: {e}")
                    continue
            
            # If we couldn't create any valid courses, use generic recommendations
            if not recommendations:
                return generate_generic_recommendations(limit)
                
            return recommendations
        except Exception as e:
            print(f"Error parsing recommendations JSON: {e}")
            return generate_generic_recommendations(limit)
    except Exception as e:
        print(f"Error generating personalized recommendations: {e}")
        return generate_generic_recommendations(limit)

@router.post("/generate-course-outline")
async def generate_course_outline(request: CourseOutlineRequest) -> CourseOutlineResponse:
    """Generate a detailed course outline for a specific topic"""
    try:
        # Get user's brain items for personalization
        brain_items = get_brain_items(request.user_id)
        
        # Extract user interests from brain items
        user_interests = []
        if brain_items:
            for item_id, item in list(brain_items.items())[:5]:  # Limit to 5 items
                user_interests.append(item["content"])
        
        # Create prompt for Gemini
        prompt = f"""
        Create a detailed educational course outline for the topic: \"{request.topic}\"
        
        {"User's interests and knowledge:" + '\n'.join(user_interests) if user_interests else ""}
        
        The course outline should include:
        1. A compelling course title
        2. A comprehensive course description
        3. Difficulty level (Beginner, Intermediate, or Advanced)
        4. Prerequisites
        5. Clear learning outcomes
        6. 5-8 modules, each with:
           - Module title
           - Module description
           - Key topics covered
           - Estimated time to complete (in minutes)
        7. Total estimated hours to complete the course
        
        Format your response as a JSON object with this structure:
        {{"course_title": "Title", "course_description": "Description", "difficulty": "Level", 
        "prerequisites": ["Prereq1", "Prereq2"], "learning_outcomes": ["Outcome1", "Outcome2"], 
        "modules": [{{"title": "Module Title", "description": "Description", "key_topics": ["Topic1", "Topic2"], "estimated_minutes": X}}], 
        "total_hours": Y}}
        """
        
        # Generate course outline using Gemini
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Parse JSON from response
        # Find JSON in the response (it might be wrapped in ```json blocks)
        json_match = re.search(r'```json\n(.+?)\n```', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find an object starting with { and ending with }
            json_match = re.search(r'\{[\s\S]+\}', response_text)
            if json_match:
                json_str = json_match.group(0)
            else:
                # Fallback - try to use the entire response
                json_str = response_text
        
        try:
            outline_data = json.loads(json_str)
            
            # Add generation timestamp
            outline_data["generated_at"] = datetime.now().isoformat()
            
            # Create response object
            return CourseOutlineResponse(**outline_data)
        except Exception as e:
            print(f"Error parsing course outline JSON: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate course outline: {e}")
    except Exception as e:
        print(f"Error generating course outline: {e}")
        raise HTTPException(status_code=500, detail=str(e))
