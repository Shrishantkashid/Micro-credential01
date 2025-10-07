const gmailService = require('../services/gmailService');
const geminiService = require('../services/geminiService');
const supabaseService = require('../services/supabaseService');
const tokenHandler = require('../utils/tokenHandler');
const config = require('../config/env.json');

class GmailController {
  /**
   * Sync certificates from Gmail
   * POST /gmail/sync
   */
  async sync(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'EMAIL_REQUIRED',
          message: 'User email is required'
        });
      }

      // Get user from database
      const user = await supabaseService.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found - please authenticate first'
        });
      }

      // Ensure valid tokens
      let validTokens;
      try {
        validTokens = await tokenHandler.ensureValidToken({
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
      } catch (tokenError) {
        return res.status(401).json({
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Please login again to continue',
          details: tokenError.message
        });
      }

      // Set credentials for Gmail service
      gmailService.setCredentials({
        access_token: validTokens.access_token,
        refresh_token: validTokens.refresh_token
      });

      // Search for certificate emails
      console.log('Starting Gmail search for user:', email);
      const messages = await gmailService.searchCertificateEmails();
      console.log('Search completed. Messages found:', messages?.length || 0);

      if (!messages || messages.length === 0) {
        return res.json({
          success: true,
          message: 'No certificate emails found',
          summary: {
            total_emails_found: 0,
            processed: 0,
            new_certificates: 0,
            duplicates: 0,
            errors: 0
          },
          results: []
        });
      }

      let processed = 0;
      let newCertificates = 0;
      let duplicates = 0;
      let errors = 0;
      const results = [];

      // Process each email
      for (const message of messages) {
        try {
          processed++;

          // Check if certificate already exists
          const exists = await supabaseService.certificateExists(message.id);
          if (exists) {
            duplicates++;
            results.push({
              messageId: message.id,
              status: 'duplicate',
              message: 'Certificate already exists'
            });
            continue;
          }

          // Get email content
          const emailData = await gmailService.getEmailContent(message.id);
          
          // Parse certificate details
          const certificateDetails = gmailService.parseCertificateDetails(emailData);

          // Enhance course name with Gemini if available (optional)
          let enhancedCourseName = certificateDetails.course_name;
          try {
            if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
              enhancedCourseName = await geminiService.extractCourseName(
                emailData.body, 
                emailData.subject
              );
              if (enhancedCourseName && enhancedCourseName.length > certificateDetails.course_name.length) {
                certificateDetails.course_name = enhancedCourseName;
              }
            }
          } catch (geminiError) {
            // Silently fall back to parsed name if Gemini fails
            console.log('Gemini course name extraction skipped');
          }

          // Summarize skills with Gemini if available (optional)
          let skills = 'General Knowledge';
          try {
            if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
              skills = await geminiService.summarizeSkills(
                emailData.body, 
                emailData.subject
              );
            } else {
              // Use basic extraction if Gemini is not available
              skills = geminiService.extractSkillsBasic(emailData.body, emailData.subject);
            }
          } catch (geminiError) {
            // Fall back to basic extraction if Gemini fails
            console.log('Gemini skills summarization skipped, using basic extraction');
            try {
              skills = geminiService.extractSkillsBasic(emailData.body, emailData.subject);
            } catch (basicError) {
              skills = 'General Knowledge'; // Ultimate fallback
            }
          }

          // Prepare certificate data
          const certificateData = {
            user_id: user.id,
            platform: certificateDetails.platform,
            course_name: certificateDetails.course_name,
            issue_date: certificateDetails.issue_date,
            download_link: certificateDetails.download_link,
            skills: skills,
            message_id: message.id,
            email_subject: certificateDetails.email_subject
          };

          // Store in database
          const storedCertificate = await supabaseService.storeCertificate(certificateData);

          if (storedCertificate) {
            newCertificates++;
            results.push({
              messageId: message.id,
              status: 'success',
              certificate: {
                id: storedCertificate.id,
                platform: storedCertificate.platform,
                course_name: storedCertificate.course_name,
                skills: storedCertificate.skills
              }
            });
          } else {
            duplicates++;
            results.push({
              messageId: message.id,
              status: 'duplicate',
              message: 'Certificate already exists (detected during insert)'
            });
          }
        } catch (messageError) {
          errors++;
          console.error(`Error processing message ${message.id}:`, messageError);
          results.push({
            messageId: message.id,
            status: 'error',
            error: messageError.message
          });
        }
      }

      res.json({
        success: true,
        message: `Sync completed: ${newCertificates} new certificates found`,
        summary: {
          total_emails_found: messages.length,
          processed,
          new_certificates: newCertificates,
          duplicates,
          errors
        },
        results: results.slice(0, 10) // Limit results for response size
      });
    } catch (error) {
      console.error('Gmail sync error:', error);
      
      // Handle specific error types
      if (error.message.includes('insufficient authentication scopes')) {
        return res.status(401).json({
          success: false,
          error: 'INSUFFICIENT_SCOPE',
          message: 'Please re-authenticate with Gmail access'
        });
      }

      if (error.message.includes('quota exceeded')) {
        return res.status(429).json({
          success: false,
          error: 'QUOTA_EXCEEDED',
          message: 'Gmail API quota exceeded, please try again later'
        });
      }

      res.status(500).json({
        success: false,
        error: 'SYNC_ERROR',
        message: 'Failed to sync certificates from Gmail',
        details: error.message
      });
    }
  }

  /**
   * Get user's certificates
   * GET /gmail/certificates?email=user@example.com
   */
  async getCertificates(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'EMAIL_REQUIRED',
          message: 'User email is required'
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

      // Get certificates
      const certificates = await supabaseService.getUserCertificates(user.id);

      // Group certificates by platform
      const platformSummary = certificates.reduce((acc, cert) => {
        acc[cert.platform] = (acc[cert.platform] || 0) + 1;
        return acc;
      }, {});

      res.json({
        success: true,
        user: {
          email: user.email,
          total_certificates: certificates.length
        },
        platform_summary: platformSummary,
        certificates: certificates.map(cert => ({
          id: cert.id,
          platform: cert.platform,
          course_name: cert.course_name,
          skills: cert.skills,
          issue_date: cert.issue_date,
          download_link: cert.download_link,
          created_at: cert.created_at
        }))
      });
    } catch (error) {
      console.error('Get certificates error:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'Failed to fetch certificates',
        details: error.message
      });
    }
  }

  /**
   * Test Gmail API connection
   * GET /gmail/test?email=user@example.com
   */
  async testConnection(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'EMAIL_REQUIRED',
          message: 'User email is required'
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

      // Ensure valid tokens
      const validTokens = await tokenHandler.ensureValidToken({
        google_access_token: user.google_access_token,
        google_refresh_token: user.google_refresh_token
      });

      // Set credentials
      gmailService.setCredentials({
        access_token: validTokens.access_token,
        refresh_token: validTokens.refresh_token
      });

      // Test connection
      const isValid = await gmailService.isTokenValid();

      if (isValid) {
        res.json({
          success: true,
          message: 'Gmail API connection successful',
          user_email: user.email,
          token_status: 'valid'
        });
              
        // Also test listing recent emails
        try {
          console.log('Testing recent emails access...');
          const recentEmails = await gmailService.listRecentEmails();
          console.log('Recent emails test completed');
        } catch (emailError) {
          console.error('Recent emails test failed:', emailError);
        }
      } else {
        res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Gmail API connection failed - token invalid'
        });
      }
    } catch (error) {
      console.error('Gmail test error:', error);
      res.status(500).json({
        success: false,
        error: 'CONNECTION_TEST_ERROR',
        message: 'Failed to test Gmail connection',
        details: error.message
      });
    }
  }

  /**
   * Get sync statistics
   * GET /gmail/stats?email=user@example.com
   */
  async getStats(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'EMAIL_REQUIRED',
          message: 'User email is required'
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

      // Get certificates
      const certificates = await supabaseService.getUserCertificates(user.id);

      // Calculate statistics
      const stats = {
        total_certificates: certificates.length,
        platforms: {},
        recent_certificates: 0,
        skills_summary: {},
        latest_certificate: null
      };

      certificates.forEach(cert => {
        // Platform stats
        stats.platforms[cert.platform] = (stats.platforms[cert.platform] || 0) + 1;

        // Recent certificates (last 30 days)
        const certDate = new Date(cert.issue_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (certDate >= thirtyDaysAgo) {
          stats.recent_certificates++;
        }

        // Skills summary
        if (cert.skills) {
          const skills = cert.skills.split(',').map(s => s.trim());
          skills.forEach(skill => {
            stats.skills_summary[skill] = (stats.skills_summary[skill] || 0) + 1;
          });
        }

        // Latest certificate
        if (!stats.latest_certificate || cert.issue_date > stats.latest_certificate.issue_date) {
          stats.latest_certificate = {
            platform: cert.platform,
            course_name: cert.course_name,
            issue_date: cert.issue_date
          };
        }
      });

      res.json({
        success: true,
        user_email: user.email,
        stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'STATS_ERROR',
        message: 'Failed to get statistics',
        details: error.message
      });
    }
  }
}

module.exports = new GmailController();