import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function PatientIncomingCall() {
  // We get these from the Root Navigator's router.push params
  const { doctorName, doctorId, callId, specialty, doctorAvatar } = useLocalSearchParams();
  const router = useRouter();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance Animation
    Animated.timing(fadeAnim, { 
      toValue: 1, 
      duration: 800, 
      useNativeDriver: true 
    }).start();

    // Infinite Pulse for the Accept Button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleAccept = async () => {
    try {
      if (!callId) throw new Error("Missing callId");

      // Set call to active so both sides can enter the room
      const { error } = await supabase
        .from('calls')
        .update({ status: 'active' })
        .eq('id', callId);

      if (error) throw error;

      router.replace({
        pathname: "/(patient-dashboard)/checkup/telemedicine",
        params: { doctorId, doctorName, callId } 
      });
    } catch (error) {
      console.error("Accept error:", error);
      Alert.alert("Connection Error", "Could not connect to the consultation.");
    }
  };

  const handleDecline = async () => {
    try {
      // Notify the sender that the call was rejected
      await supabase.from('calls').update({ status: 'declined' }).eq('id', callId);
      router.back();
    } catch (e) {
      router.back();
    }
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <LinearGradient colors={["#064E3B", "#022C22"]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#10B981" />
          <Text style={styles.secureText}>VERIFIED ICARE PROFESSIONAL</Text>
        </View>

        <View style={styles.doctorSection}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatarInner}>
              {doctorAvatar ? (
                <Image 
                  source={{ uri: doctorAvatar as string }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <Ionicons name="medical" size={60} color="#FFF" />
              )}
            </View>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: 0.3 }]} />
          </View>
          
          <Text style={styles.incomingText}>Incoming Call from</Text>
          <Text style={styles.doctorName}>Dr. {doctorName || "Specialist"}</Text>
          
          <View style={styles.tag}>
             <MaterialCommunityIcons name="stethoscope" size={16} color="#A7F3D0" />
             <Text style={styles.tagText}>{specialty || "General Practitioner"}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {/* DECLINE BUTTON */}
          <TouchableOpacity style={styles.btnWrapper} onPress={handleDecline}>
            <View style={styles.iconCircleDecline}>
              <MaterialCommunityIcons name="phone-hangup" size={32} color="#FFF" />
            </View>
            <Text style={styles.declineLabel}>Decline</Text>
          </TouchableOpacity>

          {/* ACCEPT BUTTON */}
          <TouchableOpacity style={styles.btnWrapper} onPress={handleAccept}>
            <Animated.View style={[styles.iconCircleAccept, { transform: [{ scale: pulseAnim }] }]}>
              <MaterialCommunityIcons name="phone-check" size={32} color="#FFF" />
            </Animated.View>
            <Text style={styles.acceptLabel}>Accept</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  container: { flex: 1, alignItems: "center", justifyContent: "space-evenly", paddingVertical: 60 },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    backgroundColor: "rgba(16, 185, 129, 0.15)", 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)"
  },
  secureText: { color: "#10B981", fontWeight: "800", fontSize: 11, letterSpacing: 1.2 },
  doctorSection: { alignItems: "center" },
  avatarGlow: { 
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 30,
    position: 'relative'
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  avatarInner: { 
    width: 130, 
    height: 130, 
    borderRadius: 65, 
    backgroundColor: "#059669", 
    justifyContent: "center", 
    alignItems: "center", 
    elevation: 20, 
    shadowColor: "#10B981", 
    shadowOpacity: 0.5, 
    shadowRadius: 25,
    zIndex: 2,
    overflow: 'hidden'
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: 'cover' },
  incomingText: { color: "#D1FAE5", fontSize: 16, marginBottom: 10, opacity: 0.8 },
  doctorName: { color: "#FFF", fontSize: 36, fontWeight: "900", textAlign: 'center' },
  tag: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20, 
    backgroundColor: "rgba(255,255,255,0.1)", 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  tagText: { color: "#A7F3D0", fontWeight: "700", fontSize: 14 },
  actionRow: { flexDirection: "row", width: "100%", justifyContent: "space-evenly", marginBottom: 20 },
  btnWrapper: { alignItems: "center", gap: 14 },
  iconCircleDecline: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: "#EF4444", 
    justifyContent: "center", 
    alignItems: "center", 
    elevation: 10,
    shadowColor: "#EF4444",
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  iconCircleAccept: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: "#10B981", 
    justifyContent: "center", 
    alignItems: "center", 
    elevation: 10, 
    shadowColor: "#10B981", 
    shadowOpacity: 0.6, 
    shadowRadius: 20 
  },
  declineLabel: { color: "#FCA5A5", fontWeight: "800", fontSize: 14 },
  acceptLabel: { color: "#185742", fontWeight: "800", fontSize: 14 }
});