const mongoose = require('mongoose');

const MatchEventSchema = new mongoose.Schema({
  // Event Details
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match ID is required']
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Player ID is required']
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event recorder is required']
  },
  
  // Event Type & Details
  eventType: {
    type: String,
    enum: [
      'goal', 'assist', 'shot_on_target', 'shot_off_target', 
      'yellow_card', 'red_card', 'substitution_in', 'substitution_out',
      'penalty_scored', 'penalty_missed', 'own_goal', 'save',
      'corner', 'offside', 'foul', 'tackle', 'interception'
    ],
    required: [true, 'Event type is required']
  },
  
  // Match Context
  team: {
    type: String,
    enum: ['teamA', 'teamB'],
    required: [true, 'Team is required']
  },
  minute: {
    type: Number,
    required: [true, 'Match minute is required'],
    min: [0, 'Minute cannot be negative'],
    max: [180, 'Minute cannot exceed 180']
  },
  half: {
    type: String,
    enum: ['first', 'second', 'extra_first', 'extra_second', 'penalty'],
    required: [true, 'Match half is required']
  },
  
  // Event Details
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  position: {
    coordinates: {
      x: {
        type: Number,
        min: 0,
        max: 100 // Percentage of field width
      },
      y: {
        type: Number,
        min: 0,
        max: 100 // Percentage of field height
      }
    }
  },
  
  // Related Players (for assists, fouls, etc.)
  relatedPlayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedPlayerRole: {
    type: String,
    enum: ['assisted_by', 'fouled_by', 'replaced_by', 'fouled_player']
  },
  
  // Card Details (for yellow/red cards)
  cardReason: {
    type: String,
    enum: [
      'unsporting_behavior', 'dissent', 'persistent_fouling', 
      'delaying_game', 'not_respecting_distance', 'entering_leaving_without_permission',
      'serious_foul_play', 'violent_conduct', 'offensive_language', 
      'second_yellow', 'spitting', 'denying_goal_opportunity'
    ]
  },
  
  // Substitution Details
  substitutionReason: {
    type: String,
    enum: ['tactical', 'injury', 'performance', 'disciplinary']
  },
  
  // Score at time of event
  scoreAtTime: {
    teamA: {
      type: Number,
      default: 0,
      min: 0
    },
    teamB: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Event Validation
  isValidated: {
    type: Boolean,
    default: false
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: {
    type: Date
  },
  
  // Event Status
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date
  },
  deleteReason: {
    type: String,
    maxlength: [100, 'Delete reason cannot exceed 100 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
MatchEventSchema.index({ matchId: 1, minute: 1 });
MatchEventSchema.index({ playerId: 1 });
MatchEventSchema.index({ eventType: 1 });
MatchEventSchema.index({ team: 1 });
MatchEventSchema.index({ recordedBy: 1 });
MatchEventSchema.index({ isDeleted: 1 });

// Virtual for event impact on score
MatchEventSchema.virtual('impactsScore').get(function() {
  return ['goal', 'penalty_scored', 'own_goal'].includes(this.eventType);
});

// Virtual for event classification
MatchEventSchema.virtual('eventCategory').get(function() {
  const categories = {
    'scoring': ['goal', 'assist', 'penalty_scored', 'own_goal'],
    'shooting': ['shot_on_target', 'shot_off_target', 'penalty_missed'],
    'disciplinary': ['yellow_card', 'red_card'],
    'substitution': ['substitution_in', 'substitution_out'],
    'defending': ['save', 'tackle', 'interception'],
    'other': ['corner', 'offside', 'foul']
  };
  
  for (const [category, events] of Object.entries(categories)) {
    if (events.includes(this.eventType)) {
      return category;
    }
  }
  return 'other';
});

// Static method to get match statistics
MatchEventSchema.statics.getMatchStats = async function(matchId) {
  const events = await this.find({ 
    matchId, 
    isDeleted: false 
  }).populate('playerId', 'name username position');
  
  const stats = {
    totalEvents: events.length,
    goals: events.filter(e => e.eventType === 'goal').length,
    assists: events.filter(e => e.eventType === 'assist').length,
    shots: events.filter(e => ['shot_on_target', 'shot_off_target'].includes(e.eventType)).length,
    shotsOnTarget: events.filter(e => e.eventType === 'shot_on_target').length,
    yellowCards: events.filter(e => e.eventType === 'yellow_card').length,
    redCards: events.filter(e => e.eventType === 'red_card').length,
    substitutions: events.filter(e => e.eventType === 'substitution_in').length,
    
    // Team-wise breakdown
    teamA: {
      goals: events.filter(e => e.team === 'teamA' && e.eventType === 'goal').length,
      shots: events.filter(e => e.team === 'teamA' && ['shot_on_target', 'shot_off_target'].includes(e.eventType)).length,
      cards: events.filter(e => e.team === 'teamA' && ['yellow_card', 'red_card'].includes(e.eventType)).length
    },
    teamB: {
      goals: events.filter(e => e.team === 'teamB' && e.eventType === 'goal').length,
      shots: events.filter(e => e.team === 'teamB' && ['shot_on_target', 'shot_off_target'].includes(e.eventType)).length,
      cards: events.filter(e => e.team === 'teamB' && ['yellow_card', 'red_card'].includes(e.eventType)).length
    },
    
    // Top performers
    topScorer: null,
    topAssister: null,
    events: events
  };
  
  // Calculate top performers
  const goalScorers = {};
  const assisters = {};
  
  events.forEach(event => {
    if (event.eventType === 'goal' && event.playerId) {
      const playerId = event.playerId._id.toString();
      goalScorers[playerId] = (goalScorers[playerId] || 0) + 1;
    }
    if (event.eventType === 'assist' && event.playerId) {
      const playerId = event.playerId._id.toString();
      assisters[playerId] = (assisters[playerId] || 0) + 1;
    }
  });
  
  // Find top scorer
  if (Object.keys(goalScorers).length > 0) {
    const topScorerPlayerId = Object.keys(goalScorers).reduce((a, b) => 
      goalScorers[a] > goalScorers[b] ? a : b
    );
    const topScorerEvent = events.find(e => e.playerId._id.toString() === topScorerPlayerId);
    stats.topScorer = {
      player: topScorerEvent.playerId,
      goals: goalScorers[topScorerPlayerId]
    };
  }
  
  // Find top assister
  if (Object.keys(assisters).length > 0) {
    const topAssisterPlayerId = Object.keys(assisters).reduce((a, b) => 
      assisters[a] > assisters[b] ? a : b
    );
    const topAssisterEvent = events.find(e => e.playerId._id.toString() === topAssisterPlayerId);
    stats.topAssister = {
      player: topAssisterEvent.playerId,
      assists: assisters[topAssisterPlayerId]
    };
  }
  
  return stats;
};

// Static method to get player statistics from events
MatchEventSchema.statics.getPlayerStats = async function(playerId, matchId = null) {
  const query = { playerId, isDeleted: false };
  if (matchId) {
    query.matchId = matchId;
  }
  
  const events = await this.find(query);
  
  const stats = {
    totalEvents: events.length,
    goals: events.filter(e => e.eventType === 'goal').length,
    assists: events.filter(e => e.eventType === 'assist').length,
    shotsOnTarget: events.filter(e => e.eventType === 'shot_on_target').length,
    shotsOffTarget: events.filter(e => e.eventType === 'shot_off_target').length,
    yellowCards: events.filter(e => e.eventType === 'yellow_card').length,
    redCards: events.filter(e => e.eventType === 'red_card').length,
    saves: events.filter(e => e.eventType === 'save').length,
    tackles: events.filter(e => e.eventType === 'tackle').length,
    interceptions: events.filter(e => e.eventType === 'interception').length,
    
    // Calculated metrics
    totalShots: events.filter(e => ['shot_on_target', 'shot_off_target'].includes(e.eventType)).length,
    shootingAccuracy: 0,
    
    // Events by match
    eventsByMatch: {}
  };
  
  // Calculate shooting accuracy
  if (stats.totalShots > 0) {
    stats.shootingAccuracy = ((stats.shotsOnTarget / stats.totalShots) * 100).toFixed(1);
  }
  
  // Group events by match
  events.forEach(event => {
    const matchId = event.matchId.toString();
    if (!stats.eventsByMatch[matchId]) {
      stats.eventsByMatch[matchId] = [];
    }
    stats.eventsByMatch[matchId].push(event);
  });
  
  return stats;
};

// Instance method to validate event
MatchEventSchema.methods.validateEvent = function(validatorId) {
  this.isValidated = true;
  this.validatedBy = validatorId;
  this.validatedAt = new Date();
};

// Instance method to soft delete event
MatchEventSchema.methods.softDelete = function(deleterId, reason) {
  this.isDeleted = true;
  this.deletedBy = deleterId;
  this.deletedAt = new Date();
  this.deleteReason = reason;
};

module.exports = mongoose.model('MatchEvent', MatchEventSchema);