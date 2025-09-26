const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  ratedPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ratedBy: {
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
  // Overall rating (1-5 stars)
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Detailed ratings by category
  skillRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  teamworkRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  attitudeRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  punctualityRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  communicationRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  // Optional feedback
  feedback: {
    type: String,
    maxlength: 500,
    trim: true
  },
  // Positive aspects selected
  positives: [{
    type: String,
    enum: [
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
    ]
  }],
  // Areas for improvement
  improvements: [{
    type: String,
    enum: [
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
    ]
  }],
  // Tags for quick categorization
  tags: [String],
  // Rating context
  matchType: {
    type: String,
    enum: ['casual', 'competitive', 'tournament', 'friendly']
  },
  // Weight of this rating based on rater's reputation and relationship
  ratingWeight: {
    type: Number,
    min: 0.1,
    max: 2.0,
    default: 1.0
  },
  // Whether this rating was flagged for review
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  // Whether this is a mutual rating (both players rated each other)
  isMutual: {
    type: Boolean,
    default: false
  },
  // Admin verification if needed
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes to prevent duplicate ratings
ratingSchema.index({ ratedPlayer: 1, ratedBy: 1, match: 1 }, { unique: true });
ratingSchema.index({ match: 1, ratedPlayer: 1 });
ratingSchema.index({ ratedPlayer: 1, createdAt: -1 });
ratingSchema.index({ ratedBy: 1, createdAt: -1 });

// Virtual for weighted rating (considering rating weight)
ratingSchema.virtual('weightedOverallRating').get(function() {
  return this.overallRating * this.ratingWeight;
});

// Virtual for category average
ratingSchema.virtual('categoryAverage').get(function() {
  const categories = [
    this.skillRating,
    this.teamworkRating,
    this.attitudeRating,
    this.punctualityRating,
    this.communicationRating
  ];
  const sum = categories.reduce((acc, rating) => acc + rating, 0);
  return (sum / categories.length).toFixed(2);
});

// Static methods

// Calculate player's overall reputation from all ratings
ratingSchema.statics.calculatePlayerReputation = async function(playerId) {
  const stats = await this.aggregate([
    { 
      $match: { 
        ratedPlayer: mongoose.Types.ObjectId(playerId),
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        weightedRatingSum: { $sum: { $multiply: ['$overallRating', '$ratingWeight'] } },
        totalWeight: { $sum: '$ratingWeight' },
        avgSkill: { $avg: '$skillRating' },
        avgTeamwork: { $avg: '$teamworkRating' },
        avgAttitude: { $avg: '$attitudeRating' },
        avgPunctuality: { $avg: '$punctualityRating' },
        avgCommunication: { $avg: '$communicationRating' },
        recentRatings: {
          $avg: {
            $cond: [
              { 
                $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
              },
              '$overallRating',
              null
            ]
          }
        }
      }
    }
  ]);

  const result = stats[0];
  if (!result) {
    return {
      overallReputation: 3.0, // Default neutral reputation
      totalRatings: 0,
      categoryAverages: {
        skill: 3.0,
        teamwork: 3.0,
        attitude: 3.0,
        punctuality: 3.0,
        communication: 3.0
      },
      recentTrend: 0
    };
  }

  const overallReputation = result.totalWeight > 0 
    ? (result.weightedRatingSum / result.totalWeight).toFixed(2)
    : 3.0;

  return {
    overallReputation: parseFloat(overallReputation),
    totalRatings: result.totalRatings,
    categoryAverages: {
      skill: parseFloat(result.avgSkill?.toFixed(2) || 3.0),
      teamwork: parseFloat(result.avgTeamwork?.toFixed(2) || 3.0),
      attitude: parseFloat(result.avgAttitude?.toFixed(2) || 3.0),
      punctuality: parseFloat(result.avgPunctuality?.toFixed(2) || 3.0),
      communication: parseFloat(result.avgCommunication?.toFixed(2) || 3.0)
    },
    recentTrend: result.recentRatings ? parseFloat(result.recentRatings.toFixed(2)) - parseFloat(overallReputation) : 0
  };
};

// Get match ratings summary
ratingSchema.statics.getMatchRatingsSummary = function(matchId) {
  return this.aggregate([
    { $match: { match: mongoose.Types.ObjectId(matchId), isActive: true } },
    {
      $group: {
        _id: '$ratedPlayer',
        avgOverallRating: { $avg: '$overallRating' },
        avgSkillRating: { $avg: '$skillRating' },
        avgTeamworkRating: { $avg: '$teamworkRating' },
        avgAttitudeRating: { $avg: '$attitudeRating' },
        ratingCount: { $sum: 1 },
        positives: { $push: '$positives' },
        improvements: { $push: '$improvements' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'player'
      }
    },
    {
      $unwind: '$player'
    },
    {
      $project: {
        player: {
          id: '$player._id',
          name: '$player.name',
          username: '$player.username',
          profilePicture: '$player.profilePicture'
        },
        averageRatings: {
          overall: { $round: ['$avgOverallRating', 2] },
          skill: { $round: ['$avgSkillRating', 2] },
          teamwork: { $round: ['$avgTeamworkRating', 2] },
          attitude: { $round: ['$avgAttitudeRating', 2] }
        },
        ratingCount: 1,
        mostCommonPositives: {
          $slice: [
            {
              $map: {
                input: { $setUnion: { $reduce: { input: '$positives', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } } },
                as: 'positive',
                in: {
                  tag: '$$positive',
                  count: {
                    $size: {
                      $filter: {
                        input: { $reduce: { input: '$positives', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } },
                        cond: { $eq: ['$$this', '$$positive'] }
                      }
                    }
                  }
                }
              }
            },
            3
          ]
        }
      }
    },
    { $sort: { 'averageRatings.overall': -1 } }
  ]);
};

// Get top rated players
ratingSchema.statics.getTopRatedPlayers = function(limit = 10, minRatings = 5) {
  return this.aggregate([
    { 
      $match: { 
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
      }
    },
    {
      $group: {
        _id: '$ratedPlayer',
        avgRating: { $avg: '$overallRating' },
        weightedAvg: { 
          $avg: { $multiply: ['$overallRating', '$ratingWeight'] }
        },
        ratingCount: { $sum: 1 },
        totalWeight: { $sum: '$ratingWeight' }
      }
    },
    { $match: { ratingCount: { $gte: minRatings } } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'player'
      }
    },
    { $unwind: '$player' },
    {
      $project: {
        player: {
          id: '$player._id',
          name: '$player.name',
          username: '$player.username',
          profilePicture: '$player.profilePicture'
        },
        averageRating: { $round: ['$avgRating', 2] },
        weightedRating: { $round: [{ $divide: ['$weightedAvg', { $divide: ['$totalWeight', '$ratingCount'] }] }, 2] },
        totalRatings: '$ratingCount'
      }
    },
    { $sort: { weightedRating: -1, totalRatings: -1 } },
    { $limit: limit }
  ]);
};

// Instance methods

// Check if rating is suspicious (potential fake or biased)
ratingSchema.methods.isSuspicious = function() {
  // Check for extreme ratings from low-reputation raters
  if (this.overallRating <= 1 || this.overallRating >= 5) {
    return true;
  }
  
  // Check for inconsistency between overall and category ratings
  const categoryAvg = (this.skillRating + this.teamworkRating + this.attitudeRating + 
                      this.punctualityRating + this.communicationRating) / 5;
  const difference = Math.abs(this.overallRating - categoryAvg);
  
  return difference > 1.5;
};

// Pre-save middleware to calculate rating weight and detect suspicious ratings
ratingSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Get rater's reputation to calculate weight
      const rater = await mongoose.model('User').findById(this.ratedBy);
      if (rater) {
        // Weight based on rater's reputation (3.0 is neutral)
        const reputationFactor = (rater.reputationScore - 3.0) * 0.2;
        this.ratingWeight = Math.max(0.1, Math.min(2.0, 1.0 + reputationFactor));
        
        // Check for suspicious rating patterns
        if (this.isSuspicious() || rater.reputationScore < 2.0) {
          this.flagged = true;
          this.flagReason = 'Suspicious rating pattern detected';
        }
      }
      
      // Check if this creates a mutual rating
      const mutualRating = await this.constructor.findOne({
        ratedPlayer: this.ratedBy,
        ratedBy: this.ratedPlayer,
        match: this.match
      });
      
      if (mutualRating) {
        this.isMutual = true;
        mutualRating.isMutual = true;
        await mutualRating.save();
      }
    } catch (error) {
      console.error('Error in rating pre-save middleware:', error);
    }
  }
  next();
});

// Post-save middleware to update player's reputation
ratingSchema.post('save', async function() {
  try {
    const reputationData = await this.constructor.calculatePlayerReputation(this.ratedPlayer);
    await mongoose.model('User').findByIdAndUpdate(
      this.ratedPlayer,
      { 
        reputationScore: reputationData.overallReputation,
        lastRatedAt: new Date()
      }
    );
  } catch (error) {
    console.error('Error updating player reputation:', error);
  }
});

module.exports = mongoose.model('Rating', ratingSchema);