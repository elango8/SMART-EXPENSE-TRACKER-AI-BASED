import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const renderCard = (item) => {
    const isHighConfidence = item.confidence >= 90;
    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={24} color={colors.primary} />
          </View>
          <View style={styles.details}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.date}</Text>
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
          <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmAction(item.id)}>
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectAction(item.id)}>
            <Ionicons name="close" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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

        <View style={styles.banner}>
          <Text style={styles.bannerLabel}>INTELLIGENCE SUMMARY</Text>
          <Text style={styles.bannerTitle}>{pending.length} Pending Actions</Text>
          <Text style={styles.bannerDesc}>We've identified {pending.length} new transactions that match your recurring patterns. Verify them to update your budget.</Text>
          <Ionicons name="sparkles" size={80} color="#D1C4E9" style={styles.sparkle} />
        </View>

        {pending.map(renderCard)}
        
        {pending.length === 0 && (
          <View style={{alignItems: 'center', marginTop: 40}}>
            <Text style={{color: colors.textSub}}>No pending transactions. You're all caught up!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0DABC6' },
  
  banner: { backgroundColor: '#FCE4EC', borderRadius: 24, padding: 24, marginBottom: 30, overflow: 'hidden' },
  bannerLabel: { fontSize: 10, fontWeight: 'bold', color: '#9C27B0', letterSpacing: 1, marginBottom: 8 },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#880E4F', marginBottom: 12 },
  bannerDesc: { fontSize: 14, color: '#C2185B', lineHeight: 22, maxWidth: '90%' },
  sparkle: { position: 'absolute', right: 10, top: 70, opacity: 0.3 },

  card: { backgroundColor: colors.white, borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: {width: 0, height: 4} },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  details: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: colors.textMain, marginBottom: 4 },
  subtitle: { fontSize: 12, color: colors.textSub },
  amount: { fontSize: 18, fontWeight: 'bold', color: colors.textMain },
  
  predictionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  aiLabel: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  aiLabelText: { fontSize: 10, fontWeight: 'bold', color: colors.textSub },
  categoryText: { fontSize: 13, fontWeight: 'bold', color: colors.textMain, flex: 1 },
  confidenceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, elevation: 1, shadowOpacity: 0.05, shadowRadius: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  confidenceText: { fontSize: 11, fontWeight: 'bold', color: colors.textSub },

  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confirmBtn: { flex: 1, backgroundColor: colors.primary, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  confirmText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  editBtn: { flex: 0.7, backgroundColor: '#F3F4F6', height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  editText: { color: colors.textMain, fontWeight: 'bold', fontSize: 14 },
  rejectBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center' }
});
