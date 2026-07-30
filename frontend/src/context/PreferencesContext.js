import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currencyUtils';
import api from '../services/api';

const PreferencesContext = createContext();

export const PreferencesProvider = ({ children }) => {
  const { user, updatePreferences } = useContext(AuthContext);

  // Read preferences from user.preferences
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    budgetAlerts: true,
    monthlyBudget: 5000,
    budgetAlertThresholds: [50, 75, 90, 100],
    twoFactorEnabled: false,
    biometricsEnabled: false,
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Keep state in sync with AuthContext user preferences
  useEffect(() => {
    if (user?.preferences) {
      setPreferences(prev => ({
        ...prev,
        ...user.preferences,
      }));
    }
  }, [user]);

  // Centralized updatePreference function
  const updatePreference = useCallback(async (key, value) => {
    const prevPreferences = { ...preferences };

    // Optimistic UI update
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
    setIsUpdating(true);

    try {
      // call endpoint PUT /api/user/preferences
      const res = await api.put('/user/preferences', { [key]: value });
      
      // Update AuthContext which will persist info
      if (res.data && res.data.preferences) {
        updatePreferences(res.data.preferences);
      } else {
        updatePreferences({ [key]: value });
      }
    } catch (error) {
      console.error(`Failed to update preference ${key}:`, error);
      // Rollback
      setPreferences(prevPreferences);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [preferences, updatePreferences]);

  // Currency is hardcoded to INR (currency selection has been removed)
  const HARDCODED_CURRENCY = 'INR';

  // Centralized formatAmount using hardcoded currency
  const formatAmount = useCallback((amount) => {
    return formatCurrency(amount, HARDCODED_CURRENCY);
  }, []);

  // Centralized symbol getter
  const getSymbol = useCallback(() => {
    return getCurrencySymbol(HARDCODED_CURRENCY);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        currency: HARDCODED_CURRENCY,
        theme: preferences.theme,
        notifications: preferences.notifications,
        budgetAlerts: preferences.budgetAlerts,
        monthlyBudget: preferences.monthlyBudget,
        budgetAlertThresholds: preferences.budgetAlertThresholds || [50, 75, 90, 100],
        twoFactorEnabled: preferences.twoFactorEnabled,
        biometricsEnabled: preferences.biometricsEnabled,
        updatePreference,
        formatAmount,
        getSymbol,
        isUpdating,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export default PreferencesContext;
