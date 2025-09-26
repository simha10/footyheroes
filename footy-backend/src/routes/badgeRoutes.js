const express = require('express');
const badgeController = require('../controllers/badgeController');
const { protect } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for badge endpoints
const badgeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests for badge data, please try again later.'
  }
});

// Apply rate limiting to all badge routes
router.use(badgeLimiter);

/**
 * @route GET /api/badges
 * @desc Get all available badges
 * @access Public
 */
router.get('/', badgeController.getAllBadges);

/**
 * @route GET /api/badges/categories
 * @desc Get all badge categories
 * @access Public
 */
router.get('/categories', badgeController.getBadgeCategories);

/**
 * @route GET /api/badges/category/:category
 * @desc Get badges by category
 * @access Public
 * @param category - Badge category (milestone, scoring, playmaking, etc.)
 */
router.get('/category/:category', badgeController.getBadgesByCategory);

/**
 * @route GET /api/badges/user/:userId/progress
 * @desc Get user's badges with progress information
 * @access Private (own badges or admin)
 * @param userId - User's ID
 */
router.get('/user/:userId/progress', protect, badgeController.getUserBadgesWithProgress);

/**
 * @route POST /api/badges/user/:userId/check
 * @desc Check and award badges to a user
 * @access Private (admin or referee only)
 * @param userId - User's ID
 * @body context - Additional context for badge checking (optional)
 */
router.post('/user/:userId/check', protect, badgeController.checkAndAwardBadges);

/**
 * @route POST /api/badges/user/:userId/award/:badgeKey
 * @desc Award a specific badge manually
 * @access Private (admin only)
 * @param userId - User's ID
 * @param badgeKey - Badge key to award
 */
router.post('/user/:userId/award/:badgeKey', protect, badgeController.awardBadgeManually);

/**
 * @route DELETE /api/badges/user/:userId/remove/:badgeKey
 * @desc Remove a specific badge
 * @access Private (admin only)
 * @param userId - User's ID
 * @param badgeKey - Badge key to remove
 */
router.delete('/user/:userId/remove/:badgeKey', protect, badgeController.removeBadge);

/**
 * @route GET /api/badges/:badgeKey/users
 * @desc Get users who have earned a specific badge
 * @access Private (admin only)
 * @param badgeKey - Badge key
 * @query limit - Number of users to return (1-100, default: 20)
 */
router.get('/:badgeKey/users', protect, badgeController.getUsersWithBadge);

module.exports = router;