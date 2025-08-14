import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isTokenExpiringSoon, getRefreshToken } from '../utils/auth';

export const useTokenRefresh = () => {
  const { refreshToken, isAuthenticated } = useAuth();
  const refreshTimeoutRef = useRef(null);

  useEffect(() => {
    const scheduleTokenRefresh = () => {
      if (!isAuthenticated || !getRefreshToken()) {
        return;
      }

      // Clear existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Check if token is expiring soon (within 5 minutes)
      if (isTokenExpiringSoon()) {
        // Refresh immediately
        refreshToken();
      } else {
        // Schedule refresh for 1 minute before expiration
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expTime = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const timeUntilExpiry = expTime - now - 60000; // 1 minute before expiry

            if (timeUntilExpiry > 0) {
              refreshTimeoutRef.current = setTimeout(() => {
                refreshToken();
              }, timeUntilExpiry);
            } else {
              // Token expires very soon, refresh immediately
              refreshToken();
            }
          } catch (error) {
            console.error('Error parsing token for refresh scheduling:', error);
          }
        }
      }
    };

    // Schedule initial refresh
    scheduleTokenRefresh();

    // Set up interval to check token status every minute
    const intervalId = setInterval(scheduleTokenRefresh, 60000);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      clearInterval(intervalId);
    };
  }, [isAuthenticated, refreshToken]);

  return null;
}; 