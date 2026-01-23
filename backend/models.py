from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    conditions: List[str] = []  # ["bipolar", "adhd", "depression"]
    age: Optional[int] = None
    weight: Optional[float] = None  # in kg
    height: Optional[float] = None  # in cm

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    conditions: List[str] = []
    age: Optional[int] = None
    weight: Optional[float] = None  # in kg
    height: Optional[float] = None  # in cm
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUpdate(BaseModel):
    name: Optional[str] = None
    conditions: Optional[List[str]] = None
    age: Optional[int] = Field(None, ge=1, le=120)
    weight: Optional[float] = Field(None, gt=0, le=500)  # kg
    height: Optional[float] = Field(None, gt=0, le=300)  # cm
    preferences: Optional[Dict[str, Any]] = None


# Dietary Preferences Model
class DietaryPreferences(BaseModel):
    diet_type: Optional[str] = None  # "omnivore", "vegetarian", "vegan", "pescatarian", "keto", "paleo"
    allergies: List[str] = []  # ["nuts", "dairy", "gluten", "shellfish", "eggs", "soy"]
    intolerances: List[str] = []  # ["lactose", "gluten", "fructose"]
    cultural_preferences: Optional[str] = None  # "mediterranean", "asian", "indian", "mexican", "middle_eastern"
    avoid_foods: List[str] = []  # Specific foods to avoid
    preferred_cuisines: List[str] = []  # Preferred cuisine types
    meal_prep_time: Optional[str] = "moderate"  # "quick" (<15min), "moderate" (15-30min), "elaborate" (30min+)
    budget_preference: Optional[str] = "moderate"  # "budget", "moderate", "premium"


class DietaryPreferencesUpdate(BaseModel):
    diet_type: Optional[str] = None
    allergies: Optional[List[str]] = None
    intolerances: Optional[List[str]] = None
    cultural_preferences: Optional[str] = None
    avoid_foods: Optional[List[str]] = None
    preferred_cuisines: Optional[List[str]] = None
    meal_prep_time: Optional[str] = None
    budget_preference: Optional[str] = None


# Dietary Suggestion Request
class DietarySuggestionRequest(BaseModel):
    suggestion_type: str = "quick_snack"  # "quick_snack", "recipe", "meal_plan"
    current_mood: Optional[int] = None  # 1-10
    current_energy: Optional[str] = None  # "very_low", "low", "moderate", "high", "very_high"
    current_symptoms: Optional[List[str]] = []  # ["anxious", "agitated", "low_energy", "brain_fog"]
    time_of_day: Optional[str] = None  # "morning", "midday", "afternoon", "evening", "night"


# Dietary Suggestion Response
class DietarySuggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    suggestion_type: str
    title: str
    description: str
    reasoning: str  # Why this is recommended for their condition/mood
    ingredients: List[str] = []
    preparation_steps: List[str] = []
    prep_time: Optional[str] = None
    nutritional_highlights: List[str] = []  # ["High in Omega-3", "Rich in Magnesium"]
    mood_benefits: List[str] = []  # ["Supports serotonin production", "Stabilizes blood sugar"]
    image_url: Optional[str] = None
    alternatives: List[str] = []  # Alternative suggestions if user doesn't like this one

# Mood Log Models
class MoodLogCreate(BaseModel):
    date: str  # YYYY-MM-DD format
    mood_rating: int = Field(ge=1, le=10)  # 1-10 scale
    mood_tag: Optional[str] = None  # "anxious", "energetic", "low", etc.
    symptoms: Dict[str, Any] = Field(default_factory=dict)  # Flexible symptom tracking
    notes: Optional[str] = None
    medication_taken: bool = False
    sleep_hours: Optional[float] = None

class MoodLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str
    mood_rating: int
    mood_tag: Optional[str] = None
    symptoms: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None
    medication_taken: bool = False
    sleep_hours: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MoodLogUpdate(BaseModel):
    mood_rating: Optional[int] = Field(None, ge=1, le=10)
    mood_tag: Optional[str] = None
    symptoms: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    medication_taken: Optional[bool] = None
    sleep_hours: Optional[float] = None

# Analytics Models
class MoodAnalytics(BaseModel):
    average_mood: float
    total_logs: int
    mood_trend: str  # "improving", "declining", "stable"
    most_common_symptoms: List[Dict[str, Any]]
    insights: List[str]

# Chat Models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    crisis_detected: bool = False
    crisis_level: Optional[str] = None  # "critical", "high", "moderate"

class ChatHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Content Models
class Content(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content_type: str  # "article", "video", "audio", "exercise"
    category: str  # "bipolar", "adhd", "depression", "general", "coping", "caregivers"
    description: str
    content_url: Optional[str] = None  # External link or internal content
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


# Caregiver Models
class CaregiverInvitation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str  # User who sent the invitation
    patient_name: str
    patient_email: str
    caregiver_email: str  # Email of the caregiver being invited
    status: str = "pending"  # "pending", "accepted", "rejected", "expired"
    permissions: Dict[str, bool] = Field(default_factory=lambda: {
        "view_mood_logs": True,
        "view_analytics": True,
        "receive_alerts": True
    })
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))


class CaregiverInvitationCreate(BaseModel):
    caregiver_email: EmailStr
    permissions: Optional[Dict[str, bool]] = None


class CaregiverRelationship(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    patient_name: str
    patient_email: str
    caregiver_id: str
    caregiver_name: str
    caregiver_email: str
    permissions: Dict[str, bool] = Field(default_factory=lambda: {
        "view_mood_logs": True,
        "view_analytics": True,
        "receive_alerts": True
    })
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CaregiverPermissionUpdate(BaseModel):
    permissions: Dict[str, bool]


# Notification Models
class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Recipient of the notification
    notification_type: str  # "invitation", "alert", "mood_concern", "missed_logs"
    title: str
    message: str
    related_user_id: Optional[str] = None  # Patient ID for caregiver alerts
    related_user_name: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Push Notification Models
class PushSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    endpoint: str
    keys: Dict[str, str]  # {"p256dh": "...", "auth": "..."}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    keys: Dict[str, str]


# Notification Preferences
class NotificationPreferences(BaseModel):
    email_crisis_alerts: bool = True
    email_mood_reminders: bool = False
    email_weekly_summary: bool = True
    push_enabled: bool = True
    push_crisis_alerts: bool = True
    push_mood_reminders: bool = True
    push_caregiver_updates: bool = True


class NotificationPreferencesUpdate(BaseModel):
    email_crisis_alerts: Optional[bool] = None
    email_mood_reminders: Optional[bool] = None
    email_weekly_summary: Optional[bool] = None
    push_enabled: Optional[bool] = None
    push_crisis_alerts: Optional[bool] = None
    push_mood_reminders: Optional[bool] = None
    push_caregiver_updates: Optional[bool] = None