import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, FadeInUp, ZoomIn, SlideOutRight } from 'react-native-reanimated';
import { colors } from '../theme/colors';

export default function PendingConfirmationsScreen({ navigation }) {
  const [pending, setPending] = useState([
    { id: '1', title: 'Blue Bottle Coffee', category: 'Drinks', date: 'Today, 08:45 AM', amount: 300, confidence: 92, icon: 'cafe-outline', bg: '#E3F2FD' },
    { id: '2', title: 'Consolidated Edison', category: 'Utilities', date: 'Yesterday, 02:30 PM', amount: 3423, confidence: 98, icon: 'flash-outline', bg: '#E0F7FA' },
    { id: '3', title: 'Flipkart', category: 'Apparel', date: 'Nov 12, 06:12 PM', amount: 325, confidence: 74, icon: 'shirt-outline', bg: '#FCE4EC' },
  ]);

  const confirmAction = (id) => {
    setPending(pending.filter(item => item.id !== id));
  };
  const rejectAction = (id) => {
    setPending(pending.filter(item => item.id !== id));
  };

  const renderCard = (item, index) => {
    const isHighConfidence = item.confidence >= 90;
    return (
      <Animated.View
        key={item.id}
        entering={FadeInRight.springify().delay(300 + index * 120)}
        exiting={SlideOutRight.springify()}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Animated.View entering={ZoomIn.springify().delay(350 + index * 120)}>
              <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={24} color={colors.primary} />
              </View>
            </Animated.View>
            <View style={styles.details}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.dateRow}>
                <Ionicons name="time-outline" size={12} color={colors.textSub} style={{ marginRight: 4 }} />
                <Text style={styles.subtitle}>{item.date}</Text>
              </View>
            </View>
            <Text style={styles.amount}>- ₹{item.amount}</Text>
          </View>

          <View style={styles.predictionRow}>
            <View style={styles.aiLabel}>
              <Ionicons name="hardware-chip-outline" size={14} color={colors.textSub} style={{marginRight:4}} />
              <Text style={styles.aiLabelText}>AI PREDICTED</Text>
            </View>
            <Text style={styles.categoryText}>{item.category}</Text>
            <View style={styles.confidenceBadge}>
              <View style={[styles.dot, { backgroundColor: isHighConfidence ? colors.success : colors.warning }]} />
              <Text style={styles.confidenceText}>{item.confidence}% confidence</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmAction(item.id)} activeOpacity={0.8}>
              <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={16} color={colors.textMain} style={{ marginRight: 6 }} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectAction(item.id)} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.springify().delay(50)} style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Finovo</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Banner */}
        <Animated.View entering={FadeInDown.springify().delay(120)} style={styles.banner}>
          <View style={styles.bannerGlow} />
          <Text style={styles.bannerLabel}>INTELLIGENCE SUMMARY</Text>
          <Text style={styles.bannerTitle}>{pending.length} Pending Actions</Text>
          <Text style={styles.bannerDesc}>We've identified {pending.length} new transactions that match your recurring patterns. Verify them to update your budget.</Text>
          <Ionicons name="sparkles" size={80} color="rgba(255,255,255,0.15)" style={styles.sparkle} />
        </Animated.View>

        {pending.map((item, idx) => renderCard(item, idx))}
        
        {pending.length === 0 && (
          <Animated.View entering={FadeInUp.springify()} style={styles.emptyState}>
            <Animated.View entering={ZoomIn.springify()}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
              </View>
            </Animated.View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyDesc}>No pending transactions to review.</Text>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, paddingBottom: 60 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 6,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0DABC6' },
  notifBtn: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  
  banner: {
    backgroundColor: '#1E1B4B', borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(139, 92, 246, 0.15)', top: -60, right: -40,
  },
  bannerLabel: { fontSize: 10, fontWeight: 'bold', color: '#A5B4FC', letterSpacing: 1.5, marginBottom: 8 },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  bannerDesc: { fontSize: 13, color: '#C7D2FE', lineHeight: 20, maxWidth: '90%' },
  sparkle: { position: 'absolute', right: 10, top: 70 },

  card: {
    backgroundColor: '#fff', borderRadius: 22, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#F0F1F3',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  details: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textMain, marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  subtitle: { fontSize: 12, color: colors.textSub },
  amount: { fontSize: 18, fontWeight: 'bold', color: colors.textMain },
  
  predictionRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: '#F0F1F3',
  },
  aiLabel: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  aiLabelText: { fontSize: 10, fontWeight: 'bold', color: colors.textSub },
  categoryText: { fontSize: 13, fontWeight: 'bold', color: colors.textMain, flex: 1 },
  confidenceBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#F0F1F3',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  confidenceText: { fontSize: 11, fontWeight: 'bold', color: colors.textSub },

  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  confirmBtn: {
    flex: 1, flexDirection: 'row', backgroundColor: colors.primary, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  editBtn: {
    flex: 0.7, flexDirection: 'row', backgroundColor: '#F3F4F6', height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  editText: { color: colors.textMain, fontWeight: '700', fontSize: 14 },
  rejectBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textMain, marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: colors.textSub },
});
