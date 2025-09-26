const mongoose = require('mongoose');

const matchChatSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  messageType: {
    type: String,
    enum: [
      'text',           // Regular text message
      'system',         // System notifications (player joined, etc.)
      'announcement',   // Admin/organizer announcements
      'media',          // Image/video/audio messages
      'location',       // Location sharing
      'poll',           // Match-related polls
      'reaction'        // Emoji reactions to match events
    ],
    default: 'text'
  },
  // For media messages
  mediaUrl: String,
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio'],
    required: function() {
      return this.messageType === 'media';
    }
  },
  // For location messages
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  // For poll messages
  poll: {
    question: String,
    options: [String],
    allowMultiple: {
      type: Boolean,
      default: false
    },
    expiresAt: Date
  },
  // For reactions
  reactionTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchChat'
  },
  emoji: String, // For reaction type messages
  // Message status
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Message visibility
  isVisible: {
    type: Boolean,
    default: true
  },
  // For system messages
  systemData: {
    action: String,
    playerId: mongoose.Schema.Types.ObjectId,
    playerName: String,
    team: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  },
  // Message threading
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchChat'
  },
  // Priority for important messages
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  // Admin/moderator features
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pinnedAt: Date,
  // Message flags
  flags: [{
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'harassment', 'offensive', 'other']
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message reactions
  reactions: [{
    emoji: String,
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    count: {
      type: Number,
      default: 0
    }
  }],
  // Mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Hashtags for match-related topics
  hashtags: [String],
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
matchChatSchema.index({ match: 1, createdAt: -1 });
matchChatSchema.index({ sender: 1, createdAt: -1 });
matchChatSchema.index({ match: 1, messageType: 1 });
matchChatSchema.index({ match: 1, isPinned: -1, createdAt: -1 });
matchChatSchema.index({ replyTo: 1 });

// Virtual for reply count
matchChatSchema.virtual('replyCount', {
  ref: 'MatchChat',
  localField: '_id',
  foreignField: 'replyTo',
  count: true
});

// Virtual for total reactions count
matchChatSchema.virtual('totalReactions').get(function() {
  return this.reactions.reduce((total, reaction) => total + reaction.count, 0);
});

// Static methods

// Get match chat messages with pagination
matchChatSchema.statics.getMatchMessages = function(matchId, options = {}) {
  const {
    page = 1,
    limit = 50,
    messageType,
    includePinned = true,
    includeDeleted = false
  } = options;

  let query = {
    match: mongoose.Types.ObjectId(matchId),
    isActive: true
  };

  if (!includeDeleted) {
    query.isDeleted = false;
  }

  if (messageType) {
    query.messageType = messageType;
  }

  const skip = (page - 1) * limit;

  // Build the aggregation pipeline
  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'senderInfo',
        pipeline: [
          {
            $project: {
              name: 1,
              username: 1,
              profilePicture: 1,
              role: 1
            }
          }
        ]
      }
    },
    {
      $unwind: {
        path: '$senderInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'matchchats',
        localField: '_id',
        foreignField: 'replyTo',
        as: 'replies',
        pipeline: [
          { $match: { isDeleted: false } },
          { $sort: { createdAt: 1 } },
          { $limit: 3 }, // Only get first 3 replies for preview
          {
            $lookup: {
              from: 'users',
              localField: 'sender',
              foreignField: '_id',
              as: 'senderInfo',
              pipeline: [{ $project: { name: 1, username: 1, profilePicture: 1 } }]
            }
          },
          { $unwind: '$senderInfo' }
        ]
      }
    },
    {
      $addFields: {
        replyCount: { $size: '$replies' }
      }
    }
  ];

  // Handle pinned messages
  if (includePinned) {
    pipeline.push({
      $sort: {
        isPinned: -1,
        createdAt: -1
      }
    });
  } else {
    pipeline.push({
      $sort: { createdAt: -1 }
    });
  }

  pipeline.push(
    { $skip: skip },
    { $limit: limit }
  );

  return this.aggregate(pipeline);
};

// Get system messages for a match
matchChatSchema.statics.getSystemMessages = function(matchId, limit = 20) {
  return this.find({
    match: matchId,
    messageType: 'system',
    isActive: true
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name username')
    .lean();
};

// Get pinned messages
matchChatSchema.statics.getPinnedMessages = function(matchId) {
  return this.find({
    match: matchId,
    isPinned: true,
    isDeleted: false,
    isActive: true
  })
    .sort({ pinnedAt: -1 })
    .populate('sender', 'name username profilePicture')
    .populate('pinnedBy', 'name username')
    .lean();
};

// Search messages in a match
matchChatSchema.statics.searchMessages = function(matchId, searchTerm, limit = 20) {
  return this.find({
    match: matchId,
    message: { $regex: searchTerm, $options: 'i' },
    messageType: 'text',
    isDeleted: false,
    isActive: true
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name username profilePicture')
    .lean();
};

// Instance methods

// Add reaction to message
matchChatSchema.methods.addReaction = function(emoji, userId) {
  const existingReaction = this.reactions.find(r => r.emoji === emoji);
  
  if (existingReaction) {
    if (!existingReaction.users.includes(userId)) {
      existingReaction.users.push(userId);
      existingReaction.count++;
    }
  } else {
    this.reactions.push({
      emoji,
      users: [userId],
      count: 1
    });
  }
  
  return this.save();
};

// Remove reaction from message
matchChatSchema.methods.removeReaction = function(emoji, userId) {
  const reactionIndex = this.reactions.findIndex(r => r.emoji === emoji);
  
  if (reactionIndex !== -1) {
    const reaction = this.reactions[reactionIndex];
    const userIndex = reaction.users.indexOf(userId);
    
    if (userIndex !== -1) {
      reaction.users.splice(userIndex, 1);
      reaction.count--;
      
      if (reaction.count === 0) {
        this.reactions.splice(reactionIndex, 1);
      }
    }
  }
  
  return this.save();
};

// Mark message as read by user
matchChatSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Flag message
matchChatSchema.methods.flagMessage = function(flaggedBy, reason) {
  this.flags.push({
    flaggedBy,
    reason,
    flaggedAt: new Date()
  });
  
  return this.save();
};

// Pin/unpin message
matchChatSchema.methods.togglePin = function(userId) {
  if (this.isPinned) {
    this.isPinned = false;
    this.pinnedBy = undefined;
    this.pinnedAt = undefined;
  } else {
    this.isPinned = true;
    this.pinnedBy = userId;
    this.pinnedAt = new Date();
  }
  
  return this.save();
};

// Soft delete message
matchChatSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.isVisible = false;
  
  return this.save();
};

// Edit message
matchChatSchema.methods.editMessage = function(newMessage) {
  this.message = newMessage;
  this.isEdited = true;
  this.editedAt = new Date();
  
  return this.save();
};

// Pre-save middleware
matchChatSchema.pre('save', function(next) {
  // Extract mentions from message
  if (this.messageType === 'text' && this.message) {
    const mentionMatches = this.message.match(/@(\w+)/g);
    if (mentionMatches) {
      // You would need to resolve usernames to user IDs here
      this.hashtags = mentionMatches;
    }
    
    // Extract hashtags
    const hashtagMatches = this.message.match(/#(\w+)/g);
    if (hashtagMatches) {
      this.hashtags = hashtagMatches.map(tag => tag.toLowerCase());
    }
  }
  
  next();
});

module.exports = mongoose.model('MatchChat', matchChatSchema);