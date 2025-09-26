import apiClient from './apiClient';

const API_BASE_URL = 'http://localhost:5000/api';

class MatchService {
  // Get all matches with filters
  async getMatches(filters = {}) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/matches`, { params: filters });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch matches');
    }
  }

  // Get match by ID
  async getMatchById(matchId) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/matches/${matchId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch match');
    }
  }

  // Create new match
  async createMatch(matchData) {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/matches`, matchData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create match');
    }
  }

  // Update match
  async updateMatch(matchId, updateData) {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/matches/${matchId}`, updateData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update match');
    }
  }

  // Cancel match
  async cancelMatch(matchId) {
    try {
      const response = await apiClient.delete(`${API_BASE_URL}/matches/${matchId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel match');
    }
  }

  // Join match
  async joinMatch(matchId, preferredPosition = null) {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/matches/${matchId}/join`, {
        preferredPosition
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to join match');
    }
  }

  // Leave match
  async leaveMatch(matchId) {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/matches/${matchId}/leave`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to leave match');
    }
  }

  // Start match
  async startMatch(matchId) {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/matches/${matchId}/start`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start match');
    }
  }

  // End match
  async endMatch(matchId) {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/matches/${matchId}/end`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to end match');
    }
  }

  // Update match score
  async updateScore(matchId, scoreData) {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/matches/${matchId}/score`, scoreData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update score');
    }
  }

  // Get nearby matches
  async getNearbyMatches(location) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/matches/nearby/list`, {
        params: location
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get nearby matches');
    }
  }

  // Get user's matches
  async getUserMatches(status = null) {
    try {
      const params = status ? { status } : {};
      const response = await apiClient.get(`${API_BASE_URL}/matches/my/matches`, {
        params
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user matches');
    }
  }

  // Get match statistics
  async getMatchStats(matchId) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/matches/${matchId}/stats`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get match statistics');
    }
  }

  // Check if user can join match
  async canJoinMatch(matchId) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/matches/${matchId}/can-join`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check join eligibility');
    }
  }
}

export default new MatchService();
