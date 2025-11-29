import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

def generate_hospital_response(query: str):
    print("Hospital agent started")
    
    # Get live weather and AQI data
    try:
        from utils.weather_api import get_weather
        from utils.weather_aqi import get_air_quality, classify_aqi_us
        
        lat, lon = 19.0760, 72.8777  # Mumbai coordinates
        weather_data = get_weather(lat, lon)
        if not weather_data:
            weather_data = {"temperature": 25, "humidity": 60, "description": "moderate"}
        
        # Get AQI data
        try:
            aqi_data = get_air_quality(lat, lon)
            aqi_value = aqi_data.get('us_aqi') or aqi_data.get('european_aqi') or 50
            aqi_category = classify_aqi_us(aqi_value)
            weather_data['aqi'] = aqi_value
            weather_data['aqi_category'] = aqi_category
        except:
            weather_data['aqi'] = 50
            weather_data['aqi_category'] = 'Good'
            
    except:
        weather_data = {"temperature": 25, "humidity": 60, "description": "moderate", "aqi": 50, "aqi_category": "Good"}

    system_prompt = """You are the SurgeSense Hospital Operations Intelligence Agent.

Your job is to analyze current weather conditions and predict operational healthcare needs.

You MUST return ONLY valid JSON with weather-based recommendations:

{
  "weather_analysis": {
    "temperature": number,
    "humidity": number,
    "conditions": "string",
    "health_impact": "string"
  },
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "priority": "high|medium|low",
      "icon_type": "respiratory|heat|air_quality"
    }
  ],
  "surge_prediction": {
    "expected_cases": number,
    "peak_hours": ["string"],
    "risk_level": "Low|Moderate|High"
  }
}

RULES:
1. Base predictions on actual weather data provided
2. High temp (>30°C) = heat-related cases
3. High humidity (>70%) = respiratory/skin issues  
4. Cold (<15°C) = respiratory infections
5. Return ONLY valid JSON, no extra text"""

    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=os.getenv("GEMINI_API_KEY")
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Current Weather Data: Temperature: {weather_data.get('temperature', 25)}°C, Humidity: {weather_data.get('humidity', 60)}%, Conditions: {weather_data.get('description', 'moderate')}, AQI: {weather_data.get('aqi', 50)} ({weather_data.get('aqi_category', 'Good')}). Location: Mumbai. Generate hospital recommendations based on this live weather and air quality data.")
    ]

    try:
        res = model(messages)
        print("Hospital AI response generated")
        return res.content
    except Exception as e:
        print("Error:", e)
        return {"error": "Agent failed"}