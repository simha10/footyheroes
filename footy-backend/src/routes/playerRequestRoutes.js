const express = require('express');
const playerRequestController = require('../controllers/playerRequestController');
const { protect, rateLimiter } = require('../middlewares/authMiddleware');
const Joi = require('joi');

const router = express.Router();

// Rate limiting for player request endpoints
const requestRateLimit = rateLimiter(10, 15 * 60 * 1000); // 10 requests per 15 minutes
const generalRateLimit = rateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Validation schemas
const createRequestSchema = Joi.object({
  matchId: Joi.string().required().length(24).hex(),
  positionNeeded: Joi.string()
    .valid('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST')
    .required(),
  slotsAvailable: Joi.number().integer().min(1).max(11).required(),
  targetSkillLevel: Joi.string()
    .valid('Any', 'Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional')
    .default('Any'),
  maxDistance: Joi.number().integer().min(100).max(100000).default(25000),
  message: Joi.string().trim().max(300).allow(''),
  urgency: Joi.string().valid('low', 'medium', 'high').default('medium'),
  expiresAt: Joi.date().greater('now'),
  autoFulfill: Joi.boolean().default(true)
});

const respondSchema = Joi.object({
  response: Joi.string().valid('interested', 'declined').required()
});

const updateRequestSchema = Joi.object({
  message: Joi.string().trim().max(300).allow(''),
  urgency: Joi.string().valid('low', 'medium', 'high'),
  targetSkillLevel: Joi.string()
    .valid('Any', 'Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional'),
  maxDistance: Joi.number().integer().min(100).max(100000),
  expiresAt: Joi.date().greater('now')
});

// Validation middleware
const validateCreateRequest = (req, res, next) => {
  const { error, value } = createRequestSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errorMessage
    });
  }

  req.body = value;
  next();
};

const validateRespond = (req, res, next) => {
  const { error, value } = respondSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errorMessage
    });
  }

  req.body = value;
  next();
};

const validateUpdateRequest = (req, res, next) => {
  const { error, value } = updateRequestSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errorMessage
    });
  }

  req.body = value;
  next();
};

// Apply authentication to all routes
router.use(protect);

// Player request management
router.post('/', requestRateLimit, validateCreateRequest, playerRequestController.createPlayerRequest);
router.get('/', generalRateLimit, playerRequestController.getPlayerRequests);
router.get('/:id', generalRateLimit, playerRequestController.getRequestDetails);
router.put('/:id', requestRateLimit, validateUpdateRequest, playerRequestController.updateRequest);
router.delete('/:id', requestRateLimit, playerRequestController.cancelRequest);

// Request actions
router.post('/:id/broadcast', requestRateLimit, playerRequestController.broadcastRequest);
router.post('/:id/respond', requestRateLimit, validateRespond, playerRequestController.respondToRequest);

// Analytics and management
router.get('/:id/analytics', generalRateLimit, playerRequestController.getRequestAnalytics);
router.post('/cleanup', requestRateLimit, playerRequestController.cleanupExpiredRequests);

module.exports = router;