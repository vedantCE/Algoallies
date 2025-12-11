from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timedelta
import json

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic Models
class SurgePredictionRequest(BaseModel):
    city: Optional[str] = "Mumbai"
    hours_ahead: Optional[int] = 24



class AutonomousAgentRequest(BaseModel):
    action: str
    parameters: Optional[dict] = {}

# Surge Prediction Endpoints
@router.get("/api/surge/prediction")
def get_surge_prediction(city: str = "Mumbai", hours_ahead: int = 24, lat: float = None, lon: float = None):
    """Get AI-powered surge prediction for a specific city"""
    logger.info(f"AI surge prediction requested for {city} at {lat}, {lon}, {hours_ahead} hours ahead")
    
    try:
        from services.surge_prediction import surge_service
        
        # Generate comprehensive surge report using AI analysis
        prediction_data = surge_service.generate_surge_report(lat, lon)
        
        return {
            "success": True,
            "city": city,
            "hours_ahead": hours_ahead,
            "prediction": prediction_data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"AI surge prediction error: {e}")
        return {
            "success": False,
            "message": "Unable to generate AI surge prediction",
            "city": city,
            "prediction": {},
            "error": str(e)
        }

@router.post("/api/surge/prediction")
def post_surge_prediction(request: SurgePredictionRequest):
    """Post request for surge prediction"""
    return get_surge_prediction(request.city, request.hours_ahead)



# Autonomous Agent Endpoints
@router.get("/api/autonomous-agent/status")
def get_autonomous_agent_status():
    """Get autonomous agent status and recent actions"""
    logger.info("Autonomous agent status requested")
    
    try:
        from services.autonomous_agent import autonomous_agent
        
        # Get agent status
        status_data = autonomous_agent.get_status()
        
        return {
            "success": True,
            "status": status_data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Autonomous agent status error: {e}")
        return {
            "success": False,
            "message": "Unable to get autonomous agent status",
            "status": {}
        }

@router.post("/api/autonomous-agent/action")
def trigger_autonomous_action(request: AutonomousAgentRequest):
    """Trigger an autonomous agent action"""
    logger.info(f"Autonomous agent action requested: {request.action}")
    
    try:
        from services.autonomous_agent import autonomous_agent
        
        # Execute action
        result = autonomous_agent.execute_action(request.action, request.parameters)
        
        return {
            "success": True,
            "action": request.action,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Autonomous agent action error: {e}")
        return {
            "success": False,
            "message": f"Unable to execute action: {request.action}",
            "action": request.action,
            "result": {}
        }

# Weather-based surge alerts
@router.get("/api/surge/weather-alerts")
def get_weather_based_alerts(city: str = "Mumbai", lat: float = None, lon: float = None):
    """Get weather-based surge alerts for a city"""
    logger.info(f"Weather-based alerts requested for {city} at {lat}, {lon}")
    
    try:
        from utils.weather_api import get_weather
        from utils.weather_aqi import get_air_quality, classify_aqi_us
        
        # Use provided coordinates or fallback to Mumbai
        if lat is None or lon is None:
            lat, lon = 19.0760, 72.8777
        
        weather_data = get_weather(lat, lon)
        if not weather_data:
            weather_data = {"temperature": 25, "humidity": 60, "description": "moderate"}
        
        # Get AQI data
        try:
            aqi_data = get_air_quality(lat, lon)
            aqi_value = aqi_data.get('us_aqi') or aqi_data.get('european_aqi') or 50
            aqi_category = classify_aqi_us(aqi_value)
        except:
            aqi_value = 50
            aqi_category = 'Good'
        
        # Generate alerts based on conditions
        alerts = []
        temp = weather_data.get('temperature', 25)
        humidity = weather_data.get('humidity', 60)
        
        if temp > 35:
            alerts.append({
                "type": "heat_wave",
                "severity": "high",
                "message": f"Extreme heat ({temp}°C) - Expect 40% increase in heat-related emergencies",
                "recommended_actions": ["Increase emergency staff", "Stock IV fluids", "Prepare cooling areas"]
            })
        elif temp > 30:
            alerts.append({
                "type": "high_temperature",
                "severity": "medium",
                "message": f"High temperature ({temp}°C) - Expect 20% increase in heat-related cases",
                "recommended_actions": ["Monitor emergency capacity", "Ensure adequate hydration supplies"]
            })
        
        if aqi_value > 200:
            alerts.append({
                "type": "severe_pollution",
                "severity": "high",
                "message": f"Severe air pollution (AQI {aqi_value}) - Expect 50% increase in respiratory cases",
                "recommended_actions": ["Increase pulmonology staff", "Stock inhalers and oxygen", "Prepare respiratory ward"]
            })
        elif aqi_value > 150:
            alerts.append({
                "type": "poor_air_quality",
                "severity": "medium",
                "message": f"Poor air quality (AQI {aqi_value}) - Expect 25% increase in respiratory issues",
                "recommended_actions": ["Monitor respiratory cases", "Ensure adequate PPE"]
            })
        
        if temp < 10:
            alerts.append({
                "type": "cold_wave",
                "severity": "medium",
                "message": f"Cold wave ({temp}°C) - Expect increase in respiratory infections",
                "recommended_actions": ["Prepare for flu cases", "Stock cold medications"]
            })
        
        return {
            "success": True,
            "city": city,
            "weather": {
                "temperature": temp,
                "humidity": humidity,
                "aqi": aqi_value,
                "aqi_category": aqi_category
            },
            "alerts": alerts,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Weather alerts error: {e}")
        return {
            "success": False,
            "message": "Unable to generate weather-based alerts",
            "city": city,
            "alerts": []
        }

# Autonomous Agent Endpoints
@router.get("/api/autonomous/analysis")
def get_autonomous_analysis():
    """Get autonomous agent analysis"""
    logger.info("Autonomous agent analysis requested")
    
    try:
        from services.autonomous_agent import autonomous_agent
        
        # Run autonomous analysis
        analysis_result = autonomous_agent.run_autonomous_analysis()
        
        return {
            "success": True,
            "analysis": analysis_result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Autonomous analysis error: {e}")
        return {
            "success": False,
            "message": "Unable to run autonomous analysis",
            "analysis": {}
        }

@router.get("/api/autonomous/check")
def check_autonomous_agent():
    """Check if autonomous agent needs to run analysis"""
    logger.info("Autonomous agent check requested")
    
    try:
        from services.autonomous_agent import autonomous_agent
        
        # Check and run if needed
        result = autonomous_agent.check_and_run_if_needed()
        
        return {
            "success": True,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Autonomous check error: {e}")
        return {
            "success": False,
            "message": "Unable to check autonomous agent",
            "result": {}
        }