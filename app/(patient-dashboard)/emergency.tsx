import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function EmergencyScreen() {
  const [isPressing, setIsPressing] = useState(false);
  const timerAnim = useRef(new Animated.Value(0)).current;

  // --- SOS HOLD LOGIC ---
  const handlePressIn = () => {
    setIsPressing(true);
    Animated.timing(timerAnim, {
      toValue: 1,
      duration: 2000, // Must hold for 2 seconds
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        triggerSOS();
      }
    });
  };

  const handlePressOut = () => {
    setIsPressing(false);
    Animated.spring(timerAnim, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  const triggerSOS = () => {
    Vibration.vibrate([0, 500, 100, 500]); // Alarm vibration pattern
    alert("SOS Triggered! Sending your location to emergency contacts...");
    // Integration logic: supabase.from('alerts').insert({...})
  };

  const progressWidth = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#450A0A" }}>
      <StatusBar style="light" />
      <LinearGradient colors={["#7F1D1D", "#450A0A", "#000"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <Text style={styles.emergencyTitle}>Emergency Hub</Text>
            <Text style={styles.emergencySub}>Help is a tap away</Text>
          </View>

          <View style={styles.mainContent}>
            {/* --- SOS BUTTON --- */}
            <View style={styles.sosWrapper}>
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: isPressing ? 1.5 : 1 }] }]} />
              <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.sosButton}
              >
                <MaterialCommunityIcons name="alarm-light" size={60} color="#FFF" />
                <Text style={styles.sosText}>SOS</Text>
              </TouchableOpacity>
              
              <Text style={styles.holdText}>
                {isPressing ? "Release to cancel" : "Hold for 2s to trigger SOS"}
              </Text>

              {/* Progress Bar for the Hold */}
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
              </View>
            </View>

            {/* --- QUICK ACTION GRID --- */}
            <View style={styles.grid}>
              <EmergencyItem 
                icon="ambulance" 
                label="Ambulance" 
                color="#EF4444" 
                onPress={() => alert("Calling Medical Emergency...")} 
              />
              <EmergencyItem 
                icon="shield-alt" 
                label="Police" 
                color="#3B82F6" 
                onPress={() => alert("Calling Police...")} 
              />
              <EmergencyItem 
                icon="fire-extinguisher" 
                label="Fire Brigade" 
                color="#F59E0B" 
                onPress={() => alert("Calling Fire Station...")} 
              />
              <EmergencyItem 
                icon="users" 
                label="Family" 
                color="#10B981" 
                onPress={() => alert("Notifying Emergency Contacts...")} 
              />
            </View>
          </View>

          {/* --- LOCATION FOOTER --- */}
          <View style={styles.footer}>
            <Ionicons name="location" size={18} color="#FCA5A5" />
            <Text style={styles.locationText}>Current Location: Rhodes Park, Lusaka</Text>
          </View>

        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

// Sub-component for the grid items
const EmergencyItem = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity style={styles.gridItem} onPress={onPress}>
    <View style={[styles.iconCircle, { backgroundColor: color + "20" }]}>
      <FontAwesome5 name={icon} size={24} color={color} />
    </View>
    <Text style={styles.gridLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 30, alignItems: 'center' },
  emergencyTitle: { color: "#FFF", fontSize: 28, fontWeight: "900" },
  emergencySub: { color: "#FCA5A5", fontSize: 14, fontWeight: "600", marginTop: 5 },

  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  sosWrapper: { alignItems: 'center', marginBottom: 50 },
  sosButton: { 
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    backgroundColor: '#EF4444', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#EF4444',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    zIndex: 2
  },
  sosText: { color: '#FFF', fontSize: 32, fontWeight: '900', marginTop: 5 },
  pulseCircle: { 
    position: 'absolute', 
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    zIndex: 1
  },
  holdText: { color: '#FCA5A5', marginTop: 20, fontWeight: '700', fontSize: 14 },
  
  progressBarBg: { width: 200, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 15, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#EF4444' },

  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 20, 
    justifyContent: 'center', 
    gap: 15 
  },
  gridItem: { 
    width: '44%', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 20, 
    borderRadius: 24, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  iconCircle: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gridLabel: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 25, 
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: 8
  },
  locationText: { color: '#FCA5A5', fontSize: 12, fontWeight: '600' }
});