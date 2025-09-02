import React, { useState, useEffect } from 'react';
import { FaBug, FaWifi, FaServer, FaKey, FaExclamationTriangle } from 'react-icons/fa';
import { API_URL } from '../../config/api';

const NetworkDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development and when there are errors
    if (import.meta.env.DEV) {
      setIsVisible(false); // Hide by default now that issues are fixed
    }
  }, []);

  useEffect(() => {
    const gatherDebugInfo = async () => {
             const info = {
         timestamp: new Date().toISOString(),
         userAgent: navigator.userAgent,
         online: navigator.onLine,
         apiUrl: API_URL,
         token: localStorage.getItem('token') ? 'Token exists' : 'No token',
         user: localStorage.getItem('user') ? 'User data exists' : 'No user data',
         userType: localStorage.getItem('userType') || 'Not set',
         userRole: (() => {
           try {
             const user = JSON.parse(localStorage.getItem('user') || '{}');
             return user.role || 'Not set';
           } catch {
             return 'Error parsing user';
           }
         })(),
         connection: navigator.connection ? {
           effectiveType: navigator.connection.effectiveType,
           downlink: navigator.connection.downlink,
           rtt: navigator.connection.rtt
         } : 'Not available'
       };

      // Test API connectivity
      try {
        const response = await fetch(`${API_URL}/health`, { 
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        info.apiStatus = response.status;
        info.apiOk = response.ok;
      } catch (error) {
        info.apiStatus = 'Error';
        info.apiError = error.message;
      }

      setDebugInfo(info);
    };

    if (isVisible) {
      gatherDebugInfo();
      const interval = setInterval(gatherDebugInfo, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsVisible(true)}
        className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-white hover:bg-slate-700 transition-colors"
        title="Show Network Debug"
      >
        <FaBug className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-600 rounded-lg p-4 max-w-sm text-xs text-white z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold flex items-center gap-2">
          <FaBug className="w-4 h-4" />
          Network Debug
        </h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FaWifi className={`w-3 h-3 ${debugInfo.online ? 'text-green-400' : 'text-red-400'}`} />
          <span>Online: {debugInfo.online ? 'Yes' : 'No'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <FaServer className={`w-3 h-3 ${debugInfo.apiOk ? 'text-green-400' : 'text-red-400'}`} />
          <span>API: {debugInfo.apiStatus || 'Unknown'}</span>
        </div>
        
                 <div className="flex items-center gap-2">
           <FaKey className="w-3 h-3 text-blue-400" />
           <span>Token: {debugInfo.token}</span>
         </div>
         
         <div className="flex items-center gap-2">
           <FaKey className="w-3 h-3 text-purple-400" />
           <span>Role: {debugInfo.userRole}</span>
         </div>
        
        {debugInfo.apiError && (
          <div className="flex items-center gap-2 text-red-400">
            <FaExclamationTriangle className="w-3 h-3" />
            <span>{debugInfo.apiError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkDebugger;
