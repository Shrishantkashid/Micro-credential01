# Fixes Applied - OAuth Flow & API Endpoints

## Date: 2025-10-09

## Issues Identified from Logs

1. **Favicon 404 errors** - Browser requesting `/favicon.ico` but file didn't exist
2. **OAuth flow behavior** - `/api/auth/login` returned JSON instead of redirecting browser to Google
3. **API endpoint mismatches** - Frontend calling wrong paths for health check and Gmail endpoints
4. **Deprecation warning** - `util._extend` warning from Node.js dependency (non-critical)

## Changes Made

### 1. Frontend API Service (`frontend/src/services/apiService.js`)
- ✅ Fixed constructor closing brace (syntax error)
- ✅ Fixed response interceptor to properly reject errors
- ✅ Changed health check endpoint: `/api/health` → `/health`
- ✅ Updated Gmail endpoints to include `/api` prefix:
  - `/gmail/certificates` → `/api/gmail/certificates`
  - `/gmail/test` → `/api/gmail/test`
  - `/gmail/stats` → `/api/gmail/stats`

### 2. Auth Controller (`controllers/authController.js`)
- ✅ Updated `login()` method to detect browser vs API requests
- ✅ Browser requests (no JSON Accept header) now redirect directly to Google OAuth
- ✅ API requests still receive JSON response with `authUrl`
- This fixes the OAuth flow so users are automatically redirected to Google

### 3. Server Configuration (`server.js`)
- ✅ Added `/favicon.ico` handler that returns 204 (No Content)
- ✅ Prevents 404 spam in development logs
- ✅ Restored complete middleware configuration

### 4. Favicon (`frontend/public/`)
- ✅ Created `favicon.svg` with certificate icon design
- ✅ Updated `index.html` to use SVG favicon with ICO fallback
- Modern browsers will use SVG, older browsers fall back gracefully

## OAuth Flow (Now Fixed)

### Before:
1. User clicks "Login with Google"
2. Frontend calls `/api/auth/login`
3. Backend returns JSON with `authUrl`
4. Frontend must manually redirect (extra step)

### After:
1. User clicks "Login with Google"
2. Browser navigates to `/api/auth/login`
3. Backend detects browser request and redirects to Google
4. User authorizes
5. Google redirects to `/api/auth/callback`
6. Backend redirects to `/dashboard?user=...`
7. Frontend extracts user info and stores in localStorage

## Testing Checklist

- [ ] Restart backend server: `npm run dev`
- [ ] Restart frontend: `npm run frontend:dev`
- [ ] Visit `http://localhost:3001`
- [ ] Click "Login with Google" - should redirect to Google (not show JSON)
- [ ] Complete OAuth consent
- [ ] Should redirect back to dashboard with user info
- [ ] Check browser console - no favicon 404 errors
- [ ] Verify health check works (if used in app)

## Known Issues (Non-Critical)

### Deprecation Warning
```
[DEP0060] DeprecationWarning: The `util._extend` API is deprecated
```
- **Source**: Transitive dependency (not our code)
- **Impact**: None - just a warning
- **Fix**: Update dependencies when convenient
- **Command**: `npm update` or check specific packages with `npm ls util`

### Secrets in Source Control
- `config/env.production.json` contains real API keys
- **Recommendation**: Delete this file and use environment variables only
- In production, `server.js` already reads from `process.env`
- Add to `.gitignore`: `config/env.*.json`

### OAuth Redirect URI
- Current: `https://micro-credential-aggregator.vercel.app/auth/callback`
- Recommended: `https://micro-credential-aggregator.vercel.app/api/auth/callback`
- Update in Google Cloud Console when ready
- Then remove temporary `/auth` route mount in `server.js`

## API Endpoints Reference

### Backend (Port 3000)
- `GET /health` - Health check
- `GET /api/auth/login` - Initiate OAuth (redirects browser)
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/status?email=...` - Check auth status
- `POST /api/auth/logout` - Clear tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/gmail/sync` - Sync certificates from Gmail
- `GET /api/gmail/certificates?email=...` - Get user certificates
- `GET /api/gmail/test?email=...` - Test Gmail connection
- `GET /api/gmail/stats?email=...` - Get certificate stats

### Frontend (Port 3001)
- Development server proxies API calls to port 3000
- All API calls go through `apiService.js` with proper error handling

## File Changes Summary

```
Modified:
- frontend/src/services/apiService.js (syntax fix + endpoint corrections)
- controllers/authController.js (browser redirect logic)
- server.js (favicon handler + middleware restoration)
- frontend/public/index.html (SVG favicon reference)

Created:
- frontend/public/favicon.svg (new certificate icon)
- FIXES_APPLIED.md (this file)
```

## Next Steps

1. **Test the OAuth flow** - Verify login works end-to-end
2. **Remove secrets from git** - Delete `config/env.production.json` after moving to env vars
3. **Update Google OAuth settings** - Change redirect URI to `/api/auth/callback`
4. **Update dependencies** - Run `npm update` to fix deprecation warning
5. **Add favicon.ico** - Optional: Create actual ICO file for older browser support

## Support

If issues persist:
1. Check browser console for errors
2. Check backend logs for stack traces
3. Verify environment variables are set correctly
4. Ensure ports 3000 and 3001 are not blocked
5. Clear browser cache and localStorage if needed
