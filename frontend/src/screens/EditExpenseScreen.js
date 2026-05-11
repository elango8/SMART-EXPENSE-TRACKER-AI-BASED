import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function EditExpenseScreen({ route, navigation }) {

  const { expense } = route.params || {};

  const [title, setTitle] = useState(expense?.title || '');
  const [amount, setAmount] = useState(expense?.amount ? String(expense.amount) : '');
  const [category, setCategory] = useState(expense?.category || '');
  const [account, setAccount] = useState(expense?.account || '');
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 UPDATE
  const handleUpdate = async () => {
    if (!title || !amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Error', 'Enter valid data');
      return;
    }

    try {
      setIsLoading(true);

      await api.put(`/expenses/${expense?._id}`, {
        title: title.trim(),
        amount: Number(amount),
        category: category.trim(),
        account: account.trim()
      });

      Alert.alert('Updated', 'Expense updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      Alert.alert('Error', 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 DELETE
  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);

              await api.delete(`/expenses/${expense?._id}`);

              Alert.alert('Deleted', 'Expense removed', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);

            } catch (error) {
              Alert.alert('Error', 'Delete failed');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Edit Expense</Text>

      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <TextInput style={styles.input} value={category} onChangeText={setCategory} />
      <TextInput style={styles.input} value={account} onChangeText={setAccount} />

      <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={isLoading}>
        <Text style={styles.btnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15
  },

  updateBtn: {
    backgroundColor: '#0DABC6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10
  },

  deleteBtn: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },

  btnText: { color: '#fff', fontWeight: 'bold' }
});