import React from 'react';
import { RefreshCw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const SyncButton = ({ onSync, syncing, className = '' }) => {
  return (
    <button
      onClick={onSync}
      disabled={syncing}
      className={`btn-primary flex items-center space-x-2 ${className} ${
        syncing ? 'opacity-75 cursor-not-allowed' : ''
      }`}
    >
      {syncing ? (
        <>
          <LoadingSpinner size="small" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          <span>Sync Now</span>
        </>
      )}
    </button>
  );
};

export default SyncButton;