const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require valid JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid. User not found.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      // Check if suspension has expired
      if (user.suspensionExpiresAt && new Date() > user.suspensionExpiresAt) {
        user.isSuspended = false;
        user.suspensionReason = null;
        user.suspensionExpiresAt = null;
        await user.save();
      } else {
        return res.status(403).json({
          success: false,
          message: `Account is suspended. Reason: ${user.suspensionReason || 'Account violation'}`,
          suspensionExpiresAt: user.suspensionExpiresAt
        });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive && !user.isSuspended) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// Restrict access to account owners only
const restrictToOwner = (req, res, next) => {
  if (req.params.userId && req.params.userId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }
  next();
};

// Check if user has admin privileges (for future admin features)
const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Rate limiting middleware (basic implementation)
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || 'anonymous';
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const requestData = requests.get(key);

    if (now > requestData.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (requestData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }

    requestData.count++;
    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  restrictToOwner,
  restrictToAdmin,
  rateLimiter
};