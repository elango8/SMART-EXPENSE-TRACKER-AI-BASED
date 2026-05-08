import React, { useState, useContext, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInRight, useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AnimatedBar = ({ targetHeight, delay, label, isActive }) => {
  const height = useSharedValue(0);
  
  useEffect(() => {
    height.value = withDelay(delay, withTiming(targetHeight, { duration: 1000 }));
  }, [targetHeight, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <View style={styles.barGroup}>
      <Animated.View style={[isActive ? styles.barActive : styles.bar, animatedStyle]} />
      <Text style={isActive ? styles.barLabelActive : styles.barLabel}>{label}</Text>
    </View>
  );
};


export default function AnalyticsScreen() {
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = async () => {
    if (!user?._id) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/expenses/${user._id}`);
      setExpenses(res.data);
    } catch (error) {
      console.log('Error fetching expenses for analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [user])
  );

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  
  const categoryMap = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});
  
  const categoryData = Object.keys(categoryMap)
    .map(key => ({
      name: key,
      amount: categoryMap[key],
      percentage: totalSpent > 0 ? Math.round((categoryMap[key] / totalSpent) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const chartColors = [colors.primary, '#FF4C4C', '#00BCD4', '#FFD166', '#9C27B0', '#4CAF50', '#FF9800'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Finovo</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.banner}>
          <Text style={styles.bannerLabel}><Ionicons name="sparkles" size={12}/> INTELLIGENCE PULSE</Text>
          <Text style={styles.bannerTitle}>Your wealth is <Text style={{color: colors.primary}}>evolving</Text> today.</Text>
          <Text style={styles.bannerDesc}>Our AI analyzed 42 new transactions. Your savings rate is trending 12% higher than last month.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Category Breakdown</Text>
            <Ionicons name="pie-chart-outline" size={20} color={colors.textSub} />
          </View>
          <Text style={styles.cardSub}>Where your money flows</Text>
          
          <View style={styles.chartContainer}>
            <View style={styles.donutPlaceholder}>
              <Text style={styles.donutValue}>₹ {totalSpent.toFixed(2)}</Text>
              <Text style={styles.donutLabel}>TOTAL SPENT</Text>
            </View>
          </View>

          <View style={styles.legendContainer}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : expenses.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.textSub }}>No expenses yet</Text>
            ) : (
              categoryData.map((cat, idx) => (
                <Animated.View key={cat.name} entering={FadeInRight.springify().delay(300 + idx * 100)} style={styles.legendRow}>
                  <View style={[styles.legendColor, {backgroundColor: chartColors[idx % chartColors.length]}]} />
                  <Text style={styles.legendText}>{cat.name}</Text>
                  <Text style={styles.legendValue}>{cat.percentage}%</Text>
                </Animated.View>
              ))
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(400)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Trends</Text>
            <Ionicons name="bar-chart-outline" size={20} color={colors.textSub} />
          </View>
          <Text style={styles.cardSub}>Last 6 months</Text>
          
          <View style={styles.barChartPlaceholder}>
             <AnimatedBar targetHeight={30} delay={400} label="JAN" />
             <AnimatedBar targetHeight={50} delay={500} label="FEB" />
             <AnimatedBar targetHeight={40} delay={600} label="MAR" />
             <AnimatedBar targetHeight={60} delay={700} label="APR" />
             <AnimatedBar targetHeight={35} delay={800} label="MAY" />
             <AnimatedBar targetHeight={70} delay={900} label="JUN" isActive={true} />
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Smart Insights</Text>
          <Text style={styles.viewAllBtn}>View All</Text>
        </View>

        <Animated.View entering={FadeInDown.springify().delay(600)} style={styles.insightBox}>
          <View style={[styles.insightIcon, {backgroundColor: '#FFF0F0'}]}><Ionicons name="trending-up" size={20} color="#FF4C4C"/></View>
          <View style={{flex: 1}}>
            <Text style={styles.insightTitleText}>You spent 30% more this week</Text>
            <Text style={styles.insightDescText}>Your weekend entertainment was the primary driver of this increase.</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(700)} style={styles.insightBoxBlue}>
          <View style={[styles.insightIcon, {backgroundColor: '#E6F0FF'}]}><Ionicons name="bag-handle" size={20} color={colors.primary}/></View>
          <View style={{flex: 1}}>
            <Text style={styles.insightTitleText}>Shopping is your highest expense</Text>
            <Text style={styles.insightDescText}>You've visited 4 retail stores this week, totaling $840 in transactions.</Text>
          </View>
        </Animated.View>

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0DABC6' },
  
  banner: { backgroundColor: '#F3E5F5', borderRadius: 24, padding: 24, marginBottom: 20 },
  bannerLabel: { fontSize: 10, fontWeight: 'bold', color: '#9C27B0', letterSpacing: 1, marginBottom: 8 },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#6A1B9A', marginBottom: 12 },
  bannerDesc: { fontSize: 14, color: '#8E24AA', lineHeight: 22 },

  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: {height: 4} },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMain },
  cardSub: { fontSize: 13, color: colors.textSub, marginBottom: 24 },

  chartContainer: { alignItems: 'center', marginBottom: 30 },
  donutPlaceholder: { width: 160, height: 160, borderRadius: 80, borderWidth: 20, borderColor: '#F0F0F0', borderLeftColor: colors.primary, borderTopColor: '#FF4C4C', alignItems: 'center', justifyContent: 'center' },
  donutValue: { fontSize: 20, fontWeight: 'bold', color: colors.textMain },
  donutLabel: { fontSize: 10, color: colors.textSub, fontWeight: 'bold' },

  legendContainer: { width: '100%' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  legendColor: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  legendText: { flex: 1, fontSize: 14, color: colors.textSub },
  legendValue: { fontSize: 14, fontWeight: 'bold', color: colors.textMain },

  barChartPlaceholder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, marginTop: 10, paddingHorizontal: 10 },
  barGroup: { alignItems: 'center' },
  bar: { width: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginBottom: 8 },
  barActive: { width: 8, backgroundColor: colors.primary, borderRadius: 4, marginBottom: 8 },
  barLabel: { fontSize: 10, color: colors.textSub, fontWeight: 'bold' },
  barLabelActive: { fontSize: 10, color: colors.primary, fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMain },
  viewAllBtn: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },

  insightBox: { flexDirection: 'row', backgroundColor: '#FFF5F5', borderRadius: 20, padding: 20, marginBottom: 16 },
  insightBoxBlue: { flexDirection: 'row', backgroundColor: '#F0F5FF', borderRadius: 20, padding: 20, marginBottom: 16 },
  insightIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  insightTitleText: { fontSize: 14, fontWeight: 'bold', color: colors.textMain, marginBottom: 6 },
  insightDescText: { fontSize: 13, color: colors.textSub, lineHeight: 20 }
});
