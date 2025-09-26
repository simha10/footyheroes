import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const API_BASE_URL = 'http://localhost:5000/api';

class AuthService {
  constructor() {
    this.token = null;
  }

  // Set auth token for API calls
  setAuthToken(token) {
    this.token = token;
    AsyncStorage.setItem('authToken', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Remove auth token
  removeAuthToken() {
    this.token = null;
    AsyncStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
  }

  // Initialize auth token from storage
  async initializeAuth() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.setAuthToken(token);
        return token;
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
    return null;
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/auth/login`, credentials);
      const { token, user } = response.data.data;
      this.setAuthToken(token);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  // Logout user
  async logout() {
    try {
      await apiClient.post(`${API_BASE_URL}/auth/logout`);
      this.removeAuthToken();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/auth/me`);
      return response.data.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user profile');
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/auth/profile`, profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/auth/change-password`, passwordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }

  // Find nearby players
  async getNearbyPlayers(location) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/auth/nearby-players`, {
        params: location
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get nearby players');
    }
  }

  // Get user by username
  async getUserByUsername(username) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/auth/user/${username}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user info');
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/auth/refresh`);
      const { token } = response.data.data;
      this.setAuthToken(token);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to refresh token');
    }
  }

  // Deactivate account
  async deactivateAccount() {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/auth/deactivate`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to deactivate account');
    }
  }

  // Reactivate account
  async reactivateAccount() {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/auth/reactivate`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reactivate account');
    }
  }
}

export default new AuthService();
