import React, { useState, useContext, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn,
} from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { usePreferences } from '../context/PreferencesContext';
import api from '../services/api';
import TransactionItem from '../components/TransactionItem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Filter Config ─────────────────────────────────────────
const DATE_RANGES = [
  { key: 'all', label: 'All Time', icon: 'infinite' },
  { key: 'today', label: 'Today', icon: 'today' },
  { key: 'yesterday', label: 'Yesterday', icon: 'time-outline' },
  { key: 'week', label: 'This Week', icon: 'calendar-outline' },
  { key: 'month', label: 'This Month', icon: 'calendar' },
  { key: '3months', label: 'Last 3 Months', icon: 'calendar-number-outline' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First', icon: 'arrow-down' },
  { key: 'oldest', label: 'Oldest First', icon: 'arrow-up' },
  { key: 'highest', label: 'Highest Amount', icon: 'trending-up' },
  { key: 'lowest', label: 'Lowest Amount', icon: 'trending-down' },
];

const CATEGORY_LIST = [
  { key: 'Shopping & Retail', icon: 'bag-handle', color: '#FF6B6B' },
  { key: 'Food & Dining', icon: 'restaurant', color: '#FF9F43' },
  { key: 'Transport', icon: 'car-sport', color: '#54A0FF' },
  { key: 'Entertainment', icon: 'game-controller', color: '#A855F7' },
  { key: 'Bills', icon: 'receipt', color: '#10B981' },
  { key: 'Other', icon: 'ellipsis-horizontal-circle', color: '#6B7280' },
];

const PAYMENT_LIST = [
  { key: 'Cash', icon: 'cash', color: '#10B981' },
  { key: 'Bank Account', icon: 'business', color: '#3B82F6' },
  { key: 'Credit Card', icon: 'card', color: '#EF4444' },
  { key: 'UPI', icon: 'phone-portrait', color: '#8B5CF6' },
];

// ─── Quick Filter Chip ──────────────────────────────────────
const QuickChip = ({ label, icon, isActive, onPress, color }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.quickChip,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isActive && [styles.quickChipActive, color ? { backgroundColor: color, borderColor: color } : {}],
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={13}
        color={isActive ? '#fff' : colors.textSub}
        style={{ marginRight: 5 }}
      />
      <Text style={isActive ? styles.quickChipTextActive : [styles.quickChipText, { color: colors.textSub }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Filter Section in Modal ────────────────────────────────
const FilterSection = ({ title, icon, children }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.filterSection}>
      <View style={styles.filterSectionHeader}>
        <Ionicons name={icon} size={16} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.filterSectionTitle, { color: colors.textMain }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

// ─── Selectable Chip ────────────────────────────────────────
const SelectChip = ({ label, icon, color, isSelected, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.selectChip,
        { backgroundColor: colors.inputBg, borderColor: colors.border },
        isSelected && { backgroundColor: (color || colors.primary) + '15', borderColor: color || colors.primary },
      ]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={isSelected ? (color || colors.primary) : colors.textSub}
          style={{ marginRight: 5 }}
        />
      )}
      <Text style={[
        styles.selectChipText,
        { color: colors.textSub },
        isSelected && { color: color || colors.primary, fontWeight: '700' },
      ]}>
        {label}
      </Text>
      {isSelected && (
        <View style={[styles.selectChipCheck, { backgroundColor: color || colors.primary }]}>
          <Ionicons name="checkmark" size={9} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

/* ══════════════════════════════════════
   MAIN HISTORY SCREEN
   ══════════════════════════════════════ */
export default function HistoryScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { formatAmount, getSymbol } = usePreferences();
  const currencySymbol = getSymbol();

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('');

  // ── Filter Modal ──
  const [showFilterModal, setShowFilterModal] = useState(false);

  // ── Active Filters ──
  const [dateRange, setDateRange] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState([]);  // empty = all
  const [selectedPayments, setSelectedPayments] = useState([]);      // empty = all
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // ── Temp filters (for modal editing before Apply) ──
  const [tempDateRange, setTempDateRange] = useState('all');
  const [tempCategories, setTempCategories] = useState([]);
  const [tempPayments, setTempPayments] = useState([]);
  const [tempMinAmount, setTempMinAmount] = useState('');
  const [tempMaxAmount, setTempMaxAmount] = useState('');
  const [tempSortBy, setTempSortBy] = useState('newest');

  // ── FETCH ──
  const fetchExpenses = async () => {
    if (!user?._id) return;
    try {
      setIsLoading(true);
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (error) {
      console.log('Error fetching history expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [user])
  );

  // ── Count active filters ──
  const activeFilterCount = [
    dateRange !== 'all',
    selectedCategories.length > 0,
    selectedPayments.length > 0,
    minAmount !== '',
    maxAmount !== '',
    sortBy !== 'newest',
  ].filter(Boolean).length;

  // ── Open filter modal ──
  const openFilterModal = () => {
    setTempDateRange(dateRange);
    setTempCategories([...selectedCategories]);
    setTempPayments([...selectedPayments]);
    setTempMinAmount(minAmount);
    setTempMaxAmount(maxAmount);
    setTempSortBy(sortBy);
    setShowFilterModal(true);
  };

  // ── Apply filters ──
  const applyFilters = () => {
    setDateRange(tempDateRange);
    setSelectedCategories([...tempCategories]);
    setSelectedPayments([...tempPayments]);
    setMinAmount(tempMinAmount);
    setMaxAmount(tempMaxAmount);
    setSortBy(tempSortBy);
    setShowFilterModal(false);
  };

  // ── Clear all filters ──
  const clearAllFilters = () => {
    setTempDateRange('all');
    setTempCategories([]);
    setTempPayments([]);
    setTempMinAmount('');
    setTempMaxAmount('');
    setTempSortBy('newest');
  };

  const clearActiveFilters = () => {
    setDateRange('all');
    setSelectedCategories([]);
    setSelectedPayments([]);
    setMinAmount('');
    setMaxAmount('');
    setSortBy('newest');
  };

  // ── Toggle category selection ──
  const toggleCategory = (cat) => {
    setTempCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // ── Toggle payment selection ──
  const togglePayment = (pay) => {
    setTempPayments(prev =>
      prev.includes(pay) ? prev.filter(p => p !== pay) : [...prev, pay]
    );
  };

  // ── Date range helper ──
  const getDateRangeStart = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (range) {
      case 'today':
        return today;
      case 'yesterday': {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        return y;
      }
      case 'week': {
        const w = new Date(today);
        w.setDate(w.getDate() - w.getDay()); // start of week (Sunday)
        return w;
      }
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case '3months': {
        const m3 = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return m3;
      }
      default:
        return null;
    }
  };

  const getDateRangeEnd = (range) => {
    if (range === 'yesterday') {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight today
    }
    return null;
  };

  // ── FILTER + SORT EXPENSES ──
  const filteredExpenses = expenses
    .filter(ex => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (ex.title || '').toLowerCase().includes(q) ||
        (ex.category || '').toLowerCase().includes(q) ||
        (ex.account || '').toLowerCase().includes(q);

      // Date range
      let matchesDate = true;
      if (dateRange !== 'all') {
        const expDate = new Date(ex.date);
        const start = getDateRangeStart(dateRange);
        const end = getDateRangeEnd(dateRange);
        if (start) matchesDate = expDate >= start;
        if (end && matchesDate) matchesDate = expDate < end;
      }

      // Category
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(ex.category);

      // Payment
      const matchesPayment = selectedPayments.length === 0 || selectedPayments.includes(ex.account || 'Cash');

      // Amount range
      let matchesAmount = true;
      const amt = Number(ex.amount);
      if (minAmount !== '' && !isNaN(Number(minAmount))) {
        matchesAmount = amt >= Number(minAmount);
      }
      if (maxAmount !== '' && !isNaN(Number(maxAmount)) && matchesAmount) {
        matchesAmount = amt <= Number(maxAmount);
      }

      return matchesSearch && matchesDate && matchesCategory && matchesPayment && matchesAmount;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.date) - new Date(b.date);
        case 'highest': return Number(b.amount) - Number(a.amount);
        case 'lowest': return Number(a.amount) - Number(b.amount);
        default: return new Date(b.date) - new Date(a.date); // newest
      }
    });

  // ── GROUP BY DATE ──
  const groupedData = filteredExpenses.reduce((acc, curr) => {
    const d = new Date(curr.date);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }).toUpperCase();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(curr);
    return acc;
  }, {});

  const sections = Object.keys(groupedData).map(dateStr => ({
    section: dateStr,
    count: groupedData[dateStr].length === 1
      ? '1 Transaction'
      : `${groupedData[dateStr].length} Transactions`,
    total: groupedData[dateStr].reduce((sum, tx) => sum + Number(tx.amount), 0),
    data: groupedData[dateStr],
  }));

  // ── Summary ──
  const totalFiltered = filteredExpenses.length;
  const totalAmount = filteredExpenses.reduce((sum, ex) => sum + Number(ex.amount), 0);

  // ── Active filter labels for chips ──
  const activeFilterChips = [];
  if (dateRange !== 'all') {
    const dr = DATE_RANGES.find(d => d.key === dateRange);
    activeFilterChips.push({ label: dr?.label || dateRange, key: 'date', onClear: () => setDateRange('all') });
  }
  selectedCategories.forEach(c => {
    activeFilterChips.push({ label: c, key: `cat-${c}`, onClear: () => setSelectedCategories(prev => prev.filter(x => x !== c)) });
  });
  selectedPayments.forEach(p => {
    activeFilterChips.push({ label: p, key: `pay-${p}`, onClear: () => setSelectedPayments(prev => prev.filter(x => x !== p)) });
  });
  if (minAmount) activeFilterChips.push({ label: `Min ${currencySymbol}${minAmount}`, key: 'min', onClear: () => setMinAmount('') });
  if (maxAmount) activeFilterChips.push({ label: `Max ${currencySymbol}${maxAmount}`, key: 'max', onClear: () => setMaxAmount('') });
  if (sortBy !== 'newest') {
    const so = SORT_OPTIONS.find(s => s.key === sortBy);
    activeFilterChips.push({ label: so?.label || sortBy, key: 'sort', onClear: () => setSortBy('newest') });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Finovo</Text>
          </View>
          <TouchableOpacity 
            style={[styles.notifBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { borderColor: colors.background }]}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── TITLE + SUMMARY ── */}
        <Animated.View entering={FadeInDown.springify().delay(100)}>
          <Text style={[styles.screenTitle, { color: colors.textMain }]}>History</Text>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryChip, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]}>
              <Ionicons name="receipt-outline" size={14} color={isDark ? '#818CF8' : '#6366F1'} />
              <Text style={[styles.summaryChipText, { color: isDark ? '#818CF8' : '#6366F1' }]}>{totalFiltered} transactions</Text>
            </View>
            <View style={[styles.summaryChip, { backgroundColor: isDark ? '#2D1518' : '#FEE2E2' }]}>
              <Ionicons name="trending-down" size={14} color={isDark ? '#FF6B6B' : '#EF4444'} />
              <Text style={[styles.summaryChipText, { color: isDark ? '#FF6B6B' : '#EF4444' }]}>
                {formatAmount(totalAmount)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── SEARCH + FILTER BUTTON ── */}
        <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSub} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.textMain }]}
              placeholder="Search by name, category, payment..."
              placeholderTextColor={isDark ? '#666' : '#B0B8C4'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSub} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Icon Button */}
          <TouchableOpacity
            style={[
              styles.filterIconBtn,
              activeFilterCount > 0 
                ? { backgroundColor: colors.primary, borderColor: colors.primary } 
                : { backgroundColor: isDark ? '#1E2340' : '#EEF2FF', borderColor: isDark ? '#2D3560' : '#E0E7FF' }
            ]}
            onPress={openFilterModal}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? '#fff' : (isDark ? '#818CF8' : '#6366F1')} />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { borderColor: colors.background }]}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ── QUICK FILTER CHIPS ── */}
        <Animated.View entering={FadeInDown.springify().delay(280)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChipRow}
          >
            {DATE_RANGES.map(d => (
              <QuickChip
                key={d.key}
                label={d.label}
                icon={d.icon}
                isActive={dateRange === d.key}
                onPress={() => setDateRange(dateRange === d.key ? 'all' : d.key)}
                color={colors.primary}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── ACTIVE FILTER TAGS ── */}
        {activeFilterChips.length > 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.activeFiltersRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 8 }}>
              {activeFilterChips.map(chip => (
                <TouchableOpacity
                  key={chip.key}
                  style={[styles.activeFilterTag, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF', borderColor: isDark ? '#2D3560' : '#C7D2FE' }]}
                  onPress={chip.onClear}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activeFilterTagText, { color: isDark ? '#818CF8' : '#6366F1' }]}>{chip.label}</Text>
                  <Ionicons name="close" size={12} color={isDark ? '#818CF8' : '#6366F1'} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.clearAllTag, { backgroundColor: isDark ? '#2D1518' : '#FEF2F2', borderColor: isDark ? '#4D2528' : '#FECACA' }]} 
                onPress={clearActiveFilters} 
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={12} color="#EF4444" />
                <Text style={styles.clearAllTagText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}

        {/* ── ALERT BANNER ── */}
        <Animated.View 
          entering={FadeInDown.springify().delay(350)} 
          style={[styles.alertBanner, { backgroundColor: isDark ? '#2D1F0E' : '#FFF7ED', borderColor: isDark ? '#4D3520' : '#FED7AA' }]}
        >
          <View style={[styles.alertIconBg, { backgroundColor: isDark ? '#4D3520' : '#FFEDD5' }]}>
            <Ionicons name="sparkles" size={16} color={isDark ? '#FDBA74' : '#EA580C'} />
          </View>
          <View style={styles.alertTextContainer}>
            <Text style={[styles.alertTitle, { color: isDark ? '#FDBA74' : '#7C2D12' }]}>Smart Spend Alert</Text>
            <Text style={[styles.alertDesc, { color: isDark ? '#FED7AA' : '#9A3412' }]}>
              You've spent 15% more on electronics this month compared to your average. Want to adjust your budget?
            </Text>
          </View>
        </Animated.View>

        {/* ── LOADING / EMPTY / LIST ── */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSub }]}>Loading transactions...</Text>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={isDark ? '#3D3D4D' : '#D1D5DB'} />
            <Text style={[styles.emptyTitle, { color: colors.textMain }]}>No transactions found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSub }]}>
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filters'
                : 'Start adding expenses to see them here'}
            </Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity 
                style={[styles.emptyResetBtn, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]} 
                onPress={clearActiveFilters}
              >
                <Ionicons name="refresh" size={16} color={isDark ? '#818CF8' : '#6366F1'} />
                <Text style={[styles.emptyResetText, { color: isDark ? '#818CF8' : '#6366F1' }]}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          sections.map((section, idx) => (
            <Animated.View key={idx} entering={FadeInDown.springify().delay(400 + (idx * 60))}>
              {/* Section Header */}
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionLeft}>
                  <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.sectionTitle, { color: colors.textSub }]}>{section.section}</Text>
                </View>
                <View style={styles.sectionRight}>
                  <Text style={[styles.sectionTotal, { color: colors.textMain }]}>{formatAmount(section.total)}</Text>
                  <Text style={[styles.sectionCount, { color: colors.textSub }]}>{section.count}</Text>
                </View>
              </View>

              {/* Transactions */}
              <View style={styles.transactionGroup}>
                {section.data.map((tx, txIdx) => (
                  <Animated.View
                    key={tx._id}
                    entering={FadeInRight.springify().delay(450 + (txIdx * 30))}
                    style={styles.transactionWrapper}
                  >
                    <TransactionItem
                      expense={tx}
                      title={tx.title}
                      category={tx.category + ' • ' + (tx.account || 'Cash')}
                      amount={tx.amount}
                      isNegative={true}
                      onRefresh={fetchExpenses}
                    />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ══════════════════════════════════════
         FILTER MODAL (Bottom Sheet)
         ══════════════════════════════════════ */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* Modal Handle */}
            <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3D3D4D' : '#E2E8F0' }]} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF' }]}>
                  <Ionicons name="options" size={20} color={isDark ? '#818CF8' : '#6366F1'} />
                </View>
                <Text style={[styles.modalHeaderTitle, { color: colors.textMain }]}>Filters & Sort</Text>
              </View>
              <TouchableOpacity 
                style={[styles.modalClearBtn, { backgroundColor: isDark ? '#2D1518' : '#FEF2F2', borderColor: isDark ? '#4D2528' : '#FECACA' }]} 
                onPress={clearAllFilters}
              >
                <Ionicons name="refresh" size={14} color="#EF4444" />
                <Text style={styles.modalClearText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody} bounces={false}>

              {/* ── Date Range ── */}
              <FilterSection title="Date Range" icon="calendar-outline">
                <View style={styles.chipGrid}>
                  {DATE_RANGES.map(d => (
                    <SelectChip
                      key={d.key}
                      label={d.label}
                      icon={d.icon}
                      isSelected={tempDateRange === d.key}
                      onPress={() => setTempDateRange(d.key)}
                      color={colors.primary}
                    />
                  ))}
                </View>
              </FilterSection>

              {/* ── Category ── */}
              <FilterSection title="Category" icon="pricetag-outline">
                <View style={styles.chipGrid}>
                  {CATEGORY_LIST.map(c => (
                    <SelectChip
                      key={c.key}
                      label={c.key.split(' & ')[0]}
                      icon={c.icon}
                      color={c.color}
                      isSelected={tempCategories.includes(c.key)}
                      onPress={() => toggleCategory(c.key)}
                    />
                  ))}
                </View>
              </FilterSection>

              {/* ── Payment Method ── */}
              <FilterSection title="Payment Method" icon="card-outline">
                <View style={styles.chipGrid}>
                  {PAYMENT_LIST.map(p => (
                    <SelectChip
                      key={p.key}
                      label={p.key}
                      icon={p.icon}
                      color={p.color}
                      isSelected={tempPayments.includes(p.key)}
                      onPress={() => togglePayment(p.key)}
                    />
                  ))}
                </View>
              </FilterSection>

              {/* ── Amount Range ── */}
              <FilterSection title="Amount Range" icon="cash-outline">
                <View style={styles.amountRangeRow}>
                  <View style={[styles.amountInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={styles.amountInputLabel}>Min {currencySymbol}</Text>
                    <TextInput
                      style={[styles.amountRangeInput, { color: colors.textMain }]}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={isDark ? '#666' : '#CBD5E1'}
                      value={tempMinAmount}
                      onChangeText={setTempMinAmount}
                    />
                  </View>
                  <View style={styles.amountDash}>
                    <Text style={styles.amountDashText}>—</Text>
                  </View>
                  <View style={[styles.amountInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={styles.amountInputLabel}>Max {currencySymbol}</Text>
                    <TextInput
                      style={[styles.amountRangeInput, { color: colors.textMain }]}
                      keyboardType="numeric"
                      placeholder="∞"
                      placeholderTextColor={isDark ? '#666' : '#CBD5E1'}
                      value={tempMaxAmount}
                      onChangeText={setTempMaxAmount}
                    />
                  </View>
                </View>
              </FilterSection>

              {/* ── Sort By ── */}
              <FilterSection title="Sort By" icon="swap-vertical-outline">
                <View style={styles.chipGrid}>
                  {SORT_OPTIONS.map(s => (
                    <SelectChip
                      key={s.key}
                      label={s.label}
                      icon={s.icon}
                      isSelected={tempSortBy === s.key}
                      onPress={() => setTempSortBy(s.key)}
                      color={colors.primary}
                    />
                  ))}
                </View>
              </FilterSection>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* ── Apply Button ── */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                onPress={applyFilters}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

/* ══════════════════════════════════════
   STYLES
   ══════════════════════════════════════ */
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },

  // ── Header ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, marginTop: 6,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0DABC6' },
  notifBtn: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },

  // ── Title ──
  screenTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6,
  },
  summaryChipText: { fontSize: 12, fontWeight: '600' },

  // ── Search Row ──
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  searchInput: { flex: 1, height: '100%', fontSize: 14 },

  // ── Filter Icon Button ──
  filterIconBtn: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  filterIconBtnActive: {},
  filterBadge: {
    position: 'absolute', top: -4, right: -4, width: 18, height: 18,
    borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  filterBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Notification Badge on Header
  notifBadge: {
    position: 'absolute', top: -6, right: -8,
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // ── Quick Filter Chips ──
  quickChipRow: { gap: 8, paddingRight: 20, marginBottom: 10 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1,
  },
  quickChipActive: {},
  quickChipText: { fontSize: 11, fontWeight: '600' },
  quickChipTextActive: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // ── Active Filter Tags ──
  activeFiltersRow: { marginBottom: 12 },
  activeFilterTag: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  activeFilterTagText: { fontSize: 11, fontWeight: '600' },
  clearAllTag: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4,
    borderWidth: 1,
  },
  clearAllTagText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },

  // ── Alert Banner ──
  alertBanner: {
    flexDirection: 'row', borderRadius: 16, padding: 16,
    marginBottom: 16, alignItems: 'center', borderWidth: 1,
  },
  alertIconBg: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  alertTextContainer: { flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  alertDesc: { fontSize: 11, lineHeight: 16 },

  // ── Loading & Empty ──
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySubtext: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  emptyResetBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 16, gap: 6,
  },
  emptyResetText: { fontSize: 13, fontWeight: '700' },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  sectionRight: { alignItems: 'flex-end' },
  sectionTotal: { fontSize: 13, fontWeight: '700' },
  sectionCount: { fontSize: 10, marginTop: 1 },

  // ── Transaction Cards ──
  transactionGroup: { gap: 4 },
  transactionWrapper: { position: 'relative' },

  // ══════════════════════════════
  // FILTER MODAL
  // ══════════════════════════════
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.8, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 16,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  modalHeaderIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: '800' },
  modalClearBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 5,
    borderWidth: 1,
  },
  modalClearText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  modalBody: { paddingHorizontal: 20 },

  // ── Filter Section ──
  filterSection: { marginBottom: 20 },
  filterSectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  filterSectionTitle: { fontSize: 14, fontWeight: '700' },

  // ── Chip Grid ──
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5,
  },
  selectChipText: { fontSize: 12, fontWeight: '600' },
  selectChipCheck: {
    width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 5,
  },

  // ── Amount Range ──
  amountRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountInputWrap: {
    flex: 1, borderRadius: 12, padding: 12,
    borderWidth: 1.5,
  },
  amountInputLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
  amountRangeInput: { fontSize: 18, fontWeight: '700' },
  amountDash: { paddingHorizontal: 4 },
  amountDashText: { fontSize: 18, color: '#CBD5E1', fontWeight: '300' },

  // ── Modal Footer ──
  modalFooter: { paddingHorizontal: 20, paddingTop: 12 },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  applyBtnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
});