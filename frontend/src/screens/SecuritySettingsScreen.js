import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

export default function SecuritySettingsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [faceId, setFaceId] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const securityItems = [
    { icon: 'scan', label: 'Face ID / Biometrics', sub: 'Quick login', type: 'switch', value: faceId, onToggle: setFaceId, color: '#3B82F6', bgColor: '#EFF6FF' },
    { icon: 'keypad', label: '2-Step Verification', sub: 'Extra layer of security', type: 'switch', value: twoFactor, onToggle: setTwoFactor, color: '#8B5CF6', bgColor: '#F5F3FF' },
    { icon: 'lock-closed', label: 'Change Password', sub: null, type: 'nav', color: '#10B981', bgColor: '#ECFDF5' },
  ];
 // settings preference page
  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.springify().delay(50)} style={s.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[s.backBtn, { backgroundColor: colors.surface, shadowColor: isDark ? '#000' : '#000', shadowOpacity: isDark ? 0.3 : 0.06 }]} 
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textMain }]}>Security</Text>
        <View style={{ width: 40 }} />
      </Animated.View>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().delay(120)} style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {securityItems.map((item, idx) => {
            const itemBgColor = isDark ? (item.color + '20') : item.bgColor;
            return (
              <Animated.View key={idx} entering={FadeInRight.springify().delay(180 + idx * 80)}>
                <TouchableOpacity 
                  style={[s.itemRow, { borderBottomColor: colors.border, borderBottomWidth: idx === securityItems.length - 1 ? 0 : 1 }]} 
                  activeOpacity={item.type === 'nav' ? 0.7 : 1}
                >
                  <View style={s.itemLeft}>
                    <View style={[s.itemIconBg, { backgroundColor: itemBgColor }]}>
                      <Ionicons name={item.icon} size={18} color={item.color} />
                    </View>
                    <View>
                      <Text style={[s.itemText, { color: colors.textMain }]}>{item.label}</Text>
                      {item.sub && <Text style={[s.itemSub, { color: colors.textSub }]}>{item.sub}</Text>}
                    </View>
                  </View>
                  {item.type === 'switch' ? (
                    <Switch 
                      value={item.value} 
                      onValueChange={item.onToggle} 
                      trackColor={{ false: isDark ? '#2D2D3D' : '#E2E8F0', true: colors.primary }} 
                      thumbColor={'#fff'} 
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>
 
        <Animated.View entering={FadeInUp.springify().delay(500)}>
          <TouchableOpacity 
            style={[
              s.logoutBtn, 
              { 
                backgroundColor: isDark ? '#2D1518' : '#FEF2F2', 
                borderColor: isDark ? '#4D2528' : '#FECACA' 
              }
            ]} 
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={s.logoutBtnText}>Log out of all devices</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
 
const s = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { borderRadius: 22, padding: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 30 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  itemText: { fontSize: 15, fontWeight: '600' },
  itemSub: { fontSize: 12, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 20, borderWidth: 1.5 },
  logoutBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 }
});
