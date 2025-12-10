from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
from typing import List, Optional
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import agents
from agents.citizen_agent import generate_citizen_response
from agents.hospital_agent import generate_hospital_response
from agents.landing_agent import generate_landing_response

# Import services
from services.surge_prediction import surge_service
from services.autonomous_agent import autonomous_agent
from services.multi_city_service import multi_city_service

# Import models
from models import Staff, StaffRecommendation, InventoryItem, DecisionLog, HospitalSettings, StaffStatus, DecisionStatus

app = FastAPI()

logger.info("Backend starting...")

# ✅ CORS Configuration - FIXED: Added immediately after FastAPI() creation
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174", 
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # ✅ This allows OPTIONS requests
    allow_headers=["*"],
    expose_headers=["*"]
)

logger.info("CORS middleware configured")

# ✅ Include additional endpoints AFTER CORS middleware
from surge_endpoints import router as surge_router
app.include_router(surge_router)

# MongoDB Connection with safe fallback
db_client = None
users_collection = None
staff_collection = None
inventory_collection = None
decision_log_collection = None
settings_collection = None

mock_users = [
    {"email": "citizen@test.com", "password": "1234", "role": "citizen"},
    {"email": "hospital@test.com", "password": "9999", "role": "hospital"},
]

# Mock data for fallback
mock_staff = [
    {"name": "Dr. Pooja Lingayat", "role": "doctor", "department": "Emergency", "status": "on_duty", "shift": "day"},
    {"name": "Dr. Khushi Bhatt", "role": "doctor", "department": "Surgery", "status": "on_duty", "shift": "day"},
    {"name": "Nurse Niru Patel", "role": "nurse", "department": "ICU", "status": "on_duty", "shift": "day"},
    {"name": "Dr. Hriday Desai", "role": "specialist", "department": "Cardiology", "status": "off_duty", "shift": "night"},
    {"name": "Nurse Lalita", "role": "nurse", "department": "ICU", "status": "off_duty", "shift": "night"},
]

mock_inventory = [
    {"name": "N95 Masks", "available_quantity": 500, "ai_recommended_quantity": 750, "status": "pending", "category": "PPE", "unit": "pieces"},
    {"name": "Inhalers", "available_quantity": 45, "ai_recommended_quantity": 80, "status": "pending", "category": "Medicine", "unit": "units"},
    {"name": "Paracetamol", "available_quantity": 200, "ai_recommended_quantity": 300, "status": "pending", "category": "Medicine", "unit": "tablets"},
    {"name": "IV Fluids", "available_quantity": 120, "ai_recommended_quantity": 150, "status": "pending", "category": "Medical Supplies", "unit": "bags"},
    {"name": "Oxygen Cylinders", "available_quantity": 25, "ai_recommended_quantity": 40, "status": "pending", "category": "Equipment", "unit": "cylinders"},
]

try:
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI not found in environment variables")
    
    db_client = MongoClient(
        mongo_uri,
        connectTimeoutMS=5000,
        serverSelectionTimeoutMS=5000
    )
    
    # Test connection
    db_client.admin.command('ping')
    db = db_client["SurgeSense"]
    users_collection = db["users"]
    staff_collection = db["staff"]
    inventory_collection = db["inventory"]
    decision_log_collection = db["decision_log"]
    settings_collection = db["settings"]
    
    logger.info("MongoDB connected successfully")
    
    # Seed data once
    if users_collection.count_documents({}) == 0:
        users_collection.insert_many(mock_users)
        logger.info("Users seeded to MongoDB")
    
    if staff_collection.count_documents({}) == 0:
        staff_collection.insert_many(mock_staff)
        logger.info("Staff seeded to MongoDB")
    
    if inventory_collection.count_documents({}) == 0:
        inventory_collection.insert_many(mock_inventory)
        logger.info("Inventory seeded to MongoDB")
        
except Exception as e:
    logger.warning(f"MongoDB connection failed: {e}. Using in-memory fallback.")
    users_collection = None
    staff_collection = None
    inventory_collection = None
    decision_log_collection = None
    settings_collection = None

# Pydantic Models
class CitizenAIModel(BaseModel):
    message: str
    lat: float = None
    lon: float = None
    return_json: bool = False

class HospitalAIModel(BaseModel):
    query: str

class LandingAIModel(BaseModel):
    content: str = None

class LoginModel(BaseModel):
    email: str
    password: str

class SignupModel(BaseModel):
    name: str
    email: str
    password: str

class WeatherRequest(BaseModel):
    lat: float
    lon: float

class StaffRecommendationRequest(BaseModel):
    department: Optional[str] = None

class InventoryStatusUpdate(BaseModel):
    item_id: str
    status: str  # approved, review, declined
    reasoning: Optional[str] = None

# ✅ FIXED: Explicit OPTIONS handling for problematic routes
@app.options("/login")
@app.options("/landing-response")
async def handle_options():
    """Handle OPTIONS preflight requests explicitly"""
    return {"message": "OK"}

# API Endpoints
@app.post("/login")
def login(data: LoginModel):
    logger.info(f"Login attempt for: {data.email}")
    
    try:
        # Try MongoDB first
        if users_collection is not None:
            user = users_collection.find_one({
                "email": data.email,
                "password": data.password
            })
        else:
            # Fallback to mock users
            user = next((u for u in mock_users if u["email"] == data.email and u["password"] == data.password), None)
        
        if not user:
            return {"success": False, "message": "Invalid email or password"}
        
        return {
            "success": True,
            "role": user["role"],
            "message": f"Successfully logged in as {user['role']}"
        }
    except Exception as e:
        logger.error(f"Login error: {e}")
        return {"success": False, "message": "Login service temporarily unavailable"}

@app.post("/signup")
def signup(data: SignupModel):
    logger.info(f"Signup attempt for: {data.email}")
    
    try:
        new_user = {
            "name": data.name,
            "email": data.email,
            "password": data.password,
            "role": "citizen"
        }
        
        if users_collection is not None:
            existing_user = users_collection.find_one({"email": data.email})
            if existing_user:
                return {"success": False, "message": "User already exists"}
            users_collection.insert_one(new_user)
        else:
            # Fallback to mock users
            if any(u["email"] == data.email for u in mock_users):
                return {"success": False, "message": "User already exists"}
            mock_users.append(new_user)
        
        return {"success": True, "message": "User created successfully"}
    except Exception as e:
        logger.error(f"Signup error: {e}")
        return {"success": False, "message": "Signup service temporarily unavailable"}

@app.post("/citizen-response")
def citizen_response(data: CitizenAIModel):
    """Floating chatbot endpoint - uses landing_agent for short responses"""
    logger.info(f"Floating chatbot query: {data.message[:50]}...")
    
    try:
        # Use provided coordinates or fallback
        lat = data.lat if data.lat else 19.0760
        lon = data.lon if data.lon else 72.8777
        
        logger.info(f"Using coordinates: {lat}, {lon}")
        
        # Use landing_agent for short, friendly responses
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

@app.post("/citizenai")
def citizenai(data: CitizenAIModel):
    """Citizen dashboard endpoint - uses citizen_agent for detailed responses"""
    logger.info(f"CitizenAI dashboard query: {data.message[:50]}...")
    
    try:
        from utils.weather_api import get_weather
        from utils.weather_aqi import get_air_quality, classify_aqi_us
        
        # Use provided coordinates or fallback
        lat = data.lat if data.lat else 19.0760
        lon = data.lon if data.lon else 72.8777
        
        logger.info(f"Using coordinates: {lat}, {lon}")
        
        weather_data = get_weather(lat, lon)
        if not weather_data:
            weather_data = {
                "temperature": 25,
                "humidity": 60,
                "description": "moderate conditions"
            }
        
        try:
            aqi_data = get_air_quality(lat, lon)
            aqi_value = aqi_data.get('us_aqi') or aqi_data.get('european_aqi') or 50
            aqi_category = classify_aqi_us(aqi_value)
            weather_data['aqi'] = aqi_value
            weather_data['aqi_category'] = aqi_category
        except Exception:
            weather_data['aqi'] = 50
            weather_data['aqi_category'] = 'Good'
        
        # Force JSON mode for dashboard
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

@app.post("/hospital-response")
def hospital_response(data: HospitalAIModel):
    logger.info(f"Hospital query: {data.query[:50]}...")
    
    try:
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

# ✅ FIXED: Made landing-response optional body to handle OPTIONS properly
@app.post("/landing-response")
def landing_response(data: Optional[LandingAIModel] = None):
    logger.info("Landing page query received")
    
    try:
        content = data.content if data else "Welcome to HealthAI"
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

@app.get("/health-advisory")
def health_advisory():
    logger.info("Health advisory requested")
    
    # Default fallback values
    lat, lon = 19.0760, 72.8777
    foods = ["Balanced meals", "Fresh vegetables", "Whole grains", "Lean proteins"]
    fruits = ["Seasonal fruits", "Apple", "Banana", "Orange"]
    ayurvedic = ["Turmeric milk", "Ginger tea", "Tulsi water"]
    avoid = ["Processed foods", "Excessive sugar", "Trans fats"]
    weather_alert = "📍 Mumbai: General health recommendations"
    
    try:
        from utils.weather_api import get_weather
        from utils.weather_aqi import get_air_quality, classify_aqi_us
        
        weather_data = get_weather(lat, lon)
        
        if weather_data:
            temp = weather_data.get('temperature', 25)
            humidity = weather_data.get('humidity', 60)
            
            # Get AQI data
            try:
                aqi_data = get_air_quality(lat, lon)
                aqi_value = aqi_data.get('us_aqi') or aqi_data.get('european_aqi') or 50
                aqi_category = classify_aqi_us(aqi_value)
            except Exception:
                aqi_value = 50
                aqi_category = 'Good'
            
            # Generate weather-specific recommendations
            foods = []
            fruits = []
            ayurvedic = []
            avoid = []
            
            if temp > 30:
                foods = ["Cucumber salad", "Watermelon juice", "Coconut water", "Mint lassi"]
                fruits = ["Watermelon", "Muskmelon", "Orange", "Grapes"]
                ayurvedic = ["Gulkand", "Fennel seeds water", "Aloe vera juice"]
                avoid = ["Spicy food", "Hot beverages", "Heavy meals", "Alcohol"]
            elif temp < 15:
                foods = ["Ginger tea", "Hot soup", "Warm milk with turmeric", "Oats porridge"]
                fruits = ["Apple", "Pomegranate", "Dates", "Dry fruits"]
                ayurvedic = ["Chyawanprash", "Ginger honey mix", "Tulsi tea"]
                avoid = ["Cold drinks", "Ice cream", "Raw salads", "Frozen foods"]
            else:
                foods = ["Mixed vegetable curry", "Brown rice", "Dal", "Green tea"]
                fruits = ["Apple", "Banana", "Papaya", "Guava"]
                ayurvedic = ["Triphala powder", "Amla juice", "Ashwagandha"]
                avoid = ["Processed foods", "Excessive sugar", "Fried items"]
            
            if humidity > 70:
                avoid.extend(["Dairy products", "Fermented foods"])
                ayurvedic.append("Neem leaves")
            
            weather_alert = f"📍 Mumbai: {temp}°C, {humidity}% humidity, AQI {aqi_value} ({aqi_category}). "
            if temp > 32:
                weather_alert += "High heat - stay hydrated!"
            elif temp < 10:
                weather_alert += "Cold weather - keep warm!"
            elif aqi_value > 150:
                weather_alert += "Poor air quality - stay indoors!"
            else:
                weather_alert += "Good conditions for outdoor activities."
    
    except Exception as e:
        logger.error(f"Health advisory error: {e}")
        # Use default fallback values already set
    
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

@app.get("/citizen/nearby-facilities")
def get_nearby_facilities(lat: float, lon: float, radius_km: float = 5.0):
    """Enhanced nearby facilities endpoint with real distance calculation"""
    logger.info(f"Nearby facilities requested for ({lat}, {lon}) within {radius_km}km")
    
    try:
        from utils.overpass_enhanced import find_nearby_facilities
        
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
        
        # Get facilities with real distances
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

@app.get("/nearby-hospitals")
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

@app.post("/weather/complete")
def get_complete_weather(data: WeatherRequest):
    logger.info(f"Weather requested for: {data.lat}, {data.lon}")
    
    try:
        from utils.weather_api import get_weather
        from utils.weather_aqi import get_air_quality, classify_aqi_us
        import requests
        
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
        
        # Get AQI data
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
        
        # Add wind speed (mock for now, can be added to weather_api.py)
        weather_data['windSpeed'] = 12
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

# Hospital Management API Endpoints - REMOVED DUPLICATES

@app.get("/api/staff")
def get_staff():
    """Get all staff members with their current status"""
    logger.info("Staff list requested")
    
    try:
        if staff_collection is not None:
            staff_list = list(staff_collection.find({}, {"_id": 0}))
        else:
            staff_list = mock_staff.copy()
        
        return {
            "success": True,
            "staff": staff_list
        }
    except Exception as e:
        logger.error(f"Staff fetch error: {e}")
        return {
            "success": False,
            "message": "Unable to fetch staff data",
            "staff": []
        }

@app.post("/api/staff/recommendations")
def get_staff_recommendations(data: StaffRecommendationRequest):
    """Generate AI-powered staff recommendations based on weather and surge prediction"""
    logger.info("Staff recommendations requested")
    
    try:
        from utils.weather_api import get_weather
        from utils.weather_aqi import get_air_quality, classify_aqi_us
        
        # Get live weather data
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
        
        # Create structured recommendations based on weather conditions
        recommendations = []
        temp = weather_data.get('temperature', 25)
        humidity = weather_data.get('humidity', 60)
        
        if temp > 32:  # High temperature
            recommendations.extend([
                {
                    "role": "Doctor",
                    "department": "Emergency",
                    "recommended_count": 4,
                    "current_count": 2,
                    "reason": f"High temperature ({temp}°C) expected to increase heat-related emergencies",
                    "priority": "high"
                },
                {
                    "role": "Nurse",
                    "department": "Emergency",
                    "recommended_count": 6,
                    "current_count": 3,
                    "reason": "Additional nursing support needed for heat stroke and dehydration cases",
                    "priority": "high"
                }
            ])
        
        if aqi_value > 150:  # Poor air quality
            recommendations.extend([
                {
                    "role": "Specialist",
                    "department": "Pulmonology",
                    "recommended_count": 3,
                    "current_count": 1,
                    "reason": f"Poor air quality (AQI {aqi_value}) will increase respiratory cases",
                    "priority": "high"
                },
                {
                    "role": "Nurse",
                    "department": "Respiratory",
                    "recommended_count": 4,
                    "current_count": 2,
                    "reason": "Additional respiratory care support needed",
                    "priority": "medium"
                }
            ])
        
        if temp < 15:  # Cold weather
            recommendations.append({
                "role": "Doctor",
                "department": "General Medicine",
                "recommended_count": 3,
                "current_count": 2,
                "reason": f"Cold weather ({temp}°C) increases respiratory infections and flu cases",
                "priority": "medium"
            })
        
        # Default recommendations if no extreme conditions
        if not recommendations:
            recommendations = [
                {
                    "role": "Doctor",
                    "department": "Emergency",
                    "recommended_count": 2,
                    "current_count": 2,
                    "reason": "Normal weather conditions - maintain standard staffing",
                    "priority": "low"
                }
            ]
        
        return {
            "success": True,
            "recommendations": recommendations,
            "weather_context": {
                "temperature": temp,
                "humidity": humidity,
                "aqi": aqi_value,
                "aqi_category": aqi_category
            }
        }
    except Exception as e:
        logger.error(f"Staff recommendations error: {e}")
        return {
            "success": False,
            "message": "Unable to generate staff recommendations",
            "recommendations": []
        }

@app.get("/api/inventory")
def get_inventory():
    """Get all inventory items with AI recommendations"""
    logger.info("Inventory list requested")
    
    try:
        if inventory_collection is not None:
            inventory_list = list(inventory_collection.find({}, {"_id": 1, "name": 1, "available_quantity": 1, "ai_recommended_quantity": 1, "status": 1, "category": 1, "unit": 1}))
            # Convert ObjectId to string for JSON serialization
            for item in inventory_list:
                item["_id"] = str(item["_id"])
        else:
            inventory_list = mock_inventory.copy()
            # Add mock IDs
            for i, item in enumerate(inventory_list):
                item["_id"] = f"mock_id_{i}"
        
        return {
            "success": True,
            "inventory": inventory_list
        }
    except Exception as e:
        logger.error(f"Inventory fetch error: {e}")
        return {
            "success": False,
            "message": "Unable to fetch inventory data",
            "inventory": []
        }

@app.post("/api/inventory/recalculate")
def recalculate_inventory_recommendations():
    """Recalculate AI recommendations for all inventory items based on current conditions"""
    logger.info("Inventory recalculation requested")
    
    try:
        from utils.weather_api import get_weather
        from utils.weather_aqi import get_air_quality, classify_aqi_us
        
        # Get current weather conditions
        lat, lon = 19.0760, 72.8777
        weather_data = get_weather(lat, lon)
        if not weather_data:
            weather_data = {"temperature": 25, "humidity": 60, "description": "moderate"}
        
        try:
            aqi_data = get_air_quality(lat, lon)
            aqi_value = aqi_data.get('us_aqi') or aqi_data.get('european_aqi') or 50
        except:
            aqi_value = 50
        
        temp = weather_data.get('temperature', 25)
        
        # Get current inventory
        if inventory_collection is not None:
            inventory_items = list(inventory_collection.find({}))
        else:
            inventory_items = mock_inventory.copy()
        
        # Update recommendations based on weather
        for item in inventory_items:
            base_qty = item['available_quantity']
            
            # AI logic for recommendations based on weather
            if item['name'] == 'N95 Masks' and aqi_value > 100:
                item['ai_recommended_quantity'] = int(base_qty * 1.8)  # 80% increase for poor air quality
            elif item['name'] == 'Inhalers' and aqi_value > 150:
                item['ai_recommended_quantity'] = int(base_qty * 2.0)  # Double for very poor air quality
            elif item['name'] == 'Paracetamol' and (temp > 32 or temp < 15):
                item['ai_recommended_quantity'] = int(base_qty * 1.5)  # 50% increase for extreme temperatures
            elif item['name'] == 'IV Fluids' and temp > 30:
                item['ai_recommended_quantity'] = int(base_qty * 1.4)  # 40% increase for hot weather
            elif item['name'] == 'Oxygen Cylinders' and aqi_value > 150:
                item['ai_recommended_quantity'] = int(base_qty * 1.6)  # 60% increase for poor air quality
            else:
                item['ai_recommended_quantity'] = int(base_qty * 1.2)  # 20% buffer for normal conditions
            
            # Update in database if available
            if inventory_collection is not None:
                inventory_collection.update_one(
                    {"_id": item["_id"]},
                    {"$set": {"ai_recommended_quantity": item['ai_recommended_quantity']}}
                )
        
        return {
            "success": True,
            "message": "Inventory recommendations updated based on current weather conditions",
            "weather_context": {
                "temperature": temp,
                "aqi": aqi_value
            }
        }
    except Exception as e:
        logger.error(f"Inventory recalculation error: {e}")
        return {
            "success": False,
            "message": "Unable to recalculate inventory recommendations"
        }

@app.patch("/api/inventory/{item_id}/status")
def update_inventory_status(item_id: str, data: InventoryStatusUpdate):
    """Update the status of an inventory item (approve/review/decline)"""
    logger.info(f"Inventory status update for item {item_id}: {data.status}")
    
    try:
        # Log the decision
        decision_log = {
            "type": "inventory",
            "item_name": "",
            "original_recommendation": "",
            "final_decision": data.status,
            "timestamp": datetime.now(),
            "reasoning": data.reasoning
        }
        
        if inventory_collection is not None:
            from bson import ObjectId
            
            # Get current item details
            item = inventory_collection.find_one({"_id": ObjectId(item_id)})
            if not item:
                return {"success": False, "message": "Item not found"}
            
            decision_log["item_name"] = item["name"]
            decision_log["original_recommendation"] = f"Increase to {item['ai_recommended_quantity']} {item.get('unit', 'units')}"
            
            # Update item status
            inventory_collection.update_one(
                {"_id": ObjectId(item_id)},
                {"$set": {"status": data.status}}
            )
            
            # Log decision
            if decision_log_collection is not None:
                decision_log_collection.insert_one(decision_log)
        else:
            # Mock update for fallback
            for item in mock_inventory:
                if item.get("_id") == item_id:
                    item["status"] = data.status
                    decision_log["item_name"] = item["name"]
                    decision_log["original_recommendation"] = f"Increase to {item['ai_recommended_quantity']} {item.get('unit', 'units')}"
                    break
        
        return {
            "success": True,
            "message": f"Item status updated to {data.status}"
        }
    except Exception as e:
        logger.error(f"Inventory status update error: {e}")
        return {
            "success": False,
            "message": "Unable to update inventory status"
        }

@app.get("/api/reports/decisions")
def get_decision_reports():
    """Get history of all staffing and inventory decisions"""
    logger.info("Decision reports requested")
    
    try:
        decisions = []
        
        if decision_log_collection is not None:
            decisions = list(decision_log_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(50))
            # Convert datetime to string for JSON serialization
            for decision in decisions:
                if isinstance(decision.get('timestamp'), datetime):
                    decision['timestamp'] = decision['timestamp'].isoformat()
        else:
            # Mock decision data for fallback
            decisions = [
                {
                    "type": "inventory",
                    "item_name": "N95 Masks",
                    "original_recommendation": "Increase to 750 pieces",
                    "final_decision": "approved",
                    "timestamp": datetime.now().isoformat(),
                    "reasoning": "High AQI levels require additional PPE"
                },
                {
                    "type": "staff",
                    "item_name": "Emergency Doctors",
                    "original_recommendation": "Add 2 doctors to Emergency",
                    "final_decision": "review",
                    "timestamp": datetime.now().isoformat(),
                    "reasoning": "Need to check budget allocation"
                }
            ]
        
        return {
            "success": True,
            "decisions": decisions
        }
    except Exception as e:
        logger.error(f"Decision reports error: {e}")
        return {
            "success": False,
            "message": "Unable to fetch decision reports",
            "decisions": []
        }

@app.get("/api/settings")
def get_hospital_settings():
    """Get hospital configuration settings"""
    logger.info("Hospital settings requested")
    
    try:
        if settings_collection is not None:
            settings = settings_collection.find_one({}, {"_id": 0})
            if not settings:
                # Create default settings
                default_settings = {
                    "city": "Mumbai",
                    "latitude": 19.0760,
                    "longitude": 72.8777,
                    "aqi_threshold_high": 150,
                    "aqi_threshold_medium": 100,
                    "temperature_threshold_high": 32,
                    "temperature_threshold_low": 15,
                    "hospital_name": "SurgeSense Medical Center"
                }
                settings_collection.insert_one(default_settings)
                settings = default_settings
        else:
            # Fallback settings
            settings = {
                "city": "Mumbai",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "aqi_threshold_high": 150,
                "aqi_threshold_medium": 100,
                "temperature_threshold_high": 32,
                "temperature_threshold_low": 15,
                "hospital_name": "SurgeSense Medical Center"
            }
        
        return {
            "success": True,
            "settings": settings
        }
    except Exception as e:
        logger.error(f"Settings fetch error: {e}")
        return {
            "success": False,
            "message": "Unable to fetch hospital settings",
            "settings": {}
        }
