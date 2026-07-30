import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function CustomInput({ label, icon, rightIcon, onRightIconPress, secureTextEntry, ...props }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSub }]}>{label.toUpperCase()}</Text>}
      <View style={[styles.inputContainer, { backgroundColor: isDark ? '#252535' : colors.inputBg }]}>
        {icon && <Ionicons name={icon} size={20} color={colors.textSub} style={styles.icon} />}
        <TextInput 
          style={[styles.input, { color: colors.textMain }]} 
          placeholderTextColor={colors.textSub}
          secureTextEntry={secureTextEntry}
          {...props} 
        />
        {rightIcon && (
          <Ionicons 
            name={rightIcon} 
            size={20} 
            color={colors.textSub} 
            style={styles.rightIcon} 
            onPress={onRightIconPress}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  }
});
