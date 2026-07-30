import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useTransactionDetection } from '../context/TransactionDetectionContext';
import { usePreferences } from '../context/PreferencesContext';
import TransactionConfirmationCard from '../components/TransactionConfirmationCard';
import {
  simulateIncomingSMS,
  simulateNotification,
} from '../services/transactionDetectionService';

export default function PendingConfirmationsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const { getSymbol } = usePreferences();
  const {
    pendingExpenses,
    pendingCount,
    isLoading,
    isSubmitting,
    fetchPendingExpenses,
    confirmExpense,
    dismissExpense,
    submitDetectedTransaction,
    generateMockTransactions,
    isDetectionEnabled,
  } = useTransactionDetection();

  const [actioningId, setActioningId] = useState(null);
  const [showSimMenu, setShowSimMenu] = useState(false);

  const currencySymbol = getSymbol();

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        fetchPendingExpenses();
      }
    }, [user, fetchPendingExpenses])
  );

  // ── Confirm handler ────────────────────────────────────────
  const handleConfirm = async (id, overrides) => {
    setActioningId(id);
    const result = await confirmExpense(id, overrides);
    setActioningId(null);
    if (result) {
      Alert.alert('✅ Expense Saved', 'Transaction confirmed and added to your expenses.');
    }
  };

  // ── Dismiss handler ────────────────────────────────────────
  const handleDismiss = (id) => {
    Alert.alert(
      'Dismiss Transaction',
      'Are you sure you want to dismiss this transaction? It won\'t be saved as an expense.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            setActioningId(id);
            await dismissExpense(id);
            setActioningId(null);
          },
        },
      ]
    );
  };

  // ── Simulation handlers ────────────────────────────────────
  const handleSimulateSMS = async () => {
    setShowSimMenu(false);
    const result = simulateIncomingSMS();
    if (result) {
      await submitDetectedTransaction(result);
      Alert.alert('📱 SMS Detected', `Detected: ${currencySymbol}${result.amount} at ${result.merchant}`);
    }
  };

  const handleSimulateNotification = async () => {
    setShowSimMenu(false);
    const result = simulateNotification();
    if (result) {
      await submitDetectedTransaction(result);
      Alert.alert('🔔 Notification Detected', `Detected: ${currencySymbol}${result.amount} at ${result.merchant}`);
    }
  };

  const handleGenerateMocks = async () => {
    setShowSimMenu(false);
    const success = await generateMockTransactions();
    if (success) {
      Alert.alert('🎯 Mock Data', 'Generated mock transactions for testing.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.springify().delay(50)} style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Finovo</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Detection Status */}
            {isDetectionEnabled && (
              <View style={styles.detectionPill}>
                <View style={styles.detectionDot} />
                <Text style={styles.detectionText}>Live</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              {unreadCount > 0 && (
                <View style={[styles.notifBadge, { borderColor: colors.background }]}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Banner */}
        <Animated.View entering={FadeInDown.springify().delay(120)} style={styles.banner}>
          <View style={styles.bannerGlow} />
          <Text style={styles.bannerLabel}>TRANSACTION INTELLIGENCE</Text>
          <Text style={styles.bannerTitle}>{pendingCount} Pending Actions</Text>
          <Text style={styles.bannerDesc}>
            {pendingCount > 0
              ? `We've detected ${pendingCount} transaction${pendingCount > 1 ? 's' : ''} from your SMS and payment notifications. Review them below.`
              : 'All transactions have been reviewed. No pending items.'}
          </Text>
          <Ionicons name="scan" size={80} color="rgba(255,255,255,0.12)" style={styles.sparkle} />
        </Animated.View>

        {/* Detection Setup Banner (if not enabled) */}
        {!isDetectionEnabled && (
          <Animated.View entering={FadeInDown.springify().delay(180)}>
            <TouchableOpacity
              style={[styles.setupBanner, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF', borderColor: isDark ? '#2D3560' : '#C7D2FE' }]}
              onPress={() => navigation.navigate('TransactionPermission')}
              activeOpacity={0.8}
            >
              <View style={[styles.setupIconBg, { backgroundColor: isDark ? '#2D3560' : '#C7D2FE' }]}>
                <Ionicons name="scan-outline" size={20} color={isDark ? '#818CF8' : '#4F46E5'} />
              </View>
              <View style={styles.setupInfo}>
                <Text style={[styles.setupTitle, { color: colors.textMain }]}>Enable Auto Detection</Text>
                <Text style={[styles.setupDesc, { color: colors.textSub }]}>
                  Tap to set up SMS & notification monitoring
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSub }]}>Loading pending transactions...</Text>
          </View>
        ) : (
          <>
            {/* Transaction Cards */}
            {pendingExpenses.map((item, idx) => (
              <TransactionConfirmationCard
                key={item._id}
                item={item}
                index={idx}
                onConfirm={handleConfirm}
                onDismiss={handleDismiss}
                isActioning={actioningId === item._id}
                currencySymbol={currencySymbol}
              />
            ))}

            {/* Empty State */}
            {pendingExpenses.length === 0 && (
              <Animated.View entering={FadeInUp.springify()} style={styles.emptyState}>
                <Animated.View entering={ZoomIn.springify()}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
                  </View>
                </Animated.View>
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>All caught up!</Text>
                <Text style={[styles.emptyDesc, { color: colors.textSub }]}>No pending transactions to review.</Text>
                <Text style={[styles.emptyHint, { color: colors.textSub }]}>
                  Use the test button below to simulate transactions.
                </Text>
              </Animated.View>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Simulate FAB ──────────────────────────── */}
      <View style={styles.fabContainer}>
        {showSimMenu && (
          <Animated.View entering={FadeInUp.springify()} style={[styles.simMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.simMenuItem} onPress={handleSimulateSMS} activeOpacity={0.7}>
              <View style={[styles.simMenuIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#3B82F6" />
              </View>
              <Text style={[styles.simMenuText, { color: colors.textMain }]}>Simulate SMS</Text>
            </TouchableOpacity>
            <View style={[styles.simMenuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.simMenuItem} onPress={handleSimulateNotification} activeOpacity={0.7}>
              <View style={[styles.simMenuIcon, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="notifications" size={16} color="#8B5CF6" />
              </View>
              <Text style={[styles.simMenuText, { color: colors.textMain }]}>Simulate Notification</Text>
            </TouchableOpacity>
            <View style={[styles.simMenuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.simMenuItem} onPress={handleGenerateMocks} activeOpacity={0.7}>
              <View style={[styles.simMenuIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="flask" size={16} color="#F59E0B" />
              </View>
              <Text style={[styles.simMenuText, { color: colors.textMain }]}>Generate Mock Data</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#1E1B4B' }]}
          onPress={() => setShowSimMenu(!showSimMenu)}
          activeOpacity={0.85}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={showSimMenu ? 'close' : 'flash'} size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 60 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, marginTop: 6,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0DABC6' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  notifBadge: {
    position: 'absolute', top: -6, right: -8,
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Detection pill
  detectionPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  detectionDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#10B981', marginRight: 5,
  },
  detectionText: {
    color: '#10B981', fontSize: 11, fontWeight: '700',
  },

  // Banner
  banner: {
    backgroundColor: '#1E1B4B', borderRadius: 24, padding: 24, marginBottom: 20, overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.15)', top: -60, right: -40,
  },
  bannerLabel: { fontSize: 10, fontWeight: 'bold', color: '#A5B4FC', letterSpacing: 1.5, marginBottom: 8 },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  bannerDesc: { fontSize: 13, color: '#C7D2FE', lineHeight: 20, maxWidth: '90%' },
  sparkle: { position: 'absolute', right: 10, top: 70 },

  // Setup banner
  setupBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1,
  },
  setupIconBg: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  setupInfo: { flex: 1 },
  setupTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  setupDesc: { fontSize: 12 },

  // Loading
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 14, marginTop: 12 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { fontSize: 14, marginBottom: 8 },
  emptyHint: { fontSize: 12, fontStyle: 'italic' },

  // FAB
  fabContainer: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20,
    alignItems: 'flex-end',
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  simMenu: {
    borderRadius: 18, marginBottom: 12, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
    minWidth: 220,
  },
  simMenuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  simMenuIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  simMenuText: { fontSize: 14, fontWeight: '600' },
  simMenuDivider: { height: 1, marginHorizontal: 12 },
});
