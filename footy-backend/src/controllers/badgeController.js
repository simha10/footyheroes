const badgeService = require('../services/badgeService');
const User = require('../models/User');

class BadgeController {
  // Get all available badges
  async getAllBadges(req, res) {
    try {
      const result = badgeService.getAllBadges();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get badges',
        error: error.message
      });
    }
  }

  // Get badges by category
  async getBadgesByCategory(req, res) {
    try {
      const { category } = req.params;
      
      // Validate category
      const validCategories = ['milestone', 'scoring', 'playmaking', 'achievement', 'experience', 'conduct', 'consistency', 'special'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        });
      }

      const result = badgeService.getBadgesByCategory(category);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get badges by category',
        error: error.message
      });
    }
  }

  // Get user's badges with progress
  async getUserBadgesWithProgress(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Make sure the requesting user is the owner or an admin
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view these badges'
        });
      }

      const result = await badgeService.getUserBadgesWithProgress(userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get user badges',
        error: error.message
      });
    }
  }

  // Check and award badges to a user
  async checkAndAwardBadges(req, res) {
    try {
      const { userId } = req.params;
      const context = req.body.context || {};

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Only allow specific roles to trigger badge checks
      if (req.user.role !== 'admin' && req.user.role !== 'referee') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to check badges'
        });
      }

      const result = await badgeService.checkAndAwardBadges(userId, context);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check and award badges',
        error: error.message
      });
    }
  }

  // Award a specific badge manually (admin only)
  async awardBadgeManually(req, res) {
    try {
      const { userId, badgeKey } = req.params;

      if (!userId || !badgeKey) {
        return res.status(400).json({
          success: false,
          message: 'User ID and badge key are required'
        });
      }

      // Admin-only function
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can award badges manually'
        });
      }

      const result = await badgeService.awardBadgeManually(userId, badgeKey, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to award badge',
        error: error.message
      });
    }
  }

  // Remove a badge (admin only)
  async removeBadge(req, res) {
    try {
      const { userId, badgeKey } = req.params;

      if (!userId || !badgeKey) {
        return res.status(400).json({
          success: false,
          message: 'User ID and badge key are required'
        });
      }

      // Admin-only function
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can remove badges'
        });
      }

      const result = await badgeService.removeBadge(userId, badgeKey, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to remove badge',
        error: error.message
      });
    }
  }

  // Get badge categories
  async getBadgeCategories(req, res) {
    try {
      const categories = [
        { code: 'milestone', name: 'Milestones', description: 'First-time achievements' },
        { code: 'scoring', name: 'Scoring', description: 'Goal-scoring achievements' },
        { code: 'playmaking', name: 'Playmaking', description: 'Assist and creative achievements' },
        { code: 'achievement', name: 'Achievement', description: 'Special recognitions and awards' },
        { code: 'experience', name: 'Experience', description: 'Game participation milestones' },
        { code: 'conduct', name: 'Fair Play', description: 'Sportsmanship and good conduct' },
        { code: 'consistency', name: 'Consistency', description: 'Reliable performance over time' },
        { code: 'special', name: 'Special', description: 'Rare and exceptional achievements' }
      ];

      res.status(200).json({
        success: true,
        message: 'Badge categories retrieved successfully',
        data: { categories }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get badge categories',
        error: error.message
      });
    }
  }

  // Get users with a specific badge
  async getUsersWithBadge(req, res) {
    try {
      const { badgeKey } = req.params;
      const { limit = 20 } = req.query;

      // Admin-only function
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this data'
        });
      }

      const parsedLimit = parseInt(limit);
      if (parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
      }

      // Validate badge key
      if (!badgeService.badges[badgeKey]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid badge key'
        });
      }

      // Find users with the specified badge
      const users = await User.find({
        'badges.key': badgeKey
      })
        .select('_id name username badges.key badges.earnedAt')
        .sort({ 'badges.earnedAt': -1 }) // Sort by most recently earned
        .limit(parsedLimit);

      res.status(200).json({
        success: true,
        message: `Users with ${badgeKey} badge retrieved successfully`,
        data: {
          badge: badgeService.badges[badgeKey],
          users: users.map(user => ({
            id: user._id,
            name: user.name,
            username: user.username,
            earnedAt: user.badges.find(b => b.key === badgeKey)?.earnedAt
          })),
          count: users.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get users with badge',
        error: error.message
      });
    }
  }
}

module.exports = new BadgeController();