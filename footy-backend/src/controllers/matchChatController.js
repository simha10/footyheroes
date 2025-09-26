const matchChatService = require('../services/matchChatService');

class MatchChatController {
  // Send a message to match chat
  async sendMessage(req, res) {
    try {
      const { matchId } = req.params;
      const { message, messageType = 'text', replyTo, mediaUrl, mediaType, location } = req.body;
      
      const result = await matchChatService.sendMessage({
        matchId,
        senderId: req.user._id,
        message,
        messageType,
        replyTo,
        mediaUrl,
        mediaType,
        location
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get match chat messages
  async getMatchMessages(req, res) {
    try {
      const { matchId } = req.params;
      const { page = 1, limit = 50, messageType } = req.query;

      const result = await matchChatService.getMatchMessages({
        matchId,
        page: parseInt(page),
        limit: parseInt(limit),
        messageType,
        includePinned: true
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Get match messages error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Edit a message
  async editMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { message: newMessage } = req.body;

      const result = await matchChatService.editMessage(messageId, req.user._id, newMessage);

      res.status(200).json(result);
    } catch (error) {
      console.error('Edit message error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete a message
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { permanent = false } = req.body;

      const result = await matchChatService.deleteMessage(messageId, req.user._id, permanent);

      res.status(200).json(result);
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add reaction to message
  async addReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;

      const result = await matchChatService.addReaction(messageId, req.user._id, emoji);

      res.status(200).json(result);
    } catch (error) {
      console.error('Add reaction error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Remove reaction from message
  async removeReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;

      const result = await matchChatService.removeReaction(messageId, req.user._id, emoji);

      res.status(200).json(result);
    } catch (error) {
      console.error('Remove reaction error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Pin/Unpin message
  async togglePin(req, res) {
    try {
      const { messageId } = req.params;

      const result = await matchChatService.togglePin(messageId, req.user._id);

      res.status(200).json(result);
    } catch (error) {
      console.error('Toggle pin error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Flag a message
  async flagMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { reason } = req.body;

      const result = await matchChatService.flagMessage(messageId, req.user._id, reason);

      res.status(200).json(result);
    } catch (error) {
      console.error('Flag message error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mark message as read
  async markAsRead(req, res) {
    try {
      const { messageId } = req.params;

      const result = await matchChatService.markAsRead(messageId, req.user._id);

      res.status(200).json(result);
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Search messages in match
  async searchMessages(req, res) {
    try {
      const { matchId } = req.params;
      const { query, limit = 20 } = req.query;

      const result = await matchChatService.searchMessages(matchId, query, parseInt(limit));

      res.status(200).json(result);
    } catch (error) {
      console.error('Search messages error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get pinned messages
  async getPinnedMessages(req, res) {
    try {
      const { matchId } = req.params;

      const result = await matchChatService.getPinnedMessages(matchId);

      res.status(200).json(result);
    } catch (error) {
      console.error('Get pinned messages error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get system messages
  async getSystemMessages(req, res) {
    try {
      const { matchId } = req.params;
      const { limit = 20 } = req.query;

      const result = await matchChatService.getSystemMessages(matchId, parseInt(limit));

      res.status(200).json(result);
    } catch (error) {
      console.error('Get system messages error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new MatchChatController();
