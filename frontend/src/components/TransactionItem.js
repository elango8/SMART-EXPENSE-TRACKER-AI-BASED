import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

// ── Payment method icon & color mapping ──────────────────────────
const paymentMethodStyles = {
  'UPI': {
    icon: 'phone-portrait-outline',
    gradient1: '#E8F5E9',   // light mint green
    gradient2: '#C8E6C9',
    iconBg: '#A5D6A7',
    iconColor: '#2E7D32',
    accent: '#43A047',
    label: 'UPI',
  },
  'Credit Card': {
    icon: 'card-outline',
    gradient1: '#EDE7F6',   // light lavender
    gradient2: '#D1C4E9',
    iconBg: '#B39DDB',
    iconColor: '#4527A0',
    accent: '#7E57C2',
    label: 'Card',
  },
  'Bank Account': {
    icon: 'business-outline',
    gradient1: '#E3F2FD',   // light sky blue
    gradient2: '#BBDEFB',
    iconBg: '#90CAF9',
    iconColor: '#1565C0',
    accent: '#42A5F5',
    label: 'Bank',
  },
  'Cash': {
    icon: 'wallet-outline',
    gradient1: '#FFF8E1',   // light warm yellow
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

// ── Category icons (kept for subtitle display) ───────────────────
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

export default function TransactionItem({ expense, title, category, date, amount, isNegative = true, disablePress = false }) {
  const navigation = useNavigation();
  const pm = getPaymentStyle(expense?.account);
  const catIcon = categoryIcons[category?.split(' • ')[0]] || categoryIcons['Default'];

  const CardWrapper = disablePress ? View : TouchableOpacity;
  const wrapperProps = disablePress
    ? {}
    : {
        activeOpacity: 0.7,
        onPress: () => navigation.navigate('EditExpense', { expense }),
      };

  return (
    <CardWrapper
      {...wrapperProps}
      style={[
        styles.card,
        {
          backgroundColor: pm.gradient1,
          borderColor: pm.gradient2,
        },
      ]}
    >
      {/* Glassy overlay effect */}
      <View style={[styles.glassOverlay, { backgroundColor: pm.gradient2 }]} />
      <View style={styles.glassShine} />

      {/* ── Left: payment icon ── */}
      <View style={styles.iconSection}>
        <View style={[styles.iconCircle, { backgroundColor: pm.iconBg + '40' }]}>
          <Ionicons name={pm.icon} size={20} color={pm.iconColor} />
        </View>
        <Text style={[styles.paymentLabel, { color: pm.iconColor }]}>{pm.label}</Text>
      </View>

      {/* ── Middle: details ── */}
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>{title || 'Untitled'}</Text>
        <View style={styles.metaRow}>
          <Ionicons name={catIcon} size={12} color={colors.textSub} />
          <Text style={styles.categoryText} numberOfLines={1}>{category}</Text>
        </View>
        {date ? <Text style={styles.dateText}>{date}</Text> : null}
      </View>
      
      {/* ── Right: amount ── */}
      <View style={styles.amountSection}>
        <Text style={[styles.amount, { color: isNegative ? '#D32F2F' : '#2E7D32' }]}>
          {isNegative ? '-' : '+'}₹{Math.abs(amount).toLocaleString('en-IN')}
          <View style={[styles.amountBadge, { backgroundColor: isNegative ? '#FFEBEE' : '#E8F5E9' }]}>
          <Ionicons
            name={isNegative ? 'arrow-down' : 'arrow-up'}
            size={10}
            color={isNegative ? '#D32F2F' : '#2E7D32'}
          />
          <Text style={[styles.amountBadgeText, { color: isNegative ? '#D32F2F' : '#2E7D32' }]}>
            {isNegative ? 'Expense' : 'Income'}
          </Text>
        </View>
        </Text>

      </View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    overflow: 'hidden',
    // Glassmorphism shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // ── Glass effect layers ──
  glassOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    opacity: 0.25,
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 60,
  },
  glassShine: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // ── Icon section ──
  iconSection: {
    alignItems: 'center',
    marginRight: 12,
    width: 44,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOuter: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconInner: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    // Inner 3D depth effect
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconShadowRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 2,
    opacity: 0.15,
  },
  paymentLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 4,
    textTransform: 'uppercase',
  },

  // ── Details ──
  details: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textSub,
    marginLeft: 4,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: colors.textSub,
    opacity: 0.7,
    marginTop: 1,
  },

  // ── Amount ──
  amountSection: {
    alignItems: 'flex-end',
    marginTop: 35,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 1,
    marginLeft: 4,
  },
  amountBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 2,
    letterSpacing: 0.3,
  },
});