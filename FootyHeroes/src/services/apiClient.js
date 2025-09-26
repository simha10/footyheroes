import axios from 'axios';
import { Platform } from 'react-native';

// Determine API base URL based on platform
const API_BASE_URL = Platform.OS === 'ios' 
  ? 'http://localhost:5000/api'
  : 'http://10.0.2.2:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Auth token will be set by auth service
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - redirect to login
      // This will be handled by the auth service
    }
    return Promise.reject(error);
  }
);

export default apiClient;
