import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeInUp, FadeIn, ZoomIn,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import api from '../services/api';

export default function SignupScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const logoFloat = useSharedValue(0);
  useEffect(() => {
    logoFloat.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);
  const logoAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateY: logoFloat.value }] }));

  const handleSignup = async () => {
    if (password !== confirmPassword) { alert("Passwords don't match!"); return; }
    try {
      setLoading(true);
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data, res.data.token);
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.springify().delay(100)} style={s.header}>
            <Animated.View style={logoAnimStyle}>
              <Animated.View entering={ZoomIn.springify().delay(150)}>
                <View style={s.logoGlow}>
                  <Image source={require('../../assets/logo.png')} style={s.logoImage} resizeMode="contain" />
                </View>
              </Animated.View>
            </Animated.View>
            <Animated.Text entering={FadeInDown.springify().delay(250)} style={s.title}>Create Account</Animated.Text>
            <Animated.Text entering={FadeInDown.springify().delay(350)} style={s.subtitle}>Start your journey towards effortless financial intelligence.</Animated.Text>
          </Animated.View>

          <View style={s.form}>
            <Animated.View entering={FadeInDown.springify().delay(400)}>
              <CustomInput label="Full Name" icon="person-outline" placeholder="Enter your name" value={name} onChangeText={setName} autoCapitalize="words" />
            </Animated.View>
            <Animated.View entering={FadeInDown.springify().delay(500)}>
              <CustomInput label="Email Address" icon="mail-outline" placeholder="name@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </Animated.View>
            <Animated.View entering={FadeInDown.springify().delay(600)}>
              <CustomInput label="Password" icon="lock-closed-outline" placeholder="••••••••" secureTextEntry={!showPassword} rightIcon={showPassword ? "eye-off-outline" : "eye-outline"} onRightIconPress={() => setShowPassword(!showPassword)} value={password} onChangeText={setPassword} />
            </Animated.View>
            <Animated.View entering={FadeInDown.springify().delay(700)}>
              <CustomInput label="Confirm Password" icon="shield-checkmark-outline" placeholder="••••••••" secureTextEntry={!showConfirmPassword} rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"} onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)} value={confirmPassword} onChangeText={setConfirmPassword} />
            </Animated.View>

            <View style={s.spacer} />

            <Animated.View entering={FadeInUp.springify().delay(800)}>
              <CustomButton title="Sign Up" onPress={handleSignup} loading={loading} />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(900)} style={s.dividerContainer}>
              <View style={s.line} /><Text style={s.dividerText}>OR SIGN UP WITH</Text><View style={s.line} />
            </Animated.View>

            <Animated.View entering={FadeInUp.springify().delay(1000)} style={s.socialContainer}>
              <TouchableOpacity style={s.socialBtn} activeOpacity={0.7}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
                <Text style={s.socialText}>Google</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View entering={FadeIn.delay(1100)} style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={s.footerLink}>Login</Text></TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  logoGlow: { width: 76, height: 76, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#0B63F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 6, marginBottom: 16 },
  logoImage: { width: 50, height: 50 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textMain, marginBottom: 8 },
  subtitle: { fontSize: 13, color: colors.textSub, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
  form: { width: '100%' },
  spacer: { height: 10 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 10, color: colors.textSub, fontSize: 11, fontWeight: 'bold' },
  socialContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 20, borderWidth: 1.5, borderColor: '#E8E9EB', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  socialText: { marginLeft: 10, fontWeight: 'bold', color: colors.textMain },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: colors.textSub },
  footerLink: { color: colors.primary, fontWeight: 'bold' }
});
