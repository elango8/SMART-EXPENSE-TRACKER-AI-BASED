import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';  
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import ThreeDComponent from '../components/ThreeDComponent';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  const preferences = [
    { route: 'Notifications', icon: 'notifications', title: 'Notifications', sub: 'Alerts, Smart Insights, Weekly Reports' },
    { route: 'AppPreferences', icon: 'settings', title: 'App Preferences', sub: 'Theme, Language, Currency (USD)' },
    { route: 'PaymentMethods', icon: 'card', title: 'Payment Methods', sub: 'Linked Banks, Cards, Apple Pay' },
    { route: 'SecuritySettings', icon: 'shield-checkmark', title: 'Security', sub: 'Face ID, 2FA, Privacy Policy' },
  ];

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
               <ThreeDComponent shapeType="dodecahedron" color={colors.primary} style={{ flex: 1 }} />
            </View>
            <View style={styles.avatar}>
               <Ionicons name="person" size={40} color="#ccc" />
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </View>
          <Text style={styles.name}>{user?.name || 'Elango'}</Text>
          <Text style={styles.email}>{user?.email || 'elangofinovo@gmail.com'}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.cardsRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>AI INSIGHT</Text>
            <Text style={styles.infoDesc}>You saved 14% more this month compared to July.</Text>
          </View>
          <View style={styles.infoCardOutline}>
            <Text style={styles.infoValue}>₹ 3500/-</Text>
            <Text style={styles.infoDescOutline}>Monthly Budget</Text>
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

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textMain, marginBottom: 16 },

  prefList: { marginBottom: 30 },
  prefItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: {height: 2} },
  prefIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  prefTextContainer: { flex: 1 },
  prefTitle: { fontSize: 15, fontWeight: 'bold', color: colors.textMain, marginBottom: 4 },
  prefSub: { fontSize: 11, color: colors.textSub },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F5', height: 56, borderRadius: 28 },
  logoutText: { color: '#FF4C4C', fontWeight: 'bold', fontSize: 16 }
});
