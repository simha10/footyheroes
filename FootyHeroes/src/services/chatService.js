import apiClient from './apiClient';
import io from 'socket.io-client';
import { API_BASE_URL } from './config';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Connect to Socket.IO
  connectSocket(userId) {
    if (this.socket && this.isConnected) {
      return;
    }

    this.socket = io(API_BASE_URL.replace('/api', ''), {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.socket.emit('join:user', userId);
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  // Disconnect socket
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join match room
  joinMatchRoom(matchId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join:match', matchId);
    }
  }

  // Leave match room
  leaveMatchRoom(matchId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave:match', matchId);
    }
  }

  // Send message
  sendMessage(matchId, message, messageType = 'text') {
    if (this.socket && this.isConnected) {
      this.socket.emit('message:send', {
        matchId,
        message,
        messageType,
        senderId: 'currentUserId', // This will be replaced with actual user ID
        senderName: 'currentUserName', // This will be replaced with actual user name
      });
    }
  }

  // Request player for position
  requestPlayer(matchId, position) {
    if (this.socket && this.isConnected) {
      this.socket.emit('player:request', {
        matchId,
        position,
        requestedBy: 'currentUserId', // This will be replaced with actual user ID
      });
    }
  }

  // Update match information
  updateMatchInfo(matchId, update) {
    if (this.socket && this.isConnected) {
      this.socket.emit('match:update', {
        matchId,
        update,
      });
    }
  }

  // Send notification
  sendNotification(userId, notification) {
    if (this.socket && this.isConnected) {
      this.socket.emit('notification:send', {
        userId,
        notification,
      });
    }
  }

  // Get match messages
  async getMatchMessages(matchId, options = {}) {
    try {
      const { page = 1, limit = 50, messageType } = options;
      const response = await apiClient.get(`${API_BASE_URL}/chat/${matchId}/messages`, {
        params: { page, limit, messageType }
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get messages');
    }
  }

  // Send message via API (for persistence)
  async sendMessageToAPI(matchId, messageData) {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/chat/${matchId}/message`, messageData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  }

  // Edit message
  async editMessage(messageId, newMessage) {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/chat/messages/${messageId}`, {
        message: newMessage
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to edit message');
    }
  }

  // Delete message
  async deleteMessage(messageId, permanent = false) {
    try {
      const response = await apiClient.delete(`${API_BASE_URL}/chat/messages/${messageId}`, {
        data: { permanent }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete message');
    }
  }

  // Add reaction to message
  async addReaction(messageId, emoji) {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/chat/messages/${messageId}/reactions`, {
        emoji
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add reaction');
    }
  }

  // Remove reaction from message
  async removeReaction(messageId, emoji) {
    try {
      const response = await apiClient.delete(`${API_BASE_URL}/chat/messages/${messageId}/reactions`, {
        data: { emoji }
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove reaction');
    }
  }

  // Search messages
  async searchMessages(matchId, query, limit = 20) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/chat/${matchId}/search`, {
        params: { query, limit }
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search messages');
    }
  }

  // Get pinned messages
  async getPinnedMessages(matchId) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/chat/${matchId}/pinned`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get pinned messages');
    }
  }

  // Get system messages
  async getSystemMessages(matchId, limit = 20) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/chat/${matchId}/system`, {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get system messages');
    }
  }
}

export default new ChatService();
