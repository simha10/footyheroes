const playerRequestService = require('../services/playerRequestService');

class PlayerRequestController {
  // @desc    Create a new player request
  // @route   POST /api/player-requests
  // @access  Private
  async createPlayerRequest(req, res) {
    try {
      const result = await playerRequestService.createPlayerRequest(
        req.body.matchId, 
        req.user._id, 
        req.body
      );
      res.status(201).json(result);
    } catch (error) {
      console.error('Create player request error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Broadcast player request to eligible players
  // @route   POST /api/player-requests/:id/broadcast
  // @access  Private
  async broadcastRequest(req, res) {
    try {
      const result = await playerRequestService.broadcastPlayerRequest(
        req.params.id, 
        req.app.get('socketio') // Access Socket.IO instance
      );
      res.status(200).json(result);
    } catch (error) {
      console.error('Broadcast request error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Respond to a player request
  // @route   POST /api/player-requests/:id/respond
  // @access  Private
  async respondToRequest(req, res) {
    try {
      const { response } = req.body;
      const result = await playerRequestService.respondToRequest(
        req.params.id, 
        req.user._id, 
        response
      );
      res.status(200).json(result);
    } catch (error) {
      console.error('Respond to request error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get player requests (received or sent)
  // @route   GET /api/player-requests
  // @access  Private
  async getPlayerRequests(req, res) {
    try {
      const type = req.query.type || 'received'; // 'received' or 'sent'
      const result = await playerRequestService.getPlayerRequests(req.user._id, type);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get player requests error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get request details
  // @route   GET /api/player-requests/:id
  // @access  Private
  async getRequestDetails(req, res) {
    try {
      const result = await playerRequestService.getRequestDetails(req.params.id, req.user._id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get request details error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Update player request
  // @route   PUT /api/player-requests/:id
  // @access  Private
  async updateRequest(req, res) {
    try {
      const result = await playerRequestService.updateRequest(req.params.id, req.user._id, req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('Update request error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Cancel player request
  // @route   DELETE /api/player-requests/:id
  // @access  Private
  async cancelRequest(req, res) {
    try {
      const result = await playerRequestService.cancelRequest(req.params.id, req.user._id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Cancel request error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get request analytics
  // @route   GET /api/player-requests/:id/analytics
  // @access  Private
  async getRequestAnalytics(req, res) {
    try {
      const result = await playerRequestService.getRequestAnalytics(req.params.id, req.user._id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get request analytics error:', error);
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Cleanup expired requests (Admin only)
  // @route   POST /api/player-requests/cleanup
  // @access  Private (Admin)
  async cleanupExpiredRequests(req, res) {
    try {
      const result = await playerRequestService.cleanupExpiredRequests();
      res.status(200).json(result);
    } catch (error) {
      console.error('Cleanup requests error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PlayerRequestController();