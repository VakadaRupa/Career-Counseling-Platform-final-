import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "../utils/supabase";     


const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('career_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Convert email like "rupa.joshitha123@xyz.com" -> "Rupa Joshitha"
    const rawName = email.split('@')[0];
    const cleanName = rawName
      .replace(/[._0-9-]/g, ' ')
      .split(' ')
      .filter(w => w.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();

    const mockUser = {
      id: crypto.randomUUID(), // Prevent duplicate IDs
      name: cleanName || 'User',
      email,
      role: email.includes('admin') ? 'admin' : 'user',
    };
    setUser(mockUser);
    localStorage.setItem('career_user', JSON.stringify(mockUser));
  };

  const signup = async (name, email, password) => {
    const mockUser = {
      id: crypto.randomUUID(),
      name,
      email,
      role: 'user',
    };
    setUser(mockUser);
    localStorage.setItem('career_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('career_user');
  };

  const updateProfile = (data) => {
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('career_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
