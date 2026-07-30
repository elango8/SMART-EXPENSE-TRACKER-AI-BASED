import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function AppPreferencesScreen({ navigation }) {
  const { user, updatePreferences: updateContextPreferences } = useContext(AuthContext);
  const { colors, isDark, toggleTheme } = useTheme();

  // Load initial values from user preferences
  const [darkMode, setDarkMode] = useState(isDark);
  const [pushNotifs, setPushNotifs] = useState(user?.preferences?.notifications ?? true);
  const [budgetAlerts, setBudgetAlerts] = useState(user?.preferences?.budgetAlerts ?? true);
  const [isSaving, setIsSaving] = useState(false);

  // Sync from user preferences when they change
  useEffect(() => {
    if (user?.preferences) {
      setPushNotifs(user.preferences.notifications ?? true);
      setBudgetAlerts(user.preferences.budgetAlerts ?? true);
    }
  }, [user?.preferences]);

  // Sync dark mode from ThemeContext
  useEffect(() => {
    setDarkMode(isDark);
  }, [isDark]);

  // Generic preference updater with optimistic UI + rollback
  const savePreference = async (field, value, rollbackFn) => {
    try {
      setIsSaving(true);
      const payload = { [field]: value };
      await api.put('/user/preferences', payload);
      updateContextPreferences(payload);
      Alert.alert('✅ Success', 'Preference updated successfully.');
    } catch (error) {
      console.log('Error saving preference:', error);
      Alert.alert('Error', 'Failed to save preference. Please try again.');
      if (rollbackFn) rollbackFn();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDarkModeToggle = (val) => {
    // Use ThemeContext's toggleTheme which handles API + context updates
    toggleTheme(val);
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

  const items = [
    {
      icon: 'moon', label: 'Dark Mode', type: 'switch', value: darkMode, onToggle: handleDarkModeToggle,
      color: isDark ? '#A78BFA' : '#8B5CF6', bgColor: isDark ? '#2D2040' : '#F5F3FF',
    },
    {
      icon: 'notifications', label: 'Push Notifications', type: 'switch', value: pushNotifs, onToggle: handleNotificationsToggle,
      color: isDark ? '#60A5FA' : '#3B82F6', bgColor: isDark ? '#1E2D40' : '#EFF6FF',
      sub: pushNotifs ? 'Expense alerts, budget warnings, summaries' : 'All notifications disabled',
    },
    {
      icon: 'alert-circle', label: 'Budget Alerts', type: 'switch', value: budgetAlerts, onToggle: handleBudgetAlertsToggle,
      color: isDark ? '#FBBF24' : '#F59E0B', bgColor: isDark ? '#302818' : '#FEF3C7',
      sub: budgetAlerts ? 'Alerts at 80%, 90%, and 100% of budget' : 'Budget alerts disabled',
    },
  ];

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.springify().delay(50)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: colors.surface }]} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textMain }]}>App Preferences</Text>
        <View style={{ width: 40 }}>
          {isSaving && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </Animated.View>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().delay(120)} style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textSub }]}>General</Text>
          {items.map((item, idx) => (
            <Animated.View key={idx} entering={FadeInRight.springify().delay(180 + idx * 80)}>
              <TouchableOpacity
                style={[s.itemRow, { borderBottomColor: colors.border, borderBottomWidth: idx === items.length - 1 ? 0 : 1 }]}
                activeOpacity={1}
                disabled={item.type === 'switch'}
              >
                <View style={s.itemLeft}>
                  <View style={[s.itemIconBg, { backgroundColor: item.bgColor }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.itemText, { color: colors.textMain }]}>{item.label}</Text>
                    {item.sub && <Text style={[s.itemSub, { color: colors.textSub }]}>{item.sub}</Text>}
                  </View>
                </View>
                <Switch value={item.value} onValueChange={item.onToggle} trackColor={{ false: isDark ? '#3D3D4D' : '#E2E8F0', true: colors.primary }} thumbColor={'#fff'} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Current Settings Summary */}
        <Animated.View entering={FadeInDown.springify().delay(500)} style={[s.summaryCard, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF', borderColor: isDark ? '#2D3560' : '#E0E7FF' }]}>
          <View style={[s.summaryIconBg, { backgroundColor: isDark ? '#2D3560' : '#C7D2FE' }]}>
            <Ionicons name="information-circle" size={20} color={isDark ? '#818CF8' : '#6366F1'} />
          </View>
          <View style={s.summaryTextContainer}>
            <Text style={[s.summaryTitle, { color: isDark ? '#818CF8' : '#4F46E5' }]}>Current Settings</Text>
            <Text style={[s.summaryDesc, { color: isDark ? '#A5B4FC' : '#6366F1' }]}>
              Theme: {darkMode ? 'Dark' : 'Light'} • Notifications: {pushNotifs ? 'On' : 'Off'} • Budget Alerts: {budgetAlerts ? 'On' : 'Off'}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { borderRadius: 22, padding: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 14 },
  itemIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  itemText: { fontSize: 15, fontWeight: '600' },
  itemSub: { fontSize: 11, marginTop: 2 },
  itemValue: { fontSize: 14, fontWeight: 'bold' },

  // Summary card
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 16,
    borderWidth: 1,
  },
  summaryIconBg: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  summaryTextContainer: { flex: 1 },
  summaryTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  summaryDesc: { fontSize: 12, lineHeight: 18 },
});
