const leaderboardService = require('../services/leaderboardService');

class LeaderboardController {
  // Get top goalscorers
  async getTopGoalscorers(req, res) {
    try {
      const { limit = 10, timeframe = 'all' } = req.query;
      
      // Validate timeframe
      const validTimeframes = ['all', 'month', 'week'];
      if (!validTimeframes.includes(timeframe)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid timeframe. Must be one of: all, month, week'
        });
      }

      // Validate limit
      const parsedLimit = parseInt(limit);
      if (parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
      }

      const result = await leaderboardService.getTopGoalscorers(parsedLimit, timeframe);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get top goalscorers',
        error: error.message
      });
    }
  }

  // Get MVP leaderboard
  async getMVPLeaderboard(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const parsedLimit = parseInt(limit);
      if (parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
      }

      const result = await leaderboardService.getMVPLeaderboard(parsedLimit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get MVP leaderboard',
        error: error.message
      });
    }
  }

  // Get fair play leaderboard
  async getFairPlayLeaderboard(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const parsedLimit = parseInt(limit);
      if (parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
      }

      const result = await leaderboardService.getFairPlayLeaderboard(parsedLimit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get fair play leaderboard',
        error: error.message
      });
    }
  }

  // Get overall rankings
  async getOverallRankings(req, res) {
    try {
      const { limit = 20 } = req.query;
      
      const parsedLimit = parseInt(limit);
      if (parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
      }

      const result = await leaderboardService.getOverallRankings(parsedLimit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get overall rankings',
        error: error.message
      });
    }
  }

  // Get position-specific leaderboard
  async getPositionLeaderboard(req, res) {
    try {
      const { position } = req.params;
      const { limit = 10 } = req.query;
      
      // Validate position
      const validPositions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];
      if (!validPositions.includes(position)) {
        return res.status(400).json({
          success: false,
          message: `Invalid position. Must be one of: ${validPositions.join(', ')}`
        });
      }

      const parsedLimit = parseInt(limit);
      if (parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
      }

      const result = await leaderboardService.getPositionLeaderboard(position, parsedLimit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get position leaderboard',
        error: error.message
      });
    }
  }

  // Compare two players
  async comparePlayerStats(req, res) {
    try {
      const { player1Id, player2Id } = req.params;

      if (!player1Id || !player2Id) {
        return res.status(400).json({
          success: false,
          message: 'Both player IDs are required'
        });
      }

      if (player1Id === player2Id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot compare a player with themselves'
        });
      }

      const result = await leaderboardService.comparePlayerStats(player1Id, player2Id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to compare players',
        error: error.message
      });
    }
  }

  // Get all leaderboard categories
  async getAllLeaderboards(req, res) {
    try {
      const { limit = 5 } = req.query;
      
      const parsedLimit = parseInt(limit);
      if (parsedLimit < 1 || parsedLimit > 20) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 20 for combined leaderboards'
        });
      }

      // Get multiple leaderboards concurrently
      const [goalscorers, mvpLeaders, fairPlayLeaders, overallRankings] = await Promise.all([
        leaderboardService.getTopGoalscorers(parsedLimit, 'all'),
        leaderboardService.getMVPLeaderboard(parsedLimit),
        leaderboardService.getFairPlayLeaderboard(parsedLimit),
        leaderboardService.getOverallRankings(parsedLimit)
      ]);

      res.status(200).json({
        success: true,
        message: 'All leaderboards retrieved successfully',
        data: {
          topGoalscorers: goalscorers.data,
          mvpLeaders: mvpLeaders.data,
          fairPlayLeaders: fairPlayLeaders.data,
          overallRankings: overallRankings.data,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get all leaderboards',
        error: error.message
      });
    }
  }

  // Get player ranking in different categories
  async getPlayerRankings(req, res) {
    try {
      const { playerId } = req.params;

      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'Player ID is required'
        });
      }

      // Get rankings for the specific player
      const [goalscorers, mvpLeaders, fairPlayLeaders, overallRankings] = await Promise.all([
        leaderboardService.getTopGoalscorers(1000, 'all'), // Get larger set to find player's rank
        leaderboardService.getMVPLeaderboard(1000),
        leaderboardService.getFairPlayLeaderboard(1000),
        leaderboardService.getOverallRankings(1000)
      ]);

      const findPlayerRank = (leaderboard, targetPlayerId) => {
        const playerEntry = leaderboard.leaderboard.find(entry => 
          entry.player.id.toString() === targetPlayerId.toString()
        );
        return playerEntry ? playerEntry.rank : null;
      };

      const playerRankings = {
        goals: {
          rank: findPlayerRank(goalscorers.data, playerId),
          total: goalscorers.data.leaderboard.length
        },
        mvp: {
          rank: findPlayerRank(mvpLeaders.data, playerId),
          total: mvpLeaders.data.leaderboard.length
        },
        fairPlay: {
          rank: findPlayerRank(fairPlayLeaders.data, playerId),
          total: fairPlayLeaders.data.leaderboard.length
        },
        overall: {
          rank: findPlayerRank(overallRankings.data, playerId),
          total: overallRankings.data.leaderboard.length
        }
      };

      res.status(200).json({
        success: true,
        message: 'Player rankings retrieved successfully',
        data: {
          playerId,
          rankings: playerRankings,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get player rankings',
        error: error.message
      });
    }
  }

  // Get available positions
  async getAvailablePositions(req, res) {
    try {
      const positions = [
        { code: 'GK', name: 'Goalkeeper', category: 'Goalkeeper' },
        { code: 'CB', name: 'Centre Back', category: 'Defender' },
        { code: 'LB', name: 'Left Back', category: 'Defender' },
        { code: 'RB', name: 'Right Back', category: 'Defender' },
        { code: 'CDM', name: 'Defensive Midfielder', category: 'Midfielder' },
        { code: 'CM', name: 'Central Midfielder', category: 'Midfielder' },
        { code: 'CAM', name: 'Attacking Midfielder', category: 'Midfielder' },
        { code: 'LM', name: 'Left Midfielder', category: 'Midfielder' },
        { code: 'RM', name: 'Right Midfielder', category: 'Midfielder' },
        { code: 'LW', name: 'Left Winger', category: 'Forward' },
        { code: 'RW', name: 'Right Winger', category: 'Forward' },
        { code: 'ST', name: 'Striker', category: 'Forward' }
      ];

      res.status(200).json({
        success: true,
        message: 'Available positions retrieved successfully',
        data: { positions }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get available positions',
        error: error.message
      });
    }
  }
}

module.exports = new LeaderboardController();