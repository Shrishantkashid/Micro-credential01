const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env.json');

class SupabaseService {
  constructor() {
    this.supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
  }

  /**
   * Create or update user in the database
   * @param {Object} userData - User data from Google OAuth
   * @returns {Object} User record
   */
  async upsertUser(userData) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .upsert({
          email: userData.email,
          google_access_token: userData.access_token,
          google_refresh_token: userData.refresh_token,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw new Error(`Failed to save user: ${error.message}`);
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Object} User record
   */
  async getUserByEmail(email) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Update user tokens
   * @param {string} userId - User ID
   * @param {Object} tokens - Access and refresh tokens
   */
  async updateUserTokens(userId, tokens) {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating tokens:', error);
      throw new Error(`Failed to update tokens: ${error.message}`);
    }
  }

  /**
   * Store certificate in database
   * @param {Object} certificateData - Certificate information
   * @returns {Object} Created certificate record
   */
  async storeCertificate(certificateData) {
    try {
      const { data, error } = await this.supabase
        .from('certificates')
        .insert({
          user_id: certificateData.user_id,
          platform: certificateData.platform,
          course_name: certificateData.course_name,
          issue_date: certificateData.issue_date,
          download_link: certificateData.download_link,
          skills: certificateData.skills,
          message_id: certificateData.message_id,
          email_subject: certificateData.email_subject,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('Certificate already exists:', certificateData.message_id);
        return null;
      }
      console.error('Error storing certificate:', error);
      throw new Error(`Failed to store certificate: ${error.message}`);
    }
  }

  /**
   * Check if certificate exists by message ID
   * @param {string} messageId - Gmail message ID
   * @returns {boolean} Whether certificate exists
   */
  async certificateExists(messageId) {
    try {
      const { data, error } = await this.supabase
        .from('certificates')
        .select('id')
        .eq('message_id', messageId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking certificate existence:', error);
      return false;
    }
  }

  /**
   * Get all certificates for a user
   * @param {string} userId - User ID
   * @returns {Array} Array of certificates
   */
  async getUserCertificates(userId) {
    try {
      const { data, error } = await this.supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting certificates:', error);
      throw new Error(`Failed to get certificates: ${error.message}`);
    }
  }

  /**
   * Initialize database tables (run this once)
   */
  async initializeTables() {
    try {
      // Create users table
      const usersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          google_access_token TEXT,
          google_refresh_token TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `;

      // Create certificates table
      const certificatesTable = `
        CREATE TABLE IF NOT EXISTS certificates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          platform TEXT NOT NULL,
          course_name TEXT NOT NULL,
          issue_date DATE,
          download_link TEXT,
          skills TEXT,
          message_id TEXT UNIQUE NOT NULL,
          email_subject TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;

      // Create indexes for better performance
      const indexes = `
        CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
        CREATE INDEX IF NOT EXISTS idx_certificates_platform ON certificates(platform);
        CREATE INDEX IF NOT EXISTS idx_certificates_issue_date ON certificates(issue_date);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_message_id ON certificates(message_id);
      `;

      console.log('Database tables and indexes created successfully');
      return true;
    } catch (error) {
      console.error('Error initializing tables:', error);
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }
}

module.exports = new SupabaseService();