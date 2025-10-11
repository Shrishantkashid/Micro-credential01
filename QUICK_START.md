# Quick Start Guide - After Fixes

## What Was Fixed? ✅

1. **OAuth Login Flow** - Browser now redirects to Google automatically
2. **API Endpoints** - All paths corrected (health, Gmail endpoints)
3. **Favicon 404s** - Added SVG favicon and server handler
4. **Syntax Errors** - Fixed apiService.js constructor closure

## Start the Application

### 1. Start Backend Server
```bash
npm run dev
```
Expected output:
```
🚀 Micro-Credential Aggregator running on port 3000
📋 Health check: http://localhost:3000/health
🔑 Auth endpoint: http://localhost:3000/api/auth/login
📧 Gmail sync: http://localhost:3000/api/gmail/sync
```

### 2. Start Frontend (New Terminal)
```bash
npm run frontend:dev
```
Expected output:
```
webpack compiled successfully
Compiled successfully!

You can now view micro-credential-aggregator in the browser.

  Local:            http://localhost:3001
```

### 3. Test Endpoints (Optional)
```bash
node test-endpoints.js
```

## Test the OAuth Flow

1. **Open Browser**: http://localhost:3001

2. **Click "Login with Google"**
   - Should redirect to Google (not show JSON)
   - You'll see Google's consent screen

3. **Grant Permissions**
   - Email
   - Profile
   - Gmail read access

4. **Redirected to Dashboard**
   - URL: http://localhost:3001/dashboard?user=...
   - User info stored in localStorage
   - Dashboard shows your email/name

5. **Check Console**
   - No favicon 404 errors ✅
   - API calls working ✅

## Verify Fixes

### ✅ No More Favicon 404s
**Before**:
```
[0] ::1 - - [DATE] "GET /favicon.ico HTTP/1.1" 404 74
```

**After**:
```
[0] ::1 - - [DATE] "GET /favicon.ico HTTP/1.1" 204 -
```

### ✅ OAuth Redirects Automatically
**Before**:
```
GET /api/auth/login
Response: { "success": true, "authUrl": "https://accounts.google.com/..." }
```

**After**:
```
GET /api/auth/login
302 Redirect → https://accounts.google.com/o/oauth2/v2/auth?...
```

### ✅ Callback Works
```
GET /api/auth/callback?code=4/0AVGzR1...
302 Redirect → http://localhost:3001/dashboard?user={...}
```

## Files Modified

```
✓ frontend/src/services/apiService.js
  - Fixed constructor syntax
  - Corrected API endpoints

✓ controllers/authController.js
  - Added browser redirect logic

✓ server.js
  - Added favicon handler
  - Restored middleware

✓ frontend/public/index.html
  - Added SVG favicon reference

✓ frontend/public/favicon.svg (NEW)
  - Certificate icon
```

## Common Issues

### Issue: "redirect_uri_mismatch"
**Solution**: Check `config/env.json`:
```json
{
  "GOOGLE_REDIRECT_URI": "http://localhost:3000/api/auth/callback"
}
```

### Issue: "This app isn't verified"
**Solution**: 
- Click "Advanced" → "Go to [app] (unsafe)"
- Or add yourself as test user in Google Cloud Console

### Issue: Frontend can't connect to backend
**Solution**:
- Ensure backend is running on port 3000
- Check CORS settings in server.js
- Verify `REACT_APP_API_URL` in frontend/.env

### Issue: Deprecation warning still shows
**Solution**:
- This is from a dependency, not our code
- Non-critical, can be ignored
- Fix with: `npm update`

## Next Steps

### 1. Security (Important!)
```bash
# Remove secrets from git
git rm config/env.production.json
echo "config/env.*.json" >> .gitignore
git commit -m "Remove secrets from source control"
```

### 2. Update Google OAuth Settings
- Go to: https://console.cloud.google.com/
- Update redirect URI to: `/api/auth/callback`
- Remove temporary `/auth` route from server.js

### 3. Test Full Flow
- [ ] Login works
- [ ] Gmail sync works
- [ ] Certificates display
- [ ] Logout works
- [ ] Token refresh works

### 4. Production Deployment
- Set environment variables in Vercel
- Update `GOOGLE_REDIRECT_URI` to production URL
- Test OAuth flow in production

## Documentation

- **FIXES_APPLIED.md** - Detailed list of all changes
- **OAUTH_FLOW.md** - Complete OAuth flow documentation
- **test-endpoints.js** - Automated endpoint testing
- **DEPLOYMENT.md** - Production deployment guide

## Support

If you encounter issues:

1. **Check Logs**
   - Backend: Terminal running `npm run dev`
   - Frontend: Browser console (F12)

2. **Verify Environment**
   - `config/env.json` exists with correct values
   - Ports 3000 and 3001 are not in use

3. **Clear Cache**
   - Browser: Ctrl+Shift+Delete
   - localStorage: Console → `localStorage.clear()`

4. **Restart Servers**
   ```bash
   # Stop both servers (Ctrl+C)
   # Start backend
   npm run dev
   # Start frontend (new terminal)
   npm run frontend:dev
   ```

## Success Indicators

✅ Backend starts without errors
✅ Frontend compiles successfully
✅ No favicon 404s in logs
✅ Login redirects to Google
✅ Callback redirects to dashboard
✅ User info appears in dashboard
✅ No deprecation warnings (or only util._extend)

---

**Ready to test!** 🚀

Open http://localhost:3001 and click "Login with Google"
