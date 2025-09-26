const express = require('express');
const authController = require('../controllers/authController');
const { protect, rateLimiter } = require('../middlewares/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
} = require('../dtos/auth.dto');

const router = express.Router();

// Rate limiting for auth endpoints
const authRateLimit = rateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes
const generalRateLimit = rateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Public routes
router.post('/register', authRateLimit, validateRegister, authController.register);
router.post('/login', authRateLimit, validateLogin, authController.login);
router.get('/user/:username', generalRateLimit, authController.getUserByUsername);

// Protected routes
router.use(protect); // Apply authentication to all routes below

router.get('/me', authController.getMe);
router.put('/profile', validateUpdateProfile, authController.updateProfile);
router.put('/change-password', validateChangePassword, authController.changePassword);
router.get('/nearby-players', authController.getNearbyPlayers);
router.put('/deactivate', authController.deactivateAccount);
router.put('/reactivate', authController.reactivateAccount);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;