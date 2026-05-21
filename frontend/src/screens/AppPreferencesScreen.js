import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { colors } from '../theme/colors';

export default function AppPreferencesScreen({ navigation }) {
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [currency, setCurrency] = useState('USD');

  const items = [
    { icon: 'moon', label: 'Dark Mode', type: 'switch', value: darkMode, onToggle: setDarkMode, color: '#8B5CF6', bgColor: '#F5F3FF' },
    { icon: 'notifications', label: 'Push Notifications', type: 'switch', value: pushNotifs, onToggle: setPushNotifs, color: '#3B82F6', bgColor: '#EFF6FF' },
    { icon: 'cash', label: 'Currency', type: 'nav', rightText: currency, color: '#10B981', bgColor: '#ECFDF5' },
    { icon: 'language', label: 'Language', type: 'nav', rightText: 'English', color: '#F59E0B', bgColor: '#FEF3C7' },
  ];

  return (
    <SafeAreaView style={s.safeArea}>
      <Animated.View entering={FadeInDown.springify().delay(50)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>App Preferences</Text>
        <View style={{ width: 40 }} />
      </Animated.View>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().delay(120)} style={s.section}>
          <Text style={s.sectionTitle}>General</Text>
          {items.map((item, idx) => (
            <Animated.View key={idx} entering={FadeInRight.springify().delay(180 + idx * 80)}>
              <TouchableOpacity style={s.itemRow} activeOpacity={item.type === 'nav' ? 0.7 : 1}>
                <View style={s.itemLeft}>
                  <View style={[s.itemIconBg, { backgroundColor: item.bgColor }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={s.itemText}>{item.label}</Text>
                </View>
                {item.type === 'switch' ? (
                  <Switch value={item.value} onValueChange={item.onToggle} trackColor={{ false: '#E2E8F0', true: colors.primary }} thumbColor={'#fff'} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={s.itemValue}>{item.rightText}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSub} style={{ marginLeft: 8 }} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
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
  section: { backgroundColor: '#fff', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: '#F0F1F3', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textSub, textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  itemText: { fontSize: 15, color: colors.textMain, fontWeight: '600' },
  itemValue: { fontSize: 14, color: colors.textSub, fontWeight: 'bold' },
});
