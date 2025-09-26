# FootyHeroes Backend API

FootyHeroes is a comprehensive football/soccer match organization and player management system. This backend API provides user authentication, player profiling, match management, real-time communication via Socket.IO, and more.

## 🚀 Features Implemented

### ✅ Completed Features

1. **Authentication System (JWT + Bcrypt)**
   - User registration with comprehensive validation
   - Login/logout functionality
   - JWT token generation and verification
   - Password hashing with bcrypt
   - Rate limiting for security
   - Account suspension/reactivation

2. **User/Player Profile Management**
   - Comprehensive user model with football-specific fields
   - Profile updates and validation
   - Geospatial location support for player discovery
   - Reputation scoring system
   - Player statistics tracking

3. **Match Creation & Management System**
   - Create matches (5v5, 7v7, 11v11 formats)
   - Location-based match discovery
   - Join/leave match functionality
   - Automatic team balancing
   - Match status management (open, full, ongoing, completed)
   - Score tracking and updates
   - Match search with advanced filters
   - Organizer controls (start, end, cancel)

4. **Real-time Communication (Socket.IO)**
   - Match room management
   - Real-time chat functionality
   - Live match updates and notifications
   - Player join/leave notifications
   - Score update broadcasting

### 🔄 Upcoming Features

- Dynamic player requests
- Match statistics logging
- MVP voting system
- Reputation and reporting system
- Leaderboards and badges
- Push notifications

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) + Bcrypt
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Environment**: dotenv

## 📁 Project Structure

```
footy-backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   └── authController.js     # Authentication endpoints
│   ├── services/
│   │   └── authService.js        # Business logic for auth
│   ├── models/
│   │   └── User.js               # User/Player mongoose model
│   ├── routes/
│   │   └── authRoutes.js         # Authentication routes
│   ├── middlewares/
│   │   └── authMiddleware.js     # Auth protection & rate limiting
│   ├── dtos/
│   │   └── auth.dto.js           # Validation schemas
│   └── utils/                    # Utility functions (TBD)
├── server.js                     # Main server file
├── package.json
├── .env                          # Environment variables
└── .env.example                  # Environment template
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone and setup the backend:**
   ```bash
   cd footy-backend
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   # Copy the example environment file
   copy .env.example .env
   
   # Edit .env with your configuration
   ```

3. **Environment Variables:**
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/footyheroes
   
   # Authentication
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # CORS Origin (Frontend URL)
   CLIENT_URL=http://localhost:3000
   ```

4. **Start MongoDB** (if running locally)

5. **Run the development server:**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user profile | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |
| GET | `/api/auth/nearby-players` | Find nearby players | Private |
| GET | `/api/auth/user/:username` | Get user by username | Public |
| POST | `/api/auth/refresh` | Refresh JWT token | Private |
| POST | `/api/auth/logout` | Logout user | Private |
| PUT | `/api/auth/deactivate` | Deactivate account | Private |
| PUT | `/api/auth/reactivate` | Reactivate account | Private |

### Match Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/matches` | Create new match | Private |
| GET | `/api/matches` | Search/list matches | Public |
| GET | `/api/matches/:id` | Get match by ID | Public |
| PUT | `/api/matches/:id` | Update match details | Private |
| DELETE | `/api/matches/:id` | Cancel match | Private |
| POST | `/api/matches/:id/join` | Join match | Private |
| POST | `/api/matches/:id/leave` | Leave match | Private |
| POST | `/api/matches/:id/start` | Start match | Private |
| POST | `/api/matches/:id/end` | End match | Private |
| PUT | `/api/matches/:id/score` | Update match score | Private |
| GET | `/api/matches/nearby/list` | Get nearby matches | Private |
| GET | `/api/matches/my/matches` | Get user's matches | Private |
| GET | `/api/matches/:id/stats` | Get match statistics | Private |
| GET | `/api/matches/:id/can-join` | Check join eligibility | Private |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health status |

## 📝 API Usage Examples

### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword",
    "position": "CM",
    "skillLevel": "Intermediate",
    "location": {
      "coordinates": [-74.006, 40.7128],
      "address": "New York, NY"
    }
  }'
```

### User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "identifier": "johndoe",
    "password": "securepassword"
  }'
```

### Get Current User Profile
```bash
curl -X GET http://localhost:5000/api/auth/me \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔌 Socket.IO Events

### Client to Server Events

- `join:user` - Join user-specific room
- `join:match` - Join match room
- `leave:match` - Leave match room
- `message:send` - Send chat message
- `player:request` - Request player for position
- `match:update` - Update match information
- `notification:send` - Send notification to user

### Server to Client Events

- `player:joined` - Player joined match
- `player:left` - Player left match
- `message:new` - New chat message
- `player:request:new` - New player request
- `match:updated` - Match information updated
- `notification:new` - New notification received

## 🏗 User Model Schema

```javascript
{
  // Basic Info
  name: String (required),
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  
  // Player Profile
  position: Enum (GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST),
  skillLevel: Enum (Beginner, Intermediate, Advanced, Semi-Pro, Professional),
  
  // Location (GeoJSON Point)
  location: {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: String
  },
  
  // Stats & Reputation
  reputationScore: Number (1-5, default: 3.0),
  matchesPlayed: Number (default: 0),
  goals: Number (default: 0),
  assists: Number (default: 0),
  shotsOnTarget: Number (default: 0),
  yellowCards: Number (default: 0),
  redCards: Number (default: 0),
  mvpAwards: Number (default: 0),
  
  // Account Status
  isActive: Boolean (default: true),
  isSuspended: Boolean (default: false),
  suspensionReason: String,
  suspensionExpiresAt: Date,
  
  // Metadata
  lastLogin: Date,
  profilePicture: String (URL),
  bio: String (max 200 chars),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: Configurable request limits per IP
- **Input Validation**: Comprehensive Joi validation schemas
- **CORS Configuration**: Secure cross-origin resource sharing
- **Auto-suspension**: Automatic account suspension for poor ratings
- **Account Management**: Activation/deactivation capabilities

## 🌍 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production MongoDB URI
4. Set up CORS for your domain

### Recommended Platforms
- **Backend**: Railway, Render, Heroku, AWS EC2
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3, Cloudinary (for profile pictures)

## 🧪 Development

### Available Scripts
```bash
npm start        # Production server
npm run dev      # Development server with nodemon
npm test         # Run tests (TBD)
```

### Code Style
- Use ES6+ features
- Follow MVC pattern
- Implement proper error handling
- Write descriptive comments
- Use meaningful variable names

## 🐛 Error Handling

The API implements comprehensive error handling:
- Input validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Rate limiting errors (429)
- Server errors (500)

## 📈 Next Steps

1. **Match Management System** - Create, join, leave matches
2. **Real-time Match Updates** - Live match events and statistics
3. **MVP Voting System** - Post-match player ratings
4. **Reputation System** - Enhanced player reputation tracking
5. **Leaderboards** - Global and local player rankings
6. **Push Notifications** - Firebase Cloud Messaging integration
7. **Admin Dashboard** - Match management and user moderation

## 📞 Support

For questions or issues:
1. Check the API documentation
2. Review error messages and logs
3. Ensure all environment variables are set
4. Verify MongoDB connection

## 📄 License

MIT License - feel free to use this project for learning and development.

---

**FootyHeroes** - Bringing football communities together! ⚽️