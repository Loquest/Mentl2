# MindCare - Mental Health Companion App

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
- [x] Navigation integration

### 🔄 In Progress
- None

### 📋 Backlog (P1 - High Priority)
- [ ] **Enhanced Visual Analytics**
  - Advanced charts with pattern recognition
  - Trigger identification
  - Mood correlation analysis

### 📋 Backlog (P2 - Medium Priority)
- [ ] **Crisis Detection Enhancement**
  - AI-powered distress detection in chat
  - Emergency resource suggestions
  - Alert system for caregivers when patient shows concerning patterns

### 📋 Backlog (P3 - Lower Priority)
- [ ] Email notifications for caregiver alerts
- [ ] Push notifications
- [ ] Dark mode support
- [ ] Export data functionality
- [ ] Weekly/monthly mood reports

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
