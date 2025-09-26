const mongoose = require('mongoose');

const MatchRequestSchema = new mongoose.Schema({
  // Request Details
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match ID is required']
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  
  // Position Requirements
  positionNeeded: {
    type: String,
    enum: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'],
    required: [true, 'Position needed is required']
  },
  slotsAvailable: {
    type: Number,
    required: [true, 'Slots available is required'],
    min: [1, 'At least 1 slot must be available'],
    max: [11, 'Cannot exceed 11 slots']
  },
  
  // Target Criteria
  targetSkillLevel: {
    type: String,
    enum: ['Any', 'Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional'],
    default: 'Any'
  },
  maxDistance: {
    type: Number, // in meters
    default: 25000, // 25km
    min: [100, 'Distance must be at least 100 meters'],
    max: [100000, 'Distance cannot exceed 100km']
  },
  
  // Request Details
  message: {
    type: String,
    trim: true,
    maxlength: [300, 'Message cannot exceed 300 characters']
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Status & Timing
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'expired', 'cancelled'],
    default: 'active'
  },
  broadcastTime: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Expiry time must be in the future'
    }
  },
  
  // Response Tracking
  playersContacted: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contactedAt: {
      type: Date,
      default: Date.now
    },
    response: {
      type: String,
      enum: ['pending', 'interested', 'declined', 'joined'],
      default: 'pending'
    },
    responseAt: {
      type: Date
    }
  }],
  playersJoined: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Analytics
  totalContacted: {
    type: Number,
    default: 0
  },
  totalInterested: {
    type: Number,
    default: 0
  },
  totalJoined: {
    type: Number,
    default: 0
  },
  
  // Auto-fulfillment
  autoFulfill: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
MatchRequestSchema.index({ matchId: 1 });
MatchRequestSchema.index({ requestedBy: 1 });
MatchRequestSchema.index({ status: 1 });
MatchRequestSchema.index({ positionNeeded: 1 });
MatchRequestSchema.index({ broadcastTime: 1 });
MatchRequestSchema.index({ expiresAt: 1 });

// Virtual for remaining slots needed
MatchRequestSchema.virtual('remainingSlots').get(function() {
  return Math.max(0, this.slotsAvailable - this.totalJoined);
});

// Virtual for response rate
MatchRequestSchema.virtual('responseRate').get(function() {
  return this.totalContacted > 0 ? 
    ((this.totalInterested / this.totalContacted) * 100).toFixed(1) : 0;
});

// Virtual for success rate
MatchRequestSchema.virtual('successRate').get(function() {
  return this.totalContacted > 0 ? 
    ((this.totalJoined / this.totalContacted) * 100).toFixed(1) : 0;
});

// Auto-expire requests
MatchRequestSchema.pre('save', function(next) {
  // Check if request has expired
  if (this.expiresAt < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  
  // Auto-fulfill if all slots are filled
  if (this.autoFulfill && this.remainingSlots === 0 && this.status === 'active') {
    this.status = 'fulfilled';
  }
  
  next();
});

// Static method to find eligible players
MatchRequestSchema.statics.findEligiblePlayers = async function(requestId) {
  const request = await this.findById(requestId)
    .populate('matchId')
    .populate('requestedBy');
    
  if (!request || !request.matchId) {
    throw new Error('Request or match not found');
  }
  
  const match = request.matchId;
  const [longitude, latitude] = match.location.coordinates;
  
  // Build query for eligible players
  const query = {
    // Location within range
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: request.maxDistance
      }
    },
    // Active and not suspended
    isActive: true,
    isSuspended: false,
    // Not the requester
    _id: { $ne: request.requestedBy._id },
    // Not already in the match
    _id: {
      $nin: [
        ...match.teams.teamA.players.map(p => p.playerId),
        ...match.teams.teamB.players.map(p => p.playerId),
        match.organizerId
      ]
    },
    // Not already contacted for this request
    _id: { $nin: request.playersContacted.map(p => p.playerId) }
  };
  
  // Add skill level filter if specified
  if (request.targetSkillLevel && request.targetSkillLevel !== 'Any') {
    const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional'];
    const minIndex = skillLevels.indexOf(request.targetSkillLevel);
    const acceptableSkills = skillLevels.slice(minIndex);
    query.skillLevel = { $in: acceptableSkills };
  }
  
  // Add position preference (optional - players can play different positions)
  // This is just for ranking, not filtering
  
  const User = mongoose.model('User');
  const eligiblePlayers = await User.find(query)
    .select('name username position skillLevel reputationScore location profilePicture')
    .limit(50) // Limit to prevent spam
    .sort({ reputationScore: -1 }); // Higher reputation first
    
  return eligiblePlayers;
};

// Instance method to add contacted player
MatchRequestSchema.methods.addContactedPlayer = function(playerId, response = 'pending') {
  // Check if player already contacted
  const existingContact = this.playersContacted.find(p => 
    p.playerId.toString() === playerId.toString()
  );
  
  if (existingContact) {
    // Update response
    existingContact.response = response;
    existingContact.responseAt = new Date();
  } else {
    // Add new contact
    this.playersContacted.push({
      playerId,
      response,
      responseAt: response !== 'pending' ? new Date() : undefined
    });
    this.totalContacted += 1;
  }
  
  // Update counters
  this.updateCounters();
};

// Instance method to record player join
MatchRequestSchema.methods.recordPlayerJoin = function(playerId) {
  // Add to joined players
  const alreadyJoined = this.playersJoined.find(p => 
    p.playerId.toString() === playerId.toString()
  );
  
  if (!alreadyJoined) {
    this.playersJoined.push({ playerId });
    this.totalJoined += 1;
  }
  
  // Update contacted player status
  const contactedPlayer = this.playersContacted.find(p => 
    p.playerId.toString() === playerId.toString()
  );
  
  if (contactedPlayer) {
    contactedPlayer.response = 'joined';
    contactedPlayer.responseAt = new Date();
  }
  
  // Update counters
  this.updateCounters();
  
  // Check if fulfilled
  if (this.autoFulfill && this.remainingSlots === 0) {
    this.status = 'fulfilled';
  }
};

// Instance method to update counters
MatchRequestSchema.methods.updateCounters = function() {
  this.totalInterested = this.playersContacted.filter(p => 
    p.response === 'interested' || p.response === 'joined'
  ).length;
  
  this.totalJoined = this.playersJoined.length;
};

// Static method to cleanup expired requests
MatchRequestSchema.statics.cleanupExpired = async function() {
  const expiredRequests = await this.updateMany(
    {
      status: 'active',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'expired'
    }
  );
  
  return expiredRequests.modifiedCount;
};

module.exports = mongoose.model('MatchRequest', MatchRequestSchema);