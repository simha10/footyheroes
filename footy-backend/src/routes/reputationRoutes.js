const express = require('express');
const reputationController = require('../controllers/reputationController');
const { protect } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for reputation endpoints
const reputationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many reputation requests, please try again later.'
  }
});

// Stricter rate limiting for reports and ratings
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 submissions per hour
  message: {
    success: false,
    message: 'Too many submissions, please try again later.'
  }
});

// Apply rate limiting to all reputation routes
router.use(reputationLimiter);

/**
 * @route POST /api/reputation/reports
 * @desc Submit a report against a player
 * @access Private
 * @body { reportedPlayer, match, category, severity, description, evidence?, isAnonymous? }
 */
router.post('/reports', protect, submitLimiter, reputationController.submitReport);

/**
 * @route POST /api/reputation/ratings
 * @desc Submit a rating for a player
 * @access Private
 * @body { ratedPlayer, match, overallRating, skillRating, teamworkRating, attitudeRating, punctualityRating, communicationRating, feedback?, positives?, improvements? }
 */
router.post('/ratings', protect, submitLimiter, reputationController.submitRating);

/**
 * @route GET /api/reputation/player/:playerId/profile
 * @desc Get player's reputation profile
 * @access Public
 * @param playerId - Player's ID
 */
router.get('/player/:playerId/profile', reputationController.getPlayerReputationProfile);

/**
 * @route GET /api/reputation/reports/review
 * @desc Get reports for admin review
 * @access Private (admin only)
 * @query status, severity, category, priority, limit, page
 */
router.get('/reports/review', protect, reputationController.getReportsForReview);

/**
 * @route PUT /api/reputation/reports/:reportId/resolve
 * @desc Resolve a report
 * @access Private (admin only)
 * @param reportId - Report ID
 * @body { action, reason, duration? }
 */
router.put('/reports/:reportId/resolve', protect, reputationController.resolveReport);

/**
 * @route GET /api/reputation/reports/my
 * @desc Get my submitted reports
 * @access Private
 * @query limit, page
 */
router.get('/reports/my', protect, reputationController.getMyReports);

/**
 * @route GET /api/reputation/ratings/my
 * @desc Get my submitted ratings
 * @access Private
 * @query limit, page
 */
router.get('/ratings/my', protect, reputationController.getMyRatings);

/**
 * @route GET /api/reputation/stats
 * @desc Get reputation system statistics
 * @access Private (admin only)
 */
router.get('/stats', protect, reputationController.getReputationStats);

/**
 * @route GET /api/reputation/reports/categories
 * @desc Get available report categories
 * @access Public
 */
router.get('/reports/categories', reputationController.getReportCategories);

/**
 * @route GET /api/reputation/ratings/criteria
 * @desc Get rating criteria and available tags
 * @access Public
 */
router.get('/ratings/criteria', reputationController.getRatingCriteria);

module.exports = router;