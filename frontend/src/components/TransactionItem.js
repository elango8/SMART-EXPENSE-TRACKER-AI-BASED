import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

const categoryIcons = {
  'Dining & Drinks': { icon: 'restaurant-outline', bg: '#FFEBEB', color: '#FF4C4C' },
  'Groceries': { icon: 'cart-outline', bg: '#FFF3E0', color: '#FF9800' },
  'Transport': { icon: 'car-outline', bg: '#E3F2FD', color: '#2196F3' },
  'Tech': { icon: 'laptop-outline', bg: '#F3E5F5', color: '#9C27B0' },
  'Utilities': { icon: 'flash-outline', bg: '#E0F7FA', color: '#00BCD4' },
  'Apparel': { icon: 'shirt-outline', bg: '#FCE4EC', color: '#E91E63' },
  'Income': { icon: 'cash-outline', bg: '#E8F5E9', color: '#4CAF50' },
  'Default': { icon: 'card-outline', bg: '#F5F5F5', color: '#9E9E9E' }
};

export default function TransactionItem({ expense, title, category, date, amount, isNegative = true }) {

  const navigation = useNavigation();
  const cat = categoryIcons[category] || categoryIcons['Default'];

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => navigation.navigate('EditExpense', { expense })}
    >
      <View style={[styles.iconContainer, { backgroundColor: cat.bg }]}>
        <Ionicons name={cat.icon} size={24} color={cat.color} />
      </View>

      <View style={styles.details}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{date} • {category}</Text>
      </View>

      <Text style={[styles.amount, { color: isNegative ? colors.textMain : colors.success }]}>
        {isNegative ? '-' : '+'}₹{Math.abs(amount)}
      </Text>
    </TouchableOpacity>
  );
}