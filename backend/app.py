from fastapi import FastAPI
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Import agents
from agents.citizen_agent import generate_citizen_response
from agents.hospital_agent import generate_hospital_response
from agents.landing_agent import generate_landing_response

load_dotenv()

app = FastAPI()

print("Backend running")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("CORS enabled")

# MongoDB Connection
try:
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI not found in environment variables")
    
    client = MongoClient(
        mongo_uri,
        connectTimeoutMS=20000,
        serverSelectionTimeoutMS=20000
    )
    
    # Test connection
    client.admin.command('ping')
    db = client["SurgeSense"]
    users = db["users"]
    
    print("Mongo connected successfully")
    
    # Seed users once
    if users.count_documents({}) == 0:
        users.insert_many([
            {"email": "citizen@test.com", "password": "1234", "role": "citizen"},
            {"email": "hospital@test.com", "password": "9999", "role": "hospital"},
        ])
        print("Users seeded")
        
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    # Create mock database for development
    users = None

# Pydantic Models
class CitizenAIModel(BaseModel):
    message: str

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

# API Endpoints
@app.post("/login")
def login(data: LoginModel):
    print("API route hit: /login")
    print("Request data:", data.dict())

    user = users.find_one({
        "email": data.email,
        "password": data.password
    })

    if not user:
        response = {"success": False, "message": "Invalid email or password"}
        print("Generated response:", response)
        return response

    response = {
        "success": True,
        "role": user["role"],
        "message": f"Successfully logged in as {user['role']}"
    }
    print("Generated response:", response)
    return response

@app.post("/signup")
def signup(data: SignupModel):
    print("API route hit: /signup")
    print("Request data:", data.dict())
    
    existing_user = users.find_one({"email": data.email})
    if existing_user:
        response = {"success": False, "message": "User already exists"}
        print("Generated response:", response)
        return response
    
    users.insert_one({
        "name": data.name,
        "email": data.email,
        "password": data.password,
        "role": "citizen"
    })
    
    response = {"success": True, "message": "User created successfully"}
    print("Generated response:", response)
    return response

@app.post("/citizen-response")
def citizen_response(data: CitizenAIModel):
    print("API route hit: /citizen-response")
    print("Request data:", data.dict())
    
    try:
        # Get live weather and AQI data
        from utils.weather_api import get_weather
        from utils.weather_aqi import get_air_quality, classify_aqi_us
        
        # Default coordinates (can be made dynamic)
        lat, lon = 19.0760, 72.8777  # Mumbai
        
        weather_data = get_weather(lat, lon)
        if not weather_data:
            weather_data = {
                "temperature": 25,
                "humidity": 60,
                "description": "moderate conditions"
            }
        
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
        
        response_text = generate_citizen_response(data.message, weather_data)
        response = {
            "success": True,
            "response": response_text,
            "weather": weather_data,
            "location": {"lat": lat, "lon": lon, "city": "Mumbai"}
        }
        print("Generated response:", {"success": True, "response_length": len(response_text)})
        return response
        
    except Exception as e:
        response = {
            "success": False,
            "message": "Health assistant temporarily unavailable"
        }
        print("Generated response:", response)
        return response

@app.post("/hospital-response")
def hospital_response(data: HospitalAIModel):
    print("API route hit: /hospital-response")
    print("Request data:", data.dict())
    
    try:
        response_text = generate_hospital_response(data.query)
        response = {
            "success": True,
            "response": response_text
        }
        print("Generated response:", {"success": True, "response_length": len(response_text)})
        return response
        
    except Exception as e:
        response = {
            "success": False,
            "message": "Hospital assistant temporarily unavailable"
        }
        print("Generated response:", response)
        return response

@app.post("/landing-response")
def landing_response(data: LandingAIModel):
    print("API route hit: /landing-response")
    print("Request data:", data.dict())
    
    try:
        content = data.content or "Welcome to HealthAI"
        response_text = generate_landing_response(content, 0, 0)
        response = {
            "success": True,
            "response": response_text
        }
        print("Generated response:", {"success": True, "response_length": len(response_text)})
        return response
        
    except Exception as e:
        response = {
            "success": False,
            "message": "Landing assistant temporarily unavailable"
        }
        print("Generated response:", response)
        return response

@app.get("/health-advisory")
def health_advisory():
    print("API route hit: /health-advisory")
    
    try:
        # Get live weather and AQI data
        from utils.weather_api import get_weather
        from utils.weather_aqi import get_air_quality, classify_aqi_us
        
        lat, lon = 19.0760, 72.8777  # Mumbai coordinates
        weather_data = get_weather(lat, lon)
        
        if weather_data:
            temp = weather_data.get('temperature', 25)
            humidity = weather_data.get('humidity', 60)
            description = weather_data.get('description', 'moderate')
            
            # Get AQI data
            try:
                aqi_data = get_air_quality(lat, lon)
                aqi_value = aqi_data.get('us_aqi') or aqi_data.get('european_aqi') or 50
                aqi_category = classify_aqi_us(aqi_value)
            except:
                aqi_value = 50
                aqi_category = 'Good'
            
            # Generate weather-specific recommendations
            foods = []
            fruits = []
            ayurvedic = []
            avoid = []
            
            if temp > 30:
                foods.extend(["Cucumber salad", "Watermelon juice", "Coconut water", "Mint lassi"])
                fruits.extend(["Watermelon", "Muskmelon", "Orange", "Grapes"])
                ayurvedic.extend(["Gulkand (rose petal jam)", "Fennel seeds water", "Aloe vera juice"])
                avoid.extend(["Spicy food", "Hot beverages", "Heavy meals", "Alcohol"])
            elif temp < 15:
                foods.extend(["Ginger tea", "Hot soup", "Warm milk with turmeric", "Oats porridge"])
                fruits.extend(["Apple", "Pomegranate", "Dates", "Dry fruits"])
                ayurvedic.extend(["Chyawanprash", "Ginger honey mix", "Tulsi tea"])
                avoid.extend(["Cold drinks", "Ice cream", "Raw salads", "Frozen foods"])
            else:
                foods.extend(["Mixed vegetable curry", "Brown rice", "Dal", "Green tea"])
                fruits.extend(["Apple", "Banana", "Papaya", "Guava"])
                ayurvedic.extend(["Triphala powder", "Amla juice", "Ashwagandha"])
                avoid.extend(["Processed foods", "Excessive sugar", "Fried items"])
            
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
        else:
            foods = ["Balanced meals", "Fresh vegetables", "Whole grains"]
            fruits = ["Seasonal fruits", "Apple", "Banana"]
            ayurvedic = ["Turmeric milk", "Ginger tea"]
            avoid = ["Processed foods", "Excessive sugar"]
            weather_alert = "📍 Location: Weather service temporarily unavailable"
    
    except Exception as e:
        foods = ["Balanced meals", "Fresh vegetables", "Whole grains"]
        fruits = ["Seasonal fruits", "Apple", "Banana"]
        ayurvedic = ["Turmeric milk", "Ginger tea"]
        avoid = ["Processed foods", "Excessive sugar"]
        weather_alert = "📍 Location: Weather service temporarily unavailable"
    
    response = {
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
    print("Generated response:", response)
    return response

@app.get("/nearby-hospitals")
def nearby_hospitals():
    print("API route hit: /nearby-hospitals")
    
    try:
        from utils.overpass_api import find_medical_places
        lat, lon = 19.0760, 72.8777  # Mumbai coordinates
        
        medical_places = find_medical_places(lat, lon)
        
        response = {
            "success": True,
            "places": medical_places,
            "location": {"lat": lat, "lon": lon, "city": "Mumbai"}
        }
        print("Generated response:", {"success": True, "places_count": len(medical_places)})
        return response
        
    except Exception as e:
        response = {
            "success": False,
            "message": "Unable to fetch nearby hospitals",
            "places": []
        }
        print("Generated response:", response)
        return response