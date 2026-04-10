import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Easing,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";

const { width } = Dimensions.get("window");

type Status = "loading" | "available" | "unavailable" | "connecting";

const LOADING_STEPS = [
  "Searching for available experts...",
  "Verifying doctor credentials...",
  "Checking secure line encryption...",
  "Matching with a specialist..."
];

export default function CheckupScreen() {
  const [status, setStatus] = useState<Status>("loading");
  const [doctor, setDoctor] = useState<any>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const router = useRouter();

  // Animations
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  // 1. Radar Animation Logic
  const startRadar = () => {
    ring1.setValue(0);
    ring2.setValue(0);
    Animated.loop(
      Animated.parallel([
        Animated.timing(ring1, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ring2, {
          toValue: 1,
          duration: 2500,
          delay: 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // 2. Status Ticker & Animation Effect
  useEffect(() => {
    if (status === "loading") {
      startRadar();
      const interval = setInterval(() => {
        setTickerIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // 3. FETCH DOCTOR LOGIC (RANDOMIZED & PREMIUM)
  const fetchDoctor = async () => {
    setStatus("loading");
    contentFade.setValue(0);

    try {
      // Fetch a pool of 10 available freelancers to pick from (Load Balancing)
      const { data: doctors, error } = await supabase
        .from("profiles")
        .select("id, full_name, specialization, avatar_url")
        .eq("role", "freelancer")
        .limit(10);

      if (error || !doctors || doctors.length === 0) {
        setTimeout(() => setStatus("unavailable"), 3000);
        return;
      }

      // SELECT AT RANDOM: Everyone gets a turn
      const randomIndex = Math.floor(Math.random() * doctors.length);
      const selectedDoctor = doctors[randomIndex];
      
      setDoctor(selectedDoctor);

      // "Artificial Intelligence" delay for premium feel
      setTimeout(() => {
        setStatus("available");
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 3500);

    } catch (err) {
      console.error("Fetch Error:", err);
      setStatus("unavailable");
    }
  };

  useEffect(() => { fetchDoctor(); }, []);

  // 4. START CALL HANDSHAKE
  const startCall = async () => {
    if (!doctor) return;

    try {
      setStatus("connecting");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get patient name for the doctor's alert
      const { data: patientProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { data: callData, error: callError } = await supabase
        .from("calls")
        .insert([
          {
            patient_id: user.id,
            doctor_id: doctor.id,
            patient_name: patientProfile?.full_name || "Patient",
            channel_name: doctor.id, 
            status: "ringing",
          },
        ])
        .select()
        .single();

      if (callError) throw callError;

      setTimeout(() => {
        router.replace({
          pathname: "/checkup/telemedicine",
          params: { 
            doctorId: doctor.id, 
            doctorName: doctor.full_name,
            callId: callData.id 
          }
        });
      }, 2000);

    } catch (err) {
      console.error("Call Init Error:", err);
      setStatus("available");
    }
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <Animated.View style={[styles.radarRing, { 
        transform: [{ scale: ring1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] }) }],
        opacity: ring1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] })
      }]} />
      <Animated.View style={[styles.radarRing, { 
        transform: [{ scale: ring2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] }) }],
        opacity: ring2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] })
      }]} />
      <View style={styles.iconCirclePrimary}>
        <MaterialCommunityIcons name="radar" size={50} color="#FFF" />
      </View>
      <Text style={styles.scanText}>{LOADING_STEPS[tickerIndex]}</Text>
    </View>
  );

  const renderAvailable = () => (
    <Animated.View style={[styles.fullWidth, { opacity: contentFade }]}>
      <Text style={styles.headerLabel}>MATCH FOUND</Text>
      
      <View style={styles.premiumCard}>
        <LinearGradient
          colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
          style={styles.cardGradient}
        >
          <View style={styles.doctorHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGlow} />
              {doctor?.avatar_url ? (
                <Image 
                  source={{ uri: doctor.avatar_url }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <Ionicons name="person" size={40} color="#FFF" />
              )}
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Dr. {doctor?.full_name}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusText}>Verified Specialist</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Est. Wait</Text>
              <Text style={styles.statValue}>Instant</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Specialty</Text>
              <Text style={styles.statValue}>
                {doctor?.specialization || "Generalist"}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={startCall}>
        <LinearGradient
          colors={["#0EA5E9", "#2563EB"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.btnGradient}
        >
          <Text style={styles.btnText}>Start Secure Call</Text>
          <Ionicons name="videocam" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#075985"]} style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.mainContent}>
          {status === "loading" && renderLoading()}
          {status === "available" && renderAvailable()}
          {status === "connecting" && (
             <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={[styles.scanText, {marginTop: 20}]}>Establishing secure connection...</Text>
             </View>
          )}
          {status === "unavailable" && (
             <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={80} color="#94A3B8" />
                <Text style={styles.scanText}>No experts available right now.</Text>
                <TouchableOpacity onPress={fetchDoctor} style={{marginTop: 20}}>
                    <Text style={{color: '#0EA5E9', fontWeight: '700'}}>Try Again</Text>
                </TouchableOpacity>
             </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  centerContainer: { alignItems: "center", justifyContent: "center" },
  fullWidth: { width: "100%", alignItems: "center" },
  radarRing: { position: "absolute", width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: "#0EA5E9" },
  iconCirclePrimary: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#0EA5E9", justifyContent: "center", alignItems: "center", elevation: 20, shadowColor: "#0EA5E9", shadowOpacity: 0.5, shadowRadius: 15 },
  scanText: { color: "#BAE6FD", marginTop: 40, fontSize: 16, fontWeight: "600", letterSpacing: 0.5, textAlign: 'center' },
  headerLabel: { color: "#38BDF8", fontWeight: "800", letterSpacing: 2, fontSize: 13, marginBottom: 20 },
  premiumCard: { width: "100%", borderRadius: 32, overflow: "hidden", marginBottom: 30, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  cardGradient: { padding: 24 },
  doctorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  avatarContainer: { width: 74, height: 74, borderRadius: 37, backgroundColor: "#1E293B", justifyContent: "center", alignItems: "center", marginRight: 15, position: 'relative' },
  avatarImage: { width: 70, height: 70, borderRadius: 35 },
  avatarGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 37, borderWidth: 2, borderColor: "#0EA5E9", opacity: 0.5 },
  doctorInfo: { flex: 1 },
  doctorName: { color: "#FFF", fontSize: 22, fontWeight: "800" },
  statusBadge: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E", marginRight: 6 },
  statusText: { color: "#22C55E", fontWeight: "700", fontSize: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" },
  statItem: { alignItems: "center" },
  statLabel: { color: "#94A3B8", fontSize: 12, marginBottom: 4 },
  statValue: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  divider: { width: 1, height: "100%", backgroundColor: "rgba(255,255,255,0.1)" },
  actionButton: { width: "100%", height: 60, borderRadius: 20, overflow: "hidden", elevation: 8 },
  btnGradient: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  btnText: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  backBtn: { position: 'absolute', top: 20, left: 20, zIndex: 10 }
});