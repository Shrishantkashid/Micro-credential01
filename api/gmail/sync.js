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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Get user tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tokenError) throw tokenError;

    // Initialize OAuth2 client with tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Search for emails with certificate attachments
    const query = 'has:attachment (certificate OR completion OR "course completed" OR coursera OR udemy OR edx) (pdf OR png OR jpg)';
    
    const { data: messages } = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    });

    if (!messages.messages) {
      return res.status(200).json({ 
        success: true, 
        certificates: [],
        message: 'No certificates found' 
      });
    }

    const certificates = [];
    const processedMessages = messages.messages.slice(0, 10); // Limit for serverless timeout

    for (const message of processedMessages) {
      try {
        const { data: fullMessage } = await gmail.users.messages.get({
          userId: 'me',
          id: message.id
        });

        // Process message and extract certificate info
        // This is a simplified version - you may want to add more processing
        const subject = fullMessage.payload.headers.find(h => h.name === 'Subject')?.value || '';
        const from = fullMessage.payload.headers.find(h => h.name === 'From')?.value || '';
        const date = fullMessage.payload.headers.find(h => h.name === 'Date')?.value || '';

        if (fullMessage.payload.parts) {
          for (const part of fullMessage.payload.parts) {
            if (part.filename && part.filename.match(/\.(pdf|png|jpg|jpeg)$/i)) {
              certificates.push({
                id: message.id,
                subject,
                from,
                date,
                filename: part.filename,
                attachmentId: part.body.attachmentId
              });
            }
          }
        }
      } catch (messageError) {
        console.error(`Error processing message ${message.id}:`, messageError);
        continue;
      }
    }

    // Store certificates in Supabase
    if (certificates.length > 0) {
      const { error: insertError } = await supabase
        .from('certificates')
        .upsert(
          certificates.map(cert => ({
            user_id: userId,
            email_id: cert.id,
            subject: cert.subject,
            sender: cert.from,
            received_date: new Date(cert.date).toISOString(),
            filename: cert.filename,
            attachment_id: cert.attachmentId,
            extracted_data: {},
            created_at: new Date().toISOString()
          })),
          { onConflict: 'email_id' }
        );

      if (insertError) throw insertError;
    }

    res.status(200).json({
      success: true,
      certificates: certificates.length,
      message: `Found ${certificates.length} certificates`
    });

  } catch (error) {
    console.error('Gmail sync error:', error);
    res.status(500).json({ 
      error: 'Failed to sync Gmail data',
      details: error.message 
    });
  }
};