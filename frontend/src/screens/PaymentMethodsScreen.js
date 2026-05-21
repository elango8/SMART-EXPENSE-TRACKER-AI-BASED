import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { colors } from '../theme/colors';

export default function PaymentMethodsScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safeArea}>
      <Animated.View entering={FadeInDown.springify().delay(50)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </Animated.View>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Credit Card */}
        <Animated.View entering={FadeInDown.springify().delay(120)} style={s.cardItem}>
          <View style={s.cardDecor1} />
          <View style={s.cardDecor2} />
          <View style={s.cardHeader}>
            <Animated.View entering={ZoomIn.springify().delay(200)}>
              <View style={s.cardIconBg}>
                <Ionicons name="card" size={24} color="#3B82F6" />
              </View>
            </Animated.View>
            <Text style={s.cardType}>Credit Card</Text>
          </View>
          <Text style={s.cardNumber}>**** **** **** 4821</Text>
          <Text style={s.cardHolder}>Elango</Text>
        </Animated.View>

        {/* Apple Pay */}
        <Animated.View entering={FadeInDown.springify().delay(250)} style={[s.cardItem, s.darkCard]}>
          <View style={[s.cardDecor1, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
          <View style={[s.cardDecor2, { backgroundColor: 'rgba(255,255,255,0.03)' }]} />
          <View style={s.cardHeader}>
            <Animated.View entering={ZoomIn.springify().delay(320)}>
              <View style={[s.cardIconBg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Ionicons name="logo-apple" size={24} color="#fff" />
              </View>
            </Animated.View>
            <Text style={[s.cardType, { color: '#fff' }]}>Apple Pay</Text>
          </View>
          <Text style={[s.cardNumber, { color: '#aaa' }]}>Linked to elangofinovo@gmail.com</Text>
        </Animated.View>

        {/* Add Button */}
        <Animated.View entering={FadeInUp.springify().delay(400)}>
          <TouchableOpacity style={s.addBtn} activeOpacity={0.7}>
            <View style={s.addIconBg}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </View>
            <Text style={s.addBtnText}>Add New Payment Method</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textMain },
  container: { paddingHorizontal: 20, paddingBottom: 40 },

  cardItem: { backgroundColor: '#fff', borderRadius: 22, padding: 24, marginBottom: 16, minHeight: 160, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F1F3', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  darkCard: { backgroundColor: '#1A1A2E', borderColor: '#2A2A4A' },
  cardDecor1: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(59,130,246,0.06)', right: -40, top: -30 },
  cardDecor2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(59,130,246,0.04)', left: -20, bottom: -20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cardIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  cardType: { fontSize: 16, fontWeight: '700', color: colors.textMain },
  cardNumber: { fontSize: 20, fontWeight: 'bold', color: colors.textMain, letterSpacing: 2, marginBottom: 10 },
  cardHolder: { fontSize: 13, color: colors.textSub, textTransform: 'uppercase', fontWeight: '600' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 22, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', backgroundColor: '#F0F7FF' },
  addIconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 }
});
