# Location-based routes - weather and nearby facilities
from fastapi import APIRouter
from pydantic import BaseModel
import logging
import requests
import os
from utils.weather_api import get_weather
from utils.weather_aqi import get_air_quality, classify_aqi_us
from utils.overpass_enhanced import find_nearby_facilities

logger = logging.getLogger(__name__)
router = APIRouter()

class WeatherRequest(BaseModel):
    lat: float
    lon: float

@router.get("/citizen/nearby-facilities")
def get_nearby_facilities(lat: float, lon: float, radius_km: float = 5.0):
    """Enhanced nearby facilities endpoint with real distance calculation"""
    logger.info(f"Nearby facilities requested for ({lat}, {lon}) within {radius_km}km")
    
    try:
        # Validate input parameters
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return {
                "success": False,
                "message": "Invalid coordinates provided",
                "user_location": {"lat": lat, "lon": lon},
                "radius_km": radius_km,
                "facilities": []
            }
        
        if not (0.1 <= radius_km <= 50):
            return {
                "success": False,
                "message": "Radius must be between 0.1 and 50 km",
                "user_location": {"lat": lat, "lon": lon},
                "radius_km": radius_km,
                "facilities": []
            }
        
        # Get facilities with real distances using enhanced Overpass API
        result = find_nearby_facilities(lat, lon, radius_km)
        
        return {
            "success": True,
            "message": f"Found {len(result['facilities'])} facilities within {radius_km}km",
            **result
        }
        
    except Exception as e:
        logger.error(f"Nearby facilities error: {e}")
        return {
            "success": False,
            "message": "Unable to fetch nearby facilities",
            "user_location": {"lat": lat, "lon": lon},
            "radius_km": radius_km,
            "facilities": []
        }

@router.get("/nearby-hospitals")
def nearby_hospitals():
    """Legacy endpoint - kept for backward compatibility"""
    logger.info("Legacy nearby hospitals requested")
    
    try:
        from utils.overpass_api import find_medical_places
        lat, lon = 19.0760, 72.8777
        
        medical_places = find_medical_places(lat, lon)
        
        return {
            "success": True,
            "places": medical_places,
            "location": {"lat": lat, "lon": lon, "city": "Mumbai"}
        }
    except Exception as e:
        logger.error(f"Nearby hospitals error: {e}")
        return {
            "success": False,
            "message": "Unable to fetch nearby hospitals",
            "places": []
        }

@router.post("/weather/complete")
def get_complete_weather(data: WeatherRequest):
    """Complete weather data including AQI for health recommendations"""
    logger.info(f"Weather requested for: {data.lat}, {data.lon}")
    
    try:
        # Get weather data from weather API
        weather_data = get_weather(data.lat, data.lon)
        
        if not weather_data:
            return {
                "success": False,
                "message": "Unable to fetch weather data"
            }
        
        # Get city name from reverse geocoding
        city = "Your location"
        try:
            geo_url = f"https://api.openweathermap.org/geo/1.0/reverse?lat={data.lat}&lon={data.lon}&limit=1&appid={os.getenv('OPENWEATHER_API_KEY')}"
            geo_response = requests.get(geo_url, timeout=5)
            if geo_response.status_code == 200:
                geo_data = geo_response.json()
                if geo_data and len(geo_data) > 0:
                    city = geo_data[0].get('name', 'Your location')
        except Exception:
            pass
        
        # Get AQI data for comprehensive health context
        try:
            aqi_data = get_air_quality(data.lat, data.lon)
            aqi_value = aqi_data.get('us_aqi') or aqi_data.get('european_aqi') or 50
            aqi_category = classify_aqi_us(aqi_value)
            weather_data['aqi'] = aqi_value
            weather_data['aqi_category'] = aqi_category
        except Exception as e:
            logger.warning(f"AQI fetch failed: {e}")
            weather_data['aqi'] = 50
            weather_data['aqi_category'] = 'Good'
        
        # Add wind speed (can be enhanced with real wind data)
        weather_data['windSpeed'] = weather_data.get('windSpeed', 12)
        weather_data['city'] = city
        
        return {
            "success": True,
            "weather": weather_data
        }
    except Exception as e:
        logger.error(f"Weather error: {e}")
        return {
            "success": False,
            "message": "Weather service temporarily unavailable"
        }