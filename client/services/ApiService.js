import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorageUtils from '../utils/AsyncStorage';

// Dynamically determine the API_URL using the LAN IP address of the Expo development server
const API_URL = Constants.expoConfig?.hostUri
  ? `http://${Constants.expoConfig.hostUri.split(':')[0]}:3000`
  : 'http://localhost:3000';

console.log('API_URL set to:', API_URL);

class ApiService {
  static instance;
  axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });

    // Interceptor for handling unauthorized errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          console.warn('🔐 Session expired or unauthorized – clearing AsyncStorage');
          await AsyncStorageUtils.removeItem('user');
          await AsyncStorageUtils.removeItem('signed_session_id');
          await AsyncStorageUtils.removeItem('preferences');
        }
        return Promise.reject(error);
      }
    );
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
        ...config,
        headers,
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
          ? {} // Let axios set Content-Type for FormData
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
        ...config,
        headers,
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
