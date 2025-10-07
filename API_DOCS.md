# Micro-Credential Aggregator - API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication Flow

### 1. Start OAuth Flow
```http
GET /auth/login
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/oauth/authorize?...",
  "message": "Visit the auth URL to authenticate with Google"
}
```

### 2. Handle OAuth Callback
```http
GET /auth/callback?code=AUTH_CODE&state=STATE
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://..."
  },
  "tokens": {
    "access_token": "ya29...",
    "expires_in": 1234567890,
    "token_type": "Bearer"
  }
}
```

## Gmail Operations

### 1. Sync Certificates
```http
POST /gmail/sync
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync completed: 3 new certificates found",
  "summary": {
    "total_emails_found": 5,
    "processed": 5,
    "new_certificates": 3,
    "duplicates": 2,
    "errors": 0
  },
  "results": [
    {
      "messageId": "msg123",
      "status": "success",
      "certificate": {
        "id": "cert-uuid",
        "platform": "Coursera",
        "course_name": "Machine Learning Fundamentals",
        "skills": "Python, Machine Learning, Data Analysis"
      }
    }
  ]
}
```

### 2. Get Certificates
```http
GET /gmail/certificates?email=user@example.com
```

**Response:**
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "total_certificates": 5
  },
  "platform_summary": {
    "Coursera": 3,
    "edX": 1,
    "Udemy": 1
  },
  "certificates": [
    {
      "id": "cert-uuid",
      "platform": "Coursera",
      "course_name": "Machine Learning Fundamentals",
      "skills": "Python, Machine Learning, Data Analysis",
      "issue_date": "2024-01-15",
      "download_link": "https://coursera.org/verify/...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 3. Test Connection
```http
GET /gmail/test?email=user@example.com
```

**Response:**
```json
{
  "success": true,
  "message": "Gmail API connection successful",
  "user_email": "user@example.com",
  "token_status": "valid"
}
```

### 4. Get Statistics
```http
GET /gmail/stats?email=user@example.com
```

**Response:**
```json
{
  "success": true,
  "user_email": "user@example.com",
  "stats": {
    "total_certificates": 5,
    "platforms": {
      "Coursera": 3,
      "edX": 1,
      "Udemy": 1
    },
    "recent_certificates": 2,
    "skills_summary": {
      "Python": 3,
      "Machine Learning": 2,
      "Web Development": 1
    },
    "latest_certificate": {
      "platform": "Coursera",
      "course_name": "Advanced Python",
      "issue_date": "2024-01-20"
    }
  }
}
```

## Error Responses

### Authentication Required (401)
```json
{
  "success": false,
  "error": "AUTHENTICATION_REQUIRED",
  "message": "Please login again to continue"
}
```

### User Not Found (404)
```json
{
  "success": false,
  "error": "USER_NOT_FOUND",
  "message": "User not found - please authenticate first"
}
```

### Gmail API Error (500)
```json
{
  "success": false,
  "error": "SYNC_ERROR",
  "message": "Failed to sync certificates from Gmail",
  "details": "Error message details"
}
```

## Rate Limits

- Gmail API: 1,000,000,000 quota units per day
- Gemini API: 60 requests per minute (free tier)

## Supported Email Patterns

The app searches for emails matching:
```
from:(no-reply@coursera.org OR noreply@coursera.org)
OR from:(no-reply@infosysspringboard.com OR noreply@infosysspringboard.com)
OR from:(certificates@edx.org OR noreply@edx.org)
OR from:(support@udacity.com OR no-reply@udacity.com)
OR from:(noreply@udemy.com)
OR from:(linkedin-learning@linkedin.com)
subject:(certificate OR completion OR achievement OR credential)
```