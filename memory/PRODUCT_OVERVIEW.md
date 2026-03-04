# Mentl - Product Overview Document
## Comprehensive Mental Health Companion Application

**Version:** 2.0  
**Last Updated:** February 2025  
**Status:** Production Ready

---

## 📋 Executive Summary

**Mentl** is a comprehensive mental health companion application designed to support individuals managing mental health conditions (Bipolar Disorder, ADHD, Depression, and OCD) along with their caregivers. The app combines AI-powered support, mood tracking, condition-specific tools, and a robust caregiver network to provide 24/7 mental health assistance.

### Key Value Propositions
- 🧠 **AI-Powered Support** - 24/7 chat assistant with crisis detection
- 📊 **Data-Driven Insights** - Visual analytics to identify patterns and triggers
- 🛠️ **Condition-Specific Tools** - Specialized features for ADHD, Depression, Bipolar, OCD
- 👥 **Caregiver Network** - Permission-based shared tracking for support systems
- 🎮 **Gamification** - Streaks, badges, and rewards to maintain engagement

---

## 🎯 Target Users

### Primary Users: Patients
Individuals actively managing one or more mental health conditions who need:
- Daily mood and symptom tracking
- Immediate support during difficult moments
- Tools to improve focus and productivity (ADHD)
- Pattern recognition to understand triggers
- Dietary and activity guidance based on mood

### Secondary Users: Caregivers
Family members, friends, or healthcare providers who:
- Monitor loved ones' mental health remotely
- Receive alerts during crisis situations
- Access analytics to understand patterns
- Coordinate care and support

---

## 🏗️ Technical Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TailwindCSS, Radix UI, Chart.js |
| **Backend** | FastAPI (Python 3.11) |
| **Database** | MongoDB |
| **AI/ML** | OpenAI GPT-5.2 via emergentintegrations |
| **Authentication** | JWT (JSON Web Tokens) |
| **Email** | Resend API |
| **Notifications** | Web Push API, Service Workers |

### Database Schema

```
Collections:
├── users                    # User accounts, profiles, preferences
├── mood_logs               # Daily mood entries with symptoms
├── chat_history            # AI conversation history
├── content                 # Educational resources
├── caregiver_invitations   # Pending caregiver invites
├── caregiver_relationships # Active caregiver connections
├── notifications           # System notifications
├── push_subscriptions      # Push notification subscriptions
├── tasks                   # ADHD task chunking
├── pomodoro_sessions       # Focus timer sessions
├── pomodoro_settings       # User timer preferences
└── dopamine_items          # Quick reward activities
```

---

## ✅ Complete Feature List

### 1. User Authentication & Profile
| Feature | Description |
|---------|-------------|
| Email/Password Registration | Secure account creation with condition selection |
| JWT Authentication | Token-based secure sessions |
| User Profile | Editable age, weight, height, BMI calculation |
| Condition Management | Add/remove mental health conditions |
| Dietary Preferences | Diet type, allergies, intolerances, cultural preferences |
| Onboarding Tutorial | 4-slide carousel introducing app features |

### 2. Mood & Symptom Tracking
| Feature | Description |
|---------|-------------|
| Daily Mood Logging | 1-10 scale mood rating |
| Energy Level Tracking | 1-10 scale energy rating |
| Sleep Hours | Track sleep duration |
| Symptom Selection | 10+ condition-specific symptoms per condition |
| Medication Tracking | Log medication adherence |
| Notes | Free-form journaling with each entry |
| Historical View | Browse past mood entries |

**Supported Conditions & Symptoms:**

| Condition | Sample Symptoms |
|-----------|-----------------|
| **ADHD** | Difficulty focusing, Hyperactivity, Impulsivity, Forgetfulness, Procrastination, Time blindness, Emotional dysregulation, Sensory overload, Rejection sensitivity, Decision paralysis |
| **Depression** | Persistent sadness, Loss of interest, Fatigue, Sleep changes, Appetite changes, Difficulty concentrating, Feelings of worthlessness, Social withdrawal, Physical aches, Hopelessness |
| **Bipolar** | Elevated mood, Racing thoughts, Decreased sleep need, Grandiosity, Depressive episodes, Irritability, Rapid speech, Risky behavior, Mixed episodes, Mood cycling |
| **OCD** | Intrusive thoughts, Compulsive behaviors, Checking rituals, Contamination fears, Ordering/symmetry needs, Mental rituals, Avoidance behaviors, Doubt and uncertainty, Fear of harm, Hoarding tendencies |

### 3. AI-Powered Chat Assistant
| Feature | Description |
|---------|-------------|
| 24/7 Availability | Always-on AI support |
| Context Awareness | Understands user's conditions and recent mood |
| Crisis Detection | Multi-level distress detection (critical, high, moderate) |
| Emergency Resources | Direct links to hotlines (988, Crisis Text Line) |
| Coping Strategies | CBT techniques, grounding exercises |
| Conversation History | Persistent chat across sessions |
| Caregiver Alerts | Automatic notification when crisis detected |

**Crisis Detection Levels:**
- 🔴 **Critical** - Immediate danger keywords → Emergency banner + caregiver alert
- 🟠 **High** - Severe distress indicators → Crisis resources + caregiver notification
- 🟡 **Moderate** - Mild concern keywords → Resource footer in response

### 4. Visual Analytics Dashboard
| Tab | Features |
|-----|----------|
| **Overview** | Summary cards, 30-day area chart, mood distribution pie chart |
| **Patterns** | AI-identified patterns, weekly analysis, day-of-week radar |
| **Triggers** | Trigger identification, symptom impact analysis |
| **Correlations** | Sleep-mood correlation, medication impact |

**Additional Features:**
- Time range selector (7, 30, 90 days)
- CSV data export
- Pattern recognition AI
- Trend identification (improving/stable/declining)

### 5. Caregiver Module
| Feature | Description |
|---------|-------------|
| Invitation System | Email-based caregiver invitations |
| Permission Control | Granular access (view logs, analytics, receive alerts) |
| Patient Dashboard | "People I Care For" overview |
| Remote Monitoring | View patient mood logs and analytics |
| Crisis Alerts | Email notifications during patient crisis |
| Relationship Management | Add/remove caregivers |

### 6. Educational Resource Library
| Feature | Description |
|---------|-------------|
| Condition Filtering | Browse by ADHD, Depression, Bipolar, OCD |
| Content Types | Articles, techniques, coping strategies |
| Search | Find specific topics |
| 10+ Resources | Per condition |

### 7. AI-Powered Suggestions
| Type | Description |
|------|-------------|
| **Activity Suggestions** | Personalized activities based on current mood and energy |
| **Dietary Suggestions** | Mood-based nutrition (snacks, recipes, meal plans) |
| **Time-of-Day Awareness** | Suggestions appropriate for morning/afternoon/evening |

### 8. Notification System
| Type | Description |
|------|-------------|
| **Email Notifications** | Crisis alerts to caregivers via Resend |
| **Push Notifications** | Browser push for reminders and alerts |
| **In-App Notifications** | Caregiver actions, system messages |
| **Preference Management** | Toggle email/push per notification type |

### 9. Dark Mode
| Feature | Description |
|---------|-------------|
| System Detection | Auto-detects OS preference |
| Manual Toggle | Sidebar and mobile header controls |
| Persistent | Saved to localStorage |
| Full Coverage | All pages and components styled |

---

## 🛠️ ADHD Tools Suite (Condition-Specific)

The ADHD Tools suite is a comprehensive productivity system designed specifically for the ADHD brain. It's only visible to users who have ADHD in their conditions.

### Phase 1: Core Productivity Tools

#### Task Chunking Engine
- **AI-Powered Breaking** - GPT-5.2 breaks large tasks into 5-7 small steps
- **Smart Ordering** - Easiest tasks first to build momentum
- **Time Estimates** - Each chunk has estimated duration (5-15 min)
- **Progress Tracking** - Visual progress bar per task
- **Completion Marking** - Click to mark chunks done

#### Focus Session (Integrated Task + Timer)
- **Guided Workflow** - Full-screen immersive focus mode
- **Auto-Timer** - Timer automatically set to chunk duration
- **Break Management** - 5-minute breaks between chunks
- **Sound Notifications** - Audio chimes on phase completion
- **Vibration Alerts** - Mobile vibration patterns
- **Progress Visualization** - Chunk tracker at bottom
- **Celebration Screen** - Confetti and stats on completion

#### Adaptive Pomodoro System
- **Customizable Duration** - Not fixed to 25 minutes
- **Session Tracking** - Records all focus sessions
- **Focus Rating** - Self-report quality (1-10)
- **Interruption Counter** - Track distractions
- **Historical Stats** - Sessions, total time, avg focus
- **Smart Suggestions** - Recommends optimal duration based on history

#### Dopamine Menu
- **12 Pre-Seeded Activities** - Quick dopamine boosts
- **Categories** - Micro (1-2min), Short (5-10min), Medium (15-30min), Reward (30+min)
- **Energy Levels** - Filter by low/medium/high energy
- **Favorites** - Star your go-to activities
- **Custom Activities** - Add your own
- **Surprise Me!** - Random picker
- **Usage Tracking** - See which activities you use most

### Phase 2: Awareness & Gamification

#### Time Blindness Guard
- **Accuracy Tracking** - Estimated vs actual time comparison
- **Accuracy Score** - Overall percentage
- **Recent Estimates** - Last 10 tasks with accuracy
- **Tips Section** - Strategies to improve time awareness
- **Focus Time Stats** - Total hours tracked

#### Energy-Aware Scheduling
- **Peak Hour Analysis** - Identifies best productivity times
- **Mood Data Integration** - Uses mood logs to find patterns
- **Hourly Energy Chart** - Visual daily energy pattern
- **Recommendations** - "Schedule demanding tasks in the morning"
- **Low Energy Detection** - Suggests easier tasks for slumps

#### Rewards Center (Gamification)
- **Level System** - Level up with XP
- **XP Earning** - 10 XP per task, 5 XP per session, 2 XP per chunk
- **Streak Tracking** - Consecutive days with activity
- **Badges System:**
  - 🚀 First Step - Complete first task
  - 🏆 Task Master - 10 tasks completed
  - 👑 Task Champion - 50 tasks completed
  - 🔥 Focus Warrior - 10 focus sessions
  - ⚡ Focus Master - 50 focus sessions
  - 🔥 On Fire - 3-day streak
  - ⭐ Weekly Warrior - 7-day streak
  - 🏅 Unstoppable - 30-day streak
  - ⏰ Hour of Power - 1 hour total focus
  - 🎖️ Focus Legend - 10 hours total focus
- **Weekly Progress** - This week's tasks and sessions

---

## 📱 User Interface

### Navigation Structure
```
Desktop Sidebar:
├── Dashboard
├── Log Mood
├── Insights
├── Nutrition
├── AI Chat
├── Library
├── Tools (ADHD only)
├── Caregivers
├── Profile
└── Settings

Mobile Bottom Nav (5 items):
├── Dashboard
├── Log Mood
├── Insights
├── AI Chat
└── Tools (ADHD) / Nutrition (non-ADHD)
```

### Pages Overview

| Page | Description |
|------|-------------|
| `/dashboard` | Overview with mood trends, suggestions, caregiver network |
| `/log-mood` | Create new mood entry |
| `/insights` | Visual analytics with 4 tabs |
| `/nutrition` | Dietary suggestions and preferences |
| `/chat` | AI assistant conversation |
| `/library` | Educational resources |
| `/tools` | ADHD productivity suite (6 tabs) |
| `/caregivers` | Manage caregiver relationships |
| `/settings` | Profile, notifications, help |
| `/login` | User login |
| `/register` | New user registration |

---

## 🔌 API Reference

### Authentication Endpoints
```
POST /api/auth/register     - Create new account
POST /api/auth/login        - Authenticate user
GET  /api/auth/me           - Get current user profile
PUT  /api/auth/profile      - Update profile
```

### Mood Logging Endpoints
```
POST   /api/mood-logs                    - Create mood entry
GET    /api/mood-logs                    - List mood entries
GET    /api/mood-logs/{id}               - Get specific entry
PUT    /api/mood-logs/{id}               - Update entry
DELETE /api/mood-logs/{id}               - Delete entry
GET    /api/mood-logs/analytics/summary  - Get analytics
GET    /api/mood-logs/suggestions        - Get AI suggestions
```

### AI & Content Endpoints
```
POST   /api/chat              - Send message to AI
GET    /api/chat/history      - Get conversation history
DELETE /api/chat/history      - Clear history
POST   /api/activities/details - Get activity instructions
GET    /api/content           - Get educational content
```

### Caregiver Endpoints
```
POST   /api/caregivers/invite                    - Send invitation
GET    /api/caregivers/invitations/sent          - Sent invitations
GET    /api/caregivers/invitations/received      - Received invitations
POST   /api/caregivers/invitations/{id}/accept   - Accept
POST   /api/caregivers/invitations/{id}/reject   - Reject
DELETE /api/caregivers/invitations/{id}          - Cancel
GET    /api/caregivers                           - My caregivers
GET    /api/caregivers/patients                  - My patients
GET    /api/caregivers/patients/{id}/mood-logs   - Patient logs
GET    /api/caregivers/patients/{id}/analytics   - Patient analytics
PUT    /api/caregivers/{id}/permissions          - Update permissions
DELETE /api/caregivers/{id}                      - Remove relationship
```

### ADHD Tools Endpoints
```
# Task Chunking
POST   /api/tools/tasks                          - Create task (AI chunks)
GET    /api/tools/tasks                          - List tasks
GET    /api/tools/tasks/{id}                     - Get task
PUT    /api/tools/tasks/{id}                     - Update task
PUT    /api/tools/tasks/{id}/chunks/{chunk_id}   - Update chunk
DELETE /api/tools/tasks/{id}                     - Delete task

# Pomodoro
POST   /api/tools/pomodoro/sessions              - Start session
GET    /api/tools/pomodoro/sessions              - Session history
PUT    /api/tools/pomodoro/sessions/{id}         - Update session
GET    /api/tools/pomodoro/stats                 - Get statistics
GET    /api/tools/pomodoro/settings              - Get settings
PUT    /api/tools/pomodoro/settings              - Update settings

# Dopamine Menu
GET    /api/tools/dopamine                       - List items
POST   /api/tools/dopamine                       - Create custom item
PUT    /api/tools/dopamine/{id}                  - Update item
POST   /api/tools/dopamine/{id}/use              - Mark as used
DELETE /api/tools/dopamine/{id}                  - Delete item
GET    /api/tools/dopamine/random                - Random picker

# Phase 2
GET    /api/tools/time-blindness/stats           - Time accuracy stats
GET    /api/tools/energy/patterns                - Energy patterns
GET    /api/tools/rewards/stats                  - Gamification stats
```

### Notification Endpoints
```
GET  /api/notifications              - List notifications
PUT  /api/notifications/{id}/read    - Mark as read
PUT  /api/notifications/read-all     - Mark all as read
POST /api/push-subscriptions         - Subscribe to push
DELETE /api/push-subscriptions       - Unsubscribe
GET  /api/push/vapid-public-key      - Get VAPID key
```

---

## 📊 Key Metrics & Data Points

### Mood Tracking Data Captured
- Mood rating (1-10)
- Energy level (1-10)
- Sleep hours
- Symptoms (multi-select from condition-specific list)
- Medication taken (boolean)
- Notes (free text)
- Timestamp

### Analytics Generated
- Average mood over time periods
- Mood trend direction
- Top symptoms frequency
- Sleep-mood correlation coefficient
- Medication impact on mood
- Day-of-week patterns
- Identified triggers
- Pattern recognition

### ADHD Metrics
- Task completion rate
- Time estimation accuracy
- Focus session count and duration
- Streak length
- XP and level
- Badge achievements
- Peak productivity hours
- Energy patterns by hour

---

## 🔒 Security & Privacy

### Data Protection
- JWT-based authentication with expiration
- Password hashing (bcrypt)
- MongoDB data encryption at rest
- HTTPS-only communication
- User-specific data isolation

### Caregiver Privacy Controls
- Explicit permission granting required
- Granular access levels
- Revocable access at any time
- Activity logging for audit

### Crisis Handling
- Automatic detection, no manual reporting needed
- Direct emergency hotline links
- Caregiver notification with user consent
- Resource provision without data sharing

---

## 🚀 Future Roadmap

### Phase 3: ADHD Tools (Planned)
- [ ] Body Doubling Mode (AI companion)
- [ ] Task Initiation Prompting
- [ ] Forgetfulness Recovery System
- [ ] Distraction Shield

### Additional Features (Backlog)
- [ ] Weekly mood summary email reports
- [ ] Meal reminder push notifications
- [ ] Extended data export formats
- [ ] Social sharing features
- [ ] Integration with wearables

---

## 📞 Support & Resources

### Crisis Resources (Built-in)
- **988 Suicide & Crisis Lifeline** - Call or text 988
- **Crisis Text Line** - Text HOME to 741741
- **International Association for Suicide Prevention** - https://www.iasp.info/resources/Crisis_Centres/

### Test Credentials
- **Email:** test@example.com
- **Password:** test123

---

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI application (2800+ lines)
│   ├── models.py          # Pydantic data models
│   ├── database.py        # MongoDB connection
│   ├── auth.py            # JWT authentication
│   ├── seed_content.py    # Educational content seeder
│   ├── requirements.txt   # Python dependencies
│   └── tests/             # pytest test suite
│
├── frontend/
│   ├── public/
│   │   ├── index.html     # App entry point
│   │   └── sw.js          # Push notification service worker
│   └── src/
│       ├── pages/         # 13 React page components
│       │   ├── Dashboard.js
│       │   ├── LogMood.js
│       │   ├── Insights.js
│       │   ├── Chat.js
│       │   ├── Library.js
│       │   ├── Settings.js
│       │   ├── Caregivers.js
│       │   ├── Nutrition.js
│       │   ├── Tools.js   # ADHD suite (1700+ lines)
│       │   ├── ActivityDetail.js
│       │   ├── Login.js
│       │   └── Register.js
│       ├── components/
│       │   ├── Layout.js
│       │   ├── ProtectedRoute.js
│       │   ├── ActivitySuggestions.js
│       │   ├── DietarySuggestions.js
│       │   ├── OnboardingTutorial.js
│       │   └── ui/        # Shadcn components
│       ├── context/
│       │   ├── AuthContext.js
│       │   └── ThemeContext.js
│       └── utils/
│           ├── api.js
│           ├── darkMode.js
│           └── pushNotifications.js
│
├── memory/
│   └── PRD.md             # Product requirements
│
└── test_reports/          # Testing artifacts
    └── iteration_*.json
```

---

## 📈 Development Timeline

| Phase | Date | Features |
|-------|------|----------|
| MVP | Dec 2025 | Core auth, mood tracking, AI chat, analytics, library |
| Caregiver | Jan 2025 | Full caregiver module with permissions |
| Analytics+ | Jan 2025 | Enhanced analytics with patterns, triggers, correlations |
| Crisis | Jan 2025 | Multi-level crisis detection and alerts |
| Nutrition | Jan 2025 | AI dietary suggestions |
| Notifications | Jan 2025 | Email and push notifications |
| Dark Mode | Jan 2025 | Full dark mode support |
| Onboarding | Jan 2025 | Tutorial carousel |
| ADHD Phase 1 | Jan 2025 | Task chunking, Pomodoro, Dopamine menu |
| ADHD Phase 2 | Feb 2025 | Time guard, Energy scheduling, Rewards |

---

*Document generated February 2025*  
*Mentl - Your Mental Health Companion*
