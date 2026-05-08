import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function SecuritySettingsScreen({ navigation }) {
  const [faceId, setFaceId] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Ionicons name="scan" size={20} color={colors.primary} style={styles.itemIcon} />
              <View>
                <Text style={styles.itemText}>Face ID / Biometrics</Text>
                <Text style={styles.itemSub}>Quick login</Text>
              </View>
            </View>
            <Switch
              value={faceId}
              onValueChange={setFaceId}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
          <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Ionicons name="keypad" size={20} color={colors.primary} style={styles.itemIcon} />
              <View>
                <Text style={styles.itemText}>2-Step Verification</Text>
                <Text style={styles.itemSub}>Extra layer of security</Text>
              </View>
            </View>
            <Switch
              value={twoFactor}
              onValueChange={setTwoFactor}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
          <TouchableOpacity style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Ionicons name="lock-closed" size={20} color={colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Log out of all devices</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textMain },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { height: 4 }, marginBottom: 30 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { marginRight: 15 },
  itemText: { fontSize: 16, color: colors.textMain, fontWeight: '500' },
  itemSub: { fontSize: 12, color: colors.textSub, marginTop: 4 },
  logoutBtn: { backgroundColor: '#FFF5F5', padding: 20, borderRadius: 20, alignItems: 'center' },
  logoutBtnText: { color: colors.danger, fontWeight: 'bold', fontSize: 16 }
});
