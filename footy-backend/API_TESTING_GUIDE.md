# 🧪 FootyHeroes API Testing Guide

This guide provides comprehensive examples for testing all FootyHeroes API endpoints using curl, Postman, or any HTTP client.

## 🚀 Server Status

Backend running at: `http://localhost:5000`

### Health Check
```bash
curl http://localhost:5000/health
```

Expected Response:
```json
{
  "success": true,
  "message": "FootyHeroes API is running",
  "timestamp": "2025-09-25T11:14:56.000Z",
  "environment": "development"
}
```

---

## 🔐 Authentication Endpoints

### 1. Register a New Player
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "position": "CM",
    "skillLevel": "Intermediate",
    "location": {
      "coordinates": [-74.006, 40.7128],
      "address": "New York, NY"
    }
  }'
```

### 2. Login Player
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "johndoe",
    "password": "password123"
  }'
```

**Save the JWT token from login response for authenticated requests!**

---

## ⚽ Match Management Endpoints

### 3. Create a New Match
```bash
curl -X POST http://localhost:5000/api/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "Sunday Morning Football",
    "description": "Friendly 5v5 match in Central Park",
    "format": "5v5",
    "type": "public",
    "skillLevelRequired": "Any",
    "location": {
      "coordinates": [-73.965, 40.782],
      "address": "Central Park, New York, NY",
      "venue": "Great Lawn"
    },
    "dateTime": "2025-09-26T10:00:00Z",
    "duration": 90,
    "teams": {
      "teamA": {
        "name": "Red Team",
        "color": "#FF0000"
      },
      "teamB": {
        "name": "Blue Team", 
        "color": "#0000FF"
      }
    },
    "cost": {
      "perPlayer": 0,
      "paymentMethod": "free"
    },
    "tags": ["friendly", "weekend", "park"],
    "notes": "Bring your own water and shin guards!"
  }'
```

### 4. Search/List Matches
```bash
# Basic search
curl "http://localhost:5000/api/matches"

# Search with filters
curl "http://localhost:5000/api/matches?format=5v5&skillLevel=Intermediate&status=open&page=1&limit=10"

# Location-based search
curl "http://localhost:5000/api/matches?longitude=-74.006&latitude=40.7128&distance=10000"

# Text search
curl "http://localhost:5000/api/matches?search=Central%20Park"
```

### 5. Get Match by ID
```bash
curl http://localhost:5000/api/matches/MATCH_ID_HERE
```

### 6. Get Nearby Matches (Requires Auth)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  "http://localhost:5000/api/matches/nearby/list?distance=15000"
```

### 7. Join a Match
```bash
curl -X POST http://localhost:5000/api/matches/MATCH_ID_HERE/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "preferredPosition": "CM"
  }'
```

### 8. Check if User Can Join Match
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  "http://localhost:5000/api/matches/MATCH_ID_HERE/can-join"
```

### 9. Leave a Match
```bash
curl -X POST http://localhost:5000/api/matches/MATCH_ID_HERE/leave \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 10. Update Match Details (Organizer Only)
```bash
curl -X PUT http://localhost:5000/api/matches/MATCH_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "Updated Match Title",
    "description": "Updated description",
    "notes": "Updated notes - bring water bottles!"
  }'
```

### 11. Start Match (Organizer/Referee Only)
```bash
curl -X POST http://localhost:5000/api/matches/MATCH_ID_HERE/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 12. Update Score (Organizer/Referee Only)
```bash
curl -X PUT http://localhost:5000/api/matches/MATCH_ID_HERE/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "teamAScore": 2,
    "teamBScore": 1
  }'
```

### 13. End Match (Organizer/Referee Only)
```bash
curl -X POST http://localhost:5000/api/matches/MATCH_ID_HERE/end \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 14. Get My Matches
```bash
# All matches
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  "http://localhost:5000/api/matches/my/matches"

# Filter by status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  "http://localhost:5000/api/matches/my/matches?status=ongoing"
```

### 15. Get Match Statistics
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  "http://localhost:5000/api/matches/MATCH_ID_HERE/stats"
```

### 16. Cancel Match (Organizer Only)
```bash
curl -X DELETE http://localhost:5000/api/matches/MATCH_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 🧑‍🤝‍🧑 User Profile Endpoints

### 17. Get Current User Profile
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  "http://localhost:5000/api/auth/me"
```

### 18. Update Profile
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "John Smith",
    "skillLevel": "Advanced",
    "bio": "Passionate footballer, been playing for 10 years!"
  }'
```

### 19. Get Nearby Players
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  "http://localhost:5000/api/auth/nearby-players?distance=5000"
```

---

## 🧪 Complete Testing Workflow

### Step 1: Register and Login
1. Register a new user
2. Login to get JWT token
3. Save the token for subsequent requests

### Step 2: Create and Test Matches
1. Create a match
2. Get the match ID from response
3. Search for matches
4. Join the match with another user
5. Update match details
6. Start the match
7. Update score
8. End the match

### Step 3: Test User Features
1. Get user profile
2. Update profile
3. Get user's matches
4. Find nearby players

---

## 📋 Expected Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": "Detailed error information"
}
```

---

## 🔍 Match Object Structure

```json
{
  "_id": "match_id",
  "title": "Match Title",
  "description": "Match description",
  "organizerId": {
    "_id": "user_id",
    "name": "Organizer Name",
    "username": "username"
  },
  "format": "5v5",
  "type": "public",
  "skillLevelRequired": "Intermediate",
  "location": {
    "coordinates": [-74.006, 40.7128],
    "address": "New York, NY",
    "venue": "Central Park"
  },
  "dateTime": "2025-09-26T10:00:00.000Z",
  "duration": 90,
  "teams": {
    "teamA": {
      "name": "Red Team",
      "players": [...],
      "color": "#FF0000"
    },
    "teamB": {
      "name": "Blue Team", 
      "players": [...],
      "color": "#0000FF"
    }
  },
  "maxPlayersPerTeam": 5,
  "slotsOpen": 8,
  "status": "open",
  "score": {
    "teamA": 0,
    "teamB": 0
  },
  "availableSlots": 8,
  "totalPlayers": 2,
  "createdAt": "2025-09-25T11:00:00.000Z",
  "updatedAt": "2025-09-25T11:00:00.000Z"
}
```

---

## 🚨 Common Error Codes

- **400**: Bad Request (Validation errors)
- **401**: Unauthorized (Invalid/missing token)
- **403**: Forbidden (Access denied)
- **404**: Not Found (Resource not found)
- **429**: Too Many Requests (Rate limited)
- **500**: Internal Server Error

---

## 🔥 Pro Tips

1. **Always include Content-Type header** for POST/PUT requests
2. **Save JWT tokens** from login response for authenticated requests
3. **Use valid ObjectIDs** for match IDs (24 character hex strings)
4. **Check response status codes** to handle errors properly
5. **Test rate limits** by making multiple requests quickly
6. **Use valid coordinates** for location-based features
7. **Ensure future dates** for match creation

---

## 🧪 Socket.IO Testing

Connect to Socket.IO server at `http://localhost:5000` and test real-time features:

### Events to Listen For:
- `match:player:joined` - When someone joins a match
- `match:player:left` - When someone leaves a match  
- `match:status:changed` - When match status changes
- `match:score:updated` - When match score updates
- `message:new` - New chat messages

### Events to Emit:
- `join:match` - Join a match room
- `message:send` - Send chat message
- `match:update` - Update match info

---

**Happy Testing! ⚽️**