const matchService = require('../services/matchService');

class MatchController {
  // @desc    Create a new match
  // @route   POST /api/matches
  // @access  Private
  async createMatch(req, res) {
    try {
      const result = await matchService.createMatch(req.user._id, req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create match error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get match by ID
  // @route   GET /api/matches/:id
  // @access  Public
  async getMatch(req, res) {
    try {
      const result = await matchService.getMatchById(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get match error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Search/List matches with filters
  // @route   GET /api/matches
  // @access  Public
  async searchMatches(req, res) {
    try {
      const result = await matchService.searchMatches(req.query);
      res.status(200).json(result);
    } catch (error) {
      console.error('Search matches error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get nearby matches for current user
  // @route   GET /api/matches/nearby
  // @access  Private
  async getNearbyMatches(req, res) {
    try {
      const maxDistance = parseInt(req.query.distance) || 25000;
      const result = await matchService.getNearbyMatches(req.user._id, maxDistance);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get nearby matches error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Update match details
  // @route   PUT /api/matches/:id
  // @access  Private
  async updateMatch(req, res) {
    try {
      const result = await matchService.updateMatch(req.params.id, req.user._id, req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('Update match error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Join a match
  // @route   POST /api/matches/:id/join
  // @access  Private
  async joinMatch(req, res) {
    try {
      const { preferredPosition } = req.body;
      const result = await matchService.joinMatch(req.params.id, req.user._id, preferredPosition);
      res.status(200).json(result);
    } catch (error) {
      console.error('Join match error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Leave a match
  // @route   POST /api/matches/:id/leave
  // @access  Private
  async leaveMatch(req, res) {
    try {
      const result = await matchService.leaveMatch(req.params.id, req.user._id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Leave match error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Cancel a match
  // @route   DELETE /api/matches/:id
  // @access  Private
  async cancelMatch(req, res) {
    try {
      const result = await matchService.cancelMatch(req.params.id, req.user._id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Cancel match error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Start a match
  // @route   POST /api/matches/:id/start
  // @access  Private
  async startMatch(req, res) {
    try {
      const result = await matchService.startMatch(req.params.id, req.user._id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Start match error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    End a match
  // @route   POST /api/matches/:id/end
  // @access  Private
  async endMatch(req, res) {
    try {
      const result = await matchService.endMatch(req.params.id, req.user._id);
      res.status(200).json(result);
    } catch (error) {
      console.error('End match error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Update match score
  // @route   PUT /api/matches/:id/score
  // @access  Private
  async updateScore(req, res) {
    try {
      const { teamAScore, teamBScore } = req.body;
      const result = await matchService.updateScore(req.params.id, req.user._id, teamAScore, teamBScore);
      res.status(200).json(result);
    } catch (error) {
      console.error('Update score error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get current user's matches
  // @route   GET /api/matches/my-matches
  // @access  Private
  async getMyMatches(req, res) {
    try {
      const status = req.query.status || null;
      const result = await matchService.getUserMatches(req.user._id, status);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get my matches error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get match statistics (for organizers/referees)
  // @route   GET /api/matches/:id/stats
  // @access  Private
  async getMatchStats(req, res) {
    try {
      const match = await matchService.getMatchById(req.params.id);
      
      if (!match.success) {
        return res.status(404).json(match);
      }

      const matchData = match.data.match;
      
      // Check if user has permission to view stats
      const isOrganizer = matchData.organizerId._id.toString() === req.user._id.toString();
      const isReferee = matchData.referee.playerId && 
        matchData.referee.playerId._id.toString() === req.user._id.toString();
      const isPlayer = matchData.teams.teamA.players.some(p => 
        p.playerId._id.toString() === req.user._id.toString()
      ) || matchData.teams.teamB.players.some(p => 
        p.playerId._id.toString() === req.user._id.toString()
      );

      if (!isOrganizer && !isReferee && !isPlayer) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You must be involved in this match to view statistics.'
        });
      }

      const stats = {
        matchId: matchData._id,
        title: matchData.title,
        format: matchData.format,
        status: matchData.status,
        score: matchData.score,
        teams: {
          teamA: {
            name: matchData.teams.teamA.name,
            playerCount: matchData.teams.teamA.players.length,
            players: matchData.teams.teamA.players.map(p => ({
              id: p.playerId._id,
              name: p.playerId.name,
              username: p.playerId.username,
              position: p.position,
              skillLevel: p.playerId.skillLevel,
              joinedAt: p.joinedAt
            }))
          },
          teamB: {
            name: matchData.teams.teamB.name,
            playerCount: matchData.teams.teamB.players.length,
            players: matchData.teams.teamB.players.map(p => ({
              id: p.playerId._id,
              name: p.playerId.name,
              username: p.playerId.username,
              position: p.position,
              skillLevel: p.playerId.skillLevel,
              joinedAt: p.joinedAt
            }))
          }
        },
        timeline: matchData.timeline,
        availableSlots: matchData.availableSlots,
        organizer: {
          id: matchData.organizerId._id,
          name: matchData.organizerId.name,
          username: matchData.organizerId.username
        }
      };

      res.status(200).json({
        success: true,
        message: 'Match statistics retrieved successfully',
        data: { stats }
      });
    } catch (error) {
      console.error('Get match stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Check if current user can join match
  // @route   GET /api/matches/:id/can-join
  // @access  Private
  async canJoinMatch(req, res) {
    try {
      const matchResult = await matchService.getMatchById(req.params.id);
      
      if (!matchResult.success) {
        return res.status(404).json(matchResult);
      }

      const match = matchResult.data.match;
      const canJoin = match.canUserJoin(req.user._id);

      res.status(200).json({
        success: true,
        message: 'Join eligibility checked',
        data: {
          canJoin: canJoin.canJoin,
          reason: canJoin.reason || 'User can join this match',
          matchInfo: {
            id: match._id,
            title: match.title,
            status: match.status,
            availableSlots: match.availableSlots,
            format: match.format,
            skillLevelRequired: match.skillLevelRequired,
            dateTime: match.dateTime
          }
        }
      });
    } catch (error) {
      console.error('Can join match error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new MatchController();