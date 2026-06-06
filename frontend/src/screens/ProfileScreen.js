import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
// import ThreeDComponent from '../components/ThreeDComponent';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useContext(AuthContext);

  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch dashboard summary for the info cards
  const fetchDashboardSummary = async () => {
    try {
      setIsLoadingSummary(true);
      const res = await api.get('/dashboard/summary');
      setDashboardSummary(res.data);
    } catch (error) {
      console.log('Error fetching dashboard summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        fetchDashboardSummary();
      }
    }, [user])
  );

  // Currency symbol helper
  const currencySymbol = (() => {
    const c = user?.preferences?.currency || 'INR';
    const map = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    return map[c] || '₹';
  })();

  // Open edit modal
  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setShowEditModal(true);
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation', 'Name cannot be empty');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      Alert.alert('Validation', 'Please enter a valid email');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.put('/user/profile', {
        name: editName.trim(),
        email: editEmail.trim(),
      });
      updateUser(res.data);
      setShowEditModal(false);
      Alert.alert('✅ Success', 'Profile updated successfully!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const preferences = [
    { route: 'Notifications', icon: 'notifications', title: 'Notifications', sub: user?.preferences?.notifications ? 'Enabled • Smart Insights, Weekly Reports' : 'Disabled' },
    { route: 'AppPreferences', icon: 'settings', title: 'App Preferences', sub: `Theme: ${user?.preferences?.theme === 'dark' ? 'Dark' : 'Light'} • Currency: ${user?.preferences?.currency || 'INR'}` },
    { route: 'PaymentMethods', icon: 'card', title: 'Payment Methods', sub: 'Linked Banks, Cards, Apple Pay' },
    { route: 'SecuritySettings', icon: 'shield-checkmark', title: 'Security', sub: 'Face ID, 2FA, Privacy Policy' },
  ];

  // Compute dynamic insight message
  const insightMessage = (() => {
    if (!dashboardSummary) return 'Loading your insights...';
    const { monthlyTotal, monthlyBudget, topCategory } = dashboardSummary;
    if (monthlyTotal === 0) return 'No spending this month yet. Start tracking!';
    const pct = Math.round((monthlyTotal / monthlyBudget) * 100);
    if (pct > 100) return `You've exceeded your budget by ${pct - 100}%! Consider cutting back on ${topCategory?.name || 'expenses'}.`;
    if (pct > 75) return `You've used ${pct}% of your budget. Watch your spending on ${topCategory?.name || 'expenses'}.`;
    return `You've used ${pct}% of your budget. You're on track this month! 🎉`;
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logoText}>Finovo</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={{position: 'absolute', width: 250, height: 250, top: -75, left: -75, opacity: 0.25, zIndex: -1}}>
               {/* <ThreeDComponent shapeType="dodecahedron" color={colors.primary} style={{ flex: 1 }} /> */}
            </View>
            <View style={styles.avatar}>
               <Ionicons name="person" size={40} color="#ccc" />
            </View>
            <TouchableOpacity style={styles.editBadge} onPress={openEditModal} activeOpacity={0.7}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.cardsRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>AI INSIGHT</Text>
            <Text style={styles.infoDesc}>{insightMessage}</Text>
          </View>
          <View style={styles.infoCardOutline}>
            {isLoadingSummary ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.infoValue}>
                  {currencySymbol} {(dashboardSummary?.monthlyBudget || 5000).toLocaleString('en-IN')}/-
                </Text>
                <Text style={styles.infoDescOutline}>Monthly Budget</Text>
                {dashboardSummary && (
                  <View style={styles.budgetProgress}>
                    <View style={styles.budgetProgressBar}>
                      <View
                        style={[
                          styles.budgetProgressFill,
                          {
                            width: `${Math.min(100, Math.round((dashboardSummary.monthlyTotal / dashboardSummary.monthlyBudget) * 100))}%`,
                            backgroundColor: (dashboardSummary.monthlyTotal / dashboardSummary.monthlyBudget) > 0.9 ? '#EF4444' : colors.primary,
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.budgetProgressText}>
                      {Math.round((dashboardSummary.monthlyTotal / dashboardSummary.monthlyBudget) * 100)}% used
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(300)}>
          <Text style={styles.sectionTitle}>Account Preferences</Text>
        </Animated.View>
        
        <View style={styles.prefList}>
          {preferences.map((item, idx) => (
            <Animated.View key={idx} entering={FadeInDown.springify().delay(400 + idx * 100)}>
              <TouchableOpacity 
                style={styles.prefItem}
                onPress={() => navigation.navigate(item.route)}
              >
                <View style={styles.prefIconContainer}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefTitle}>{item.title}</Text>
                  <Text style={styles.prefSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.springify().delay(800)}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#FF4C4C" style={{marginRight: 8}} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{height: 100}} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isSaving && setShowEditModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} disabled={isSaving}>
                <Ionicons name="close-circle" size={28} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Name Input */}
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={colors.textSub} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor="#B0B8C4"
                  editable={!isSaving}
                />
              </View>

              {/* Email Input */}
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textSub} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#B0B8C4"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSaving}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
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
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#0DABC6' },

  profileSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, backgroundColor: colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.textMain, marginBottom: 4 },
  email: { fontSize: 13, color: colors.textSub },

  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  infoCard: { flex: 0.48, backgroundColor: '#FCE4EC', borderRadius: 24, padding: 20, height: 150 },
  infoLabel: { fontSize: 10, fontWeight: 'bold', color: '#880E4F', marginBottom: 8, letterSpacing: 0.5 },
  infoDesc: { fontSize: 14, color: '#C2185B', fontWeight: 'bold', lineHeight: 20 },
  infoCardOutline: { flex: 0.48, backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: {height: 4}, justifyContent: 'center', height: 150 },
  infoValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 8 },
  infoDescOutline: { fontSize: 12, color: colors.textSub, fontWeight: '600' },

  // Budget progress
  budgetProgress: { marginTop: 10 },
  budgetProgressBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  budgetProgressFill: { height: '100%', borderRadius: 2 },
  budgetProgressText: { fontSize: 10, color: colors.textSub, fontWeight: '600', marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMain, marginBottom: 16 },

  prefList: { marginBottom: 30 },
  prefItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: {height: 2} },
  prefIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  prefTextContainer: { flex: 1 },
  prefTitle: { fontSize: 15, fontWeight: 'bold', color: colors.textMain, marginBottom: 4 },
  prefSub: { fontSize: 11, color: colors.textSub },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F5', height: 56, borderRadius: 28 },
  logoutText: { color: '#FF4C4C', fontWeight: 'bold', fontSize: 16 },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textMain },
  modalBody: { marginBottom: 24 },
  inputLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textSub,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1,
    borderColor: '#E5E7EB', paddingHorizontal: 14, height: 50, marginBottom: 16,
  },
  modalInput: {
    flex: 1, fontSize: 15, color: colors.textMain,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, height: 52, borderRadius: 16,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
