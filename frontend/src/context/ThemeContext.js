import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme/colors';
import { AuthContext } from './AuthContext';
import api from '../services/api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user, updatePreferences } = useContext(AuthContext);

  // Initialize from user preferences (persisted in DB/AsyncStorage)
  const [isDark, setIsDark] = useState(false);
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  // Read theme from AsyncStorage on mount for anti-flicker
  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          if (parsed?.preferences?.theme) {
            setIsDark(parsed.preferences.theme === 'dark');
          }
        }
      } catch (error) {
        console.log('Error reading stored theme:', error);
      } finally {
        setIsThemeLoading(false);
      }
    };
    loadStoredTheme();
  }, []);

  // Sync when user data loads/changes (e.g., after login)
  useEffect(() => {
    if (user?.preferences?.theme) {
      setIsDark(user.preferences.theme === 'dark');
    }
  }, [user?.preferences?.theme]);

  const currentColors = isDark ? darkColors : lightColors;

  const toggleTheme = useCallback(async (value) => {
    const newIsDark = typeof value === 'boolean' ? value : !isDark;
    const themeValue = newIsDark ? 'dark' : 'light';

    // 1. Apply immediately to UI
    setIsDark(newIsDark);

    // 2. Persist locally first (so it works even without server)
    updatePreferences({ theme: themeValue });

    // 3. Sync to server in background (non-blocking, no rollback)
    try {
      await api.put('/user/preferences', { theme: themeValue });
    } catch (error) {
      console.log('Theme synced locally, server sync failed (will retry on next save):', error?.message);
    }
  }, [isDark, updatePreferences]);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: currentColors,
        toggleTheme,
        isThemeLoading,
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
