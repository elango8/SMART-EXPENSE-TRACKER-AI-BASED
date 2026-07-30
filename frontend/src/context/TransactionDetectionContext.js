import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from './AuthContext';
import api from '../services/api';
import {
  startListening,
  stopListening,
  isDetectionActive,
  onTransactionDetected,
} from '../services/transactionDetectionService';

const TransactionDetectionContext = createContext();

export const TransactionDetectionProvider = ({ children }) => {
  const { userToken } = useContext(AuthContext);

  const [isDetectionEnabled, setIsDetectionEnabled] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unsubscribeRef = useRef(null);

  // ── Fetch pending expenses from API ────────────────────────
  const fetchPendingExpenses = useCallback(async (silent = false) => {
    if (!userToken) return;
    try {
      if (!silent) setIsLoading(true);
      const res = await api.get('/pending-expenses');
      setPendingExpenses(res.data);
      setPendingCount(res.data.length);
    } catch (error) {
      console.log('Error fetching pending expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  // ── Refresh pending count only (lightweight) ───────────────
  const refreshPendingCount = useCallback(async () => {
    if (!userToken) return;
    try {
      const res = await api.get('/pending-expenses');
      setPendingCount(res.data.length);
    } catch (error) {
      console.log('Error refreshing pending count:', error);
    }
  }, [userToken]);

  // ── Submit detected transaction to backend ─────────────────
  const submitDetectedTransaction = useCallback(async (parsedData) => {
    if (!userToken) return null;
    try {
      setIsSubmitting(true);
      const res = await api.post('/pending-expenses', {
        amount: parsedData.amount,
        merchant: parsedData.merchant,
        category: parsedData.category,
        transactionType: parsedData.transactionType,
        reference: parsedData.reference,
        source: parsedData.source,
        rawMessage: parsedData.rawMessage,
        date: parsedData.date,
      });

      // Refresh the pending list
      await fetchPendingExpenses(true);
      return res.data;
    } catch (error) {
      // Don't alert for duplicates (409)
      if (error.response?.status !== 409) {
        console.log('Error submitting detected transaction:', error);
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [userToken, fetchPendingExpenses]);

  // ── Confirm a pending expense ──────────────────────────────
  const confirmExpense = useCallback(async (id, overrides = {}) => {
    try {
      const res = await api.post(`/pending-expenses/${id}/confirm`, overrides);
      // Optimistic removal
      setPendingExpenses(prev => prev.filter(item => item._id !== id));
      setPendingCount(prev => Math.max(0, prev - 1));
      return res.data;
    } catch (error) {
      console.log('Error confirming expense:', error);
      Alert.alert('Error', 'Failed to confirm transaction. Please try again.');
      return null;
    }
  }, []);

  // ── Dismiss a pending expense ──────────────────────────────
  const dismissExpense = useCallback(async (id) => {
    try {
      await api.post(`/pending-expenses/${id}/dismiss`);
      // Optimistic removal
      setPendingExpenses(prev => prev.filter(item => item._id !== id));
      setPendingCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (error) {
      console.log('Error dismissing expense:', error);
      Alert.alert('Error', 'Failed to dismiss transaction. Please try again.');
      return false;
    }
  }, []);

  // ── Generate mock data for testing ─────────────────────────
  const generateMockTransactions = useCallback(async () => {
    if (!userToken) return;
    try {
      setIsSubmitting(true);
      await api.post('/pending-expenses/mock');
      await fetchPendingExpenses(true);
      return true;
    } catch (error) {
      console.log('Error generating mock data:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [userToken, fetchPendingExpenses]);

  // ── Enable/disable detection ───────────────────────────────
  const enableDetection = useCallback(() => {
    setHasPermissions(true);
    setIsDetectionEnabled(true);
    startListening();

    // Subscribe to detected transactions
    if (unsubscribeRef.current) unsubscribeRef.current();
    unsubscribeRef.current = onTransactionDetected(async ({ parsed }) => {
      if (parsed) {
        await submitDetectedTransaction(parsed);
      }
    });
  }, [submitDetectedTransaction]);

  const disableDetection = useCallback(() => {
    setIsDetectionEnabled(false);
    stopListening();
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // ── Auto-fetch on login and poll for updates ───────────────
  useEffect(() => {
    if (userToken) {
      fetchPendingExpenses();

      // Poll every 30 seconds for new pending transactions
      const interval = setInterval(() => {
        refreshPendingCount();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setPendingExpenses([]);
      setPendingCount(0);
      disableDetection();
    }
  }, [userToken, fetchPendingExpenses, refreshPendingCount, disableDetection]);

  // ── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      stopListening();
    };
  }, []);

  return (
    <TransactionDetectionContext.Provider
      value={{
        // State
        isDetectionEnabled,
        hasPermissions,
        pendingExpenses,
        pendingCount,
        isLoading,
        isSubmitting,

        // Actions
        fetchPendingExpenses,
        refreshPendingCount,
        submitDetectedTransaction,
        confirmExpense,
        dismissExpense,
        generateMockTransactions,
        enableDetection,
        disableDetection,
      }}
    >
      {children}
    </TransactionDetectionContext.Provider>
  );
};

// Custom hook
export const useTransactionDetection = () => {
  const context = useContext(TransactionDetectionContext);
  if (!context) {
    throw new Error('useTransactionDetection must be used within a TransactionDetectionProvider');
  }
  return context;
};

export default TransactionDetectionContext;
