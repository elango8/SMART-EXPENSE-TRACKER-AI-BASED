import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationsContext';
import { AuthContext } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import api from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const { unreadCount } = useNotifications();

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Open edit modal
  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setShowEditModal(true);
  };

  // Save profile info
  const handleSaveProfile = async () => {
    let hasError = false;
    setNameError('');
    setEmailError('');
    setPhoneError('');

    if (!editName.trim()) {
      setNameError('Name cannot be empty');
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editEmail.trim()) {
      setEmailError('Email cannot be empty');
      hasError = true;
    } else if (!emailRegex.test(editEmail.trim())) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    // Phone validation: allow digits, +, -, spaces; minimum 10 digits
    if (editPhone.trim()) {
      const digitsOnly = editPhone.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 10) {
        setPhoneError('Phone number must have at least 10 digits');
        hasError = true;
      } else if (!/^[\d\s+\-()]+$/.test(editPhone.trim())) {
        setPhoneError('Please enter a valid phone number');
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      setIsSaving(true);
      const res = await api.put('/user/profile', {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      });
      updateUser(res.data);
      setShowEditModal(false);
      Alert.alert('✅ Success', 'Profile updated successfully.');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Profile Image Upload / Update
  const handleSelectImage = () => {
    Alert.alert(
      'Profile Image',
      'Choose an option to update your profile photo',
      [
        { text: 'Take Photo', onPress: () => pickImage(true) },
        { text: 'Choose from Gallery', onPress: () => pickImage(false) },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: handleRemoveImage,
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickImage = async (useCamera) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Denied',
          `We need permission to access your ${useCamera ? 'camera' : 'gallery'} to upload a profile photo.`
        );
        return;
      }

      const pickerResult = useCamera
        ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        })
        : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      const selectedAsset = pickerResult.assets[0];

      // Validate file size (5MB max)
      if (selectedAsset.fileSize && selectedAsset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Error', 'Image size must be below 5MB.');
        return;
      }

      // Compress and resize image
      setIsSaving(true);
      const manipulated = await ImageManipulator.manipulateAsync(
        selectedAsset.uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const base64Image = `data:image/jpeg;base64,${manipulated.base64}`;

      // Upload to backend
      const res = await api.put('/user/profile/image', { image: base64Image });
      updateUser({ profileImage: res.data.profileImage });
      Alert.alert('✅ Success', 'Profile picture updated successfully.');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Unable to upload image. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user?.profileImage) {
      Alert.alert('Info', 'No profile image to remove.');
      return;
    }

    try {
      setIsSaving(true);
      await api.delete('/user/profile/image');
      updateUser({ profileImage: '' });
      Alert.alert('✅ Success', 'Profile picture removed.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove image');
    } finally {
      setIsSaving(false);
    }
  };

  const preferences = [
    { route: 'Notifications', icon: 'notifications', title: 'Notifications', sub: user?.preferences?.notifications ? 'Enabled • Smart Insights, Weekly Reports' : 'Disabled' },
    { route: 'AppPreferences', icon: 'settings', title: 'App Preferences', sub: `Theme: ${user?.preferences?.theme === 'dark' ? 'Dark' : 'Light'} • Notifications: ${user?.preferences?.notifications ? 'On' : 'Off'}` },
    { route: 'SecuritySettings', icon: 'shield-checkmark', title: 'Security', sub: 'Biometric, 2FA, Change Password' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Finovo</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { borderColor: colors.background }]}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handleSelectImage} activeOpacity={0.95}>
              <View style={[styles.avatar, { backgroundColor: isDark ? '#252535' : '#F0F2F5' }]}>
                {user?.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color={isDark ? '#666' : '#ccc'} />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary }]} onPress={handleSelectImage} activeOpacity={0.7}>
              <Ionicons name="camera" size={12} color="#fff" />
            </TouchableOpacity>
            {isSaving && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </View>
          <Text style={[styles.name, { color: colors.textMain }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.email, { color: colors.textSub }]}>{user?.email || 'email@example.com'}</Text>
          {user?.phone ? (
            <Text style={[styles.phone, { color: colors.textSub }]}>{user.phone}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.editProfileBtn, { backgroundColor: isDark ? '#1E2340' : '#EEF2FF', borderColor: isDark ? '#2D3560' : '#C7D2FE' }]}
            onPress={openEditModal}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(300)}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Account Preferences</Text>
        </Animated.View>

        <View style={styles.prefList}>
          {preferences.map((item, idx) => (
            <Animated.View key={idx} entering={FadeInDown.springify().delay(400 + idx * 100)}>
              <TouchableOpacity
                style={[styles.prefItem, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate(item.route)}
              >
                <View style={[styles.prefIconContainer, { backgroundColor: isDark ? '#1E2340' : '#E3F2FD' }]}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.prefTextContainer}>
                  <Text style={[styles.prefTitle, { color: colors.textMain }]}>{item.title}</Text>
                  <Text style={[styles.prefSub, { color: colors.textSub }]}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.springify().delay(700)}>
          <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: isDark ? '#2D1518' : '#FFF5F5' }]} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#FF4C4C" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isSaving && setShowEditModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isSaving && setShowEditModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3D3D4D' : '#E5E7EB' }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} disabled={isSaving}>
                <Ionicons name="close-circle" size={28} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <Text style={[styles.inputLabel, { color: colors.textSub }]}>Full Name</Text>
              <View style={[styles.inputRow, { backgroundColor: isDark ? '#252535' : '#F8FAFC', borderColor: nameError ? '#EF4444' : (isDark ? '#3D3D4D' : '#E5E7EB') }]}>
                <Ionicons name="person-outline" size={18} color={colors.textSub} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.modalInput, { color: colors.textMain }]}
                  value={editName}
                  onChangeText={(val) => { setEditName(val); setNameError(''); }}
                  placeholder="Enter your name"
                  placeholderTextColor={isDark ? '#666' : '#B0B8C4'}
                  editable={!isSaving}
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

              {/* Email Input */}
              <Text style={[styles.inputLabel, { color: colors.textSub, marginTop: 4 }]}>Email Address</Text>
              <View style={[styles.inputRow, { backgroundColor: isDark ? '#252535' : '#F8FAFC', borderColor: emailError ? '#EF4444' : (isDark ? '#3D3D4D' : '#E5E7EB') }]}>
                <Ionicons name="mail-outline" size={18} color={colors.textSub} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.modalInput, { color: colors.textMain }]}
                  value={editEmail}
                  onChangeText={(val) => { setEditEmail(val); setEmailError(''); }}
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? '#666' : '#B0B8C4'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSaving}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              {/* Phone Input */}
              <Text style={[styles.inputLabel, { color: colors.textSub, marginTop: 4 }]}>Phone Number</Text>
              <View style={[styles.inputRow, { backgroundColor: isDark ? '#252535' : '#F8FAFC', borderColor: phoneError ? '#EF4444' : (isDark ? '#3D3D4D' : '#E5E7EB') }]}>
                <Ionicons name="call-outline" size={18} color={colors.textSub} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.modalInput, { color: colors.textMain }]}
                  value={editPhone}
                  onChangeText={(val) => { setEditPhone(val); setPhoneError(''); }}
                  placeholder="Enter your phone number"
                  placeholderTextColor={isDark ? '#666' : '#B0B8C4'}
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              </View>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveProfile}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0DABC6' },

  // Notification badge
  notifBadge: {
    position: 'absolute', top: -6, right: -8,
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff',
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  profileSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    width: 100, height: 100,
  },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 13 },
  phone: { fontSize: 13, marginTop: 2 },
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 12, paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  editProfileBtnText: { fontSize: 13, fontWeight: '700' },

  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  infoCard: { flex: 0.48, borderRadius: 24, padding: 20, height: 150 },
  infoLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.5 },
  infoDesc: { fontSize: 12, fontWeight: 'bold', lineHeight: 18 },
  infoCardOutline: { flex: 0.48, borderRadius: 24, padding: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { height: 4 }, justifyContent: 'center', height: 150 },
  infoValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  infoDescOutline: { fontSize: 12, fontWeight: '600' },

  // Budget progress
  budgetProgress: { marginTop: 10 },
  budgetProgressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  budgetProgressFill: { height: '100%', borderRadius: 2 },
  budgetProgressText: { fontSize: 10, fontWeight: '600', marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },

  prefList: { marginBottom: 30 },
  prefItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 20, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { height: 2 } },
  prefIconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  prefTextContainer: { flex: 1 },
  prefTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  prefSub: { fontSize: 11 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 28 },
  logoutText: { color: '#FF4C4C', fontWeight: 'bold', fontSize: 16 },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalBody: { marginBottom: 24 },
  inputLabel: {
    fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, height: 50, marginBottom: 16,
  },
  modalInput: {
    flex: 1, fontSize: 15,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 16,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
