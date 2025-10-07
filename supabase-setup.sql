-- Supabase SQL setup script
-- Run this in your Supabase SQL editor to create the required tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  google_access_token TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create certificates table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_platform ON certificates(platform);
CREATE INDEX IF NOT EXISTS idx_certificates_issue_date ON certificates(issue_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_message_id ON certificates(message_id);

-- Create a view for certificate summaries
CREATE OR REPLACE VIEW certificate_summary AS
SELECT 
  u.email,
  c.platform,
  COUNT(*) as certificate_count,
  MAX(c.issue_date) as latest_certificate,
  STRING_AGG(DISTINCT c.skills, ', ') as all_skills
FROM users u
LEFT JOIN certificates c ON u.id = c.user_id
GROUP BY u.email, c.platform;

-- Insert some sample data (optional - remove in production)
-- INSERT INTO users (email) VALUES ('test@example.com');

-- Grant necessary permissions (adjust as needed)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment and modify as needed)
-- CREATE POLICY "Users can only see their own data" ON users
--   FOR ALL USING (auth.email() = email);

-- CREATE POLICY "Users can only see their own certificates" ON certificates
--   FOR ALL USING (EXISTS (
--     SELECT 1 FROM users WHERE users.id = certificates.user_id AND users.email = auth.email()
--   ));