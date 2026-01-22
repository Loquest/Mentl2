from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from statistics import mean

# Local imports
from models import (
    User, UserCreate, UserLogin, UserUpdate, Token,
    MoodLog, MoodLogCreate, MoodLogUpdate, MoodAnalytics,
    ChatRequest, ChatResponse, ChatMessage,
    Content
)
from auth import (
    get_password_hash, verify_password, create_access_token, get_current_user_id
)
from database import (
    users_collection, mood_logs_collection, chat_history_collection, content_collection,
    close_db_connection
)

# AI Chat Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="Mental Health Companion API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============= AUTHENTICATION ROUTES =============

@api_router.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        name=user_data.name,
        conditions=user_data.conditions,
        preferences={}
    )
    
    # Hash password and store
    user_dict = user.model_dump()
    user_dict['password_hash'] = get_password_hash(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await users_collection.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, user=user)


@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user and return JWT token"""
    # Find user
    user_doc = await users_collection.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create user object (exclude password_hash)
    user_doc.pop('password_hash', None)
    user_doc.pop('_id', None)
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    user = User(**user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, user=user)


@api_router.get("/auth/me", response_model=User)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """Get current user profile"""
    user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)


@api_router.put("/auth/profile", response_model=User)
async def update_profile(
    update_data: UserUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update user profile"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    result = await users_collection.update_one(
        {"id": user_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Return updated user
    user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)


# ============= MOOD LOGGING ROUTES =============

@api_router.post("/mood-logs", response_model=MoodLog, status_code=status.HTTP_201_CREATED)
async def create_mood_log(
    log_data: MoodLogCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new mood log entry"""
    # Check if log already exists for this date
    existing_log = await mood_logs_collection.find_one({
        "user_id": user_id,
        "date": log_data.date
    })
    
    if existing_log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mood log already exists for this date. Use PUT to update."
        )
    
    mood_log = MoodLog(
        user_id=user_id,
        **log_data.model_dump()
    )
    
    log_dict = mood_log.model_dump()
    log_dict['timestamp'] = log_dict['timestamp'].isoformat()
    
    await mood_logs_collection.insert_one(log_dict)
    
    return mood_log


@api_router.get("/mood-logs", response_model=List[MoodLog])
async def get_mood_logs(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    user_id: str = Depends(get_current_user_id)
):
    """Get user's mood logs with optional date range filter"""
    query = {"user_id": user_id}
    
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["date"] = date_filter
    
    logs = await mood_logs_collection.find(query, {"_id": 0}).sort("date", -1).limit(limit).to_list(limit)
    
    # Convert ISO strings back to datetime
    for log in logs:
        if isinstance(log.get('timestamp'), str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return [MoodLog(**log) for log in logs]


@api_router.get("/mood-logs/{log_id}", response_model=MoodLog)
async def get_mood_log(
    log_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific mood log"""
    log = await mood_logs_collection.find_one(
        {"id": log_id, "user_id": user_id},
        {"_id": 0}
    )
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mood log not found"
        )
    
    if isinstance(log.get('timestamp'), str):
        log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return MoodLog(**log)


@api_router.put("/mood-logs/{log_id}", response_model=MoodLog)
async def update_mood_log(
    log_id: str,
    update_data: MoodLogUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a mood log entry"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    result = await mood_logs_collection.update_one(
        {"id": log_id, "user_id": user_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mood log not found"
        )
    
    # Return updated log
    log = await mood_logs_collection.find_one({"id": log_id}, {"_id": 0})
    if isinstance(log.get('timestamp'), str):
        log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return MoodLog(**log)


@api_router.delete("/mood-logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mood_log(
    log_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a mood log entry"""
    result = await mood_logs_collection.delete_one({"id": log_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mood log not found"
        )
    
    return None


@api_router.get("/mood-logs/analytics/summary", response_model=MoodAnalytics)
async def get_mood_analytics(
    days: int = 30,
    user_id: str = Depends(get_current_user_id)
):
    """Get mood analytics and insights"""
    # Get logs from last N days
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    logs = await mood_logs_collection.find({
        "user_id": user_id,
        "date": {"$gte": start_date}
    }, {"_id": 0}).to_list(1000)
    
    if not logs:
        return MoodAnalytics(
            average_mood=0.0,
            total_logs=0,
            mood_trend="stable",
            most_common_symptoms=[],
            insights=["Start logging your mood to see insights!"]
        )
    
    # Calculate average mood
    mood_ratings = [log['mood_rating'] for log in logs]
    avg_mood = mean(mood_ratings)
    
    # Determine mood trend (simple: compare first half vs second half)
    half = len(mood_ratings) // 2
    if half > 0:
        first_half_avg = mean(mood_ratings[:half])
        second_half_avg = mean(mood_ratings[half:])
        if second_half_avg > first_half_avg + 0.5:
            trend = "improving"
        elif second_half_avg < first_half_avg - 0.5:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"
    
    # Get most common symptoms
    symptom_counts = {}
    for log in logs:
        for symptom, value in log.get('symptoms', {}).items():
            if value:  # If symptom is present/true
                symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
    
    most_common = sorted(
        [{"symptom": k, "count": v} for k, v in symptom_counts.items()],
        key=lambda x: x['count'],
        reverse=True
    )[:5]
    
    # Generate insights
    insights = []
    if avg_mood < 5:
        insights.append("Your average mood has been below 5. Consider reaching out to a mental health professional.")
    elif avg_mood >= 7:
        insights.append("Great job! Your mood has been generally positive.")
    
    if trend == "declining":
        insights.append("Your mood shows a declining trend. This might be a good time to use extra coping strategies.")
    elif trend == "improving":
        insights.append("Your mood is improving! Keep up the good work with your self-care routine.")
    
    # Check for medication consistency
    medication_logs = [log for log in logs if log.get('medication_taken')]
    if len(medication_logs) > 0:
        medication_rate = len(medication_logs) / len(logs)
        if medication_rate < 0.7:
            insights.append(f"Medication adherence: {int(medication_rate * 100)}%. Try setting reminders to maintain consistency.")
    
    return MoodAnalytics(
        average_mood=round(avg_mood, 1),
        total_logs=len(logs),
        mood_trend=trend,
        most_common_symptoms=most_common,
        insights=insights
    )


# ============= AI CHAT ROUTES =============

MENTAL_HEALTH_SYSTEM_PROMPT = """You are a compassionate AI mental health companion assistant. Your role is to:

1. Provide empathetic, supportive responses to users with Bipolar Disorder, ADHD, and Depression
2. Offer evidence-based coping strategies (CBT, mindfulness, breathing exercises)
3. Help users understand their emotions and thought patterns
4. Encourage positive behaviors and self-care
5. Never diagnose or prescribe medication - always encourage professional help when needed

IMPORTANT BOUNDARIES:
- You are NOT a replacement for professional therapy or medical care
- If you detect crisis language (suicidal ideation, self-harm), immediately provide crisis resources
- Be warm, non-judgmental, and validating
- Use simple, clear language
- Respect the user's autonomy

CRISIS RESOURCES:
- 988 Suicide & Crisis Lifeline: Call or text 988 (available 24/7)
- Crisis Text Line: Text HOME to 741741
- NAMI Helpline: 1-800-950-NAMI (6264)

When responding:
- Validate feelings first
- Offer practical, actionable suggestions
- Check in on user's safety if concerned
- Encourage professional help for serious issues
- Maintain a supportive, hopeful tone"""


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Chat with AI assistant"""
    try:
        # Get user info for context
        user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get recent mood logs for context
        recent_logs = await mood_logs_collection.find(
            {"user_id": user_id}
        ).sort("date", -1).limit(5).to_list(5)
        
        # Build context
        context = f"\n\nUSER CONTEXT:\n"
        context += f"User conditions: {', '.join(user_doc.get('conditions', []))}\n"
        
        if recent_logs:
            context += f"Recent mood history (last 5 entries):\n"
            for log in recent_logs:
                mood = log.get('mood_rating', 'N/A')
                date = log.get('date', 'N/A')
                notes = log.get('notes', '')
                context += f"- {date}: Mood {mood}/10"
                if notes:
                    context += f" - {notes[:100]}"
                context += "\n"
        else:
            context += "No mood logs yet.\n"
        
        # Check for crisis keywords
        crisis_keywords = ["suicide", "kill myself", "end it all", "want to die", "self-harm", "hurt myself"]
        is_crisis = any(keyword in request.message.lower() for keyword in crisis_keywords)
        
        if is_crisis:
            crisis_response = """I'm really concerned about what you're sharing with me. Your safety is the most important thing right now.

🆘 **Please reach out for immediate help:**

• **988 Suicide & Crisis Lifeline**: Call or text 988 (available 24/7)
• **Crisis Text Line**: Text HOME to 741741
• **Emergency**: Call 911 if you're in immediate danger

You deserve support, and there are people who want to help you through this. These feelings can be overwhelming, but they are temporary, and help is available.

Would you like to talk about what's been making you feel this way? I'm here to listen, but please do reach out to a crisis counselor who can provide the immediate support you need."""
            
            return ChatResponse(response=crisis_response)
        
        # Initialize AI chat
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"user_{user_id}",
            system_message=MENTAL_HEALTH_SYSTEM_PROMPT + context
        ).with_model("openai", "gpt-5.2")
        
        # Send message and get response
        user_message = UserMessage(text=request.message)
        ai_response = await chat.send_message(user_message)
        
        # Save chat history
        chat_msg_user = ChatMessage(role="user", content=request.message)
        chat_msg_assistant = ChatMessage(role="assistant", content=ai_response)
        
        # Get or create chat history
        chat_history = await chat_history_collection.find_one({"user_id": user_id})
        
        if chat_history:
            # Append to existing history
            messages = chat_history.get('messages', [])
            messages.append(chat_msg_user.model_dump())
            messages.append(chat_msg_assistant.model_dump())
            
            # Keep only last 50 messages
            if len(messages) > 50:
                messages = messages[-50:]
            
            await chat_history_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "messages": messages,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        else:
            # Create new chat history
            from models import ChatHistory
            new_history = ChatHistory(
                user_id=user_id,
                messages=[chat_msg_user, chat_msg_assistant]
            )
            history_dict = new_history.model_dump()
            history_dict['created_at'] = history_dict['created_at'].isoformat()
            history_dict['updated_at'] = history_dict['updated_at'].isoformat()
            
            await chat_history_collection.insert_one(history_dict)
        
        return ChatResponse(response=ai_response)
        
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process chat request"
        )


@api_router.get("/chat/history")
async def get_chat_history(
    limit: int = 20,
    user_id: str = Depends(get_current_user_id)
):
    """Get chat history for the user"""
    chat_history = await chat_history_collection.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not chat_history:
        return {"messages": []}
    
    messages = chat_history.get('messages', [])
    
    # Return last N messages
    return {"messages": messages[-limit:]}


@api_router.delete("/chat/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_chat_history(user_id: str = Depends(get_current_user_id)):
    """Clear chat history"""
    await chat_history_collection.delete_one({"user_id": user_id})
    return None


# ============= EDUCATIONAL CONTENT ROUTES =============

@api_router.get("/content", response_model=List[Content])
async def get_content(
    category: Optional[str] = None,
    content_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    """Get educational content with optional filters"""
    query = {}
    
    if category:
        query["category"] = category
    
    if content_type:
        query["content_type"] = content_type
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search.lower()]}}
        ]
    
    content_items = await content_collection.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    # Convert ISO strings back to datetime
    for item in content_items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    
    return [Content(**item) for item in content_items]


@api_router.get("/content/{content_id}", response_model=Content)
async def get_content_item(content_id: str):
    """Get a specific content item"""
    content = await content_collection.find_one({"id": content_id}, {"_id": 0})
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    if isinstance(content.get('created_at'), str):
        content['created_at'] = datetime.fromisoformat(content['created_at'])
    
    return Content(**content)


# Health check route
@api_router.get("/")
async def root():
    return {"message": "Mental Health Companion API", "status": "healthy"}


# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_event():
    await close_db_connection()
