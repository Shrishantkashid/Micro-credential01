# Vercel Deployment Guide

## Overview
This application is now configured for deployment on Vercel with the following architecture:
- Frontend: React app served as static files
- Backend: Serverless functions in `/api` directory
- Database: Supabase

## Environment Variables Required

Set these environment variables in your Vercel dashboard (Settings > Environment Variables):

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=534088955363-bc2glsqoqm3rmliik13esec9teuq2m9m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://your-vercel-app.vercel.app/api/auth/callback

# Supabase Configuration
SUPABASE_URL=https://knkkvwqsaygqwkzjrmkh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua2t2d3FzYXlncXdrempybWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzgzNTQsImV4cCI6MjA3NTM1NDM1NH0.A4o8BHyuXyZ-EzPbRaDxOpC4cbXCF7yefMJLxK-JJmU

# Gemini AI (Optional)
GEMINI_API_KEY=AIzaSyCxKu6lDO7kFgT-PSMKwW7bsxT_mpT8LDI

# Environment
NODE_ENV=production
```

## Deployment Steps

### 1. Update Google OAuth Settings
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Navigate to APIs & Services > Credentials
- Edit your OAuth 2.0 client
- Add your Vercel domain to authorized redirect URIs:
  - `https://your-vercel-app.vercel.app/api/auth/callback`

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Set environment variables
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
# ... repeat for all environment variables

# Redeploy with environment variables
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Connect your GitHub repository to Vercel
2. Set the environment variables in the dashboard
3. Deploy automatically on push

### 3. Update Frontend Environment Variables
Create a `.env.production` file in the frontend directory:
```bash
REACT_APP_API_URL=https://your-vercel-app.vercel.app
```

## File Structure Changes

### New API Structure
```
/api
├── auth/
│   ├── login.js
│   └── callback.js
├── gmail/
│   └── sync.js
└── health.js
```

### Configuration Files
- `vercel.json` - Updated for serverless functions
- `frontend/package.json` - Updated build configuration
- `server.js` - Fixed for development use

## API Endpoints

### Production URLs
- Health Check: `https://your-app.vercel.app/api/health`
- Auth Login: `https://your-app.vercel.app/api/auth/login`
- Auth Callback: `https://your-app.vercel.app/api/auth/callback`
- Gmail Sync: `https://your-app.vercel.app/api/gmail/sync`

## Troubleshooting

### Common Issues

1. **"Initializing Application" Stuck**
   - Check environment variables are set correctly
   - Verify API functions are deployed
   - Check Vercel function logs

2. **OAuth Redirect Mismatch**
   - Update Google OAuth settings with correct Vercel URL
   - Ensure GOOGLE_REDIRECT_URI matches exactly

3. **Build Failures**
   - Check frontend dependencies
   - Verify all required files are committed

4. **Function Timeouts**
   - Serverless functions have 10s timeout on free plan
   - Consider upgrading for longer operations

### Debugging
- Check Vercel function logs in dashboard
- Use `vercel logs` command for real-time logs
- Test API endpoints individually

## Development vs Production

### Development
```bash
npm run dev  # Starts server.js on localhost:3000
npm run frontend:dev  # Starts React on localhost:3001
```

### Production
- Frontend served as static files from Vercel CDN
- Backend runs as serverless functions
- Database on Supabase cloud

## Security Notes
- Environment variables are encrypted in Vercel
- API functions have CORS configured
- Tokens stored securely in Supabase

## Performance Optimization
- Frontend is pre-built and cached by CDN
- Serverless functions are stateless and scalable
- Database connection pooling handled by Supabase