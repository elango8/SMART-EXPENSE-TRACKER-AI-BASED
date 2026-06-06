import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export default function AppPreferencesScreen({ navigation }) {
  const { user, updatePreferences: updateContextPreferences } = useContext(AuthContext);

  // Load initial values from user preferences
  const [darkMode, setDarkMode] = useState(user?.preferences?.theme === 'dark');
  const [pushNotifs, setPushNotifs] = useState(user?.preferences?.notifications ?? true);
  const [budgetAlerts, setBudgetAlerts] = useState(user?.preferences?.budgetAlerts ?? true);
  const [currency, setCurrency] = useState(user?.preferences?.currency || 'INR');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync from user preferences when they change
  useEffect(() => {
    if (user?.preferences) {
      setDarkMode(user.preferences.theme === 'dark');
      setPushNotifs(user.preferences.notifications ?? true);
      setBudgetAlerts(user.preferences.budgetAlerts ?? true);
      setCurrency(user.preferences.currency || 'INR');
    }
  }, [user?.preferences]);

  // Generic preference updater with optimistic UI + rollback
  const savePreference = async (field, value, rollbackFn) => {
    try {
      setIsSaving(true);
      const payload = { [field]: value };
      await api.put('/user/preferences', payload);
      updateContextPreferences(payload);
    } catch (error) {
      console.log('Error saving preference:', error);
      Alert.alert('Error', 'Failed to save preference. Please try again.');
      if (rollbackFn) rollbackFn();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDarkModeToggle = (val) => {
    const prevVal = darkMode;
    setDarkMode(val);
    savePreference('theme', val ? 'dark' : 'light', () => setDarkMode(prevVal));
  };

  const handleNotificationsToggle = (val) => {
    const prevVal = pushNotifs;
    setPushNotifs(val);
    savePreference('notifications', val, () => setPushNotifs(prevVal));
  };

  const handleBudgetAlertsToggle = (val) => {
    const prevVal = budgetAlerts;
    setBudgetAlerts(val);
    savePreference('budgetAlerts', val, () => setBudgetAlerts(prevVal));
  };

  const handleCurrencySelect = (code) => {
    const prevVal = currency;
    setCurrency(code);
    setShowCurrencyModal(false);
    savePreference('currency', code, () => setCurrency(prevVal));
  };

  const items = [
    { icon: 'moon', label: 'Dark Mode', type: 'switch', value: darkMode, onToggle: handleDarkModeToggle, color: '#8B5CF6', bgColor: '#F5F3FF' },
    { icon: 'notifications', label: 'Push Notifications', type: 'switch', value: pushNotifs, onToggle: handleNotificationsToggle, color: '#3B82F6', bgColor: '#EFF6FF' },
    { icon: 'alert-circle', label: 'Budget Alerts', type: 'switch', value: budgetAlerts, onToggle: handleBudgetAlertsToggle, color: '#F59E0B', bgColor: '#FEF3C7' },
    { icon: 'cash', label: 'Currency', type: 'nav', rightText: currency, color: '#10B981', bgColor: '#ECFDF5', onPress: () => setShowCurrencyModal(true) },
  ];

  const currentCurrency = CURRENCIES.find(c => c.code === currency);

  return (
    <SafeAreaView style={s.safeArea}>
      <Animated.View entering={FadeInDown.springify().delay(50)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>App Preferences</Text>
        <View style={{ width: 40 }}>
          {isSaving && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </Animated.View>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().delay(120)} style={s.section}>
          <Text style={s.sectionTitle}>General</Text>
          {items.map((item, idx) => (
            <Animated.View key={idx} entering={FadeInRight.springify().delay(180 + idx * 80)}>
              <TouchableOpacity
                style={s.itemRow}
                activeOpacity={item.type === 'nav' ? 0.7 : 1}
                onPress={item.onPress}
                disabled={item.type === 'switch'}
              >
                <View style={s.itemLeft}>
                  <View style={[s.itemIconBg, { backgroundColor: item.bgColor }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={s.itemText}>{item.label}</Text>
                </View>
                {item.type === 'switch' ? (
                  <Switch value={item.value} onValueChange={item.onToggle} trackColor={{ false: '#E2E8F0', true: colors.primary }} thumbColor={'#fff'} />
                ) : (
                  <TouchableOpacity onPress={item.onPress} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={s.itemValue}>{item.rightText}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSub} style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Current Settings Summary */}
        <Animated.View entering={FadeInDown.springify().delay(500)} style={s.summaryCard}>
          <View style={s.summaryIconBg}>
            <Ionicons name="information-circle" size={20} color="#6366F1" />
          </View>
          <View style={s.summaryTextContainer}>
            <Text style={s.summaryTitle}>Current Settings</Text>
            <Text style={s.summaryDesc}>
              Theme: {darkMode ? 'Dark' : 'Light'} • Currency: {currentCurrency?.symbol || '₹'} {currency} • Notifications: {pushNotifs ? 'On' : 'Off'} • Budget Alerts: {budgetAlerts ? 'On' : 'Off'}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Select Currency</Text>
            <Text style={s.modalSubtitle}>Choose your preferred currency for displaying amounts</Text>

            {CURRENCIES.map((c, idx) => (
              <TouchableOpacity
                key={c.code}
                style={[
                  s.currencyItem,
                  currency === c.code && s.currencyItemActive,
                ]}
                onPress={() => handleCurrencySelect(c.code)}
                activeOpacity={0.7}
              >
                <View style={[s.currencySymbolBg, currency === c.code && { backgroundColor: '#C7D2FE' }]}>
                  <Text style={[s.currencySymbol, currency === c.code && { color: '#4F46E5' }]}>{c.symbol}</Text>
                </View>
                <View style={s.currencyInfo}>
                  <Text style={[s.currencyCode, currency === c.code && { color: '#4F46E5' }]}>{c.code}</Text>
                  <Text style={s.currencyName}>{c.name}</Text>
                </View>
                {currency === c.code && (
                  <View style={s.currencyCheck}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textMain },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { backgroundColor: '#fff', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: '#F0F1F3', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textSub, textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  itemText: { fontSize: 15, color: colors.textMain, fontWeight: '600' },
  itemValue: { fontSize: 14, color: colors.textSub, fontWeight: 'bold' },

  // Summary card
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF2FF', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#E0E7FF',
  },
  summaryIconBg: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#C7D2FE',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  summaryTextContainer: { flex: 1 },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#4F46E5', marginBottom: 4 },
  summaryDesc: { fontSize: 12, color: '#6366F1', lineHeight: 18 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textMain, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: colors.textSub, marginBottom: 20 },
  currencyItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#F0F1F3',
  },
  currencyItemActive: {
    backgroundColor: '#EEF2FF', borderColor: '#C7D2FE',
  },
  currencySymbolBg: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  currencySymbol: { fontSize: 20, fontWeight: '700', color: colors.textMain },
  currencyInfo: { flex: 1 },
  currencyCode: { fontSize: 16, fontWeight: '700', color: colors.textMain, marginBottom: 2 },
  currencyName: { fontSize: 12, color: colors.textSub },
  currencyCheck: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
  },
});
