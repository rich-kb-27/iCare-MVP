import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function DoctorIncomingCall() {
  // 1. Grab the params we passed from the Dashboard listener
  const { patientName, patientId, callId } = useLocalSearchParams();
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Acceptance Pulse Animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // 2. The "Accept" Logic - Updates DB so Patient knows you're coming
  // Inside handleAccept
const handleAccept = async () => {
  try {
    // Check if callId exists before trying to update
    if (!callId) {
      console.error("Missing callId!");
      return;
    }

    const { error } = await supabase
      .from('calls')
      .update({ status: 'active' })
      .eq('id', callId);

    if (error) throw error;

    // IMPORTANT: You MUST pass callId to the next screen 
    // so the video screen knows which call to manage.
    router.replace({
      pathname: "/(freelancer-dashboard)/video-call",
      params: { 
        patientId, 
        patientName, 
        callId // <--- WAS LIKELY MISSING
      } 
    });
  } catch (error) {
    console.error("Accept error:", error);
    Alert.alert("Connection Error", "Could not accept the call.");
  }
};

  // 3. The "Decline" Logic
  const handleDecline = async () => {
    await supabase
      .from('calls')
      .update({ status: 'declined' })
      .eq('id', callId);

    router.back(); // Go back to dashboard
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#0EA5E9" />
          <Text style={styles.secureText}>SECURE TELE-CONSULTATION</Text>
        </View>

        <View style={styles.patientSection}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatarInner}>
               <Ionicons name="person" size={60} color="#FFF" />
            </View>
          </View>
          <Text style={styles.incomingText}>Incoming Request from</Text>
          <Text style={styles.patientName}>{patientName || "Unknown Patient"}</Text>
          <View style={styles.tag}>
             <Text style={styles.tagText}>General Checkup</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
            <View style={styles.iconCircleDecline}>
              <MaterialCommunityIcons name="phone-hangup" size={32} color="#FFF" />
            </View>
            <Text style={styles.btnLabel}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
            <Animated.View style={[styles.iconCircleAccept, { transform: [{ scale: pulseAnim }] }]}>
              <MaterialCommunityIcons name="phone-check" size={32} color="#FFF" />
            </Animated.View>
            <Text style={[styles.btnLabel, { color: "#22C55E" }]}>Accept</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ... Keep your existing styles exactly as they are ...
const styles = StyleSheet.create({
    overlay: { flex: 1 }, // Changed from absoluteFill for a dedicated screen
    container: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingVertical: 50 },
    header: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(14, 165, 233, 0.1)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    secureText: { color: "#0EA5E9", fontWeight: "700", fontSize: 12, letterSpacing: 1 },
    patientSection: { alignItems: "center" },
    avatarGlow: { width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(14, 165, 233, 0.15)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    avatarInner: { width: 110, height: 110, borderRadius: 55, backgroundColor: "#0EA5E9", justifyContent: "center", alignItems: "center", elevation: 15, shadowColor: "#0EA5E9", shadowOpacity: 0.4, shadowRadius: 20 },
    incomingText: { color: "#94A3B8", fontSize: 16, marginBottom: 8 },
    patientName: { color: "#FFF", fontSize: 32, fontWeight: "800" },
    tag: { marginTop: 15, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    tagText: { color: "#BAE6FD", fontWeight: "600" },
    actionRow: { flexDirection: "row", width: "100%", justifyContent: "space-around", paddingHorizontal: 40, marginBottom: 40 },
    declineBtn: { alignItems: "center", gap: 12 },
    acceptBtn: { alignItems: "center", gap: 12 },
    iconCircleDecline: { width: 75, height: 75, borderRadius: 38, backgroundColor: "#EF4444", justifyContent: "center", alignItems: "center", elevation: 10 },
    iconCircleAccept: { width: 75, height: 75, borderRadius: 38, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center", elevation: 10, shadowColor: "#22C55E", shadowOpacity: 0.5, shadowRadius: 15 },
    btnLabel: { color: "#EF4444", fontWeight: "700", fontSize: 14 }
});