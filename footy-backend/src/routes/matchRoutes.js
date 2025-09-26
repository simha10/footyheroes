const express = require('express');
const matchController = require('../controllers/matchController');
const { protect, optionalAuth, rateLimiter } = require('../middlewares/authMiddleware');
const {
  validateCreateMatch,
  validateUpdateMatch,
  validateJoinMatch,
  validateSearchMatches,
  validateUpdateScore
} = require('../dtos/match.dto');

const router = express.Router();

// Rate limiting for match endpoints
const matchRateLimit = rateLimiter(20, 15 * 60 * 1000); // 20 requests per 15 minutes
const generalRateLimit = rateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Public routes
router.get('/', generalRateLimit, validateSearchMatches, matchController.searchMatches);
router.get('/:id', generalRateLimit, matchController.getMatch);

// Protected routes - require authentication
router.use(protect); // Apply authentication to all routes below

// Match management
router.post('/', matchRateLimit, validateCreateMatch, matchController.createMatch);
router.put('/:id', matchRateLimit, validateUpdateMatch, matchController.updateMatch);
router.delete('/:id', matchRateLimit, matchController.cancelMatch);

// Match participation
router.post('/:id/join', matchRateLimit, validateJoinMatch, matchController.joinMatch);
router.post('/:id/leave', matchRateLimit, matchController.leaveMatch);

// Match control
router.post('/:id/start', matchRateLimit, matchController.startMatch);
router.post('/:id/end', matchRateLimit, matchController.endMatch);
router.put('/:id/score', matchRateLimit, validateUpdateScore, matchController.updateScore);

// Match information
router.get('/nearby/list', generalRateLimit, matchController.getNearbyMatches);
router.get('/my/matches', generalRateLimit, matchController.getMyMatches);
router.get('/:id/stats', generalRateLimit, matchController.getMatchStats);
router.get('/:id/can-join', generalRateLimit, matchController.canJoinMatch);

module.exports = router;