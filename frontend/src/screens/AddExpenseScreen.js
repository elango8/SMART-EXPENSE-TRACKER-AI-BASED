import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, Modal, Dimensions, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  withRepeat,
  withSequence,
  withDelay,
  interpolateColor,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import api from '../services/api';
import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Category config with icons & colors ─────────────────────
const CATEGORIES = [
  { key: 'Shopping & Retail', icon: 'bag-handle', color: '#FF6B6B', bgColor: '#FFF0F0' },
  { key: 'Food & Dining', icon: 'restaurant', color: '#FF9F43', bgColor: '#FFF5EB' },
  { key: 'Transport', icon: 'car-sport', color: '#54A0FF', bgColor: '#EBF5FF' },
  { key: 'Entertainment', icon: 'game-controller', color: '#A855F7', bgColor: '#F5EBFF' },
  { key: 'Bills', icon: 'receipt', color: '#10B981', bgColor: '#ECFDF5' },
  { key: 'Other', icon: 'ellipsis-horizontal-circle', color: '#6B7280', bgColor: '#F3F4F6' },
];

// ─── Account config with icons & colors ──────────────────────
const ACCOUNTS = [
  { key: 'Cash', icon: 'cash', color: '#10B981', bgColor: '#ECFDF5' },
  { key: 'Bank Account', icon: 'business', color: '#3B82F6', bgColor: '#EFF6FF' },
  { key: 'Credit Card', icon: 'card', color: '#EF4444', bgColor: '#FEF2F2' },
  { key: 'UPI', icon: 'phone-portrait', color: '#8B5CF6', bgColor: '#F5F3FF' },
];

// ─── Date options ────────────────────────────────────────────
const DATE_OPTIONS = [
  { label: 'Today', val: new Date(), icon: 'today' },
  { label: 'Yesterday', val: new Date(Date.now() - 86400000), icon: 'time' },
  { label: '2 Days Ago', val: new Date(Date.now() - 86400000 * 2), icon: 'calendar' },
];

// ─── Floating Particle Component ─────────────────────────────
function FloatingParticle({ delay, size, left, top, color }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.6, { duration: 800 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color || 'rgba(255,255,255,0.15)',
          left,
          top,
        },
        animatedStyle,
      ]}
    />
  );
}

// ─── Chip Selector Component ─────────────────────────────────
function ChipSelector({ items, selected, onSelect, type }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {items.map((item, index) => {
        const isSelected = selected === item.key;
        return (
          <Animated.View
            key={item.key}
            entering={SlideInRight.springify().delay(index * 80)}
          >
            <TouchableOpacity
              style={[
                styles.chip,
                isSelected && { backgroundColor: item.color, borderColor: item.color },
                !isSelected && { backgroundColor: item.bgColor, borderColor: item.bgColor },
              ]}
              onPress={() => onSelect(item.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={isSelected ? '#fff' : item.color}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#fff' : item.color },
                ]}
                numberOfLines={1}
              >
                {type === 'category' ? item.key.split(' & ')[0] : item.key}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AddExpenseScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Shopping & Retail');
  const [account, setAccount] = useState('Cash');
  const [date, setDate] = useState(new Date());
  const [uiDateString, setUiDateString] = useState('Today');
  const [isLoading, setIsLoading] = useState(false);

  // ── Animated values ──
  const amountScale = useSharedValue(1);
  const saveButtonScale = useSharedValue(1);
  const heroGlow = useSharedValue(0);
  const pulseRing = useSharedValue(0);

  useEffect(() => {
    // Start hero glow animation
    heroGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // Pulse ring around the amount icon
    pulseRing.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.in(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // ── Amount bounce on change ──
  useEffect(() => {
    if (amount.length > 0) {
      amountScale.value = withSequence(
        withTiming(1.08, { duration: 100 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
    }
  }, [amount]);

  const amountAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }],
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulseRing.value * 0.35 }],
    opacity: 1 - pulseRing.value * 0.8,
  }));

  const saveButtonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  // ── Handlers ──
  const handleSaveExpense = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      // Shake the save button
      saveButtonScale.value = withSequence(
        withTiming(0.95, { duration: 50 }),
        withTiming(1.05, { duration: 50 }),
        withTiming(0.95, { duration: 50 }),
        withSpring(1)
      );
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/expenses', {
        title: title.trim(),
        amount: Number(amount),
        category: category.trim(),
        account: account.trim(),
        date,
        userId: user._id,
      });

      // Success animation
      saveButtonScale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withSpring(1, { damping: 6 })
      );

      Alert.alert('Success', 'Expense added successfully', [
        {
          text: 'OK',
          onPress: () => {
            setAmount('');
            setTitle('');
            setCategory('Shopping & Retail');
            setAccount('Cash');
            setDate(new Date());
            setUiDateString('Today');
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.log('Error saving expense:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePress = () => {
    saveButtonScale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    handleSaveExpense();
  };

  const selectedCat = CATEGORIES.find(c => c.key === category);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Header ─────────────────────────── */}
          <Animated.View entering={FadeInDown.springify().delay(50)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textMain} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Expense</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          {/* ─── Hero Amount Section ─────────────── */}
          <Animated.View entering={FadeInDown.springify().delay(120)} style={styles.heroCard}>
            {/* Floating particles */}
            <FloatingParticle delay={0} size={8} left="10%" top="15%" color="rgba(255,255,255,0.12)" />
            <FloatingParticle delay={400} size={12} left="80%" top="20%" color="rgba(255,255,255,0.1)" />
            <FloatingParticle delay={800} size={6} left="65%" top="75%" color="rgba(255,255,255,0.15)" />
            <FloatingParticle delay={200} size={10} left="25%" top="80%" color="rgba(255,255,255,0.08)" />
            <FloatingParticle delay={600} size={14} left="90%" top="55%" color="rgba(255,255,255,0.06)" />

            {/* Decorative circles */}
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />

            {/* Amount icon with pulse ring */}
            <View style={styles.amountIconWrap}>
              <Animated.View style={[styles.pulseRing, pulseRingStyle]} />
              <Animated.View entering={ZoomIn.springify().delay(300)} style={styles.amountIconInner}>
                <Ionicons name="wallet" size={28} color="#fff" />
              </Animated.View>
            </View>

            <Animated.Text entering={FadeIn.delay(400)} style={styles.heroLabel}>
              ENTER AMOUNT
            </Animated.Text>

            {/* Amount Input - FIXED RESPONSIVENESS */}
            <Animated.View style={[styles.amountInputRow, amountAnimStyle]}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.35)"
                maxLength={10}
                textAlign="center"
                selectionColor="rgba(255,255,255,0.5)"
              />
            </Animated.View>

            <Animated.Text entering={FadeIn.delay(500)} style={styles.heroHint}>
              Tap to enter your expense amount
            </Animated.Text>
          </Animated.View>

          {/* ─── Category Selector ──────────────── */}
          <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: selectedCat?.bgColor || '#F3F4F6' }]}>
                <Ionicons name="pricetag" size={16} color={selectedCat?.color || colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Category</Text>
            </View>
            <ChipSelector
              items={CATEGORIES}
              selected={category}
              onSelect={setCategory}
              type="category"
            />
          </Animated.View>

          {/* ─── Account Selector ───────────────── */}
          <Animated.View entering={FadeInDown.springify().delay(300)} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="card" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
            <ChipSelector
              items={ACCOUNTS}
              selected={account}
              onSelect={setAccount}
              type="account"
            />
          </Animated.View>

          {/* ─── Date Selector ──────────────────── */}
          <Animated.View entering={FadeInDown.springify().delay(400)} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.sectionTitle}>When</Text>
            </View>
            <View style={styles.dateRow}>
              {DATE_OPTIONS.map((d, index) => {
                const isSelected = uiDateString === d.label;
                return (
                  <Animated.View
                    key={d.label}
                    entering={SlideInRight.springify().delay(index * 100)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.dateChip,
                        isSelected && styles.dateChipSelected,
                      ]}
                      onPress={() => {
                        setDate(d.val);
                        setUiDateString(d.label);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={d.icon}
                        size={16}
                        color={isSelected ? '#fff' : '#F59E0B'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.dateChipText,
                          isSelected && styles.dateChipTextSelected,
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* ─── Title / Note ───────────────────── */}
          <Animated.View entering={FadeInDown.springify().delay(500)} style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="create" size={16} color="#A855F7" />
              </View>
              <Text style={styles.sectionTitle}>Note</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>
            <View style={styles.noteInputWrap}>
              <TextInput
                style={styles.noteInput}
                placeholder="What was this expense for?"
                placeholderTextColor="#B0B8C4"
                value={title}
                onChangeText={setTitle}
                multiline
                maxLength={120}
              />
              <Text style={styles.charCount}>{title.length}/120</Text>
            </View>
          </Animated.View>

          {/* ─── Save Button ───────────────────── */}
          <Animated.View entering={FadeInUp.springify().delay(600)}>
            <AnimatedTouchable
              style={[styles.saveBtn, saveButtonAnimStyle]}
              onPress={handleSavePress}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.saveBtnInner}>
                  <View style={styles.saveBtnIconWrap}>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  </View>
                  <Text style={styles.saveBtnText}>Save Expense</Text>
                  <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
                </View>
              )}
            </AnimatedTouchable>
          </Animated.View>

          {/* ─── Cancel ────────────────────────── */}
          <Animated.View entering={FadeIn.delay(700)}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.6}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.textSub} style={{ marginRight: 6 }} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMain,
    letterSpacing: 0.3,
  },

  // ── Hero Card ──
  heroCard: {
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginBottom: 28,
    alignItems: 'center',
    overflow: 'hidden',
    // Gradient simulation with layered backgrounds
    backgroundColor: '#0B63F6',
    shadowColor: '#0B63F6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: -60,
    top: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    left: -40,
    bottom: -30,
  },
  amountIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  amountIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 70,
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    maxWidth: SCREEN_WIDTH * 0.55,
    paddingVertical: 4,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  heroHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 8,
  },

  // ── Sections ──
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMain,
    flex: 1,
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B0B8C4',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  // ── Chips ──
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Date ──
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
  },
  dateChipSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  dateChipTextSelected: {
    color: '#fff',
  },

  // ── Note ──
  noteInputWrap: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    minHeight: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F1F3',
  },
  noteInput: {
    fontSize: 15,
    color: colors.textMain,
    textAlignVertical: 'top',
    lineHeight: 22,
    minHeight: 50,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    color: '#C4C9D0',
    marginTop: 4,
  },

  // ── Save Button ──
  saveBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#0B63F6',
    shadowColor: '#0B63F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    paddingHorizontal: 24,
  },
  saveBtnIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.3,
  },

  // ── Cancel ──
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  cancelBtnText: {
    color: colors.textSub,
    fontSize: 14,
    fontWeight: '600',
  },
});
