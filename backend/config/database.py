# Database configuration and connection management
import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Mock data for fallback when MongoDB is unavailable
MOCK_USERS = [
    {"email": "citizen@test.com", "password": "1234", "role": "citizen"},
    {"email": "hospital@test.com", "password": "9999", "role": "hospital"},
]

MOCK_STAFF = [
    {"name": "Dr. Pooja Lingayat", "role": "doctor", "department": "Emergency", "status": "on_duty", "shift": "day"},
    {"name": "Dr. Khushi Bhatt", "role": "doctor", "department": "Surgery", "status": "on_duty", "shift": "day"},
    {"name": "Nurse Niru Patel", "role": "nurse", "department": "ICU", "status": "on_duty", "shift": "day"},
    {"name": "Dr. Hriday Desai", "role": "specialist", "department": "Cardiology", "status": "off_duty", "shift": "night"},
    {"name": "Nurse Lalita", "role": "nurse", "department": "ICU", "status": "off_duty", "shift": "night"},
]

MOCK_INVENTORY = [
    {"name": "N95 Masks", "available_quantity": 500, "ai_recommended_quantity": 750, "status": "pending", "category": "PPE", "unit": "pieces"},
    {"name": "Inhalers", "available_quantity": 45, "ai_recommended_quantity": 80, "status": "pending", "category": "Medicine", "unit": "units"},
    {"name": "Paracetamol", "available_quantity": 200, "ai_recommended_quantity": 300, "status": "pending", "category": "Medicine", "unit": "tablets"},
    {"name": "IV Fluids", "available_quantity": 120, "ai_recommended_quantity": 150, "status": "pending", "category": "Medical Supplies", "unit": "bags"},
    {"name": "Oxygen Cylinders", "available_quantity": 25, "ai_recommended_quantity": 40, "status": "pending", "category": "Equipment", "unit": "cylinders"},
]

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.collections = {}
        self._connect()
    
    def _connect(self):
        """Initialize MongoDB connection with fallback to mock data"""
        try:
            mongo_uri = os.getenv("MONGO_URI")
            if not mongo_uri:
                raise ValueError("MONGO_URI not found in environment variables")
            
            self.client = MongoClient(
                mongo_uri,
                connectTimeoutMS=5000,
                serverSelectionTimeoutMS=5000
            )
            
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client["SurgeSense"]
            
            # Initialize collections
            self.collections = {
                "users": self.db["users"],
                "staff": self.db["staff"],
                "inventory": self.db["inventory"],
                "decision_log": self.db["decision_log"],
                "settings": self.db["settings"]
            }
            
            logger.info("MongoDB connected successfully")
            self._seed_data()
            
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}. Using in-memory fallback.")
            self.client = None
            self.db = None
            self.collections = {}
    
    def _seed_data(self):
        """Seed initial data if collections are empty"""
        if self.collections["users"].count_documents({}) == 0:
            self.collections["users"].insert_many(MOCK_USERS)
            logger.info("Users seeded to MongoDB")
        
        if self.collections["staff"].count_documents({}) == 0:
            self.collections["staff"].insert_many(MOCK_STAFF)
            logger.info("Staff seeded to MongoDB")
        
        if self.collections["inventory"].count_documents({}) == 0:
            self.collections["inventory"].insert_many(MOCK_INVENTORY)
            logger.info("Inventory seeded to MongoDB")
    
    def get_collection(self, name: str):
        """Get collection or return None for fallback handling"""
        return self.collections.get(name)
    
    def is_connected(self) -> bool:
        """Check if MongoDB is connected"""
        return self.client is not None

# Global database instance
db_manager = DatabaseManager()