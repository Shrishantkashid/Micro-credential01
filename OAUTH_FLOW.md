# OAuth Authentication Flow

## Overview
This document explains how the Google OAuth authentication works in the Micro-Credential Aggregator.

## Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (User at   │
│ localhost:  │
│    3001)    │
└──────┬──────┘
       │
       │ 1. User clicks "Login with Google"
       │    window.location.href = 'http://localhost:3000/api/auth/login'
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Backend Server (localhost:3000)                        │
│  Route: GET /api/auth/login                             │
│  Controller: authController.login()                     │
│                                                          │
│  • Generates Google OAuth URL                           │
│  • Detects browser request (no JSON Accept header)      │
│  • Redirects: res.redirect(googleAuthUrl)               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ 2. 302 Redirect to Google
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Google OAuth (accounts.google.com)                     │
│                                                          │
│  • User sees consent screen                             │
│  • Grants permissions:                                  │
│    - Email                                              │
│    - Profile                                            │
│    - Gmail read access                                  │
│  • Google generates authorization code                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ 3. Redirect with code
                       │    ?code=4/0AVGzR1...&scope=...
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Backend Server (localhost:3000)                        │
│  Route: GET /api/auth/callback                          │
│  Controller: authController.callback()                  │
│                                                          │
│  • Receives authorization code                          │
│  • Exchanges code for tokens:                           │
│    - access_token                                       │
│    - refresh_token                                      │
│  • Gets user info from Google                           │
│  • Saves to Supabase:                                   │
│    - email                                              │
│    - access_token (encrypted)                           │
│    - refresh_token (encrypted)                          │
│  • Redirects browser to frontend:                       │
│    http://localhost:3001/dashboard?user={...}           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ 4. 302 Redirect with user data
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend (localhost:3001/dashboard)                    │
│  Component: Dashboard                                   │
│  Service: authService.extractUserFromCallback()         │
│                                                          │
│  • Extracts user from URL params                        │
│  • Stores in localStorage:                              │
│    - micro_credential_user                              │
│    - micro_credential_auth                              │
│  • Cleans URL (removes ?user=...)                       │
│  • Renders dashboard with user info                     │
└─────────────────────────────────────────────────────────┘
```

## Code Flow

### 1. Frontend Initiates Login
**File**: `frontend/src/services/authService.js`
```javascript
async initiateOAuth() {
  const apiBase = process.env.NODE_ENV === 'production' 
    ? '' 
    : 'http://localhost:3000';
  
  // Browser navigates to backend OAuth endpoint
  window.location.href = `${apiBase}/api/auth/login`;
}
```

### 2. Backend Generates OAuth URL and Redirects
**File**: `controllers/authController.js`
```javascript
async login(req, res) {
  const authUrl = gmailService.getAuthUrl();
  
  // Detect if browser (not API call)
  const acceptsJson = req.headers.accept?.includes('application/json');
  
  if (!acceptsJson) {
    // Browser request - redirect to Google
    return res.redirect(authUrl);
  }
  
  // API request - return JSON
  res.json({ success: true, authUrl });
}
```

### 3. Google OAuth Service Generates URL
**File**: `services/gmailService.js`
```javascript
getAuthUrl() {
  return this.oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    prompt: 'consent'
  });
}
```

### 4. Backend Handles Callback
**File**: `controllers/authController.js`
```javascript
async callback(req, res) {
  const { code } = req.query;
  
  // Exchange code for tokens
  const tokens = await gmailService.getTokenFromCode(code);
  
  // Get user info
  const userInfo = await tokenHandler.getUserInfo(tokens.access_token);
  
  // Save to database
  const user = await supabaseService.upsertUser({
    email: userInfo.email,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token
  });
  
  // Redirect to frontend with user data
  const userParam = encodeURIComponent(JSON.stringify({
    id: user.id,
    email: user.email,
    name: userInfo.name,
    picture: userInfo.picture
  }));
  
  res.redirect(`http://localhost:3001/dashboard?user=${userParam}`);
}
```

### 5. Frontend Extracts User Data
**File**: `frontend/src/services/authService.js`
```javascript
extractUserFromCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const userParam = urlParams.get('user');
  
  if (userParam) {
    const user = JSON.parse(decodeURIComponent(userParam));
    this.setCurrentUser(user);
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return user;
  }
  
  return null;
}
```

## Security Considerations

### Tokens Storage
- **Backend**: Tokens stored in Supabase (encrypted at rest)
- **Frontend**: Only user info (email, name, picture) in localStorage
- **Never**: Access tokens are never stored in frontend localStorage

### CSRF Protection
- State parameter can be added to OAuth URL
- Verify state in callback to prevent CSRF attacks

### Token Refresh
- Access tokens expire after ~1 hour
- Backend automatically refreshes using refresh_token
- Frontend calls `/api/auth/refresh` when needed

## Environment Variables Required

### Backend (server.js)
```bash
GOOGLE_CLIENT_ID=534088955363-bc2glsqoqm3rmliik13esec9teuq2m9m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
SUPABASE_URL=https://knkkvwqsaygqwkzjrmkh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3000
```

## Google Cloud Console Setup

### OAuth 2.0 Client Configuration
1. Go to: https://console.cloud.google.com/
2. Navigate to: APIs & Services > Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://your-domain.vercel.app/api/auth/callback`

### Required APIs
Enable these APIs in Google Cloud Console:
- Gmail API
- Google+ API (for user info)

### Test Users (During Development)
If app is not verified, add test users:
1. OAuth consent screen > Test users
2. Add email addresses that can test the app

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Check `GOOGLE_REDIRECT_URI` matches exactly in:
  - Environment variables
  - Google Cloud Console authorized URIs
- Include protocol (http/https) and port

### "This app isn't verified"
- Normal during development
- Add test users in Google Cloud Console
- Or proceed with "Advanced" > "Go to [app name] (unsafe)"

### "Access blocked: Authorization Error"
- Check OAuth consent screen is configured
- Verify required scopes are enabled
- Ensure user is added as test user

### Tokens not refreshing
- Check refresh_token is stored in database
- Verify `access_type: 'offline'` in OAuth URL
- Use `prompt: 'consent'` to force new refresh_token

## Testing the Flow

### Manual Test
```bash
# 1. Start backend
npm run dev

# 2. Start frontend (in another terminal)
npm run frontend:dev

# 3. Open browser
http://localhost:3001

# 4. Click "Login with Google"
# 5. Should redirect to Google
# 6. Grant permissions
# 7. Should redirect back to dashboard
# 8. Check localStorage for user data
```

### Check Logs
```bash
# Backend logs show:
[0] ::1 - - [DATE] "GET /api/auth/login HTTP/1.1" 302
[0] ::1 - - [DATE] "GET /api/auth/callback?code=... HTTP/1.1" 302

# Frontend console shows:
API Request: GET /api/auth/login
# (then browser redirects to Google)
```

## Production Differences

### Environment
- `NODE_ENV=production`
- Frontend served as static files from backend
- All URLs use production domain

### Redirect URIs
- Backend: `https://your-domain.vercel.app/api/auth/callback`
- Frontend: `https://your-domain.vercel.app/dashboard`

### Security
- HTTPS required for OAuth
- Secrets in environment variables (not files)
- CORS configured for production domain
