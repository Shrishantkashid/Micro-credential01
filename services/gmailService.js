const { google } = require('googleapis');
const config = require('../config/env.json');

class GmailService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
    
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Get Google OAuth URL for authentication
   * @returns {string} Authorization URL
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];
    
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from Google
   * @returns {Object} Token information
   */
  async getTokenFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  /**
   * Set credentials for OAuth client
   * @param {Object} tokens - Access and refresh tokens
   */
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Test function to list recent emails with certificate-like subjects
   * @returns {Array} Array of recent emails
   */
  async listRecentEmails() {
    try {
      console.log('Listing recent emails...');
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: 20
      });

      const messages = response.data.messages || [];
      const emailDetails = [];

      for (const message of messages.slice(0, 5)) {
        try {
          const details = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From', 'Date']
          });

          const headers = details.data.payload.headers;
          const subject = this.getHeader(headers, 'Subject');
          const from = this.getHeader(headers, 'From');
          const date = this.getHeader(headers, 'Date');

          emailDetails.push({
            id: message.id,
            subject,
            from,
            date
          });
        } catch (err) {
          console.error(`Error getting details for message ${message.id}:`, err);
        }
      }

      console.log('Recent emails:', emailDetails);
      return emailDetails;
    } catch (error) {
      console.error('Error listing recent emails:', error);
      throw new Error(`Failed to list emails: ${error.message}`);
    }
  }

  /**
   * Search for certificate emails from specific providers
   * @returns {Array} Array of message IDs
   */
  async searchCertificateEmails() {
    try {
      // Search query for certificate emails from known providers
      const query = [
        'from:(no-reply@coursera.org OR noreply@coursera.org)',
        'OR from:(no-reply@infosysspringboard.com OR noreply@infosysspringboard.com)',
        'OR from:(certificates@edx.org OR noreply@edx.org)',
        'OR from:(support@udacity.com OR no-reply@udacity.com)',
        'OR from:(noreply@udemy.com)',
        'OR from:(linkedin-learning@linkedin.com)',
        'subject:(certificate OR completion OR achievement OR credential)'
      ].join(' ');

      console.log('Gmail search query:', query);

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50
      });

      console.log('Gmail API response:', {
        total: response.data.messages?.length || 0,
        messages: response.data.messages
      });

      // Try a broader search if no results
      if (!response.data.messages || response.data.messages.length === 0) {
        console.log('No messages found with specific query, trying broader search...');
        
        const broadQuery = 'subject:(certificate OR completion OR achievement OR credential)';
        console.log('Broad search query:', broadQuery);
        
        const broadResponse = await this.gmail.users.messages.list({
          userId: 'me',
          q: broadQuery,
          maxResults: 50
        });
        
        console.log('Broad search results:', {
          total: broadResponse.data.messages?.length || 0,
          messages: broadResponse.data.messages
        });
        
        return broadResponse.data.messages || [];
      }

      return response.data.messages || [];
    } catch (error) {
      console.error('Error searching emails:', error);
      throw new Error(`Failed to search emails: ${error.message}`);
    }
  }

  /**
   * Get email content by message ID
   * @param {string} messageId - Gmail message ID
   * @returns {Object} Email data
   */
  async getEmailContent(messageId) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      const headers = message.payload.headers;
      
      // Extract headers
      const subject = this.getHeader(headers, 'Subject') || 'No Subject';
      const from = this.getHeader(headers, 'From') || 'Unknown Sender';
      const date = this.getHeader(headers, 'Date') || new Date().toISOString();

      // Extract body
      const body = this.extractEmailBody(message.payload);

      return {
        id: messageId,
        subject,
        from,
        date,
        body,
        snippet: message.snippet
      };
    } catch (error) {
      console.error('Error getting email content:', error);
      throw new Error(`Failed to get email content: ${error.message}`);
    }
  }

  /**
   * Extract email body from payload
   * @param {Object} payload - Email payload
   * @returns {string} Email body text
   */
  extractEmailBody(payload) {
    let body = '';

    if (payload.parts) {
      // Multi-part email
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body.data) {
            body += Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
        } else if (part.parts) {
          // Nested parts
          body += this.extractEmailBody(part);
        }
      }
    } else if (payload.body.data) {
      // Single part email
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    return body;
  }

  /**
   * Get header value by name
   * @param {Array} headers - Email headers
   * @param {string} name - Header name
   * @returns {string} Header value
   */
  getHeader(headers, name) {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : null;
  }

  /**
   * Parse certificate details from email content
   * @param {Object} emailData - Email data
   * @returns {Object} Parsed certificate information
   */
  parseCertificateDetails(emailData) {
    const { subject, from, body, date } = emailData;
    
    // Determine platform
    let platform = 'Unknown';
    if (from.includes('coursera')) platform = 'Coursera';
    else if (from.includes('infosysspringboard')) platform = 'Infosys Springboard';
    else if (from.includes('edx')) platform = 'edX';
    else if (from.includes('udacity')) platform = 'Udacity';
    else if (from.includes('udemy')) platform = 'Udemy';
    else if (from.includes('linkedin')) platform = 'LinkedIn Learning';

    // Extract course name from subject or body
    let courseName = subject;
    
    // Clean up common patterns in subjects
    courseName = courseName
      .replace(/^(re:|fwd?:)/i, '')
      .replace(/certificate/i, '')
      .replace(/completion/i, '')
      .replace(/congratulations/i, '')
      .replace(/^\s*[-:]\s*/, '')
      .trim();

    // Try to extract more specific course name from body
    const coursePatterns = [
      /course[:\s]+([^.\n\r]{10,100})/i,
      /completed[:\s]+([^.\n\r]{10,100})/i,
      /certification[:\s]+([^.\n\r]{10,100})/i,
      /"([^"]{10,100})"/g
    ];

    for (const pattern of coursePatterns) {
      const match = body.match(pattern);
      if (match && match[1] && match[1].trim().length > courseName.length) {
        courseName = match[1].trim();
        break;
      }
    }

    // Extract download links
    const linkPatterns = [
      /https?:\/\/[^\s<>"']+certificate[^\s<>"']*/gi,
      /https?:\/\/[^\s<>"']+credential[^\s<>"']*/gi,
      /https?:\/\/[^\s<>"']+download[^\s<>"']*/gi
    ];

    let downloadLink = null;
    for (const pattern of linkPatterns) {
      const matches = body.match(pattern);
      if (matches && matches.length > 0) {
        downloadLink = matches[0];
        break;
      }
    }

    // Parse issue date
    let issueDate = null;
    try {
      issueDate = new Date(date).toISOString().split('T')[0];
    } catch (error) {
      issueDate = new Date().toISOString().split('T')[0];
    }

    return {
      platform,
      course_name: courseName,
      issue_date: issueDate,
      download_link: downloadLink,
      email_subject: subject
    };
  }

  /**
   * Refresh access token using refresh token
   * @returns {Object} New tokens
   */
  async refreshAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Check if current tokens are valid
   * @returns {boolean} Whether tokens are valid
   */
  async isTokenValid() {
    try {
      await this.gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch (error) {
      if (error.code === 401) {
        return false;
      }
      throw error;
    }
    return {
      platform,
      course_name: courseName,
      issue_date: issueDate,
      download_link: downloadLink,
      email_subject: subject
    };
  }

  /**
   * Refresh access token using refresh token
   * @returns {Object} New tokens
   */
  async refreshAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Check if current tokens are valid
   * @returns {boolean} Whether tokens are valid
   */
  async isTokenValid() {
    try {
      await this.gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch (error) {
      if (error.code === 401) {
        return false;
      }
      throw error;
    }
  }
}

module.exports = new GmailService();