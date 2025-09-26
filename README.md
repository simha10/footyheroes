# ⚽ FootyHeroes - Football Match Organization Platform

Welcome to FootyHeroes! A comprehensive platform for organizing football matches, connecting players, and managing team statistics.

## 📁 Project Structure

```
D:\footyheroes\
├── footy-backend/          # Node.js + Express + Socket.IO Backend API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # API endpoint handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Authentication, validation, etc.
│   │   ├── dtos/          # Data validation schemas
│   │   └── utils/         # Helper functions
│   ├── server.js          # Main server file
│   ├── package.json
│   └── README.md          # Backend documentation
│
└── FootyHeroes/           # React Native Mobile App
    ├── src/
    │   ├── screens/       # App screens
    │   ├── components/    # Reusable UI components
    │   ├── redux/         # State management
    │   ├── services/      # API calls
    │   ├── utils/         # Helper functions
    │   └── navigation/    # Navigation setup
    ├── android/           # Android-specific files
    ├── ios/              # iOS-specific files
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd D:\footyheroes\footy-backend

# Install dependencies (already done during setup)
npm install

# Start development server
npm run dev
```

**Backend will run on:** `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory  
cd D:\footyheroes\FootyHeroes

# Install dependencies (already done during setup)
npm install

# For Android
npx react-native run-android

# For iOS (macOS only)
npx react-native run-ios
```

## 🛠 Available Commands

### Backend (`D:\footyheroes\footy-backend`)
```bash
npm start      # Production server
npm run dev    # Development server (with auto-reload)
```

### Frontend (`D:\footyheroes\FootyHeroes`)
```bash
npx react-native run-android  # Run Android app
npx react-native run-ios      # Run iOS app  
npm test                       # Run tests
```

## 📱 Current Features

✅ **Authentication System**
- User registration with football-specific profiles
- JWT-based secure authentication
- Player location and skill level management
- Profile updates and nearby player discovery

✅ **Real-time Communication**
- Socket.IO integration for live updates
- Match room management
- Real-time chat functionality

## 🔗 API Endpoints

**Health Check:** `GET http://localhost:5000/health`

**Authentication:**
- `POST /api/auth/register` - Register new player
- `POST /api/auth/login` - Login player
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/nearby-players` - Find nearby players

## 🌟 Upcoming Features

- Match creation and management
- Player statistics tracking
- MVP voting system  
- Leaderboards and badges
- Push notifications
- Reputation and reporting system

## 🔧 Environment Setup

Create `.env` files in the backend directory with your configurations:

```bash
# Backend (.env)
MONGO_URI=mongodb://localhost:27017/footyheroes
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

## 📝 Testing the API

You can test the API endpoints using tools like:
- **Postman** - GUI API testing
- **curl** - Command line testing
- **Thunder Client** (VS Code extension)

Example API call:
```bash
# Test health endpoint
curl http://localhost:5000/health
```

## 🎯 Development Workflow

1. **Start Backend:** `cd D:\footyheroes\footy-backend && npm run dev`
2. **Start Frontend:** `cd D:\footyheroes\FootyHeroes && npx react-native run-android`
3. **Test API:** Use Postman or curl to test endpoints
4. **Monitor Logs:** Check console outputs for both backend and frontend

## 📚 Documentation

- **Backend API:** See `D:\footyheroes\footy-backend\README.md`
- **Frontend App:** See `D:\footyheroes\FootyHeroes\README.md`

## 🎉 Success!

Your FootyHeroes project is now ready for development at **D:\footyheroes**!

---

**Happy Coding! ⚽️**
