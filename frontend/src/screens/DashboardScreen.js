import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationsContext';
import { usePreferences } from '../context/PreferencesContext';
import { useTransactionDetection } from '../context/TransactionDetectionContext';
import TransactionItem from '../components/TransactionItem';

import api from '../services/api';

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const { pendingCount: detectionPendingCount, isDetectionEnabled } = useTransactionDetection();

  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Fetch Expenses
  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/expenses`);
      setExpenses(res.data);
    } catch (error) {
      console.log('Error fetching expenses:', error);
    }
  };



  // 🔹 Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setAnalytics(res.data);
    } catch (error) {
      console.log('Error fetching analytics:', error);
    }
  };

  // 🔹 Fetch Dashboard Summary
  const fetchDashboardSummary = async () => {
    try {
      const res = await api.get('/dashboard/summary');
      setDashboardSummary(res.data);
    } catch (error) {
      console.log('Error fetching dashboard summary:', error);
    }
  };

  // 🔹 Refresh when screen focused
  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        setIsLoading(true);
        Promise.all([fetchExpenses(), fetchAnalytics(), fetchDashboardSummary()])
          .finally(() => setIsLoading(false));
      }
    }, [user])
  );

  // 🔹 Total fallback (if analytics not loaded)
  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  // 🔹 Today Spending
  const today = new Date().toDateString();
  const todaySpending = expenses
    .filter(item => new Date(item.date).toDateString() === today)
    .reduce((sum, item) => sum + item.amount, 0);

  // 🔹 Weekly Spending
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  const weeklySpending = expenses
    .filter(item => new Date(item.date) >= oneWeekAgo)
    .reduce((sum, item) => sum + item.amount, 0);

  // 🔹 Top Category Insight
  const topCategory = analytics?.categoryBreakdown?.[0]?.name;

  const { formatAmount, getSymbol } = usePreferences();
  const currencySymbol = getSymbol();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Finovo</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { borderColor: colors.background }]}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.greeting}>
          <Text style={[styles.greetingTitle, { color: colors.textMain }]}>Good Morning, {user?.name || 'Elango'}</Text>
          <Text style={[styles.greetingSub, { color: colors.textSub }]}>Here is your financial status for today.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(200)} style={[styles.balanceCard, { backgroundColor: isDark ? '#1E3A5F' : colors.primary }]}>
          <Text style={styles.balanceLabel}>TOTAL EXPENSES</Text>
          <Text style={styles.balanceValue}>
            {formatAmount(analytics?.totalSpent ?? totalAmount)}
          </Text>
          <View style={styles.trendContainer}>
            <Ionicons name="trending-up" size={16} color="#FFD166" />
            <Text style={styles.trendText}>+2.4% from last month</Text>
          </View>
          <View style={styles.circleDecoration} />
        </Animated.View>



        {/* Most Recent Transaction Mini Card */}
        {dashboardSummary?.recentTransaction && (
          <Animated.View entering={FadeInDown.springify().delay(490)} style={[styles.recentMiniCard, { backgroundColor: isDark ? '#1E1530' : '#FAF5FF', borderColor: isDark ? '#2D2540' : '#EDE9FE' }]}>
            <View style={[styles.recentMiniIconBg, { backgroundColor: isDark ? '#2D2540' : '#EDE9FE' }]}>
              <Ionicons name="flash" size={16} color="#7C3AED" />
            </View>
            <View style={styles.recentMiniInfo}>
              <Text style={styles.recentMiniTitle}>Latest Transaction</Text>
              <Text style={[styles.recentMiniSub, { color: colors.textMain }]} numberOfLines={1}>
                {dashboardSummary.recentTransaction.title} • {dashboardSummary.recentTransaction.category}
              </Text>
            </View>
            <Text style={styles.recentMiniAmount}>
              -{formatAmount(Math.abs(dashboardSummary.recentTransaction.amount))}
            </Text>
          </Animated.View>
        )}

        {/* Pending */}
        <Animated.View entering={FadeInDown.springify().delay(500)} style={[styles.pendingCard, { backgroundColor: isDark ? '#2D1518' : '#FFF5F5' }]}>
          <View style={styles.pendingHeader}>
            <View style={[styles.pendingIconBg, { backgroundColor: colors.danger }]}>
              <Ionicons name="alert" size={20} color="#fff" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isDetectionEnabled && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 }} />
                  <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>Auto</Text>
                </View>
              )}
              <View style={[styles.pendingBadge, { backgroundColor: isDark ? '#4D2528' : '#FFD6D6' }]}>
                <Text style={[styles.pendingBadgeText, { color: colors.danger }]}>
                  {detectionPendingCount || dashboardSummary?.pendingCount || 0} Pending
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.pendingRow}>
            <View>
              <Text style={[styles.pendingTitle, { color: colors.textMain }]}>Confirm Actions</Text>
              <Text style={[styles.pendingSub, { color: colors.danger }]}>
                {(detectionPendingCount || dashboardSummary?.pendingCount) > 0
                  ? `${detectionPendingCount || dashboardSummary?.pendingCount} items need your review`
                  : 'No pending items'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.pendingBtn, { backgroundColor: colors.success }]}
              onPress={() => navigation.navigate('PendingConfirmations')}
            >
              <Text style={styles.pendingBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? '#132218' : '#F8F9FA' }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.statLabel, { color: colors.textSub }]}>TODAY'S TOTAL SPENDINGS</Text>
              <Text style={[styles.statValue, { color: colors.textMain }]}>{formatAmount(todaySpending)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? '#1E2340' : '#F8F9FA' }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.statLabel, { color: colors.textSub }]}>WEEKLY SPENDING</Text>
              <Text style={[styles.statValue, { color: colors.textMain }]}>{formatAmount(weeklySpending)}</Text>
            </View>
          </View>
        </View>

        {/* Insight */}
        <Animated.View entering={FadeInDown.springify().delay(700)} style={[styles.insightCard, { backgroundColor: isDark ? '#2D1B35' : '#FCE4EC' }]}>
          <View style={[styles.insightRobot, { backgroundColor: isDark ? '#1A1D27' : '#fff' }]}>
            <Ionicons name="hardware-chip-outline" size={20} color="#9C27B0" />
          </View>
          <Text style={[styles.insightTitle, { color: isDark ? '#F48FB1' : '#880E4F' }]}>Ethereal Curator Insight</Text>
          <Text style={[styles.insightDesc, { color: isDark ? '#CE93D8' : '#C2185B' }]}>
            You spent more on {topCategory || 'expenses'} this week 💸. Try optimizing it to save more.
          </Text>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.springify().delay(800)} style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Recent Transactions</Text>
            <Text style={[styles.sectionSub, { color: colors.textSub }]}>Your latest activity</Text>
          </View>
          <TouchableOpacity style={[styles.viewAllPill, { backgroundColor: isDark ? '#1E2340' : '#EBF2FF' }]} onPress={() => navigation.navigate('History')}>
            <Text style={[styles.viewAllBtn, { color: colors.primary }]}>View All</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </Animated.View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textMain }]}>No transactions yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSub }]}>Start adding expenses to see them here</Text>
          </View>
        ) : (
          [...expenses]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map((tx, index) => (
              <Animated.View key={tx._id} entering={FadeInDown.springify().delay(900 + (index * 100))}>
                <TransactionItem 
                  expense={tx}
                  title={tx.title}
                  category={tx.category}
                  date={new Date(tx.date).toLocaleDateString()}
                  amount={tx.amount}
                  onRefresh={fetchExpenses}
                  showActions={false}
                />
              </Animated.View>
            ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 🔹 Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0DABC6' },
  greeting: { marginBottom: 24 },
  greetingTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  greetingSub: { fontSize: 13 },

  // Notification badge
  notifBadge: {
    position: 'absolute', top: -6, right: -8,
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff',
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  balanceCard: { borderRadius: 24, padding: 28, marginBottom: 20, overflow: 'hidden' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  balanceValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 12 },
  trendContainer: { flexDirection: 'row', alignItems: 'center' },
  trendText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginLeft: 6 },
  circleDecoration: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.05)', right: -80, top: -40 },

  // Dynamic Summary Section
  summarySection: { marginBottom: 20 },
  summarySectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: (screenWidth - 58) / 2,
    borderRadius: 20,
    padding: 16,
    minHeight: 120,
  },
  summaryIconBg: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  summaryCardValue: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  summaryCardLabel: { fontSize: 11, fontWeight: '600' },

  // Recent Mini Card
  recentMiniCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 14,
    marginBottom: 20, borderWidth: 1,
  },
  recentMiniIconBg: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  recentMiniInfo: { flex: 1 },
  recentMiniTitle: { fontSize: 10, fontWeight: '700', color: '#7C3AED', letterSpacing: 0.5, marginBottom: 2 },
  recentMiniSub: { fontSize: 13, fontWeight: '600' },
  recentMiniAmount: { fontSize: 15, fontWeight: '800', color: '#DC2626' },

  pendingCard: { borderRadius: 24, padding: 20, marginBottom: 20 },
  pendingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pendingIconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pendingBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  pendingBadgeText: { fontWeight: 'bold', fontSize: 12 },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pendingTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  pendingSub: { fontSize: 12 },
  pendingBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 },
  pendingBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },

  statsRow: { marginBottom: 16 },
  statBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 24, padding: 16 },
  statIconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  statLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: 'bold' },

  insightCard: { borderRadius: 24, padding: 24, marginBottom: 30, marginTop: 10 },
  insightRobot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  insightTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  insightDesc: { fontSize: 14, lineHeight: 22 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionSub: { fontSize: 12, marginTop: 2 },
  viewAllPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  viewAllBtn: { fontWeight: '700', fontSize: 13 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4 },
});
