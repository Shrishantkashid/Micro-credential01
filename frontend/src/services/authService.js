class AuthService {
  constructor() {
    this.USER_KEY = 'micro_credential_user';
    this.AUTH_STATUS_KEY = 'micro_credential_auth';
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Set current user in localStorage
  setCurrentUser(user) {
    try {
      if (user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        localStorage.setItem(this.AUTH_STATUS_KEY, 'authenticated');
      } else {
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.AUTH_STATUS_KEY);
      }
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const user = this.getCurrentUser();
    const authStatus = localStorage.getItem(this.AUTH_STATUS_KEY);
    return !!(user && user.email && authStatus === 'authenticated');
  }

  // Get user email
  getUserEmail() {
    const user = this.getCurrentUser();
    return user ? user.email : null;
  }

  // Clear authentication data
  clearAuth() {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.AUTH_STATUS_KEY);
  }

  // Handle OAuth callback
  handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    return { code, state };
  }

  // Get OAuth URL and redirect
  async initiateOAuth() {
    try {
      // Clear the URL of any existing parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Determine the correct API endpoint based on environment
      const apiBase = process.env.NODE_ENV === 'production' 
        ? '' // In production, use relative path which will be handled by Vercel rewrites
        : 'http://localhost:3000';
      
      // Redirect to backend OAuth endpoint
      window.location.href = `${apiBase}/api/auth/login`;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      throw error;
    }
  }

  // Extract user info from URL parameters (after OAuth callback)
  extractUserFromCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    
    if (userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        this.setCurrentUser(user);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return user;
      } catch (error) {
        console.error('Error parsing user from callback:', error);
      }
    }
    
    return null;
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate state parameter for CSRF protection
  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Store and retrieve OAuth state
  setOAuthState(state) {
    sessionStorage.setItem('oauth_state', state);
  }

  getOAuthState() {
    return sessionStorage.getItem('oauth_state');
  }

  clearOAuthState() {
    sessionStorage.removeItem('oauth_state');
  }

  // Handle authentication errors
  handleAuthError(error) {
    console.error('Authentication error:', error);
    
    const errorMessages = {
      'ACCESS_DENIED': 'You denied access to Gmail. Please try again and grant permission.',
      'INVALID_REQUEST': 'Invalid authentication request. Please try again.',
      'INVALID_GRANT': 'Authentication session expired. Please login again.',
      'INVALID_CLIENT': 'Application configuration error. Please contact support.',
      'AUTHENTICATION_REQUIRED': 'Please login to continue.',
      'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
      'VERIFICATION_REQUIRED': 'This app is in testing mode. You need to be added as a test user in Google Cloud Console.',
      'UNVERIFIED_APP': 'This Google app has not completed verification. Contact the developer to add you as a test user.'
    };

    return errorMessages[error.code] || error.message || 'Authentication failed. Please try again.';
  }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;