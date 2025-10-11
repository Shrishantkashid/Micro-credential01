import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-6xl mb-4">💥</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              An unexpected error occurred. Please refresh the page to try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh Page
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left text-sm">
                <summary className="cursor-pointer text-gray-500">Error Details</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;