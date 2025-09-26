const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportedPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'unsportsmanlike_conduct',
      'abusive_language',
      'physical_aggression',
      'no_show',
      'late_arrival',
      'cheating',
      'harassment',
      'discrimination',
      'other'
    ]
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'video', 'witness', 'referee'],
      required: true
    },
    url: String, // For image/video evidence
    witnessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String
  }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'],
    default: 'pending',
    index: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  adminNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    action: {
      type: String,
      enum: [
        'no_action',
        'warning',
        'temporary_suspension',
        'permanent_ban',
        'reputation_penalty',
        'match_ban',
        'community_service'
      ]
    },
    duration: Number, // Duration in days for suspensions/bans
    reason: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  isAnonymous: {
    type: Boolean,
    default: false
  },
  tags: [String],
  relatedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
reportSchema.index({ reportedPlayer: 1, status: 1 });
reportSchema.index({ match: 1, category: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ priority: -1, status: 1 });

// Virtual for report age in hours
reportSchema.virtual('ageInHours').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for urgency score (combines priority, severity, and age)
reportSchema.virtual('urgencyScore').get(function() {
  const severityWeight = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };
  
  const ageBonus = Math.min(this.ageInHours / 24, 2); // Max 2 points for age
  return this.priority + severityWeight[this.severity] + ageBonus;
});

// Static methods

// Get reports requiring immediate attention
reportSchema.statics.getUrgentReports = function(limit = 10) {
  return this.find({
    status: { $in: ['pending', 'under_review'] },
    $or: [
      { severity: 'critical' },
      { priority: { $gte: 4 } },
      { 
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        status: 'pending'
      }
    ]
  })
    .populate('reportedPlayer', 'name username profilePicture reputationScore')
    .populate('reportedBy', 'name username')
    .populate('match', 'title scheduledTime')
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit);
};

// Get reports by player with statistics
reportSchema.statics.getPlayerReportStats = async function(playerId) {
  const stats = await this.aggregate([
    { $match: { reportedPlayer: mongoose.Types.ObjectId(playerId) } },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        pendingReports: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        resolvedReports: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        dismissedReports: {
          $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] }
        },
        criticalReports: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        },
        avgSeverity: { $avg: {
          $switch: {
            branches: [
              { case: { $eq: ['$severity', 'low'] }, then: 1 },
              { case: { $eq: ['$severity', 'medium'] }, then: 2 },
              { case: { $eq: ['$severity', 'high'] }, then: 3 },
              { case: { $eq: ['$severity', 'critical'] }, then: 4 }
            ]
          }
        }},
        categories: { $addToSet: '$category' }
      }
    }
  ]);

  return stats[0] || {
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    dismissedReports: 0,
    criticalReports: 0,
    avgSeverity: 0,
    categories: []
  };
};

// Get trending report categories
reportSchema.statics.getTrendingCategories = function(days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgSeverity: { $avg: {
          $switch: {
            branches: [
              { case: { $eq: ['$severity', 'low'] }, then: 1 },
              { case: { $eq: ['$severity', 'medium'] }, then: 2 },
              { case: { $eq: ['$severity', 'high'] }, then: 3 },
              { case: { $eq: ['$severity', 'critical'] }, then: 4 }
            ]
          }
        }}
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
};

// Instance methods

// Add admin note
reportSchema.methods.addAdminNote = function(note, adminId) {
  this.adminNotes.push({
    note,
    addedBy: adminId,
    addedAt: new Date()
  });
  return this.save();
};

// Resolve report
reportSchema.methods.resolveReport = function(resolution, adminId) {
  this.status = 'resolved';
  this.resolution = {
    ...resolution,
    resolvedBy: adminId,
    resolvedAt: new Date()
  };
  return this.save();
};

// Escalate report
reportSchema.methods.escalate = function() {
  this.status = 'escalated';
  this.priority = Math.min(this.priority + 1, 5);
  return this.save();
};

// Pre-save middleware to auto-calculate priority based on severity and category
reportSchema.pre('save', function(next) {
  if (this.isNew) {
    // Auto-assign priority based on severity and category
    const severityPriority = {
      'low': 1,
      'medium': 2,
      'high': 4,
      'critical': 5
    };

    const criticalCategories = ['physical_aggression', 'harassment', 'discrimination'];
    const basePriority = severityPriority[this.severity] || 3;
    
    if (criticalCategories.includes(this.category)) {
      this.priority = Math.min(basePriority + 1, 5);
    } else {
      this.priority = basePriority;
    }
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);