import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Team member credentials
const TEAM_CREDENTIALS = {
  oursayso: { username: 'hello@oursayso.com', password: 'TheKingsEars', role: 'admin', name: 'Oursayso Admin' }
};

const SESSION_KEY = 'oursayso_cms_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem(SESSION_KEY);
        if (sessionData) {
          const { user: sessionUser, timestamp } = JSON.parse(sessionData);
          const now = new Date().getTime();
          
          // Check if session is still valid (within 24 hours)
          if (now - timestamp < SESSION_DURATION) {
            setUser(sessionUser);
          } else {
            // Session expired, clear it
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = (username, password) => {
    // Find matching credentials
    const credential = Object.values(TEAM_CREDENTIALS).find(
      cred => cred.username === username && cred.password === password
    );

    if (credential) {
      const userData = {
        username: credential.username,
        name: credential.name,
        role: credential.role,
        loginTime: new Date().toISOString()
      };

      // Save session to localStorage
      const sessionData = {
        user: userData,
        timestamp: new Date().getTime()
      };
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setUser(userData);
      
      return { success: true, user: userData };
    } else {
      return { success: false, error: 'Invalid username or password' };
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  // Get time remaining in session
  const getSessionTimeRemaining = () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const { timestamp } = JSON.parse(sessionData);
        const now = new Date().getTime();
        const remaining = SESSION_DURATION - (now - timestamp);
        return Math.max(0, remaining);
      }
    } catch (error) {
      console.error('Error getting session time:', error);
    }
    return 0;
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
    getSessionTimeRemaining
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;