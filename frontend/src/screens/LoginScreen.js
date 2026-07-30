import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeInUp, FadeIn, ZoomIn,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const logoFloat = useSharedValue(0);
  useEffect(() => {
    logoFloat.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);
  const logoAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateY: logoFloat.value }] }));

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      login(res.data, res.data.token);
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.springify().delay(100)} style={s.header}>
          <Animated.View style={logoAnimStyle}>
            <Animated.View entering={ZoomIn.springify().delay(200)}>
              <View style={[s.logoGlow, { backgroundColor: colors.surface }]}>
                <Image source={require('../../assets/logo.png')} style={s.logoImage} resizeMode="contain" />
              </View>
            </Animated.View>
          </Animated.View>
          <Animated.Text entering={FadeInDown.springify().delay(300)} style={s.title}>Finovo</Animated.Text>
          <Animated.Text entering={FadeInDown.springify().delay(400)} style={[s.subtitle, { color: colors.textSub }]}>Your ethereal curator for intelligent wealth management.</Animated.Text>
        </Animated.View>

        <View style={s.form}>
          <Animated.View entering={FadeInDown.springify().delay(500)}>
            <CustomInput label="Email Address" icon="mail-outline" placeholder="name@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </Animated.View>
          <Animated.View entering={FadeInDown.springify().delay(600)}>
            <CustomInput label="Password" icon="lock-closed-outline" placeholder="••••••••" secureTextEntry={!showPassword} rightIcon={showPassword ? "eye-off-outline" : "eye-outline"} onRightIconPress={() => setShowPassword(!showPassword)} value={password} onChangeText={setPassword} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(700)}>
            <TouchableOpacity style={s.forgot}><Text style={[s.forgotText, { color: colors.primary }]}>Forgot Password?</Text></TouchableOpacity>
          </Animated.View>
          <Animated.View entering={FadeInUp.springify().delay(800)}>
            <CustomButton title="Sign In" rightIcon="arrow-forward" onPress={handleLogin} loading={loading} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(900)} style={s.dividerContainer}>
            <View style={[s.line, { backgroundColor: colors.border }]} /><Text style={[s.dividerText, { color: colors.textSub }]}>OR CONTINUE WITH</Text><View style={[s.line, { backgroundColor: colors.border }]} />
          </Animated.View>
          <Animated.View entering={FadeInUp.springify().delay(1000)} style={s.socialContainer}>
            <TouchableOpacity style={[s.socialBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.7}>
              <Ionicons name="logo-google" size={24} color="#DB4437" />
              <Text style={[s.socialText, { color: colors.textMain }]}>Google</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(1100)} style={s.footer}>
          <Text style={[s.footerText, { color: colors.textSub }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}><Text style={[s.footerLink, { color: colors.primary }]}>Create Account</Text></TouchableOpacity>
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
  logoGlow: { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#0B63F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8, marginBottom: 20 },
  logoImage: { width: 60, height: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0DABC6', marginBottom: 10 },
  subtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
  form: { width: '100%' },
  forgot: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { fontWeight: 'bold', fontSize: 13 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 10, fontSize: 11, fontWeight: 'bold' },
  socialContainer: { flexDirection: 'row', justifyContent: 'center' },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 20, borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  socialText: { marginLeft: 10, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: {},
  footerLink: { fontWeight: 'bold' }
});
