# Mental Health Companion App - MindCare 💜

A comprehensive mental health companion application designed to support individuals with Bipolar Disorder, ADHD, and Depression. Built with React, FastAPI, and MongoDB.

## 🌟 Features

### Core Features
- **Mood & Symptom Tracking**: Daily mood logging with customizable symptom tracking based on selected conditions
- **AI Chat Assistant**: 24/7 AI-powered support using GPT-5.2 with crisis detection and contextual responses
- **Visual Analytics**: Track mood trends, patterns, and correlations with sleep and medication
- **Educational Library**: Curated mental health resources, articles, exercises, and videos
- **Personalized Experience**: Tailored content and tracking based on user's conditions
- **Data Export**: Export mood logs as CSV for sharing with healthcare providers

### Condition-Specific Support
- **Bipolar Disorder**: Elevated mood, irritability, impulsivity, racing thoughts tracking
- **ADHD**: Focus, restlessness, forgetfulness, task completion monitoring
- **Depression**: Low energy, hopelessness, loss of interest, concentration tracking

## 🏗️ Architecture

### Backend (FastAPI + MongoDB)
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Mood Logging API**: CRUD operations for mood logs with analytics
- **AI Chat Integration**: Emergent LLM integration with crisis detection
- **Content Management**: Educational resources API with filtering
- **Real-time Sync**: Async MongoDB operations for performance

### Frontend (React 19 + Tailwind CSS)
- **Component Library**: Radix UI components for accessibility
- **State Management**: React Context API for auth state
- **Routing**: React Router v7 with protected routes
- **Charts**: Recharts for data visualization
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py           # FastAPI application with all routes
│   ├── models.py           # Pydantic models for data validation
│   ├── auth.py             # JWT authentication utilities
│   ├── database.py         # MongoDB connection and collections
│   ├── seed_content.py     # Educational content seeder
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # Page components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── LogMood.js
│   │   │   ├── Insights.js
│   │   │   ├── Chat.js
│   │   │   ├── Library.js
│   │   │   └── Settings.js
│   │   ├── components/     # Reusable components
│   │   │   ├── Layout.js
│   │   │   └── ProtectedRoute.js
│   │   ├── context/        # React context providers
│   │   │   └── AuthContext.js
│   │   ├── utils/          # Utility functions
│   │   │   └── api.js
│   │   ├── App.js          # Main app with routing
│   │   └── index.js        # Entry point
│   ├── package.json        # Node dependencies
│   └── .env                # Environment variables
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB running on localhost:27017
- Yarn package manager

### Backend Setup

1. Navigate to backend directory:
```bash
cd /app/backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Seed the database with educational content:
```bash
python seed_content.py
```

4. Start the backend server (handled by supervisor):
```bash
sudo supervisorctl restart backend
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd /app/frontend
```

2. Install dependencies:
```bash
yarn install
```

3. Start the frontend (handled by supervisor):
```bash
sudo supervisorctl restart frontend
```

### Access the Application
- **Frontend**: https://moodally-8.preview.emergentagent.com
- **Backend API**: https://moodally-8.preview.emergentagent.com/api

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user with conditions
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Mood Logging
- `POST /api/mood-logs` - Create mood log
- `GET /api/mood-logs` - Get user's mood logs (with date range filter)
- `GET /api/mood-logs/{id}` - Get specific mood log
- `PUT /api/mood-logs/{id}` - Update mood log
- `DELETE /api/mood-logs/{id}` - Delete mood log
- `GET /api/mood-logs/analytics/summary` - Get analytics and insights

### AI Chat
- `POST /api/chat` - Send message to AI assistant
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/history` - Clear chat history

### Educational Content
- `GET /api/content` - List all content (with filters)
- `GET /api/content/{id}` - Get specific content item

## 🤖 AI Integration

The app uses **Emergent LLM Key** to access OpenAI's GPT-5.2 model through the `emergentintegrations` library.

### Features:
- Context-aware responses based on user's mood history
- Crisis keyword detection for immediate intervention
- Evidence-based therapeutic techniques (CBT, mindfulness)
- Supportive, non-judgmental tone
- Clear boundaries and professional help encouragement

### Crisis Detection:
If the AI detects keywords like "suicide", "kill myself", "self-harm", it immediately:
- Provides 988 Suicide & Crisis Lifeline information
- Offers Crisis Text Line (HOME to 741741)
- Encourages immediate professional help
- Maintains compassionate, supportive messaging

## 🎨 Design System

### Color Palette
- **Primary**: Purple (#8b5cf6) to Pink (#ec4899) gradient
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)
- **Background**: Soft gradient (blue-50, purple-50, pink-50)

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: 14-16px, readable line height
- **Accessible**: WCAG AA compliant contrast ratios

## 🔐 Security

- **Password Hashing**: Bcrypt with salt
- **JWT Tokens**: 7-day expiration
- **HTTPS**: All API calls over secure connection
- **Data Encryption**: MongoDB fields encrypted
- **CORS**: Configured for security
- **Input Validation**: Pydantic models for all requests

## 📊 Data Models

### User
```python
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "conditions": ["bipolar", "depression"],
  "preferences": {},
  "created_at": "timestamp"
}
```

### MoodLog
```python
{
  "id": "uuid",
  "user_id": "uuid",
  "date": "YYYY-MM-DD",
  "mood_rating": 7,  # 1-10
  "mood_tag": "Happy",
  "symptoms": {
    "low_energy": true,
    "difficulty_focusing": false
  },
  "notes": "Had a good day at work",
  "medication_taken": true,
  "sleep_hours": 7.5,
  "timestamp": "timestamp"
}
```

## 🧪 Testing

The app includes comprehensive test IDs for automated testing:
- All interactive elements have `data-testid` attributes
- Forms, buttons, inputs are testable
- Navigation and routing are testable

Example test IDs:
- `login-form`, `register-form`
- `mood-rating-slider`, `submit-mood-log-button`
- `chat-input`, `send-button`
- `dashboard`, `insights-page`

## 📱 Responsive Design

- **Mobile-first**: Optimized for mobile devices
- **Tablet-friendly**: Adaptive layouts for medium screens
- **Desktop**: Full-featured desktop experience
- **Bottom Navigation**: Mobile-specific navigation bar
- **Sidebar**: Desktop sidebar navigation

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚨 Crisis Resources

The app prominently displays crisis resources:
- **988 Suicide & Crisis Lifeline**: Call or text 988
- **Crisis Text Line**: Text HOME to 741741
- **NAMI Helpline**: 1-800-950-NAMI (6264)

## 📝 Environment Variables

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=mental_health_app
CORS_ORIGINS=*
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
EMERGENT_LLM_KEY=sk-emergent-910Dd9b5555C8F7D20
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://moodally-8.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

## 🎯 Future Enhancements

- Caregiver/Partner Module with shared tracking
- Push notifications and reminders
- Medication tracking with reminders
- Goal setting and progress tracking
- PDF report generation
- Multiple language support
- Dark mode theme
- Voice input for mood logging
- Integration with wearable devices

## 📄 License

This project is for educational and personal use.

## 🤝 Contributing

This is a personal mental health companion app. If you'd like to contribute or have suggestions, please reach out.

## ⚠️ Disclaimer

**This app is not a replacement for professional mental health care.** If you're experiencing a mental health crisis, please contact:
- **Emergency Services**: 911
- **988 Suicide & Crisis Lifeline**: Call or text 988
- **Crisis Text Line**: Text HOME to 741741

Always consult with qualified mental health professionals for diagnosis and treatment.

## 💜 Acknowledgments

- Built with love for mental health awareness
- Inspired by evidence-based therapeutic approaches
- Designed with accessibility and inclusivity in mind
- Powered by AI to provide 24/7 support

---

**MindCare** - Your mental health matters. We're here to support you. 💜
