import React, { useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  FadeInDown, FadeInRight, ZoomIn, SlideOutRight,
  useAnimatedStyle, useSharedValue, withTiming, withSpring,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -140;

// Notification type → icon mapping
const TYPE_ICONS = {
  budget_alert: 'alert-circle',
  payment: 'checkmark-circle',
  system: 'notifications',
  insight: 'bulb',
};

// Notification type → color mapping (light mode)
const TYPE_COLORS_LIGHT = {
  budget_alert: '#FF4C4C',
  payment: '#10B981',
  system: '#0B63F6',
  insight: '#8B5CF6',
};

const TYPE_COLORS_DARK = {
  budget_alert: '#FF6B6B',
  payment: '#34D399',
  system: '#4F8EF7',
  insight: '#A78BFA',
};

// Undo snackbar timeout
const UNDO_TIMEOUT = 4000;

function SwipeableNotificationCard({ item, index, onMarkRead, onDelete, colors, isDark }) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(1);
  const isDeleting = useRef(false);
  const typeColor = isDark ? TYPE_COLORS_DARK[item.type] : TYPE_COLORS_LIGHT[item.type];
  const icon = item.icon || TYPE_ICONS[item.type] || 'notifications';

  const handleDelete = () => {
    if (isDeleting.current) return;
    isDeleting.current = true;
    onDelete(item._id);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (e.translationX < DELETE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 250 }, () => {
          runOnJS(handleDelete)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.5, 1],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View
      entering={FadeInRight.springify().delay(100 + index * 60)}
      style={styles.swipeContainer}
    >
      {/* Delete action background */}
      <Animated.View style={[styles.deleteAction, deleteActionStyle]}>
        <TouchableOpacity
          style={styles.deleteActionBtn}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={22} color="#fff" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardAnimStyle}>
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              !item.read && { borderLeftWidth: 4, borderLeftColor: typeColor || colors.primary },
              item.read && { opacity: 0.65 },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              if (!item.read) onMarkRead(item._id);
            }}
          >
            <Animated.View entering={ZoomIn.springify().delay(150 + index * 60)}>
              <View style={[styles.iconBg, { backgroundColor: (typeColor || colors.primary) + '18' }]}>
                <Ionicons name={icon} size={24} color={typeColor || colors.primary} />
              </View>
            </Animated.View>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.title,
                  { color: colors.textMain },
                  !item.read && { fontWeight: '800' },
                ]}
              >
                {item.title}
              </Text>
              <Text style={[styles.desc, { color: colors.textSub }]}>{item.message}</Text>
              <View style={styles.metaRow}>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={12} color={colors.textSub} style={{ marginRight: 4 }} />
                  <Text style={[styles.time, { color: colors.textSub }]}>{formatTime(item.createdAt)}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: (typeColor || colors.primary) + '18' }]}>
                  <Text style={[styles.typeBadgeText, { color: typeColor || colors.primary }]}>
                    {item.type?.replace('_', ' ') || 'system'}
                  </Text>
                </View>
              </View>
            </View>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: typeColor || colors.primary }]} />}
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    fetchNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    restoreNotification,
    clearAll,
  } = useNotifications();

  // Undo snackbar state
  const [undoItem, setUndoItem] = useState(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const undoTimer = useRef(null);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications(true);
    }, [fetchNotifications])
  );

  const handleDelete = async (id) => {
    // Clear previous undo timer
    if (undoTimer.current) clearTimeout(undoTimer.current);

    const deleted = await deleteNotification(id);
    if (deleted) {
      setUndoItem(deleted);
      setUndoVisible(true);

      undoTimer.current = setTimeout(() => {
        setUndoVisible(false);
        setUndoItem(null);
      }, UNDO_TIMEOUT);
    }
  };

  const handleUndo = async () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (undoItem) {
      await restoreNotification(undoItem);
    }
    setUndoVisible(false);
    setUndoItem(null);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAll(),
        },
      ]
    );
  };

  const readCount = notifications.filter((n) => n.read).length;

  const renderItem = ({ item, index }) => (
    <SwipeableNotificationCard
      item={item}
      index={index}
      onMarkRead={markAsRead}
      onDelete={handleDelete}
      colors={colors}
      isDark={isDark}
    />
  );

  const keyExtractor = (item) => item._id;

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.emptyContainer}>
        <View style={[styles.emptyIconBg, { backgroundColor: isDark ? '#252535' : '#EEF2FF' }]}>
          <Ionicons name="notifications-off" size={48} color={isDark ? '#4F8EF7' : '#6366F1'} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textMain }]}>No Notifications</Text>
        <Text style={[styles.emptyDesc, { color: colors.textSub }]}>
          You're all caught up! We'll notify you when something important happens.
        </Text>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Summary chips */}
      <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]}>
          <Ionicons name="notifications" size={14} color={isDark ? '#818CF8' : '#6366F1'} />
          <Text style={[styles.summaryChipText, { color: isDark ? '#818CF8' : '#6366F1' }]}>
            {unreadCount} Unread
          </Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: isDark ? '#132218' : '#F0FDF4' }]}>
          <Ionicons name="checkmark-done" size={14} color={isDark ? '#34D399' : '#10B981'} />
          <Text style={[styles.summaryChipText, { color: isDark ? '#34D399' : '#10B981' }]}>
            {readCount} Read
          </Text>
        </View>
      </Animated.View>

      {/* Mark all as read */}
      {unreadCount > 0 && (
        <Animated.View entering={FadeInDown.springify().delay(150)}>
          <TouchableOpacity
            style={[styles.markAllBtn, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done-circle" size={18} color={isDark ? '#818CF8' : '#4F46E5'} />
            <Text style={[styles.markAllText, { color: isDark ? '#818CF8' : '#4F46E5' }]}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Swipe hint */}
      {notifications.length > 0 && (
        <Animated.View entering={FadeInDown.springify().delay(180)}>
          <Text style={[styles.swipeHint, { color: colors.textSub }]}>
            ← Swipe left on a notification to delete
          </Text>
        </Animated.View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify().delay(50)} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textMain }]}>Notifications</Text>
        <View style={{ width: 40 }}>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSub }]}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.container, notifications.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshing={isRefreshing}
          onRefresh={refreshNotifications}
        />
      )}

      {/* Undo Snackbar */}
      {undoVisible && (
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.snackbar, { backgroundColor: isDark ? '#2D2D3D' : '#1F2937' }]}
        >
          <Text style={styles.snackbarText}>Notification deleted</Text>
          <TouchableOpacity onPress={handleUndo} activeOpacity={0.7}>
            <Text style={styles.snackbarUndo}>UNDO</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6,
  },
  summaryChipText: { fontSize: 12, fontWeight: '600' },

  // Mark all
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 12, gap: 8, marginBottom: 12,
  },
  markAllText: { fontSize: 13, fontWeight: '700' },

  // Swipe hint
  swipeHint: { fontSize: 11, fontWeight: '500', textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },

  // Swipe & Card
  swipeContainer: { position: 'relative', marginBottom: 14 },
  deleteAction: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'flex-end', paddingRight: 10,
  },
  deleteActionBtn: {
    backgroundColor: '#EF4444', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', minWidth: 70,
  },
  deleteActionText: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 4 },

  card: {
    flexDirection: 'row', borderRadius: 20, padding: 18,
    alignItems: 'center', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  iconBg: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  desc: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  time: { fontSize: 11, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },

  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Undo Snackbar
  snackbar: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  snackbarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  snackbarUndo: { color: '#60A5FA', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
});
