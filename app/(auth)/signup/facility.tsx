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

const FacilitySignup = () => {
  const router = useRouter();

  const [facilityName, setFacilityName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
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
    if (!facilityName || !email || !password || !registrationNumber || !certificate) {
      Alert.alert("Error", "Please fill all fields and upload certificate");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Certificate
      const fileExt = certificate.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const base64 = await FileSystem.readAsStringAsync(certificate.uri, {
        encoding: 'base64', 
      });

      const { error: uploadError } = await supabase.storage
        .from("facility-certificates")
        .upload(fileName, decode(base64), { 
          contentType: certificate.mimeType || 'application/pdf',
          upsert: true
        });

      if (uploadError) throw new Error("Upload failed: " + uploadError.message);

      const { data: urlData } = supabase.storage
        .from("facility-certificates")
        .getPublicUrl(fileName);

      // 2. Use signupBase
      await signupBase(email, password, "facility", {
        full_name: facilityName,
        phone,
        location,
        registration_number: registrationNumber,
        certificate_url: urlData.publicUrl,
        status: "pending",
      });

      Alert.alert("Success", "Facility registration submitted for review.");
      router.replace("/(auth)/login");
      
    } catch (error: any) {
      Alert.alert("Signup failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.title}>Register Facility</Text>
          <Text style={styles.subtitle}>Partner with iCare healthcare network</Text>

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="hospital" size={16} color="#94A3B8" style={styles.icon} />
            <TextInput
              placeholder="Facility name"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={facilityName}
              onChangeText={setFacilityName}
            />
          </View>

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="envelope" size={16} color="#94A3B8" style={styles.icon} />
            <TextInput
              placeholder="Facility email"
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
              placeholder="Contact number"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="map-marker-alt" size={16} color="#94A3B8" style={styles.icon} />
            <TextInput
              placeholder="Physical address"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="file-alt" size={16} color="#94A3B8" style={styles.icon} />
            <TextInput
              placeholder="Registration number"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
            />
          </View>

          <View style={styles.inputWrapper}>
            <FontAwesome5 name="lock" size={16} color="#94A3B8" style={styles.icon} />
            <TextInput
              placeholder="Create password"
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
            <FontAwesome5 name="cloud-upload-alt" size={18} color="#E0F2FE" style={{ marginRight: 10 }} />
            <Text style={styles.uploadText} numberOfLines={1}>
              {certificate ? certificate.name : "Upload Registration Cert"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.buttonText}>Register Now</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Already registered? Login</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default FacilitySignup;

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
});