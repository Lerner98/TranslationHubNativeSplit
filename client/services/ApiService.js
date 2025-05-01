// app/services/ApiService.js
import axios from 'axios';
import Constants from 'expo-constants';

// Dynamically determine the API_URL using the LAN IP address of the Expo development server
const API_URL = Constants.expoConfig?.hostUri
  ? `http://${Constants.expoConfig.hostUri.split(':')[0]}:3000`
  : 'http://localhost:3000'; // Fallback for when not running in Expo Go

console.log('API_URL set to:', API_URL); // Debug log to confirm the URL

class ApiService {
  static instance;
  axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });
  }

  static getInstance() {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async get(url, token = null, config = {}) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await this.axiosInstance.get(url, {
        headers,
        ...config,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post(url, data, token = null, config = {}) {
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;

      const headers = {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(isFormData
          ? {} // Don't manually set Content-Type for FormData (let axios set the boundary)
          : { 'Content-Type': 'application/json' }),
        ...config.headers,
      };

      const response = await this.axiosInstance.post(url, data, {
        ...config,
        headers,
      });

      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(url, token = null, config = {}) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await this.axiosInstance.delete(url, {
        headers,
        ...config,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error || 'Request failed',
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Network error: No response received',
      };
    } else {
      return {
        success: false,
        error: error.message || 'Request setup error',
      };
    }
  }
}

export default ApiService.getInstance();
