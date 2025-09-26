const MatchRequest = require('../models/MatchRequest');
const Match = require('../models/Match');
const User = require('../models/User');

class PlayerRequestService {
  // Create a new player request
  async createPlayerRequest(matchId, requesterId, requestData) {
    try {
      // Validate match exists and requester has permission
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      // Check if requester is organizer or has permission
      const isOrganizer = match.organizerId.toString() === requesterId.toString();
      const isPlayerInMatch = match.teams.teamA.players.some(p => 
        p.playerId.toString() === requesterId.toString()
      ) || match.teams.teamB.players.some(p => 
        p.playerId.toString() === requesterId.toString()
      );

      if (!isOrganizer && !isPlayerInMatch) {
        throw new Error('Only match organizer or players can create requests');
      }

      // Check if match is still accepting players
      if (match.status !== 'open') {
        throw new Error('Match is not accepting new players');
      }

      // Set default expiry time (1 hour from now)
      const defaultExpiry = new Date(Date.now() + 60 * 60 * 1000);
      
      // Create request
      const requestPayload = {
        matchId,
        requestedBy: requesterId,
        expiresAt: requestData.expiresAt || defaultExpiry,
        ...requestData
      };

      const playerRequest = new MatchRequest(requestPayload);
      await playerRequest.save();

      // Populate request data
      await playerRequest.populate([
        { path: 'matchId', select: 'title location dateTime format' },
        { path: 'requestedBy', select: 'name username profilePicture' }
      ]);

      return {
        success: true,
        message: 'Player request created successfully',
        data: { request: playerRequest }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Broadcast request to eligible players
  async broadcastPlayerRequest(requestId, socketIO) {
    try {
      const request = await MatchRequest.findById(requestId)
        .populate('matchId')
        .populate('requestedBy');

      if (!request) {
        throw new Error('Request not found');
      }

      // Find eligible players
      const eligiblePlayers = await MatchRequest.findEligiblePlayers(requestId);

      if (eligiblePlayers.length === 0) {
        return {
          success: true,
          message: 'No eligible players found',
          data: { contacted: 0 }
        };
      }

      // Send notifications to eligible players
      let contactedCount = 0;
      for (const player of eligiblePlayers) {
        // Add to contacted list
        request.addContactedPlayer(player._id, 'pending');
        contactedCount++;

        // Send Socket.IO notification
        if (socketIO) {
          socketIO.to(`user:${player._id}`).emit('player:request:received', {
            requestId: request._id,
            match: {
              id: request.matchId._id,
              title: request.matchId.title,
              format: request.matchId.format,
              dateTime: request.matchId.dateTime,
              location: request.matchId.location
            },
            position: request.positionNeeded,
            message: request.message,
            urgency: request.urgency,
            requester: {
              name: request.requestedBy.name,
              username: request.requestedBy.username
            },
            expiresAt: request.expiresAt
          });
        }
      }

      await request.save();

      return {
        success: true,
        message: `Request broadcasted to ${contactedCount} players`,
        data: {
          contacted: contactedCount,
          eligiblePlayers: eligiblePlayers.length
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Respond to a player request
  async respondToRequest(requestId, playerId, response) {
    try {
      const request = await MatchRequest.findById(requestId)
        .populate('matchId');

      if (!request) {
        throw new Error('Request not found');
      }

      // Check if request is still active
      if (request.status !== 'active') {
        throw new Error('Request is no longer active');
      }

      // Check if player was contacted
      const contactedPlayer = request.playersContacted.find(p => 
        p.playerId.toString() === playerId.toString()
      );

      if (!contactedPlayer) {
        throw new Error('You were not contacted for this request');
      }

      // Update response
      request.addContactedPlayer(playerId, response);
      await request.save();

      // If interested, provide match details
      let matchDetails = null;
      if (response === 'interested') {
        matchDetails = {
          id: request.matchId._id,
          title: request.matchId.title,
          availableSlots: request.matchId.availableSlots
        };
      }

      return {
        success: true,
        message: `Response "${response}" recorded successfully`,
        data: {
          requestId: request._id,
          response,
          matchDetails
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get player requests for a user
  async getPlayerRequests(userId, type = 'received') {
    try {
      let query = {};
      
      if (type === 'received') {
        // Requests received by this user
        query = {
          'playersContacted.playerId': userId,
          status: 'active'
        };
      } else if (type === 'sent') {
        // Requests created by this user
        query = {
          requestedBy: userId
        };
      } else {
        throw new Error('Type must be "received" or "sent"');
      }

      const requests = await MatchRequest.find(query)
        .populate('matchId', 'title location dateTime format availableSlots')
        .populate('requestedBy', 'name username profilePicture')
        .sort({ broadcastTime: -1 })
        .limit(50);

      // For received requests, add user's response
      if (type === 'received') {
        requests.forEach(request => {
          const userContact = request.playersContacted.find(p => 
            p.playerId.toString() === userId.toString()
          );
          request._doc.userResponse = userContact ? userContact.response : 'pending';
          request._doc.contactedAt = userContact ? userContact.contactedAt : null;
        });
      }

      return {
        success: true,
        message: 'Player requests retrieved successfully',
        data: { requests, type }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get request details
  async getRequestDetails(requestId, userId) {
    try {
      const request = await MatchRequest.findById(requestId)
        .populate('matchId')
        .populate('requestedBy', 'name username profilePicture reputationScore')
        .populate('playersContacted.playerId', 'name username profilePicture')
        .populate('playersJoined.playerId', 'name username profilePicture');

      if (!request) {
        throw new Error('Request not found');
      }

      // Check if user has access to this request
      const isRequester = request.requestedBy._id.toString() === userId.toString();
      const isContacted = request.playersContacted.some(p => 
        p.playerId._id.toString() === userId.toString()
      );

      if (!isRequester && !isContacted) {
        throw new Error('Access denied to this request');
      }

      return {
        success: true,
        message: 'Request details retrieved successfully',
        data: { request }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Cancel a request
  async cancelRequest(requestId, userId) {
    try {
      const request = await MatchRequest.findById(requestId);
      
      if (!request) {
        throw new Error('Request not found');
      }

      // Check if user can cancel this request
      if (request.requestedBy.toString() !== userId.toString()) {
        throw new Error('Only the request creator can cancel this request');
      }

      // Check if request can be cancelled
      if (request.status !== 'active') {
        throw new Error('Request cannot be cancelled in current status');
      }

      request.status = 'cancelled';
      await request.save();

      return {
        success: true,
        message: 'Request cancelled successfully',
        data: { requestId: request._id }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Update request
  async updateRequest(requestId, userId, updateData) {
    try {
      const request = await MatchRequest.findById(requestId);
      
      if (!request) {
        throw new Error('Request not found');
      }

      // Check if user can update this request
      if (request.requestedBy.toString() !== userId.toString()) {
        throw new Error('Only the request creator can update this request');
      }

      // Check if request can be updated
      if (request.status !== 'active') {
        throw new Error('Request cannot be updated in current status');
      }

      // Apply updates
      const allowedUpdates = ['message', 'urgency', 'targetSkillLevel', 'maxDistance', 'expiresAt'];
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
          request[key] = updateData[key];
        }
      });

      await request.save();

      return {
        success: true,
        message: 'Request updated successfully',
        data: { request }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get request analytics
  async getRequestAnalytics(requestId, userId) {
    try {
      const request = await MatchRequest.findById(requestId);
      
      if (!request) {
        throw new Error('Request not found');
      }

      // Check if user can view analytics
      if (request.requestedBy.toString() !== userId.toString()) {
        throw new Error('Only the request creator can view analytics');
      }

      const analytics = {
        requestId: request._id,
        status: request.status,
        totalContacted: request.totalContacted,
        totalInterested: request.totalInterested,
        totalJoined: request.totalJoined,
        remainingSlots: request.remainingSlots,
        responseRate: parseFloat(request.responseRate),
        successRate: parseFloat(request.successRate),
        responses: {
          pending: request.playersContacted.filter(p => p.response === 'pending').length,
          interested: request.playersContacted.filter(p => p.response === 'interested').length,
          declined: request.playersContacted.filter(p => p.response === 'declined').length,
          joined: request.playersContacted.filter(p => p.response === 'joined').length
        },
        timeRemaining: request.expiresAt > new Date() ? 
          Math.ceil((request.expiresAt - new Date()) / (1000 * 60)) : 0 // minutes
      };

      return {
        success: true,
        message: 'Request analytics retrieved successfully',
        data: { analytics }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Auto-cleanup expired requests
  async cleanupExpiredRequests() {
    try {
      const cleanedCount = await MatchRequest.cleanupExpired();
      
      return {
        success: true,
        message: 'Expired requests cleaned up',
        data: { cleanedCount }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Record when contacted player joins match
  async recordPlayerJoin(requestId, playerId) {
    try {
      const request = await MatchRequest.findById(requestId);
      
      if (request && request.status === 'active') {
        request.recordPlayerJoin(playerId);
        await request.save();
      }

      return { success: true };
    } catch (error) {
      console.error('Error recording player join:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PlayerRequestService();