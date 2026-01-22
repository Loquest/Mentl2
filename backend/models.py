from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    conditions: List[str] = []  # ["bipolar", "adhd", "depression"]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    conditions: List[str] = []
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUpdate(BaseModel):
    name: Optional[str] = None
    conditions: Optional[List[str]] = None
    preferences: Optional[Dict[str, Any]] = None

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