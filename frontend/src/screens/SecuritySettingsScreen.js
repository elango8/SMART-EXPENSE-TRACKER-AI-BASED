import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import * as LocalAuthentication from 'expo-local-authentication';
import api from '../services/api';

export default function SecuritySettingsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user, logout, updatePreferences } = useContext(AuthContext);

  // Biometrics state
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnrolled, setBiometricsEnrolled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(user?.preferences?.biometricsEnabled ?? false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.preferences?.twoFactorEnabled ?? false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [is2FASubmitting, setIs2FASubmitting] = useState(false);

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // Verify biometrics capability on mount
  useEffect(() => {
    const checkBiometrics = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricsAvailable(hasHardware);
      setBiometricsEnrolled(isEnrolled);
    };
    checkBiometrics();
  }, []);

  // Sync preferences when user context loads
  useEffect(() => {
    if (user?.preferences) {
      setBiometricsEnabled(user.preferences.biometricsEnabled ?? false);
      setTwoFactorEnabled(user.preferences.twoFactorEnabled ?? false);
    }
  }, [user]);

  // Biometrics handler
  const handleBiometricsToggle = async (val) => {
    if (!biometricsAvailable || !biometricsEnrolled) {
      Alert.alert(
        'Device Status',
        'Biometric authentication is not supported or not enrolled on this device. Please enable Face ID or fingerprint in settings.'
      );
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: val ? 'Enable biometrics' : 'Disable biometrics',
      fallbackLabel: 'Enter Passcode',
    });

    if (result.success) {
      try {
        setBiometricsEnabled(val);
        await api.put('/user/preferences', { biometricsEnabled: val });
        updatePreferences({ biometricsEnabled: val });
        Alert.alert('✅ Success', `Biometrics ${val ? 'enabled' : 'disabled'} successfully.`);
      } catch (error) {
        console.log('Biometric sync failed:', error);
        setBiometricsEnabled(!val);
        Alert.alert('Error', 'Failed to save biometric preference.');
      }
    } else {
      setBiometricsEnabled(!val);
    }
  };

  // Two-Factor Authentication Toggle handler
  const handle2FToggle = async (val) => {
    if (val) {
      // Request verification OTP
      try {
        setIs2FASubmitting(true);
        const res = await api.post('/security/2fa/enable');
        setOtpCode('');
        
        // Return OTP in simulated response
        if (res.data.otp) {
          Alert.alert(
            'Simulated OTP Verification',
            `A 2FA activation code has been generated.\n\nCode: ${res.data.otp}`,
            [{ text: 'OK', onPress: () => setShow2FAModal(true) }]
          );
        } else {
          setShow2FAModal(true);
        }
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to enable Two-Factor authentication.');
      } finally {
        setIs2FASubmitting(false);
      }
    } else {
      // Confirm disable 2FA
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable Two-Factor authentication? This makes your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                setIs2FASubmitting(true);
                await api.post('/security/2fa/disable');
                setTwoFactorEnabled(false);
                updatePreferences({ twoFactorEnabled: false });
                Alert.alert('✅ Success', 'Two-Factor authentication is now disabled.');
              } catch (error) {
                Alert.alert('Error', error.response?.data?.message || 'Failed to disable Two-Factor authentication.');
              } finally {
                setIs2FASubmitting(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleVerify2FA = async () => {
    if (otpCode.trim().length !== 6) {
      Alert.alert('Validation', 'Please enter a valid 6-digit code.');
      return;
    }

    try {
      setIs2FASubmitting(true);
      await api.post('/security/2fa/verify', { otp: otpCode.trim() });
      setTwoFactorEnabled(true);
      updatePreferences({ twoFactorEnabled: true });
      setShow2FAModal(false);
      Alert.alert('✅ Success', 'Two-Factor authentication has been activated!');
    } catch (error) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid or expired activation code.');
    } finally {
      setIs2FASubmitting(false);
    }
  };

  // Change Password validations
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: '#CBD5E1' };
    if (pwd.length < 8) return { label: 'Weak (min 8 chars)', color: '#EF4444' };
    
    let score = 0;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score < 2) return { label: 'Medium', color: '#F59E0B' };
    return { label: 'Strong', color: '#10B981' };
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Validation', 'Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Validation', 'New password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      Alert.alert('Validation', 'New password must contain at least one uppercase letter.');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      Alert.alert('Validation', 'New password must contain at least one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }

    try {
      setIsPasswordSubmitting(true);
      await api.put('/user/change-password', {
        currentPassword,
        newPassword,
      });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Show success alert, then force logout (backend invalidated all sessions)
      Alert.alert(
        '✅ Password Changed',
        'Your password has been changed successfully. Please log in again with your new password.',
        [
          {
            text: 'OK',
            onPress: () => logout(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password. Please verify current password.');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // Logout all devices
  const handleLogoutAllDevices = () => {
    Alert.alert(
      '⚠️ Log out of all devices',
      'This will invalidate all sessions across all your devices. You will be logged out of this device as well.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out All',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/user/logout-all');
              logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to log out of all devices.');
            }
          },
        },
      ]
    );
  };

  const pwdStrength = getPasswordStrength(newPassword);

  const securityItems = [
    {
      icon: 'scan',
      label: 'Biometric Access',
      sub: biometricsAvailable ? 'Use Face ID / Fingerprint' : 'Biometrics unsupported',
      type: 'switch',
      value: biometricsEnabled,
      onToggle: handleBiometricsToggle,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
    },
    {
      icon: 'shield-checkmark',
      label: '2-Step Verification',
      sub: twoFactorEnabled ? 'Enabled • High Protection' : 'Disabled • Add security layer',
      type: 'switch',
      value: twoFactorEnabled,
      onToggle: handle2FToggle,
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
    },
    {
      icon: 'key-outline',
      label: 'Change Password',
      sub: 'Update your security key',
      type: 'nav',
      onPress: () => setShowPasswordModal(true),
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
  ];

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify().delay(50)} style={s.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[s.backBtn, { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.06 }]} 
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textMain }]}>Security Settings</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().delay(120)} style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {securityItems.map((item, idx) => {
            const itemBgColor = isDark ? (item.color + '20') : item.bgColor;
            return (
              <Animated.View key={idx} entering={FadeInRight.springify().delay(180 + idx * 80)}>
                <TouchableOpacity 
                  style={[s.itemRow, { borderBottomColor: colors.border, borderBottomWidth: idx === securityItems.length - 1 ? 0 : 1 }]} 
                  activeOpacity={item.type === 'nav' ? 0.7 : 1}
                  onPress={item.type === 'nav' ? item.onPress : undefined}
                >
                  <View style={s.itemLeft}>
                    <View style={[s.itemIconBg, { backgroundColor: itemBgColor }]}>
                      <Ionicons name={item.icon} size={18} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.itemText, { color: colors.textMain }]}>{item.label}</Text>
                      {item.sub && <Text style={[s.itemSub, { color: colors.textSub }]}>{item.sub}</Text>}
                    </View>
                  </View>
                  {item.type === 'switch' ? (
                    <Switch 
                      value={item.value} 
                      onValueChange={item.onToggle} 
                      trackColor={{ false: isDark ? '#2D2D3D' : '#E2E8F0', true: colors.primary }} 
                      thumbColor={'#fff'} 
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>
 
        <Animated.View entering={FadeInUp.springify().delay(400)}>
          <TouchableOpacity 
            style={[
              s.logoutBtn, 
              { 
                backgroundColor: isDark ? '#2D1518' : '#FEF2F2', 
                borderColor: isDark ? '#4D2528' : '#FECACA' 
              }
            ]} 
            onPress={handleLogoutAllDevices}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={s.logoutBtnText}>Log out of all devices</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* ── Two-Factor Authentication Modal ── */}
      <Modal
        visible={show2FAModal}
        transparent
        animationType="slide"
        onRequestClose={() => !is2FASubmitting && setShow2FAModal(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => !is2FASubmitting && setShow2FAModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[s.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[s.modalHandle, { backgroundColor: isDark ? '#3D3D4D' : '#E5E7EB' }]} />
            <View style={s.modalHeaderRow}>
              <Text style={[s.modalTitleText, { color: colors.textMain }]}>Verify 2FA Activation</Text>
              <TouchableOpacity onPress={() => setShow2FAModal(false)} disabled={is2FASubmitting}>
                <Ionicons name="close-circle" size={28} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            <View style={s.modalBody}>
              <Text style={[s.modalDescText, { color: colors.textSub }]}>
                Please enter the 6-digit activation code sent to you to confirm Two-Factor Authentication setup.
              </Text>
              
              <View style={[s.inputRow, { backgroundColor: isDark ? '#252535' : '#F8FAFC', borderColor: isDark ? '#3D3D4D' : '#E5E7EB' }]}>
                <Ionicons name="keypad-outline" size={18} color={colors.textSub} style={{ marginRight: 12 }} />
                <TextInput
                  style={[s.modalInput, { color: colors.textMain }]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={isDark ? '#666' : '#B0B8C4'}
                  maxLength={6}
                  keyboardType="number-pad"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  editable={!is2FASubmitting}
                />
              </View>

              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: colors.primary }, is2FASubmitting && { opacity: 0.7 }]}
                onPress={handleVerify2FA}
                disabled={is2FASubmitting}
              >
                {is2FASubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.actionBtnText}>Confirm Setup</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isPasswordSubmitting && setShowPasswordModal(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => !isPasswordSubmitting && setShowPasswordModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[s.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[s.modalHandle, { backgroundColor: isDark ? '#3D3D4D' : '#E5E7EB' }]} />
            <View style={s.modalHeaderRow}>
              <Text style={[s.modalTitleText, { color: colors.textMain }]}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} disabled={isPasswordSubmitting}>
                <Ionicons name="close-circle" size={28} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
              {/* Current Password */}
              <Text style={[s.inputLabel, { color: colors.textSub }]}>Current Password</Text>
              <View style={[s.inputRow, { backgroundColor: isDark ? '#252535' : '#F8FAFC', borderColor: isDark ? '#3D3D4D' : '#E5E7EB' }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textSub} style={{ marginRight: 12 }} />
                <TextInput
                  style={[s.modalInput, { color: colors.textMain }]}
                  placeholder="Enter current password"
                  placeholderTextColor={isDark ? '#666' : '#B0B8C4'}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  editable={!isPasswordSubmitting}
                />
              </View>

              {/* New Password */}
              <Text style={[s.inputLabel, { color: colors.textSub, marginTop: 10 }]}>New Password</Text>
              <View style={[s.inputRow, { backgroundColor: isDark ? '#252535' : '#F8FAFC', borderColor: isDark ? '#3D3D4D' : '#E5E7EB' }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textSub} style={{ marginRight: 12 }} />
                <TextInput
                  style={[s.modalInput, { color: colors.textMain }]}
                  placeholder="Enter new password"
                  placeholderTextColor={isDark ? '#666' : '#B0B8C4'}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!isPasswordSubmitting}
                />
              </View>
              {newPassword ? (
                <View style={s.strengthRow}>
                  <Text style={{ fontSize: 11, color: colors.textSub }}>Strength: </Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: pwdStrength.color }}>
                    {pwdStrength.label}
                  </Text>
                </View>
              ) : null}

              {/* Confirm Password */}
              <Text style={[s.inputLabel, { color: colors.textSub, marginTop: 10 }]}>Confirm Password</Text>
              <View style={[s.inputRow, { backgroundColor: isDark ? '#252535' : '#F8FAFC', borderColor: isDark ? '#3D3D4D' : '#E5E7EB' }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textSub} style={{ marginRight: 12 }} />
                <TextInput
                  style={[s.modalInput, { color: colors.textMain }]}
                  placeholder="Re-enter new password"
                  placeholderTextColor={isDark ? '#666' : '#B0B8C4'}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isPasswordSubmitting}
                />
              </View>

              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: colors.primary }, isPasswordSubmitting && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={isPasswordSubmitting}
              >
                {isPasswordSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.actionBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { borderRadius: 22, padding: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 30 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 14 },
  itemIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  itemText: { fontSize: 15, fontWeight: '600' },
  itemSub: { fontSize: 11, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 20, borderWidth: 1.5 },
  logoutBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },

  // Modal Sheet General
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleText: { fontSize: 18, fontWeight: '800' },
  modalBody: { paddingBottom: 10 },
  modalDescText: { fontSize: 13, lineHeight: 18, marginBottom: 18 },

  // Inputs
  inputLabel: {
    fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, height: 50, marginBottom: 16,
  },
  modalInput: {
    flex: 1, fontSize: 14,
  },
  strengthRow: {
    flexDirection: 'row',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Buttons
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 16, marginTop: 8,
  },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
