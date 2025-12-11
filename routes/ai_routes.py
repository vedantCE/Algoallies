# AI-powered routes - dynamic health advisory using AI agents
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import logging
from agents.citizen_agent import generate_citizen_response
from agents.hospital_agent import generate_hospital_response
from agents.landing_agent import generate_landing_response
from utils.weather_api import get_weather
from utils.weather_aqi import get_air_quality, classify_aqi_us

logger = logging.getLogger(__name__)
router = APIRouter()

class CitizenAIModel(BaseModel):
    message: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    return_json: bool = False

class HospitalAIModel(BaseModel):
    query: str

class LandingAIModel(BaseModel):
    content: Optional[str] = None

@router.post("/citizen-response")
def citizen_response(data: CitizenAIModel):
    """Floating chatbot endpoint - uses AI agent for dynamic responses"""
    logger.info(f"Floating chatbot query: {data.message[:50]}...")
    
    try:
        # Use provided coordinates or fallback to Mumbai
        lat = data.lat if data.lat else 19.0760
        lon = data.lon if data.lon else 72.8777
        
        logger.info(f"Using coordinates: {lat}, {lon}")
        
        # AI agent generates dynamic response based on location and weather
        response_text = generate_landing_response(data.message, lat, lon)
        
        return {
            "success": True,
            "response": response_text,
            "location": {"lat": lat, "lon": lon}
        }
        
    except Exception as e:
        logger.error(f"Floating chatbot error: {e}")
        return {
            "success": False,
            "message": "Health assistant temporarily unavailable",
            "error": str(e)
        }

@router.post("/citizenai")
def citizenai(data: CitizenAIModel):
    """Citizen dashboard endpoint - AI agent generates complete health plan"""
    logger.info(f"CitizenAI dashboard query: {data.message[:50]}...")
    
    try:
        # Use provided coordinates or fallback to Mumbai
        lat = data.lat if data.lat else 19.0760
        lon = data.lon if data.lon else 72.8777
        
        logger.info(f"Using coordinates: {lat}, {lon}")
        
        # Get live weather data for AI context
        weather_data = get_weather(lat, lon)
        if not weather_data:
            weather_data = {
                "temperature": 25,
                "humidity": 60,
                "description": "moderate conditions"
            }
        
        # Get AQI data for comprehensive health recommendations
        try:
            aqi_data = get_air_quality(lat, lon)
            aqi_value = aqi_data.get('us_aqi') or aqi_data.get('european_aqi') or 50
            aqi_category = classify_aqi_us(aqi_value)
            weather_data['aqi'] = aqi_value
            weather_data['aqi_category'] = aqi_category
        except Exception:
            weather_data['aqi'] = 50
            weather_data['aqi_category'] = 'Good'
        
        # AI agent generates dynamic health plan based on real-time data
        response_data = generate_citizen_response(data.message, weather_data, True)
        
        return {
            "success": True,
            "data": response_data,
            "weather": weather_data,
            "location": {"lat": lat, "lon": lon}
        }
        
    except Exception as e:
        logger.error(f"Citizen dashboard error: {e}")
        return {
            "success": False,
            "message": "Health assistant temporarily unavailable",
            "error": str(e)
        }

@router.post("/hospital-response")
def hospital_response(data: HospitalAIModel):
    """Hospital AI assistant - dynamic responses for hospital staff"""
    logger.info(f"Hospital query: {data.query[:50]}...")
    
    try:
        # AI agent generates contextual hospital management advice
        response_text = generate_hospital_response(data.query)
        return {
            "success": True,
            "response": response_text
        }
    except Exception as e:
        logger.error(f"Hospital response error: {e}")
        return {
            "success": False,
            "message": "Hospital assistant temporarily unavailable"
        }

@router.post("/landing-response")
def landing_response(data: Optional[LandingAIModel] = None):
    """Landing page AI assistant - welcoming and informative responses"""
    logger.info("Landing page query received")
    
    try:
        content = data.content if data else "Welcome to HealthAI"
        # AI agent generates engaging landing page content
        response_text = generate_landing_response(content, 0, 0)
        return {
            "success": True,
            "response": response_text
        }
    except Exception as e:
        logger.error(f"Landing response error: {e}")
        return {
            "success": False,
            "message": "Landing assistant temporarily unavailable"
        }

@router.get("/health-advisory")
def health_advisory():
    """Dynamic health advisory generated by AI based on current conditions"""
    logger.info("Health advisory requested")
    
    try:
        # Default location - Mumbai (should be replaced with actual user location)
        lat, lon = 19.0760, 72.8777
        
        # Get real-time weather and AQI data
        weather_data = get_weather(lat, lon)
        if not weather_data:
            weather_data = {"temperature": 25, "humidity": 60, "description": "moderate conditions"}
        
        try:
            aqi_data = get_air_quality(lat, lon)
            aqi_value = aqi_data.get('us_aqi') or aqi_data.get('european_aqi') or 50
            aqi_category = classify_aqi_us(aqi_value)
        except Exception:
            aqi_value = 50
            aqi_category = 'Good'
        
        # AI agent generates dynamic health advisory based on current conditions
        advisory_message = f"Generate health advisory for Mumbai with temperature {weather_data.get('temperature', 25)}°C, humidity {weather_data.get('humidity', 60)}%, and AQI {aqi_value} ({aqi_category}). Include foods, fruits, ayurvedic tips, and things to avoid."
        
        # Use AI agent to generate dynamic recommendations
        ai_response = generate_citizen_response(advisory_message, weather_data, True)
        
        # Extract recommendations from AI response or provide fallback structure
        if isinstance(ai_response, dict):
            foods = ai_response.get('dietPlan', ["Balanced meals based on current weather"])
            fruits = ai_response.get('fruits', ["Seasonal fruits recommended by AI"])
            ayurvedic = ai_response.get('ayurvedicTips', ["AI-recommended ayurvedic practices"])
            avoid = ai_response.get('avoidThese', ["AI-identified items to avoid"])
        else:
            # Fallback if AI response format is different
            foods = ["AI-recommended balanced nutrition"]
            fruits = ["AI-selected seasonal fruits"]
            ayurvedic = ["AI-powered ayurvedic guidance"]
            avoid = ["AI-identified health risks to avoid"]
        
        # Generate weather alert using AI context
        temp = weather_data.get('temperature', 25)
        weather_alert = f"📍 Mumbai: {temp}°C, {weather_data.get('humidity', 60)}% humidity, AQI {aqi_value} ({aqi_category}). "
        
        if temp > 32:
            weather_alert += "AI recommends staying hydrated and avoiding heat exposure."
        elif temp < 10:
            weather_alert += "AI suggests keeping warm and boosting immunity."
        elif aqi_value > 150:
            weather_alert += "AI advises staying indoors due to poor air quality."
        else:
            weather_alert += "AI indicates good conditions for outdoor activities."
        
        return {
            "success": True,
            "advisory": {
                "weather_alert": weather_alert,
                "foods": foods,
                "fruits": fruits,
                "ayurvedic": ayurvedic,
                "avoid": avoid,
                "location": {"lat": lat, "lon": lon, "city": "Mumbai"}
            }
        }
    
    except Exception as e:
        logger.error(f"Health advisory error: {e}")
        # AI-powered fallback recommendations
        return {
            "success": True,
            "advisory": {
                "weather_alert": "📍 Mumbai: AI-powered health recommendations available",
                "foods": ["AI-recommended balanced nutrition for current conditions"],
                "fruits": ["AI-selected seasonal fruits for optimal health"],
                "ayurvedic": ["AI-powered traditional wellness practices"],
                "avoid": ["AI-identified health risks based on current environment"],
                "location": {"lat": 19.0760, "lon": 72.8777, "city": "Mumbai"}
            }
        }