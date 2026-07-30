import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useTransactionDetection } from '../context/TransactionDetectionContext';

const PRIVACY_ITEMS = [
  {
    icon: 'shield-checkmark',
    color: '#10B981',
    title: 'Local Processing',
    desc: 'Transaction data is processed on your device. Raw SMS content is never stored permanently.',
  },
  {
    icon: 'eye-off',
    color: '#3B82F6',
    title: 'Privacy First',
    desc: 'We only extract financial transaction details. OTPs, personal messages, and promotions are ignored.',
  },
  {
    icon: 'checkmark-circle',
    color: '#8B5CF6',
    title: 'Your Confirmation Required',
    desc: 'No expense is saved automatically. You review and confirm every detected transaction.',
  },
  {
    icon: 'trash-bin',
    color: '#F59E0B',
    title: 'Structured Data Only',
    desc: 'Only amount, merchant, category, and date are stored — never the raw message text.',
  },
];

const FEATURES = [
  {
    icon: 'chatbubble-ellipses',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    title: 'SMS Detection',
    desc: 'Reads incoming bank SMS messages to detect debits, credits, and UPI payments.',
    permKey: 'sms',
  },
  {
    icon: 'notifications',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    title: 'Notification Detection',
    desc: 'Monitors payment app notifications (Google Pay, PhonePe, Paytm, Amazon Pay).',
    permKey: 'notification',
  },
];

export default function TransactionPermissionScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { enableDetection, isDetectionEnabled } = useTransactionDetection();

  const [smsEnabled, setSmsEnabled] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const handleContinue = () => {
    if (smsEnabled || notifEnabled) {
      enableDetection();
    }
    navigation.goBack();
  };

  const anyEnabled = smsEnabled || notifEnabled;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.springify().delay(50)} style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textMain }]}>Auto Detection</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.springify().delay(100)}>
          <View style={styles.heroCard}>
            {/* Background decoration */}
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />

            <Animated.View entering={ZoomIn.springify().delay(200)} style={styles.heroIconWrap}>
              <View style={styles.heroIconInner}>
                <Ionicons name="scan" size={28} color="#fff" />
              </View>
            </Animated.View>

            <Text style={styles.heroTitle}>Smart Transaction{'\n'}Detection</Text>
            <Text style={styles.heroDesc}>
              Automatically detect expenses from your bank SMS messages and payment app notifications.
            </Text>

            {isDetectionEnabled && (
              <View style={styles.activeIndicator}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Detection Active</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Feature Toggles */}
        <Animated.View entering={FadeInDown.springify().delay(200)}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Permissions Required</Text>
          <Text style={[styles.sectionDesc, { color: colors.textSub }]}>
            Enable the detection methods you'd like to use:
          </Text>

          {FEATURES.map((feature, idx) => (
            <Animated.View key={feature.permKey} entering={FadeInDown.springify().delay(300 + idx * 100)}>
              <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.featureIconBg, { backgroundColor: isDark ? feature.color + '20' : feature.bgColor }]}>
                  <Ionicons name={feature.icon} size={22} color={feature.color} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={[styles.featureTitle, { color: colors.textMain }]}>{feature.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.textSub }]}>{feature.desc}</Text>
                </View>
                <Switch
                  value={feature.permKey === 'sms' ? smsEnabled : notifEnabled}
                  onValueChange={(val) => {
                    if (feature.permKey === 'sms') setSmsEnabled(val);
                    else setNotifEnabled(val);
                  }}
                  trackColor={{ false: isDark ? '#333' : '#E5E7EB', true: feature.color + '50' }}
                  thumbColor={
                    (feature.permKey === 'sms' ? smsEnabled : notifEnabled)
                      ? feature.color
                      : isDark ? '#666' : '#fff'
                  }
                  ios_backgroundColor={isDark ? '#333' : '#E5E7EB'}
                />
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Privacy Guarantees */}
        <Animated.View entering={FadeInDown.springify().delay(500)}>
          <Text style={[styles.sectionTitle, { color: colors.textMain, marginTop: 28 }]}>
            Privacy Guarantees
          </Text>

          <View style={[styles.privacyCard, { backgroundColor: isDark ? '#0D2818' : '#F0FDF4', borderColor: isDark ? '#1A3D25' : '#BBF7D0' }]}>
            {PRIVACY_ITEMS.map((item, idx) => (
              <Animated.View key={idx} entering={FadeInDown.springify().delay(600 + idx * 80)}>
                <View style={[styles.privacyItem, idx < PRIVACY_ITEMS.length - 1 && styles.privacyItemBorder]}>
                  <View style={[styles.privacyIconBg, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={styles.privacyInfo}>
                    <Text style={[styles.privacyTitle, { color: colors.textMain }]}>{item.title}</Text>
                    <Text style={[styles.privacyDesc, { color: colors.textSub }]}>{item.desc}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* What We Collect */}
        <Animated.View entering={FadeInDown.springify().delay(800)}>
          <Text style={[styles.sectionTitle, { color: colors.textMain, marginTop: 28 }]}>
            What Data Is Collected
          </Text>

          <View style={[styles.dataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { label: 'Amount', value: '₹500', icon: 'cash' },
              { label: 'Merchant', value: 'Amazon', icon: 'storefront' },
              { label: 'Category', value: 'Shopping', icon: 'pricetag' },
              { label: 'Date & Time', value: 'Jun 18, 6:00 PM', icon: 'calendar' },
              { label: 'Reference', value: 'UPI123456', icon: 'document-text' },
            ].map((item, idx) => (
              <View key={idx} style={[styles.dataRow, idx < 4 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.dataLeft}>
                  <Ionicons name={item.icon} size={16} color={colors.primary} style={{ marginRight: 10 }} />
                  <Text style={[styles.dataLabel, { color: colors.textSub }]}>{item.label}</Text>
                </View>
                <Text style={[styles.dataValue, { color: colors.textMain }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View entering={FadeInUp.springify().delay(900)}>
          <TouchableOpacity
            style={[styles.continueBtn, anyEnabled ? {} : styles.continueBtnDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <View style={styles.continueBtnInner}>
              <Ionicons
                name={anyEnabled ? 'shield-checkmark' : 'lock-closed'}
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.continueBtnText}>
                {anyEnabled ? 'Enable & Continue' : 'Skip for Now'}
              </Text>
            </View>
          </TouchableOpacity>

          {!anyEnabled && (
            <Text style={[styles.skipHint, { color: colors.textSub }]}>
              You can enable detection later from Settings
            </Text>
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 60 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Hero
  heroCard: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 28,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.15)', right: -60, top: -40,
  },
  heroCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(99, 102, 241, 0.1)', left: -40, bottom: -30,
  },
  heroIconWrap: {
    marginBottom: 16,
  },
  heroIconInner: {
    width: 56, height: 56, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24, fontWeight: '800', color: '#fff',
    textAlign: 'center', lineHeight: 32, marginBottom: 12,
  },
  heroDesc: {
    fontSize: 14, color: '#C7D2FE',
    textAlign: 'center', lineHeight: 22, maxWidth: '90%',
  },
  activeIndicator: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginTop: 16,
  },
  activeDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#10B981', marginRight: 8,
  },
  activeText: {
    color: '#34D399', fontSize: 12, fontWeight: '700',
  },

  // Section titles
  sectionTitle: {
    fontSize: 17, fontWeight: '700', marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13, marginBottom: 16, lineHeight: 20,
  },

  // Feature cards
  featureCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1,
  },
  featureIconBg: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  featureInfo: {
    flex: 1, marginRight: 12,
  },
  featureTitle: {
    fontSize: 15, fontWeight: '700', marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12, lineHeight: 18,
  },

  // Privacy card
  privacyCard: {
    borderRadius: 18, padding: 16, borderWidth: 1,
  },
  privacyItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 12,
  },
  privacyItemBorder: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  privacyIconBg: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  privacyInfo: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 14, fontWeight: '700', marginBottom: 2,
  },
  privacyDesc: {
    fontSize: 12, lineHeight: 18,
  },

  // Data card
  dataCard: {
    borderRadius: 18, padding: 4, borderWidth: 1,
  },
  dataRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  dataLeft: {
    flexDirection: 'row', alignItems: 'center',
  },
  dataLabel: {
    fontSize: 13, fontWeight: '600',
  },
  dataValue: {
    fontSize: 13, fontWeight: '700',
  },

  // Continue button
  continueBtn: {
    backgroundColor: '#1E1B4B',
    borderRadius: 18, height: 56,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 28,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueBtnDisabled: {
    backgroundColor: '#6B7280',
    shadowColor: '#6B7280',
  },
  continueBtnInner: {
    flexDirection: 'row', alignItems: 'center',
  },
  continueBtnText: {
    color: '#fff', fontSize: 16, fontWeight: '700',
  },
  skipHint: {
    textAlign: 'center', fontSize: 12, marginTop: 12,
  },
});
