const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');
const { protect } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for leaderboard endpoints
const leaderboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests for leaderboard data, please try again later.'
  }
});

// Apply rate limiting to all leaderboard routes
router.use(leaderboardLimiter);

/**
 * @route GET /api/leaderboards/goalscorers
 * @desc Get top goalscorers leaderboard
 * @access Public
 * @query limit - Number of players to return (1-100, default: 10)
 * @query timeframe - Time period: 'all', 'month', 'week' (default: 'all')
 */
router.get('/goalscorers', leaderboardController.getTopGoalscorers);

/**
 * @route GET /api/leaderboards/mvp
 * @desc Get MVP leaderboard
 * @access Public
 * @query limit - Number of players to return (1-100, default: 10)
 */
router.get('/mvp', leaderboardController.getMVPLeaderboard);

/**
 * @route GET /api/leaderboards/fair-play
 * @desc Get fair play leaderboard (reputation-based)
 * @access Public
 * @query limit - Number of players to return (1-100, default: 10)
 */
router.get('/fair-play', leaderboardController.getFairPlayLeaderboard);

/**
 * @route GET /api/leaderboards/overall
 * @desc Get overall player rankings
 * @access Public
 * @query limit - Number of players to return (1-100, default: 20)
 */
router.get('/overall', leaderboardController.getOverallRankings);

/**
 * @route GET /api/leaderboards/position/:position
 * @desc Get position-specific leaderboard
 * @access Public
 * @param position - Player position (GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST)
 * @query limit - Number of players to return (1-100, default: 10)
 */
router.get('/position/:position', leaderboardController.getPositionLeaderboard);

/**
 * @route GET /api/leaderboards/compare/:player1Id/:player2Id
 * @desc Compare statistics between two players
 * @access Public
 * @param player1Id - First player's ID
 * @param player2Id - Second player's ID
 */
router.get('/compare/:player1Id/:player2Id', leaderboardController.comparePlayerStats);

/**
 * @route GET /api/leaderboards/all
 * @desc Get all leaderboard categories in one response
 * @access Public
 * @query limit - Number of players per category (1-20, default: 5)
 */
router.get('/all', leaderboardController.getAllLeaderboards);

/**
 * @route GET /api/leaderboards/player/:playerId/rankings
 * @desc Get a specific player's rankings across all categories
 * @access Private (requires authentication)
 * @param playerId - Player's ID
 */
router.get('/player/:playerId/rankings', protect, leaderboardController.getPlayerRankings);

/**
 * @route GET /api/leaderboards/positions
 * @desc Get available player positions
 * @access Public
 */
router.get('/positions', leaderboardController.getAvailablePositions);

module.exports = router;