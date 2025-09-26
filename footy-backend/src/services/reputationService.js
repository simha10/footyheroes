const User = require('../models/User');
const Report = require('../models/Report');
const Rating = require('../models/Rating');

class ReputationService {
  // Submit a report against a player
  async submitReport(reportData) {
    try {
      const {
        reportedPlayer,
        reportedBy,
        match,
        category,
        severity,
        description,
        evidence,
        isAnonymous = false
      } = reportData;

      // Validate that reporter and reported player are not the same
      if (reportedPlayer === reportedBy) {
        throw new Error('Cannot report yourself');
      }

      // Check if reporter and reported player were in the same match
      const matchDoc = await require('../models/Match').findById(match);
      if (!matchDoc) {
        throw new Error('Match not found');
      }

      const allPlayers = [...matchDoc.teamA.players, ...matchDoc.teamB.players];
      const reporterInMatch = allPlayers.some(p => p.toString() === reportedBy);
      const reportedInMatch = allPlayers.some(p => p.toString() === reportedPlayer);

      if (!reporterInMatch || !reportedInMatch) {
        throw new Error('Both players must have participated in the match');
      }

      // Create the report
      const report = new Report({
        reportedPlayer,
        reportedBy,
        match,
        category,
        severity,
        description,
        evidence: evidence || [],
        isAnonymous
      });

      await report.save();

      // Check for auto-actions based on report severity and history
      await this.checkAutoActions(reportedPlayer, report);

      return {
        success: true,
        message: 'Report submitted successfully',
        data: {
          reportId: report._id,
          status: report.status,
          priority: report.priority
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Submit a rating for a player
  async submitRating(ratingData) {
    try {
      const {
        ratedPlayer,
        ratedBy,
        match,
        overallRating,
        skillRating,
        teamworkRating,
        attitudeRating,
        punctualityRating,
        communicationRating,
        feedback,
        positives = [],
        improvements = []
      } = ratingData;

      // Validate that rater and rated player are not the same
      if (ratedPlayer === ratedBy) {
        throw new Error('Cannot rate yourself');
      }

      // Check if both players were in the same match
      const matchDoc = await require('../models/Match').findById(match);
      if (!matchDoc) {
        throw new Error('Match not found');
      }

      // Only allow rating after match is completed
      if (matchDoc.status !== 'completed') {
        throw new Error('Can only rate players after match completion');
      }

      const allPlayers = [...matchDoc.teamA.players, ...matchDoc.teamB.players];
      const raterInMatch = allPlayers.some(p => p.toString() === ratedBy);
      const ratedInMatch = allPlayers.some(p => p.toString() === ratedPlayer);

      if (!raterInMatch || !ratedInMatch) {
        throw new Error('Both players must have participated in the match');
      }

      // Check if rating already exists
      const existingRating = await Rating.findOne({
        ratedPlayer,
        ratedBy,
        match
      });

      if (existingRating) {
        throw new Error('You have already rated this player for this match');
      }

      // Create the rating
      const rating = new Rating({
        ratedPlayer,
        ratedBy,
        match,
        overallRating,
        skillRating,
        teamworkRating,
        attitudeRating,
        punctualityRating,
        communicationRating,
        feedback,
        positives,
        improvements,
        matchType: matchDoc.type
      });

      await rating.save();

      return {
        success: true,
        message: 'Rating submitted successfully',
        data: {
          ratingId: rating._id,
          isMutual: rating.isMutual,
          flagged: rating.flagged
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get player's reputation profile
  async getPlayerReputationProfile(playerId) {
    try {
      const user = await User.findById(playerId);
      if (!user) {
        throw new Error('Player not found');
      }

      // Get rating statistics
      const ratingStats = await Rating.calculatePlayerReputation(playerId);
      
      // Get report statistics
      const reportStats = await Report.getPlayerReportStats(playerId);
      
      // Calculate reputation trend (last 30 days vs overall)
      const recentRatings = await Rating.find({
        ratedPlayer: playerId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      const recentAvg = recentRatings.length > 0 
        ? recentRatings.reduce((sum, r) => sum + r.overallRating, 0) / recentRatings.length
        : ratingStats.overallReputation;

      const trend = recentAvg - ratingStats.overallReputation;

      // Get recent feedback themes
      const recentFeedback = await Rating.find({
        ratedPlayer: playerId,
        feedback: { $exists: true, $ne: '' },
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      })
        .select('feedback positives improvements')
        .limit(10);

      return {
        success: true,
        message: 'Player reputation profile retrieved successfully',
        data: {
          playerId,
          playerInfo: {
            name: user.name,
            username: user.username,
            profilePicture: user.profilePicture,
            joinDate: user.createdAt,
            matchesPlayed: user.matchesPlayed
          },
          reputationScore: ratingStats.overallReputation,
          trend: parseFloat(trend.toFixed(2)),
          ratings: {
            total: ratingStats.totalRatings,
            categoryBreakdown: ratingStats.categoryAverages,
            recentCount: recentRatings.length
          },
          reports: {
            total: reportStats.totalReports,
            pending: reportStats.pendingReports,
            resolved: reportStats.resolvedReports,
            dismissed: reportStats.dismissedReports,
            critical: reportStats.criticalReports,
            categories: reportStats.categories
          },
          recentFeedback: recentFeedback.map(r => ({
            feedback: r.feedback,
            positives: r.positives,
            improvements: r.improvements,
            date: r.createdAt
          })),
          suspensionStatus: {
            isSuspended: user.isSuspended,
            suspensionReason: user.suspensionReason,
            suspensionEndDate: user.suspensionEndDate
          }
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Check and apply automatic actions based on reports
  async checkAutoActions(playerId, newReport) {
    try {
      // Get recent reports for this player
      const recentReports = await Report.find({
        reportedPlayer: playerId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      // Get all-time critical reports
      const criticalReports = await Report.find({
        reportedPlayer: playerId,
        severity: 'critical',
        status: { $ne: 'dismissed' }
      });

      const user = await User.findById(playerId);
      let actionTaken = false;

      // Auto-suspend for critical violations
      if (newReport.severity === 'critical' && 
          ['physical_aggression', 'harassment', 'discrimination'].includes(newReport.category)) {
        
        await this.applySuspension(playerId, {
          duration: 7, // 7 days
          reason: `Automatic suspension due to critical violation: ${newReport.category}`,
          reportId: newReport._id
        });
        actionTaken = true;
      }

      // Progressive penalties for repeat offenders
      const recentCount = recentReports.length;
      if (recentCount >= 3 && recentCount < 5) {
        // Warning for 3-4 reports in 30 days
        await this.applyWarning(playerId, {
          reason: 'Multiple reports received in recent period',
          reportId: newReport._id
        });
        actionTaken = true;
      } else if (recentCount >= 5) {
        // Temporary suspension for 5+ reports
        await this.applySuspension(playerId, {
          duration: Math.min(14, recentCount * 2), // Max 14 days
          reason: 'Excessive reports received',
          reportId: newReport._id
        });
        actionTaken = true;
      }

      // Permanent ban for multiple critical violations
      if (criticalReports.length >= 3) {
        await this.applyPermanentBan(playerId, {
          reason: 'Multiple critical violations',
          reportId: newReport._id
        });
        actionTaken = true;
      }

      return actionTaken;
    } catch (error) {
      console.error('Error in auto-actions check:', error);
      return false;
    }
  }

  // Apply suspension to a player
  async applySuspension(playerId, suspensionData) {
    try {
      const { duration, reason, reportId } = suspensionData;
      const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

      await User.findByIdAndUpdate(playerId, {
        isSuspended: true,
        suspensionReason: reason,
        suspensionEndDate: endDate,
        lastSuspended: new Date()
      });

      // Update the report if provided
      if (reportId) {
        await Report.findByIdAndUpdate(reportId, {
          status: 'resolved',
          'resolution.action': 'temporary_suspension',
          'resolution.duration': duration,
          'resolution.reason': reason,
          'resolution.resolvedAt': new Date()
        });
      }

      return {
        success: true,
        message: 'Suspension applied successfully',
        data: {
          playerId,
          duration,
          endDate,
          reason
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Apply warning to a player
  async applyWarning(playerId, warningData) {
    try {
      const { reason, reportId } = warningData;

      const user = await User.findById(playerId);
      const warnings = user.warnings || [];
      warnings.push({
        reason,
        issuedAt: new Date(),
        reportId
      });

      await User.findByIdAndUpdate(playerId, {
        warnings,
        lastWarned: new Date()
      });

      if (reportId) {
        await Report.findByIdAndUpdate(reportId, {
          status: 'resolved',
          'resolution.action': 'warning',
          'resolution.reason': reason,
          'resolution.resolvedAt': new Date()
        });
      }

      return {
        success: true,
        message: 'Warning applied successfully',
        data: {
          playerId,
          reason,
          totalWarnings: warnings.length
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Apply permanent ban
  async applyPermanentBan(playerId, banData) {
    try {
      const { reason, reportId } = banData;

      await User.findByIdAndUpdate(playerId, {
        isBanned: true,
        banReason: reason,
        bannedAt: new Date(),
        isActive: false
      });

      if (reportId) {
        await Report.findByIdAndUpdate(reportId, {
          status: 'resolved',
          'resolution.action': 'permanent_ban',
          'resolution.reason': reason,
          'resolution.resolvedAt': new Date()
        });
      }

      return {
        success: true,
        message: 'Permanent ban applied successfully',
        data: {
          playerId,
          reason
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get reports requiring admin attention
  async getReportsForReview(filters = {}) {
    try {
      const {
        status = ['pending', 'under_review'],
        severity,
        category,
        priority,
        limit = 20,
        page = 1
      } = filters;

      let query = { status: { $in: Array.isArray(status) ? status : [status] } };

      if (severity) query.severity = severity;
      if (category) query.category = category;
      if (priority) query.priority = { $gte: priority };

      const skip = (page - 1) * limit;

      const reports = await Report.find(query)
        .populate('reportedPlayer', 'name username profilePicture reputationScore')
        .populate('reportedBy', 'name username')
        .populate('match', 'title scheduledTime location')
        .sort({ priority: -1, createdAt: 1 })
        .skip(skip)
        .limit(limit);

      const totalCount = await Report.countDocuments(query);

      return {
        success: true,
        message: 'Reports retrieved successfully',
        data: {
          reports,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Resolve a report (admin function)
  async resolveReport(reportId, resolution, adminId) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Apply the resolution action
      switch (resolution.action) {
        case 'warning':
          await this.applyWarning(report.reportedPlayer, {
            reason: resolution.reason,
            reportId: reportId
          });
          break;
        case 'temporary_suspension':
          await this.applySuspension(report.reportedPlayer, {
            duration: resolution.duration,
            reason: resolution.reason,
            reportId: reportId
          });
          break;
        case 'permanent_ban':
          await this.applyPermanentBan(report.reportedPlayer, {
            reason: resolution.reason,
            reportId: reportId
          });
          break;
        case 'reputation_penalty':
          await User.findByIdAndUpdate(report.reportedPlayer, {
            $inc: { reputationScore: -0.5 }
          });
          break;
      }

      await report.resolveReport(resolution, adminId);

      return {
        success: true,
        message: 'Report resolved successfully',
        data: {
          reportId,
          action: resolution.action,
          resolvedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get reputation statistics and trends
  async getReputationStats() {
    try {
      // Overall platform statistics
      const totalUsers = await User.countDocuments({ isActive: true });
      const totalRatings = await Rating.countDocuments({ isActive: true });
      const totalReports = await Report.countDocuments();
      const pendingReports = await Report.countDocuments({ status: 'pending' });

      // Average reputation score
      const avgReputationResult = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, avgReputation: { $avg: '$reputationScore' } } }
      ]);
      const avgReputation = avgReputationResult[0]?.avgReputation || 3.0;

      // Top rated players
      const topRatedPlayers = await Rating.getTopRatedPlayers(10, 5);

      // Trending report categories
      const trendingCategories = await Report.getTrendingCategories(30);

      return {
        success: true,
        message: 'Reputation statistics retrieved successfully',
        data: {
          overview: {
            totalUsers,
            totalRatings,
            totalReports,
            pendingReports,
            averageReputation: parseFloat(avgReputation.toFixed(2))
          },
          topRatedPlayers,
          trendingReportCategories: trendingCategories
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new ReputationService();