import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import api from '../services/api';

// ── Payment method icon & color mapping ──────────────────────────
const paymentMethodStyles = {
  'UPI': {
    icon: 'phone-portrait-outline',
    gradient1: '#E8F5E9',
    gradient2: '#C8E6C9',
    iconBg: '#A5D6A7',
    iconColor: '#2E7D32',
    accent: '#43A047',
    label: 'UPI',
  },
  'Credit Card': {
    icon: 'card-outline',
    gradient1: '#EDE7F6',
    gradient2: '#D1C4E9',
    iconBg: '#B39DDB',
    iconColor: '#4527A0',
    accent: '#7E57C2',
    label: 'Card',
  },
  'Bank Account': {
    icon: 'business-outline',
    gradient1: '#E3F2FD',
    gradient2: '#BBDEFB',
    iconBg: '#90CAF9',
    iconColor: '#1565C0',
    accent: '#42A5F5',
    label: 'Bank',
  },
  'Cash': {
    icon: 'wallet-outline',
    gradient1: '#FFF8E1',
    gradient2: '#FFECB3',
    iconBg: '#FFD54F',
    iconColor: '#E65100',
    accent: '#FFA000',
    label: 'Cash',
  },
};

const getPaymentStyle = (account) => {
  return paymentMethodStyles[account] || paymentMethodStyles['Cash'];
};

// ── Category icons ───────────────────
const categoryIcons = {
  'Dining & Drinks': 'restaurant-outline',
  'Food & Dining': 'restaurant-outline',
  'Groceries': 'cart-outline',
  'Transport': 'car-outline',
  'Tech': 'laptop-outline',
  'Utilities': 'flash-outline',
  'Apparel': 'shirt-outline',
  'Income': 'cash-outline',
  'Shopping & Retail': 'bag-outline',
  'Entertainment': 'game-controller-outline',
  'Bills': 'receipt-outline',
  'Other': 'ellipsis-horizontal-outline',
  'Default': 'pricetag-outline',
};

export default function TransactionItem({ expense, title, category, date, amount, isNegative = true, disablePress = false, showActions = true, onDelete, onRefresh }) {
  const navigation = useNavigation();
  const pm = getPaymentStyle(expense?.account);
  const catIcon = categoryIcons[category?.split(' • ')[0]] || categoryIcons['Default'];
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Edit handler — confirmation then navigate ──
  const handleEdit = () => {
    Alert.alert(
      'Edit Expense',
      `Do you want to edit "${title || 'this expense'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => navigation.navigate('EditExpense', { expense }),
        },
      ]
    );
  };

  // ── Delete handler — confirmation then delete via API ──
  const handleDelete = () => {
    Alert.alert(
      '🗑️ Delete Expense',
      `Are you sure you want to permanently delete "${title || 'this expense'}"?\n\nAmount: ₹${Math.abs(amount).toLocaleString('en-IN')}\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await api.delete(`/expenses/${expense?._id}`);
              Alert.alert('✅ Deleted', 'Expense removed successfully');
              // Refresh the parent list
              if (onDelete) onDelete();
              if (onRefresh) onRefresh();
            } catch (error) {
              console.log('Delete error:', error);
              Alert.alert('Error', 'Failed to delete expense');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: pm.gradient1,
          borderColor: pm.gradient2,
        },
        isDeleting && { opacity: 0.4 },
      ]}
    >
      {/* Glassy overlay */}
      <View style={[styles.glassOverlay, { backgroundColor: pm.gradient2 }]} />
      <View style={styles.glassShine} />

      {/* ── Main Content Row ── */}
      <View style={styles.mainRow}>
        {/* Left: payment icon */}
        <View style={styles.iconSection}>
          <View style={[styles.iconCircle, { backgroundColor: pm.iconBg + '40' }]}>
            <Ionicons name={pm.icon} size={16} color={pm.iconColor} />
          </View>
          <Text style={[styles.paymentLabel, { color: pm.iconColor }]}>{pm.label}</Text>
        </View>

        {/* Middle: details */}
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>{title || 'Untitled'}</Text>
          <View style={styles.metaRow}>
            <Ionicons name={catIcon} size={10} color={colors.textSub} />
            <Text style={styles.categoryText} numberOfLines={1}>{category}</Text>
          </View>
          {date ? <Text style={styles.dateText}>{date}</Text> : null}
        </View>

        {/* Right: amount */}
        <View style={styles.amountSection}>
          <Text style={[styles.amount, { color: isNegative ? '#D32F2F' : '#2E7D32' }]}>
            {isNegative ? '-' : '+'}₹{Math.abs(amount).toLocaleString('en-IN')}
          </Text>
          <View style={[styles.amountBadge, { backgroundColor: isNegative ? '#FFEBEE' : '#E8F5E9' }]}>
            <Ionicons
              name={isNegative ? 'arrow-down' : 'arrow-up'}
              size={8}
              color={isNegative ? '#D32F2F' : '#2E7D32'}
            />
            <Text style={[styles.amountBadgeText, { color: isNegative ? '#D32F2F' : '#2E7D32' }]}>
              {isNegative ? 'Expense' : 'Income'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Action Buttons ── */}
      {!disablePress && showActions && (
        <View style={styles.actionRow}>
          <View style={styles.actionDivider} />
          <View style={styles.actionButtons}>
            {/* Edit Button */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={handleEdit}
              activeOpacity={0.6}
            >
              <Ionicons name="create-outline" size={13} color="#3B82F6" />
              <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Edit</Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteActionBtn]}
              onPress={handleDelete}
              activeOpacity={0.6}
              disabled={isDeleting}
            >
              <Ionicons name="trash-outline" size={13} color="#EF4444" />
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // ── Glass effect layers ──
  glassOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '45%',
    height: '100%',
    opacity: 0.2,
    borderTopLeftRadius: 80,
    borderBottomLeftRadius: 50,
  },
  glassShine: {
    position: 'absolute',
    top: -16,
    left: -16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(240, 236, 236, 0.4)',
  },

  // ── Main content row ──
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Icon section ──
  iconSection: {
    alignItems: 'center',
    marginRight: 10,
    width: 38,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 3,
    textTransform: 'uppercase',
  },

  // ── Details ──
  details: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  categoryText: {
    fontSize: 10,
    color: colors.textSub,
    marginLeft: 3,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 9,
    color: colors.textSub,
    opacity: 0.7,
    marginTop: 1,
  },

  // ── Amount ──
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 3,
  },
  amountBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    marginLeft: 2,
    letterSpacing: 0.2,
  },

  // ── Action Buttons ──
  actionRow: {
    marginTop: 8,
  },
  actionDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flex: 1,
    gap: 5,
  },
  editBtn: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.12)',
  },
  deleteActionBtn: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});