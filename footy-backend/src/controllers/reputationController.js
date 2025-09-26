const reputationService = require('../services/reputationService');
const Joi = require('joi');

class ReputationController {
  // Submit a report against a player
  async submitReport(req, res) {
    try {
      const reportSchema = Joi.object({
        reportedPlayer: Joi.string().required(),
        match: Joi.string().required(),
        category: Joi.string().valid(
          'unsportsmanlike_conduct',
          'abusive_language', 
          'physical_aggression',
          'no_show',
          'late_arrival',
          'cheating',
          'harassment',
          'discrimination',
          'other'
        ).required(),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
        description: Joi.string().max(1000).required(),
        evidence: Joi.array().items(Joi.object({
          type: Joi.string().valid('image', 'video', 'witness', 'referee').required(),
          url: Joi.string().when('type', {
            is: Joi.valid('image', 'video'),
            then: Joi.required(),
            otherwise: Joi.optional()
          }),
          witnessId: Joi.string().when('type', {
            is: 'witness',
            then: Joi.required(),
            otherwise: Joi.optional()
          }),
          description: Joi.string().max(500)
        })).optional(),
        isAnonymous: Joi.boolean().default(false)
      });

      const { error, value } = reportSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details
        });
      }

      const reportData = {
        ...value,
        reportedBy: req.user.id
      };

      const result = await reputationService.submitReport(reportData);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit report',
        error: error.message
      });
    }
  }

  // Submit a rating for a player
  async submitRating(req, res) {
    try {
      const ratingSchema = Joi.object({
        ratedPlayer: Joi.string().required(),
        match: Joi.string().required(),
        overallRating: Joi.number().min(1).max(5).required(),
        skillRating: Joi.number().min(1).max(5).required(),
        teamworkRating: Joi.number().min(1).max(5).required(),
        attitudeRating: Joi.number().min(1).max(5).required(),
        punctualityRating: Joi.number().min(1).max(5).required(),
        communicationRating: Joi.number().min(1).max(5).required(),
        feedback: Joi.string().max(500).allow('').optional(),
        positives: Joi.array().items(Joi.string().valid(
          'excellent_skills',
          'great_teamwork',
          'positive_attitude',
          'good_communication',
          'fair_play',
          'leadership',
          'reliable',
          'encouraging',
          'respectful',
          'hardworking'
        )).optional(),
        improvements: Joi.array().items(Joi.string().valid(
          'skill_development',
          'teamwork',
          'attitude',
          'communication',
          'punctuality',
          'fair_play',
          'focus',
          'fitness',
          'decision_making',
          'leadership'
        )).optional()
      });

      const { error, value } = ratingSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details
        });
      }

      const ratingData = {
        ...value,
        ratedBy: req.user.id
      };

      const result = await reputationService.submitRating(ratingData);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit rating',
        error: error.message
      });
    }
  }

  // Get player's reputation profile
  async getPlayerReputationProfile(req, res) {
    try {
      const { playerId } = req.params;
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'Player ID is required'
        });
      }

      const result = await reputationService.getPlayerReputationProfile(playerId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get player reputation profile',
        error: error.message
      });
    }
  }

  // Get reports for admin review
  async getReportsForReview(req, res) {
    try {
      // Only allow admin access
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const {
        status,
        severity,
        category,
        priority,
        limit = 20,
        page = 1
      } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (severity) filters.severity = severity;
      if (category) filters.category = category;
      if (priority) filters.priority = parseInt(priority);
      if (limit) filters.limit = parseInt(limit);
      if (page) filters.page = parseInt(page);

      const result = await reputationService.getReportsForReview(filters);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get reports',
        error: error.message
      });
    }
  }

  // Resolve a report (admin only)
  async resolveReport(req, res) {
    try {
      // Only allow admin access
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { reportId } = req.params;
      
      const resolutionSchema = Joi.object({
        action: Joi.string().valid(
          'no_action',
          'warning',
          'temporary_suspension',
          'permanent_ban',
          'reputation_penalty',
          'match_ban',
          'community_service'
        ).required(),
        reason: Joi.string().max(500).required(),
        duration: Joi.number().min(1).max(365).when('action', {
          is: Joi.valid('temporary_suspension', 'match_ban'),
          then: Joi.required(),
          otherwise: Joi.optional()
        })
      });

      const { error, value } = resolutionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details
        });
      }

      const result = await reputationService.resolveReport(reportId, value, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to resolve report',
        error: error.message
      });
    }
  }

  // Get reputation statistics
  async getReputationStats(req, res) {
    try {
      // Only allow admin access
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const result = await reputationService.getReputationStats();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get reputation statistics',
        error: error.message
      });
    }
  }

  // Get my reports (reports I've submitted)
  async getMyReports(req, res) {
    try {
      const { limit = 20, page = 1 } = req.query;

      const filters = {
        status: ['pending', 'under_review', 'resolved', 'dismissed'],
        limit: parseInt(limit),
        page: parseInt(page)
      };

      // Modify the service to filter by reportedBy
      const reports = await require('../models/Report').find({
        reportedBy: req.user.id,
        isActive: true
      })
        .populate('reportedPlayer', 'name username profilePicture')
        .populate('match', 'title scheduledTime')
        .sort({ createdAt: -1 })
        .skip((filters.page - 1) * filters.limit)
        .limit(filters.limit);

      const totalCount = await require('../models/Report').countDocuments({
        reportedBy: req.user.id,
        isActive: true
      });

      res.status(200).json({
        success: true,
        message: 'My reports retrieved successfully',
        data: {
          reports,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: totalCount,
            pages: Math.ceil(totalCount / filters.limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get your reports',
        error: error.message
      });
    }
  }

  // Get my ratings (ratings I've submitted)
  async getMyRatings(req, res) {
    try {
      const { limit = 20, page = 1 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const ratings = await require('../models/Rating').find({
        ratedBy: req.user.id,
        isActive: true
      })
        .populate('ratedPlayer', 'name username profilePicture')
        .populate('match', 'title scheduledTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalCount = await require('../models/Rating').countDocuments({
        ratedBy: req.user.id,
        isActive: true
      });

      res.status(200).json({
        success: true,
        message: 'My ratings retrieved successfully',
        data: {
          ratings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / parseInt(limit))
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get your ratings',
        error: error.message
      });
    }
  }

  // Get available report categories and their descriptions
  async getReportCategories(req, res) {
    try {
      const categories = [
        {
          code: 'unsportsmanlike_conduct',
          name: 'Unsportsmanlike Conduct',
          description: 'Poor behavior during gameplay',
          severity: 'medium'
        },
        {
          code: 'abusive_language',
          name: 'Abusive Language',
          description: 'Offensive or inappropriate language',
          severity: 'medium'
        },
        {
          code: 'physical_aggression',
          name: 'Physical Aggression',
          description: 'Physical violence or threats',
          severity: 'critical'
        },
        {
          code: 'no_show',
          name: 'No Show',
          description: 'Failed to attend scheduled match',
          severity: 'low'
        },
        {
          code: 'late_arrival',
          name: 'Late Arrival',
          description: 'Arrived significantly late without notice',
          severity: 'low'
        },
        {
          code: 'cheating',
          name: 'Cheating',
          description: 'Unfair play or rule violations',
          severity: 'high'
        },
        {
          code: 'harassment',
          name: 'Harassment',
          description: 'Persistent unwelcome behavior',
          severity: 'critical'
        },
        {
          code: 'discrimination',
          name: 'Discrimination',
          description: 'Discriminatory behavior based on protected characteristics',
          severity: 'critical'
        },
        {
          code: 'other',
          name: 'Other',
          description: 'Other misconduct not covered above',
          severity: 'medium'
        }
      ];

      const severityLevels = [
        { level: 'low', description: 'Minor issues that need attention' },
        { level: 'medium', description: 'Moderate issues requiring intervention' },
        { level: 'high', description: 'Serious issues requiring immediate action' },
        { level: 'critical', description: 'Severe violations requiring urgent response' }
      ];

      res.status(200).json({
        success: true,
        message: 'Report categories retrieved successfully',
        data: {
          categories,
          severityLevels
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get report categories',
        error: error.message
      });
    }
  }

  // Get rating criteria and tags
  async getRatingCriteria(req, res) {
    try {
      const criteria = [
        {
          category: 'overallRating',
          name: 'Overall Rating',
          description: 'General assessment of the player\'s performance'
        },
        {
          category: 'skillRating',
          name: 'Skill Level',
          description: 'Technical ability and football skills'
        },
        {
          category: 'teamworkRating',
          name: 'Teamwork',
          description: 'Ability to work well with teammates'
        },
        {
          category: 'attitudeRating',
          name: 'Attitude',
          description: 'Positive behavior and sportsmanship'
        },
        {
          category: 'punctualityRating',
          name: 'Punctuality',
          description: 'Timeliness and reliability'
        },
        {
          category: 'communicationRating',
          name: 'Communication',
          description: 'Effective communication on and off the field'
        }
      ];

      const positives = [
        { tag: 'excellent_skills', label: 'Excellent Skills' },
        { tag: 'great_teamwork', label: 'Great Teamwork' },
        { tag: 'positive_attitude', label: 'Positive Attitude' },
        { tag: 'good_communication', label: 'Good Communication' },
        { tag: 'fair_play', label: 'Fair Play' },
        { tag: 'leadership', label: 'Leadership' },
        { tag: 'reliable', label: 'Reliable' },
        { tag: 'encouraging', label: 'Encouraging' },
        { tag: 'respectful', label: 'Respectful' },
        { tag: 'hardworking', label: 'Hard Working' }
      ];

      const improvements = [
        { tag: 'skill_development', label: 'Skill Development' },
        { tag: 'teamwork', label: 'Teamwork' },
        { tag: 'attitude', label: 'Attitude' },
        { tag: 'communication', label: 'Communication' },
        { tag: 'punctuality', label: 'Punctuality' },
        { tag: 'fair_play', label: 'Fair Play' },
        { tag: 'focus', label: 'Focus' },
        { tag: 'fitness', label: 'Fitness' },
        { tag: 'decision_making', label: 'Decision Making' },
        { tag: 'leadership', label: 'Leadership' }
      ];

      res.status(200).json({
        success: true,
        message: 'Rating criteria retrieved successfully',
        data: {
          criteria,
          positives,
          improvements
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get rating criteria',
        error: error.message
      });
    }
  }
}

module.exports = new ReputationController();