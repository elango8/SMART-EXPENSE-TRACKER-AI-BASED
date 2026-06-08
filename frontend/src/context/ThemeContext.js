import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { lightColors, darkColors } from '../theme/colors';
import { AuthContext } from './AuthContext';
import api from '../services/api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user, updatePreferences } = useContext(AuthContext);

  // Initialize from user preferences (persisted in DB)
  const [isDark, setIsDark] = useState(user?.preferences?.theme === 'dark');

  // Sync when user data loads/changes (e.g., after login)
  useEffect(() => {
    if (user?.preferences?.theme) {
      setIsDark(user.preferences.theme === 'dark');
    }
  }, [user?.preferences?.theme]);

  const currentColors = isDark ? darkColors : lightColors;

  const toggleTheme = useCallback(async (value) => {
    const newIsDark = typeof value === 'boolean' ? value : !isDark;
    const prevIsDark = isDark;
    
    // Optimistic UI update
    setIsDark(newIsDark);

    try {
      const themeValue = newIsDark ? 'dark' : 'light';
      await api.put('/user/preferences', { theme: themeValue });
      updatePreferences({ theme: themeValue });
    } catch (error) {
      console.log('Error saving theme preference:', error);
      // Rollback on failure
      setIsDark(prevIsDark);
    }
  }, [isDark, updatePreferences]);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: currentColors,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easy consumption
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
