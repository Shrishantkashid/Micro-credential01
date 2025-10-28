const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

// NOTE: This is the PRODUCTION implementation used in Vercel serverless deployment.
// For local development with Express, see controllers/authController.js

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

  // Validate environment variables
  const requiredEnvVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? 'https://micro-credential-aggregator.vercel.app'
      : 'http://localhost:3001';
    return res.redirect(`${frontendUrl}/callback?error=auth_failed&error_description=${encodeURIComponent(`Missing environment variables: ${missingVars.join(', ')}`)}`);
  }

  console.log('Starting OAuth callback with code:', code.substring(0, 20) + '...');
  console.log('Environment check - CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('Environment check - CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET (length: ' + process.env.GOOGLE_CLIENT_SECRET.length + ')' : 'MISSING');
  console.log('Environment check - REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

  try {
    console.log('Step 1: Creating OAuth2 client...');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    console.log('Step 1: Success - OAuth2 client created');

    console.log('Step 2: Exchanging code for tokens...');
    let tokens;
    try {
      const result = await oauth2Client.getToken(code);
      tokens = result.tokens;
      console.log('Step 2: Success - Got tokens');
    } catch (tokenError) {
      console.error('Step 2: FAILED - Token exchange error:');
      console.error('- Error message:', tokenError.message);
      console.error('- Error code:', tokenError.code);
      console.error('- Error response:', tokenError.response?.data);
      throw new Error(`Google token exchange failed: ${tokenError.message}. This usually means: 1) Invalid client credentials, 2) Authorization code expired/already used, or 3) Redirect URI mismatch.`);
    }
    oauth2Client.setCredentials(tokens);

    // Get user info
    console.log('Step 3: Fetching user info from Google...');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    console.log('Step 3: Success - Got user info:', userInfo.email);

    // Initialize Supabase
    console.log('Step 4: Connecting to Supabase...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Store user and tokens in Supabase
    console.log('Step 5: Upserting user to database...');
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

    if (userError) {
      console.error('Step 5: Failed - User upsert error:', userError);
      throw userError;
    }
    console.log('Step 5: Success - User upserted with ID:', user.id);

    console.log('Step 6: Upserting tokens to database...');
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expiry_date).toISOString(),
        updated_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('Step 6: Failed - Token upsert error:', tokenError);
      throw tokenError;
    }
    console.log('Step 6: Success - Tokens upserted');

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
    console.log('Step 7: Success - Redirecting to frontend with user data');
    res.redirect(`${frontendUrl}/callback?user=${encodedUser}`);
  } catch (error) {
    console.error('========== AUTH CALLBACK ERROR ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('=========================================');

    const frontendUrl = process.env.NODE_ENV === 'production'
      ? 'https://micro-credential-aggregator.vercel.app'
      : 'http://localhost:3001';

    // Create more detailed error message
    let errorMessage = error.message || 'Unknown error';
    if (error.code) {
      errorMessage = `${errorMessage} (Code: ${error.code})`;
    }

    res.redirect(`${frontendUrl}/callback?error=auth_failed&error_description=${encodeURIComponent(errorMessage)}`);
  }
};