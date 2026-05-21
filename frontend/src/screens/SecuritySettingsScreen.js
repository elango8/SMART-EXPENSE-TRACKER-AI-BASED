import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { colors } from '../theme/colors';

export default function SecuritySettingsScreen({ navigation }) {
  const [faceId, setFaceId] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const securityItems = [
    { icon: 'scan', label: 'Face ID / Biometrics', sub: 'Quick login', type: 'switch', value: faceId, onToggle: setFaceId, color: '#3B82F6', bgColor: '#EFF6FF' },
    { icon: 'keypad', label: '2-Step Verification', sub: 'Extra layer of security', type: 'switch', value: twoFactor, onToggle: setTwoFactor, color: '#8B5CF6', bgColor: '#F5F3FF' },
    { icon: 'lock-closed', label: 'Change Password', sub: null, type: 'nav', color: '#10B981', bgColor: '#ECFDF5' },
  ];

  return (
    <SafeAreaView style={s.safeArea}>
      <Animated.View entering={FadeInDown.springify().delay(50)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Security</Text>
        <View style={{ width: 40 }} />
      </Animated.View>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().delay(120)} style={s.section}>
          {securityItems.map((item, idx) => (
            <Animated.View key={idx} entering={FadeInRight.springify().delay(180 + idx * 80)}>
              <TouchableOpacity style={s.itemRow} activeOpacity={item.type === 'nav' ? 0.7 : 1}>
                <View style={s.itemLeft}>
                  <View style={[s.itemIconBg, { backgroundColor: item.bgColor }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View>
                    <Text style={s.itemText}>{item.label}</Text>
                    {item.sub && <Text style={s.itemSub}>{item.sub}</Text>}
                  </View>
                </View>
                {item.type === 'switch' ? (
                  <Switch value={item.value} onValueChange={item.onToggle} trackColor={{ false: '#E2E8F0', true: colors.primary }} thumbColor={'#fff'} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.springify().delay(500)}>
          <TouchableOpacity style={s.logoutBtn} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={s.logoutBtnText}>Log out of all devices</Text>
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
  section: { backgroundColor: '#fff', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: '#F0F1F3', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 30 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  itemText: { fontSize: 15, color: colors.textMain, fontWeight: '600' },
  itemSub: { fontSize: 12, color: colors.textSub, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', height: 56, borderRadius: 20, borderWidth: 1.5, borderColor: '#FECACA' },
  logoutBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 }
});
