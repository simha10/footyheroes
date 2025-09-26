const User = require('../models/User');
const MatchEvent = require('../models/MatchEvent');
const MVPVote = require('../models/MVPVote');

class LeaderboardService {
  // Get top goalscorers
  async getTopGoalscorers(limit = 10, timeframe = 'all') {
    try {
      let dateFilter = {};
      
      if (timeframe === 'month') {
        dateFilter = { updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
      } else if (timeframe === 'week') {
        dateFilter = { updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
      }

      const topScorers = await User.find({
        goals: { $gt: 0 },
        isActive: true,
        ...dateFilter
      })
        .select('name username goals matchesPlayed profilePicture reputationScore')
        .sort({ goals: -1, matchesPlayed: 1 })
        .limit(limit);

      return {
        success: true,
        message: 'Top goalscorers retrieved successfully',
        data: {
          leaderboard: topScorers.map((player, index) => ({
            rank: index + 1,
            player: {
              id: player._id,
              name: player.name,
              username: player.username,
              profilePicture: player.profilePicture
            },
            stats: {
              goals: player.goals,
              matchesPlayed: player.matchesPlayed,
              goalsPerMatch: player.matchesPlayed > 0 ? 
                (player.goals / player.matchesPlayed).toFixed(2) : 0
            },
            reputationScore: player.reputationScore
          })),
          timeframe,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get MVP leaderboard
  async getMVPLeaderboard(limit = 10) {
    try {
      const topMVPs = await User.find({
        mvpAwards: { $gt: 0 },
        isActive: true
      })
        .select('name username mvpAwards matchesPlayed profilePicture reputationScore goals assists')
        .sort({ mvpAwards: -1, reputationScore: -1 })
        .limit(limit);

      return {
        success: true,
        message: 'MVP leaderboard retrieved successfully',
        data: {
          leaderboard: topMVPs.map((player, index) => ({
            rank: index + 1,
            player: {
              id: player._id,
              name: player.name,
              username: player.username,
              profilePicture: player.profilePicture
            },
            stats: {
              mvpAwards: player.mvpAwards,
              matchesPlayed: player.matchesPlayed,
              mvpRate: player.matchesPlayed > 0 ? 
                ((player.mvpAwards / player.matchesPlayed) * 100).toFixed(1) + '%' : '0%',
              goals: player.goals,
              assists: player.assists
            },
            reputationScore: player.reputationScore
          })),
          generatedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get reputation leaderboard (fair play)
  async getFairPlayLeaderboard(limit = 10) {
    try {
      const fairPlayLeaders = await User.find({
        matchesPlayed: { $gte: 5 }, // Must have played at least 5 matches
        isActive: true,
        isSuspended: false
      })
        .select('name username reputationScore matchesPlayed yellowCards redCards profilePicture')
        .sort({ reputationScore: -1, matchesPlayed: -1 })
        .limit(limit);

      return {
        success: true,
        message: 'Fair play leaderboard retrieved successfully',
        data: {
          leaderboard: fairPlayLeaders.map((player, index) => ({
            rank: index + 1,
            player: {
              id: player._id,
              name: player.name,
              username: player.username,
              profilePicture: player.profilePicture
            },
            stats: {
              reputationScore: player.reputationScore,
              matchesPlayed: player.matchesPlayed,
              yellowCards: player.yellowCards,
              redCards: player.redCards,
              disciplinaryRecord: this.calculateDisciplinaryRecord(player)
            }
          })),
          generatedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get comprehensive player rankings
  async getOverallRankings(limit = 20) {
    try {
      const players = await User.find({
        matchesPlayed: { $gte: 3 }, // Must have played at least 3 matches
        isActive: true
      })
        .select('name username goals assists matchesPlayed mvpAwards reputationScore yellowCards redCards profilePicture')
        .sort({ reputationScore: -1, mvpAwards: -1, goals: -1 })
        .limit(limit);

      return {
        success: true,
        message: 'Overall rankings retrieved successfully',
        data: {
          leaderboard: players.map((player, index) => ({
            rank: index + 1,
            player: {
              id: player._id,
              name: player.name,
              username: player.username,
              profilePicture: player.profilePicture
            },
            overallScore: this.calculateOverallScore(player),
            stats: {
              matchesPlayed: player.matchesPlayed,
              goals: player.goals,
              assists: player.assists,
              mvpAwards: player.mvpAwards,
              reputationScore: player.reputationScore,
              goalsPerMatch: player.matchesPlayed > 0 ? 
                (player.goals / player.matchesPlayed).toFixed(2) : 0,
              assistsPerMatch: player.matchesPlayed > 0 ? 
                (player.assists / player.matchesPlayed).toFixed(2) : 0
            },
            badges: this.calculatePlayerBadges(player)
          })),
          generatedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Calculate overall performance score
  calculateOverallScore(player) {
    const goalScore = player.goals * 3;
    const assistScore = player.assists * 2;
    const mvpScore = player.mvpAwards * 10;
    const reputationBonus = (player.reputationScore - 3) * 5; // Bonus/penalty based on reputation
    const consistencyBonus = player.matchesPlayed * 0.5;
    
    return Math.max(0, goalScore + assistScore + mvpScore + reputationBonus + consistencyBonus);
  }

  // Calculate disciplinary record
  calculateDisciplinaryRecord(player) {
    const totalCards = player.yellowCards + (player.redCards * 2);
    if (player.matchesPlayed === 0) return 'No record';
    
    const cardsPerMatch = totalCards / player.matchesPlayed;
    
    if (cardsPerMatch === 0) return 'Excellent';
    if (cardsPerMatch <= 0.2) return 'Good';
    if (cardsPerMatch <= 0.5) return 'Fair';
    return 'Poor';
  }

  // Calculate player badges
  calculatePlayerBadges(player) {
    const badges = [];
    
    // Scoring badges
    if (player.goals >= 50) badges.push({ name: 'Goal Machine', icon: '⚽', type: 'scoring' });
    else if (player.goals >= 20) badges.push({ name: 'Striker', icon: '🥅', type: 'scoring' });
    else if (player.goals >= 10) badges.push({ name: 'Scorer', icon: '🏈', type: 'scoring' });
    
    // Assist badges
    if (player.assists >= 30) badges.push({ name: 'Playmaker', icon: '🎯', type: 'playmaking' });
    else if (player.assists >= 15) badges.push({ name: 'Creator', icon: '🎨', type: 'playmaking' });
    
    // MVP badges
    if (player.mvpAwards >= 10) badges.push({ name: 'Legend', icon: '👑', type: 'achievement' });
    else if (player.mvpAwards >= 5) badges.push({ name: 'Star Player', icon: '⭐', type: 'achievement' });
    else if (player.mvpAwards >= 1) badges.push({ name: 'MVP', icon: '🏆', type: 'achievement' });
    
    // Fair play badges
    if (player.reputationScore >= 4.5 && player.matchesPlayed >= 10) {
      badges.push({ name: 'Fair Player', icon: '🤝', type: 'conduct' });
    }
    
    // Experience badges
    if (player.matchesPlayed >= 100) badges.push({ name: 'Veteran', icon: '🎖️', type: 'experience' });
    else if (player.matchesPlayed >= 50) badges.push({ name: 'Regular', icon: '🥇', type: 'experience' });
    else if (player.matchesPlayed >= 20) badges.push({ name: 'Active', icon: '💪', type: 'experience' });
    
    // Consistency badges
    const goalsPerMatch = player.matchesPlayed > 0 ? player.goals / player.matchesPlayed : 0;
    if (goalsPerMatch >= 1 && player.matchesPlayed >= 10) {
      badges.push({ name: 'Consistent Scorer', icon: '📈', type: 'consistency' });
    }
    
    return badges;
  }

  // Get position-specific leaderboards
  async getPositionLeaderboard(position, limit = 10) {
    try {
      let sortCriteria = {};
      let statField = 'goals';
      
      // Different sorting criteria based on position
      switch (position) {
        case 'GK':
          // For goalkeepers, prioritize reputation and fewer goals conceded
          sortCriteria = { reputationScore: -1, matchesPlayed: -1 };
          statField = 'saves';
          break;
        case 'CB':
        case 'LB':
        case 'RB':
          // For defenders, balance between reputation and attacking contribution
          sortCriteria = { reputationScore: -1, assists: -1, goals: -1 };
          break;
        case 'CM':
        case 'CDM':
        case 'CAM':
          // For midfielders, prioritize assists and overall contribution
          sortCriteria = { assists: -1, goals: -1, reputationScore: -1 };
          statField = 'assists';
          break;
        default:
          // For attackers, prioritize goals
          sortCriteria = { goals: -1, assists: -1, reputationScore: -1 };
          break;
      }

      const players = await User.find({
        position: position,
        matchesPlayed: { $gte: 3 },
        isActive: true
      })
        .select('name username goals assists matchesPlayed mvpAwards reputationScore position profilePicture')
        .sort(sortCriteria)
        .limit(limit);

      return {
        success: true,
        message: `${position} leaderboard retrieved successfully`,
        data: {
          position,
          leaderboard: players.map((player, index) => ({
            rank: index + 1,
            player: {
              id: player._id,
              name: player.name,
              username: player.username,
              profilePicture: player.profilePicture,
              position: player.position
            },
            stats: {
              goals: player.goals,
              assists: player.assists,
              matchesPlayed: player.matchesPlayed,
              mvpAwards: player.mvpAwards,
              reputationScore: player.reputationScore,
              primaryStat: player[statField] || 0
            }
          })),
          generatedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get player comparison
  async comparePlayerStats(playerId1, playerId2) {
    try {
      const [player1, player2] = await Promise.all([
        User.findById(playerId1).select('name username goals assists matchesPlayed mvpAwards reputationScore yellowCards redCards position'),
        User.findById(playerId2).select('name username goals assists matchesPlayed mvpAwards reputationScore yellowCards redCards position')
      ]);

      if (!player1 || !player2) {
        throw new Error('One or both players not found');
      }

      const comparison = {
        player1: {
          ...player1.toObject(),
          goalsPerMatch: player1.matchesPlayed > 0 ? (player1.goals / player1.matchesPlayed).toFixed(2) : 0,
          assistsPerMatch: player1.matchesPlayed > 0 ? (player1.assists / player1.matchesPlayed).toFixed(2) : 0,
          overallScore: this.calculateOverallScore(player1),
          badges: this.calculatePlayerBadges(player1)
        },
        player2: {
          ...player2.toObject(),
          goalsPerMatch: player2.matchesPlayed > 0 ? (player2.goals / player2.matchesPlayed).toFixed(2) : 0,
          assistsPerMatch: player2.matchesPlayed > 0 ? (player2.assists / player2.matchesPlayed).toFixed(2) : 0,
          overallScore: this.calculateOverallScore(player2),
          badges: this.calculatePlayerBadges(player2)
        },
        winner: {
          goals: player1.goals > player2.goals ? 'player1' : player1.goals < player2.goals ? 'player2' : 'tie',
          assists: player1.assists > player2.assists ? 'player1' : player1.assists < player2.assists ? 'player2' : 'tie',
          mvpAwards: player1.mvpAwards > player2.mvpAwards ? 'player1' : player1.mvpAwards < player2.mvpAwards ? 'player2' : 'tie',
          reputation: player1.reputationScore > player2.reputationScore ? 'player1' : player1.reputationScore < player2.reputationScore ? 'player2' : 'tie',
          overall: this.calculateOverallScore(player1) > this.calculateOverallScore(player2) ? 'player1' : 
                   this.calculateOverallScore(player1) < this.calculateOverallScore(player2) ? 'player2' : 'tie'
        }
      };

      return {
        success: true,
        message: 'Player comparison completed',
        data: comparison
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new LeaderboardService();