import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const CallbackPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  const handleCallback = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      const userParam = urlParams.get('user');
      const codeParam = urlParams.get('code');

      console.log('Callback URL params:', {
        error,
        errorDescription,
        userParam,
        codeParam,
        fullUrl: window.location.href,
        allParams: Object.fromEntries(urlParams)
      });

      // If we're getting a code directly (wrong redirect), show helpful error
      if (codeParam && !userParam && !error) {
        throw new Error('Configuration error: Google is redirecting to the wrong URL. The GOOGLE_REDIRECT_URI should be /api/auth/callback, not /callback or /login/auth/callback. Please check Vercel environment variables.');
      }

      if (error) {
        let errorMessage = errorDescription || `OAuth error: ${error}`;

        console.error('OAuth error received:', { error, errorDescription });

        // Handle specific OAuth errors
        if (error === 'access_denied' && errorDescription &&
            errorDescription.includes('has not completed the Google verification process')) {
          errorMessage = 'This app is in testing mode and requires approval. Please contact the developer to be added as a test user, or ask the developer to publish the app.';
        } else if (error === 'access_denied') {
          errorMessage = 'Access was denied. Please try again and grant the necessary permissions.';
        } else if (error === 'auth_failed') {
          errorMessage = `Authentication failed: ${errorDescription || 'Unknown error occurred during authentication'}`;
        }

        throw new Error(errorMessage);
      }

      // Check if user info is in URL (some OAuth flows include this)
      const emailParam = urlParams.get('email');
      
      if (userParam) {
        try {
          // URLSearchParams.get() already decodes the value, no need for decodeURIComponent
          const user = JSON.parse(userParam);
          console.log('Parsed user data:', user);

          if (!user || !user.email) {
            throw new Error('Invalid user data: missing email');
          }

          onLogin(user);
          toast.success('Successfully logged in!');
          navigate('/dashboard');
          return;
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          throw new Error('Failed to process authentication data. Please try again.');
        }
      }

      if (emailParam) {
        // URLSearchParams.get() already decodes the value
        const user = { email: emailParam };
        onLogin(user);
        toast.success('Successfully logged in!');
        navigate('/dashboard');
        return;
      }

      // If no user data in URL, redirect to login
      setStatus('redirecting');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Callback error:', error);
      setStatus('error');
      toast.error(error.message || 'Authentication failed');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [navigate, onLogin]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center">
            <LoadingSpinner size="large" />
            <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-2">
              Completing Authentication...
            </h2>
            <p className="text-gray-600">
              Please wait while we set up your account
            </p>
          </div>
        );

      case 'redirecting':
        return (
          <div className="text-center">
            <div className="text-blue-500 text-6xl mb-4">🔄</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Redirecting...
            </h2>
            <p className="text-gray-600">
              Taking you to the login page
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <div className="text-gray-600 mb-4 max-w-lg">
              <p className="mb-2">
                There was an error during the authentication process.
              </p>
              <div className="text-sm bg-red-50 border border-red-200 rounded p-3 text-left">
                <p className="font-semibold mb-1">Common Solutions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>If you see "app not verified" - contact the developer to add you as a test user</li>
                  <li>Make sure you grant all requested permissions</li>
                  <li>Try using a different Google account</li>
                  <li>Clear your browser cache and try again</li>
                </ul>
              </div>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default CallbackPage;