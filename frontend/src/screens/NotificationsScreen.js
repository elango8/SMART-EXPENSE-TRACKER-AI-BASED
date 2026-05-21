import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { colors } from '../theme/colors';

export default function NotificationsScreen({ navigation }) {
  const notifications = [
    { id: 1, title: 'Budget limit reached!', desc: 'You have spent 90% of your current budget.', time: '2 hours ago', icon: 'alert-circle', color: colors.danger, read: false },
    { id: 2, title: 'New 3D Feature Available', desc: 'Check out the new 3D visualizations in your profile!', time: '1 day ago', icon: 'cube', color: colors.primary, read: false },
    { id: 3, title: 'Payment Successful', desc: 'Your recent payment to Starbucks was successful.', time: '2 days ago', icon: 'checkmark-circle', color: colors.success, read: true },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify().delay(50)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Summary badge */}
        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Ionicons name="notifications" size={14} color="#6366F1" />
            <Text style={styles.summaryChipText}>{notifications.filter(n => !n.read).length} Unread</Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="checkmark-done" size={14} color="#10B981" />
            <Text style={[styles.summaryChipText, { color: '#10B981' }]}>{notifications.filter(n => n.read).length} Read</Text>
          </View>
        </Animated.View>

        {notifications.map((note, index) => (
          <Animated.View
            key={note.id}
            entering={FadeInRight.springify().delay(150 + index * 100)}
          >
            <View style={[styles.card, note.read ? styles.cardRead : styles.cardUnread]}>
              <Animated.View entering={ZoomIn.springify().delay(200 + index * 100)}>
                <View style={[styles.iconBg, { backgroundColor: note.color + '15' }]}>
                  <Ionicons name={note.icon} size={24} color={note.color} />
                </View>
              </Animated.View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{note.title}</Text>
                <Text style={styles.desc}>{note.desc}</Text>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={12} color="#B0B8C4" style={{ marginRight: 4 }} />
                  <Text style={styles.time}>{note.time}</Text>
                </View>
              </View>
              {!note.read && <View style={styles.unreadDot} />}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textMain },
  container: { paddingHorizontal: 20, paddingBottom: 40 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6,
  },
  summaryChipText: { fontSize: 12, fontWeight: '600', color: '#6366F1' },

  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#F0F1F3',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  cardRead: { opacity: 0.7 },
  iconBg: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: colors.textMain, marginBottom: 4 },
  desc: { fontSize: 13, color: colors.textSub, marginBottom: 8, lineHeight: 18 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  time: { fontSize: 11, color: '#B0B8C4', fontWeight: '600' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginLeft: 10 },
});
