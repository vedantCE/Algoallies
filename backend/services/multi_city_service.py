# SurgeSense - Multi-City Health Advisory Service
# Provides health advisories and comparisons across multiple cities

import os
from typing import Dict, List, Any, Optional
from datetime import datetime
from utils.weather_api import get_weather
from utils.weather_aqi import get_air_quality, classify_aqi_us

class MultiCityService:
    """
    Multi-city health advisory and comparison service
    Provides health risk assessments across different cities
    """
    
    def __init__(self):
        # Major Indian cities with coordinates
        self.cities = {
            "Mumbai": {"lat": 19.0760, "lon": 72.8777},
            "Delhi": {"lat": 28.6139, "lon": 77.2090},
            "Bangalore": {"lat": 12.9716, "lon": 77.5946},
            "Chennai": {"lat": 13.0827, "lon": 80.2707},
            "Kolkata": {"lat": 22.5726, "lon": 88.3639},
            "Hyderabad": {"lat": 17.3850, "lon": 78.4867},
            "Pune": {"lat": 18.5204, "lon": 73.8567},
            "Ahmedabad": {"lat": 23.0225, "lon": 72.5714},
            "Jaipur": {"lat": 26.9124, "lon": 75.7873},
            "Surat": {"lat": 21.1702, "lon": 72.8311}
        }
        
        self.health_risk_weights = {
            "temperature": 0.3,
            "aqi": 0.4,
            "humidity": 0.2,
            "seasonal": 0.1
        }
    
    def get_city_conditions(self, city_name: str) -> Optional[Dict[str, Any]]:
        """Get weather and AQI conditions for a specific city"""
        if city_name not in self.cities:
            return None
        
        coords = self.cities[city_name]
        lat, lon = coords["lat"], coords["lon"]
        
        try:
            # Get weather data
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
            
            return {
                "city": city_name,
                "coordinates": coords,
                "temperature": weather_data.get("temperature", 25),
                "humidity": weather_data.get("humidity", 60),
                "description": weather_data.get("description", "moderate"),
                "aqi": aqi_value,
                "aqi_category": aqi_category,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting conditions for {city_name}: {e}")
            return None
    
    def calculate_health_risk_score(self, conditions: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate health risk score based on environmental conditions"""
        temp = conditions.get("temperature", 25)
        aqi = conditions.get("aqi", 50)
        humidity = conditions.get("humidity", 60)
        
        # Temperature risk (0-100 scale)
        if temp > 35 or temp < 10:
            temp_risk = 90
        elif temp > 32 or temp < 15:
            temp_risk = 70
        elif temp > 30 or temp < 18:
            temp_risk = 40
        else:
            temp_risk = 20
        
        # AQI risk (0-100 scale)
        if aqi > 200:
            aqi_risk = 95
        elif aqi > 150:
            aqi_risk = 80
        elif aqi > 100:
            aqi_risk = 60
        elif aqi > 50:
            aqi_risk = 30
        else:
            aqi_risk = 10
        
        # Humidity risk (0-100 scale)
        if humidity > 85 or humidity < 30:
            humidity_risk = 70
        elif humidity > 75 or humidity < 40:
            humidity_risk = 40
        else:
            humidity_risk = 20
        
        # Seasonal risk (basic implementation)
        month = datetime.now().month
        if month in [6, 7, 8, 9]:  # Monsoon
            seasonal_risk = 50
        elif month in [12, 1, 2]:  # Winter
            seasonal_risk = 30
        else:  # Summer/Spring
            seasonal_risk = 40
        
        # Calculate weighted overall risk
        overall_risk = (
            temp_risk * self.health_risk_weights["temperature"] +
            aqi_risk * self.health_risk_weights["aqi"] +
            humidity_risk * self.health_risk_weights["humidity"] +
            seasonal_risk * self.health_risk_weights["seasonal"]
        )
        
        # Determine risk level
        if overall_risk >= 80:
            risk_level = "Very High"
            risk_color = "red"
        elif overall_risk >= 60:
            risk_level = "High"
            risk_color = "orange"
        elif overall_risk >= 40:
            risk_level = "Moderate"
            risk_color = "yellow"
        elif overall_risk >= 20:
            risk_level = "Low"
            risk_color = "green"
        else:
            risk_level = "Very Low"
            risk_color = "blue"
        
        return {
            "overall_risk_score": round(overall_risk, 1),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "component_risks": {
                "temperature": round(temp_risk, 1),
                "aqi": round(aqi_risk, 1),
                "humidity": round(humidity_risk, 1),
                "seasonal": round(seasonal_risk, 1)
            }
        }
    
    def generate_city_advisory(self, conditions: Dict[str, Any]) -> Dict[str, Any]:
        """Generate health advisory for a specific city"""
        risk_data = self.calculate_health_risk_score(conditions)
        temp = conditions.get("temperature", 25)
        aqi = conditions.get("aqi", 50)
        humidity = conditions.get("humidity", 60)
        
        # Generate specific recommendations
        recommendations = []
        precautions = []
        
        # Temperature-based recommendations
        if temp > 35:
            recommendations.extend([
                "Stay indoors during peak hours (11 AM - 4 PM)",
                "Drink water every 15-20 minutes",
                "Wear light-colored, loose clothing"
            ])
            precautions.append("Heat stroke risk - seek immediate medical help if dizzy")
        elif temp < 15:
            recommendations.extend([
                "Wear warm layers and cover extremities",
                "Drink warm fluids regularly",
                "Avoid sudden temperature changes"
            ])
            precautions.append("Hypothermia risk - monitor elderly and children closely")
        
        # AQI-based recommendations
        if aqi > 150:
            recommendations.extend([
                "Wear N95 masks when outdoors",
                "Use air purifiers indoors",
                "Avoid outdoor exercise"
            ])
            precautions.append("Respiratory distress - consult doctor if breathing difficulty")
        elif aqi > 100:
            recommendations.extend([
                "Limit outdoor activities",
                "Keep windows closed during peak pollution hours"
            ])
        
        # Humidity-based recommendations
        if humidity > 80:
            recommendations.extend([
                "Use dehumidifiers if available",
                "Wear breathable fabrics",
                "Monitor for fungal infections"
            ])
        elif humidity < 40:
            recommendations.extend([
                "Use humidifiers or keep water bowls",
                "Apply moisturizer regularly",
                "Stay hydrated"
            ])
        
        # Best and worst times for outdoor activities
        if temp > 32:
            best_times = ["6:00-9:00 AM", "7:00-9:00 PM"]
            avoid_times = ["11:00 AM-4:00 PM"]
        elif temp < 15:
            best_times = ["10:00 AM-3:00 PM"]
            avoid_times = ["6:00-9:00 AM", "8:00-11:00 PM"]
        else:
            best_times = ["6:00-10:00 AM", "5:00-8:00 PM"]
            avoid_times = []
        
        return {
            "city": conditions["city"],
            "risk_assessment": risk_data,
            "recommendations": recommendations,
            "precautions": precautions,
            "outdoor_timing": {
                "best_times": best_times,
                "avoid_times": avoid_times
            },
            "emergency_contacts": {
                "ambulance": "108",
                "pollution_helpline": "1800-11-0031",
                "disaster_management": "1078"
            }
        }
    
    def get_multi_city_comparison(self, city_list: Optional[List[str]] = None) -> Dict[str, Any]:
        """Get health risk comparison across multiple cities"""
        if not city_list:
            city_list = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"]
        
        city_data = []
        
        for city in city_list:
            if city in self.cities:
                conditions = self.get_city_conditions(city)
                if conditions:
                    advisory = self.generate_city_advisory(conditions)
                    city_data.append({
                        "city": city,
                        "conditions": conditions,
                        "advisory": advisory
                    })
        
        # Sort cities by risk level
        city_data.sort(key=lambda x: x["advisory"]["risk_assessment"]["overall_risk_score"], reverse=True)
        
        # Generate summary
        if city_data:
            highest_risk = city_data[0]
            lowest_risk = city_data[-1]
            
            summary = {
                "highest_risk_city": {
                    "name": highest_risk["city"],
                    "risk_score": highest_risk["advisory"]["risk_assessment"]["overall_risk_score"],
                    "risk_level": highest_risk["advisory"]["risk_assessment"]["risk_level"]
                },
                "lowest_risk_city": {
                    "name": lowest_risk["city"],
                    "risk_score": lowest_risk["advisory"]["risk_assessment"]["overall_risk_score"],
                    "risk_level": lowest_risk["advisory"]["risk_assessment"]["risk_level"]
                },
                "average_risk_score": round(sum(city["advisory"]["risk_assessment"]["overall_risk_score"] for city in city_data) / len(city_data), 1)
            }
        else:
            summary = {"error": "No city data available"}
        
        return {
            "timestamp": datetime.now().isoformat(),
            "cities_analyzed": len(city_data),
            "summary": summary,
            "city_data": city_data
        }
    
    def get_city_recommendations(self, city_name: str) -> Dict[str, Any]:
        """Get detailed recommendations for a specific city"""
        conditions = self.get_city_conditions(city_name)
        if not conditions:
            return {"error": f"City '{city_name}' not found or data unavailable"}
        
        advisory = self.generate_city_advisory(conditions)
        
        return {
            "timestamp": datetime.now().isoformat(),
            "city": city_name,
            "conditions": conditions,
            "advisory": advisory
        }

# Global instance for easy import
multi_city_service = MultiCityService()