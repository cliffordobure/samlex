import React, { useState, useEffect } from 'react';
import { FaWifi, FaTimes, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import NetworkErrorHandler from '../../utils/networkErrorHandler';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    // Check initial online status
    setIsOnline(NetworkErrorHandler.checkOnlineStatus());

    // Add online/offline listeners
    const handleOnlineStatus = (online) => {
      setIsOnline(online);
      if (online) {
        setShowBanner(true);
        setLastError(null);
        // Hide banner after 3 seconds
        setTimeout(() => setShowBanner(false), 3000);
      } else {
        setShowBanner(true);
        setLastError('You are currently offline. Please check your internet connection.');
      }
    };

    NetworkErrorHandler.addOnlineStatusListener(handleOnlineStatus);

    // Listen for network errors
    const handleNetworkError = (error) => {
      if (NetworkErrorHandler.isNetworkError(error)) {
        setShowBanner(true);
        setLastError(NetworkErrorHandler.getErrorMessage(error));
        // Hide banner after 5 seconds
        setTimeout(() => setShowBanner(false), 5000);
      }
    };

    // Add global error listener
    window.addEventListener('error', handleNetworkError);

    return () => {
      window.removeEventListener('error', handleNetworkError);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${
      isOnline ? 'bg-green-500' : 'bg-red-500'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <FaCheckCircle className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Connection restored</span>
            </>
                     ) : (
             <>
               <FaTimes className="w-5 h-5 text-white" />
               <span className="text-white font-medium">
                 {lastError || 'No internet connection'}
               </span>
             </>
           )}
        </div>
        
        <button
          onClick={() => setShowBanner(false)}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <FaExclamationTriangle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NetworkStatus;
