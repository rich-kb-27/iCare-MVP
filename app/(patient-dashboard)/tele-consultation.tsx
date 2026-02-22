import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase"; 
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

type Status = "loading" | "available" | "unavailable";

export default function TeleConsultation() {
  const [status, setStatus] = useState<Status>("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

  // Radar animation for loading state
  useEffect(() => {
    if (status === "loading") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  const fetchOnlineDoctors = async (text: string) => {
    setSearchQuery(text);
    setStatus("loading");
    
    // Filtering for freelancers (doctors) who are likely available for tele-consult
    const { data, error } = await supabase
      .from("profiles") 
      .select("*")
      .eq("role", "freelancer") 
      .ilike("full_name", `%${text}%`);

    if (error || !data || data.length === 0) {
      setDoctors([]);
      setStatus("unavailable");
    } else {
      setDoctors(data);
      setStatus("available");
    }
  };

  useEffect(() => { fetchOnlineDoctors(""); }, []);

  const renderDoctor = ({ item }: any) => (
    <View style={styles.doctorCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.avatar_url || `https://ui-avatars.com/api/?name=${item.full_name}&background=0EA5E9&color=fff` }} 
            style={styles.avatar} 
          />
          {/* Online status indicator */}
          <View style={styles.onlineBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.doctorName}>{item.full_name}</Text>
          <Text style={styles.specialty}>{item.specialty || "Tele-Health Specialist"}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>{item.rating || "4.9"}</Text>
            </View>
            <Text style={styles.priceText}>${item.hourly_rate || '45'}/session</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
            style={styles.chatIconBtn}
            onPress={() => router.push("/(patient-dashboard)/chat")}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#0EA5E9" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.videoBtn}>
          <Ionicons name="videocam" size={20} color="#FFF" />
          <Text style={styles.videoBtnText}>Start Video Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar style="light" />
      
      <LinearGradient colors={["#0F172A", "#1E293B", "#0EA5E9"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          
          <View style={styles.header}>
            <View style={styles.topRow}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={26} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tele-Consult</Text>
                <TouchableOpacity>
                    <Ionicons name="options-outline" size={26} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Find a specialist..."
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={searchQuery}
                onChangeText={fetchOnlineDoctors}
              />
            </View>
          </View>

          <View style={styles.content}>
            {status === "loading" ? (
              <View style={styles.center}>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <View style={styles.radarCircle}>
                    <MaterialCommunityIcons name="video-wireless" size={50} color="#0EA5E9" />
                  </View>
                </Animated.View>
                <Text style={styles.statusText}>Connecting to Doctors...</Text>
              </View>
            ) : status === "unavailable" ? (
              <View style={styles.center}>
                <MaterialCommunityIcons name="video-off" size={80} color="#334155" />
                <Text style={styles.statusText}>No doctors online right now</Text>
                <TouchableOpacity onPress={() => fetchOnlineDoctors("")} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Refresh List</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={doctors}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderDoctor}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<Text style={styles.listHeader}>Available for Consultation</Text>}
              />
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: "#FFF", fontSize: 22, fontWeight: "900" },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    height: 55, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  input: { flex: 1, marginLeft: 10, color: '#FFF', fontSize: 16 },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  radarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0EA5E9' },
  statusText: { color: '#BAE6FD', fontSize: 16, fontWeight: '600' },
  retryBtn: { marginTop: 15, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '800' },
  list: { padding: 20, paddingBottom: 40 },
  listHeader: { color: '#BAE6FD', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  
  doctorCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 28, 
    padding: 15, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { alignItems: 'center' },
  avatar: { width: 75, height: 75, borderRadius: 22, backgroundColor: '#F1F5F9' },
  onlineBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#DCFCE7', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 8, 
    marginTop: -12,
    borderWidth: 2,
    borderColor: '#FFF'
  },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 4 },
  onlineText: { color: '#166534', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  
  info: { flex: 1, marginLeft: 15 },
  doctorName: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  specialty: { color: '#64748B', fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  priceText: { color: '#0EA5E9', fontSize: 13, fontWeight: '800' },

  actionRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
  chatIconBtn: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0F2FE' },
  videoBtn: { flex: 1, height: 50, backgroundColor: '#0F172A', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  videoBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 }
});