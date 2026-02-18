import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; 
import { supabase } from "../../../lib/supabase";

type Status = "loading" | "available" | "unavailable" | "confirm" | "processing" | "connecting";

export default function CheckupScreen() {
  const [status, setStatus] = useState<Status>("loading");
  const [doctor, setDoctor] = useState<any>(null);
  const pulse = new Animated.Value(1);
  const router = useRouter(); 

  useEffect(() => {
    if (status === "connecting") {
      const timer = setTimeout(() => {
        // Using the exact path that Expo Router detected
        router.replace({
          pathname: "/checkup/telemedicine", 
          params: { doctorId: doctor?.id, doctorName: doctor?.full_name }
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, doctor]);

  useEffect(() => {
    if (status === "loading") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  const fetchDoctor = async () => {
    setStatus("loading");
    const { data, error } = await supabase.from("profiles").select("*").eq("role", "freelancer").limit(1).single();
    if (error || !data) { setStatus("unavailable"); return; }
    setDoctor(data);
    setStatus("available");
  };

  useEffect(() => { fetchDoctor(); }, []);

  const renderContent = () => {
    if (status === "loading") return (
      <>
        <Animated.View style={{ transform: [{ scale: pulse }] }}><Ionicons name="medkit" size={90} color="#0EA5E9" /></Animated.View>
        <Text style={styles.title}>Finding available doctor...</Text>
      </>
    );

    if (status === "connecting") return (
      <>
        <Ionicons name="call" size={90} color="#22C55E" />
        <Text style={styles.title}>Connecting to doctor...</Text>
      </>
    );

    if (status === "available" && doctor) return (
      <>
        <Text style={styles.sectionLabel}>AVAILABLE DOCTOR</Text>
        <View style={styles.doctorCard}>
          <View style={styles.avatarRing}><Ionicons name="person" size={46} color="#FFF" /></View>
          <Text style={styles.doctorName}>{doctor.full_name}</Text>
          <View style={styles.badge}>
            {/* FIXED: Changed div to View */}
            <View style={styles.dot} />
            <Text style={styles.badgeText}>Online • responds instantly</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setStatus("confirm")}>
          <Text style={styles.primaryText}>Continue</Text>
        </TouchableOpacity>
      </>
    );

    // ... (Keep your other status renders for "confirm", "processing", "unavailable")
    return <Text style={{color:'white'}}>Something went wrong</Text>;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.container}>
        <View style={styles.content}>{renderContent()}</View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 22 },
  title: { fontSize: 24, color: "#FFF", fontWeight: "800", textAlign: "center" },
  sectionLabel: { color: "#38BDF8", fontWeight: "700", letterSpacing: 1.5, fontSize: 12 },
  doctorCard: { width: "100%", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 26, padding: 26, alignItems: "center" },
  avatarRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#0EA5E9", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  doctorName: { color: "#FFF", fontSize: 20, fontWeight: "800" },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, backgroundColor: "rgba(34,197,94,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  badgeText: { color: "#22C55E", fontWeight: "600", fontSize: 12 },
  primaryBtn: { backgroundColor: "#0EA5E9", paddingVertical: 16, paddingHorizontal: 60, borderRadius: 30 },
  primaryText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
});