import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase'; 
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Missing Email", "Please enter your email address to receive a reset code.");
      return;
    }

    setLoading(true);
    
    // BACK TO THE OTP TRIGGER: 
    // signInWithOtp sends the 6-digit code instead of a magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false, // Important: don't sign up new users here
      },
    });

    if (error) {
      Alert.alert("Issue Found", error.message);
    } else {
      Alert.alert(
        "Code Sent", 
        "Check your inbox for the 6-digit verification code.",
        [
          { 
            text: "Enter Code", 
            onPress: () => router.push({
              pathname: '/reset-password',
              params: { email: email.trim() }
            }) 
          }
        ]
      );
    }
    setLoading(false);
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#0B3C5D', '#0EA5E9']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#E0F2FE" />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Text style={styles.title}>Recovery</Text>
            <Text style={styles.subtitle}>
              Enter your registered email. We'll send a 6-digit security code to verify your identity.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="name@healthcare.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && { opacity: 0.7 }]} 
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <MaterialCommunityIcons name="shield-check-outline" size={16} color="#94A3B8" />
              <Text style={styles.footerText}>Secure end-to-end encryption</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  headerSection: { marginTop: 40, marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#E0F2FE', letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#94A3B8', lineHeight: 24, marginTop: 10 },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#E0F2FE', marginBottom: 10, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, paddingHorizontal: 15, height: 56, marginBottom: 24,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, color: '#E0F2FE', fontSize: 16 },
  button: {
    backgroundColor: '#E0F2FE', height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  buttonText: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#94A3B8', fontSize: 12, marginLeft: 6, letterSpacing: 0.5 },
});