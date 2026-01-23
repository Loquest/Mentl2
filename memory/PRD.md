# Mentl - Mental Health Companion App

## Original Problem Statement
Build a comprehensive Mental Health Companion App for individuals with Bipolar, ADHD, Depression, and OCD, along with their caregivers.

## Core Features
- User Authentication (email/password)
- Customizable Mood & Symptom Tracking
- AI-Powered Chat Assistant for 24/7 support and crisis detection
- Educational Resource Library
- Caregiver Module with permission-based shared tracking
- Visual Analytics to identify patterns and triggers
- Personalized experience adapting to user's condition

## User Personas
1. **Patients** - Individuals managing mental health conditions
2. **Caregivers** - Family members/friends supporting patients

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Radix UI, Chart.js
- **Backend:** FastAPI, Python 3.11, MongoDB
- **AI:** emergentintegrations library (OpenAI GPT-5.2)
- **Authentication:** JWT

## Implementation Status

### ✅ Completed Features

#### Core MVP (December 2025)
- [x] User Authentication (register/login with JWT)
- [x] Dashboard with mood overview and quick actions
- [x] Mood Logging (rating, tags, symptoms, notes, medication tracking)
- [x] AI Chat with crisis detection and 24/7 support
- [x] Educational Resource Library with filtering
- [x] Visual Analytics (30-day trends, insights)
- [x] User Profile with editable details (age, weight, height, BMI)
- [x] Condition-specific support (Bipolar, ADHD, Depression, OCD)
- [x] AI-powered Activity Suggestions based on mood
- [x] Interactive Activity Details with step-by-step instructions
- [x] Expanded symptoms (10+ per condition)
- [x] Expanded educational resources (10+ per condition)

#### Caregiver Module (January 2025)
- [x] Caregiver invitation system
- [x] Permission-based access control (view logs, analytics, alerts)
- [x] Patient mood logs viewing for caregivers
- [x] Patient analytics viewing for caregivers
- [x] Caregiver relationship management
- [x] Notification system for caregiver actions
- [x] "People I Care For" dashboard for caregivers
- [x] Caregiver Network section on Dashboard
- [x] Caregiver quick-access icon in navigation

#### Enhanced Visual Analytics (January 2025)
- [x] Advanced Analytics API endpoint with pattern recognition
- [x] Overview tab with summary cards, area chart, mood distribution
- [x] Patterns tab with identified patterns and weekly analysis
- [x] Triggers tab with trigger identification and symptom impact
- [x] Correlations tab with sleep-mood and medication impact analysis
- [x] Day-of-week radar chart
- [x] Time range selector (7, 30, 90 days)
- [x] CSV data export functionality

#### Crisis Detection System (January 2025)
- [x] Multi-level distress detection (critical, high, moderate)
- [x] Comprehensive keyword-based crisis detection
- [x] Emergency resource suggestions with direct call links
- [x] Automatic caregiver alerts when crisis detected
- [x] Crisis alert banner in chat interface
- [x] Resource footer for moderate concern messages

#### Mood-Based Dietary Suggestions (January 2025)
- [x] Dietary preferences onboarding (diet type, allergies, intolerances, cultural preferences)
- [x] AI-powered food suggestions using GPT-5.2
- [x] Three suggestion formats: quick snacks, recipes, meal plans
- [x] Condition-specific nutrition (ADHD, Depression, Bipolar, OCD)
- [x] Time-of-day awareness for suggestions
- [x] Mood and energy level integration
- [x] Evidence-based clinical nutrition strategies
- [x] Dashboard compact Nutrition Suggestion component
- [x] Full Nutrition page with preferences management
- [x] Navigation integration

#### Email & Push Notifications (January 2025)
- [x] Email notifications for caregiver crisis alerts (Resend integration)
- [x] Crisis alert email templates with emergency resources
- [x] Push notification subscription management
- [x] Notification preferences settings (email & push toggles)
- [x] API endpoints for notification preferences and push subscriptions

#### Dark Mode Support (January 2025)
- [x] Theme context with localStorage persistence
- [x] System preference detection
- [x] Dark mode toggle in sidebar
- [x] Dark mode toggle in mobile header
- [x] Sidebar fully styled for dark mode
- [x] Smooth theme transitions

#### Onboarding Tutorial (January 2025)
- [x] 4-slide carousel tutorial after registration
- [x] Feature highlights: Mood Tracking, AI Chat, Insights, Caregivers
- [x] Skip button and keyboard navigation (arrows, Esc)
- [x] Dark mode support
- [x] "View Tutorial" option in Settings > Help tab
- [x] localStorage persistence (mentl_tutorial_completed)

### 🔄 In Progress
- None

### ✅ Recently Completed (January 2025)
- [x] Full dark mode support for all pages (Dashboard, Insights, Chat, Settings, etc.) - VERIFIED
- [x] Web Push notification service worker and Settings UI implementation - VERIFIED
- [x] Onboarding tutorial carousel with 4 slides - VERIFIED

### 📋 Backlog (P1 - High Priority)
- [ ] Weekly mood summary email reports
- [ ] Meal reminder notifications

### 📋 Backlog (P3 - Lower Priority)
- [ ] Export data functionality (extended formats)
- [ ] Weekly/monthly mood reports
- [ ] Social sharing features

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Mood Logging
- `POST /api/mood-logs` - Create mood log
- `GET /api/mood-logs` - Get mood logs
- `GET /api/mood-logs/{id}` - Get specific log
- `PUT /api/mood-logs/{id}` - Update log
- `DELETE /api/mood-logs/{id}` - Delete log
- `GET /api/mood-logs/analytics/summary` - Get analytics
- `GET /api/mood-logs/suggestions` - Get AI suggestions

### AI Features
- `POST /api/chat` - Chat with AI assistant
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/history` - Clear chat history
- `POST /api/activities/details` - Get activity instructions

### Educational Content
- `GET /api/content` - Get educational content
- `GET /api/content/{id}` - Get specific content

### Caregiver Module
- `POST /api/caregivers/invite` - Send caregiver invitation
- `GET /api/caregivers/invitations/sent` - Get sent invitations
- `GET /api/caregivers/invitations/received` - Get received invitations
- `POST /api/caregivers/invitations/{id}/accept` - Accept invitation
- `POST /api/caregivers/invitations/{id}/reject` - Reject invitation
- `DELETE /api/caregivers/invitations/{id}` - Cancel invitation
- `GET /api/caregivers` - Get my caregivers
- `GET /api/caregivers/patients` - Get my patients (as caregiver)
- `GET /api/caregivers/patients/{id}/mood-logs` - Get patient mood logs
- `GET /api/caregivers/patients/{id}/analytics` - Get patient analytics
- `PUT /api/caregivers/{id}/permissions` - Update permissions
- `DELETE /api/caregivers/{id}` - Remove relationship

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/{id}/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Database Collections
- `users` - User accounts and profiles
- `mood_logs` - Daily mood entries
- `chat_history` - AI chat conversations
- `content` - Educational resources
- `caregiver_invitations` - Pending caregiver invites
- `caregiver_relationships` - Active caregiver connections
- `notifications` - System notifications

## Test Credentials
- **Email:** test@example.com
- **Password:** test123

## File Structure
```
/app
├── backend/
│   ├── server.py        # Main FastAPI application
│   ├── models.py        # Pydantic models
│   ├── database.py      # MongoDB connection
│   ├── auth.py          # Authentication logic
│   ├── seed_content.py  # Content seeding script
│   └── tests/           # Backend tests
├── frontend/
│   └── src/
│       ├── pages/       # React pages
│       ├── components/  # Reusable components
│       ├── context/     # Auth context
│       └── utils/       # API utilities
└── memory/
    └── PRD.md           # This file
```
