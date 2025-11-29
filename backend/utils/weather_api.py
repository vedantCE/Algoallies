import requests
import os
from dotenv import load_dotenv

load_dotenv()

def get_weather(lat: float, lon: float):
    """
    Fetch weather data using GPS coordinates (latitude & longitude)
    Uses OpenWeatherMap API to get current weather conditions
    
    Args:
        lat: Latitude coordinate (float)
        lon: Longitude coordinate (float)
    
    Returns:
        dict: Weather data with temperature, humidity, description
    """
    print("Weather API call started")
    
    # Get API key from environment variables
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        print("Weather error: Missing API key")
        return None
    
    # Build OpenWeatherMap API URL with coordinates
    # Using metric units for temperature in Celsius
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    
    try:
        # Make HTTP request to OpenWeatherMap
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract relevant weather information from API response
        weather_data = {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "description": data["weather"][0]["description"]
        }
        
        print("Weather fetched successfully")
        return weather_data
        
    except requests.exceptions.RequestException as e:
        print(f"Weather error: {str(e)}")
        return None
    except KeyError as e:
        print(f"Weather error: Invalid response format - {str(e)}")
        return None