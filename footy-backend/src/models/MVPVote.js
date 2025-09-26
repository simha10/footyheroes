const mongoose = require('mongoose');

const MVPVoteSchema = new mongoose.Schema({
  // Vote Details
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match ID is required']
  },
  votedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Voter ID is required']
  },
  votedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Voted player ID is required']
  },
  
  // Vote Context
  voteType: {
    type: String,
    enum: ['mvp', 'fair_play', 'best_goal', 'best_save'],
    default: 'mvp'
  },
  
  // Vote Weight (based on voter's reputation)
  voteWeight: {
    type: Number,
    default: 1.0,
    min: [0.1, 'Vote weight cannot be less than 0.1'],
    max: [2.0, 'Vote weight cannot exceed 2.0']
  },
  
  // Optional Comment
  comment: {
    type: String,
    trim: true,
    maxlength: [200, 'Comment cannot exceed 200 characters']
  },
  
  // Vote Status
  isValid: {
    type: Boolean,
    default: true
  },
  invalidationReason: {
    type: String,
    trim: true
  },
  
  // Voting Window
  votingDeadline: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
MVPVoteSchema.index({ matchId: 1, votedBy: 1 }, { unique: true }); // One vote per player per match
MVPVoteSchema.index({ matchId: 1, votedFor: 1 });
MVPVoteSchema.index({ votedFor: 1 });
MVPVoteSchema.index({ createdAt: 1 });
MVPVoteSchema.index({ votingDeadline: 1 });

// Virtual for vote value (weight * validity)
MVPVoteSchema.virtual('voteValue').get(function() {
  return this.isValid ? this.voteWeight : 0;
});

// Pre-save middleware to prevent self-voting
MVPVoteSchema.pre('save', function(next) {
  if (this.votedBy.toString() === this.votedFor.toString()) {
    const error = new Error('Players cannot vote for themselves');
    return next(error);
  }
  next();
});

// Static method to calculate MVP for a match
MVPVoteSchema.statics.calculateMVP = async function(matchId) {
  try {
    const votes = await this.find({ 
      matchId, 
      isValid: true,
      createdAt: { $lte: new Date() } // Only count votes before current time
    }).populate('votedFor', 'name username position');

    if (votes.length === 0) {
      return { winner: null, totalVotes: 0, results: [] };
    }

    // Calculate weighted votes for each player
    const voteResults = {};
    votes.forEach(vote => {
      const playerId = vote.votedFor._id.toString();
      if (!voteResults[playerId]) {
        voteResults[playerId] = {
          player: vote.votedFor,
          totalVotes: 0,
          weightedVotes: 0,
          voterCount: 0,
          comments: []
        };
      }
      
      voteResults[playerId].totalVotes += 1;
      voteResults[playerId].weightedVotes += vote.voteWeight;
      voteResults[playerId].voterCount += 1;
      
      if (vote.comment) {
        voteResults[playerId].comments.push({
          comment: vote.comment,
          voter: vote.votedBy
        });
      }
    });

    // Convert to array and sort by weighted votes
    const sortedResults = Object.values(voteResults)
      .sort((a, b) => b.weightedVotes - a.weightedVotes);

    // Determine winner (handle ties)
    const winner = sortedResults.length > 0 ? sortedResults[0] : null;
    const isTie = sortedResults.length > 1 && 
      sortedResults[0].weightedVotes === sortedResults[1].weightedVotes;

    return {
      winner: isTie ? null : winner, // No winner if there's a tie
      isTie,
      totalVotes: votes.length,
      results: sortedResults,
      tieBreaker: isTie ? 'Statistics-based tiebreaker needed' : null
    };
  } catch (error) {
    throw new Error(`Error calculating MVP: ${error.message}`);
  }
};

// Static method to get voting statistics for a match
MVPVoteSchema.statics.getVotingStats = async function(matchId) {
  try {
    const Match = mongoose.model('Match');
    const match = await Match.findById(matchId)
      .populate('teams.teamA.players.playerId', 'name username')
      .populate('teams.teamB.players.playerId', 'name username');

    if (!match) {
      throw new Error('Match not found');
    }

    const allPlayers = [
      ...match.teams.teamA.players.map(p => p.playerId),
      ...match.teams.teamB.players.map(p => p.playerId)
    ];

    const votes = await this.find({ matchId, isValid: true })
      .populate('votedBy', 'name username')
      .populate('votedFor', 'name username');

    const votingStats = {
      totalEligibleVoters: allPlayers.length,
      totalVotesCast: votes.length,
      participationRate: allPlayers.length > 0 ? 
        ((votes.length / allPlayers.length) * 100).toFixed(1) : 0,
      
      votedPlayers: [...new Set(votes.map(v => v.votedBy._id.toString()))].length,
      receivedVotes: [...new Set(votes.map(v => v.votedFor._id.toString()))].length,
      
      deadlinePassed: new Date() > match.timeline.endedAt && 
        new Date() > new Date(match.timeline.endedAt.getTime() + 30 * 60 * 1000), // 30 min after match end
      
      votes: votes.map(vote => ({
        voter: vote.votedBy.name,
        votedFor: vote.votedFor.name,
        weight: vote.voteWeight,
        comment: vote.comment,
        timestamp: vote.createdAt
      }))
    };

    return votingStats;
  } catch (error) {
    throw new Error(`Error getting voting stats: ${error.message}`);
  }
};

// Static method to finalize MVP voting for a match
MVPVoteSchema.statics.finalizeMVPVoting = async function(matchId) {
  try {
    const Match = mongoose.model('Match');
    const User = mongoose.model('User');
    const MatchEvent = mongoose.model('MatchEvent');

    const mvpResult = await this.calculateMVP(matchId);
    
    let finalWinner = mvpResult.winner;

    // If there's a tie, use statistics-based tiebreaker
    if (mvpResult.isTie && mvpResult.results.length > 1) {
      const tiedPlayers = mvpResult.results.filter(r => 
        r.weightedVotes === mvpResult.results[0].weightedVotes
      );

      // Get match statistics for tied players
      const playerStats = await Promise.all(
        tiedPlayers.map(async (player) => {
          const events = await MatchEvent.find({
            matchId,
            playerId: player.player._id,
            isDeleted: false
          });

          const goals = events.filter(e => e.eventType === 'goal').length;
          const assists = events.filter(e => e.eventType === 'assist').length;
          const cards = events.filter(e => ['yellow_card', 'red_card'].includes(e.eventType)).length;
          
          return {
            ...player,
            tieBreakScore: (goals * 3) + (assists * 2) - (cards * 1) // Simple scoring system
          };
        })
      );

      // Sort by tie-break score
      playerStats.sort((a, b) => b.tieBreakScore - a.tieBreakScore);
      finalWinner = playerStats[0];
    }

    // Award MVP to winner
    if (finalWinner && finalWinner.player) {
      await User.findByIdAndUpdate(
        finalWinner.player._id,
        { $inc: { mvpAwards: 1 } }
      );
    }

    return {
      mvpWinner: finalWinner,
      votingResults: mvpResult,
      tieBreakUsed: mvpResult.isTie,
      finalized: true
    };
  } catch (error) {
    throw new Error(`Error finalizing MVP voting: ${error.message}`);
  }
};

module.exports = mongoose.model('MVPVote', MVPVoteSchema);