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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase"; 
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

type Status = "loading" | "available" | "unavailable";

export default function TeleConsultation() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

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

  const fetchSubscribedDoctors = async (text: string = "") => {
    if (!user) return;
    setStatus("loading");
    
    try {
      // 1. Fetch only ACTIVE subscriptions
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("doctor_id, plan_type, id, expiry_date, status")
        .eq("patient_id", user.id)
        .eq("status", "active"); // CRITICAL: Only show active ones

      if (subError) throw subError;

      // Filter out any that are past their expiry date but still marked active
      const now = new Date();
      const validSubs = subData?.filter(sub => new Date(sub.expiry_date) > now) || [];

      if (validSubs.length === 0) {
        setDoctors([]);
        setStatus("unavailable");
        return;
      }

      const doctorIds = validSubs.map(sub => sub.doctor_id);

      // 2. Fetch the profiles of those specific freelancers
      let profileRequest = supabase
        .from("profiles") 
        .select("*")
        .in("id", doctorIds);

      if (text) {
        profileRequest = profileRequest.ilike("full_name", `%${text}%`);
      }

      const { data: profileData, error: profileError } = await profileRequest;
      if (profileError) throw profileError;

      // 3. Merge data
      const merged = profileData.map(profile => {
        const sub = validSubs.find(s => s.doctor_id === profile.id);
        return { ...profile, subId: sub?.id, plan: sub?.plan_type };
      });

      setDoctors(merged);
      setStatus("available");
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
      setStatus("unavailable");
    }
  };

  useEffect(() => { fetchSubscribedDoctors(""); }, [user]);

  const handleStartCall = async (doctor: any) => {
    if (!user?.id) {
      Alert.alert("Authentication Error", "Please sign in to start a consultation.");
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const displayName = profile?.full_name || "Patient";
      const agoraChannel = doctor.id.toLowerCase();

      const { data, error } = await supabase
        .from('calls')
        .insert([
          { 
            patient_id: user.id, 
            doctor_id: doctor.id, 
            patient_name: displayName, 
            status: 'ringing',
            channel_name: agoraChannel 
          }
        ])
        .select()
        .single();

      if (error) throw error;

      router.push({
        pathname: "/checkup/telemedicine", 
        params: { 
          doctorId: doctor.id, 
          doctorName: doctor.full_name,
          callId: data.id,
          channelName: agoraChannel 
        }
      });

    } catch (error: any) {
      Alert.alert("Call Failed", "Could not connect to the specialist.");
    }
  };

  const renderDoctor = ({ item }: any) => (
    <View style={styles.doctorCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.avatar_url || `https://ui-avatars.com/api/?name=${item.full_name}&background=0EA5E9&color=fff` }} 
            style={styles.avatar} 
          />
          <View style={styles.onlineBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.onlineText}>{item.plan || 'Active'}</Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.doctorName}>{item.full_name}</Text>
          <Text style={styles.specialty}>{item.specialty || "Verified Specialist"}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
            <Text style={styles.priceText}>Member Access</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
            style={styles.chatIconBtn}
            onPress={() => router.push({
                pathname: "/(patient-dashboard)/chat/[id]",
                params: { id: item.id, name: item.full_name }
            })}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#0EA5E9" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.videoBtn}
          onPress={() => handleStartCall(item)}
        >
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
                <View style={{ width: 26 }} /> 
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search your doctors..."
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={searchQuery}
                onChangeText={(t) => {
                    setSearchQuery(t);
                    fetchSubscribedDoctors(t);
                }}
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
                <Text style={styles.statusText}>Connecting to Specialists...</Text>
              </View>
            ) : status === "unavailable" ? (
              <View style={styles.center}>
                <MaterialCommunityIcons name="video-off" size={80} color="#334155" />
                <Text style={styles.statusText}>No active subscriptions found</Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(patient-dashboard)/subscriptions')} 
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText}>Manage Subscriptions</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={doctors}
                keyExtractor={(item) => item.id}
                renderItem={renderDoctor}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<Text style={styles.listHeader}>Your Available Experts</Text>}
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
  searchBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 15, height: 55, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1, marginLeft: 10, color: '#FFF', fontSize: 16 },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  radarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0EA5E9' },
  statusText: { color: '#BAE6FD', fontSize: 16, fontWeight: '600' },
  retryBtn: { marginTop: 15, backgroundColor: '#0EA5E9', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '800' },
  list: { padding: 20, paddingBottom: 40 },
  listHeader: { color: '#BAE6FD', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  doctorCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 15, marginBottom: 16, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { alignItems: 'center' },
  avatar: { width: 75, height: 75, borderRadius: 22, backgroundColor: '#F1F5F9' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: -12, borderWidth: 2, borderColor: '#FFF' },
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