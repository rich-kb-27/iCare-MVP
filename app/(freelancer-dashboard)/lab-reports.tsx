import React, { useEffect, ReactElement, useState, useRef } from "react";
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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase"; 
import { StatusBar } from "expo-status-bar";

type Status = "loading" | "available" | "unavailable";

// Filter Categories - Integrated with your DB 'facility_type' column
const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'th-large' },
  { id: 'hospital', label: 'Hospitals', icon: 'hospital' },
  { id: 'clinic', label: 'Clinics', icon: 'clinic-medical' },
  { id: 'pharmacy', label: 'Pharmacies', icon: 'pills' },
  { id: 'optics', label: 'Optics', icon: 'glasses' },
  { id: 'dental', label: 'Dental', icon: 'tooth' },
  { id: 'lab', label: 'Labs', icon: 'flask' },
  { id: 'other', label: 'Others', icon: 'plus-circle' }, 
];

export default function SearchFacilities() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [facilities, setFacilities] = useState<any[]>([]);
  const pulse = useRef(new Animated.Value(1)).current;

  // --- PULSE ANIMATION ---
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

  // --- FETCH LOGIC WITH CATEGORY & TEXT FILTER ---
  const fetchFacilities = async (text: string, category: string) => {
    setStatus("loading");
    
    let query = supabase
      .from("profiles") 
      .select("*")
      .eq("role", "facility");

    if (text) {
      query = query.ilike("full_name", `%${text}%`);
    }

    if (category !== 'all') {
      if (category === 'other') {
        // Scalability: Catch types not in our primary list
        const standardTypes = ['hospital', 'clinic', 'pharmacy', 'optics', 'dental', 'lab'];
        query = query.not('facility_type', 'in', `(${standardTypes.join(',')})`);
      } else {
        query = query.eq("facility_type", category);
      }
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      setFacilities([]);
      setStatus("unavailable");
    } else {
      setFacilities(data);
      setStatus("available");
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFacilities(searchQuery, selectedCategory);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCategory]);

  const renderCategory = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.catChip, selectedCategory === item.id && styles.activeCatChip]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <FontAwesome5 
        name={item.icon} 
        size={14} 
        color={selectedCategory === item.id ? "#0F172A" : "#94A3B8"} 
      />
      <Text style={[styles.catText, selectedCategory === item.id && styles.activeCatText]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderFacility = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.facilityCard}
      onPress={() => router.push({
        pathname: "/facility-checkin",
        params: { facilityId: item.id, facilityName: item.full_name, facilityType: item.facility_type }
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.avatar_url || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=500" }} 
            style={styles.facilityImg} 
          />
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {item.facility_type ? item.facility_type.toUpperCase().replace('_', ' ') : "FACILITY"}
            </Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.facilityName} numberOfLines={1}>{item.full_name}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color="#0EA5E9" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.address || "Lusaka, Zambia"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>{item.rating || "5.0"}</Text>
            </View>
            <Text style={styles.distanceText}>• Verified</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity 
            style={styles.checkInBtn}
            onPress={() => router.push({
                pathname: "/freelancer-facility-checkin",
                params: { facilityId: item.id, facilityName: item.full_name, facilityType: item.facility_type }
            })}
        >
          <Text style={styles.checkInBtnText}>Check In & Consult</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.directionBtn}>
          <MaterialCommunityIcons name="directions" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar style="light" translucent={true} />
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          
          {/* Header & Search */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Find Care</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search hospitals or clinics..."
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Horizontal Filters */}
          <View>
            <FlatList
              horizontal
              data={CATEGORIES}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catList}
            />
          </View>

          {/* Results Area */}
          <View style={styles.content}>
            {status === "loading" ? (
              <View style={styles.center}>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <MaterialCommunityIcons name="hospital-marker" size={80} color="#0EA5E9" />
                </Animated.View>
                <Text style={styles.statusText}>Searching iCare Network...</Text>
              </View>
            ) : status === "unavailable" ? (
              <View style={styles.center}>
                <Ionicons name="business-outline" size={80} color="#334155" />
                <Text style={styles.statusText}>No results in this category</Text>
                <TouchableOpacity onPress={() => {setSearchQuery(""); setSelectedCategory("all");}}>
                  <Text style={styles.retryText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={facilities}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderFacility}
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
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 10 : 0 },
  headerTitle: { color: "#FFF", fontSize: 28, fontWeight: "900", marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 18, 
    paddingHorizontal: 15, 
    height: 56, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  input: { flex: 1, marginLeft: 10, color: '#FFF', fontSize: 16 },
  
  catList: { paddingHorizontal: 24, paddingVertical: 20, gap: 10 },
  catChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.06)', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 16, 
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  activeCatChip: { backgroundColor: '#BAE6FD', borderColor: '#BAE6FD' },
  catText: { color: '#94A3B8', fontSize: 14, fontWeight: '700' },
  activeCatText: { color: '#0F172A' },

  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  statusText: { color: '#BAE6FD', fontSize: 16, fontWeight: '600' },
  retryText: { color: '#0EA5E9', fontWeight: '800', marginTop: 10 },
  
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  facilityCard: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 28, 
    padding: 18, 
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  cardHeader: { flexDirection: 'row', gap: 18 },
  imageContainer: { position: 'relative' },
  facilityImg: { width: 95, height: 95, borderRadius: 22, backgroundColor: '#1E293B' },
  typeBadge: { 
    position: 'absolute', 
    bottom: -6, 
    alignSelf: 'center', 
    backgroundColor: '#0EA5E9', 
    paddingHorizontal: 10, 
    paddingVertical: 3, 
    borderRadius: 8 
  },
  typeText: { color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  
  info: { flex: 1, justifyContent: 'center' },
  facilityName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  locationText: { color: '#94A3B8', fontSize: 13, flex: 1 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ratingText: { color: '#FBBF24', fontSize: 12, fontWeight: '700' },
  distanceText: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', marginTop: 20, gap: 10 },
  checkInBtn: { flex: 1, backgroundColor: 'rgba(14, 165, 233, 0.15)', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.2)' },
  checkInBtnText: { color: '#38BDF8', fontWeight: '800', fontSize: 15 },
  directionBtn: { width: 52, height: 52, backgroundColor: '#0EA5E9', borderRadius: 16, justifyContent: 'center', alignItems: 'center' }
});