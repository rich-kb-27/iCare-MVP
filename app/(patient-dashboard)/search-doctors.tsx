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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase"; 
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

type Status = "loading" | "available" | "unavailable";

const CATEGORIES = [
  { id: "1", name: "General", searchKey: "General", icon: "account-group" },
  { id: "2", name: "Doctors", searchKey: "Doctor", icon: "doctor" },
  { id: "3", name: "Nurses", searchKey: "Nurse", icon: "fountain-pen-tip" },
  { id: "4", name: "Clinical Officers", searchKey: "Clinical officer", icon: "clipboard-pulse" },
  { id: "5", name: "Pediatricians", searchKey: "Pediatrician", icon: "baby-face-outline" },
  { id: "6", name: "Pharmacists", searchKey: "Pharmacist", icon: "pill" }, // Added Pharmacist
  { id: "7", name: "Dentists", searchKey: "Dentist", icon: "tooth-outline" },
  { id: "8", name: "Opticians", searchKey: "Optician", icon: "eye-outline" },
  { id: "9", name: "Other", searchKey: "Other", icon: "dots-horizontal" },
];

export default function SearchFreelancers() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
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
  }, [status, pulse]);

  const fetchDoctors = async (query: string, category: any) => {
    setStatus("loading");
    
    let baseQuery = supabase
      .from("profiles") 
      .select("id, full_name, specialization, rating, experience, avatar_url, is_online")
      .eq("role", "freelancer");

    // Filter by name if searching
    if (query) {
      baseQuery = baseQuery.ilike("full_name", `%${query}%`);
    }

    // Category Logic
    if (category.searchKey !== "General" && category.searchKey !== "Other") {
      baseQuery = baseQuery.ilike("specialization", `%${category.searchKey}%`);
    } else if (category.searchKey === "Other") {
      const knownRoles = CATEGORIES.map(c => c.searchKey).filter(k => k !== "General" && k !== "Other");
      baseQuery = baseQuery.not("specialization", "in", `(${knownRoles.join(',')})`);
    }

    // Always sort by highest rating
    const { data, error } = await baseQuery.order('rating', { ascending: false });

    if (error || !data || data.length === 0) {
      setDoctors([]);
      setStatus("unavailable");
    } else {
      setDoctors(data);
      setStatus("available");
    }
  };

  useEffect(() => { 
    fetchDoctors(searchQuery, selectedCategory); 
  }, [selectedCategory]);

  const renderDoctor = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.doctorCard}
      onPress={() => router.push({
        pathname: "/(patient-dashboard)/assign-freelancer",
        params: { 
          doctorId: item.id,
          doctorName: item.full_name,
          specialty: item.specialization,
          rate: '50', // Fixed Base Fee
          avatar: item.avatar_url
        }
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.avatar_url || "https://via.placeholder.com/150" }} style={styles.avatar} />
          {item.is_online && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.info}>
          <Text style={styles.doctorName}>{item.full_name}</Text>
          <Text style={styles.specialtyText}>{item.specialization || "Specialist"}</Text>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={14} color="#D97706" />
            <Text style={styles.ratingText}>{item.rating?.toFixed(1) || "0.0"} • {item.experience }</Text>
          </View>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>K50</Text>
          <Text style={styles.priceSub}>base fee</Text>
        </View>
      </View>
      
      <View style={styles.subscriptionPreview}>
        <MaterialCommunityIcons name="shield-check" size={16} color="#10B981" />
        <Text style={styles.subText}>Verified {item.specialization || 'Provider'}</Text>
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{marginLeft: 'auto'}} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar style="light" translucent={true} />
      
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Find Specialists</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search by name..."
                placeholderTextColor="#64748B"
                style={styles.input}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => fetchDoctors(searchQuery, selectedCategory)}
              />
            </View>
          </View>

          <View style={styles.categorySection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryChip, 
                    selectedCategory.id === cat.id && styles.categoryChipActive
                  ]}
                >
                  <MaterialCommunityIcons 
                    name={cat.icon as any} 
                    size={20} 
                    color={selectedCategory.id === cat.id ? "#FFF" : "#BAE6FD"} 
                  />
                  <Text style={[
                    styles.categoryText, 
                    selectedCategory.id === cat.id && styles.categoryTextActive
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.content}>
            {status === "loading" ? (
              <View style={styles.center}>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <MaterialCommunityIcons name="heart-pulse" size={80} color="#0EA5E9" />
                </Animated.View>
                <Text style={styles.statusText}>Searching iCare Network...</Text>
              </View>
            ) : status === "unavailable" ? (
              <View style={styles.center}>
                <Ionicons name="search-outline" size={80} color="#334155" />
                <Text style={styles.statusText}>No specialists found</Text>
                <TouchableOpacity onPress={() => {setSearchQuery(""); setSelectedCategory(CATEGORIES[0]);}}>
                  <Text style={styles.retryText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={doctors}
                keyExtractor={(item) => item.id}
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
  header: { padding: 24, paddingBottom: 10 },
  headerTitle: { color: "#FFF", fontSize: 28, fontWeight: "900", marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 18, 
    paddingHorizontal: 15, 
    height: 55, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  input: { flex: 1, marginLeft: 10, color: '#FFF', fontSize: 16 },
  categorySection: { marginBottom: 10 },
  categoryScroll: { paddingLeft: 24, paddingRight: 10, gap: 10 },
  categoryChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8
  },
  categoryChipActive: { backgroundColor: '#0EA5E9', borderColor: '#7DD3FC' },
  categoryText: { color: '#BAE6FD', fontWeight: '700', fontSize: 14 },
  categoryTextActive: { color: '#FFF' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  statusText: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  retryText: { color: '#0EA5E9', fontWeight: '800', marginTop: 10 },
  list: { padding: 24, paddingBottom: 40 },
  doctorCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16,
    elevation: 4
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 68, height: 68, borderRadius: 22, backgroundColor: '#F1F5F9' },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', position: 'absolute', bottom: -2, right: -2, borderWidth: 3, borderColor: '#FFF' },
  info: { flex: 1, marginLeft: 15 },
  doctorName: { color: '#0F172A', fontSize: 17, fontWeight: '800' },
  specialtyText: { color: '#64748B', fontSize: 13, marginTop: 2 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ratingText: { color: '#D97706', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  priceTag: { alignItems: 'flex-end' },
  priceText: { color: '#0EA5E9', fontSize: 20, fontWeight: '900' },
  priceSub: { color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', fontWeight: '700' },
  subscriptionPreview: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 18, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9',
    gap: 8
  },
  subText: { fontSize: 12, color: '#10B981', fontWeight: '800' }
});