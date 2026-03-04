# Mentl — Architecture & Code Review

> **Document Date:** 2026-03-04
> **Branch:** `claude/code-review-architecture-docs-8obfE`

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Data Models](#5-data-models)
6. [API Reference](#6-api-reference)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [AI Integration](#8-ai-integration)
9. [Notification System](#9-notification-system)
10. [Code Review Findings](#10-code-review-findings)

---

## 1. Application Overview

**Mentl** is a full-stack mental health companion web application that supports users living with **Bipolar Disorder**, **ADHD**, and **Depression**. It provides:

- Daily mood and symptom tracking
- AI-powered chat with multi-tier crisis detection
- Caregiver relationship management (patients can invite trusted contacts to view their data and receive crisis alerts)
- Advanced mood analytics and pattern recognition
- AI-generated activity and dietary suggestions
- An educational content library

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Browser                          │
│                                                                  │
│   React 19 SPA (Create React App + CRACO)                       │
│   Tailwind CSS · Radix UI · React Router v7 · Recharts          │
└────────────────────────┬────────────────────────────────────────┘
                         │  HTTPS  (REACT_APP_BACKEND_URL/api/*)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend                            │
│                                                                  │
│   server.py  ─── models.py  ─── auth.py  ─── database.py       │
│        │                                                         │
│        ├── JWT Bearer Auth (python-jose + passlib/bcrypt)        │
│        ├── Emergent LLM (OpenAI GPT-5.2 via LlmChat)            │
│        └── Resend (transactional email)                          │
└──────────────┬──────────────────────────────────────────────────┘
               │  Motor (async)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MongoDB Database                           │
│                                                                  │
│   users · mood_logs · chat_history · content                    │
│   caregiver_invitations · caregiver_relationships               │
│   notifications · push_subscriptions                            │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19 |
| Build tooling | Create React App + CRACO |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix UI) |
| Charts | Recharts |
| Routing | React Router v7 |
| HTTP client | Axios |
| Backend framework | FastAPI 0.110 |
| Language | Python 3 (async/await throughout) |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (HS256) + bcrypt |
| AI | Emergent LLM → OpenAI GPT-5.2 |
| Email | Resend |
| Package manager (FE) | Yarn 1.22 |

---

## 3. Backend Architecture

### 3.1 File Structure

```
backend/
├── server.py          # FastAPI app, all route handlers, helper functions
├── models.py          # Pydantic v2 data models (request & response)
├── auth.py            # JWT creation/decode, bcrypt helpers, Depends guard
├── database.py        # Motor client setup, collection references
├── seed_content.py    # One-time script to seed educational content
├── requirements.txt   # Python dependencies (pinned)
└── .env               # Secrets (not committed)
```

### 3.2 Application Entrypoint (`server.py`)

The entire backend lives in a single `server.py` file (~1,900 lines). It:

1. Creates the `FastAPI` application and an `APIRouter` with prefix `/api`.
2. Configures CORS middleware to allow the frontend origin.
3. Defines helper functions (crisis alert dispatch, email send, push notification).
4. Defines all route handlers grouped into logical sections.
5. Includes the router and registers a shutdown event to close the DB connection.

### 3.3 Route Groups

| Section | Endpoints |
|---------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile` |
| Dietary Preferences | `GET /users/me/dietary-preferences`, `PUT /users/me/dietary-preferences` |
| Dietary Suggestions | `POST /dietary/suggestions` |
| Mood Logs | `POST /mood-logs`, `GET /mood-logs`, `GET /mood-logs/{id}`, `PUT /mood-logs/{id}`, `DELETE /mood-logs/{id}` |
| Mood Analytics | `GET /mood-logs/analytics/summary`, `GET /mood-logs/analytics/advanced` |
| Activity | `GET /mood-logs/suggestions`, `POST /activities/details` |
| AI Chat | `POST /chat`, `GET /chat/history`, `DELETE /chat/history` |
| Content Library | `GET /content`, `GET /content/{id}` |
| Caregivers | Full CRUD for invitations and relationships; caregiver access to patient mood data |
| Notifications | Get, mark-as-read, notification preferences |
| Push Subscriptions | Subscribe/unsubscribe |

### 3.4 Authentication Module (`auth.py`)

- Passwords hashed with **bcrypt** via `passlib`.
- JWTs signed with **HS256** (`python-jose`); 7-day expiry by default.
- `get_current_user_id` is a FastAPI `Depends` guard injected into all protected routes — it extracts and validates the bearer token and returns the `user_id` string.

### 3.5 Database Module (`database.py`)

- Uses **Motor** (async MongoDB driver) with a single `AsyncIOMotorClient`.
- Collections are exported as module-level globals and imported directly by `server.py`.
- `close_db_connection()` is called on app shutdown.

---

## 4. Frontend Architecture

### 4.1 File Structure

```
frontend/src/
├── App.js               # Root: providers + React Router route tree
├── index.js             # ReactDOM render entry point
├── context/
│   ├── AuthContext.js   # Auth state (user, login, logout, register)
│   └── ThemeContext.js  # Light / dark theme toggle
├── pages/
│   ├── Login.js
│   ├── Register.js
│   ├── Dashboard.js         # Overview: recent mood, streak, quick actions
│   ├── LogMood.js           # Daily mood + symptom entry form
│   ├── Insights.js          # Analytics charts (basic + advanced)
│   ├── Chat.js              # AI chat interface
│   ├── Library.js           # Educational content browser
│   ├── Settings.js          # Profile, conditions, notifications, theme
│   ├── ActivityDetail.js    # AI-generated activity instructions
│   ├── Caregivers.js        # Manage caregiver invitations/relationships
│   ├── Nutrition.js         # Dietary preference & AI suggestions
│   ├── ActivitySuggestions.js
│   └── DietarySuggestions.js
├── components/
│   ├── Layout.js        # Sidebar navigation + top bar shell
│   ├── ProtectedRoute.js
│   └── ui/              # shadcn/ui primitives (Radix UI wrappers)
├── hooks/               # Custom React hooks
├── utils/
│   ├── api.js           # Axios instance + auth interceptors
│   └── darkMode.js      # Theme utilities
└── lib/                 # shadcn utility (cn helper)
```

### 4.2 Routing

All routes are defined in `App.js` using React Router v7's `<Routes>` / `<Route>` declarative API.

- **Public routes:** `/login`, `/register`
- **Protected routes:** everything else — wrapped with `<ProtectedRoute>` which redirects to `/login` if the user is not authenticated.
- Unknown paths and `/` redirect to `/dashboard`.

### 4.3 State Management

State management is intentionally lightweight — **no Redux or Zustand**:

| Concern | Solution |
|---------|----------|
| Auth state | `AuthContext` (React Context + `useState`) |
| Theme | `ThemeContext` (React Context + localStorage) |
| Server data | Local `useState` inside each page + direct `api.*` calls |
| Form state | `react-hook-form` + `zod` schemas |

### 4.4 HTTP Layer (`utils/api.js`)

A single Axios instance is configured with:
- `baseURL` set from `REACT_APP_BACKEND_URL`.
- **Request interceptor** — attaches the `Authorization: Bearer <token>` header from `localStorage`.
- **Response interceptor** — on 401, clears stored credentials and redirects to `/login`.

### 4.5 UI Component Library

The project uses **shadcn/ui** — a collection of copy-owned components built on top of Radix UI primitives. This gives accessible, unstyled base components that are styled with Tailwind CSS. Components are located at `frontend/src/components/ui/`.

---

## 5. Data Models

### 5.1 Users

```
User {
  id:           UUID (string)
  email:        string (unique)
  name:         string
  conditions:   ["bipolar" | "adhd" | "depression"]
  age:          int (optional)
  weight:       float kg (optional)
  height:       float cm (optional)
  preferences:  {}
  dietary_preferences: DietaryPreferences (stored embedded)
  notification_preferences: NotificationPreferences (embedded)
  created_at:   datetime
  // password_hash stored but excluded from User model responses
}
```

### 5.2 Mood Logs

```
MoodLog {
  id:               UUID
  user_id:          UUID → User.id
  date:             "YYYY-MM-DD"  (one log per user per date enforced)
  mood_rating:      int 1–10
  mood_tag:         string (optional, e.g. "anxious")
  symptoms:         {}  (flexible dict, condition-specific keys)
  notes:            string (optional)
  medication_taken: bool
  sleep_hours:      float (optional)
  timestamp:        datetime
}
```

### 5.3 Caregiver System

```
CaregiverInvitation {
  patient_id → patient sends invite
  caregiver_email
  status: "pending" | "accepted" | "rejected" | "expired"
  permissions: { view_mood_logs, view_analytics, receive_alerts }
  expires_at: now + 7 days
}

CaregiverRelationship {
  patient_id, patient_name, patient_email
  caregiver_id, caregiver_name, caregiver_email
  permissions: { ... }
}
```

### 5.4 Chat

```
ChatHistory {
  user_id
  messages: [{ role: "user"|"assistant", content, timestamp }]
  // Capped at last 50 messages
}
```

### 5.5 Notifications

```
Notification {
  user_id (recipient)
  notification_type: "invitation" | "crisis_alert" | "mood_concern" | "missed_logs"
  title, message
  related_user_id, related_user_name (optional, for caregiver alerts)
  is_read: bool
}
```

---

## 6. API Reference

All API endpoints are prefixed with `/api`.

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create account, returns JWT |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/auth/me` | Yes | Get current user profile |
| PUT | `/auth/profile` | Yes | Update profile |

### Mood Logs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/mood-logs` | Create daily mood log (one per date) |
| GET | `/mood-logs` | List logs (date filter, limit) |
| GET | `/mood-logs/{id}` | Get single log |
| PUT | `/mood-logs/{id}` | Update log |
| DELETE | `/mood-logs/{id}` | Delete log |
| GET | `/mood-logs/analytics/summary` | Basic analytics |
| GET | `/mood-logs/analytics/advanced` | Advanced pattern analysis |
| GET | `/mood-logs/suggestions` | AI activity suggestions |

### AI Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | Send message, get AI response (with crisis detection) |
| GET | `/chat/history` | Last N messages |
| DELETE | `/chat/history` | Clear history |

### Caregivers

| Method | Path | Description |
|--------|------|-------------|
| POST | `/caregivers/invite` | Send invitation |
| GET | `/caregivers/invitations/sent` | My sent invitations |
| GET | `/caregivers/invitations/received` | Invitations I received |
| POST | `/caregivers/invitations/{id}/accept` | Accept invitation |
| POST | `/caregivers/invitations/{id}/reject` | Reject invitation |
| DELETE | `/caregivers/invitations/{id}` | Cancel invitation |
| GET | `/caregivers` | My caregivers (as patient) |
| GET | `/caregivers/patients` | My patients (as caregiver) |
| GET | `/caregivers/patients/{id}/mood-logs` | Access patient data (permission-gated) |

### Content Library

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/content` | No | Browse content (filter by category, type, search) |
| GET | `/content/{id}` | No | Get single content item |

### Dietary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me/dietary-preferences` | Get preferences |
| PUT | `/users/me/dietary-preferences` | Update preferences |
| POST | `/dietary/suggestions` | Get AI food suggestion |

---

## 7. Authentication & Authorization

### Flow

```
1. User POST /auth/login or /auth/register
2. Server verifies credentials → returns JWT (7-day expiry)
3. Client stores JWT in localStorage
4. Axios request interceptor attaches: Authorization: Bearer <token>
5. FastAPI Depends(get_current_user_id) validates JWT on each protected request
6. On 401 response, Axios interceptor clears storage and redirects to /login
```

### Caregiver Authorization

Caregiver data access routes perform a **two-step check**:
1. Verify a `CaregiverRelationship` document exists with matching `(patient_id, caregiver_id)`.
2. Verify the relationship's `permissions` dict grants the required permission (e.g., `view_mood_logs`).

---

## 8. AI Integration

### Chat (`POST /chat`)

```
User message
    │
    ▼
Crisis Detection (keyword matching)
    │
    ├── critical → hard-coded crisis response + caregiver alert
    ├── high     → hard-coded high-concern response + caregiver alert
    ├── moderate → pass to LLM + append helpline footer
    └── none     → pass to LLM as normal
         │
         ▼
     LlmChat (emergentintegrations)
     model: openai / gpt-5.2
     session_id: "user_{user_id}"  ← persistent session per user
     system_message: MENTAL_HEALTH_SYSTEM_PROMPT + user context
         │
         ▼
     Store in chat_history (capped at 50 messages)
         │
         ▼
     Return ChatResponse { response, crisis_detected, crisis_level }
```

### Activity & Dietary Suggestions

Both use the same LLM service but with **stateless sessions** (session_id includes timestamp). They:
1. Build a context string from the user's profile, conditions, recent mood logs, and current state.
2. Send to LLM with a structured JSON response requirement.
3. Parse the JSON response with a regex fallback, then return to the client.

---

## 9. Notification System

Three notification channels are implemented:

| Channel | Status | Implementation |
|---------|--------|----------------|
| In-app notifications | ✅ Fully implemented | Stored in `notifications` collection, fetched by frontend |
| Email alerts | ✅ Functional | Resend API via `asyncio.to_thread` |
| Push notifications | ⚠️ Stub only | Subscriptions stored, but actual push delivery is not implemented |

Crisis alerts are dispatched to all caregivers who have `receive_alerts: true` via `send_caregiver_crisis_alert()`, which is called automatically when the chat endpoint detects a critical or high-level crisis message.

---

## 10. Code Review Findings

### 10.1 Security Issues

#### S1 — Weak JWT Secret Default (High)
**File:** `backend/auth.py:11`
```python
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
```
If `JWT_SECRET` is not set in the environment, any JWT signed with the known default string is valid. This is a critical misconfiguration risk in production. The application should refuse to start if the secret is not set.

**Recommendation:** Remove the default and fail fast:
```python
JWT_SECRET = os.environ["JWT_SECRET"]  # Will raise KeyError if not set
```

#### S2 — No Rate Limiting on Auth Endpoints (Medium)
`POST /auth/login` and `POST /auth/register` have no rate limiting, making them vulnerable to brute-force and credential-stuffing attacks.

**Recommendation:** Add a rate-limiting middleware (e.g., `slowapi`) to the auth routes.

#### S3 — Crisis Detection via Simple String Matching (Low)
Keyword-based crisis detection in `server.py` can produce both false positives (e.g., "I'm not suicidal") and false negatives (synonyms, misspellings). It is appropriate as a first-pass filter but should not be the sole safety layer.

**Recommendation:** Document this limitation prominently and consider a secondary LLM-based safety pass for production.

#### S4 — No Input Length Validation on Chat Messages (Low)
`ChatRequest.message: str` has no `max_length` constraint, which could be abused to send extremely long messages that inflate LLM token costs.

**Recommendation:**
```python
class ChatRequest(BaseModel):
    message: str = Field(..., max_length=2000)
```

---

### 10.2 Data & Logic Issues

#### D1 — Manual datetime Serialisation Throughout (High)
Datetime objects are converted to ISO strings on insert and manually converted back on read throughout `server.py`. This pattern is fragile and repeated ~15 times:
```python
log_dict['timestamp'] = log_dict['timestamp'].isoformat()
# ... later ...
log['timestamp'] = datetime.fromisoformat(log['timestamp'])
```

**Recommendation:** Use a custom MongoDB codec or a unified serialisation helper to handle this centrally. Motor supports custom `TypeEncoder`/`TypeDecoder` for `datetime`.

#### D2 — Update Filters Silently Drop `False` and `0` (Medium)
Multiple update endpoints use this pattern:
```python
update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
```
This correctly excludes `None` (unset), but also excludes **falsy values that are intentionally set**, such as `medication_taken=False` or `mood_rating` that evaluates to `0` (though `0` is out-of-range, the pattern is still risky).

**Recommendation:** Use Pydantic's `model_dump(exclude_unset=True)` or `exclude_none=True` carefully, and use a sentinel value pattern to distinguish "not provided" from "intentionally falsy":
```python
update_dict = update_data.model_dump(exclude_unset=True)
```

#### D3 — Mood Trend Direction May Be Inverted (Medium)
**File:** `server.py`, `get_mood_analytics()`

Logs are fetched with `.sort("date", -1)` (most-recent first), so `mood_ratings[0]` is the **newest** entry. The trend calculation compares `first_half_avg` vs `second_half_avg`, which means it is actually comparing recent vs older — the opposite of what the variable names suggest. If recent mood is higher than older mood, the trend is correctly called "improving", but the `first_half` / `second_half` labels in the code are misleading and could cause maintenance errors.

**Recommendation:** Either sort ascending before analysis or rename variables to clearly indicate direction (`recent_avg` vs `older_avg`).

#### D4 — Weekend/Weekday Pattern Extraction Bug (Medium)
**File:** `server.py:1224–1225`

```python
weekday_moods = [m for d, m in zip(day_of_week_analysis, [d.get("average_mood") for d in day_of_week_analysis]) if d.get("day_index", 0) < 5 and m]
```
This `zip`s `day_of_week_analysis` with itself and pairs each element `d` with its own `average_mood` as `m`, making `d` and `m` redundant. The filtering condition checks `d` (a dict) for `day_index`, which works, but the resulting `weekday_moods` and `weekend_moods` lists are never used — the actual averages are recomputed two lines later from `day_of_week_analysis`. The initial list comprehensions are dead code.

#### D5 — Double ID System in MongoDB (Low)
All documents are inserted with a custom `id` (UUID string) field alongside MongoDB's default `_id` (ObjectId). Queries always use `{"id": ...}`, making `_id` unused. This wastes a small amount of storage and means there is no unique index enforced by MongoDB on the `id` field.

**Recommendation:** Either use MongoDB's `_id` as the application ID (standard approach), or keep the custom `id` field but add a unique index: `await users_collection.create_index("id", unique=True)`.

---

### 10.3 Code Quality Issues

#### Q1 — Monolithic `server.py` (High — Maintainability)
All 1,900+ lines of application logic live in a single file. As the application grows, this creates merge conflicts, poor discoverability, and makes testing individual components difficult.

**Recommendation:** Split into routers by domain:
```
backend/
├── routers/
│   ├── auth.py
│   ├── mood_logs.py
│   ├── chat.py
│   ├── caregivers.py
│   ├── content.py
│   ├── dietary.py
│   └── notifications.py
├── services/
│   ├── ai_service.py
│   └── notification_service.py
├── models.py
├── auth.py
├── database.py
└── server.py   # Only app factory + router inclusion
```

#### Q2 — Repeated In-Function Imports (Low)
**File:** `server.py:667, 671–672`
```python
# Inside get_activity_details():
from emergentintegrations.llm.chat import UserMessage  # already imported at line 36
import json   # already imported at top
import re     # already imported at top
```
These are already imported at the module level and the in-function imports are redundant.

#### Q3 — Push Notification Stub Not Clearly Marked (Medium)
**File:** `server.py:160–170`
```python
async def send_push_notification(user_id: str, title: str, body: str, data: dict = None):
    """Send push notification to user's subscribed devices"""
    try:
        subscriptions = await push_subscriptions_collection.find(...).to_list(10)
        for sub in subscriptions:
            # In production, use web-push library
            logging.info(f"Push notification queued for user {user_id}: {title}")
```
The function silently does nothing in production while the UI allows users to subscribe to push notifications. Users who subscribe will never receive push alerts — including crisis alerts.

**Recommendation:** Either implement push delivery (e.g., `pywebpush`) or remove the push subscription endpoints until it is ready, and clearly document the gap.

#### Q4 — Content Library Has No Auth Requirement (Low — Design)
`GET /content` and `GET /content/{id}` do not require authentication. This may be intentional (public resource browsing), but it should be documented as a deliberate choice.

#### Q5 — Missing Database Indexes (Medium — Performance)
No indexes are created at startup. With growing data, common queries will become slow:

| Collection | Query Field | Recommended Index |
|-----------|-------------|------------------|
| `mood_logs` | `user_id`, `date` | Compound `(user_id, date)` |
| `chat_history` | `user_id` | Single field |
| `notifications` | `user_id`, `is_read` | Compound |
| `caregiver_relationships` | `patient_id`, `caregiver_id` | Both single-field |
| `users` | `email` | Unique single-field |
| `users` | `id` | Unique single-field |

---

### 10.4 Missing Features / TODOs

| Feature | Status | Priority |
|---------|--------|----------|
| Push notification delivery | Stub only | High |
| Password reset / forgot password | Not implemented | High |
| Email verification on registration | Not implemented | Medium |
| JWT token refresh / sliding session | Not implemented | Medium |
| Pagination on mood logs & content | `limit` param only, no cursor | Medium |
| Stripe integration | Dependency present, no routes | Low |
| Invitation expiry enforcement via background job | Manual check only on accept | Low |

---

### 10.5 Positive Observations

- **Crisis safety design is thoughtful.** Three-tier detection (critical → hard response, high → concern response, moderate → LLM with footer) is a pragmatic approach for a first implementation, and alerting caregivers automatically is a valuable safety net.
- **Pydantic v2 models are well-structured.** Clear separation between `Create`, `Update`, and `Read` model variants follows REST best practices.
- **Caregiver permission system is granular.** Fine-grained permissions (`view_mood_logs`, `view_analytics`, `receive_alerts`) and proper authorization checks on caregiver data access routes.
- **Async throughout.** All database operations and AI calls use `async/await`, keeping the event loop non-blocking.
- **Fallback responses for AI failures.** Dietary, activity, and suggestions endpoints all return sensible hardcoded fallback data when AI parsing fails, preventing a total service failure.
- **Frontend auth context is clean.** Token verification against the backend on app load (not just from localStorage) is a good pattern to catch invalidated or expired tokens early.
