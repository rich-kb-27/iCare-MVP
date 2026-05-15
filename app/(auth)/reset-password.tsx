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
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase'; // Verify this path
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function VerifyAndResetScreen() {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const router = useRouter();

  const handleVerifyAndReset = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code sent to your email.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Security Risk", "For your safety, passwords must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // Use try/catch for cleaner logic flow
    try {
      // 1. Verify the OTP (This establishes a *temporary* session)
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email as string,
        token: otp,
        type: 'recovery', // Recovery type for password reset flow
      });

      if (verifyError) throw verifyError;

      // 2. Update the password using the temporary session
      // This will trigger the USER_UPDATED event in your AuthContext
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // 3. THE KEY STEP: Kill the temporary session immediately.
      // This forces the AuthContext state to go back to 'null'.
      // It prevents the context from trying to fetch roles or showing spinners.
      await supabase.auth.signOut();
      
      // 4. Reset the internal loading state
      setLoading(false);

      Alert.alert("Account Secured", "Your password has been updated. Please sign in with your new password.", [
        { 
          text: "Sign In", 
          onPress: () => {
            // Force replace to clear the navigation stack
            router.replace('/login');
          } 
        }
      ]);

    } catch (error: any) {
      setLoading(false);
      Alert.alert("Reset Failed", error.message || "An error occurred.");
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#0B3C5D', '#0EA5E9']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#E0F2FE" />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Text style={styles.title}>Secure Reset</Text>
            <Text style={styles.subtitle}>
              We sent a code to <Text style={styles.emailHighlight}>{email}</Text>. Enter it below to finish.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Verification Code</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="shield-key-outline" size={20} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="6-digit code"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                editable={!loading}
              />
            </View>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Set a strong password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={secureText}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon} disabled={loading}>
                <FontAwesome5 name={secureText ? 'eye-slash' : 'eye'} size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && { opacity: 0.7 }]} 
              onPress={handleVerifyAndReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.buttonText}>Confirm & Login</Text>
              )}
            </TouchableOpacity>
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
    marginTop: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  headerSection: { marginTop: 40, marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#E0F2FE', letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#94A3B8', lineHeight: 24, marginTop: 10 },
  emailHighlight: { color: '#38BDF8', fontWeight: '600' },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#E0F2FE', marginBottom: 10, marginLeft: 4 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 16, paddingHorizontal: 15, height: 56, marginBottom: 24 
  },
  icon: { marginRight: 12 },
  input: { flex: 1, color: '#E0F2FE', fontSize: 16 },
  eyeIcon: { padding: 8 },
  button: { 
    backgroundColor: '#E0F2FE', height: 56, borderRadius: 16, 
    justifyContent: 'center', alignItems: 'center', 
    marginTop: 10, shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
  },
  buttonText: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
});