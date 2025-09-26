const express = require('express');
const matchChatController = require('../controllers/matchChatController');
const { protect, rateLimiter } = require('../middlewares/authMiddleware');
const Joi = require('joi');

const router = express.Router();

// Rate limiting for chat endpoints
const chatRateLimit = rateLimiter(30, 15 * 60 * 1000); // 30 requests per 15 minutes
const generalRateLimit = rateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Validation schemas
const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(1000).required(),
  messageType: Joi.string().valid('text', 'media', 'location', 'poll', 'reaction').default('text'),
  replyTo: Joi.string().optional(),
  mediaUrl: Joi.string().uri().optional(),
  mediaType: Joi.string().valid('image', 'video', 'audio').when('messageType', {
    is: 'media',
    then: Joi.required()
  }).optional(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().optional()
  }).when('messageType', {
    is: 'location',
    then: Joi.required()
  }).optional()
});

const editMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(1000).required()
});

const reactionSchema = Joi.object({
  emoji: Joi.string().required()
});

const flagMessageSchema = Joi.object({
  reason: Joi.string().valid('inappropriate', 'spam', 'harassment', 'offensive', 'other').required()
});

// Validation middleware
const validateSendMessage = (req, res, next) => {
  const { error } = sendMessageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateEditMessage = (req, res, next) => {
  const { error } = editMessageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateReaction = (req, res, next) => {
  const { error } = reactionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateFlagMessage = (req, res, next) => {
  const { error } = flagMessageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Apply authentication to all routes
router.use(protect);
router.use(chatRateLimit);

// Chat endpoints for match-specific routes
/**
 * @route POST /api/chat/:matchId/message
 * @desc Send a message to match chat
 * @access Private
 */
router.post('/:matchId/message', validateSendMessage, matchChatController.sendMessage);

/**
 * @route GET /api/chat/:matchId/messages
 * @desc Get match chat messages
 * @access Private
 */
router.get('/:matchId/messages', matchChatController.getMatchMessages);

/**
 * @route GET /api/chat/:matchId/search
 * @desc Search messages in match
 * @access Private
 */
router.get('/:matchId/search', matchChatController.searchMessages);

/**
 * @route GET /api/chat/:matchId/pinned
 * @desc Get pinned messages
 * @access Private
 */
router.get('/:matchId/pinned', matchChatController.getPinnedMessages);

/**
 * @route GET /api/chat/:matchId/system
 * @desc Get system messages
 * @access Private
 */
router.get('/:matchId/system', matchChatController.getSystemMessages);

// Message-specific endpoints
/**
 * @route PUT /api/chat/messages/:messageId
 * @desc Edit a message
 * @access Private
 */
router.put('/messages/:messageId', validateEditMessage, matchChatController.editMessage);

/**
 * @route DELETE /api/chat/messages/:messageId
 * @desc Delete a message
 * @access Private
 */
router.delete('/messages/:messageId', matchChatController.deleteMessage);

/**
 * @route POST /api/chat/messages/:messageId/reactions
 * @desc Add reaction to message
 * @access Private
 */
router.post('/messages/:messageId/reactions', validateReaction, matchChatController.addReaction);

/**
 * @route DELETE /api/chat/messages/:messageId/reactions
 * @desc Remove reaction from message
 * @access Private
 */
router.delete('/messages/:messageId/reactions', validateReaction, matchChatController.removeReaction);

/**
 * @route POST /api/chat/messages/:messageId/pin
 * @desc Pin/unpin message
 * @access Private
 */
router.post('/messages/:messageId/pin', matchChatController.togglePin);

/**
 * @route POST /api/chat/messages/:messageId/flag
 * @desc Flag a message
 * @access Private
 */
router.post('/messages/:messageId/flag', validateFlagMessage, matchChatController.flagMessage);

/**
 * @route POST /api/chat/messages/:messageId/read
 * @desc Mark message as read
 * @access Private
 */
router.post('/messages/:messageId/read', matchChatController.markAsRead);

module.exports = router;