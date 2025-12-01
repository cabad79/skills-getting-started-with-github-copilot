# PersonalityMatch Backend API

Hybrid backend server for the PersonalityMatch dating platform with personality-based matching, payment processing, video emotion analysis, and real-time chat.

## Features

- **Authentication**
  - Google OAuth 2.0
  - Email/Password with OTP 2FA
  - JWT token-based authentication

- **Profile Management**
  - Big Five personality assessment (IPIP-50)
  - Video emotion analysis
  - Encrypted user data
  - Quality scoring

- **Matching Algorithm**
  - Mahalanobis distance-based similarity
  - Uncertainty-aware matching
  - One match at a time (pay-to-unlock model)

- **Payment Processing**
  - Stripe integration
  - $1 profile unlock payments
  - Webhook handling
  - Payment history

- **Real-time Chat**
  - Socket.io messaging
  - End-to-end encryption
  - Typing indicators
  - Read receipts

- **Video Analysis**
  - Facial emotion detection
  - TensorFlow.js integration
  - Multi-frame analysis

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Real-time**: Socket.io
- **Authentication**: Passport.js (Google OAuth, JWT)
- **Payments**: Stripe
- **Video Analysis**: TensorFlow.js, face-api.js
- **Email**: Nodemailer
- **Caching**: Redis

## Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis (optional, for production)

### Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
   - Database credentials (PostgreSQL)
   - JWT secret
   - Google OAuth credentials
   - Stripe API keys
   - SMTP settings for email
   - Encryption key (32 characters)

4. Create PostgreSQL database:
```bash
createdb personalitymatch
```

5. Run database migrations (development):
```bash
npm run migrate
```

## Usage

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3001`

### Production

```bash
npm start
```

### Database Migration

```bash
npm run migrate
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Profiles
- `POST /api/profiles` - Create/update profile
- `GET /api/profiles/me` - Get own profile
- `PATCH /api/profiles/visibility` - Update visibility settings
- `PATCH /api/profiles/preferences` - Update matching preferences
- `GET /api/profiles/stats` - Get profile statistics

### Matching
- `GET /api/matches/next` - Get next match (ONE at a time)
- `GET /api/matches/:matchId` - Get match details
- `POST /api/matches/:matchId/like` - Like a match
- `POST /api/matches/:matchId/reject` - Reject a match
- `GET /api/matches/unlocked/list` - Get unlocked matches
- `GET /api/matches/history` - Get match history

### Payments
- `POST /api/payments/create-intent` - Create payment intent ($1 unlock)
- `POST /api/payments/webhook` - Stripe webhook (internal)
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/:paymentId` - Get payment details
- `GET /api/payments/stats` - Get payment statistics

### Videos
- `POST /api/videos/upload` - Upload and analyze emotion video
- `GET /api/videos/analysis` - Get video analysis results
- `DELETE /api/videos` - Delete uploaded video
- `GET /api/videos/requirements` - Get upload requirements

### Messages (REST)
- `GET /api/messages/match/:matchId` - Get conversation messages
- `GET /api/messages/unread` - Get unread count
- `GET /api/messages/conversations` - Get all conversations
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/messages/:messageId/flag` - Flag message

### Socket.io Events

**Client → Server:**
- `join_match` - Join a match chat room
- `send_message` - Send a message
- `mark_read` - Mark messages as read
- `typing` - Send typing indicator
- `stop_typing` - Stop typing indicator

**Server → Client:**
- `connected` - Connection confirmation
- `match_joined` - Successfully joined match
- `new_message` - New message received
- `message_notification` - Message notification
- `messages_marked_read` - Messages marked as read
- `messages_read` - Your messages were read
- `user_typing` - Other user is typing
- `user_stopped_typing` - Other user stopped typing
- `user_joined_match` - Other user joined match
- `error` - Error message

## Architecture

### Data Flow

1. **User Registration**
   - User registers with email/password or Google OAuth
   - OTP sent to email for 2FA
   - User verifies OTP
   - JWT token issued

2. **Profile Creation**
   - User completes IPIP-50 questionnaire
   - User uploads emotion video
   - Video analyzed with TensorFlow.js
   - Profile quality score calculated

3. **Matching**
   - User requests next match
   - Backend finds best match using Mahalanobis distance
   - ONE profile shown (not multiple)
   - Basic info visible (age, gender, location, compatibility)

4. **Payment & Unlock**
   - User pays $1 via Stripe
   - Webhook confirms payment
   - Match unlocked
   - Full contact info revealed
   - Chat enabled

5. **Chat**
   - Users connect via Socket.io
   - Messages encrypted end-to-end
   - Real-time delivery
   - Read receipts

### Security

- **Data Encryption**: AES-256-CBC for sensitive fields
- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: Signed with secret, 7-day expiration
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: express-validator on all inputs
- **CORS**: Restricted to frontend domain
- **Helmet**: Security headers enabled

### Database Schema

**Tables:**
- `users` - Authentication and basic info
- `profiles` - Personality traits and preferences
- `matches` - Match records with unlock status
- `payments` - Payment transactions
- `messages` - Encrypted chat messages

See `src/models/` for complete schema definitions.

## Environment Variables

Required variables (see `.env.example` for full list):

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=personalitymatch
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
UNLOCK_PRICE=100  # $1.00 in cents

# Encryption
ENCRYPTION_KEY=your_32_character_key_here

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## Development

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Database Reset (Development Only)

```bash
# Drop and recreate database
dropdb personalitymatch
createdb personalitymatch
npm run migrate
```

## Deployment

### Docker (Coming Soon)

```bash
docker-compose up -d
```

### Manual Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set all required environment variables
4. Run `npm start`
5. Set up reverse proxy (nginx)
6. Configure SSL/TLS certificates
7. Set up monitoring and logging

## Monitoring

Health check endpoint: `GET /health`

Returns:
```json
{
  "status": "ok",
  "timestamp": "2025-12-01T00:00:00.000Z",
  "uptime": 12345,
  "environment": "production"
}
```

## License

MIT

## Support

For issues and feature requests, please contact the development team.
