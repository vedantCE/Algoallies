# Authentication routes - login and signup endpoints
from fastapi import APIRouter
from pydantic import BaseModel
import logging
from config.database import db_manager, MOCK_USERS
from utils.security import hash_password, verify_password, is_hashed

logger = logging.getLogger(__name__)
router = APIRouter()

class LoginModel(BaseModel):
    email: str
    password: str

class SignupModel(BaseModel):
    name: str
    email: str
    password: str

@router.post("/login")
def login(data: LoginModel):
    """User authentication endpoint"""
    logger.info(f"Login attempt for: {data.email}")
    
    try:
        users_collection = db_manager.get_collection("users")
        
        if users_collection is not None:
            user = users_collection.find_one({"email": data.email})
        else:
            # Fallback to mock users
            user = next((u for u in MOCK_USERS if u["email"] == data.email), None)
        
        if not user or not verify_password(data.password, user.get("password")):
            return {"success": False, "message": "Invalid email or password"}
        
        # Upgrade legacy plain-text passwords to a bcrypt hash on successful login
        if not is_hashed(user.get("password")):
            new_hash = hash_password(data.password)
            if users_collection is not None:
                users_collection.update_one({"_id": user["_id"]}, {"$set": {"password": new_hash}})
            else:
                user["password"] = new_hash
        
        return {
            "success": True,
            "role": user["role"],
            "message": f"Successfully logged in as {user['role']}"
        }
    except Exception as e:
        logger.error(f"Login error: {e}")
        return {"success": False, "message": "Login service temporarily unavailable"}

@router.post("/signup")
def signup(data: SignupModel):
    """User registration endpoint"""
    logger.info(f"Signup attempt for: {data.email}")
    
    try:
        new_user = {
            "name": data.name,
            "email": data.email,
            "password": hash_password(data.password),
            "role": "citizen"
        }
        
        users_collection = db_manager.get_collection("users")
        
        if users_collection is not None:
            existing_user = users_collection.find_one({"email": data.email})
            if existing_user:
                return {"success": False, "message": "User already exists"}
            users_collection.insert_one(new_user)
        else:
            # Fallback to mock users
            if any(u["email"] == data.email for u in MOCK_USERS):
                return {"success": False, "message": "User already exists"}
            MOCK_USERS.append(new_user)
        
        return {"success": True, "message": "User created successfully"}
    except Exception as e:
        logger.error(f"Signup error: {e}")
        return {"success": False, "message": "Signup service temporarily unavailable"}