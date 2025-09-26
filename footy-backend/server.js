const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const playerRequestRoutes = require('./src/routes/playerRequestRoutes');
const leaderboardRoutes = require('./src/routes/leaderboardRoutes');
const badgeRoutes = require('./src/routes/badgeRoutes');
const reputationRoutes = require('./src/routes/reputationRoutes');
const matchChatRoutes = require('./src/routes/matchChatRoutes');

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Make Socket.IO accessible to controllers
app.set('socketio', io);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FootyHeroes API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/player-requests', playerRequestRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/reputation', reputationRoutes);
app.use('/api/chat', matchChatRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`, { socketId: socket.id });

  // Join user to a room based on their user ID
  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their personal room`);
  });

  // Join match room
  socket.on('join:match', (matchId) => {
    socket.join(`match:${matchId}`);
    socket.to(`match:${matchId}`).emit('player:joined', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    console.log(`Socket ${socket.id} joined match room: ${matchId}`);
  });

  // Leave match room
  socket.on('leave:match', (matchId) => {
    socket.leave(`match:${matchId}`);
    socket.to(`match:${matchId}`).emit('player:left', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    console.log(`Socket ${socket.id} left match room: ${matchId}`);
  });

  // Handle match chat messages
  socket.on('message:send', (data) => {
    const { matchId, message, senderId, senderName } = data;
    
    const messageData = {
      id: Date.now().toString(),
      message,
      senderId,
      senderName,
      timestamp: new Date().toISOString()
    };

    // Broadcast message to all users in the match room
    io.to(`match:${matchId}`).emit('message:new', messageData);
    console.log(`Message sent in match ${matchId} by ${senderName}`);
  });

  // Handle player requests for positions
  socket.on('player:request', (data) => {
    const { matchId, position, requestedBy } = data;
    
    // Broadcast to all players in the match
    socket.to(`match:${matchId}`).emit('player:request:new', {
      matchId,
      position,
      requestedBy,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Player request for ${position} in match ${matchId}`);
  });

  // Handle match updates
  socket.on('match:update', (data) => {
    const { matchId, update } = data;
    
    // Broadcast match update to all players in the match
    io.to(`match:${matchId}`).emit('match:updated', {
      ...update,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Match ${matchId} updated`);
  });

  // Handle player join events
  socket.on('match:player:joined', (data) => {
    const { matchId, player, team, availableSlots } = data;
    
    io.to(`match:${matchId}`).emit('match:player:joined', {
      player,
      team,
      availableSlots,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Player ${player.name} joined ${team} in match ${matchId}`);
  });

  // Handle player leave events
  socket.on('match:player:left', (data) => {
    const { matchId, player, team, availableSlots } = data;
    
    io.to(`match:${matchId}`).emit('match:player:left', {
      player,
      team,
      availableSlots,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Player ${player.name} left ${team} in match ${matchId}`);
  });

  // Handle match status changes
  socket.on('match:status:changed', (data) => {
    const { matchId, status, score } = data;
    
    io.to(`match:${matchId}`).emit('match:status:changed', {
      status,
      score,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Match ${matchId} status changed to ${status}`);
  });

  // Handle score updates
  socket.on('match:score:updated', (data) => {
    const { matchId, score } = data;
    
    io.to(`match:${matchId}`).emit('match:score:updated', {
      score,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Match ${matchId} score updated: ${score.teamA}-${score.teamB}`);
  });

  // Handle notifications
  socket.on('notification:send', (data) => {
    const { userId, notification } = data;
    
    // Send notification to specific user
    io.to(`user:${userId}`).emit('notification:new', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Notification sent to user ${userId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FootyHeroes API server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO enabled`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, server, io };