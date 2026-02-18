import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase'; // Verify this path points to your supabase.ts

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [showSignupOptions, setShowSignupOptions] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;
      
      // We don't need a redirect here! 
      // RootLayout's onAuthStateChange will detect the login and move the user.
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#0B3C5D', '#0EA5E9']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Top iCare Branding */}
        <View style={styles.header}>
          <Text style={styles.iCareText}>iCare</Text>
          <Text style={styles.subtitle}>Healthcare at your fingertips</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              placeholder="Email address"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              style={[styles.input, { flex: 1 }]}
              secureTextEntry={secureText}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setSecureText(!secureText)}
              style={styles.eyeIcon}
            >
              <FontAwesome5
                name={secureText ? 'eye-slash' : 'eye'}
                size={16}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.loginText}>Sign In</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Link */}
        <View style={styles.bottomContent}>
          <TouchableOpacity onPress={() => setShowSignupOptions(true)}>
            <Text style={styles.signupText}>
              Don’t have an account? <Text style={styles.signupBoldText}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Signup Modal */}
        <Modal
          transparent
          animationType="slide"
          visible={showSignupOptions}
          onRequestClose={() => setShowSignupOptions(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setShowSignupOptions(false)} />
          <View style={styles.bottomSheetWrapper}>
            <LinearGradient
              colors={['#0B3C5D', '#0EA5E9']}
              style={styles.bottomSheet}
            >
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Create an Account</Text>

              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  setShowSignupOptions(false);
                  // FIXED PATHS: Remove the (auth) group name
                  router.push('/signup/user');
                }}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#38BDF8' }]}>
                  <FontAwesome5 name="user" size={18} color="#FFF" />
                </View>
                <Text style={styles.optionText}>User / Patient</Text>
                <FontAwesome5 name="chevron-right" size={12} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  setShowSignupOptions(false);
                  router.push('/signup/freelancer');
                }}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#2DD4BF' }]}>
                  <FontAwesome5 name="user-md" size={18} color="#FFF" />
                </View>
                <Text style={styles.optionText}>Freelancer / Doctor</Text>
                <FontAwesome5 name="chevron-right" size={12} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  setShowSignupOptions(false);
                  router.push('/signup/facility');
                }}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#818CF8' }]}>
                  <FontAwesome5 name="hospital" size={18} color="#FFF" />
                </View>
                <Text style={styles.optionText}>Health Facility</Text>
                <FontAwesome5 name="chevron-right" size={12} color="#94A3B8" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginTop: 100 },
  iCareText: {
    fontSize: 64, fontWeight: '800', color: '#E0F2FE', letterSpacing: 2,
    textShadowColor: 'rgba(14,165,233,0.35)', textShadowOffset: { width: 0, height: 6 }, textShadowRadius: 20,
  },
  subtitle: { color: '#94A3B8', fontSize: 16, marginTop: -5 },
  form: { marginTop: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, marginBottom: 16, paddingHorizontal: 15, height: 56,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#E0F2FE', fontSize: 16 },
  eyeIcon: { padding: 5 },
  loginButton: {
    backgroundColor: '#E0F2FE', height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
    shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  loginText: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  forgotPassword: { alignItems: 'center', marginTop: 15 },
  forgotText: { color: '#94A3B8', fontSize: 14 },
  bottomContent: { marginBottom: 40, alignItems: 'center' },
  signupText: { color: '#94A3B8', fontSize: 15 },
  signupBoldText: { color: '#E0F2FE', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  bottomSheetWrapper: { justifyContent: 'flex-end', flex: 1 },
  bottomSheet: {
    padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22, fontWeight: '700', marginBottom: 25, color: '#E0F2FE', textAlign: 'center',
  },
  option: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20,
    marginVertical: 8, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  optionText: { flex: 1, fontSize: 17, color: '#E0F2FE', fontWeight: '600' },
});