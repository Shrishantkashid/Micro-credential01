import React, { useState } from 'react';
import { Mail, Shield, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Get authentication URL from backend
      const response = await apiService.getAuthUrl();
      
      if (response.success && response.authUrl) {
        // Redirect to Google OAuth
        window.location.href = response.authUrl;
      } else {
        throw new Error('Failed to get authentication URL');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to initiate login');
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      title: "Gmail Integration",
      description: "Automatically scan your Gmail for certificate emails from major learning platforms"
    },
    {
      icon: <Sparkles className="w-6 h-6 text-purple-600" />,
      title: "AI Skills Analysis",
      description: "Extract and summarize skills learned using advanced AI technology"
    },
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: "Secure & Private",
      description: "Read-only Gmail access with secure OAuth 2.0 authentication"
    }
  ];

  const supportedPlatforms = [
    { name: "Coursera", color: "bg-blue-100 text-blue-800" },
    { name: "edX", color: "bg-purple-100 text-purple-800" },
    { name: "Udemy", color: "bg-orange-100 text-orange-800" },
    { name: "Infosys Springboard", color: "bg-green-100 text-green-800" },
    { name: "Udacity", color: "bg-teal-100 text-teal-800" },
    { name: "LinkedIn Learning", color: "bg-indigo-100 text-indigo-800" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Micro-Credential
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Aggregator
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automatically discover and organize your certificates from Gmail with AI-powered insights
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Login */}
          <div className="order-2 lg:order-1">
            <div className="card max-w-md mx-auto lg:mx-0">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Get Started</h2>
                <p className="text-gray-600">Connect your Gmail to discover your certificates</p>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="mt-6 text-center">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This app is in testing mode. If you see "app not verified", 
                    contact the developer to add you as a test user.
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  We only request read-only access to your Gmail
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Features */}
          <div className="order-1 lg:order-2">
            <div className="space-y-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Why use Credential Aggregator?
              </h3>
              
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supported Platforms */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Supported Platforms</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {supportedPlatforms.map((platform, index) => (
              <span
                key={index}
                className={`badge ${platform.color}`}
              >
                {platform.name}
              </span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold text-gray-900 text-center mb-8">How it works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Connect Gmail</h4>
              <p className="text-gray-600">Securely connect your Gmail account with read-only access</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Auto Scan</h4>
              <p className="text-gray-600">Automatically discover certificate emails from learning platforms</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">View Dashboard</h4>
              <p className="text-gray-600">See all your certificates organized with AI-extracted skills</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;