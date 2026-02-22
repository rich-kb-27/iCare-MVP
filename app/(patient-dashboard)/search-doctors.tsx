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
  Platform, // Added Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase"; 
import { StatusBar } from "expo-status-bar";

type Status = "loading" | "available" | "unavailable";

export default function SearchFreelancers() {
  const [status, setStatus] = useState<Status>("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === "loading") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    setStatus("loading");
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

  useEffect(() => { handleSearch(""); }, []);

  const renderDoctor = ({ item }: any) => (
    <TouchableOpacity style={styles.doctorCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.avatar_url || "https://via.placeholder.com/150" }} style={styles.avatar} />
          {item.is_online && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.info}>
          <Text style={styles.doctorName}>{item.full_name}</Text>
          <Text style={styles.specialty}>{item.specialty || "Freelance Doctor"}</Text>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.ratingText}>{item.rating || "5.0"}</Text>
          </View>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>${item.hourly_rate || '45'}</Text>
          <Text style={styles.priceSub}>/hr</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.bookBtn}>
        <Text style={styles.bookBtnText}>View Availability</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      {/* 1. Force light icons and make it translucent so gradient shows behind it */}
      <StatusBar style="light" translucent={true} />
      
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.container}>
        {/* 2. SafeAreaView handles the notch padding */}
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Find Freelancers</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search by name..."
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
          </View>

          <View style={styles.content}>
            {status === "loading" ? (
              <View style={styles.center}>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <MaterialCommunityIcons name="radar" size={80} color="#0EA5E9" />
                </Animated.View>
                <Text style={styles.statusText}>Searching Database...</Text>
              </View>
            ) : status === "unavailable" ? (
              <View style={styles.center}>
                <Ionicons name="search-outline" size={80} color="#334155" />
                <Text style={styles.statusText}>No freelancers found</Text>
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <Text style={styles.retryText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={doctors}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderDoctor}
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
  // 3. Added slightly more top padding for devices without notches
  header: { padding: 24, paddingTop: Platform.OS === 'android' ? 10 : 0, paddingBottom: 10 },
  headerTitle: { color: "#FFF", fontSize: 26, fontWeight: "900", marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 16, 
    paddingHorizontal: 15, 
    height: 55, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  input: { flex: 1, marginLeft: 10, color: '#FFF', fontSize: 16 },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  statusText: { color: '#BAE6FD', fontSize: 18, fontWeight: '600' },
  retryText: { color: '#0EA5E9', fontWeight: '800', marginTop: 10 },
  list: { padding: 24, paddingBottom: 40 },
  doctorCard: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#1E293B' },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', position: 'absolute', bottom: -2, right: -2, borderWidth: 3, borderColor: '#0B3C5D' },
  info: { flex: 1, marginLeft: 15 },
  doctorName: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  specialty: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: 'rgba(251, 191, 36, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  ratingText: { color: '#FBBF24', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  priceTag: { alignItems: 'flex-end' },
  priceText: { color: '#0EA5E9', fontSize: 20, fontWeight: '800' },
  priceSub: { color: '#64748B', fontSize: 10 },
  bookBtn: { backgroundColor: '#0EA5E9', marginTop: 15, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  bookBtnText: { color: '#FFF', fontWeight: '700' }
});