import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, ScrollView, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInRight, FadeInDown, ZoomIn, SlideOutRight,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Categories matching AddExpenseScreen ──────────────────────
const CATEGORIES = [
  { key: 'Shopping & Retail', icon: 'bag-handle', color: '#FF6B6B', bgColor: '#FFF0F0' },
  { key: 'Food & Dining', icon: 'restaurant', color: '#FF9F43', bgColor: '#FFF5EB' },
  { key: 'Transport', icon: 'car-sport', color: '#54A0FF', bgColor: '#EBF5FF' },
  { key: 'Entertainment', icon: 'game-controller', color: '#A855F7', bgColor: '#F5EBFF' },
  { key: 'Bills', icon: 'receipt', color: '#10B981', bgColor: '#ECFDF5' },
  { key: 'Other', icon: 'ellipsis-horizontal-circle', color: '#6B7280', bgColor: '#F3F4F6' },
];

// ── Source badge config ──────────────────────────────────────
const SOURCE_CONFIG = {
  SMS: { icon: 'chatbubble-ellipses', label: 'SMS', color: '#3B82F6', bg: '#EFF6FF' },
  NOTIFICATION: { icon: 'notifications', label: 'Notification', color: '#8B5CF6', bg: '#F5F3FF' },
};

/**
 * TransactionConfirmationCard
 * 
 * Editable confirmation card for auto-detected transactions.
 * Allows user to edit amount, category, merchant, add notes before confirming.
 */
export default function TransactionConfirmationCard({
  item,
  index = 0,
  onConfirm,
  onDismiss,
  isActioning = false,
  currencySymbol = '₹',
}) {
  const { colors, isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  // ── Editable fields ────────────────────────────────────────
  const [editAmount, setEditAmount] = useState(String(item.amount));
  const [editMerchant, setEditMerchant] = useState(item.merchant);
  const [editCategory, setEditCategory] = useState(item.category);
  const [editNote, setEditNote] = useState(item.note || '');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const sourceConfig = SOURCE_CONFIG[item.source] || SOURCE_CONFIG.SMS;
  const categoryItem = CATEGORIES.find(c => c.key === editCategory) || CATEGORIES[5];
  const isHighConfidence = item.confidenceScore >= 85;
  const formattedDate = new Date(item.date).toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // ── Confirm handler ────────────────────────────────────────
  const handleConfirm = () => {
    const finalAmount = parseFloat(editAmount);
    if (!finalAmount || finalAmount <= 0) {
      return;
    }
    onConfirm(item._id, {
      amount: finalAmount,
      category: editCategory,
      merchant: editMerchant,
      note: editNote,
    });
  };

  // ── Dismiss handler ────────────────────────────────────────
  const handleDismiss = () => {
    onDismiss(item._id);
  };

  const catBg = isDark ? (categoryItem.color + '15') : categoryItem.bgColor;

  return (
    <>
      <Animated.View
        entering={FadeInRight.springify().delay(200 + index * 120)}
        exiting={SlideOutRight.springify()}
      >
        <View style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isActioning && { opacity: 0.5 },
        ]}>
          {/* ── Header: Source Badge + Merchant + Amount ─── */}
          <View style={styles.cardHeader}>
            {/* Source Badge */}
            <View style={[styles.sourceBadge, { backgroundColor: isDark ? sourceConfig.color + '20' : sourceConfig.bg }]}>
              <Ionicons name={sourceConfig.icon} size={12} color={sourceConfig.color} />
              <Text style={[styles.sourceBadgeText, { color: sourceConfig.color }]}>{sourceConfig.label}</Text>
            </View>

            {/* Confidence */}
            <View style={[styles.confidenceBadge, { backgroundColor: colors.inputBg }]}>
              <View style={[styles.dot, { backgroundColor: isHighConfidence ? colors.success : colors.warning }]} />
              <Text style={[styles.confidenceText, { color: colors.textSub }]}>{item.confidenceScore}%</Text>
            </View>
          </View>

          {/* ── Main Content ──────────────────────── */}
          <View style={styles.mainContent}>
            {/* Category Icon */}
            <Animated.View entering={ZoomIn.springify().delay(300 + index * 120)}>
              <View style={[styles.iconContainer, { backgroundColor: catBg }]}>
                <Ionicons name={categoryItem.icon} size={24} color={categoryItem.color} />
              </View>
            </Animated.View>

            {/* Details */}
            <View style={styles.details}>
              <Text style={[styles.merchantName, { color: colors.textMain }]} numberOfLines={1}>
                {isEditing ? editMerchant : item.merchant}
              </Text>
              <Text style={[styles.categoryLabel, { color: colors.textSub }]}>
                {editCategory}
              </Text>
              <View style={styles.dateRow}>
                <Ionicons name="time-outline" size={11} color={colors.textSub} style={{ marginRight: 3 }} />
                <Text style={[styles.dateText, { color: colors.textSub }]}>{formattedDate}</Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.amountWrap}>
              <Text style={[
                styles.amountText,
                { color: item.transactionType === 'Credit' ? colors.success : colors.textMain },
              ]}>
                {item.transactionType === 'Credit' ? '+' : '-'} {currencySymbol}{parseFloat(editAmount).toLocaleString('en-IN')}
              </Text>
              {item.transactionType && (
                <Text style={[styles.typeLabel, {
                  color: item.transactionType === 'Credit' ? colors.success : colors.danger,
                  backgroundColor: item.transactionType === 'Credit'
                    ? (isDark ? '#0D281820' : '#ECFDF5')
                    : (isDark ? '#2D151820' : '#FEF2F2'),
                }]}>
                  {item.transactionType}
                </Text>
              )}
            </View>
          </View>

          {/* ── Reference Number (if available) ───── */}
          {item.reference ? (
            <View style={[styles.refRow, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="document-text-outline" size={12} color={colors.textSub} style={{ marginRight: 4 }} />
              <Text style={[styles.refText, { color: colors.textSub }]}>Ref: {item.reference}</Text>
            </View>
          ) : null}

          {/* ── Note Input ────────────────────────── */}
          {isEditing && (
            <Animated.View entering={FadeInDown.springify()}>
              {/* Editable Amount */}
              <View style={styles.editFieldRow}>
                <Text style={[styles.editFieldLabel, { color: colors.textSub }]}>Amount</Text>
                <View style={[styles.editInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Text style={[styles.editCurrency, { color: colors.textMain }]}>{currencySymbol}</Text>
                  <TextInput
                    style={[styles.editInputText, { color: colors.textMain }]}
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSub}
                  />
                </View>
              </View>

              {/* Editable Merchant */}
              <View style={styles.editFieldRow}>
                <Text style={[styles.editFieldLabel, { color: colors.textSub }]}>Merchant</Text>
                <View style={[styles.editInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.editInputText, { color: colors.textMain, flex: 1 }]}
                    value={editMerchant}
                    onChangeText={setEditMerchant}
                    placeholder="Merchant name"
                    placeholderTextColor={colors.textSub}
                  />
                </View>
              </View>

              {/* Category Selector */}
              <View style={styles.editFieldRow}>
                <Text style={[styles.editFieldLabel, { color: colors.textSub }]}>Category</Text>
                <TouchableOpacity
                  style={[styles.editInput, styles.categorySelector, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  onPress={() => setShowCategoryModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIconSmall, { backgroundColor: isDark ? categoryItem.color + '20' : categoryItem.bgColor }]}>
                    <Ionicons name={categoryItem.icon} size={14} color={categoryItem.color} />
                  </View>
                  <Text style={[styles.editInputText, { color: colors.textMain, flex: 1 }]}>{editCategory}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textSub} />
                </TouchableOpacity>
              </View>

              {/* Note */}
              <View style={styles.editFieldRow}>
                <Text style={[styles.editFieldLabel, { color: colors.textSub }]}>Note</Text>
                <View style={[styles.editInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.editInputText, { color: colors.textMain, flex: 1 }]}
                    value={editNote}
                    onChangeText={setEditNote}
                    placeholder="Add a note..."
                    placeholderTextColor={colors.textSub}
                    maxLength={120}
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Action Buttons ────────────────────── */}
          <View style={styles.actionRow}>
            {/* Confirm Button */}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={isActioning}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmText}>Save Expense</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Edit Toggle Button */}
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: isDark ? '#2D2D3D' : '#F3F4F6' }]}
              onPress={() => setIsEditing(!isEditing)}
              activeOpacity={0.8}
              disabled={isActioning}
            >
              <Ionicons
                name={isEditing ? 'chevron-up' : 'create-outline'}
                size={16}
                color={colors.textMain}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.editText, { color: colors.textMain }]}>
                {isEditing ? 'Less' : 'Edit'}
              </Text>
            </TouchableOpacity>

            {/* Dismiss Button */}
            <TouchableOpacity
              style={[styles.dismissBtn, {
                backgroundColor: isDark ? '#2D1518' : '#FEF2F2',
                borderColor: isDark ? '#4D2528' : '#FECACA',
              }]}
              onPress={handleDismiss}
              activeOpacity={0.8}
              disabled={isActioning}
            >
              <Ionicons name="close" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* ── Category Selection Modal ──────────── */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>Select Category</Text>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? colors.inputBg : '#F1F5F9' }]}
                onPress={() => setShowCategoryModal(false)}
              >
                <Ionicons name="close" size={20} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {CATEGORIES.map((cat, idx) => {
                const isSelected = editCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      isSelected && [styles.modalOptionSelected, { backgroundColor: isDark ? colors.inputBg : '#F8FAFC' }],
                      idx === CATEGORIES.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      setEditCategory(cat.key);
                      setShowCategoryModal(false);
                    }}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.modalOptionIcon, { backgroundColor: isSelected ? cat.color + '20' : (isDark ? cat.color + '15' : cat.bgColor) }]}>
                      <Ionicons name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <Text style={[
                      styles.modalOptionText,
                      { color: colors.textMain },
                      isSelected && { color: cat.color, fontWeight: '800' },
                    ]}>
                      {cat.key}
                    </Text>
                    {isSelected && (
                      <View style={[styles.modalCheckCircle, { backgroundColor: cat.color }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  // Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Main content
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  details: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
  },
  amountWrap: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },

  // Reference
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  refText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Edit fields
  editFieldRow: {
    marginBottom: 12,
  },
  editFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  editInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  editCurrency: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  editInputText: {
    fontSize: 15,
    fontWeight: '600',
  },
  categorySelector: {
    justifyContent: 'space-between',
  },
  categoryIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  editBtn: {
    flex: 0.6,
    flexDirection: 'row',
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    fontWeight: '700',
    fontSize: 14,
  },
  dismissBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDivider: {
    height: 1,
    marginBottom: 8,
  },
  modalScroll: {
    paddingHorizontal: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  modalOptionSelected: {
    borderRadius: 14,
    marginVertical: 2,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  modalCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
