import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveToken, getToken, clearToken, getUsernameFromToken, isTokenValid } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token && isTokenValid()) {
        try {
          const response = await fetch('/auth/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setIsAuthenticated(true);
            setLoading(false);
          } else {
            // Token is invalid, try to refresh
            await refreshToken();
          }
        } catch (error) {
          console.error('Auth validation error:', error);
          await refreshToken();
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        saveToken(data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data.user);
        setIsAuthenticated(true);
        setLoading(false);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, otp) => {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, otp })
      });

      const data = await response.json();
      
      if (response.ok) {
        saveToken(data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    const token = getToken();
    if (token) {
      // Call logout endpoint (fire and forget)
      fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).catch(() => {
        // Ignore errors on logout
      });
    }
    
    clearToken();
    localStorage.removeItem('refreshToken');
    // Clear persisted UI preferences
    localStorage.removeItem('homeMode');
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    navigate('/login');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 