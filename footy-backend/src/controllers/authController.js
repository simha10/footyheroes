const authService = require('../services/authService');
const User = require('../models/User');

class AuthController {
  // @desc    Register a new user
  // @route   POST /api/auth/register
  // @access  Public
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Login user
  // @route   POST /api/auth/login
  // @access  Public
  async login(req, res) {
    try {
      const { identifier, password } = req.body;
      const result = await authService.login(identifier, password);
      res.status(200).json(result);
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get current user profile
  // @route   GET /api/auth/me
  // @access  Private
  async getMe(req, res) {
    try {
      const result = await authService.getProfile(req.user._id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Update user profile
  // @route   PUT /api/auth/profile
  // @access  Private
  async updateProfile(req, res) {
    try {
      const result = await authService.updateProfile(req.user._id, req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Change user password
  // @route   PUT /api/auth/change-password
  // @access  Private
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
      res.status(200).json(result);
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get nearby players
  // @route   GET /api/auth/nearby-players
  // @access  Private
  async getNearbyPlayers(req, res) {
    try {
      const maxDistance = parseInt(req.query.distance) || 10000; // Default 10km
      const result = await authService.findNearbyPlayers(req.user._id, maxDistance);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get nearby players error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Deactivate user account
  // @route   PUT /api/auth/deactivate
  // @access  Private
  async deactivateAccount(req, res) {
    try {
      const result = await authService.deactivateAccount(req.user._id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Deactivate account error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Reactivate user account
  // @route   PUT /api/auth/reactivate
  // @access  Private
  async reactivateAccount(req, res) {
    try {
      const result = await authService.reactivateAccount(req.user._id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Reactivate account error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get user by username (public profile)
  // @route   GET /api/auth/user/:username
  // @access  Public
  async getUserByUsername(req, res) {
    try {
      const { username } = req.params;
      const user = await User.findOne({ username })
        .select('-password -email')
        .populate('matchesPlayed', 'title date status');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: { user }
      });
    } catch (error) {
      console.error('Get user by username error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Refresh JWT token
  // @route   POST /api/auth/refresh
  // @access  Private
  async refreshToken(req, res) {
    try {
      const token = authService.generateToken(req.user._id);
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { token }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Logout user (client-side token removal)
  // @route   POST /api/auth/logout
  // @access  Private
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // This endpoint can be used for analytics or cleanup
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();