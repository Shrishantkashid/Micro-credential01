# Configuration Setup

## Issue
The OAuth callback is failing with `TypeError: fetch failed` because the backend services cannot load configuration from `config/env.json` (which is gitignored).

## Solution

### Create Local Configuration File

Copy the values from `config/env.production.json` to create `config/env.json`:

```bash
# Windows PowerShell
Copy-Item config\env.production.json config\env.json

# Or manually create config/env.json with these values:
```

```json
{
  "GOOGLE_CLIENT_ID": "534088955363-bc2glsqoqm3rmliik13esec9teuq2m9m.apps.googleusercontent.com",
  "GOOGLE_CLIENT_SECRET": "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",
  "GOOGLE_REDIRECT_URI": "http://localhost:3000/api/auth/callback",
  "SUPABASE_URL": "https://knkkvwqsaygqwkzjrmkh.supabase.co",
  "SUPABASE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua2t2d3FzYXlncXdrempybWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzgzNTQsImV4cCI6MjA3NTM1NDM1NH0.A4o8BHyuXyZ-EzPbRaDxOpC4cbXCF7yefMJLxK-JJmU",
  "GEMINI_API_KEY": "AIzaSyCxKu6lDO7kFgT-PSMKwW7bsxT_mpT8LDI",
  "PORT": "3000",
  "NODE_ENV": "development"
}
```

### Verify Configuration

After creating the file:

1. **Restart backend server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Check for errors**:
   - Should NOT see "configuration loading error"
   - Should see "🚀 Micro-Credential Aggregator running on port 3000"

3. **Test OAuth flow**:
   - Go to http://localhost:3001
   - Click "Login with Google"
   - Complete authentication
   - Should successfully save to Supabase and redirect to dashboard

## What Was Fixed

### Services Updated
All services now use the same configuration loading pattern as `server.js`:

1. **supabaseService.js** - Fixed config loading
2. **gmailService.js** - Fixed config loading  
3. **geminiService.js** - Fixed config loading

### Configuration Loading Pattern
```javascript
let config;
try {
  if (process.env.NODE_ENV === 'production') {
    // Use environment variables in production
    config = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY
    };
  } else {
    // Try to load from file in development
    try {
      config = require('../config/env.json');
    } catch (err) {
      // Fallback to environment variables
      config = {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
      };
    }
  }
} catch (error) {
  console.error('Configuration loading error:', error.message);
  throw error;
}
```

## Security Note

⚠️ **IMPORTANT**: `config/env.json` is gitignored for security. Never commit this file!

- Contains sensitive API keys and secrets
- Each developer should create their own local copy
- Production uses environment variables (not this file)

## Troubleshooting

### Error: "Supabase configuration is missing"
- Make sure `config/env.json` exists
- Verify SUPABASE_URL and SUPABASE_KEY are set

### Error: "Gmail configuration loading error"
- Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

### Error: "fetch failed" during OAuth callback
- Verify Supabase URL is correct and accessible
- Check your internet connection
- Verify Supabase project is active

### OAuth still fails after creating config
1. Stop backend server (Ctrl+C)
2. Verify `config/env.json` exists and has correct values
3. Start backend: `npm run dev`
4. Check logs for "configuration loading error"
5. Try OAuth flow again

## Next Steps

After creating `config/env.json` and restarting:

1. ✅ OAuth login should work completely
2. ✅ User data saved to Supabase
3. ✅ Redirect to dashboard with user info
4. ✅ Ready to sync certificates from Gmail

## Alternative: Use Environment Variables

Instead of creating `config/env.json`, you can set environment variables:

### Windows PowerShell
```powershell
$env:GOOGLE_CLIENT_ID="534088955363-bc2glsqoqm3rmliik13esec9teuq2m9m.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET="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"
$env:GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback"
$env:SUPABASE_URL="https://knkkvwqsaygqwkzjrmkh.supabase.co"
$env:SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
$env:GEMINI_API_KEY="AIzaSyCxKu6lDO7kFgT-PSMKwW7bsxT_mpT8LDI"
npm run dev
```

### Windows CMD
```cmd
set GOOGLE_CLIENT_ID=534088955363-bc2glsqoqm3rmliik13esec9teuq2m9m.apps.googleusercontent.com
set GOOGLE_CLIENT_SECRET=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
set GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
set SUPABASE_URL=https://knkkvwqsaygqwkzjrmkh.supabase.co
set SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
set GEMINI_API_KEY=AIzaSyCxKu6lDO7kFgT-PSMKwW7bsxT_mpT8LDI
npm run dev
```

But creating `config/env.json` is easier for development!
