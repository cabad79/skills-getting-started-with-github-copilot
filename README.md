# PersonalityMatch - Science-Based Dating Platform

A hybrid dating platform that uses the Big Five personality model and advanced matching algorithms to create meaningful connections. Built with privacy, science, and user experience as core principles.

## 🎯 Overview

PersonalityMatch combines cutting-edge psychology with modern technology to revolutionize online dating. Unlike traditional swipe-based apps, we use validated personality assessments, video emotion analysis, and uncertainty-aware matching algorithms to find truly compatible matches.

### Key Features

- **📊 Big Five Personality Assessment**: IPIP-50 validated questionnaire
- **🎥 Video Emotion Analysis**: TensorFlow.js facial expression detection
- **🔬 Scientific Matching**: Mahalanobis distance-based compatibility
- **💳 Fair Monetization**: $1 to unlock each match (no subscriptions)
- **💬 Encrypted Chat**: End-to-end encrypted messaging
- **🔐 Privacy-First**: All sensitive data encrypted (AES-256)
- **🌐 Hybrid Architecture**: Client-side for privacy + backend for discovery

## 🏗️ Architecture

### Hybrid Design Philosophy

**Version 1.0 (Pure Client-Side):**
- React SPA with SQL.js (SQLite in browser)
- Zero backend, complete privacy
- Deployed to S3 as static site
- Limited to showing multiple pre-loaded profiles

**Version 2.0 (Hybrid - This Branch):**
- React frontend + Node.js backend
- Backend handles authentication, matching, payments, chat
- Frontend maintains SQL.js for local data caching
- Enables real user discovery and monetization

### Technology Stack

#### Frontend
- **Framework**: React 18 + Vite
- **Database**: SQL.js (SQLite in WebAssembly)
- **Storage**: localForage (IndexedDB)
- **Routing**: React Router DOM 6
- **Deployment**: AWS S3 + CloudFront

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **Database**: PostgreSQL 14 + Sequelize ORM
- **Authentication**: Passport.js (Google OAuth + JWT)
- **Payments**: Stripe
- **Real-time**: Socket.io
- **Video Analysis**: TensorFlow.js Node, face-api.js
- **Email**: Nodemailer
- **Cache**: Redis (optional)
- **Deployment**: Docker + AWS ECS/EC2

## 📁 Project Structure

```
.
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── api/               # REST API routes
│   │   │   ├── auth.js        # Authentication endpoints
│   │   │   ├── profiles.js    # Profile management
│   │   │   ├── matches.js     # Matching endpoints
│   │   │   ├── payments.js    # Stripe integration
│   │   │   ├── videos.js      # Video upload & analysis
│   │   │   └── messages.js    # Chat REST API
│   │   ├── models/            # Sequelize database models
│   │   │   ├── User.js        # Authentication & profile
│   │   │   ├── Profile.js     # Personality & preferences
│   │   │   ├── Match.js       # Match records
│   │   │   ├── Payment.js     # Transactions
│   │   │   └── Message.js     # Encrypted messages
│   │   ├── services/          # Business logic
│   │   │   ├── matchingService.js     # Matching algorithm
│   │   │   ├── emotionAnalysisService.js  # Video analysis
│   │   │   ├── chatService.js  # Socket.io chat
│   │   │   ├── emailService.js # OTP emails
│   │   │   └── otpService.js  # 2FA logic
│   │   ├── middleware/        # Express middleware
│   │   │   └── auth.js        # JWT authentication
│   │   ├── config/            # Configuration
│   │   │   └── passport.js    # Passport strategies
│   │   ├── utils/             # Utilities
│   │   │   └── migrate.js     # Database migration
│   │   └── server.js          # Main server file
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── pages/             # Page components
│   │   │   ├── Welcome.jsx    # Landing page
│   │   │   ├── Consent.jsx    # Multi-step consent
│   │   │   ├── Questionnaire.jsx  # IPIP-50
│   │   │   ├── Results.jsx    # Big Five profile
│   │   │   └── Matches.jsx    # Browse matches
│   │   ├── utils/             # Utilities
│   │   │   ├── database.js    # SQL.js operations
│   │   │   └── matching.js    # Matching algorithm
│   │   ├── data/              # Static data
│   │   │   └── ipip50.js      # Questionnaire items
│   │   └── App.jsx            # Main app component
│   ├── deploy-s3.sh           # S3 deployment script
│   └── package.json
│
├── research/                   # Research specifications
│   └── behavior-analysis-dating-system/
│       ├── detailed_algorithm_specification.py
│       ├── implementation_checklist.md
│       └── README.md
│
├── docs/                       # Documentation
│   ├── FEATURES.md            # Feature specifications
│   ├── USER_MANUAL.md         # User guide
│   ├── SALES_MANUAL.md        # Sales & marketing
│   ├── ADMIN_MANUAL.md        # Admin operations
│   └── ARCHITECTURE.md        # Technical architecture
│
├── docker-compose.yml         # Local development stack
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- Redis (optional, for production)
- AWS CLI (for frontend deployment)

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd skills-getting-started-with-github-copilot

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run migrate

# Access application
# Backend: http://localhost:3001
# Database: localhost:5432
# Redis: localhost:6379
```

### Option 2: Manual Setup

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start PostgreSQL (if not using Docker)
# createdb personalitymatch

# Run migrations
npm run migrate

# Start server
npm run dev
# Backend runs on http://localhost:3001
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

## 🔧 Configuration

### Required Environment Variables

See `.env.example` for complete list. Key variables:

**Authentication:**
- `JWT_SECRET`: Secret for signing JWT tokens
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

**Database:**
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

**Payments:**
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `UNLOCK_PRICE`: Price in cents (default 100 = $1.00)

**Email:**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

**Security:**
- `ENCRYPTION_KEY`: 32-character hex key for AES-256

## 💡 How It Works

### 1. User Registration & Authentication

- Users sign up with **Google OAuth** or **Email/Password**
- Email users receive **OTP via email** for 2FA
- JWT tokens issued for API authentication
- Session managed with secure httpOnly cookies

### 2. Profile Creation

**Step 1: Personality Assessment**
- Users complete **IPIP-50 questionnaire** (50 items)
- Responses analyzed to calculate **Big Five traits**:
  - Openness to Experience
  - Conscientiousness
  - Extraversion
  - Agreeableness
  - Neuroticism (Emotional Stability)

**Step 2: Video Upload**
- Users record **30-60 second video** showing various emotions
- TensorFlow.js analyzes **facial expressions** in each frame
- Emotion profile created: happiness, surprise, neutral, etc.
- Enhances personality prediction accuracy

**Step 3: Profile Quality**
- System calculates **quality score** based on:
  - Questionnaire completion
  - Attention check results
  - Response time consistency
  - Video analysis confidence

### 3. Matching Algorithm

**Key Innovation: One Match at a Time**

Unlike traditional apps showing many profiles, PersonalityMatch shows **ONE match at a time**:

1. **Candidate Selection**
   - Find users not previously shown
   - Filter by preferences (age, gender, location)
   - Exclude already rejected/matched users

2. **Similarity Calculation**
   - Use **Mahalanobis distance** on Big Five traits
   - Account for **measurement uncertainty**
   - Generate **per-trait compatibility scores**

3. **Match Presentation**
   - Show basic info: age, gender, city, compatibility
   - **Contact hidden** until unlocked
   - User can **Like**, **Pass**, or **Pay to Unlock**

4. **Unlock & Chat**
   - User pays **$1** via Stripe
   - Contact info revealed (email)
   - **Chat enabled** via Socket.io
   - End-to-end encrypted messages

### 4. Payment Flow

1. User clicks "Unlock" on match
2. Frontend requests payment intent from backend
3. Stripe PaymentIntent created for $1
4. User enters payment details (Stripe Elements)
5. Payment processed securely by Stripe
6. Webhook confirms payment to backend
7. Match unlocked, chat enabled
8. User can message their match

### 5. Real-time Chat

- **Socket.io** WebSocket connections
- **End-to-end encryption** (AES-256)
- Real-time message delivery
- **Typing indicators**
- **Read receipts**
- Message history stored encrypted in database

## 📊 API Documentation

### REST Endpoints

**Authentication**
```
POST   /api/auth/register      - Register with email/password
POST   /api/auth/login         - Login with credentials
POST   /api/auth/verify-otp    - Verify OTP code
GET    /api/auth/google        - Google OAuth redirect
GET    /api/auth/me            - Get current user
```

**Profiles**
```
POST   /api/profiles           - Create/update profile
GET    /api/profiles/me        - Get own profile
PATCH  /api/profiles/visibility - Update visibility
GET    /api/profiles/stats     - Get statistics
```

**Matching**
```
GET    /api/matches/next       - Get next match (ONE)
POST   /api/matches/:id/like   - Like a match
POST   /api/matches/:id/reject - Reject match
GET    /api/matches/unlocked/list - Get unlocked matches
```

**Payments**
```
POST   /api/payments/create-intent - Create $1 payment
POST   /api/payments/webhook   - Stripe webhook (internal)
GET    /api/payments/history   - Payment history
```

**Videos**
```
POST   /api/videos/upload      - Upload emotion video
GET    /api/videos/analysis    - Get analysis results
DELETE /api/videos             - Delete video
```

**Messages**
```
GET    /api/messages/match/:id - Get conversation
GET    /api/messages/unread    - Unread count
GET    /api/messages/conversations - All conversations
```

### Socket.io Events

See backend/README.md for complete Socket.io event documentation.

## 🔬 Scientific Foundation

### Big Five Personality Model

PersonalityMatch uses the **Big Five** (OCEAN) model, the most scientifically validated personality framework:

1. **Openness**: Imagination, creativity, openness to new experiences
2. **Conscientiousness**: Organization, responsibility, self-discipline
3. **Extraversion**: Sociability, assertiveness, energy level
4. **Agreeableness**: Compassion, cooperation, trust
5. **Neuroticism**: Emotional stability, anxiety, stress response

### IPIP-50 Questionnaire

- 50-item validated assessment
- Derived from International Personality Item Pool
- 10 items per trait (5 forward, 5 reverse-keyed)
- Response scale: 1 (Strongly Disagree) to 5 (Strongly Agree)
- Attention checks embedded to detect careless responding

### Matching Algorithm

**Mahalanobis Distance:**
- Accounts for correlation between traits
- Uncertainty-weighted (confidence in measurements)
- Superior to Euclidean distance for personality matching

**Formula:**
```
similarity = exp(-0.5 * Σ(diff²/variance))
```

where:
- `diff` = difference in trait scores
- `variance` = combined measurement uncertainty
- Result: 0-1 score (1 = perfect match)

### Video Emotion Analysis

- **TensorFlow.js** with face-api.js models
- Detects 7 emotions: neutral, happy, sad, angry, fearful, disgusted, surprised
- Analyzes 20-30 frames per video
- Aggregates to create **emotion profile**
- Research shows facial expressions correlate with Big Five traits

## 🔐 Security & Privacy

### Data Protection

- **Encryption at Rest**: AES-256-CBC for sensitive fields
- **Encryption in Transit**: TLS 1.3 (HTTPS)
- **Message Encryption**: End-to-end in chat
- **Password Hashing**: bcrypt with 12 rounds
- **Token Security**: JWT with 7-day expiration

### Privacy Features

- Only **minimal data** stored: ID, gender, location, email
- Location stored as **city-level** only (no precise GPS)
- Videos stored securely, deleted on request
- Users can **hide profile** anytime
- GDPR-compliant data export/deletion

### Security Measures

- Rate limiting: 100 requests / 15 min
- Input validation on all endpoints
- CORS restricted to frontend domain
- Helmet.js security headers
- SQL injection protection (Sequelize ORM)
- XSS protection (React escaping)

## 📈 Roadmap

### Version 2.1 (Q1 2025)
- [ ] Mobile app (React Native)
- [ ] Advanced preferences (interests, values)
- [ ] Mutual match notifications
- [ ] Profile verification badges

### Version 2.2 (Q2 2025)
- [ ] Video calls (WebRTC)
- [ ] Icebreaker suggestions
- [ ] Date planning features
- [ ] Success stories section

### Version 3.0 (Q3 2025)
- [ ] AI-powered conversation starters
- [ ] Relationship compatibility reports
- [ ] Event matching (group activities)
- [ ] Premium features tier

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### End-to-End Tests

```bash
npm run test:e2e
```

## 📦 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

**Quick Deploy:**

```bash
# Frontend to S3
cd frontend
./deploy-s3.sh your-bucket-name

# Backend with Docker
docker-compose up -d --build
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@personalitymatch.com

## 🙏 Acknowledgments

- Big Five personality research community
- Open-source contributors
- TensorFlow.js and face-api.js teams
- Users providing feedback during beta

---

**Built with ❤️ and science**

For the original GitHub Skills exercise, see [README.github.md](README.github.md)
