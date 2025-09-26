const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Player Profile
  position: {
    type: String,
    enum: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'],
    required: [true, 'Position is required']
  },
  skillLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional'],
    default: 'Beginner'
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required'],
      index: '2dsphere'
    },
    address: {
      type: String,
      trim: true
    }
  },
  
  // Reputation & Stats
  reputationScore: {
    type: Number,
    default: 3.0,
    min: 1,
    max: 5
  },
  matchesPlayed: {
    type: Number,
    default: 0,
    min: 0
  },
  goals: {
    type: Number,
    default: 0,
    min: 0
  },
  assists: {
    type: Number,
    default: 0,
    min: 0
  },
  shotsOnTarget: {
    type: Number,
    default: 0,
    min: 0
  },
  yellowCards: {
    type: Number,
    default: 0,
    min: 0
  },
  redCards: {
    type: Number,
    default: 0,
    min: 0
  },
  mvpAwards: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: {
    type: String,
    trim: true
  },
  suspensionExpiresAt: {
    type: Date
  },
  
  // Metadata
  lastLogin: {
    type: Date
  },
  profilePicture: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for goals per match
UserSchema.virtual('goalsPerMatch').get(function() {
  return this.matchesPlayed > 0 ? (this.goals / this.matchesPlayed).toFixed(2) : 0;
});

// Virtual for assists per match
UserSchema.virtual('assistsPerMatch').get(function() {
  return this.matchesPlayed > 0 ? (this.assists / this.matchesPlayed).toFixed(2) : 0;
});

// Index for geospatial queries
UserSchema.index({ location: '2dsphere' });

// Indexes for performance (username and email already have unique: true)
UserSchema.index({ reputationScore: -1 });
UserSchema.index({ mvpAwards: -1 });
UserSchema.index({ goals: -1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Update reputation score
UserSchema.methods.updateReputation = function(ratings) {
  if (ratings.length === 0) return;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  this.reputationScore = (sum / ratings.length).toFixed(1);
};

// Check if user should be auto-suspended
UserSchema.methods.checkAutoSuspension = function(recentRatings) {
  const oneStarRatings = recentRatings.filter(rating => rating === 1);
  if (oneStarRatings.length >= 5) {
    this.isSuspended = true;
    this.suspensionReason = 'Auto-suspended due to poor ratings';
    this.suspensionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
};

// Static method to find nearby players
UserSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    isActive: true,
    isSuspended: false
  });
};

module.exports = mongoose.model('User', UserSchema);