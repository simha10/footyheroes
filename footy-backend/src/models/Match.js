const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  // Basic Match Info
  title: {
    type: String,
    required: [true, 'Match title is required'],
    trim: true,
    maxlength: [100, 'Match title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required']
  },
  
  // Match Details
  format: {
    type: String,
    enum: ['5v5', '7v7', '11v11'],
    required: [true, 'Match format is required']
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  skillLevelRequired: {
    type: String,
    enum: ['Any', 'Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional'],
    default: 'Any'
  },
  
  // Location & Time
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Match location coordinates are required'],
      index: '2dsphere'
    },
    address: {
      type: String,
      required: [true, 'Match address is required'],
      trim: true
    },
    venue: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue name cannot exceed 200 characters']
    }
  },
  dateTime: {
    type: Date,
    required: [true, 'Match date and time is required'],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Match date must be in the future'
    }
  },
  duration: {
    type: Number, // Duration in minutes
    default: 90,
    min: [30, 'Match duration must be at least 30 minutes'],
    max: [180, 'Match duration cannot exceed 180 minutes']
  },
  
  // Team Management
  teams: {
    teamA: {
      name: {
        type: String,
        default: 'Team A'
      },
      players: [{
        playerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        position: {
          type: String,
          enum: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST']
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        isConfirmed: {
          type: Boolean,
          default: true
        }
      }],
      color: {
        type: String,
        default: '#FF0000' // Red
      }
    },
    teamB: {
      name: {
        type: String,
        default: 'Team B'
      },
      players: [{
        playerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        position: {
          type: String,
          enum: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST']
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        isConfirmed: {
          type: Boolean,
          default: true
        }
      }],
      color: {
        type: String,
        default: '#0000FF' // Blue
      }
    }
  },
  
  // Capacity Management
  maxPlayersPerTeam: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        if (this.format === '5v5') return v === 5;
        if (this.format === '7v7') return v === 7;
        if (this.format === '11v11') return v === 11;
        return false;
      },
      message: 'Max players per team must match the format (5v5: 5, 7v7: 7, 11v11: 11)'
    }
  },
  slotsOpen: {
    type: Number,
    default: function() {
      return this.maxPlayersPerTeam * 2; // Total slots for both teams
    }
  },
  
  // Match Status
  status: {
    type: String,
    enum: ['open', 'full', 'ongoing', 'completed', 'cancelled'],
    default: 'open'
  },
  
  // Referee Management
  referee: {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isConfirmed: {
      type: Boolean,
      default: false
    },
    assignedAt: {
      type: Date
    }
  },
  
  // Match Statistics
  score: {
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
  
  // Match Rules & Settings
  rules: {
    allowSubstitutions: {
      type: Boolean,
      default: true
    },
    maxSubstitutions: {
      type: Number,
      default: 3,
      min: 0,
      max: 7
    },
    allowLatePlayers: {
      type: Boolean,
      default: true
    },
    lateJoinDeadline: {
      type: Number, // Minutes before match starts
      default: 15,
      min: 0,
      max: 60
    }
  },
  
  // Financial
  cost: {
    perPlayer: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'app', 'free'],
      default: 'free'
    }
  },
  
  // Match Timeline
  timeline: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    startedAt: {
      type: Date
    },
    endedAt: {
      type: Date
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  
  // Additional Info
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly']
    },
    interval: {
      type: Number,
      min: 1,
      max: 12
    },
    endDate: {
      type: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
MatchSchema.index({ location: '2dsphere' });
MatchSchema.index({ dateTime: 1 });
MatchSchema.index({ status: 1 });
MatchSchema.index({ organizerId: 1 });
MatchSchema.index({ format: 1 });
MatchSchema.index({ type: 1 });
MatchSchema.index({ 'teams.teamA.players.playerId': 1 });
MatchSchema.index({ 'teams.teamB.players.playerId': 1 });

// Virtual for total players
MatchSchema.virtual('totalPlayers').get(function() {
  return this.teams.teamA.players.length + this.teams.teamB.players.length;
});

// Virtual for available slots
MatchSchema.virtual('availableSlots').get(function() {
  return (this.maxPlayersPerTeam * 2) - this.totalPlayers;
});

// Virtual for match full status
MatchSchema.virtual('isFull').get(function() {
  return this.availableSlots === 0;
});

// Virtual for team A player count
MatchSchema.virtual('teamACount').get(function() {
  return this.teams.teamA.players.length;
});

// Virtual for team B player count
MatchSchema.virtual('teamBCount').get(function() {
  return this.teams.teamB.players.length;
});

// Auto-update slotsOpen and status
MatchSchema.pre('save', function(next) {
  this.slotsOpen = this.availableSlots;
  
  // Update status based on slots
  if (this.availableSlots === 0 && this.status === 'open') {
    this.status = 'full';
  } else if (this.availableSlots > 0 && this.status === 'full') {
    this.status = 'open';
  }
  
  // Update last activity
  this.timeline.lastActivity = new Date();
  
  next();
});

// Static method to find nearby matches
MatchSchema.statics.findNearby = function(longitude, latitude, maxDistance = 25000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters (25km default)
      }
    },
    status: { $in: ['open', 'full'] },
    dateTime: { $gte: new Date() }
  }).populate('organizerId', 'name username profilePicture reputationScore')
    .populate('teams.teamA.players.playerId', 'name username position skillLevel')
    .populate('teams.teamB.players.playerId', 'name username position skillLevel')
    .populate('referee.playerId', 'name username');
};

// Instance method to check if user can join
MatchSchema.methods.canUserJoin = function(userId) {
  // Check if match is open and has slots
  if (this.status !== 'open' || this.availableSlots === 0) {
    return { canJoin: false, reason: 'Match is full or not accepting players' };
  }
  
  // Check if user is already in the match
  const isInTeamA = this.teams.teamA.players.some(player => 
    player.playerId.toString() === userId.toString()
  );
  const isInTeamB = this.teams.teamB.players.some(player => 
    player.playerId.toString() === userId.toString()
  );
  
  if (isInTeamA || isInTeamB) {
    return { canJoin: false, reason: 'User is already in this match' };
  }
  
  // Check if organizer
  if (this.organizerId.toString() === userId.toString()) {
    return { canJoin: false, reason: 'Organizer cannot join as player' };
  }
  
  // Check time constraints
  const now = new Date();
  const matchStart = new Date(this.dateTime);
  const deadlineMinutes = this.rules.lateJoinDeadline || 15;
  const joinDeadline = new Date(matchStart.getTime() - (deadlineMinutes * 60 * 1000));
  
  if (now > joinDeadline) {
    return { canJoin: false, reason: 'Join deadline has passed' };
  }
  
  return { canJoin: true };
};

// Instance method to add player to match
MatchSchema.methods.addPlayer = function(userId, preferredPosition = null) {
  const teamACount = this.teamACount;
  const teamBCount = this.teamBCount;
  
  // Determine which team to join (balance teams)
  let targetTeam = teamACount <= teamBCount ? 'teamA' : 'teamB';
  
  const playerData = {
    playerId: userId,
    position: preferredPosition,
    joinedAt: new Date(),
    isConfirmed: true
  };
  
  this.teams[targetTeam].players.push(playerData);
  
  return {
    success: true,
    team: targetTeam === 'teamA' ? 'Team A' : 'Team B',
    playerCount: this.teams[targetTeam].players.length
  };
};

// Instance method to remove player from match
MatchSchema.methods.removePlayer = function(userId) {
  let removed = false;
  let fromTeam = null;
  
  // Try to remove from Team A
  const teamAIndex = this.teams.teamA.players.findIndex(player => 
    player.playerId.toString() === userId.toString()
  );
  
  if (teamAIndex !== -1) {
    this.teams.teamA.players.splice(teamAIndex, 1);
    removed = true;
    fromTeam = 'Team A';
  } else {
    // Try to remove from Team B
    const teamBIndex = this.teams.teamB.players.findIndex(player => 
      player.playerId.toString() === userId.toString()
    );
    
    if (teamBIndex !== -1) {
      this.teams.teamB.players.splice(teamBIndex, 1);
      removed = true;
      fromTeam = 'Team B';
    }
  }
  
  return {
    success: removed,
    fromTeam,
    remainingSlots: this.availableSlots + (removed ? 1 : 0)
  };
};

module.exports = mongoose.model('Match', MatchSchema);