const gmailService = require('../services/gmailService');
const supabaseService = require('../services/supabaseService');
const tokenHandler = require('../utils/tokenHandler');

class AuthController {
  /**
   * Initiate Google OAuth login
   * GET /auth/login
   */
  async login(req, res) {
    try {
      const authUrl = gmailService.getAuthUrl();
      // If the client expects HTML (browser navigation), redirect directly to Google
      const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
      if (!acceptsJson) {
        return res.redirect(authUrl);
      }

      // Otherwise return JSON (API usage)
      res.json({
        success: true,
        authUrl,
        message: 'Visit the auth URL to authenticate with Google'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate authentication URL',
        message: error.message
      });
    }
  }

  /**
   * Handle Google OAuth callback
   * GET /auth/callback?code=...&state=...
   */
  async callback(req, res) {
    try {
      const { code, error, error_description } = req.query;

      // Handle OAuth errors
      if (error) {
        const oauthError = tokenHandler.handleOAuthError({
          error,
          error_description
        });
        
        return res.status(oauthError.status).json({
          success: false,
          error: oauthError.code,
          message: oauthError.message
        });
      }

      // Validate authorization code
      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_CODE',
          message: 'Authorization code is required'
        });
      }

      // Exchange code for tokens
      const tokens = await gmailService.getTokenFromCode(code);
      
      if (!tokens.access_token) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TOKENS',
          message: 'Failed to obtain valid tokens'
        });
      }

      // Get user information
      const userInfo = await tokenHandler.getUserInfo(tokens.access_token);
      
      if (!userInfo.email) {
        return res.status(400).json({
          success: false,
          error: 'NO_EMAIL',
          message: 'Unable to retrieve user email'
        });
      }

      // Save or update user in database
      const userData = {
        email: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      };

      const user = await supabaseService.upsertUser(userData);

      // Check if request expects JSON (API call) or should redirect (browser)
      const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
      
      if (acceptsJson) {
        // API response
        res.json({
          success: true,
          message: 'Authentication successful',
          user: {
            id: user.id,
            email: user.email,
            name: userInfo.name,
            picture: userInfo.picture
          },
          tokens: {
            access_token: tokens.access_token,
            expires_in: tokens.expiry_date,
            token_type: 'Bearer'
          }
        });
      } else {
        // Browser redirect to frontend callback page
        const frontendUrl = process.env.NODE_ENV === 'production' 
          ? '/callback' 
          : 'http://localhost:3001/callback';
        
        // Redirect with user info in URL params
        const userParam = encodeURIComponent(JSON.stringify({
          id: user.id,
          email: user.email,
          name: userInfo.name,
          picture: userInfo.picture
        }));
        
        res.redirect(`${frontendUrl}?user=${userParam}`);
      }
    } catch (error) {
      console.error('Callback error:', error);
      
      // Handle specific error types
      if (error.message.includes('invalid_grant')) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_GRANT',
          message: 'Authorization code is invalid or expired'
        });
      }

      res.status(500).json({
        success: false,
        error: 'CALLBACK_ERROR',
        message: 'Failed to complete authentication',
        details: error.message
      });
    }
  }

  /**
   * Check authentication status
   * GET /auth/status
   */
  async status(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'EMAIL_REQUIRED',
          message: 'Email parameter is required'
        });
      }

      // Get user from database
      const user = await supabaseService.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          authenticated: false,
          message: 'User not found'
        });
      }

      // Check if tokens are valid
      try {
        const validTokens = await tokenHandler.ensureValidToken({
          google_access_token: user.google_access_token,
          google_refresh_token: user.google_refresh_token
        });

        // Update tokens if they were refreshed
        if (validTokens.needs_refresh) {
          await supabaseService.updateUserTokens(user.id, {
            access_token: validTokens.access_token,
            refresh_token: validTokens.refresh_token
          });
        }

        res.json({
          success: true,
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          },
          tokens_valid: true
        });
      } catch (tokenError) {
        res.json({
          success: true,
          authenticated: false,
          user: {
            id: user.id,
            email: user.email
          },
          tokens_valid: false,
          message: 'Authentication required - please login again'
        });
      }
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        success: false,
        error: 'STATUS_CHECK_ERROR',
        message: 'Failed to check authentication status',
        details: error.message
      });
    }
  }

  /**
   * Logout user (clear tokens)
   * POST /auth/logout
   */
  async logout(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'EMAIL_REQUIRED',
          message: 'Email is required for logout'
        });
      }

      // Get user from database
      const user = await supabaseService.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      // Clear tokens
      await supabaseService.updateUserTokens(user.id, {
        access_token: null,
        refresh_token: null
      });

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'LOGOUT_ERROR',
        message: 'Failed to logout',
        details: error.message
      });
    }
  }

  /**
   * Refresh user tokens
   * POST /auth/refresh
   */
  async refresh(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'EMAIL_REQUIRED',
          message: 'Email is required for token refresh'
        });
      }

      // Get user from database
      const user = await supabaseService.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      if (!user.google_refresh_token) {
        return res.status(401).json({
          success: false,
          error: 'NO_REFRESH_TOKEN',
          message: 'No refresh token available - please login again'
        });
      }

      // Refresh tokens
      const newTokens = await tokenHandler.refreshToken(user.google_refresh_token);

      // Update tokens in database
      await supabaseService.updateUserTokens(user.id, {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token
      });

      res.json({
        success: true,
        message: 'Tokens refreshed successfully',
        tokens: {
          access_token: newTokens.access_token,
          expires_in: newTokens.expires_in,
          token_type: 'Bearer'
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      
      if (error.message.includes('invalid_grant')) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid - please login again'
        });
      }

      res.status(500).json({
        success: false,
        error: 'REFRESH_ERROR',
        message: 'Failed to refresh tokens',
        details: error.message
      });
    }
  }
}

module.exports = new AuthController();