import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  SlideInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import api from '../services/api';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CATEGORIES = [
  { key: 'Shopping & Retail', icon: 'bag-handle', color: '#FF6B6B', bgColor: '#FFF0F0' },
  { key: 'Food & Dining', icon: 'restaurant', color: '#FF9F43', bgColor: '#FFF5EB' },
  { key: 'Transport', icon: 'car-sport', color: '#54A0FF', bgColor: '#EBF5FF' },
  { key: 'Entertainment', icon: 'game-controller', color: '#A855F7', bgColor: '#F5EBFF' },
  { key: 'Bills', icon: 'receipt', color: '#10B981', bgColor: '#ECFDF5' },
  { key: 'Other', icon: 'ellipsis-horizontal-circle', color: '#6B7280', bgColor: '#F3F4F6' },
];

const ACCOUNTS = [
  { key: 'Cash', icon: 'cash', color: '#10B981', bgColor: '#ECFDF5' },
  { key: 'Bank Account', icon: 'business', color: '#3B82F6', bgColor: '#EFF6FF' },
  { key: 'Credit Card', icon: 'card', color: '#EF4444', bgColor: '#FEF2F2' },
  { key: 'UPI', icon: 'phone-portrait', color: '#8B5CF6', bgColor: '#F5F3FF' },
];

export default function EditExpenseScreen({ route, navigation }) {
  const { expense } = route.params || {};

  const [title, setTitle] = useState(expense?.title || '');
  const [amount, setAmount] = useState(expense?.amount ? String(expense.amount) : '');
  const [category, setCategory] = useState(expense?.category || 'Shopping & Retail');
  const [account, setAccount] = useState(expense?.account || 'Cash');
  const [isLoading, setIsLoading] = useState(false);

  const updateBtnScale = useSharedValue(1);
  const deleteBtnScale = useSharedValue(1);

  const updateBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: updateBtnScale.value }],
  }));

  const deleteBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteBtnScale.value }],
  }));

  const selectedCat = CATEGORIES.find(c => c.key === category);
  const selectedAcc = ACCOUNTS.find(a => a.key === account);

  // 🔹 UPDATE
  const handleUpdate = async () => {
    if (!title || !amount || isNaN(amount) || Number(amount) <= 0) {
      updateBtnScale.value = withSequence(
        withTiming(0.95, { duration: 50 }),
        withTiming(1.05, { duration: 50 }),
        withTiming(0.95, { duration: 50 }),
        withSpring(1)
      );
      Alert.alert('Error', 'Enter valid data');
      return;
    }

    try {
      setIsLoading(true);
      await api.put(`/expenses/${expense?._id}`, {
        title: title.trim(),
        amount: Number(amount),
        category: category.trim(),
        account: account.trim()
      });

      updateBtnScale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withSpring(1, { damping: 6 })
      );

      Alert.alert('Updated', 'Expense updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 DELETE
  const handleDelete = () => {
    deleteBtnScale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 10 })
    );

    Alert.alert(
      'Delete Expense',
      'Are you sure you want to permanently delete this expense?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await api.delete(`/expenses/${expense?._id}`);
              Alert.alert('Deleted', 'Expense removed', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Delete failed');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <Animated.View entering={FadeInDown.springify().delay(50)} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={colors.textMain} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Expense</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          {/* Amount Card */}
          <Animated.View entering={FadeInDown.springify().delay(120)} style={styles.amountCard}>
            <View style={styles.amountCircle1} />
            <View style={styles.amountCircle2} />

            <Animated.View entering={ZoomIn.springify().delay(250)} style={styles.amountIconInner}>
              <Ionicons name="create" size={24} color="#fff" />
            </Animated.View>

            <Text style={styles.amountLabel}>AMOUNT</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.35)"
                maxLength={10}
                textAlign="center"
                selectionColor="rgba(255,255,255,0.5)"
              />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="create" size={16} color="#A855F7" />
              </View>
              <Text style={styles.sectionTitle}>Title</Text>
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="What was this expense for?"
                placeholderTextColor="#B0B8C4"
              />
            </View>
          </Animated.View>

          {/* Category Selector */}
          <Animated.View entering={FadeInDown.springify().delay(300)} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: selectedCat?.bgColor || '#F3F4F6' }]}>
                <Ionicons name="pricetag" size={16} color={selectedCat?.color || colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Category</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {CATEGORIES.map((item, index) => {
                const isSelected = category === item.key;
                return (
                  <Animated.View key={item.key} entering={SlideInRight.springify().delay(index * 60)}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        isSelected && { backgroundColor: item.color, borderColor: item.color },
                        !isSelected && { backgroundColor: item.bgColor, borderColor: item.bgColor },
                      ]}
                      onPress={() => setCategory(item.key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={item.icon} size={16} color={isSelected ? '#fff' : item.color} style={{ marginRight: 6 }} />
                      <Text style={[styles.chipText, { color: isSelected ? '#fff' : item.color }]} numberOfLines={1}>
                        {item.key.split(' & ')[0]}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Account Selector */}
          <Animated.View entering={FadeInDown.springify().delay(400)} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="card" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {ACCOUNTS.map((item, index) => {
                const isSelected = account === item.key;
                return (
                  <Animated.View key={item.key} entering={SlideInRight.springify().delay(index * 60)}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        isSelected && { backgroundColor: item.color, borderColor: item.color },
                        !isSelected && { backgroundColor: item.bgColor, borderColor: item.bgColor },
                      ]}
                      onPress={() => setAccount(item.key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={item.icon} size={16} color={isSelected ? '#fff' : item.color} style={{ marginRight: 6 }} />
                      <Text style={[styles.chipText, { color: isSelected ? '#fff' : item.color }]} numberOfLines={1}>
                        {item.key}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Update Button */}
          <Animated.View entering={FadeInUp.springify().delay(500)}>
            <AnimatedTouchable
              style={[styles.updateBtn, updateBtnAnimStyle]}
              onPress={handleUpdate}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnInner}>
                  <View style={styles.btnIconWrap}>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  </View>
                  <Text style={styles.updateBtnText}>Update Expense</Text>
                  <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
                </View>
              )}
            </AnimatedTouchable>
          </Animated.View>

          {/* Delete Button */}
          <Animated.View entering={FadeIn.delay(600)}>
            <AnimatedTouchable
              style={[styles.deleteBtn, deleteBtnAnimStyle]}
              onPress={handleDelete}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.deleteBtnText}>Delete Expense</Text>
            </AnimatedTouchable>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingHorizontal: 20, paddingBottom: 60 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textMain, letterSpacing: 0.3 },

  amountCard: {
    borderRadius: 28, paddingVertical: 32, paddingHorizontal: 24, marginBottom: 28, alignItems: 'center', overflow: 'hidden',
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 12,
  },
  amountCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', right: -60, top: -40 },
  amountCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', left: -40, bottom: -30 },
  amountIconInner: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  amountLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginBottom: 10 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  currencySymbol: { fontSize: 36, fontWeight: '800', color: '#fff', marginRight: 4 },
  amountInput: { fontSize: 44, fontWeight: '800', color: '#fff', flex: 1, maxWidth: 200, paddingVertical: 4, textAlign: 'center' },

  sectionWrap: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textMain, flex: 1 },

  inputWrap: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, minHeight: 56,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: '#F0F1F3',
  },
  textInput: { fontSize: 15, color: colors.textMain, lineHeight: 22 },

  chipRow: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '700' },

  updateBtn: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 14,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 58, paddingHorizontal: 24 },
  btnIconWrap: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  updateBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1, letterSpacing: 0.3 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 22,
    backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});