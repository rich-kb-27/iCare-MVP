import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { signupBase } from "@/lib/signup";

const UserSignup = () => {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Inside handleSignup for UserSignup.tsx
const handleSignup = async () => {
  if (!fullName || !email || !password) {
    Alert.alert("Missing info");
    return;
  }

  try {
    setLoading(true);

    await signupBase(email, password, "user", {
      full_name: fullName,
      phone,
      status: "approved", // users don’t need verification
    });

    Alert.alert("Success", "Account created");
    router.replace("/(auth)/login");
  } catch (e: any) {
    Alert.alert("Signup failed", e.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <LinearGradient
      colors={["#0F172A", "#0B3C5D", "#0EA5E9"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create your iCare account</Text>
          <Text style={styles.subtitle}>Access healthcare with ease</Text>

          {/* Full name */}
          <View style={styles.inputWrapper}>
            <FontAwesome5 name="user" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Full name"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <FontAwesome5 name="envelope" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Email address"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputWrapper}>
            <FontAwesome5 name="phone" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Phone number"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <FontAwesome5 name="lock" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <FontAwesome5
                name={showPassword ? "eye" : "eye-slash"}
                size={16}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default UserSignup;


/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#E0F2FE",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#BAE6FD",
    marginBottom: 32,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 10,
  },

  input: {
    color: "#E0F2FE",
    fontSize: 15,
  },

  button: {
    backgroundColor: "#E0F2FE",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "600",
  },

  link: {
    marginTop: 24,
    textAlign: "center",
    color: "#CBD5E1",
    fontSize: 14,
  },
});
