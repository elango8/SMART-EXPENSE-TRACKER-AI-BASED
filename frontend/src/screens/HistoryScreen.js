import React, { useState, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ActivityIndicator,
  Alert
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import TransactionItem from '../components/TransactionItem';

export default function HistoryScreen({ navigation }) {

  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useContext(AuthContext);

  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // FILTER EXPENSES
  const filteredExpenses = expenses.filter(ex =>
    ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

    data: groupedData[dateStr]
  }));

  return (

    <SafeAreaView style={styles.safeArea}>

      <ScrollView contentContainerStyle={styles.container}>

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

          <TouchableOpacity>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>

        </View>

        {/* TITLE */}
        <Animated.View entering={FadeInDown.springify().delay(100)}>

          <Text style={styles.screenTitle}>
            History
          </Text>

        </Animated.View>

        {/* SEARCH */}
        <Animated.View
          entering={FadeInDown.springify().delay(200)}
          style={styles.searchContainer}
        >

          <Ionicons
            name="search"
            size={20}
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

        </Animated.View>

        {/* FILTERS */}
        <Animated.ScrollView
          entering={FadeInDown.springify().delay(300)}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >

          <TouchableOpacity
            style={[
              styles.filterPill,
              styles.filterPillActive
            ]}
          >

            <Ionicons
              name="calendar"
              size={14}
              color="#fff"
              style={{ marginRight: 6 }}
            />

            <Text style={styles.filterTextActive}>
              Last 30 Days
            </Text>

          </TouchableOpacity>

          <TouchableOpacity style={styles.filterPill}>

            <Ionicons
              name="grid-outline"
              size={14}
              color={colors.textSub}
              style={{ marginRight: 6 }}
            />

            <Text style={styles.filterText}>
              Category
            </Text>

          </TouchableOpacity>

          <TouchableOpacity style={styles.filterPill}>

            <Ionicons
              name="cash-outline"
              size={14}
              color={colors.textSub}
              style={{ marginRight: 6 }}
            />

            <Text style={styles.filterText}>
              Payment
            </Text>

          </TouchableOpacity>

        </Animated.ScrollView>

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

          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />

        ) : sections.length === 0 ? (

          <Text
            style={{
              textAlign: 'center',
              color: colors.textSub,
              marginTop: 20
            }}
          >
            No expenses yet
          </Text>

        ) : (

          sections.map((section, idx) => (

            <Animated.View
              key={idx}
              entering={FadeInDown.springify().delay(500 + (idx * 100))}
            >

              {/* SECTION HEADER */}
              <View style={styles.sectionHeader}>

                <Text style={styles.sectionTitle}>
                  {section.section}
                </Text>

                <Text style={styles.sectionCount}>
                  {section.count}
                </Text>

              </View>

              {/* TRANSACTIONS */}
              {section.data.map((tx, txIdx) => (

                <Animated.View
                  key={tx._id}
                  entering={FadeInRight.springify().delay(600 + (txIdx * 50))}
                >

                  <View style={{ position: 'relative' }}>

                    <TouchableOpacity
                       onPress={() =>
                        navigation.navigate('EditExpense', {
                          expense: tx
                        })
                      }
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

                    {/* DELETE BUTTON */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(tx._id)}
                    >

                      <Text style={styles.deleteButtonText}>
                        Delete
                      </Text>

                    </TouchableOpacity>

                  </View>

                </Animated.View>

              ))}

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
    backgroundColor: colors.white
  },

  container: {
    padding: 24,
    paddingBottom: 60
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10
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

  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 24
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20
  },

  searchIcon: {
    marginRight: 12
  },

  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.textMain
  },

  filterContainer: {
    flexDirection: 'row',
    marginBottom: 30
  },

  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12
  },

  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },

  filterText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textSub
  },

  filterTextActive: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff'
  },

  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FCE4EC',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center'
  },

  alertIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },

  alertTextContainer: {
    flex: 1
  },

  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 4
  },

  alertDesc: {
    fontSize: 12,
    color: colors.textSub,
    lineHeight: 18
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSub,
    letterSpacing: 1
  },

  sectionCount: {
    fontSize: 11,
    color: colors.textSub
  },

  deleteButton: {
    position: 'absolute',
    right: 10,
    top: 20,
    backgroundColor: 'red',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },

  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }

});