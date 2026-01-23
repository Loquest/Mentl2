from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import asyncio
import json
import re
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from statistics import mean
import resend

# Local imports
from models import (
    User, UserCreate, UserLogin, UserUpdate, Token,
    MoodLog, MoodLogCreate, MoodLogUpdate, MoodAnalytics,
    ChatRequest, ChatResponse, ChatMessage,
    Content,
    CaregiverInvitation, CaregiverInvitationCreate, CaregiverRelationship,
    CaregiverPermissionUpdate, Notification,
    DietaryPreferences, DietaryPreferencesUpdate, DietarySuggestionRequest, DietarySuggestion,
    PushSubscription, PushSubscriptionCreate, NotificationPreferences, NotificationPreferencesUpdate
)
from auth import (
    get_password_hash, verify_password, create_access_token, get_current_user_id
)
from database import (
    users_collection, mood_logs_collection, chat_history_collection, content_collection,
    caregiver_invitations_collection, caregiver_relationships_collection, notifications_collection,
    push_subscriptions_collection,
    close_db_connection
)

# AI Chat Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Resend
resend.api_key = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "onboarding@resend.dev")

# Create the main app
app = FastAPI(title="Mental Health Companion API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Helper function for caregiver crisis alerts
async def send_caregiver_crisis_alert(user_id: str, user_name: str, crisis_level: str, message_snippet: str):
    """Send crisis alerts to all caregivers of a user via in-app, email, and push"""
    try:
        # Find all caregivers who have alert permissions
        relationships = await caregiver_relationships_collection.find({
            "patient_id": user_id,
            "permissions.receive_alerts": True
        }).to_list(100)
        
        for rel in relationships:
            caregiver_id = rel['caregiver_id']
            caregiver_email = rel.get('caregiver_email')
            
            # Get caregiver's notification preferences
            caregiver_doc = await users_collection.find_one({"id": caregiver_id})
            notif_prefs = caregiver_doc.get('notification_preferences', {}) if caregiver_doc else {}
            
            # Create in-app notification for each caregiver
            notification = Notification(
                user_id=caregiver_id,
                notification_type="crisis_alert",
                title=f"⚠️ Crisis Alert: {user_name}",
                message=f"{user_name} may be in distress. Crisis level: {crisis_level.upper()}. Please check in on them.",
                related_user_id=user_id,
                related_user_name=user_name
            )
            notification_dict = notification.model_dump()
            notification_dict['created_at'] = notification_dict['created_at'].isoformat()
            notification_dict['crisis_level'] = crisis_level
            notification_dict['message_snippet'] = message_snippet[:100] if message_snippet else ""
            
            await notifications_collection.insert_one(notification_dict)
            
            # Send email notification if enabled
            if caregiver_email and notif_prefs.get('email_crisis_alerts', True):
                await send_crisis_email(
                    caregiver_email=caregiver_email,
                    caregiver_name=rel.get('caregiver_name', 'Caregiver'),
                    patient_name=user_name,
                    crisis_level=crisis_level
                )
            
            # Send push notification if enabled
            if notif_prefs.get('push_crisis_alerts', True):
                await send_push_notification(
                    user_id=caregiver_id,
                    title=f"🚨 Crisis Alert: {user_name}",
                    body=f"{user_name} may need your support. Crisis level: {crisis_level.upper()}",
                    data={"type": "crisis_alert", "patient_id": user_id}
                )
            
        logging.info(f"Crisis alert sent to {len(relationships)} caregivers for user {user_id}")
    except Exception as e:
        logging.error(f"Error sending caregiver crisis alert: {e}")


async def send_crisis_email(caregiver_email: str, caregiver_name: str, patient_name: str, crisis_level: str):
    """Send crisis alert email to caregiver"""
    try:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Crisis Alert</h1>
            </div>
            <div style="background: #fef2f2; padding: 20px; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="color: #1f2937; font-size: 16px;">Hi {caregiver_name},</p>
                <p style="color: #1f2937; font-size: 16px;">
                    <strong>{patient_name}</strong> may be experiencing distress and could use your support.
                </p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #7f1d1d; font-weight: bold;">Crisis Level: {crisis_level.upper()}</p>
                </div>
                <p style="color: #1f2937; font-size: 16px;">
                    Please consider reaching out to check in on them. Your support can make a real difference.
                </p>
                <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0 0 10px 0; color: #7f1d1d; font-weight: bold;">Emergency Resources:</p>
                    <p style="margin: 5px 0; color: #7f1d1d;">📞 988 Suicide & Crisis Lifeline</p>
                    <p style="margin: 5px 0; color: #7f1d1d;">💬 Text HOME to 741741</p>
                    <p style="margin: 5px 0; color: #7f1d1d;">🚑 911 for immediate danger</p>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    — The Mentl Team
                </p>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [caregiver_email],
            "subject": f"🚨 Crisis Alert: {patient_name} needs support",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Crisis email sent to {caregiver_email}")
    except Exception as e:
        logging.error(f"Failed to send crisis email: {e}")


async def send_push_notification(user_id: str, title: str, body: str, data: dict = None):
    """Send push notification to user's subscribed devices"""
    try:
        subscriptions = await push_subscriptions_collection.find({"user_id": user_id}).to_list(10)
        
        for sub in subscriptions:
            # In production, use web-push library
            # For now, we store the notification intent
            logging.info(f"Push notification queued for user {user_id}: {title}")
    except Exception as e:
        logging.error(f"Failed to send push notification: {e}")


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


# ============= DIETARY PREFERENCES ROUTES =============

@api_router.get("/users/me/dietary-preferences")
async def get_dietary_preferences(user_id: str = Depends(get_current_user_id)):
    """Get user's dietary preferences"""
    user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    dietary_prefs = user_doc.get('dietary_preferences', {})
    return {"dietary_preferences": dietary_prefs, "is_configured": bool(dietary_prefs)}


@api_router.put("/users/me/dietary-preferences")
async def update_dietary_preferences(
    prefs: DietaryPreferencesUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update user's dietary preferences"""
    update_data = {k: v for k, v in prefs.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # Merge with existing preferences
    user_doc = await users_collection.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_prefs = user_doc.get('dietary_preferences', {})
    existing_prefs.update(update_data)
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"dietary_preferences": existing_prefs}}
    )
    
    return {"message": "Dietary preferences updated", "dietary_preferences": existing_prefs}


@api_router.post("/dietary/suggestions")
async def get_dietary_suggestions(
    request: DietarySuggestionRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Get AI-powered dietary suggestions based on mood, condition, and preferences"""
    try:
        # Get user info
        user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        conditions = user_doc.get('conditions', [])
        dietary_prefs = user_doc.get('dietary_preferences', {})
        
        # Get recent mood data for context
        recent_logs = await mood_logs_collection.find(
            {"user_id": user_id}
        ).sort("date", -1).limit(3).to_list(3)
        
        # Determine time of day if not provided
        time_of_day = request.time_of_day
        if not time_of_day:
            hour = datetime.now().hour
            if 5 <= hour < 11:
                time_of_day = "morning"
            elif 11 <= hour < 14:
                time_of_day = "midday"
            elif 14 <= hour < 17:
                time_of_day = "afternoon"
            elif 17 <= hour < 21:
                time_of_day = "evening"
            else:
                time_of_day = "night"
        
        # Build context for AI
        context = build_dietary_context(
            conditions=conditions,
            dietary_prefs=dietary_prefs,
            recent_logs=recent_logs,
            request=request,
            time_of_day=time_of_day
        )
        
        # Generate AI suggestion
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"dietary_{user_id}_{datetime.now().strftime('%Y%m%d%H%M')}",
            system_message=DIETARY_SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=context)
        ai_response = await chat.send_message(user_message)
        
        # Parse AI response
        suggestion = parse_dietary_response(ai_response, request.suggestion_type)
        
        return {"suggestion": suggestion, "context": {
            "time_of_day": time_of_day,
            "conditions": conditions,
            "current_mood": request.current_mood,
            "current_energy": request.current_energy
        }}
        
    except Exception as e:
        logger.error(f"Error generating dietary suggestion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating suggestion: {str(e)}")


def build_dietary_context(conditions, dietary_prefs, recent_logs, request, time_of_day):
    """Build context string for AI dietary suggestion"""
    context = f"""Generate a {request.suggestion_type.replace('_', ' ')} recommendation.

USER PROFILE:
- Mental Health Conditions: {', '.join(conditions) if conditions else 'None specified'}
- Time of Day: {time_of_day}
- Current Mood Rating: {request.current_mood or 'Not specified'}/10
- Current Energy Level: {request.current_energy or 'Not specified'}
- Current Symptoms: {', '.join(request.current_symptoms) if request.current_symptoms else 'None specified'}

DIETARY PREFERENCES:
- Diet Type: {dietary_prefs.get('diet_type', 'No restriction')}
- Allergies: {', '.join(dietary_prefs.get('allergies', [])) or 'None'}
- Intolerances: {', '.join(dietary_prefs.get('intolerances', [])) or 'None'}
- Foods to Avoid: {', '.join(dietary_prefs.get('avoid_foods', [])) or 'None'}
- Cultural Preference: {dietary_prefs.get('cultural_preferences', 'None specified')}
- Preferred Cuisines: {', '.join(dietary_prefs.get('preferred_cuisines', [])) or 'Any'}
- Prep Time Preference: {dietary_prefs.get('meal_prep_time', 'moderate')}
- Budget: {dietary_prefs.get('budget_preference', 'moderate')}

RECENT MOOD HISTORY:
"""
    for log in recent_logs:
        context += f"- {log.get('date')}: Mood {log.get('mood_rating')}/10, Energy: {log.get('energy', 'N/A')}, Sleep: {log.get('sleep_hours', 'N/A')}h\n"
    
    context += f"""
SUGGESTION TYPE: {request.suggestion_type}
- quick_snack: Simple, ready-to-eat or minimal prep snack
- recipe: A complete dish with full recipe
- meal_plan: Structured meals for the day

Please respond in the following JSON format:
{{
    "title": "Name of the food/recipe/plan",
    "description": "Brief appetizing description",
    "reasoning": "Why this is specifically good for their condition and current state",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "preparation_steps": ["step 1", "step 2"],
    "prep_time": "X minutes",
    "nutritional_highlights": ["High in Omega-3", "Rich in B-vitamins"],
    "mood_benefits": ["Supports dopamine production", "Stabilizes blood sugar"],
    "alternatives": ["Alternative option 1", "Alternative option 2"]
}}
"""
    return context


def parse_dietary_response(response: str, suggestion_type: str) -> dict:
    """Parse AI response into structured suggestion"""
    try:
        # Try to extract JSON from response
        import re
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            suggestion_data = json.loads(json_match.group())
            suggestion = DietarySuggestion(
                suggestion_type=suggestion_type,
                title=suggestion_data.get('title', 'Nutritional Suggestion'),
                description=suggestion_data.get('description', ''),
                reasoning=suggestion_data.get('reasoning', ''),
                ingredients=suggestion_data.get('ingredients', []),
                preparation_steps=suggestion_data.get('preparation_steps', []),
                prep_time=suggestion_data.get('prep_time'),
                nutritional_highlights=suggestion_data.get('nutritional_highlights', []),
                mood_benefits=suggestion_data.get('mood_benefits', []),
                alternatives=suggestion_data.get('alternatives', [])
            )
            return suggestion.model_dump()
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Error parsing dietary response: {e}")
    
    # Fallback: return raw response as description
    return DietarySuggestion(
        suggestion_type=suggestion_type,
        title="Nutritional Suggestion",
        description=response[:500],
        reasoning="Personalized for your current mood and condition"
    ).model_dump()


# Dietary AI System Prompt
DIETARY_SYSTEM_PROMPT = """You are a nutritional wellness assistant specializing in mood-based dietary recommendations for mental health. Your role is to provide evidence-based food suggestions that support cognitive and emotional well-being.

CORE PRINCIPLES:
1. NOURISHMENT FOCUS: Always emphasize nourishment, satisfaction, and well-being—NEVER calorie counting, restriction, or weight loss language
2. EVIDENCE-BASED: Base recommendations on clinical nutrition research linking food and mental health
3. PERSONALIZATION: Consider the user's specific condition, current mood, energy, time of day, and dietary restrictions
4. SENSITIVITY: Be mindful that users may have histories with disordered eating—avoid triggering language

CONDITION-SPECIFIC GUIDELINES:

ADHD:
- High-protein foods for sustained dopamine production
- Complex carbs with low glycemic index for stable energy
- Omega-3 rich foods (fatty fish, walnuts, flaxseed)
- Avoid excessive sugar and processed foods
- Iron and zinc-rich foods for executive function
- Examples: Eggs, lean meats, quinoa, berries, nuts

DEPRESSION:
- Tryptophan-rich foods for serotonin synthesis (turkey, eggs, cheese, nuts)
- B-vitamin rich foods (leafy greens, whole grains, legumes)
- Omega-3 fatty acids (salmon, sardines, mackerel)
- Vitamin D sources (fortified foods, fatty fish)
- Fermented foods for gut-brain axis (yogurt, kimchi, sauerkraut)
- Avoid alcohol and excessive caffeine

BIPOLAR DISORDER:
- Magnesium-rich foods for mood stabilization (dark chocolate, avocados, nuts)
- Anti-inflammatory foods (turmeric, olive oil, leafy greens)
- Consistent meal timing for circadian rhythm support
- Complex carbohydrates for stable blood sugar
- Limit caffeine and alcohol
- Regular protein intake throughout the day

OCD:
- Foods supporting GABA production (fermented foods, green tea)
- Magnesium for anxiety reduction
- B-vitamins for nervous system support
- Avoid excessive caffeine and sugar
- Regular, balanced meals for stability

TIME-OF-DAY CONSIDERATIONS:
- Morning: Energy-building, protein-focused, complex carbs
- Midday: Balanced meals, sustained energy
- Afternoon: Light protein snacks to avoid energy crash
- Evening: Calming foods, tryptophan-rich for sleep preparation
- Night: Light, easily digestible if needed

Always respond with practical, appetizing suggestions that users will actually want to eat. Focus on making healthy eating feel enjoyable, not restrictive."""


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


@api_router.post("/activities/details")
async def get_activity_details(
    activity: dict,
    user_id: str = Depends(get_current_user_id)
):
    """Get detailed AI-generated instructions for a specific activity"""
    try:
        # Get user info for personalization
        user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        activity_name = activity.get('activity', 'Unknown Activity')
        activity_category = activity.get('category', 'general')
        activity_description = activity.get('description', '')
        
        # Build personalized prompt
        conditions_str = ', '.join(user_doc.get('conditions', ['general']))
        
        detail_prompt = f"""Generate comprehensive, beginner-friendly instructions for this mental health activity:

ACTIVITY: {activity_name}
DESCRIPTION: {activity_description}
CATEGORY: {activity_category}
USER CONDITIONS: {conditions_str}

Please provide:
1. **Why This Helps**: Brief explanation of mental health benefits (2-3 sentences)
2. **What You'll Need**: Any materials or preparation (if applicable)
3. **Step-by-Step Instructions**: Clear, numbered steps (5-8 steps)
4. **Tips for Success**: 3-4 helpful tips specific to {conditions_str}
5. **Variations**: 2-3 ways to adapt this activity
6. **When to Do This**: Best times or situations for this activity

Make it warm, encouraging, and practical. Consider challenges people with {conditions_str} might face and address them supportively.

Format as JSON:
{{
  "why_this_helps": "explanation here",
  "materials_needed": ["item 1", "item 2"] or [],
  "steps": [
    {{"number": 1, "instruction": "First step", "tip": "Optional tip"}},
    {{"number": 2, "instruction": "Second step", "tip": "Optional tip"}}
  ],
  "success_tips": ["tip 1", "tip 2", "tip 3"],
  "variations": [
    {{"name": "Variation name", "description": "How to do it differently"}},
  ],
  "best_times": ["Morning", "When feeling anxious", "etc"]
}}

Provide ONLY valid JSON, no markdown."""

        # Call AI
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"activity_details_{user_id}",
            system_message="You are a mental health activity guide. Provide clear, practical, and encouraging instructions in valid JSON format only."
        ).with_model("openai", "gpt-5.2")
        
        from emergentintegrations.llm.chat import UserMessage
        user_message = UserMessage(text=detail_prompt)
        ai_response = await chat.send_message(user_message)
        
        # Parse AI response as JSON
        import json
        import re
        
        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            details_json = json_match.group(0)
        else:
            details_json = ai_response
        
        details = json.loads(details_json)
        
        return {
            "activity": activity_name,
            "category": activity_category,
            "description": activity_description,
            "details": details,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except json.JSONDecodeError:
        logger.error(f"Failed to parse activity details: {ai_response[:200]}")
        # Fallback response
        return {
            "activity": activity.get('activity', 'Activity'),
            "category": activity.get('category', 'general'),
            "description": activity.get('description', ''),
            "details": {
                "why_this_helps": "This activity can help improve your mood and mental wellbeing through engagement and mindfulness.",
                "materials_needed": [],
                "steps": [
                    {"number": 1, "instruction": "Find a comfortable, quiet space", "tip": "Choose somewhere you feel safe and relaxed"},
                    {"number": 2, "instruction": "Take a few deep breaths to center yourself", "tip": "Breathe in for 4 counts, hold for 4, exhale for 4"},
                    {"number": 3, "instruction": "Begin the activity at your own pace", "tip": "There's no rush - take your time"},
                    {"number": 4, "instruction": "Notice how you feel during the activity", "tip": "Check in with your emotions without judgment"},
                    {"number": 5, "instruction": "Complete the activity or pause when needed", "tip": "It's okay to take breaks or stop if you need to"}
                ],
                "success_tips": [
                    "Start small - even 5 minutes counts",
                    "Be patient with yourself",
                    "Focus on the process, not perfection"
                ],
                "variations": [
                    {"name": "Quick Version", "description": "Shorten the activity to just 3-5 minutes"},
                    {"name": "With Music", "description": "Add calming background music"}
                ],
                "best_times": ["When you have a few quiet moments", "As part of your daily routine"]
            },
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "fallback": True
        }
    except Exception as e:
        logger.error(f"Error generating activity details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate activity details"
        )


@api_router.get("/mood-logs/suggestions")
async def get_mood_suggestions(user_id: str = Depends(get_current_user_id)):
    """Get AI-powered activity suggestions based on recent mood logs"""
    try:
        # Get user info for conditions
        user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get recent mood logs (last 7 days)
        start_date = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
        recent_logs = await mood_logs_collection.find({
            "user_id": user_id,
            "date": {"$gte": start_date}
        }).sort("date", -1).limit(7).to_list(7)
        
        # Get today's log if exists
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        today_log = await mood_logs_collection.find_one({
            "user_id": user_id,
            "date": today
        })
        
        # Build context for AI
        context = "USER PROFILE:\n"
        context += f"Conditions: {', '.join(user_doc.get('conditions', ['general']))}\n\n"
        
        if today_log:
            context += "TODAY'S MOOD LOG:\n"
            context += f"- Mood Rating: {today_log.get('mood_rating')}/10\n"
            context += f"- Mood Tag: {today_log.get('mood_tag', 'Not specified')}\n"
            
            symptoms = today_log.get('symptoms', {})
            if symptoms:
                active_symptoms = [k.replace('_', ' ') for k, v in symptoms.items() if v]
                if active_symptoms:
                    context += f"- Symptoms: {', '.join(active_symptoms)}\n"
            
            if today_log.get('notes'):
                context += f"- Notes: {today_log.get('notes')[:100]}\n"
            
            context += f"- Sleep: {today_log.get('sleep_hours', 'Not logged')} hours\n"
            context += f"- Medication: {'Taken' if today_log.get('medication_taken') else 'Not taken'}\n\n"
        
        if recent_logs and len(recent_logs) > 1:
            mood_ratings = [log['mood_rating'] for log in recent_logs]
            avg_mood = sum(mood_ratings) / len(mood_ratings)
            context += "RECENT TREND (Last 7 days):\n"
            context += f"- Average mood: {avg_mood:.1f}/10\n"
            context += f"- Recent ratings: {', '.join(map(str, mood_ratings[:5]))}\n\n"
        
        # Create AI prompt for suggestions
        suggestion_prompt = f"""{context}
Based on this user's current mood state and mental health conditions, provide 4-5 specific, actionable activity suggestions that could help improve or manage their mood.

REQUIREMENTS:
1. Make suggestions specific to their conditions ({', '.join(user_doc.get('conditions', []))})
2. Consider their current mood level
3. Include a mix of quick (5-10 min) and longer activities
4. Be practical and realistic
5. Include activities from different categories: physical, mindfulness, social, creative, self-care

FORMAT YOUR RESPONSE AS A JSON ARRAY (no markdown, just raw JSON):
[
  {{
    "activity": "Short activity name (4-6 words)",
    "description": "Brief description (1 sentence, max 100 chars)",
    "duration": "5-10 min" or "15-30 min" or "30+ min",
    "category": "physical" or "mindfulness" or "social" or "creative" or "self-care",
    "benefit": "How it helps (1 sentence, max 80 chars)"
  }}
]

Provide exactly 4-5 suggestions in valid JSON format."""

        # Call AI
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"suggestions_{user_id}",
            system_message="You are a mental health activity advisor. Provide practical, evidence-based activity suggestions in valid JSON format only."
        ).with_model("openai", "gpt-5.2")
        
        from emergentintegrations.llm.chat import UserMessage
        user_message = UserMessage(text=suggestion_prompt)
        ai_response = await chat.send_message(user_message)
        
        # Parse AI response as JSON
        # Try to extract JSON from response (in case AI adds markdown)
        json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
        if json_match:
            suggestions_json = json_match.group(0)
        else:
            suggestions_json = ai_response
        
        suggestions = json.loads(suggestions_json)
        
        return {
            "suggestions": suggestions,
            "based_on_mood": today_log.get('mood_rating') if today_log else None,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except json.JSONDecodeError:
        logger.error(f"Failed to parse AI suggestions: {ai_response[:200]}")
        # Fallback suggestions
        return {
            "suggestions": [
                {
                    "activity": "5-Minute Breathing Exercise",
                    "description": "Practice deep breathing to calm your nervous system",
                    "duration": "5-10 min",
                    "category": "mindfulness",
                    "benefit": "Reduces anxiety and promotes relaxation"
                },
                {
                    "activity": "Short Walk Outside",
                    "description": "Take a brief walk in fresh air",
                    "duration": "10-15 min",
                    "category": "physical",
                    "benefit": "Boosts mood and energy levels"
                },
                {
                    "activity": "Gratitude Journaling",
                    "description": "Write down 3 things you're grateful for",
                    "duration": "5-10 min",
                    "category": "self-care",
                    "benefit": "Shifts focus to positive aspects"
                }
            ],
            "based_on_mood": today_log.get('mood_rating') if today_log else None,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "fallback": True
        }
    except Exception as e:
        logger.error(f"Error generating suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate suggestions"
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


@api_router.get("/mood-logs/analytics/advanced")
async def get_advanced_analytics(
    days: int = 30,
    user_id: str = Depends(get_current_user_id)
):
    """Get advanced analytics with pattern recognition and trigger identification"""
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    logs = await mood_logs_collection.find({
        "user_id": user_id,
        "date": {"$gte": start_date}
    }, {"_id": 0}).sort("date", 1).to_list(1000)
    
    if not logs:
        return {
            "patterns": [],
            "triggers": [],
            "correlations": {},
            "day_of_week_analysis": [],
            "mood_distribution": [],
            "sleep_mood_correlation": None,
            "medication_impact": None,
            "symptom_mood_correlation": []
        }
    
    # 1. Day of Week Analysis
    day_mood = {i: [] for i in range(7)}  # 0=Monday, 6=Sunday
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for log in logs:
        try:
            date_obj = datetime.strptime(log['date'], "%Y-%m-%d")
            day_of_week = date_obj.weekday()
            day_mood[day_of_week].append(log['mood_rating'])
        except (ValueError, KeyError):
            continue
    
    day_of_week_analysis = []
    for day_idx, moods in day_mood.items():
        if moods:
            day_of_week_analysis.append({
                "day": day_names[day_idx],
                "day_index": day_idx,
                "average_mood": round(mean(moods), 1),
                "log_count": len(moods),
                "min_mood": min(moods),
                "max_mood": max(moods)
            })
    
    # 2. Mood Distribution
    mood_distribution = []
    mood_counts = {}
    for log in logs:
        rating = log['mood_rating']
        mood_counts[rating] = mood_counts.get(rating, 0) + 1
    
    for rating in range(1, 11):
        mood_distribution.append({
            "rating": rating,
            "count": mood_counts.get(rating, 0),
            "percentage": round((mood_counts.get(rating, 0) / len(logs)) * 100, 1) if logs else 0
        })
    
    # 3. Sleep-Mood Correlation
    sleep_mood_data = [(log.get('sleep_hours'), log['mood_rating']) for log in logs if log.get('sleep_hours')]
    sleep_mood_correlation = None
    
    if len(sleep_mood_data) >= 5:
        # Group by sleep ranges
        sleep_ranges = {
            "less_than_5": [],
            "5_to_6": [],
            "6_to_7": [],
            "7_to_8": [],
            "more_than_8": []
        }
        
        for sleep, mood in sleep_mood_data:
            if sleep < 5:
                sleep_ranges["less_than_5"].append(mood)
            elif sleep < 6:
                sleep_ranges["5_to_6"].append(mood)
            elif sleep < 7:
                sleep_ranges["6_to_7"].append(mood)
            elif sleep < 8:
                sleep_ranges["7_to_8"].append(mood)
            else:
                sleep_ranges["more_than_8"].append(mood)
        
        sleep_mood_correlation = {
            "data": [
                {"range": "<5 hrs", "avg_mood": round(mean(sleep_ranges["less_than_5"]), 1) if sleep_ranges["less_than_5"] else None, "count": len(sleep_ranges["less_than_5"])},
                {"range": "5-6 hrs", "avg_mood": round(mean(sleep_ranges["5_to_6"]), 1) if sleep_ranges["5_to_6"] else None, "count": len(sleep_ranges["5_to_6"])},
                {"range": "6-7 hrs", "avg_mood": round(mean(sleep_ranges["6_to_7"]), 1) if sleep_ranges["6_to_7"] else None, "count": len(sleep_ranges["6_to_7"])},
                {"range": "7-8 hrs", "avg_mood": round(mean(sleep_ranges["7_to_8"]), 1) if sleep_ranges["7_to_8"] else None, "count": len(sleep_ranges["7_to_8"])},
                {"range": "8+ hrs", "avg_mood": round(mean(sleep_ranges["more_than_8"]), 1) if sleep_ranges["more_than_8"] else None, "count": len(sleep_ranges["more_than_8"])}
            ],
            "optimal_sleep": None
        }
        
        # Find optimal sleep range
        best_range = max(
            [(r, d["avg_mood"]) for r, d in zip(["<5 hrs", "5-6 hrs", "6-7 hrs", "7-8 hrs", "8+ hrs"], sleep_mood_correlation["data"]) if d["avg_mood"] is not None],
            key=lambda x: x[1],
            default=(None, None)
        )
        if best_range[0]:
            sleep_mood_correlation["optimal_sleep"] = best_range[0]
    
    # 4. Medication Impact Analysis
    medication_impact = None
    med_taken_moods = [log['mood_rating'] for log in logs if log.get('medication_taken')]
    med_not_taken_moods = [log['mood_rating'] for log in logs if not log.get('medication_taken')]
    
    if med_taken_moods and med_not_taken_moods:
        medication_impact = {
            "with_medication": {
                "average_mood": round(mean(med_taken_moods), 1),
                "count": len(med_taken_moods)
            },
            "without_medication": {
                "average_mood": round(mean(med_not_taken_moods), 1),
                "count": len(med_not_taken_moods)
            },
            "difference": round(mean(med_taken_moods) - mean(med_not_taken_moods), 1)
        }
    
    # 5. Symptom-Mood Correlation
    symptom_mood_correlation = []
    symptom_moods = {}
    
    for log in logs:
        for symptom, present in log.get('symptoms', {}).items():
            if symptom not in symptom_moods:
                symptom_moods[symptom] = {"with": [], "without": []}
            if present:
                symptom_moods[symptom]["with"].append(log['mood_rating'])
            else:
                symptom_moods[symptom]["without"].append(log['mood_rating'])
    
    for symptom, data in symptom_moods.items():
        if len(data["with"]) >= 3:
            avg_with = round(mean(data["with"]), 1)
            avg_without = round(mean(data["without"]), 1) if data["without"] else None
            symptom_mood_correlation.append({
                "symptom": symptom.replace("_", " ").title(),
                "symptom_key": symptom,
                "avg_mood_with_symptom": avg_with,
                "avg_mood_without_symptom": avg_without,
                "impact": round(avg_with - avg_without, 1) if avg_without else None,
                "occurrence_count": len(data["with"])
            })
    
    # Sort by impact (most negative first)
    symptom_mood_correlation.sort(key=lambda x: x["impact"] if x["impact"] is not None else 0)
    
    # 6. Pattern Recognition
    patterns = []
    
    # Check for weekend vs weekday pattern
    weekday_moods = [m for d, m in zip(day_of_week_analysis, [d.get("average_mood") for d in day_of_week_analysis]) if d.get("day_index", 0) < 5 and m]
    weekend_moods = [m for d, m in zip(day_of_week_analysis, [d.get("average_mood") for d in day_of_week_analysis]) if d.get("day_index", 0) >= 5 and m]
    
    if weekday_moods and weekend_moods:
        weekday_avg = mean([d["average_mood"] for d in day_of_week_analysis if d["day_index"] < 5])
        weekend_avg = mean([d["average_mood"] for d in day_of_week_analysis if d["day_index"] >= 5])
        
        if weekend_avg > weekday_avg + 0.5:
            patterns.append({
                "type": "weekly",
                "pattern": "weekend_boost",
                "description": "Your mood tends to be better on weekends",
                "details": f"Weekend avg: {round(weekend_avg, 1)}, Weekday avg: {round(weekday_avg, 1)}"
            })
        elif weekday_avg > weekend_avg + 0.5:
            patterns.append({
                "type": "weekly",
                "pattern": "weekday_preference",
                "description": "Your mood tends to be better on weekdays",
                "details": f"Weekday avg: {round(weekday_avg, 1)}, Weekend avg: {round(weekend_avg, 1)}"
            })
    
    # Check for low mood streaks
    current_streak = 0
    max_low_streak = 0
    
    for log in logs:
        if log['mood_rating'] <= 4:
            current_streak += 1
            max_low_streak = max(max_low_streak, current_streak)
        else:
            current_streak = 0
    
    if max_low_streak >= 3:
        patterns.append({
            "type": "streak",
            "pattern": "low_mood_streak",
            "description": f"You had a streak of {max_low_streak} consecutive low mood days",
            "details": "Consider reaching out for support during extended low periods"
        })
    
    # Check for high variability
    if len(logs) >= 7:
        all_mood_ratings = [log['mood_rating'] for log in logs]
        mood_mean = mean(all_mood_ratings)
        mood_std = (sum((m - mood_mean)**2 for m in all_mood_ratings) / len(all_mood_ratings)) ** 0.5
        if mood_std > 2.5:
            patterns.append({
                "type": "variability",
                "pattern": "high_variability",
                "description": "Your mood shows high variability",
                "details": "Large mood swings may indicate the need for stabilization strategies"
            })
    
    # 7. Trigger Identification
    triggers = []
    
    # Identify symptoms that correlate with low mood
    for corr in symptom_mood_correlation[:5]:
        if corr["impact"] and corr["impact"] < -1:
            triggers.append({
                "trigger": corr["symptom"],
                "type": "symptom",
                "impact": corr["impact"],
                "description": f"When experiencing {corr['symptom'].lower()}, your mood drops by {abs(corr['impact'])} points on average",
                "frequency": corr["occurrence_count"]
            })
    
    # Sleep as a trigger
    if sleep_mood_correlation:
        low_sleep_data = next((d for d in sleep_mood_correlation["data"] if d["range"] == "<5 hrs" and d["avg_mood"]), None)
        good_sleep_data = next((d for d in sleep_mood_correlation["data"] if d["range"] == "7-8 hrs" and d["avg_mood"]), None)
        
        if low_sleep_data and good_sleep_data and low_sleep_data["avg_mood"] < good_sleep_data["avg_mood"] - 1:
            triggers.append({
                "trigger": "Poor Sleep (<5 hours)",
                "type": "sleep",
                "impact": round(low_sleep_data["avg_mood"] - good_sleep_data["avg_mood"], 1),
                "description": f"Getting less than 5 hours of sleep correlates with lower mood (avg: {low_sleep_data['avg_mood']}/10)",
                "frequency": low_sleep_data["count"]
            })
    
    # Day of week triggers
    if day_of_week_analysis:
        worst_day = min(day_of_week_analysis, key=lambda x: x["average_mood"])
        best_day = max(day_of_week_analysis, key=lambda x: x["average_mood"])
        
        if best_day["average_mood"] - worst_day["average_mood"] > 1.5:
            triggers.append({
                "trigger": f"{worst_day['day']}s",
                "type": "day_of_week",
                "impact": round(worst_day["average_mood"] - best_day["average_mood"], 1),
                "description": f"{worst_day['day']}s tend to be your most challenging day (avg mood: {worst_day['average_mood']}/10)",
                "frequency": worst_day["log_count"]
            })
    
    return {
        "patterns": patterns,
        "triggers": triggers,
        "day_of_week_analysis": day_of_week_analysis,
        "mood_distribution": mood_distribution,
        "sleep_mood_correlation": sleep_mood_correlation,
        "medication_impact": medication_impact,
        "symptom_mood_correlation": symptom_mood_correlation[:10]
    }


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Chat with AI assistant with enhanced crisis detection"""
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
        context = "\n\nUSER CONTEXT:\n"
        context += f"User conditions: {', '.join(user_doc.get('conditions', []))}\n"
        
        if recent_logs:
            context += "Recent mood history (last 5 entries):\n"
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
        
        # Enhanced Crisis Detection
        message_lower = request.message.lower()
        
        # Critical crisis keywords (immediate danger)
        critical_keywords = [
            "suicide", "kill myself", "end my life", "want to die", "better off dead",
            "end it all", "take my life", "jump off", "hang myself", "overdose",
            "slit my wrists", "shoot myself", "don't want to live"
        ]
        
        # High concern keywords (significant distress)
        high_concern_keywords = [
            "self-harm", "hurt myself", "cutting", "burning myself", "punish myself",
            "can't go on", "no point", "no reason to live", "hopeless", "worthless",
            "burden to everyone", "everyone hates me", "no one cares", "alone forever",
            "give up", "can't take it anymore", "exhausted of living"
        ]
        
        # Moderate concern keywords (needs support)
        moderate_concern_keywords = [
            "depressed", "anxious", "panic attack", "can't breathe", "overwhelmed",
            "breaking down", "falling apart", "lost", "scared", "terrified",
            "crying all day", "can't stop crying", "numb", "empty inside"
        ]
        
        # Determine crisis level
        crisis_level = None
        if any(kw in message_lower for kw in critical_keywords):
            crisis_level = "critical"
        elif any(kw in message_lower for kw in high_concern_keywords):
            crisis_level = "high"
        elif any(kw in message_lower for kw in moderate_concern_keywords):
            crisis_level = "moderate"
        
        # Send caregiver alert for critical and high concern levels
        if crisis_level in ["critical", "high"]:
            await send_caregiver_crisis_alert(
                user_id=user_id,
                user_name=user_doc.get('name', 'Unknown'),
                crisis_level=crisis_level,
                message_snippet=request.message[:200]
            )
        
        # Handle critical crisis
        if crisis_level == "critical":
            crisis_response = """I'm deeply concerned about what you're sharing. Your life matters, and I want you to get the support you need right now.

🚨 **PLEASE REACH OUT FOR IMMEDIATE HELP:**

📞 **988 Suicide & Crisis Lifeline**: Call or text **988** (24/7)
💬 **Crisis Text Line**: Text **HOME** to **741741**
🚑 **Emergency Services**: Call **911** if you're in immediate danger
🌐 **International**: Visit findahelpline.com for resources in your country

**You are not alone.** These feelings are temporary, even when they don't feel that way. Crisis counselors are trained to help you through this exact moment.

I've also notified your connected caregivers so they can reach out to support you.

Would you like to stay and talk while you wait for help? I'm here with you."""
            
            return ChatResponse(
                response=crisis_response,
                crisis_detected=True,
                crisis_level=crisis_level
            )
        
        # Handle high concern
        if crisis_level == "high":
            concern_response = """I hear you, and what you're going through sounds incredibly difficult. I'm concerned about your wellbeing.

💜 **Support resources available to you:**

📞 **988 Lifeline**: Call or text **988** - They're there for ANY emotional distress
💬 **Crisis Text Line**: Text **HOME** to **741741**
🧠 **SAMHSA Helpline**: 1-800-662-4357 (mental health & substance support)

I've notified your caregivers about how you're feeling so they can check in on you.

You don't have to face this alone. Would you like to tell me more about what's been happening? Sometimes talking through our feelings can help, even a little."""
            
            return ChatResponse(
                response=concern_response,
                crisis_detected=True,
                crisis_level=crisis_level
            )
        
        # For moderate concern, add resources to AI response
        include_resources = crisis_level == "moderate"
        
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
        
        # Add resources footer for moderate concern
        final_response = ai_response
        if include_resources:
            final_response += "\n\n---\n💜 *If you need immediate support: Call/text 988 or text HOME to 741741*"
        
        return ChatResponse(
            response=final_response,
            crisis_detected=crisis_level is not None,
            crisis_level=crisis_level
        )
        
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


# ============= CAREGIVER ROUTES =============

@api_router.post("/caregivers/invite", response_model=CaregiverInvitation)
async def invite_caregiver(
    invitation_data: CaregiverInvitationCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Send an invitation to a caregiver"""
    # Get current user info
    user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if invitation already exists
    existing_invitation = await caregiver_invitations_collection.find_one({
        "patient_id": user_id,
        "caregiver_email": invitation_data.caregiver_email,
        "status": "pending"
    })
    
    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation already sent to this email"
        )
    
    # Check if relationship already exists
    existing_relationship = await caregiver_relationships_collection.find_one({
        "patient_id": user_id,
        "caregiver_email": invitation_data.caregiver_email
    })
    
    if existing_relationship:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This person is already your caregiver"
        )
    
    # Create invitation
    permissions = invitation_data.permissions or {
        "view_mood_logs": True,
        "view_analytics": True,
        "receive_alerts": True
    }
    
    invitation = CaregiverInvitation(
        patient_id=user_id,
        patient_name=user_doc.get('name', 'Unknown'),
        patient_email=user_doc.get('email', ''),
        caregiver_email=invitation_data.caregiver_email,
        permissions=permissions
    )
    
    invitation_dict = invitation.model_dump()
    invitation_dict['created_at'] = invitation_dict['created_at'].isoformat()
    invitation_dict['expires_at'] = invitation_dict['expires_at'].isoformat()
    
    await caregiver_invitations_collection.insert_one(invitation_dict)
    
    # Create notification for caregiver if they have an account
    caregiver_user = await users_collection.find_one({"email": invitation_data.caregiver_email})
    if caregiver_user:
        notification = Notification(
            user_id=caregiver_user['id'],
            notification_type="invitation",
            title="New Caregiver Invitation",
            message=f"{user_doc.get('name')} has invited you to be their caregiver.",
            related_user_id=user_id,
            related_user_name=user_doc.get('name')
        )
        notification_dict = notification.model_dump()
        notification_dict['created_at'] = notification_dict['created_at'].isoformat()
        await notifications_collection.insert_one(notification_dict)
    
    return invitation


@api_router.get("/caregivers/invitations/sent")
async def get_sent_invitations(user_id: str = Depends(get_current_user_id)):
    """Get invitations sent by current user (as patient)"""
    invitations = await caregiver_invitations_collection.find(
        {"patient_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for inv in invitations:
        if isinstance(inv.get('created_at'), str):
            inv['created_at'] = datetime.fromisoformat(inv['created_at'])
        if isinstance(inv.get('expires_at'), str):
            inv['expires_at'] = datetime.fromisoformat(inv['expires_at'])
    
    return {"invitations": invitations}


@api_router.get("/caregivers/invitations/received")
async def get_received_invitations(user_id: str = Depends(get_current_user_id)):
    """Get invitations received by current user (as caregiver)"""
    # Get user email
    user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    invitations = await caregiver_invitations_collection.find(
        {"caregiver_email": user_doc['email'], "status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for inv in invitations:
        if isinstance(inv.get('created_at'), str):
            inv['created_at'] = datetime.fromisoformat(inv['created_at'])
        if isinstance(inv.get('expires_at'), str):
            inv['expires_at'] = datetime.fromisoformat(inv['expires_at'])
    
    return {"invitations": invitations}


@api_router.post("/caregivers/invitations/{invitation_id}/accept")
async def accept_invitation(
    invitation_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Accept a caregiver invitation"""
    # Get user info
    user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find and validate invitation
    invitation = await caregiver_invitations_collection.find_one({
        "id": invitation_id,
        "caregiver_email": user_doc['email'],
        "status": "pending"
    })
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or already processed")
    
    # Check if expired
    expires_at = invitation.get('expires_at')
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    
    if expires_at < datetime.now(timezone.utc):
        await caregiver_invitations_collection.update_one(
            {"id": invitation_id},
            {"$set": {"status": "expired"}}
        )
        raise HTTPException(status_code=400, detail="Invitation has expired")
    
    # Create caregiver relationship
    relationship = CaregiverRelationship(
        patient_id=invitation['patient_id'],
        patient_name=invitation['patient_name'],
        patient_email=invitation['patient_email'],
        caregiver_id=user_id,
        caregiver_name=user_doc.get('name', 'Unknown'),
        caregiver_email=user_doc['email'],
        permissions=invitation.get('permissions', {})
    )
    
    relationship_dict = relationship.model_dump()
    relationship_dict['created_at'] = relationship_dict['created_at'].isoformat()
    
    await caregiver_relationships_collection.insert_one(relationship_dict)
    
    # Update invitation status
    await caregiver_invitations_collection.update_one(
        {"id": invitation_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Notify the patient
    notification = Notification(
        user_id=invitation['patient_id'],
        notification_type="invitation",
        title="Invitation Accepted",
        message=f"{user_doc.get('name')} has accepted your caregiver invitation.",
        related_user_id=user_id,
        related_user_name=user_doc.get('name')
    )
    notification_dict = notification.model_dump()
    notification_dict['created_at'] = notification_dict['created_at'].isoformat()
    await notifications_collection.insert_one(notification_dict)
    
    return {"message": "Invitation accepted successfully", "relationship_id": relationship.id}


@api_router.post("/caregivers/invitations/{invitation_id}/reject")
async def reject_invitation(
    invitation_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Reject a caregiver invitation"""
    # Get user email
    user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await caregiver_invitations_collection.update_one(
        {"id": invitation_id, "caregiver_email": user_doc['email'], "status": "pending"},
        {"$set": {"status": "rejected"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invitation not found or already processed")
    
    return {"message": "Invitation rejected"}


@api_router.delete("/caregivers/invitations/{invitation_id}")
async def cancel_invitation(
    invitation_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Cancel a pending invitation (for patient)"""
    result = await caregiver_invitations_collection.delete_one({
        "id": invitation_id,
        "patient_id": user_id,
        "status": "pending"
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invitation not found or already processed")
    
    return {"message": "Invitation cancelled"}


@api_router.get("/caregivers")
async def get_my_caregivers(user_id: str = Depends(get_current_user_id)):
    """Get list of caregivers for current user (as patient)"""
    relationships = await caregiver_relationships_collection.find(
        {"patient_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    for rel in relationships:
        if isinstance(rel.get('created_at'), str):
            rel['created_at'] = datetime.fromisoformat(rel['created_at'])
    
    return {"caregivers": relationships}


@api_router.get("/caregivers/patients")
async def get_my_patients(user_id: str = Depends(get_current_user_id)):
    """Get list of patients for current user (as caregiver)"""
    relationships = await caregiver_relationships_collection.find(
        {"caregiver_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    for rel in relationships:
        if isinstance(rel.get('created_at'), str):
            rel['created_at'] = datetime.fromisoformat(rel['created_at'])
    
    return {"patients": relationships}


@api_router.get("/caregivers/patients/{patient_id}/mood-logs")
async def get_patient_mood_logs(
    patient_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 30,
    user_id: str = Depends(get_current_user_id)
):
    """Get mood logs for a patient (as caregiver)"""
    # Verify caregiver relationship and permissions
    relationship = await caregiver_relationships_collection.find_one({
        "patient_id": patient_id,
        "caregiver_id": user_id
    })
    
    if not relationship:
        raise HTTPException(status_code=403, detail="Not authorized to view this patient's data")
    
    if not relationship.get('permissions', {}).get('view_mood_logs', False):
        raise HTTPException(status_code=403, detail="Permission denied to view mood logs")
    
    # Build query
    query = {"user_id": patient_id}
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["date"] = date_filter
    
    logs = await mood_logs_collection.find(query, {"_id": 0}).sort("date", -1).limit(limit).to_list(limit)
    
    for log in logs:
        if isinstance(log.get('timestamp'), str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return {"mood_logs": [MoodLog(**log).model_dump() for log in logs]}


@api_router.get("/caregivers/patients/{patient_id}/analytics")
async def get_patient_analytics(
    patient_id: str,
    days: int = 30,
    user_id: str = Depends(get_current_user_id)
):
    """Get analytics for a patient (as caregiver)"""
    # Verify caregiver relationship and permissions
    relationship = await caregiver_relationships_collection.find_one({
        "patient_id": patient_id,
        "caregiver_id": user_id
    })
    
    if not relationship:
        raise HTTPException(status_code=403, detail="Not authorized to view this patient's data")
    
    if not relationship.get('permissions', {}).get('view_analytics', False):
        raise HTTPException(status_code=403, detail="Permission denied to view analytics")
    
    # Get patient info
    patient = await users_collection.find_one({"id": patient_id}, {"_id": 0, "password_hash": 0})
    
    # Get logs from last N days
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    logs = await mood_logs_collection.find({
        "user_id": patient_id,
        "date": {"$gte": start_date}
    }, {"_id": 0}).to_list(1000)
    
    if not logs:
        return {
            "patient_name": patient.get('name') if patient else 'Unknown',
            "average_mood": 0.0,
            "total_logs": 0,
            "mood_trend": "stable",
            "most_common_symptoms": [],
            "insights": ["No mood logs in this period."],
            "recent_concerns": []
        }
    
    # Calculate analytics
    mood_ratings = [log['mood_rating'] for log in logs]
    avg_mood = mean(mood_ratings)
    
    # Determine trend
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
    
    # Get common symptoms
    symptom_counts = {}
    for log in logs:
        for symptom, value in log.get('symptoms', {}).items():
            if value:
                symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
    
    most_common = sorted(
        [{"symptom": k, "count": v} for k, v in symptom_counts.items()],
        key=lambda x: x['count'],
        reverse=True
    )[:5]
    
    # Identify recent concerns (low mood days, missed medications)
    recent_concerns = []
    recent_logs = logs[:7]  # Last 7 logs
    
    low_mood_days = [log for log in recent_logs if log['mood_rating'] <= 3]
    if low_mood_days:
        recent_concerns.append({
            "type": "low_mood",
            "message": f"{len(low_mood_days)} day(s) with very low mood in recent logs",
            "severity": "high" if len(low_mood_days) >= 3 else "medium"
        })
    
    missed_meds = [log for log in recent_logs if not log.get('medication_taken', True)]
    if missed_meds and len(missed_meds) > 2:
        recent_concerns.append({
            "type": "medication",
            "message": f"Medication missed on {len(missed_meds)} recent days",
            "severity": "medium"
        })
    
    return {
        "patient_name": patient.get('name') if patient else 'Unknown',
        "average_mood": round(avg_mood, 1),
        "total_logs": len(logs),
        "mood_trend": trend,
        "most_common_symptoms": most_common,
        "insights": [],
        "recent_concerns": recent_concerns
    }


@api_router.put("/caregivers/{relationship_id}/permissions")
async def update_caregiver_permissions(
    relationship_id: str,
    update_data: CaregiverPermissionUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update permissions for a caregiver (as patient)"""
    result = await caregiver_relationships_collection.update_one(
        {"id": relationship_id, "patient_id": user_id},
        {"$set": {"permissions": update_data.permissions}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    return {"message": "Permissions updated successfully"}


@api_router.delete("/caregivers/{relationship_id}")
async def remove_caregiver(
    relationship_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Remove a caregiver relationship (patient can remove caregiver, caregiver can remove themselves)"""
    # Check if user is patient or caregiver
    relationship = await caregiver_relationships_collection.find_one({
        "id": relationship_id,
        "$or": [{"patient_id": user_id}, {"caregiver_id": user_id}]
    })
    
    if not relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    await caregiver_relationships_collection.delete_one({"id": relationship_id})
    
    return {"message": "Caregiver relationship removed"}


# ============= NOTIFICATION ROUTES =============

@api_router.get("/notifications")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id)
):
    """Get notifications for current user"""
    query = {"user_id": user_id}
    if unread_only:
        query["is_read"] = False
    
    notifications = await notifications_collection.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for notif in notifications:
        if isinstance(notif.get('created_at'), str):
            notif['created_at'] = datetime.fromisoformat(notif['created_at'])
    
    # Count unread
    unread_count = await notifications_collection.count_documents({
        "user_id": user_id,
        "is_read": False
    })
    
    return {"notifications": notifications, "unread_count": unread_count}


@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Mark a notification as read"""
    result = await notifications_collection.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"is_read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}


@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(user_id: str = Depends(get_current_user_id)):
    """Mark all notifications as read"""
    await notifications_collection.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"message": "All notifications marked as read"}


# ============= NOTIFICATION PREFERENCES ROUTES =============

@api_router.get("/users/me/notification-preferences")
async def get_notification_preferences(user_id: str = Depends(get_current_user_id)):
    """Get user's notification preferences"""
    user_doc = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    default_prefs = {
        "email_crisis_alerts": True,
        "email_mood_reminders": False,
        "email_weekly_summary": True,
        "push_enabled": True,
        "push_crisis_alerts": True,
        "push_mood_reminders": True,
        "push_caregiver_updates": True
    }
    
    prefs = user_doc.get('notification_preferences', default_prefs)
    return {"notification_preferences": {**default_prefs, **prefs}}


@api_router.put("/users/me/notification-preferences")
async def update_notification_preferences(
    prefs: NotificationPreferencesUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update user's notification preferences"""
    update_data = {k: v for k, v in prefs.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    user_doc = await users_collection.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_prefs = user_doc.get('notification_preferences', {})
    existing_prefs.update(update_data)
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"notification_preferences": existing_prefs}}
    )
    
    return {"message": "Notification preferences updated", "notification_preferences": existing_prefs}


# ============= PUSH SUBSCRIPTION ROUTES =============

@api_router.post("/push/subscribe")
async def subscribe_push(
    subscription: PushSubscriptionCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Subscribe to push notifications"""
    # Check if subscription already exists
    existing = await push_subscriptions_collection.find_one({
        "user_id": user_id,
        "endpoint": subscription.endpoint
    })
    
    if existing:
        return {"message": "Already subscribed", "subscription_id": existing['id']}
    
    push_sub = PushSubscription(
        user_id=user_id,
        endpoint=subscription.endpoint,
        keys=subscription.keys
    )
    
    sub_dict = push_sub.model_dump()
    sub_dict['created_at'] = sub_dict['created_at'].isoformat()
    
    await push_subscriptions_collection.insert_one(sub_dict)
    
    return {"message": "Subscribed to push notifications", "subscription_id": push_sub.id}


@api_router.delete("/push/unsubscribe")
async def unsubscribe_push(
    endpoint: str,
    user_id: str = Depends(get_current_user_id)
):
    """Unsubscribe from push notifications"""
    result = await push_subscriptions_collection.delete_one({
        "user_id": user_id,
        "endpoint": endpoint
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Unsubscribed from push notifications"}


@api_router.get("/push/vapid-public-key")
async def get_vapid_public_key():
    """Get VAPID public key for push notification setup"""
    # In production, generate and store VAPID keys
    # For now, return a placeholder
    return {"publicKey": os.getenv("VAPID_PUBLIC_KEY", "")}


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
