const Match = require('../models/Match');
const User = require('../models/User');

class MatchService {
  // Create a new match
  async createMatch(organizerId, matchData) {
    try {
      // Validate organizer exists
      const organizer = await User.findById(organizerId);
      if (!organizer) {
        throw new Error('Organizer not found');
      }

      // Set max players per team based on format
      const formatPlayers = {
        '5v5': 5,
        '7v7': 7,
        '11v11': 11
      };
      
      matchData.maxPlayersPerTeam = formatPlayers[matchData.format];
      matchData.organizerId = organizerId;

      // Create match
      const match = new Match(matchData);
      await match.save();

      // Populate organizer info
      await match.populate('organizerId', 'name username profilePicture reputationScore');

      return {
        success: true,
        message: 'Match created successfully',
        data: { match }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get match by ID
  async getMatchById(matchId) {
    try {
      const match = await Match.findById(matchId)
        .populate('organizerId', 'name username profilePicture reputationScore')
        .populate('teams.teamA.players.playerId', 'name username position skillLevel profilePicture')
        .populate('teams.teamB.players.playerId', 'name username position skillLevel profilePicture')
        .populate('referee.playerId', 'name username');

      if (!match) {
        throw new Error('Match not found');
      }

      return {
        success: true,
        message: 'Match retrieved successfully',
        data: { match }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Search/List matches
  async searchMatches(filters, userLocation = null) {
    try {
      const {
        longitude,
        latitude,
        distance,
        format,
        skillLevel,
        status,
        type,
        dateFrom,
        dateTo,
        search,
        page,
        limit,
        sortBy,
        sortOrder
      } = filters;

      let query = {};
      let sort = {};

      // Location-based search
      if (longitude && latitude) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: distance || 25000
          }
        };
      }

      // Filter by format
      if (format) {
        query.format = format;
      }

      // Filter by skill level
      if (skillLevel && skillLevel !== 'Any') {
        query.skillLevelRequired = { $in: ['Any', skillLevel] };
      }

      // Filter by status
      if (status) {
        query.status = status;
      } else {
        // Default to showing active matches
        query.status = { $in: ['open', 'full'] };
      }

      // Filter by type
      if (type) {
        query.type = type;
      }

      // Date range filter
      const dateQuery = {};
      if (dateFrom) {
        dateQuery.$gte = new Date(dateFrom);
      } else {
        dateQuery.$gte = new Date(); // Future matches only
      }
      if (dateTo) {
        dateQuery.$lte = new Date(dateTo);
      }
      if (Object.keys(dateQuery).length > 0) {
        query.dateTime = dateQuery;
      }

      // Text search
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'location.address': { $regex: search, $options: 'i' } },
          { 'location.venue': { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // Sorting
      if (sortBy === 'distance' && longitude && latitude) {
        // Distance sorting is handled by $near
        sort = {};
      } else {
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        sort[sortBy] = sortDirection;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [matches, total] = await Promise.all([
        Match.find(query)
          .populate('organizerId', 'name username profilePicture reputationScore')
          .populate('teams.teamA.players.playerId', 'name username position skillLevel')
          .populate('teams.teamB.players.playerId', 'name username position skillLevel')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Match.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        success: true,
        message: 'Matches retrieved successfully',
        data: {
          matches,
          pagination: {
            current: page,
            total: totalPages,
            hasNext,
            hasPrev,
            count: matches.length,
            totalCount: total
          },
          filters: filters
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get nearby matches for a user
  async getNearbyMatches(userId, maxDistance = 25000) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const [longitude, latitude] = user.location.coordinates;

      const matches = await Match.findNearby(longitude, latitude, maxDistance)
        .limit(20);

      return {
        success: true,
        message: 'Nearby matches retrieved successfully',
        data: {
          matches,
          userLocation: {
            longitude,
            latitude,
            address: user.location.address
          }
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Update match
  async updateMatch(matchId, organizerId, updateData) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Check if user is the organizer
      if (match.organizerId.toString() !== organizerId.toString()) {
        throw new Error('Only the match organizer can update this match');
      }

      // Check if match can be updated
      if (match.status === 'ongoing' || match.status === 'completed') {
        throw new Error('Cannot update match that is ongoing or completed');
      }

      // Apply updates
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key === 'teams') {
            // Handle nested team updates
            if (updateData.teams.teamA) {
              Object.assign(match.teams.teamA, updateData.teams.teamA);
            }
            if (updateData.teams.teamB) {
              Object.assign(match.teams.teamB, updateData.teams.teamB);
            }
          } else {
            match[key] = updateData[key];
          }
        }
      });

      await match.save();
      await match.populate('organizerId', 'name username profilePicture reputationScore');

      return {
        success: true,
        message: 'Match updated successfully',
        data: { match }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Join a match
  async joinMatch(matchId, userId, preferredPosition = null) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Check if user can join
      const canJoin = match.canUserJoin(userId);
      if (!canJoin.canJoin) {
        throw new Error(canJoin.reason);
      }

      // Get user info for skill level check
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check skill level requirement
      if (match.skillLevelRequired !== 'Any') {
        const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional'];
        const requiredIndex = skillLevels.indexOf(match.skillLevelRequired);
        const userIndex = skillLevels.indexOf(user.skillLevel);
        
        if (userIndex < requiredIndex) {
          throw new Error(`This match requires ${match.skillLevelRequired} skill level or higher`);
        }
      }

      // Add player to match
      const joinResult = match.addPlayer(userId, preferredPosition);
      await match.save();

      // Populate match data
      await match.populate([
        { path: 'organizerId', select: 'name username profilePicture reputationScore' },
        { path: 'teams.teamA.players.playerId', select: 'name username position skillLevel' },
        { path: 'teams.teamB.players.playerId', select: 'name username position skillLevel' }
      ]);

      return {
        success: true,
        message: `Successfully joined ${joinResult.team}`,
        data: {
          match,
          joinedTeam: joinResult.team,
          playerCount: joinResult.playerCount,
          availableSlots: match.availableSlots
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Leave a match
  async leaveMatch(matchId, userId) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Check if match has started
      if (match.status === 'ongoing' || match.status === 'completed') {
        throw new Error('Cannot leave match that has already started or completed');
      }

      // Check if user is in the match
      const isInMatch = match.teams.teamA.players.some(player => 
        player.playerId.toString() === userId.toString()
      ) || match.teams.teamB.players.some(player => 
        player.playerId.toString() === userId.toString()
      );

      if (!isInMatch) {
        throw new Error('User is not in this match');
      }

      // Remove player from match
      const leaveResult = match.removePlayer(userId);
      await match.save();

      // Populate match data
      await match.populate([
        { path: 'organizerId', select: 'name username profilePicture reputationScore' },
        { path: 'teams.teamA.players.playerId', select: 'name username position skillLevel' },
        { path: 'teams.teamB.players.playerId', select: 'name username position skillLevel' }
      ]);

      return {
        success: true,
        message: `Successfully left ${leaveResult.fromTeam}`,
        data: {
          match,
          leftTeam: leaveResult.fromTeam,
          availableSlots: match.availableSlots
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Delete/Cancel match
  async cancelMatch(matchId, organizerId) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Check if user is the organizer
      if (match.organizerId.toString() !== organizerId.toString()) {
        throw new Error('Only the match organizer can cancel this match');
      }

      // Check if match can be cancelled
      if (match.status === 'completed') {
        throw new Error('Cannot cancel a completed match');
      }

      // Update status to cancelled
      match.status = 'cancelled';
      await match.save();

      return {
        success: true,
        message: 'Match cancelled successfully',
        data: { match }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Start match
  async startMatch(matchId, organizerId) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Check if user is the organizer or referee
      const isOrganizer = match.organizerId.toString() === organizerId.toString();
      const isReferee = match.referee.playerId && 
        match.referee.playerId.toString() === organizerId.toString();

      if (!isOrganizer && !isReferee) {
        throw new Error('Only the match organizer or referee can start this match');
      }

      // Check if match can be started
      if (match.status !== 'open' && match.status !== 'full') {
        throw new Error('Match cannot be started in current status');
      }

      // Check minimum players (at least 2 per team for 5v5, 3 for 7v7, 4 for 11v11)
      const minPlayers = match.format === '5v5' ? 2 : match.format === '7v7' ? 3 : 4;
      if (match.teamACount < minPlayers || match.teamBCount < minPlayers) {
        throw new Error(`Each team needs at least ${minPlayers} players to start the match`);
      }

      // Start the match
      match.status = 'ongoing';
      match.timeline.startedAt = new Date();
      await match.save();

      await match.populate('organizerId', 'name username profilePicture');

      return {
        success: true,
        message: 'Match started successfully',
        data: { match }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // End match
  async endMatch(matchId, organizerId) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Check if user is the organizer or referee
      const isOrganizer = match.organizerId.toString() === organizerId.toString();
      const isReferee = match.referee.playerId && 
        match.referee.playerId.toString() === organizerId.toString();

      if (!isOrganizer && !isReferee) {
        throw new Error('Only the match organizer or referee can end this match');
      }

      // Check if match is ongoing
      if (match.status !== 'ongoing') {
        throw new Error('Only ongoing matches can be ended');
      }

      // End the match
      match.status = 'completed';
      match.timeline.endedAt = new Date();
      await match.save();

      // Update player statistics
      await this.updatePlayerStats(match);

      await match.populate('organizerId', 'name username profilePicture');

      return {
        success: true,
        message: 'Match completed successfully',
        data: { match }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Update match score
  async updateScore(matchId, organizerId, teamAScore, teamBScore) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Check if user is the organizer or referee
      const isOrganizer = match.organizerId.toString() === organizerId.toString();
      const isReferee = match.referee.playerId && 
        match.referee.playerId.toString() === organizerId.toString();

      if (!isOrganizer && !isReferee) {
        throw new Error('Only the match organizer or referee can update the score');
      }

      // Update score
      match.score.teamA = teamAScore;
      match.score.teamB = teamBScore;
      await match.save();

      return {
        success: true,
        message: 'Score updated successfully',
        data: {
          matchId: match._id,
          score: match.score
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get user's matches
  async getUserMatches(userId, status = null) {
    try {
      let query = {
        $or: [
          { organizerId: userId },
          { 'teams.teamA.players.playerId': userId },
          { 'teams.teamB.players.playerId': userId },
          { 'referee.playerId': userId }
        ]
      };

      if (status) {
        query.status = status;
      }

      const matches = await Match.find(query)
        .populate('organizerId', 'name username profilePicture reputationScore')
        .populate('teams.teamA.players.playerId', 'name username position skillLevel')
        .populate('teams.teamB.players.playerId', 'name username position skillLevel')
        .populate('referee.playerId', 'name username')
        .sort({ dateTime: -1 });

      return {
        success: true,
        message: 'User matches retrieved successfully',
        data: { matches }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Private method to update player statistics after match
  async updatePlayerStats(match) {
    try {
      // Only update stats for completed matches
      if (match.status !== 'completed') return;

      const allPlayers = [
        ...match.teams.teamA.players.map(p => p.playerId),
        ...match.teams.teamB.players.map(p => p.playerId)
      ];

      // Update matches played for all players
      await User.updateMany(
        { _id: { $in: allPlayers } },
        { $inc: { matchesPlayed: 1 } }
      );

    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  }
}

module.exports = new MatchService();