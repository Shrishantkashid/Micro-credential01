const axios = require('axios');
const config = require('../config/env.json');

class GeminiService {
  constructor() {
    this.apiKey = config.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  /**
   * Summarize email content to extract skills and course information
   * @param {string} emailBody - Email body content
   * @param {string} subject - Email subject
   * @returns {string} Summarized skills
   */
  async summarizeSkills(emailBody, subject = '') {
    try {
      const prompt = this.createSkillsPrompt(emailBody, subject);
      
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 200,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const generatedText = response.data.candidates[0].content.parts[0].text;
        return this.cleanSkillsResponse(generatedText);
      }

      return 'Skills not available';
    } catch (error) {
      console.error('Error with Gemini API:', error.response?.data || error.message);
      
      // Fallback to basic keyword extraction
      return this.extractSkillsBasic(emailBody, subject);
    }
  }

  /**
   * Create a specific prompt for skills extraction
   * @param {string} emailBody - Email content
   * @param {string} subject - Email subject
   * @returns {string} Formatted prompt
   */
  createSkillsPrompt(emailBody, subject) {
    return `You are analyzing a certificate completion email. Extract ONLY the key technical skills, technologies, or competencies learned from this course.

Email Subject: ${subject}
Email Content: ${emailBody}

Instructions:
1. Focus on technical skills, programming languages, frameworks, tools, or methodologies
2. Return a concise comma-separated list (maximum 8 items)
3. Use proper capitalization (e.g., "Python", "Machine Learning", "React.js")
4. Avoid generic terms like "problem solving" or "teamwork"
5. If it's a business/soft skills course, extract the main business competencies
6. If no clear skills are found, return "General Knowledge"

Format your response as: Skill1, Skill2, Skill3, etc.

Skills learned:`;
  }

  /**
   * Clean and format the Gemini API response
   * @param {string} response - Raw response from Gemini
   * @returns {string} Cleaned skills list
   */
  cleanSkillsResponse(response) {
    // Remove common prefixes and clean the response
    let cleaned = response
      .replace(/^(Skills learned:|Skills:|The skills learned are:|Here are the skills:)/i, '')
      .replace(/^\s*[-•*]\s*/gm, '') // Remove bullet points
      .replace(/\n/g, ', ') // Replace newlines with commas
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Split by common delimiters and clean each skill
    const skills = cleaned
      .split(/[,;•\n]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0 && skill.length < 50)
      .slice(0, 8); // Limit to 8 skills

    return skills.length > 0 ? skills.join(', ') : 'General Knowledge';
  }

  /**
   * Basic skill extraction as fallback when Gemini API is not available
   * @param {string} emailBody - Email content
   * @param {string} subject - Email subject
   * @returns {string} Extracted skills
   */
  extractSkillsBasic(emailBody, subject) {
    const text = `${subject} ${emailBody}`.toLowerCase();
    
    // Common skill keywords
    const skillKeywords = {
      'Python': ['python', 'django', 'flask', 'pandas', 'numpy'],
      'JavaScript': ['javascript', 'js', 'node.js', 'react', 'vue', 'angular'],
      'Data Science': ['data science', 'data analysis', 'statistics', 'analytics'],
      'Machine Learning': ['machine learning', 'ml', 'artificial intelligence', 'ai', 'deep learning'],
      'Web Development': ['web development', 'html', 'css', 'frontend', 'backend'],
      'Cloud Computing': ['aws', 'azure', 'google cloud', 'cloud', 'docker', 'kubernetes'],
      'Database': ['sql', 'mysql', 'postgresql', 'mongodb', 'database'],
      'Project Management': ['project management', 'agile', 'scrum', 'pmp'],
      'Digital Marketing': ['digital marketing', 'seo', 'sem', 'social media'],
      'Business Analysis': ['business analysis', 'requirements', 'process improvement'],
      'Cybersecurity': ['cybersecurity', 'security', 'penetration testing', 'ethical hacking'],
      'Mobile Development': ['mobile development', 'android', 'ios', 'react native', 'flutter']
    };

    const foundSkills = [];
    
    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        foundSkills.push(skill);
      }
    }

    // Extract course-specific terms
    const coursePatterns = [
      /\b(certification|certificate)\s+in\s+([^,.]+)/i,
      /\b(specialization|course)\s+in\s+([^,.]+)/i,
      /\b(fundamentals?|basics?|introduction)\s+(?:to|of)\s+([^,.]+)/i
    ];

    for (const pattern of coursePatterns) {
      const match = text.match(pattern);
      if (match && match[2]) {
        const courseTopic = match[2].trim()
          .replace(/\b(course|certification|certificate|specialization)\b/gi, '')
          .trim();
        if (courseTopic.length > 2 && courseTopic.length < 30) {
          foundSkills.push(this.capitalizeWords(courseTopic));
        }
      }
    }

    return foundSkills.length > 0 ? foundSkills.slice(0, 5).join(', ') : 'General Knowledge';
  }

  /**
   * Capitalize words properly
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  capitalizeWords(str) {
    return str.replace(/\b\w+/g, word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }

  /**
   * Enhanced course name extraction using Gemini
   * @param {string} emailBody - Email content
   * @param {string} subject - Email subject
   * @returns {string} Extracted course name
   */
  async extractCourseName(emailBody, subject) {
    try {
      const prompt = `Extract the exact course or certification name from this email.

Email Subject: ${subject}
Email Content: ${emailBody}

Instructions:
1. Return ONLY the course name, nothing else
2. Remove generic words like "Certificate", "Completion", "Congratulations"
3. Keep the specific course title as mentioned in the email
4. If multiple courses mentioned, pick the main one
5. Maximum 100 characters

Course name:`;

      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const courseName = response.data.candidates[0].content.parts[0].text.trim();
        return courseName.length > 5 ? courseName : subject;
      }

      return subject;
    } catch (error) {
      console.error('Error extracting course name:', error.message);
      return subject;
    }
  }

  /**
   * Test the Gemini API connection
   * @returns {boolean} Whether API is working
   */
  async testConnection() {
    try {
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: 'Hello, respond with just "OK" if you can hear me.'
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.status === 200 && response.data.candidates;
    } catch (error) {
      console.error('Gemini API test failed:', error.message);
      return false;
    }
  }
}

module.exports = new GeminiService();