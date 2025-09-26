const Joi = require('joi');

// Validation schemas
const schemas = {
  // User validations
  register: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    username: Joi.string().alphanum().min(3).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    position: Joi.string().valid('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST').required(),
    skillLevel: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional').default('Beginner'),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
      address: Joi.string().optional()
    }).required()
  }),

  login: Joi.object({
    identifier: Joi.string().required(),
    password: Joi.string().required()
  }),

  // Match validations
  createMatch: Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(500).optional(),
    format: Joi.string().valid('5v5', '7v7', '11v11').required(),
    type: Joi.string().valid('public', 'private').default('public'),
    skillLevelRequired: Joi.string().valid('Any', 'Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional').default('Any'),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
      address: Joi.string().required(),
      venue: Joi.string().max(200).optional()
    }).required(),
    dateTime: Joi.date().greater('now').required(),
    duration: Joi.number().min(30).max(180).default(90),
    cost: Joi.object({
      perPlayer: Joi.number().min(0).default(0),
      currency: Joi.string().length(3).default('USD'),
      paymentMethod: Joi.string().valid('cash', 'card', 'app', 'free').default('free')
    }).optional(),
    tags: Joi.array().items(Joi.string().max(20)).max(5).optional()
  }),

  updateMatch: Joi.object({
    title: Joi.string().trim().min(3).max(100).optional(),
    description: Joi.string().trim().max(500).optional(),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).optional(),
      address: Joi.string().optional(),
      venue: Joi.string().max(200).optional()
    }).optional(),
    dateTime: Joi.date().greater('now').optional(),
    duration: Joi.number().min(30).max(180).optional(),
    cost: Joi.object({
      perPlayer: Joi.number().min(0).optional(),
      currency: Joi.string().length(3).optional(),
      paymentMethod: Joi.string().valid('cash', 'card', 'app', 'free').optional()
    }).optional(),
    tags: Joi.array().items(Joi.string().max(20)).max(5).optional()
  }),

  // Rating validations
  submitRating: Joi.object({
    ratedPlayer: Joi.string().hex().length(24).required(),
    overallRating: Joi.number().min(1).max(5).required(),
    skillRating: Joi.number().min(1).max(5).required(),
    teamworkRating: Joi.number().min(1).max(5).required(),
    attitudeRating: Joi.number().min(1).max(5).required(),
    punctualityRating: Joi.number().min(1).max(5).required(),
    communicationRating: Joi.number().min(1).max(5).required(),
    feedback: Joi.string().max(500).optional(),
    positives: Joi.array().items(Joi.string()).max(10).optional(),
    improvements: Joi.array().items(Joi.string()).max(10).optional(),
    tags: Joi.array().items(Joi.string()).max(5).optional()
  }),

  // Report validations
  submitReport: Joi.object({
    reportedPlayer: Joi.string().hex().length(24).required(),
    match: Joi.string().hex().length(24).required(),
    category: Joi.string().valid('unsporting_behavior', 'harassment', 'spam', 'inappropriate_conduct', 'cheating', 'other').required(),
    severity: Joi.string().valid('low', 'medium', 'high').required(),
    description: Joi.string().trim().min(10).max(1000).required(),
    evidence: Joi.array().items(Joi.string()).max(5).optional()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }
    next();
  };
};

// Utility functions
const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

const validateLocation = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  const [longitude, latitude] = coordinates;
  return longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
};

const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  return new Date(startDate) <= new Date(endDate);
};

const validatePassword = (password) => {
  // At least 6 characters
  if (password.length < 6) return false;
  
  // At least one uppercase, lowercase, and number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumbers;
};

const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username) && username.length >= 3 && username.length <= 20;
};

// Export validation functions
module.exports = {
  schemas,
  validate,
  validateObjectId,
  sanitizeInput,
  validateLocation,
  validateDateRange,
  validatePassword,
  validateEmail,
  validateUsername
};
