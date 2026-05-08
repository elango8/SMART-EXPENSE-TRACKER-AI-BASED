import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function AppPreferencesScreen({ navigation }) {
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [currency, setCurrency] = useState('USD');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Preferences</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Ionicons name="moon" size={20} color={colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
          <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Ionicons name="notifications" size={20} color={colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemText}>Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
          <TouchableOpacity style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Ionicons name="cash" size={20} color={colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemText}>Currency</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.itemValue}>{currency}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSub} style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Ionicons name="language" size={20} color={colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemText}>Language</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.itemValue}>English</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSub} style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>
        </View>
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
  section: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { height: 4 }, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: colors.textSub, textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { marginRight: 15 },
  itemText: { fontSize: 16, color: colors.textMain, fontWeight: '500' },
  itemValue: { fontSize: 14, color: colors.textSub, fontWeight: 'bold' },
});
