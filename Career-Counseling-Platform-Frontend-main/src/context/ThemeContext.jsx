import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. Initialize state from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('app-theme');
    if (stored) return stored;
    
    // Fallback to system preference (MNC standard)
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // 2. Sync theme with DOM and localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both to be safe during transition
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // 3. Listen for system preference changes (MNC standard)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('app-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
