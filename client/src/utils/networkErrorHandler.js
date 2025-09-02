// Network Error Handler Utility
class NetworkErrorHandler {
  static isNetworkError(error) {
    return (
      error.message?.includes('Network Error') ||
      error.message?.includes('ERR_NETWORK_CHANGED') ||
      error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
      error.message?.includes('ERR_CONNECTION_REFUSED') ||
      error.message?.includes('ERR_CONNECTION_TIMED_OUT') ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ERR_NETWORK_CHANGED'
    );
  }

  static isAuthError(error) {
    return (
      error.response?.status === 401 ||
      error.response?.status === 403 ||
      error.message?.includes('Not authorized') ||
      error.message?.includes('Unauthorized')
    );
  }

  static getErrorMessage(error) {
    if (this.isNetworkError(error)) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (this.isAuthError(error)) {
      return 'Authentication expired. Please log in again.';
    }
    
    return error.response?.data?.message || error.message || 'An unexpected error occurred.';
  }

  static async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (this.isNetworkError(error) && attempt < maxRetries) {
          console.log(`Network error, retrying... (${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        throw error;
      }
    }
  }

  static checkOnlineStatus() {
    return navigator.onLine;
  }

  static addOnlineStatusListener(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
}

export default NetworkErrorHandler;

