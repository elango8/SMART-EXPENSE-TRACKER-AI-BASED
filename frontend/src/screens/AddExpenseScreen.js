import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import api from '../services/api';

export default function AddExpenseScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Shopping & Retail');
  const [account, setAccount] = useState('Cash');
  const [date, setDate] = useState(new Date());
  const [uiDateString, setUiDateString] = useState('Today');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('category');
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['Shopping & Retail', 'Food & Dining', 'Transport', 'Entertainment', 'Bills', 'Other'];
  const accounts = ['Cash', 'Bank Account', 'Credit Card', 'UPI'];
  const dates = [
    { label: 'Today', val: new Date() },
    { label: 'Yesterday', val: new Date(Date.now() - 86400000) },
    { label: '2 Days Ago', val: new Date(Date.now() - 86400000 * 2) },
  ];

  const handleSaveExpense = async () => {
    // 🔥 Validation
    if (!title || !amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Error', 'Enter valid title and amount');
      return;
    }

    try {
      setIsLoading(true);

      await api.post('/expenses/add', {
        title: title.trim(),
        amount: Number(amount),
        category: category.trim(),
        account: account.trim(),
        date
      });

      // 🔥 Success feedback
      Alert.alert('Success', 'Expense added successfully', [
        {
          text: 'OK',
          onPress: () => {
            // 🔥 Reset form
            setAmount('');
            setTitle('');
            setCategory('Shopping & Retail');
            setAccount('Cash');
            setDate(new Date());
            setUiDateString('Today');

            navigation.goBack();
          }
        }
      ]);

    } catch (error) {
      console.log('Error saving expense:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save expense');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Finovo</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Amount Section */}
        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.amountSection}>
          <View style={styles.avatarPlaceholder}>
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={16} color="#fff" />
            </View>
          </View>

          <Text style={styles.subtext}>
            ADD EXPENSES <Text style={styles.blueText}>(MANUAL ENTRY)</Text>
          </Text>

          <View style={styles.amountInputRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput 
              style={styles.amountInput}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.textSub}
            />
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.form}>
          <Text style={styles.label}>CATEGORY</Text>
          <TouchableOpacity style={styles.inputPill} onPress={() => { setModalType('category'); setModalVisible(true); }}>
            <Ionicons name="bag-outline" size={20} color="#E91E63" style={styles.iconLeft} />
            <Text style={styles.inputText}>{category}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSub} style={styles.iconRight} />
          </TouchableOpacity>

          <Text style={styles.label}>TRANSACTION DATE</Text>
          <TouchableOpacity style={styles.inputPill} onPress={() => { setModalType('date'); setModalVisible(true); }}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} style={styles.iconLeft} />
            <Text style={styles.inputText}>{uiDateString}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSub} style={styles.iconRight} />
          </TouchableOpacity>

          <Text style={styles.label}>ACCOUNT</Text>
          <TouchableOpacity style={styles.inputPill} onPress={() => { setModalType('account'); setModalVisible(true); }}>
            <Ionicons name="card" size={20} color={colors.primary} style={styles.iconLeft} />
            <Text style={styles.inputText}>{account}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSub} style={styles.iconRight} />
          </TouchableOpacity>

          <Text style={styles.label}>TITLE</Text>
          <View style={[styles.textAreaContainer, { minHeight: 60 }]}>
            <TextInput 
              style={styles.textArea}
              placeholder="What was this for?"
              placeholderTextColor={colors.textSub}
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInDown.springify().delay(300)}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveExpense} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Save Expense</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Cancel */}
        <Animated.View entering={FadeInDown.springify().delay(400)}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {modalType === 'category' ? 'Category' : modalType === 'account' ? 'Account' : 'Date'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMain} />
              </TouchableOpacity>
            </View>

            {modalType === 'category' && categories.map(c => (
              <TouchableOpacity key={c} style={styles.modalItem} onPress={() => { setCategory(c); setModalVisible(false); }}>
                <Text style={styles.modalItemText}>{c}</Text>
              </TouchableOpacity>
            ))}

            {modalType === 'account' && accounts.map(a => (
              <TouchableOpacity key={a} style={styles.modalItem} onPress={() => { setAccount(a); setModalVisible(false); }}>
                <Text style={styles.modalItemText}>{a}</Text>
              </TouchableOpacity>
            ))}

            {modalType === 'date' && dates.map(d => (
              <TouchableOpacity key={d.label} style={styles.modalItem} onPress={() => { setDate(d.val); setUiDateString(d.label); setModalVisible(false); }}>
                <Text style={styles.modalItemText}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// 🔹 Styles (unchanged)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0DABC6' },

  amountSection: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FCE4EC', marginBottom: 24, justifyContent: 'center', alignItems: 'center' },
  plusBadge: { position: 'absolute', top: -5, right: -5, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  subtext: { fontSize: 11, fontWeight: 'bold', color: colors.textSub, letterSpacing: 1, marginBottom: 16 },
  blueText: { color: colors.primary },
  amountInputRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 48, fontWeight: 'bold', color: colors.primary, marginRight: 8 },
  amountInput: { fontSize: 56, fontWeight: 'bold', color: colors.textSub, minWidth: 100 },

  form: { marginBottom: 40 },
  label: { fontSize: 10, fontWeight: 'bold', color: colors.textSub, letterSpacing: 1, marginBottom: 12 },
  inputPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 24, paddingHorizontal: 20, height: 60, marginBottom: 24 },
  iconLeft: { marginRight: 16 },
  inputText: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textMain },
  iconRight: { marginLeft: 16 },

  textAreaContainer: { backgroundColor: colors.inputBg, borderRadius: 24, padding: 20, minHeight: 120 },
  textArea: { flex: 1, fontSize: 16, color: colors.textMain, textAlignVertical: 'top' },

  saveBtn: { flexDirection: 'row', backgroundColor: colors.primary, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { alignItems: 'center', height: 40, justifyContent: 'center' },
  cancelBtnText: { color: colors.textSub, fontSize: 14, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMain },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalItemText: { fontSize: 16, color: colors.textMain }
});

