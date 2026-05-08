import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function CustomButton({ title, onPress, type = 'primary', loading = false, rightIcon }) {
  const isPrimary = type === 'primary';
  
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        isPrimary ? styles.primaryBtn : styles.secondaryBtn
      ]} 
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : colors.textMain} />
      ) : (
        <>
          <Text style={[
            styles.text, 
            isPrimary ? styles.primaryText : styles.secondaryText
          ]}>
            {title}
          </Text>
          {rightIcon && <Ionicons name={rightIcon} size={20} color={isPrimary ? '#fff' : colors.textMain} style={styles.icon} />}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  secondaryBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 1,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryText: {
    color: colors.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginLeft: 8,
  }
});
