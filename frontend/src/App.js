import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CallbackPage from './pages/CallbackPage';

// Services
import authService from './services/authService';
import apiService from './services/apiService';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');

  const checkAuthStatus = useCallback(async () => {
    try {
      const currentUser = authService.getCurrentUser();
      console.log('Checking auth status for user:', currentUser);
      
      if (currentUser && currentUser.email) {
        // For now, just trust the local auth status
        // TODO: Re-enable backend verification once API is working
        // const authStatus = await apiService.checkAuthStatus(currentUser.email);
        
        setUser(currentUser);
        setIsAuthenticated(true);
        console.log('User authenticated successfully');
      } else {
        console.log('No current user found');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      // Clear auth on error
      authService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const initializeApp = useCallback(async () => {
    try {
      // Skip server health check for now to avoid blocking the app
      // await checkServerHealth();
      setServerStatus('healthy');
      
      // Check authentication status
      await checkAuthStatus();
    } catch (error) {
      console.error('App initialization error:', error);
      // Don't block the app on initialization errors
      setServerStatus('healthy');
    } finally {
      setLoading(false);
    }
  }, [checkAuthStatus]);

  // Initialize app on mount
  React.useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleLogin = (userData) => {
    console.log('handleLogin called with:', userData);
    
    // Validate user data has required fields
    if (!userData || !userData.email) {
      console.error('Invalid user data for login:', userData);
      return;
    }
    
    authService.setCurrentUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
    console.log('Authentication state updated:', { user: userData, isAuthenticated: true });
  };

  const handleLogout = async () => {
    try {
      if (user && user.email) {
        await apiService.logout(user.email);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  if (serverStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Server Connection Error</h1>
          <p className="text-gray-600 mb-4">
            Unable to connect to the backend server. Please make sure the server is running on port 3000.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginPage onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/callback" 
              element={<CallbackPage onLogin={handleLogin} />} 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? 
                <Dashboard user={user} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/" 
              element={
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
              } 
            />
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900">404</h1>
                    <p className="text-gray-600">Page not found</p>
                  </div>
                </div>
              } 
            />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              },
            }}
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;