const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Store user and tokens in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        google_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) throw userError;

    const { error: tokenError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expiry_date).toISOString(),
        updated_at: new Date().toISOString()
      });

    if (tokenError) throw tokenError;

    // Redirect to frontend with success
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? 'https://micro-credential-aggregator.vercel.app'
      : 'http://localhost:3001';

    const userData = {
      id: user.id,
      google_id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    };
    const encodedUser = encodeURIComponent(JSON.stringify(userData));
    res.redirect(`${frontendUrl}/callback?user=${encodedUser}`);
  } catch (error) {
    console.error('Auth callback error:', error);
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://micro-credential-aggregator.vercel.app'
      : 'http://localhost:3001';
    
    res.redirect(`${frontendUrl}?auth=error&message=${encodeURIComponent(error.message)}`);
  }
};