import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function NotificationsScreen({ navigation }) {
  const notifications = [
    { id: 1, title: 'Budget limit reached!', desc: 'You have spent 90% of your current budget.', time: '2 hours ago', icon: 'alert-circle', color: colors.danger, read: false },
    { id: 2, title: 'New 3D Feature Available', desc: 'Check out the new 3D visualizations in your profile!', time: '1 day ago', icon: 'cube', color: colors.primary, read: false },
    { id: 3, title: 'Payment Successful', desc: 'Your recent payment to Starbucks was successful.', time: '2 days ago', icon: 'checkmark-circle', color: colors.success, read: true },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {notifications.map((note) => (
          <View key={note.id} style={[styles.card, note.read ? styles.cardRead : styles.cardUnread]}>
            <View style={[styles.iconBg, { backgroundColor: note.color + '20' }]}>
              <Ionicons name={note.icon} size={24} color={note.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{note.title}</Text>
              <Text style={styles.desc}>{note.desc}</Text>
              <Text style={styles.time}>{note.time}</Text>
            </View>
            {!note.read && <View style={styles.unreadDot} />}
          </View>
        ))}
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
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { height: 4 }, alignItems: 'center' },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  cardRead: { opacity: 0.8 },
  iconBg: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: colors.textMain, marginBottom: 4 },
  desc: { fontSize: 13, color: colors.textSub, marginBottom: 8, lineHeight: 18 },
  time: { fontSize: 11, color: '#aaa', fontWeight: 'bold' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginLeft: 10 },
});
