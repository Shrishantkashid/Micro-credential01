const { google } = require('googleapis');
const config = require('../config/env.json');

class TokenHandler {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Validate if token is still valid
   * @param {string} accessToken - Google access token
   * @returns {Promise<boolean>} Token validity
   */
  async validateToken(accessToken) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      // Test the token by making a simple API call
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.getProfile({ userId: 'me' });
      
      return true;
    } catch (error) {
      if (error.code === 401 || error.message.includes('Invalid Credentials')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Google refresh token
   * @returns {Promise<Object>} New token information
   */
  async refreshToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken,
        expires_in: credentials.expiry_date,
        token_type: 'Bearer'
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Get user info from Google using access token
   * @param {string} accessToken - Google access token
   * @returns {Promise<Object>} User information
   */
  async getUserInfo(accessToken) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();
      
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
        verified_email: data.verified_email
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Extract user email from JWT token (if needed)
   * @param {string} token - JWT token
   * @returns {string|null} User email
   */
  extractEmailFromToken(token) {
    try {
      // Simple JWT decode (not verification, just extraction)
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.email || null;
    } catch (error) {
      console.error('Error extracting email from token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {number} expiryDate - Token expiry timestamp
   * @returns {boolean} Whether token is expired
   */
  isTokenExpired(expiryDate) {
    if (!expiryDate) return true;
    
    const now = Date.now();
    const expiry = new Date(expiryDate).getTime();
    
    // Consider token expired if it expires within 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return (expiry - now) <= bufferTime;
  }

  /**
   * Format token response for consistent structure
   * @param {Object} tokens - Raw tokens from Google
   * @returns {Object} Formatted token response
   */
  formatTokenResponse(tokens) {
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expiry_date,
      token_type: 'Bearer',
      scope: tokens.scope || 'https://www.googleapis.com/auth/gmail.readonly'
    };
  }

  /**
   * Create OAuth2 client with credentials
   * @param {Object} credentials - Token credentials
   * @returns {Object} Configured OAuth2 client
   */
  createAuthenticatedClient(credentials) {
    const client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
    
    client.setCredentials(credentials);
    return client;
  }

  /**
   * Validate and refresh token if needed
   * @param {Object} userTokens - User's current tokens
   * @returns {Promise<Object>} Valid tokens
   */
  async ensureValidToken(userTokens) {
    try {
      // First, check if current access token is valid
      const isValid = await this.validateToken(userTokens.google_access_token);
      
      if (isValid) {
        return {
          access_token: userTokens.google_access_token,
          refresh_token: userTokens.google_refresh_token,
          needs_refresh: false
        };
      }

      // If not valid, try to refresh
      if (userTokens.google_refresh_token) {
        const newTokens = await this.refreshToken(userTokens.google_refresh_token);
        return {
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          needs_refresh: true
        };
      }

      // If no refresh token, user needs to re-authenticate
      throw new Error('Token invalid and no refresh token available');
    } catch (error) {
      console.error('Error ensuring valid token:', error);
      throw new Error('Authentication required');
    }
  }

  /**
   * Generate secure state parameter for OAuth
   * @returns {string} Random state string
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Validate state parameter
   * @param {string} receivedState - State from callback
   * @param {string} expectedState - Expected state value
   * @returns {boolean} Whether state is valid
   */
  validateState(receivedState, expectedState) {
    return receivedState === expectedState;
  }

  /**
   * Handle OAuth errors
   * @param {Object} error - OAuth error object
   * @returns {Object} Formatted error response
   */
  handleOAuthError(error) {
    const errorMappings = {
      'access_denied': {
        message: 'User denied access to Gmail',
        code: 'ACCESS_DENIED',
        status: 403
      },
      'invalid_request': {
        message: 'Invalid OAuth request',
        code: 'INVALID_REQUEST',
        status: 400
      },
      'invalid_grant': {
        message: 'Invalid authorization code or refresh token',
        code: 'INVALID_GRANT',
        status: 401
      },
      'invalid_client': {
        message: 'Invalid client credentials',
        code: 'INVALID_CLIENT',
        status: 401
      }
    };

    const mappedError = errorMappings[error.error] || {
      message: error.error_description || 'OAuth authentication failed',
      code: 'OAUTH_ERROR',
      status: 500
    };

    return {
      error: mappedError.code,
      message: mappedError.message,
      status: mappedError.status,
      details: error
    };
  }
}

module.exports = new TokenHandler();