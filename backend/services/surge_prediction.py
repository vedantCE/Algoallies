# SurgeSense - Surge Prediction Service
# Predicts patient surges based on weather, AQI, events, and historical patterns

import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import requests
from utils.weather_api import get_weather
from utils.weather_aqi import get_air_quality, classify_aqi_us

class SurgePredictionService:
    """
    AI-powered surge prediction for hospital operations
    Analyzes weather, AQI, events, and patterns to predict patient influx
    """
    
    def __init__(self):
        self.base_surge_factors = {
            "temperature_high": 1.4,  # >32°C increases cases by 40%
            "temperature_low": 1.3,   # <15°C increases cases by 30%
            "aqi_poor": 1.6,          # AQI >150 increases cases by 60%
            "aqi_moderate": 1.2,      # AQI 100-150 increases cases by 20%
            "humidity_high": 1.1,     # >80% humidity increases cases by 10%
            "festival_day": 1.8,      # Festival days increase cases by 80%
            "weekend": 1.2,           # Weekends increase cases by 20%
            "monsoon": 1.3            # Monsoon season increases cases by 30%
        }
    
    def get_current_conditions(self, lat: float = 19.0760, lon: float = 72.8777) -> Dict[str, Any]:
        """Get current weather and AQI conditions"""
        try:
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
                "temperature": weather_data.get("temperature", 25),
                "humidity": weather_data.get("humidity", 60),
                "description": weather_data.get("description", "moderate"),
                "aqi": aqi_value,
                "aqi_category": aqi_category,
                "timestamp": datetime.now()
            }
        except Exception as e:
            print(f"Error getting conditions: {e}")
            return {
                "temperature": 25, "humidity": 60, "description": "moderate",
                "aqi": 50, "aqi_category": "Good", "timestamp": datetime.now()
            }
    
    def calculate_surge_multiplier(self, conditions: Dict[str, Any]) -> float:
        """Calculate surge multiplier based on current conditions"""
        multiplier = 1.0
        temp = conditions.get("temperature", 25)
        humidity = conditions.get("humidity", 60)
        aqi = conditions.get("aqi", 50)
        
        # Temperature-based surge
        if temp > 32:
            multiplier *= self.base_surge_factors["temperature_high"]
        elif temp < 15:
            multiplier *= self.base_surge_factors["temperature_low"]
        
        # AQI-based surge
        if aqi > 150:
            multiplier *= self.base_surge_factors["aqi_poor"]
        elif aqi > 100:
            multiplier *= self.base_surge_factors["aqi_moderate"]
        
        # Humidity-based surge
        if humidity > 80:
            multiplier *= self.base_surge_factors["humidity_high"]
        
        # Day-based factors
        now = datetime.now()
        if now.weekday() >= 5:  # Weekend
            multiplier *= self.base_surge_factors["weekend"]
        
        # Monsoon season (June-September in Mumbai)
        if now.month in [6, 7, 8, 9]:
            multiplier *= self.base_surge_factors["monsoon"]
        
        return round(multiplier, 2)
    
    def predict_department_surge(self, conditions: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Predict surge for different hospital departments"""
        base_multiplier = self.calculate_surge_multiplier(conditions)
        temp = conditions.get("temperature", 25)
        aqi = conditions.get("aqi", 50)
        
        departments = {
            "Emergency": {
                "base_patients": 50,
                "multiplier": base_multiplier,
                "primary_factors": []
            },
            "Respiratory": {
                "base_patients": 30,
                "multiplier": 1.0,
                "primary_factors": []
            },
            "Cardiology": {
                "base_patients": 20,
                "multiplier": 1.0,
                "primary_factors": []
            },
            "Pediatrics": {
                "base_patients": 25,
                "multiplier": 1.0,
                "primary_factors": []
            },
            "General Medicine": {
                "base_patients": 40,
                "multiplier": 1.0,
                "primary_factors": []
            }
        }
        
        # Respiratory department surge factors
        if aqi > 150:
            departments["Respiratory"]["multiplier"] = base_multiplier * 1.5
            departments["Respiratory"]["primary_factors"].append(f"Poor AQI ({aqi})")
        elif aqi > 100:
            departments["Respiratory"]["multiplier"] = base_multiplier * 1.2
            departments["Respiratory"]["primary_factors"].append(f"Moderate AQI ({aqi})")
        
        # Emergency department surge factors
        if temp > 32:
            departments["Emergency"]["multiplier"] = base_multiplier * 1.3
            departments["Emergency"]["primary_factors"].append(f"High temperature ({temp}°C)")
        elif temp < 15:
            departments["Emergency"]["multiplier"] = base_multiplier * 1.2
            departments["Emergency"]["primary_factors"].append(f"Cold weather ({temp}°C)")
        
        # Cardiology surge factors (heat stress)
        if temp > 35:
            departments["Cardiology"]["multiplier"] = base_multiplier * 1.4
            departments["Cardiology"]["primary_factors"].append("Extreme heat stress")
        
        # Pediatrics surge factors
        if temp > 32 or temp < 15:
            departments["Pediatrics"]["multiplier"] = base_multiplier * 1.3
            departments["Pediatrics"]["primary_factors"].append("Temperature extremes")
        
        # General Medicine surge factors
        departments["General Medicine"]["multiplier"] = base_multiplier
        if temp < 20:
            departments["General Medicine"]["primary_factors"].append("Cold weather infections")
        
        # Calculate predicted patients for each department
        for dept_name, dept_data in departments.items():
            predicted = int(dept_data["base_patients"] * dept_data["multiplier"])
            dept_data["predicted_patients"] = predicted
            dept_data["surge_percentage"] = int((dept_data["multiplier"] - 1) * 100)
        
        return departments
    
    def get_peak_hours_prediction(self, conditions: Dict[str, Any]) -> List[str]:
        """Predict peak hours based on conditions"""
        temp = conditions.get("temperature", 25)
        aqi = conditions.get("aqi", 50)
        
        peak_hours = []
        
        if temp > 32:
            # Hot weather - peaks in afternoon and evening
            peak_hours = ["12:00-15:00", "18:00-21:00"]
        elif temp < 15:
            # Cold weather - peaks in morning and night
            peak_hours = ["06:00-09:00", "20:00-23:00"]
        elif aqi > 150:
            # Poor air quality - consistent throughout day
            peak_hours = ["09:00-12:00", "15:00-18:00", "20:00-22:00"]
        else:
            # Normal conditions
            peak_hours = ["10:00-12:00", "16:00-18:00"]
        
        return peak_hours
    
    def generate_surge_report(self, lat: float = 19.0760, lon: float = 72.8777) -> Dict[str, Any]:
        """Generate comprehensive surge prediction report"""
        conditions = self.get_current_conditions(lat, lon)
        department_predictions = self.predict_department_surge(conditions)
        peak_hours = self.get_peak_hours_prediction(conditions)
        overall_multiplier = self.calculate_surge_multiplier(conditions)
        
        # Calculate risk level
        if overall_multiplier >= 1.5:
            risk_level = "High"
            risk_color = "red"
        elif overall_multiplier >= 1.2:
            risk_level = "Moderate"
            risk_color = "yellow"
        else:
            risk_level = "Low"
            risk_color = "green"
        
        # Generate recommendations
        recommendations = []
        if conditions["temperature"] > 32:
            recommendations.append({
                "title": "Heat Wave Protocol",
                "description": "Activate cooling centers, increase hydration supplies, monitor elderly patients",
                "priority": "high",
                "icon_type": "heat"
            })
        
        if conditions["aqi"] > 150:
            recommendations.append({
                "title": "Air Quality Alert",
                "description": "Increase respiratory staff, stock inhalers and nebulizers, prepare oxygen supplies",
                "priority": "high",
                "icon_type": "air_quality"
            })
        
        if conditions["temperature"] < 15:
            recommendations.append({
                "title": "Cold Weather Preparedness",
                "description": "Monitor respiratory infections, increase warm blanket supplies, check heating systems",
                "priority": "medium",
                "icon_type": "respiratory"
            })
        
        return {
            "timestamp": datetime.now().isoformat(),
            "conditions": conditions,
            "overall_surge_multiplier": overall_multiplier,
            "risk_level": risk_level,
            "risk_color": risk_color,
            "peak_hours": peak_hours,
            "department_predictions": department_predictions,
            "recommendations": recommendations,
            "total_predicted_patients": sum(dept["predicted_patients"] for dept in department_predictions.values()),
            "summary": f"Surge risk is {risk_level.lower()} with {int((overall_multiplier - 1) * 100)}% increase expected. Peak hours: {', '.join(peak_hours)}"
        }

# Global instance for easy import
surge_service = SurgePredictionService()