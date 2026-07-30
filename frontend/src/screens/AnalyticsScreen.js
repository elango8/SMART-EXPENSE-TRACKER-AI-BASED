import React, { useState, useContext, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';

import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import api from '../services/api';

const screenWidth = Dimensions.get('window').width;

/* ──────────────────────────────────────
   ANIMATED BAR COMPONENT
   ────────────────────────────────────── */
const AnimatedBar = React.memo(({ targetHeight, delay, label, value, isActive, color, maxH }) => {
  const { colors, isDark } = useTheme();
  const { formatAmount, getSymbol } = usePreferences();
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

  const formattedValue = (() => {
    const symbol = getSymbol();
    if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`;
    return `${symbol}${Math.round(value)}`;
  })();

  const handlePress = () => {
    Alert.alert(label, `Exact Spending: ${formatAmount(value)}`);
  };

  return (
    <View style={styles.barGroup}>
      <Animated.View style={animatedLabelStyle}>
        <Text style={[styles.barValue, { color: colors.textSub }]} numberOfLines={1}>
          {value > 0 ? formattedValue : ''}
        </Text>
      </Animated.View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[styles.barTrack, { height: maxH, backgroundColor: isDark ? '#252535' : '#F3F4F6' }]}
      >
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: color || (isActive ? colors.primary : (isDark ? '#2D2D3D' : '#E0E7FF')) },
            animatedBarStyle,
          ]}
        />
      </TouchableOpacity>
      <Text style={[styles.barLabel, { color: colors.textSub }, isActive && [styles.barLabelActive, { color: colors.primary }]]}>
        {label}
      </Text>
    </View>
  );
});

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
   PREMIUM PIE CHART PATH HELPER
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
  const { colors, isDark } = useTheme();
  const { formatAmount } = usePreferences();
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
        <Ionicons name="pie-chart-outline" size={48} color={isDark ? '#3D3D4D' : '#D1D5DB'} />
        <Text style={[styles.emptyText, { color: colors.textSub }]}>No expense data yet</Text>
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
        <View style={[styles.centerGlassCard, { backgroundColor: isDark ? 'rgba(30,30,42,0.95)' : 'rgba(255,255,255,0.92)', borderColor: colors.border }]}>
          {selected ? (
            <>
              <View style={[styles.centerCategoryDot, { backgroundColor: selected.color }]} />
              <Text style={[styles.centerCategoryName, { color: colors.primary }]} numberOfLines={1}>{selected.name}</Text>
              <Text style={[styles.donutTotal, { color: colors.textMain }]}>{formatAmount(selected.amount)}</Text>
              <Text style={[styles.donutLabel, { color: colors.textSub }]}>{selected.percentage}% OF TOTAL</Text>
            </>
          ) : (
            <>
              <View style={[styles.centerIconRing, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.donutTotal, { color: colors.textMain }]}>{formatAmount(totalSpent)}</Text>
              <Text style={[styles.donutLabel, { color: colors.textSub }]}>TOTAL SPENT</Text>
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
  const { colors, isDark } = useTheme();
  const { formatAmount, getSymbol } = usePreferences();

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

  // Calculate weekly trends (last 4 weeks)
  const weeklyTrends = (() => {
    const trends = [];
    const todayMs = now.getTime();
    for (let i = 3; i >= 0; i--) {
      const start = new Date(todayMs - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(todayMs - i * 7 * 24 * 60 * 60 * 1000);
      const amount = expenses
        .filter(e => {
          const d = new Date(e.date);
          return d >= start && d < end;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);
      trends.push({ label: `W-${i}`, amount, weekNum: 4 - i });
    }
    return trends;
  })();

  const maxWeeklyAmount = Math.max(...weeklyTrends.map(t => t.amount), 1);
  const chartWidth = screenWidth - 80;
  const chartHeight = 80;
  const paddingX = 20;
  const paddingY = 15;
  
  const points = weeklyTrends.map((t, idx) => {
    const x = paddingX + (idx / (weeklyTrends.length - 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (t.amount / maxWeeklyAmount) * (chartHeight - 2 * paddingY);
    return { x, y, ...t };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';



  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSub }]}>Analyzing your finances...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={[styles.logoText, { color: colors.primary }]}>Finovo</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* AI BANNER */}
        <Animated.View entering={FadeInDown.springify().delay(100)} style={[styles.banner, { backgroundColor: '#1E1B4B' }]}>
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
        <Animated.View entering={FadeInDown.springify().delay(150)} style={[styles.periodRow, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, selectedPeriod === p && [styles.periodBtnActive, { backgroundColor: colors.primary }]]}
              onPress={() => setSelectedPeriod(p)}
            >
              <Text style={[styles.periodText, { color: colors.textSub }, selectedPeriod === p && [styles.periodTextActive, { color: '#FFFFFF' }]]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* SUMMARY CARDS */}
        <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]}>  
            <View style={[styles.summaryIcon, { backgroundColor: isDark ? '#2D3560' : '#C7D2FE' }]}>
              <Ionicons name="wallet" size={18} color={isDark ? '#818CF8' : '#6366F1'} />
            </View>
            <Text style={[styles.summaryAmount, { color: isDark ? '#818CF8' : '#6366F1' }]}>{formatAmount(totalSpent)}</Text>
            <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#6366F1' }]}>Total Spent</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2D1F0E' : '#FEF3C7' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: isDark ? '#4D3520' : '#FDE68A' }]}>
              <Ionicons name="trending-up" size={18} color={isDark ? '#FBBF24' : '#D97706'} />
            </View>
            <Text style={[styles.summaryAmount, { color: isDark ? '#FBBF24' : '#D97706' }]}>{formatAmount(avgDaily)}</Text>
            <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#D97706' }]}>Avg / Day</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#0D2818' : '#D1FAE5' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: isDark ? '#1A3D25' : '#A7F3D0' }]}>
              <Ionicons name="receipt" size={18} color={isDark ? '#34D399' : '#059669'} />
            </View>
            <Text style={[styles.summaryAmount, { color: isDark ? '#34D399' : '#059669' }]}>{filteredExpenses.length}</Text>
            <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#059669' }]}>Transactions</Text>
          </View>
        </Animated.View>

        {/* DONUT CHART CARD */}
        <Animated.View entering={FadeInDown.springify().delay(300)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>Category Breakdown</Text>
            <View style={[styles.cardBadge, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]}>
              <Ionicons name="pie-chart" size={14} color={colors.primary} />
            </View>
          </View>
          <Text style={[styles.cardSub, { color: colors.textSub }]}>Where your money flows</Text>

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
                <Text style={[styles.legendText, { color: colors.textSub }]}>{cat.name}</Text>
                <Text style={[styles.legendAmount, { color: colors.textMain }]}>{formatAmount(cat.amount)}</Text>
                <View style={[styles.legendBadge, { backgroundColor: cat.color + '20' }]}>
                  <Text style={[styles.legendPercent, { color: cat.color }]}>{cat.percentage}%</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* MONTHLY TRENDS BAR CHART CARD */}
        <Animated.View entering={FadeInDown.springify().delay(450)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>Monthly Trends</Text>
            <View style={[styles.cardBadge, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]}>
              <Ionicons name="bar-chart" size={14} color={colors.primary} />
            </View>
          </View>
          <Text style={[styles.cardSub, { color: colors.textSub }]}>Last 6 months overview (Tap bars for details)</Text>

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
                  color={isCurrentMonth ? colors.primary : (isDark ? '#2D2D3D' : '#E0E7FF')}
                  maxH={barMaxH + 8}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* WEEKLY TRENDS LINE CHART */}
        {weeklyTrends.length > 0 && maxWeeklyAmount > 0 && (
          <Animated.View entering={FadeInDown.springify().delay(500)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.textMain }]}>Weekly Spending Trends</Text>
              <View style={[styles.cardBadge, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]}>
                <Ionicons name="trending-up" size={14} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.cardSub, { color: colors.textSub }]}>Overview of last 4 weeks</Text>

            <View style={{ height: 125, justifyContent: 'center', marginTop: 10 }}>
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <LinearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.35} />
                    <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                
                {/* Reference Grid */}
                <Path d={`M ${paddingX} ${paddingY} L ${chartWidth - paddingX} ${paddingY}`} stroke={isDark ? '#2A2A38' : '#F1F5F9'} strokeWidth={1} strokeDasharray="4 4" />
                <Path d={`M ${paddingX} ${chartHeight / 2} L ${chartWidth - paddingX} ${chartHeight / 2}`} stroke={isDark ? '#2A2A38' : '#F1F5F9'} strokeWidth={1} strokeDasharray="4 4" />
                <Path d={`M ${paddingX} ${chartHeight - paddingY} L ${chartWidth - paddingX} ${chartHeight - paddingY}`} stroke={isDark ? '#2A2A38' : '#F1F5F9'} strokeWidth={1} />

                {/* Filled Area */}
                {areaD ? <Path d={areaD} fill="url(#weeklyGrad)" /> : null}

                {/* Path line */}
                {pathD ? <Path d={pathD} fill="none" stroke={colors.primary} strokeWidth={3} /> : null}

                {/* Data Points */}
                {points.map((p, idx) => (
                  <Circle key={idx} cx={p.x} cy={p.y} r={4.5} fill={colors.primary} stroke="#fff" strokeWidth={1.5} />
                ))}
              </Svg>
              {/* Labels below */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: paddingX - 10, marginTop: 8 }}>
                {weeklyTrends.map((t, idx) => (
                  <TouchableOpacity key={idx} onPress={() => Alert.alert(`Week ${t.weekNum}`, `Total Spending: ${formatAmount(t.amount)}`)}>
                    <Text style={{ fontSize: 10, color: colors.textSub, textAlign: 'center', fontWeight: '600' }}>
                      Week {t.weekNum}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.textMain, textAlign: 'center', fontWeight: 'bold' }}>
                      {t.amount > 0 ? formatAmount(t.amount) : '—'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* TOP CATEGORIES RANKED LIST */}
        {categoryData.length > 0 && (
          <Animated.View entering={FadeInDown.springify().delay(600)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.textMain }]}>Top Categories Ranked</Text>
              <View style={[styles.cardBadge, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]}>
                <Ionicons name="list" size={14} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.cardSub, { color: colors.textSub }]}>Ranked by expenditure share</Text>
            
            <View style={{ gap: 14 }}>
              {categoryData.slice(0, 5).map((cat, idx) => {
                const maxCatAmount = categoryData[0]?.amount || 1;
                const relativePercent = Math.round((cat.amount / maxCatAmount) * 100);
                return (
                  <View key={cat.name}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 13, color: colors.textMain, fontWeight: '700' }}>
                          {idx + 1}. {cat.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textSub, fontWeight: '500' }}>
                          ({cat.percentage}%)
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, color: colors.textMain, fontWeight: 'bold' }}>
                        {formatAmount(cat.amount)}
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: isDark ? '#2D2D3D' : '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ width: `${relativePercent}%`, height: '100%', backgroundColor: cat.color, borderRadius: 3 }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}


        {/* SMART INSIGHTS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Smart Insights</Text>
          <Text style={[styles.viewAllBtn, { color: colors.primary }]}>View All</Text>
        </View>

        {topCategory && (
          <Animated.View entering={FadeInDown.springify().delay(700)} style={[styles.insightCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
            <View style={[styles.insightIconBg, { backgroundColor: isDark ? '#2D1518' : '#FEE2E2' }]}>
              <Ionicons name="flame" size={22} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textMain }]}>Top Spending Category</Text>
              <Text style={[styles.insightDesc, { color: colors.textSub }]}>
                <Text style={{ fontWeight: '700', color: colors.textMain }}>{topCategory.name}</Text> accounts for{' '}
                <Text style={{ fontWeight: '700', color: topCategory.color }}>{topCategory.percentage}%</Text> of your total expenses.
              </Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.springify().delay(800)} style={[styles.insightCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
          <View style={[styles.insightIconBg, { backgroundColor: isDark ? '#1E2340' : '#DBEAFE' }]}>
            <Ionicons name="analytics" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.insightTitle, { color: colors.textMain }]}>Expense Tracker</Text>
            <Text style={[styles.insightDesc, { color: colors.textSub }]}>
              You've tracked <Text style={{ fontWeight: '700', color: colors.textMain }}>{expenses.length} transactions</Text> so far. Keep going!
            </Text>
          </View>
        </Animated.View>

        {monthlyTotals[5] > monthlyTotals[4] && monthlyTotals[4] > 0 && (
          <Animated.View entering={FadeInDown.springify().delay(900)} style={[styles.insightCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
            <View style={[styles.insightIconBg, { backgroundColor: isDark ? '#2D1F0E' : '#FEF3C7' }]}>
              <Ionicons name="warning" size={22} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textMain }]}>Spending Alert</Text>
              <Text style={[styles.insightDesc, { color: colors.textSub }]}>
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
  periodBtnActive: {},
  periodText: {
    fontSize: 13,
    fontWeight: '600',
  },
  periodTextActive: {},

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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Cards
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    borderWidth: 1,
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
  },
  cardBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSub: {
    fontSize: 13,
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
    borderRadius: 999,
    width: PIE_SIZE * 0.55 - 12,
    height: PIE_SIZE * 0.55 - 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
  },
  centerIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  donutTotal: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  donutLabel: {
    fontSize: 8,
    fontWeight: 'bold',
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
    fontWeight: '500',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  barLabelActive: {
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
  },
  viewAllBtn: {
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Insight Cards
  insightCard: {
    flexDirection: 'row',
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
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 13,
    lineHeight: 19,
  },

  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});