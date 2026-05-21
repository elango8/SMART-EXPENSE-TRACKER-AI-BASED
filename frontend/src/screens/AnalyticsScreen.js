import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';

import Svg, { Circle, G, Path, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const screenWidth = Dimensions.get('window').width;

/* ──────────────────────────────────────
   ANIMATED BAR COMPONENT
   ────────────────────────────────────── */
const AnimatedBar = ({ targetHeight, delay, label, value, isActive, color, maxH }) => {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    height.value = withDelay(delay, withSpring(targetHeight, { damping: 12, stiffness: 90 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
  }, [targetHeight]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.barGroup}>
      <Animated.View style={animatedLabelStyle}>
        <Text style={styles.barValue}>
          {value > 0 ? `₹${Math.round(value)}` : ''}
        </Text>
      </Animated.View>
      <View style={[styles.barTrack, { height: maxH }]}>  
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: color || (isActive ? colors.primary : '#E0E7FF') },
            animatedBarStyle,
          ]}
        />
      </View>
      <Text style={[styles.barLabel, isActive && styles.barLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

/* ──────────────────────────────────────
   ANIMATED PIE SEGMENT
   ────────────────────────────────────── */
const PIE_SIZE = Math.min(screenWidth * 0.55, 220);

const AnimatedPieSegment = ({ d, color, delay, isSelected, onPress }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.6, 1.03, isSelected ? 1.05 : 1]) },
      { rotate: `${interpolate(progress.value, [0, 1], [-30, 0])}deg` },
    ],
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.6, 1]),
  }));

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ position: 'absolute' }}>
      <Animated.View style={animStyle}>
        <Svg width={PIE_SIZE} height={PIE_SIZE}>
          <Path
            d={d}
            fill={color}
            stroke={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
            strokeWidth={isSelected ? 3 : 1.5}
          />
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
};

/* ──────────────────────────────────────
   PREMIUM PIE CHART
   ────────────────────────────────────── */
const createPieSlicePath = (cx, cy, radius, startAngle, endAngle, innerRadius) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const x1 = cx + radius * Math.cos(toRad(startAngle));
  const y1 = cy + radius * Math.sin(toRad(startAngle));
  const x2 = cx + radius * Math.cos(toRad(endAngle));
  const y2 = cy + radius * Math.sin(toRad(endAngle));
  const ix1 = cx + innerRadius * Math.cos(toRad(endAngle));
  const iy1 = cy + innerRadius * Math.sin(toRad(endAngle));
  const ix2 = cx + innerRadius * Math.cos(toRad(startAngle));
  const iy2 = cy + innerRadius * Math.sin(toRad(startAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${ix1} ${iy1}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
    'Z',
  ].join(' ');
};

const DonutChart = ({ data, totalSpent }) => {
  const size = PIE_SIZE;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 6;
  const innerR = outerR * 0.55;
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const centerPulse = useSharedValue(0);

  useEffect(() => {
    centerPulse.value = withDelay(
      800,
      withSpring(1, { damping: 10, stiffness: 60 })
    );
  }, []);

  const centerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerPulse.value }],
    opacity: centerPulse.value,
  }));

  if (!data || data.length === 0) {
    return (
      <View style={styles.donutEmpty}>
        <Ionicons name="pie-chart-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>No expense data yet</Text>
      </View>
    );
  }

  // Build slices
  let startAngle = -90;
  const slices = data.map((item, index) => {
    const percent = totalSpent > 0 ? item.amount / totalSpent : 0;
    const sweep = Math.max(percent * 360, 0.5); // min 0.5 degree
    const endAngle = startAngle + sweep;
    const gap = 2; // gap between slices in degrees
    const d = createPieSlicePath(cx, cy, outerR, startAngle + gap / 2, endAngle - gap / 2, innerR);
    const slice = { ...item, d, index, percent };
    startAngle = endAngle;
    return slice;
  });

  const selected = selectedIdx >= 0 && selectedIdx < data.length ? data[selectedIdx] : null;

  return (
    <View style={styles.donutContainer}>
      {/* Shadow ring */}
      <View style={styles.pieGlow} />

      {/* Pie slices */}
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {slices.map((slice) => (
          <AnimatedPieSegment
            key={slice.index}
            d={slice.d}
            color={slice.color}
            delay={300 + slice.index * 150}
            isSelected={selectedIdx === slice.index}
            onPress={() => setSelectedIdx(selectedIdx === slice.index ? -1 : slice.index)}
          />
        ))}
      </View>

      {/* Center overlay */}
      <Animated.View style={[styles.donutCenter, centerAnimStyle]}>
        <View style={styles.centerGlassCard}>
          {selected ? (
            <>
              <View style={[styles.centerCategoryDot, { backgroundColor: selected.color }]} />
              <Text style={styles.centerCategoryName}>{selected.name}</Text>
              <Text style={styles.donutTotal}>₹{selected.amount.toFixed(0)}</Text>
              <Text style={styles.donutLabel}>{selected.percentage}% OF TOTAL</Text>
            </>
          ) : (
            <>
              <View style={styles.centerIconRing}>
                <Ionicons name="wallet" size={20} color="#6366F1" />
              </View>
              <Text style={styles.donutTotal}>₹{totalSpent.toFixed(0)}</Text>
              <Text style={styles.donutLabel}>TOTAL SPENT</Text>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

/* ──────────────────────────────────────
   MAIN ANALYTICS SCREEN
   ────────────────────────────────────── */
export default function AnalyticsScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('All');

  const periods = ['Week', 'Month', '3M', 'All'];

  const fetchExpenses = async () => {
    if (!user?._id) return;
    try {
      setIsLoading(true);
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (error) {
      console.log('Analytics Fetch Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [user])
  );

  // Filter expenses by selected period
  const filteredExpenses = expenses.filter((exp) => {
    if (selectedPeriod === 'All') return true;
    const now = new Date();
    const expDate = new Date(exp.date);
    const diffDays = (now - expDate) / (1000 * 60 * 60 * 24);
    if (selectedPeriod === 'Week') return diffDays <= 7;
    if (selectedPeriod === 'Month') return diffDays <= 30;
    if (selectedPeriod === '3M') return diffDays <= 90;
    return true;
  });

  const totalSpent = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount), 0
  );

  // CATEGORY BREAKDOWN
  const categoryMap = filteredExpenses.reduce((acc, curr) => {
    const category = curr.category || 'Other';
    acc[category] = (acc[category] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const chartColors = [
    '#6366F1', '#F43F5E', '#F59E0B', '#10B981',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  ];

  const categoryData = Object.keys(categoryMap)
    .map((key, idx) => ({
      name: key,
      amount: categoryMap[key],
      percentage: totalSpent > 0 ? Math.round((categoryMap[key] / totalSpent) * 100) : 0,
      color: chartColors[idx % chartColors.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  // MONTHLY DATA — last 6 months dynamically
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({ month: d.getMonth(), year: d.getFullYear(), label: monthNames[d.getMonth()] });
  }

  const monthlyTotals = last6Months.map((m) => {
    return expenses
      .filter((exp) => {
        const d = new Date(exp.date);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      })
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
  });

  const maxMonthly = Math.max(...monthlyTotals, 1);
  const barMaxH = 120;

  // TOP CATEGORY
  const topCategory = categoryData.length > 0 ? categoryData[0] : null;

  // Average daily spending
  const avgDaily = filteredExpenses.length > 0
    ? (totalSpent / (selectedPeriod === 'Week' ? 7 : selectedPeriod === 'Month' ? 30 : selectedPeriod === '3M' ? 90 : Math.max(1, Math.ceil((now - new Date(Math.min(...expenses.map(e => new Date(e.date))))) / 86400000)))).toFixed(0)
    : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing your finances...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Finovo</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* AI BANNER */}
        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.banner}>
          <View style={styles.bannerGlow} />
          <Text style={styles.bannerLabel}>
            <Ionicons name="sparkles" size={12} /> INTELLIGENCE PULSE
          </Text>
          <Text style={styles.bannerTitle}>
            Your wealth is{' '}
            <Text style={{ color: '#818CF8' }}>evolving</Text> today.
          </Text>
          <Text style={styles.bannerDesc}>
            AI analyzed your recent spending patterns and generated smart
            financial insights.
          </Text>
        </Animated.View>

        {/* PERIOD FILTER */}
        <Animated.View entering={FadeInDown.springify().delay(150)} style={styles.periodRow}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, selectedPeriod === p && styles.periodBtnActive]}
              onPress={() => setSelectedPeriod(p)}
            >
              <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* SUMMARY CARDS */}
        <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#EEF2FF' }]}>  
            <View style={[styles.summaryIcon, { backgroundColor: '#C7D2FE' }]}>
              <Ionicons name="wallet" size={18} color="#6366F1" />
            </View>
            <Text style={styles.summaryAmount}>₹{totalSpent.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FDE68A' }]}>
              <Ionicons name="trending-up" size={18} color="#D97706" />
            </View>
            <Text style={styles.summaryAmount}>₹{avgDaily}</Text>
            <Text style={styles.summaryLabel}>Avg / Day</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#A7F3D0' }]}>
              <Ionicons name="receipt" size={18} color="#059669" />
            </View>
            <Text style={styles.summaryAmount}>{filteredExpenses.length}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
        </Animated.View>

        {/* DONUT CHART CARD */}
        <Animated.View entering={FadeInDown.springify().delay(300)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Category Breakdown</Text>
            <View style={styles.cardBadge}>
              <Ionicons name="pie-chart" size={14} color="#6366F1" />
            </View>
          </View>
          <Text style={styles.cardSub}>Where your money flows</Text>

          <DonutChart data={categoryData} totalSpent={totalSpent} />

          {/* LEGEND */}
          <View style={styles.legendContainer}>
            {categoryData.map((cat, idx) => (
              <Animated.View
                key={cat.name}
                entering={FadeInRight.springify().delay(400 + idx * 80)}
                style={styles.legendRow}
              >
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.legendText}>{cat.name}</Text>
                <Text style={styles.legendAmount}>₹{cat.amount.toFixed(0)}</Text>
                <View style={[styles.legendBadge, { backgroundColor: cat.color + '20' }]}>
                  <Text style={[styles.legendPercent, { color: cat.color }]}>{cat.percentage}%</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* BAR CHART CARD */}
        <Animated.View entering={FadeInDown.springify().delay(500)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Trends</Text>
            <View style={styles.cardBadge}>
              <Ionicons name="bar-chart" size={14} color="#6366F1" />
            </View>
          </View>
          <Text style={styles.cardSub}>Last 6 months overview</Text>

          <View style={styles.barChartContainer}>
            {monthlyTotals.map((value, index) => {
              const h = (value / maxMonthly) * barMaxH + 8;
              const isCurrentMonth = index === 5;
              return (
                <AnimatedBar
                  key={index}
                  targetHeight={h}
                  delay={600 + index * 120}
                  label={last6Months[index].label}
                  value={value}
                  isActive={isCurrentMonth}
                  color={isCurrentMonth ? '#6366F1' : '#E0E7FF'}
                  maxH={barMaxH + 8}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* SMART INSIGHTS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Smart Insights</Text>
          <Text style={styles.viewAllBtn}>View All</Text>
        </View>

        {topCategory && (
          <Animated.View entering={FadeInDown.springify().delay(700)} style={styles.insightCard}>
            <View style={[styles.insightIconBg, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="flame" size={22} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>Top Spending Category</Text>
              <Text style={styles.insightDesc}>
                <Text style={{ fontWeight: '700', color: colors.textMain }}>{topCategory.name}</Text> accounts for{' '}
                <Text style={{ fontWeight: '700', color: topCategory.color }}>{topCategory.percentage}%</Text> of your total expenses.
              </Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.springify().delay(800)} style={styles.insightCard}>
          <View style={[styles.insightIconBg, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="analytics" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>Expense Tracker</Text>
            <Text style={styles.insightDesc}>
              You've tracked <Text style={{ fontWeight: '700', color: colors.textMain }}>{expenses.length} transactions</Text> so far. Keep going!
            </Text>
          </View>
        </Animated.View>

        {monthlyTotals[5] > monthlyTotals[4] && monthlyTotals[4] > 0 && (
          <Animated.View entering={FadeInDown.springify().delay(900)} style={styles.insightCard}>
            <View style={[styles.insightIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="warning" size={22} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>Spending Alert</Text>
              <Text style={styles.insightDesc}>
                This month's spending is{' '}
                <Text style={{ fontWeight: '700', color: '#D97706' }}>
                  {Math.round(((monthlyTotals[5] - monthlyTotals[4]) / monthlyTotals[4]) * 100)}% higher
                </Text>{' '}
                than last month. Consider reviewing your budget.
              </Text>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ──────────────────────────────────────
   STYLES
   ────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSub,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#6366F1' },

  // Banner
  banner: {
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    top: -60,
    right: -40,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#A5B4FC',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  bannerDesc: {
    fontSize: 13,
    color: '#C7D2FE',
    lineHeight: 20,
  },

  // Period Filter
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  periodBtnActive: {
    backgroundColor: '#6366F1',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSub,
  },
  periodTextActive: {
    color: '#FFFFFF',
  },

  // Summary Cards
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  cardBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSub: {
    fontSize: 13,
    color: colors.textSub,
    marginBottom: 20,
  },

  // Donut
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  pieGlow: {
    position: 'absolute',
    width: PIE_SIZE - 20,
    height: PIE_SIZE - 20,
    borderRadius: (PIE_SIZE - 20) / 2,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.08)',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    width: PIE_SIZE * 0.55 - 12,
    height: PIE_SIZE * 0.55 - 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  centerIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  centerCategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  centerCategoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  donutTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  donutLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textSub,
    letterSpacing: 1,
    marginTop: 2,
  },
  donutEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  // Legend
  legendContainer: {
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSub,
    fontWeight: '500',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMain,
    marginRight: 10,
  },
  legendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Bar Chart
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    marginTop: 10,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: '100%',
    maxWidth: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    marginVertical: 6,
  },
  barFill: {
    width: '100%',
    borderRadius: 10,
  },
  barValue: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSub,
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 11,
    color: colors.textSub,
    fontWeight: '600',
  },
  barLabelActive: {
    color: '#6366F1',
    fontWeight: '700',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  viewAllBtn: {
    color: '#6366F1',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Insight Cards
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  insightIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 13,
    color: colors.textSub,
    lineHeight: 19,
  },

  emptyText: {
    color: colors.textSub,
    fontSize: 14,
    marginTop: 12,
  },
});