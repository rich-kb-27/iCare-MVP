import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { FontAwesome5 } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { signupBase } from "../../../lib/signup";
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const FreelancerSignup = () => {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [password, setPassword] = useState("");
  const [certificate, setCertificate] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickCertificate = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setCertificate(result.assets[0]);
    }
  };

  const handleSignup = async () => {
    if (!fullName || !email || !password || !certificate) {
      Alert.alert("Error", "Please fill all fields and upload certificate");
      return;
    }

    setLoading(true);
    try {
      // 1. Prepare File & Upload to Storage
      const fileExt = certificate.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const base64 = await FileSystem.readAsStringAsync(certificate.uri, {
        encoding: 'base64', 
      });

      const { error: uploadError } = await supabase.storage
        .from("freelancer-certificates")
        .upload(fileName, decode(base64), { 
          contentType: certificate.mimeType || 'application/pdf',
          upsert: true
        });

      if (uploadError) throw new Error("Upload failed: " + uploadError.message);

      const { data: urlData } = supabase.storage
        .from("freelancer-certificates")
        .getPublicUrl(fileName);

      // 2. Use the working signupBase helper
      await signupBase(email, password, "freelancer", {
        full_name: fullName,
        phone,
        license_number: licenseNumber,
        specialization,
        certificate_url: urlData.publicUrl,
        status: "pending",
      });

      Alert.alert("Success", "Application submitted! We will review your credentials.");
      router.replace("/(auth)/login");
      
    } catch (error: any) {
      console.error(error);
      Alert.alert("Signup failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.title}>Join as Freelancer</Text>
          <Text style={styles.subtitle}>Create flexible healthcare opportunities</Text>

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="user" size={16} color="#94A3B8" style={styles.icon} />
            <TextInput
              placeholder="Full name"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="envelope" size={16} color="#94A3B8" style={styles.icon} />
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

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="phone" size={16} color="#94A3B8" style={styles.icon} />
            <TextInput
              placeholder="Phone number"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="id-card" size={16} color="#94A3B8" style={styles.icon} />
            <TextInput
              placeholder="Medical license number"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />
          </View>

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="stethoscope" size={16} color="#94A3B8" style={styles.icon} />
            <TextInput
              placeholder="Specialization (e.g. GP, Nurse)"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={specialization}
              onChangeText={setSpecialization}
            />
          </View>

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="lock" size={16} color="#94A3B8" style={styles.icon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <FontAwesome5 name={showPassword ? "eye" : "eye-slash"} size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.uploadButton} onPress={pickCertificate}>
            <FontAwesome5 name="file-upload" size={18} color="#E0F2FE" style={{ marginRight: 10 }} />
            <Text style={styles.uploadText} numberOfLines={1}>
              {certificate ? certificate.name : "Upload Certificate"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.buttonText}>Apply Now</Text>}
          </TouchableOpacity>

          <Text style={styles.note}>Account reviewed before activation.</Text>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default FreelancerSignup;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingVertical: 40, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#E0F2FE", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#BAE6FD", marginBottom: 32 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
    marginBottom: 14,
  },
  icon: { width: 25 },
  input: { flex: 1, color: "#E0F2FE", fontSize: 15, marginLeft: 5 },
  uploadButton: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BAE6FD',
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  uploadText: { color: "#E0F2FE", fontWeight: '500' },
  button: {
    backgroundColor: "#E0F2FE",
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: { color: "#0F172A", fontSize: 16, fontWeight: "700" },
  link: { marginTop: 24, textAlign: "center", color: "#CBD5E1", fontSize: 14 },
  note: { marginTop: 12, fontSize: 12, color: "#BAE6FD", textAlign: "center", opacity: 0.8 },
});