import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('peoplepay360_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('peoplepay360_token') || null);
  const [isLoading, setIsLoading] = useState(() => {
    const storedToken = localStorage.getItem('peoplepay360_token');
    const storedUser = localStorage.getItem('peoplepay360_user');
    return !(storedToken && storedUser);
  });

  // Restore & revalidate session asynchronously in background without blocking initial paint
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      const storedToken = localStorage.getItem('peoplepay360_token');
      if (storedToken) {
        try {
          const userData = await authApi.me();
          if (isMounted) {
            setUser(userData);
            localStorage.setItem('peoplepay360_user', JSON.stringify(userData));
          }
        } catch (error) {
          if (isMounted) {
            console.error('Session restoration failed:', error);
            localStorage.removeItem('peoplepay360_token');
            localStorage.removeItem('peoplepay360_user');
            setUser(null);
            setToken(null);
          }
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    }
    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    const { token: newToken, user: userData } = data;
    localStorage.setItem('peoplepay360_token', newToken);
    localStorage.setItem('peoplepay360_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('peoplepay360_token');
    localStorage.removeItem('peoplepay360_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    role: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
