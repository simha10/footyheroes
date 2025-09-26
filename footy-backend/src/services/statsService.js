const MatchEvent = require('../models/MatchEvent');
const Match = require('../models/Match');
const User = require('../models/User');

class StatsService {
  // Log a match event
  async logMatchEvent(matchId, recorderId, eventData) {
    try {
      // Validate match exists and is ongoing
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      if (match.status !== 'ongoing') {
        throw new Error('Can only log events for ongoing matches');
      }

      // Check if recorder has permission (organizer, referee, or player)
      const isOrganizer = match.organizerId.toString() === recorderId.toString();
      const isReferee = match.referee.playerId && 
        match.referee.playerId.toString() === recorderId.toString();
      const isPlayer = match.teams.teamA.players.some(p => 
        p.playerId.toString() === recorderId.toString()
      ) || match.teams.teamB.players.some(p => 
        p.playerId.toString() === recorderId.toString()
      );

      if (!isOrganizer && !isReferee && !isPlayer) {
        throw new Error('Only match organizer, referee, or players can log events');
      }

      // Validate player is in the match
      const playerInTeamA = match.teams.teamA.players.find(p => 
        p.playerId.toString() === eventData.playerId.toString()
      );
      const playerInTeamB = match.teams.teamB.players.find(p => 
        p.playerId.toString() === eventData.playerId.toString()
      );

      if (!playerInTeamA && !playerInTeamB) {
        throw new Error('Player is not part of this match');
      }

      // Determine which team the player is on
      const team = playerInTeamA ? 'teamA' : 'teamB';

      // Create event
      const eventPayload = {
        matchId,
        recordedBy: recorderId,
        team,
        scoreAtTime: match.score,
        ...eventData
      };

      const matchEvent = new MatchEvent(eventPayload);
      await matchEvent.save();

      // Update match score if it's a scoring event
      if (matchEvent.impactsScore) {
        await this.updateMatchScore(match, matchEvent);
      }

      // Update player statistics in User model
      await this.updatePlayerStats(eventData.playerId, matchEvent.eventType);

      // Populate event data
      await matchEvent.populate([
        { path: 'playerId', select: 'name username position' },
        { path: 'recordedBy', select: 'name username' },
        { path: 'relatedPlayerId', select: 'name username position' }
      ]);

      return {
        success: true,
        message: 'Match event logged successfully',
        data: { event: matchEvent }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Update match score based on events
  async updateMatchScore(match, event) {
    try {
      if (event.eventType === 'goal' || event.eventType === 'penalty_scored') {
        if (event.team === 'teamA') {
          match.score.teamA += 1;
        } else {
          match.score.teamB += 1;
        }
      } else if (event.eventType === 'own_goal') {
        // Own goal increases opponent's score
        if (event.team === 'teamA') {
          match.score.teamB += 1;
        } else {
          match.score.teamA += 1;
        }
      }

      await match.save();
    } catch (error) {
      console.error('Error updating match score:', error);
    }
  }

  // Update player statistics in User model
  async updatePlayerStats(playerId, eventType) {
    try {
      const updateField = {};
      
      switch (eventType) {
        case 'goal':
        case 'penalty_scored':
          updateField.goals = 1;
          break;
        case 'assist':
          updateField.assists = 1;
          break;
        case 'shot_on_target':
          updateField.shotsOnTarget = 1;
          break;
        case 'yellow_card':
          updateField.yellowCards = 1;
          break;
        case 'red_card':
          updateField.redCards = 1;
          break;
      }

      if (Object.keys(updateField).length > 0) {
        await User.findByIdAndUpdate(playerId, { $inc: updateField });
      }
    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  }

  // Get match events
  async getMatchEvents(matchId, userId = null) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Check access permissions
      if (userId) {
        const hasAccess = match.organizerId.toString() === userId.toString() ||
          (match.referee.playerId && match.referee.playerId.toString() === userId.toString()) ||
          match.teams.teamA.players.some(p => p.playerId.toString() === userId.toString()) ||
          match.teams.teamB.players.some(p => p.playerId.toString() === userId.toString());

        if (!hasAccess && match.type === 'private') {
          throw new Error('Access denied to this match events');
        }
      }

      const events = await MatchEvent.find({ 
        matchId, 
        isDeleted: false 
      })
        .populate('playerId', 'name username position')
        .populate('recordedBy', 'name username')
        .populate('relatedPlayerId', 'name username position')
        .sort({ minute: 1, createdAt: 1 });

      return {
        success: true,
        message: 'Match events retrieved successfully',
        data: { 
          events,
          matchTitle: match.title,
          matchStatus: match.status
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get match statistics
  async getMatchStatistics(matchId, userId = null) {
    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Check access permissions
      if (userId) {
        const hasAccess = match.organizerId.toString() === userId.toString() ||
          (match.referee.playerId && match.referee.playerId.toString() === userId.toString()) ||
          match.teams.teamA.players.some(p => p.playerId.toString() === userId.toString()) ||
          match.teams.teamB.players.some(p => p.playerId.toString() === userId.toString());

        if (!hasAccess && match.type === 'private') {
          throw new Error('Access denied to this match statistics');
        }
      }

      const stats = await MatchEvent.getMatchStats(matchId);

      return {
        success: true,
        message: 'Match statistics retrieved successfully',
        data: {
          matchId,
          matchTitle: match.title,
          matchStatus: match.status,
          score: match.score,
          statistics: stats
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get player statistics
  async getPlayerStatistics(playerId, matchId = null) {
    try {
      const player = await User.findById(playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      const eventStats = await MatchEvent.getPlayerStats(playerId, matchId);
      
      // Combine with User model stats
      const combinedStats = {
        playerId: player._id,
        playerName: player.name,
        username: player.username,
        position: player.position,
        skillLevel: player.skillLevel,
        
        // From User model (overall stats)
        overallStats: {
          matchesPlayed: player.matchesPlayed,
          goals: player.goals,
          assists: player.assists,
          shotsOnTarget: player.shotsOnTarget,
          yellowCards: player.yellowCards,
          redCards: player.redCards,
          mvpAwards: player.mvpAwards,
          reputationScore: player.reputationScore
        },
        
        // From events (detailed stats)
        detailedStats: eventStats,
        
        // Calculated metrics
        averageGoalsPerMatch: player.matchesPlayed > 0 ? 
          (player.goals / player.matchesPlayed).toFixed(2) : 0,
        averageAssistsPerMatch: player.matchesPlayed > 0 ? 
          (player.assists / player.matchesPlayed).toFixed(2) : 0
      };

      return {
        success: true,
        message: 'Player statistics retrieved successfully',
        data: { statistics: combinedStats }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Update/Edit an event
  async updateEvent(eventId, userId, updateData) {
    try {
      const event = await MatchEvent.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.isDeleted) {
        throw new Error('Cannot update deleted event');
      }

      // Check permission (only recorder or match organizer can update)
      const match = await Match.findById(event.matchId);
      const canUpdate = event.recordedBy.toString() === userId.toString() ||
        match.organizerId.toString() === userId.toString();

      if (!canUpdate) {
        throw new Error('Only event recorder or match organizer can update events');
      }

      // Apply updates
      const allowedUpdates = [
        'minute', 'half', 'description', 'cardReason', 'substitutionReason',
        'position', 'relatedPlayerId', 'relatedPlayerRole'
      ];

      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
          event[key] = updateData[key];
        }
      });

      await event.save();

      await event.populate([
        { path: 'playerId', select: 'name username position' },
        { path: 'recordedBy', select: 'name username' },
        { path: 'relatedPlayerId', select: 'name username position' }
      ]);

      return {
        success: true,
        message: 'Event updated successfully',
        data: { event }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Delete an event
  async deleteEvent(eventId, userId, reason) {
    try {
      const event = await MatchEvent.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.isDeleted) {
        throw new Error('Event is already deleted');
      }

      // Check permission (only recorder, match organizer, or referee can delete)
      const match = await Match.findById(event.matchId);
      const canDelete = event.recordedBy.toString() === userId.toString() ||
        match.organizerId.toString() === userId.toString() ||
        (match.referee.playerId && match.referee.playerId.toString() === userId.toString());

      if (!canDelete) {
        throw new Error('Insufficient permissions to delete this event');
      }

      // Soft delete the event
      event.softDelete(userId, reason);
      await event.save();

      // If it was a scoring event, update match score
      if (event.impactsScore) {
        await this.revertMatchScore(match, event);
      }

      // Revert player statistics
      await this.revertPlayerStats(event.playerId, event.eventType);

      return {
        success: true,
        message: 'Event deleted successfully',
        data: { eventId: event._id }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Revert match score when deleting scoring events
  async revertMatchScore(match, event) {
    try {
      if (event.eventType === 'goal' || event.eventType === 'penalty_scored') {
        if (event.team === 'teamA') {
          match.score.teamA = Math.max(0, match.score.teamA - 1);
        } else {
          match.score.teamB = Math.max(0, match.score.teamB - 1);
        }
      } else if (event.eventType === 'own_goal') {
        // Revert own goal
        if (event.team === 'teamA') {
          match.score.teamB = Math.max(0, match.score.teamB - 1);
        } else {
          match.score.teamA = Math.max(0, match.score.teamA - 1);
        }
      }

      await match.save();
    } catch (error) {
      console.error('Error reverting match score:', error);
    }
  }

  // Revert player statistics when deleting events
  async revertPlayerStats(playerId, eventType) {
    try {
      const updateField = {};
      
      switch (eventType) {
        case 'goal':
        case 'penalty_scored':
          updateField.goals = -1;
          break;
        case 'assist':
          updateField.assists = -1;
          break;
        case 'shot_on_target':
          updateField.shotsOnTarget = -1;
          break;
        case 'yellow_card':
          updateField.yellowCards = -1;
          break;
        case 'red_card':
          updateField.redCards = -1;
          break;
      }

      if (Object.keys(updateField).length > 0) {
        await User.findByIdAndUpdate(playerId, { $inc: updateField });
      }
    } catch (error) {
      console.error('Error reverting player stats:', error);
    }
  }

  // Validate an event
  async validateEvent(eventId, validatorId) {
    try {
      const event = await MatchEvent.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.isDeleted) {
        throw new Error('Cannot validate deleted event');
      }

      if (event.isValidated) {
        throw new Error('Event is already validated');
      }

      // Check permission (match organizer or referee)
      const match = await Match.findById(event.matchId);
      const canValidate = match.organizerId.toString() === validatorId.toString() ||
        (match.referee.playerId && match.referee.playerId.toString() === validatorId.toString());

      if (!canValidate) {
        throw new Error('Only match organizer or referee can validate events');
      }

      event.validateEvent(validatorId);
      await event.save();

      return {
        success: true,
        message: 'Event validated successfully',
        data: { eventId: event._id }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get events timeline for a match
  async getMatchTimeline(matchId, userId = null) {
    try {
      const events = await this.getMatchEvents(matchId, userId);
      
      if (!events.success) {
        return events;
      }

      // Create timeline with key events
      const timeline = events.data.events
        .filter(event => [
          'goal', 'penalty_scored', 'own_goal', 'assist',
          'yellow_card', 'red_card', 'substitution_in'
        ].includes(event.eventType))
        .map(event => ({
          minute: event.minute,
          half: event.half,
          eventType: event.eventType,
          player: event.playerId.name,
          team: event.team,
          description: event.description || this.getEventDescription(event),
          eventCategory: event.eventCategory
        }))
        .sort((a, b) => a.minute - b.minute);

      return {
        success: true,
        message: 'Match timeline retrieved successfully',
        data: { 
          timeline,
          totalEvents: events.data.events.length
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Helper method to generate event descriptions
  getEventDescription(event) {
    const playerName = event.playerId?.name || 'Unknown Player';
    
    switch (event.eventType) {
      case 'goal':
        return `${playerName} scores a goal`;
      case 'penalty_scored':
        return `${playerName} converts penalty`;
      case 'own_goal':
        return `${playerName} scores own goal`;
      case 'assist':
        return `${playerName} provides assist`;
      case 'yellow_card':
        return `${playerName} receives yellow card`;
      case 'red_card':
        return `${playerName} receives red card`;
      case 'substitution_in':
        return `${playerName} enters the match`;
      default:
        return `${event.eventType} by ${playerName}`;
    }
  }
}

module.exports = new StatsService();