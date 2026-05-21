import React, { useState, useContext, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing,
  Layout,
} from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import TransactionItem from '../components/TransactionItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ──────────────────────────────────────
   FILTER CHIP COMPONENT
   ────────────────────────────────────── */
const FilterChip = ({ label, icon, isActive, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.filterPill,
        isActive && styles.filterPillActive
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={14}
        color={isActive ? '#fff' : colors.textSub}
        style={{ marginRight: 6 }}
      />
      <Text style={isActive ? styles.filterTextActive : styles.filterText}>
        {label}
      </Text>
      {isActive && (
        <Ionicons
          name="checkmark-circle"
          size={14}
          color="#fff"
          style={{ marginLeft: 4 }}
        />
      )}
    </TouchableOpacity>
  );
};

/* ──────────────────────────────────────
   SUB-FILTER SCROLL BAR
   ────────────────────────────────────── */
const SubFilterBar = ({ items, selected, onSelect, icon }) => {
  const scrollRef = useRef(null);

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={styles.subFilterWrapper}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subFilterScroll}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.subFilterChip,
            selected === 'All' && styles.subFilterChipActive
          ]}
          onPress={() => onSelect('All')}
        >
          <Text style={[
            styles.subFilterChipText,
            selected === 'All' && styles.subFilterChipTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>

        {items.map((item) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.7}
            style={[
              styles.subFilterChip,
              selected === item && styles.subFilterChipActive
            ]}
            onPress={() => onSelect(item)}
          >
            <Text style={[
              styles.subFilterChipText,
              selected === item && styles.subFilterChipTextActive
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

/* ──────────────────────────────────────
   MAIN HISTORY SCREEN
   ────────────────────────────────────── */
export default function HistoryScreen({ navigation }) {

  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useContext(AuthContext);

  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [activeMainFilter, setActiveMainFilter] = useState('date'); // 'date' | 'category' | 'payment'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');

  // FETCH EXPENSES
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

  // AUTO REFRESH SCREEN
  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [user])
  );

  // DELETE EXPENSE
  const handleDelete = async (id) => {

    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {
            try {

              await api.delete(`/expenses/${id}`);

              Alert.alert(
                'Success',
                'Expense deleted successfully'
              );

              fetchExpenses();

            } catch (error) {

              console.log(error);

              Alert.alert(
                'Error',
                'Failed to delete expense'
              );
            }
          }
        }
      ]
    );
  };

  // Extract unique categories and payment methods
  const uniqueCategories = [...new Set(expenses.map(e => e.category).filter(Boolean))];
  const uniquePayments = [...new Set(expenses.map(e => e.account || 'Cash').filter(Boolean))];

  // FILTER EXPENSES — search + category/payment sub-filters
  const filteredExpenses = expenses.filter(ex => {
    // Search filter
    const matchesSearch =
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      selectedCategory === 'All' || ex.category === selectedCategory;

    // Payment filter
    const matchesPayment =
      selectedPayment === 'All' || (ex.account || 'Cash') === selectedPayment;

    return matchesSearch && matchesCategory && matchesPayment;
  });

  // GROUP BY DATE
  const groupedData = filteredExpenses.reduce((acc, curr) => {

    const d = new Date(curr.date);

    const dateStr = d.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    ).toUpperCase();

    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }

    acc[dateStr].push(curr);

    return acc;

  }, {});

  // CREATE SECTIONS
  const sections = Object.keys(groupedData).map(dateStr => ({
    section: dateStr,

    count:
      groupedData[dateStr].length === 1
        ? '1 Transaction'
        : `${groupedData[dateStr].length} Transactions`,

    total: groupedData[dateStr].reduce((sum, tx) => sum + Number(tx.amount), 0),

    data: groupedData[dateStr]
  }));

  // Handle main filter toggle
  const handleMainFilter = (filter) => {
    if (activeMainFilter === filter) {
      // Toggle off — reset to date view
      setActiveMainFilter('date');
      setSelectedCategory('All');
      setSelectedPayment('All');
    } else {
      setActiveMainFilter(filter);
      if (filter === 'category') setSelectedPayment('All');
      if (filter === 'payment') setSelectedCategory('All');
    }
  };

  // Transaction count summary
  const totalFiltered = filteredExpenses.length;
  const totalAmount = filteredExpenses.reduce((sum, ex) => sum + Number(ex.amount), 0);

  return (

    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}
        <View style={styles.header}>

          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <Text style={styles.logoText}>
              Finovo
            </Text>
          </View>

          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>

        </View>

        {/* TITLE + SUMMARY */}
        <Animated.View entering={FadeInDown.springify().delay(100)}>

          <Text style={styles.screenTitle}>
            History
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryChip}>
              <Ionicons name="receipt-outline" size={14} color="#6366F1" />
              <Text style={styles.summaryChipText}>
                {totalFiltered} transactions
              </Text>
            </View>
            <View style={[styles.summaryChip, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="trending-down" size={14} color="#EF4444" />
              <Text style={[styles.summaryChipText, { color: '#EF4444' }]}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

        </Animated.View>

        {/* SEARCH */}
        <Animated.View
          entering={FadeInDown.springify().delay(200)}
          style={styles.searchContainer}
        >

          <Ionicons
            name="search"
            size={18}
            color={colors.textSub}
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textSub}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSub} />
            </TouchableOpacity>
          )}

        </Animated.View>

        {/* MAIN FILTER NAVBAR — Scrollable */}
        <Animated.View entering={FadeInDown.springify().delay(300)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            style={styles.filterContainer}
          >
            <FilterChip
              label="Last 30 Days"
              icon="calendar"
              isActive={activeMainFilter === 'date'}
              onPress={() => handleMainFilter('date')}
            />

            <FilterChip
              label="Category"
              icon="grid-outline"
              isActive={activeMainFilter === 'category'}
              onPress={() => handleMainFilter('category')}
            />

            <FilterChip
              label="Payment"
              icon="card-outline"
              isActive={activeMainFilter === 'payment'}
              onPress={() => handleMainFilter('payment')}
            />
          </ScrollView>
        </Animated.View>

        {/* SUB-FILTER: CATEGORY SCROLL BAR */}
        {activeMainFilter === 'category' && uniqueCategories.length > 0 && (
          <SubFilterBar
            items={uniqueCategories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            icon="grid-outline"
          />
        )}

        {/* SUB-FILTER: PAYMENT SCROLL BAR */}
        {activeMainFilter === 'payment' && uniquePayments.length > 0 && (
          <SubFilterBar
            items={uniquePayments}
            selected={selectedPayment}
            onSelect={setSelectedPayment}
            icon="card-outline"
          />
        )}

        {/* ALERT */}
        <Animated.View
          entering={FadeInDown.springify().delay(400)}
          style={styles.alertBanner}
        >

          <View style={styles.alertIconBg}>

            <Ionicons
              name="sparkles"
              size={16}
              color={colors.textMain}
            />

          </View>

          <View style={styles.alertTextContainer}>

            <Text style={styles.alertTitle}>
              Smart Spend Alert
            </Text>

            <Text style={styles.alertDesc}>
              You've spent 15% more on electronics this month compared to your average. Want to adjust your budget?
            </Text>

          </View>

        </Animated.View>

        {/* LOADING */}
        {isLoading ? (

          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>

        ) : sections.length === 0 ? (

          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory !== 'All' || selectedPayment !== 'All'
                ? 'Try adjusting your filters'
                : 'Start adding expenses to see them here'}
            </Text>
          </View>

        ) : (

          sections.map((section, idx) => (

            <Animated.View
              key={idx}
              entering={FadeInDown.springify().delay(500 + (idx * 80))}
            >

              {/* SECTION HEADER */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionLeft}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>
                    {section.section}
                  </Text>
                </View>

                <View style={styles.sectionRight}>
                  <Text style={styles.sectionTotal}>
                    ₹{section.total.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.sectionCount}>
                    {section.count}
                  </Text>
                </View>
              </View>

              {/* TRANSACTIONS */}
              <View style={styles.transactionGroup}>
                {section.data.map((tx, txIdx) => (

                  <Animated.View
                    key={tx._id}
                    entering={FadeInRight.springify().delay(550 + (txIdx * 40))}
                    style={styles.transactionWrapper}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        navigation.navigate('EditExpense', {
                          expense: tx
                        })
                      }
                      style={styles.transactionTouchable}
                    >
                      <TransactionItem
                        expense={tx}
                        title={tx.title}
                        category={
                          tx.category +
                          ' • ' +
                          (tx.account || 'Cash')
                        }
                        amount={tx.amount}
                        isNegative={true}
                      />
                    </TouchableOpacity>

                    {/* DELETE BUTTON — inline icon */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(tx._id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>

                  </Animated.View>

                ))}
              </View>

            </Animated.View>

          ))
        )}

        <View style={{ height: 100 }} />

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 6
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  logoImage: {
    width: 32,
    height: 32,
    marginRight: 8
  },

  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0DABC6'
  },

  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },

  // ── Title ──
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 10,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },

  summaryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },

  // ── Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },

  searchIcon: {
    marginRight: 10
  },

  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: colors.textMain
  },

  // ── Main Filter Navbar ──
  filterContainer: {
    marginBottom: 8,
  },

  filterScrollContent: {
    paddingRight: 8,
    gap: 10,
  },

  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },

  filterPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },

  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSub
  },

  filterTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff'
  },

  // ── Sub-Filter Scroll Bar ──
  subFilterWrapper: {
    marginBottom: 12,
    marginTop: 4,
  },

  subFilterScroll: {
    paddingRight: 8,
    gap: 8,
  },

  subFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  subFilterChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },

  subFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSub,
  },

  subFilterChipTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },

  // ── Alert Banner ──
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },

  alertIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  alertTextContainer: {
    flex: 1
  },

  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 3
  },

  alertDesc: {
    fontSize: 11,
    color: colors.textSub,
    lineHeight: 16
  },

  // ── Loading & Empty ──
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSub,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMain,
    marginTop: 12,
  },

  emptySubtext: {
    fontSize: 13,
    color: colors.textSub,
    marginTop: 4,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    marginRight: 8,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSub,
    letterSpacing: 0.8,
  },

  sectionRight: {
    alignItems: 'flex-end',
  },

  sectionTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
  },

  sectionCount: {
    fontSize: 10,
    color: colors.textSub,
    marginTop: 1,
  },

  // ── Transaction Cards ──
  transactionGroup: {
    gap: 6,
  },

  transactionWrapper: {
    position: 'relative',
  },

  transactionTouchable: {
    // Let the TransactionItem handle its own styling
  },

  // ── Delete Button ──
  deleteButton: {
    position: 'absolute',
    right: 18,
    top: 20,
    width: 110,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
});