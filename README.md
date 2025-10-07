# 🎓 Micro-Credential Aggregator

A powerful **full-stack application** that automatically scans Gmail for certificate emails from learning platforms (Coursera, Infosys Springboard, edX, etc.) and aggregates them in a Supabase database with AI-powered skill summarization.

## 🎯 Complete Solution

- **Backend**: Node.js + Express API with Gmail integration
- **Frontend**: Modern React dashboard with responsive design
- **Database**: Supabase PostgreSQL with real-time capabilities
- **AI**: Google Gemini for skills extraction and summarization

## 🎯 Features

- **Automated Certificate Discovery**: Scans Gmail for certificate emails from major learning platforms
- **Smart Parsing**: Extracts course names, platforms, issue dates, and download links
- **AI-Powered Skills Extraction**: Uses Google Gemini AI to summarize skills learned from course content
- **Secure Authentication**: Google OAuth 2.0 with Gmail read-only scope
- **Database Storage**: Supabase PostgreSQL for reliable data persistence
- **Duplicate Prevention**: Avoids storing duplicate certificates using message IDs
- **RESTful API**: Clean API endpoints for integration and frontend development

## 🚀 Quick Start

### Option 1: Full Development Setup (Recommended)

```bash
# Run the automated setup script
.\start-dev.bat

# Or manually:
npm install
npm run frontend:install
npm run dev:all
```

**This will start:**

- Backend API on http://localhost:3000
- React Frontend on http://localhost:3001

### Option 2: Backend Only

```bash
npm install
npm start
```

### Option 3: Production Build

```bash
npm install
npm run build
npm start
```

### Prerequisites

- Node.js 16+ installed
- Supabase account and project
- Google Cloud Platform project with Gmail API enabled
- Gemini API key (free tier available)

### 1. Installation

```bash
# Clone or create the project
cd micro-credential-aggregator

# Install dependencies
npm install
```

### 2. Configuration

Update `config/env.json` with your credentials:

```json
{
  "GOOGLE_CLIENT_ID": "your-google-client-id",
  "GOOGLE_CLIENT_SECRET": "your-google-client-secret",
  "GOOGLE_REDIRECT_URI": "http://localhost:3000/auth/callback",
  "SUPABASE_URL": "your-supabase-project-url",
  "SUPABASE_KEY": "your-supabase-service-role-key",
  "GEMINI_API_KEY": "your-gemini-api-key",
  "PORT": "3000",
  "NODE_ENV": "development"
}
```

### 3. Database Setup

The application will automatically create the necessary tables. You can also manually create them in Supabase:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  google_access_token TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Certificates table
CREATE TABLE certificates (
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

-- Indexes for performance
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_platform ON certificates(platform);
CREATE INDEX idx_certificates_issue_date ON certificates(issue_date);
CREATE UNIQUE INDEX idx_certificates_message_id ON certificates(message_id);
```

### 4. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3000/auth/callback` to authorized redirect URIs

### 5. Gemini API Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `env.json` file

### 6. Start the Application

```bash
npm start
# or for development with auto-reload
npm run dev
```

The server will start on `http://localhost:3000`

## 🖥️ Frontend Dashboard

The React frontend provides a beautiful, modern interface:

### 🎮 Features

- **Modern UI**: Responsive design with Tailwind CSS
- **Real-time Stats**: Certificate counts, platform breakdown, skills analysis
- **Smart Search**: Multi-field search with advanced filtering
- **Certificate Cards**: Beautiful cards with platform-specific styling
- **One-Click Sync**: Easy Gmail synchronization with progress indicators
- **Mobile Friendly**: Works perfectly on all devices

### 🚀 Frontend Quick Start

```bash
# Start frontend development server
cd frontend
npm install
npm start
```

**Frontend runs on**: http://localhost:3001

### 📱 Screenshots

- **Login Page**: Clean OAuth integration with feature highlights
- **Dashboard**: Statistics cards, search/filter, certificate grid
- **Certificate Cards**: Platform colors, skills tags, download links
- **Responsive**: Perfect mobile and tablet experience

See [FRONTEND_README.md](./FRONTEND_README.md) for detailed frontend documentation.

---

## 📚 API Endpoints

### Authentication

| Method | Endpoint         | Description                 |
| ------ | ---------------- | --------------------------- |
| GET    | `/auth/login`    | Get Google OAuth login URL  |
| GET    | `/auth/callback` | Handle OAuth callback       |
| GET    | `/auth/status`   | Check authentication status |
| POST   | `/auth/logout`   | Clear user tokens           |
| POST   | `/auth/refresh`  | Refresh access tokens       |

### Gmail Operations

| Method | Endpoint              | Description                           |
| ------ | --------------------- | ------------------------------------- |
| POST   | `/gmail/sync`         | Scan and sync certificates from Gmail |
| GET    | `/gmail/certificates` | Get user's certificates               |
| GET    | `/gmail/test`         | Test Gmail API connection             |
| GET    | `/gmail/stats`        | Get certificate statistics            |

### Health Check

| Method | Endpoint  | Description           |
| ------ | --------- | --------------------- |
| GET    | `/health` | Service health status |
| GET    | `/`       | API information       |

## 🔄 Usage Flow

### 1. Authentication

```bash
# Get login URL
curl http://localhost:3000/auth/login

# Response includes authUrl - visit it to authenticate
```

### 2. Sync Certificates

```bash
# After authentication, sync certificates
curl -X POST http://localhost:3000/gmail/sync \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### 3. View Results

```bash
# Get all certificates
curl "http://localhost:3000/gmail/certificates?email=user@example.com"

# Get statistics
curl "http://localhost:3000/gmail/stats?email=user@example.com"
```

## 🏗️ Project Structure

```
micro-credential-aggregator/
├── server.js                 # Main Express server
├── package.json              # Dependencies and scripts
├── config/
│   └── env.json              # Configuration file
├── routes/
│   ├── auth.js               # Authentication routes
│   └── gmail.js              # Gmail operation routes
├── controllers/
│   ├── authController.js     # Authentication logic
│   └── gmailController.js    # Gmail operations logic
├── services/
│   ├── supabaseService.js    # Database operations
│   ├── gmailService.js       # Gmail API interactions
│   └── geminiService.js      # AI skill summarization
└── utils/
    └── tokenHandler.js       # Token management utilities
```

## 🎯 Supported Platforms

The application automatically detects certificates from:

- **Coursera** (no-reply@coursera.org)
- **Infosys Springboard** (no-reply@infosysspringboard.com)
- **edX** (certificates@edx.org)
- **Udacity** (support@udacity.com)
- **Udemy** (noreply@udemy.com)
- **LinkedIn Learning** (linkedin-learning@linkedin.com)

## 🧠 AI Skills Extraction

The application uses Google Gemini AI to:

1. **Extract Skills**: Identifies technical skills, programming languages, and frameworks
2. **Course Name Enhancement**: Improves course name extraction from email content
3. **Fallback Processing**: Uses keyword-based extraction when AI is unavailable

Example skills extracted:

- "Python Programming, Data Analysis, Machine Learning"
- "React.js, Node.js, REST APIs, MongoDB"
- "Project Management, Agile Methodology, Scrum"

## 🔒 Security Features

- **OAuth 2.0**: Secure Google authentication
- **Read-Only Access**: Gmail API used with minimal required scope
- **Token Refresh**: Automatic token renewal
- **Input Validation**: Request validation and sanitization
- **Error Handling**: Comprehensive error management

## 🚨 Error Handling

The application handles various error scenarios:

- **Authentication Failures**: Invalid tokens, expired credentials
- **API Limits**: Gmail API quota exceeded
- **Network Issues**: Timeout and connection errors
- **Data Validation**: Invalid email formats, missing required fields

## 🧪 Testing

Test the application with these commands:

```bash
# Test server health
curl http://localhost:3000/health

# Test Gmail connection (after auth)
curl "http://localhost:3000/gmail/test?email=user@example.com"

# Check authentication status
curl "http://localhost:3000/auth/status?email=user@example.com"
```

## 📊 Sample Response

### Sync Response

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

### Certificates Response

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

## 🔮 Future Enhancements

- **Web Dashboard**: React-based frontend for certificate management
- **Export Features**: PDF/CSV export of certificates
- **Email Notifications**: Alerts for new certificates found
- **Skills Analytics**: Trend analysis and skill gap identification
- **Integration APIs**: Webhooks for third-party integrations
- **Mobile App**: React Native mobile application

## 📝 Environment Variables

| Variable               | Description                          | Required |
| ---------------------- | ------------------------------------ | -------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID               | Yes      |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret           | Yes      |
| `GOOGLE_REDIRECT_URI`  | OAuth callback URL                   | Yes      |
| `SUPABASE_URL`         | Supabase project URL                 | Yes      |
| `SUPABASE_KEY`         | Supabase service role key            | Yes      |
| `GEMINI_API_KEY`       | Google Gemini AI API key             | Yes      |
| `PORT`                 | Server port (default: 3000)          | No       |
| `NODE_ENV`             | Environment (development/production) | No       |

## 🆘 Troubleshooting

### Common Issues

1. **"Authentication required"**

   - Solution: User needs to complete OAuth flow via `/auth/login`

2. **"Gmail API quota exceeded"**

   - Solution: Wait for quota reset or upgrade to paid tier

3. **"Certificate already exists"**

   - This is normal - the app prevents duplicates

4. **"Gemini API error"**
   - Check API key validity
   - Verify quota limits
   - App falls back to basic extraction

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in your config.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:

- Check the troubleshooting section
- Review API endpoint documentation
- Ensure all environment variables are properly configured

---

**Built with ❤️ for automating credential management and showcasing continuous learning achievements.** 4. **"Gemini API error"**

- Check API key validity
- Verify quota limits
- App falls back to basic extraction

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in your config.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:

- Check the troubleshooting section
- Review API endpoint documentation
- Ensure all environment variables are properly configured

---

**Built with ❤️ for automating credential management and showcasing continuous learning achievements.**
