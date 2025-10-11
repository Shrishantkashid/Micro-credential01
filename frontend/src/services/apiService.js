import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://micro-credential-aggregator.vercel.app' 
    : 'http://localhost:3000');

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        const errorData = error.response?.data;
        if (typeof errorData === 'object' && errorData !== null) {
          console.error('API Response Error:', {
            status: error.response?.status,
            message: errorData.message || errorData.error,
            details: errorData
          });
        } else {
          console.error('API Response Error:', errorData || error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Authentication endpoints
  async getAuthUrl() {
    try {
      const response = await this.api.get('/api/auth/login');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkAuthStatus(email) {
    try {
      const response = await this.api.get(`/api/auth/status?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(email) {
    try {
      const response = await this.api.post('/api/auth/logout', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async refreshTokens(email) {
    try {
      const response = await this.api.post('/api/auth/refresh', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gmail endpoints
  async syncCertificates(email) {
    try {
      const response = await this.api.post('/api/gmail/sync', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCertificates(email) {
    try {
      const response = await this.api.get(`/api/gmail/certificates?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async testGmailConnection(email) {
    try {
      const response = await this.api.get(`/api/gmail/test?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getStats(email) {
    try {
      const response = await this.api.get(`/api/gmail/stats?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    let errorInfo;
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      errorInfo = {
        status,
        message: data.message || data.error || 'Server error occurred',
        details: data.details || null,
        code: data.error || 'SERVER_ERROR'
      };
    } else if (error.request) {
      // Request made but no response received
      errorInfo = {
        status: 0,
        message: 'Unable to connect to server. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      };
    } else {
      // Something happened in setting up the request
      errorInfo = {
        status: 0,
        message: error.message || 'An unexpected error occurred',
        code: 'CLIENT_ERROR'
      };
    }
    
    // Create a proper Error object with additional properties
    const err = new Error(errorInfo.message);
    err.status = errorInfo.status;
    err.code = errorInfo.code;
    err.details = errorInfo.details;
    
    return err;
  }

  // Utility methods
  isNetworkError(error) {
    return error.code === 'NETWORK_ERROR' || error.status === 0;
  }

  isAuthError(error) {
    return error.status === 401 || error.code === 'AUTHENTICATION_REQUIRED';
  }

  isServerError(error) {
    return error.status >= 500;
  }
}

const apiServiceInstance = new ApiService();
export default apiServiceInstance;