import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { StatusBar } from "expo-status-bar";

type Status = "loading" | "available" | "unavailable";

export default function ChatList() {
  const [status, setStatus] = useState<Status>("loading");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

  // --- YOUR SIGNATURE PULSE LOGIC ---
  useEffect(() => {
    if (status === "loading") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  const fetchChatPartners = async (query = "") => {
    setStatus("loading");
    
    let request = supabase
      .from("profiles")
      .select("*")
      .eq("role", "freelancer");

    if (query) {
      request = request.ilike("full_name", `%${query}%`);
    }

    const { data, error } = await request;

    if (error || !data || data.length === 0) {
      setDoctors([]);
      setStatus("unavailable");
    } else {
      setDoctors(data);
      setStatus("available");
    }
  };

  useEffect(() => {
    fetchChatPartners();
  }, []);

  const renderDoctorItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.chatCard}
      onPress={() => router.push({
        pathname: "/(patient-dashboard)/chat/[id]",
        params: { id: item.id, name: item.full_name }
      })}
    >
      <View style={styles.avatarWrapper}>
        <Image 
          source={{ uri: item.avatar_url || "https://via.placeholder.com/150" }} 
          style={styles.avatar} 
        />
        {item.is_online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.doctorName}>{item.full_name}</Text>
          <Text style={styles.specialtyText}>{item.specialty || "General Doctor"}</Text>
        </View>
        <Text style={styles.lastMsg} numberOfLines={1}>
          Tap to start a private consultation...
        </Text>
      </View>

      <View style={styles.actionArea}>
        <Ionicons name="chatbubble-ellipses-outline" size={22} color="#0EA5E9" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar style="light" translucent />
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <Text style={styles.title}>Consultations</Text>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search doctors..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  fetchChatPartners(text);
                }}
              />
            </View>
          </View>

          {/* --- CONTENT --- */}
          <View style={styles.content}>
            {status === "loading" ? (
              <View style={styles.center}>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <MaterialCommunityIcons name="message-text-clock" size={70} color="#0EA5E9" />
                </Animated.View>
                <Text style={styles.loadingText}>Syncing medical experts...</Text>
              </View>
            ) : status === "unavailable" ? (
              <View style={styles.center}>
                <Ionicons name="chatbox-outline" size={70} color="#1E293B" />
                <Text style={styles.loadingText}>No doctors available for chat</Text>
              </View>
            ) : (
              <FlatList
                data={doctors}
                keyExtractor={(item) => item.id}
                renderItem={renderDoctorItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
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
  header: { padding: 25 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', marginBottom: 20 },
  searchBox: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    height: 50, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  searchInput: { flex: 1, marginLeft: 10, color: '#FFF', fontSize: 15 },
  
  content: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  loadingText: { color: '#64748B', fontWeight: '600' },

  chatCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 55, height: 55, borderRadius: 18, backgroundColor: '#1E293B' },
  onlineIndicator: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: '#22C55E', 
    borderWidth: 3, 
    borderColor: '#0B3C5D' 
  },
  
  chatInfo: { flex: 1, marginLeft: 15 },
  nameRow: { marginBottom: 4 },
  doctorName: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  specialtyText: { color: '#0EA5E9', fontSize: 12, fontWeight: '700', marginTop: 2 },
  lastMsg: { color: '#64748B', fontSize: 13, marginTop: 4 },
  
  actionArea: { paddingLeft: 10 }
});