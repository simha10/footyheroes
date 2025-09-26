const MatchChat = require('../models/MatchChat');
const Match = require('../models/Match');
const User = require('../models/User');

class MatchChatService {
  // Send a message to match chat
  async sendMessage(messageData) {
    try {
      const {
        matchId,
        senderId,
        message,
        messageType = 'text',
        replyTo = null,
        mediaUrl = null,
        mediaType = null,
        location = null
      } = messageData;

      // Verify the user is part of the match
      const match = await Match.findById(matchId).populate('teams.teamA.players.playerId teams.teamB.players.playerId');
      if (!match) {
        throw new Error('Match not found');
      }

      // Check if user is in the match (either as player, organizer, or referee)
      const isOrganizer = match.organizerId.toString() === senderId.toString();
      const isReferee = match.referee.playerId && match.referee.playerId.toString() === senderId.toString();
      
      const teamAPlayers = match.teams.teamA.players.map(p => p.playerId._id.toString());
      const teamBPlayers = match.teams.teamB.players.map(p => p.playerId._id.toString());
      const isPlayer = [...teamAPlayers, ...teamBPlayers].includes(senderId);

      if (!isOrganizer && !isReferee && !isPlayer) {
        throw new Error('Only match participants can send messages');
      }

      // Extract mentions
      const mentions = [];
      if (messageType === 'text' && message) {
        const mentionMatches = message.match(/@(\w+)/g);
        if (mentionMatches) {
          // Resolve usernames to user IDs
          for (const mention of mentionMatches) {
            const username = mention.substring(1); // Remove @
            const user = await User.findOne({ username: username.toLowerCase() });
            if (user) {
              mentions.push(user._id);
            }
          }
        }
      }

      // Create the message
      const chatMessage = new MatchChat({
        match: matchId,
        sender: senderId,
        message,
        messageType,
        replyTo,
        mediaUrl,
        mediaType,
        location,
        mentions
      });

      await chatMessage.save();

      // Populate sender info
      await chatMessage.populate('sender', 'name username profilePicture');

      return {
        success: true,
        message: 'Message sent successfully',
        data: {
          message: chatMessage
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get match messages
  async getMatchMessages(options) {
    try {
      const { matchId, page, limit, messageType, includePinned } = options;

      // Check if match exists
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      const messages = await MatchChat.getMatchMessages(matchId, {
        page,
        limit,
        messageType,
        includePinned
      });

      return {
        success: true,
        message: 'Messages retrieved successfully',
        data: {
          messages,
          pagination: {
            page,
            limit,
            total: messages.length
          }
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Edit a message
  async editMessage(messageId, userId, newMessage) {
    try {
      const message = await MatchChat.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Only sender or organizer can edit
      const match = await Match.findById(message.match);
      const isSender = message.sender.toString() === userId.toString();
      const isOrganizer = match.organizerId.toString() === userId.toString();

      if (!isSender && !isOrganizer) {
        throw new Error('You are not authorized to edit this message');
      }

      // Can only edit within 5 minutes of sending
      const minutesSinceSent = (new Date() - message.createdAt) / (1000 * 60);
      if (minutesSinceSent > 5 && !isOrganizer) {
        throw new Error('Message can only be edited within 5 minutes of sending');
      }

      const result = await message.editMessage(newMessage);
      await result.populate('sender', 'name username profilePicture');

      return {
        success: true,
        message: 'Message edited successfully',
        data: {
          message: result
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Delete a message
  async deleteMessage(messageId, userId, permanent = false) {
    try {
      const message = await MatchChat.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check authorization
      const match = await Match.findById(message.match);
      const isSender = message.sender.toString() === userId.toString();
      const isOrganizer = match.organizerId.toString() === userId.toString();

      if (!isSender && !isOrganizer) {
        throw new Error('You are not authorized to delete this message');
      }

      if (permanent && isOrganizer) {
        // Only organizer can permanently delete
        await MatchChat.findByIdAndDelete(messageId);
        return {
          success: true,
          message: 'Message permanently deleted'
        };
      } else {
        // Soft delete for sender or regular organizers
        await message.softDelete(userId);
        return {
          success: true,
          message: 'Message deleted successfully'
        };
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Add reaction to message
  async addReaction(messageId, userId, emoji) {
    try {
      const message = await MatchChat.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check if user is participant
      const match = await Match.findById(message.match);
      const isOrganizer = match.organizerId.toString() === userId.toString();
      const isReferee = match.referee.playerId && match.referee.playerId.toString() === userId.toString();
      
      const isPlayer = match.teams.teamA.players.some(p => p.playerId.toString() === userId.toString()) ||
                      match.teams.teamB.players.some(p => p.playerId.toString() === userId.toString());

      if (!isOrganizer && !isReferee && !isPlayer) {
        throw new Error('Only match participants can react to messages');
      }

      const result = await message.addReaction(emoji, userId);
      await result.populate('sender', 'name username profilePicture');

      return {
        success: true,
        message: 'Reaction added successfully',
        data: {
          message: result
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Remove reaction from message
  async removeReaction(messageId, userId, emoji) {
    try {
      const message = await MatchChat.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      const result = await message.removeReaction(emoji, userId);
      await result.populate('sender', 'name username profilePicture');

      return {
        success: true,
        message: 'Reaction removed successfully',
        data: {
          message: result
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Pin/Unpin message
  async togglePin(messageId, userId) {
    try {
      const message = await MatchChat.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Only organizer or referee can pin messages
      const match = await Match.findById(message.match);
      const isOrganizer = match.organizerId.toString() === userId.toString();
      const isReferee = match.referee.playerId && match.referee.playerId.toString() === userId.toString();

      if (!isOrganizer && !isReferee) {
        throw new Error('Only organizers or referees can pin/unpin messages');
      }

      const result = await message.togglePin(userId);
      await result.populate('sender', 'name username profilePicture');

      return {
        success: true,
        message: `Message ${result.isPinned ? 'pinned' : 'unpinned'} successfully`,
        data: {
          message: result
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Flag a message
  async flagMessage(messageId, userId, reason) {
    try {
      const message = await MatchChat.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      const result = await message.flagMessage(userId, reason);

      return {
        success: true,
        message: 'Message flagged successfully',
        data: {
          message: result
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Mark message as read
  async markAsRead(messageId, userId) {
    try {
      const message = await MatchChat.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      const result = await message.markAsRead(userId);

      return {
        success: true,
        message: 'Message marked as read'
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Search messages in match
  async searchMessages(matchId, query, limit) {
    try {
      const messages = await MatchChat.searchMessages(matchId, query, limit);

      return {
        success: true,
        message: 'Messages retrieved successfully',
        data: {
          messages
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get pinned messages
  async getPinnedMessages(matchId) {
    try {
      const messages = await MatchChat.getPinnedMessages(matchId);

      return {
        success: true,
        message: 'Pinned messages retrieved successfully',
        data: {
          messages
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get system messages
  async getSystemMessages(matchId, limit) {
    try {
      const messages = await MatchChat.getSystemMessages(matchId, limit);

      return {
        success: true,
        message: 'System messages retrieved successfully',
        data: {
          messages
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Send system message (for automated events)
  async sendSystemMessage(matchId, action, playerData = {}) {
    try {
      const message = new MatchChat({
        match: matchId,
        sender: playerData.playerId || null,
        message: this.generateSystemMessage(action, playerData),
        messageType: 'system',
        systemData: {
          action,
          ...playerData
        }
      });

      await message.save();

      return {
        success: true,
        message: 'System message sent',
        data: {
          message
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Generate system message content
  generateSystemMessage(action, playerData) {
    const { playerName, team, oldValue, newValue } = playerData;
    
    switch (action) {
      case 'player_joined':
        return `${playerName} joined ${team}`;
      case 'player_left':
        return `${playerName} left ${team}`;
      case 'match_started':
        return 'Match has started!';
      case 'match_ended':
        return 'Match has ended';
      case 'score_updated':
        return `Score updated: ${oldValue} - ${newValue}`;
      case 'player_substitution':
        return `${playerName} was substituted`;
      default:
        return 'System notification';
    }
  }
}

module.exports = new MatchChatService();
