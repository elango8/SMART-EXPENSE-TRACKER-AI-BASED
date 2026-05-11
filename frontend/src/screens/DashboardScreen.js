import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import TransactionItem from '../components/TransactionItem';
// import ThreeDComponent from '../components/ThreeDComponent';

import api from '../services/api';

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
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

  const pieData = analytics?.categoryBreakdown?.map((item, index) => ({
    name: item.name,
    amount: item.amount,
    color: ['#FF6384','#36A2EB','#FFCE56','#4CAF50','#9966FF'][index % 5],
    legendFontColor: '#333',
    legendFontSize: 12
  })) || [];

  const lineData = {
    labels: analytics?.monthlyTrends?.map(item => item.month) || [],
    datasets: [
      {
        data: analytics?.monthlyTrends?.map(item => item.amount) || []
      }
    ]
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

  // 🔹 Refresh when screen focused
  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        setIsLoading(true);
        Promise.all([fetchExpenses(), fetchAnalytics()])
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Finovo</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.greeting}>
          <Text style={styles.greetingTitle}>Good Morning, {user?.name || 'Elango'}</Text>
          <Text style={styles.greetingSub}>Here is your financial status for today.</Text>
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.balanceCard}>
          <View style={[StyleSheet.absoluteFill, { opacity: 0.3, zIndex: -1 }]}>
            {/* <ThreeDComponent shapeType="torus" color="#FFFFFF" style={{ flex: 1, marginLeft: 120, marginTop: -30 }} /> */}
          </View>
          <Text style={styles.balanceLabel}>TOTAL EXPENSES</Text>
          <Text style={styles.balanceValue}>
            ₹ {(analytics?.totalSpent ?? totalAmount).toFixed(2)}
          </Text>
          <View style={styles.trendContainer}>
            <Ionicons name="trending-up" size={16} color="#FFD166" />
            <Text style={styles.trendText}>+2.4% from last month</Text>
          </View>
          <View style={styles.circleDecoration} />
        </Animated.View>

        {/* Pie Chart category breakdown */}

        {analytics && pieData.length > 0 && (
          <Animated.View entering={FadeInDown.springify().delay(300)} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
              Category Breakdown
            </Text>

            <PieChart
              data={pieData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                color: () => '#000'
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Animated.View>
        )}

        {/*Monthly Trends*/}

        {analytics && lineData.labels.length > 0 && (
          <Animated.View entering={FadeInDown.springify().delay(400)} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
              Monthly Trends
            </Text>

            <LineChart
              data={lineData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: () => '#0DABC6'
              }}
              style={{ borderRadius: 16 }}
            />
          </Animated.View>
        )}

        {/* Pending */}
        <Animated.View entering={FadeInDown.springify().delay(500)} style={styles.pendingCard}>
          <View style={styles.pendingHeader}>
            <View style={styles.pendingIconBg}>
              <Ionicons name="alert" size={20} color="#fff" />
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>3 Pending</Text>
            </View>
          </View>
          <View style={styles.pendingRow}>
            <View>
              <Text style={styles.pendingTitle}>Confirm Actions</Text>
              <Text style={styles.pendingSub}>Review flagged items</Text>
            </View>
            <TouchableOpacity 
              style={styles.pendingBtn}
              onPress={() => navigation.navigate('PendingConfirmations')}
            >
              <Text style={styles.pendingBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar-outline" size={20} color={colors.success} />
            </View>
            <View>
              <Text style={styles.statLabel}>TODAY'S TOTAL SPENDINGS</Text>
              <Text style={styles.statValue}>₹ {todaySpending.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.statLabel}>WEEKLY SPENDING</Text>
              <Text style={styles.statValue}>₹ {weeklySpending.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Insight */}
        <Animated.View entering={FadeInDown.springify().delay(700)} style={styles.insightCard}>
          <View style={styles.insightRobot}>
            <Ionicons name="hardware-chip-outline" size={20} color="#9C27B0" />
          </View>
          <Text style={styles.insightTitle}>Ethereal Curator Insight</Text>
          <Text style={styles.insightDesc}>
            You spent more on {topCategory || 'expenses'} this week 💸. Try optimizing it to save more.
          </Text>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.springify().delay(800)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.viewAllBtn}>View All</Text>
          </TouchableOpacity>
        </Animated.View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : expenses.length === 0 ? (
          <Text style={{ textAlign: 'center', color: colors.textSub, marginTop: 20 }}>
            No expenses yet
          </Text>
        ) : (
          expenses.map((tx, index) => (
            <Animated.View key={tx._id} entering={FadeInDown.springify().delay(900 + (index * 100))}>
              <TransactionItem 
                expense={tx}
                title={tx.title}
                category={tx.category}
                date={new Date(tx.date).toLocaleDateString()}
                amount={tx.amount}
              />
            </Animated.View>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 🔹 Styles unchanged
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0DABC6' },
  greeting: { marginBottom: 24 },
  greetingTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textMain, marginBottom: 4 },
  greetingSub: { fontSize: 13, color: colors.textSub },

  balanceCard: { backgroundColor: colors.dashboardCardBg, borderRadius: 24, padding: 28, marginBottom: 20, overflow: 'hidden' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  balanceValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 12 },
  trendContainer: { flexDirection: 'row', alignItems: 'center' },
  trendText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginLeft: 6 },
  circleDecoration: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.05)', right: -80, top: -40 },

  pendingCard: { backgroundColor: '#FFF5F5', borderRadius: 24, padding: 20, marginBottom: 20 },
  pendingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pendingIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  pendingBadge: { backgroundColor: '#FFD6D6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  pendingBadgeText: { color: colors.danger, fontWeight: 'bold', fontSize: 12 },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pendingTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textMain, marginBottom: 4 },
  pendingSub: { fontSize: 12, color: colors.danger },
  pendingBtn: { backgroundColor: colors.success, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 },
  pendingBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },

  statsRow: { marginBottom: 16 },
  statBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 16 },
  statIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: colors.textSub, letterSpacing: 1, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.textMain },

  insightCard: { backgroundColor: '#FCE4EC', borderRadius: 24, padding: 24, marginBottom: 30, marginTop: 10 },
  insightRobot: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  insightTitle: { fontSize: 16, fontWeight: 'bold', color: '#880E4F', marginBottom: 8 },
  insightDesc: { fontSize: 14, color: '#C2185B', lineHeight: 22 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMain },
  viewAllBtn: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
});

