import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function PaymentMethodsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.cardItem}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={32} color={'#4a90e2'} />
            <Text style={styles.cardType}>Credit Card</Text>
          </View>
          <Text style={styles.cardNumber}>**** **** **** 4821</Text>
          <Text style={styles.cardHolder}>Elango</Text>
        </View>

        <View style={[styles.cardItem, { backgroundColor: '#1a1a1a' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="logo-apple" size={32} color={'#fff'} />
            <Text style={[styles.cardType, { color: '#fff' }]}>Apple Pay</Text>
          </View>
          <Text style={[styles.cardNumber, { color: '#ccc' }]}>Linked to elangofinovo@gmail.com</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.primary} />
          <Text style={styles.addBtnText}>Add New Payment Method</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textMain },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  cardItem: { backgroundColor: '#f4f6f8', borderRadius: 20, padding: 24, marginBottom: 20, minHeight: 160, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { height: 4 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cardType: { fontSize: 16, fontWeight: 'bold', color: colors.textMain },
  cardNumber: { fontSize: 22, fontWeight: 'bold', color: colors.textMain, letterSpacing: 2, marginBottom: 12 },
  cardHolder: { fontSize: 14, color: colors.textSub, textTransform: 'uppercase' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' },
  addBtnText: { marginLeft: 10, color: colors.primary, fontWeight: 'bold', fontSize: 16 }
});
