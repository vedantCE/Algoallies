# MongoDB Models for SurgeSense Hospital Management
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class StaffStatus(str, Enum):
    ON_DUTY = "on_duty"
    OFF_DUTY = "off_duty"
    BREAK = "break"

class StaffRole(str, Enum):
    DOCTOR = "doctor"
    NURSE = "nurse"
    SUPPORT_STAFF = "support_staff"
    SPECIALIST = "specialist"

class DecisionStatus(str, Enum):
    APPROVED = "approved"
    REVIEW = "review"
    DECLINED = "declined"
    PENDING = "pending"

class Staff(BaseModel):
    name: str
    role: StaffRole
    department: str
    status: StaffStatus
    shift: str = "day"
    contact: Optional[str] = None

class StaffRecommendation(BaseModel):
    role: str
    department: str
    recommended_count: int
    current_count: int
    reason: str
    priority: str = "medium"

class InventoryItem(BaseModel):
    name: str
    available_quantity: int
    ai_recommended_quantity: int
    status: DecisionStatus = DecisionStatus.PENDING
    last_updated: datetime = datetime.now()
    category: str = "general"
    unit: str = "units"

class DecisionLog(BaseModel):
    type: str  # "staff" or "inventory"
    item_name: str
    original_recommendation: str
    final_decision: DecisionStatus
    timestamp: datetime = datetime.now()
    reasoning: Optional[str] = None
    user_id: Optional[str] = None

class HospitalSettings(BaseModel):
    city: str = "Mumbai"
    latitude: float = 19.0760
    longitude: float = 72.8777
    aqi_threshold_high: int = 150
    aqi_threshold_medium: int = 100
    temperature_threshold_high: int = 32
    temperature_threshold_low: int = 15
    hospital_name: str = "SurgeSense Medical Center"
