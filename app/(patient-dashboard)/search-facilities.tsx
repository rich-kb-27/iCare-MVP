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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase"; 
import { StatusBar } from "expo-status-bar";

type Status = "loading" | "available" | "unavailable";

export default function SearchFacilities() {
  const [status, setStatus] = useState<Status>("loading");
  const [searchQuery, setSearchQuery] = useState("");
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

  // --- SEARCH LOGIC FOR FACILITIES ---
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    setStatus("loading");
    
    const { data, error } = await supabase
      .from("profiles") 
      .select("*")
      .eq("role", "facility") // Filtering for facilities
      .ilike("full_name", `%${text}%`);

    if (error || !data || data.length === 0) {
      setFacilities([]);
      setStatus("unavailable");
    } else {
      setFacilities(data);
      setStatus("available");
    }
  };

  useEffect(() => { handleSearch(""); }, []);

  const renderFacility = ({ item }: any) => (
    <TouchableOpacity style={styles.facilityCard}>
      <View style={styles.cardHeader}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.avatar_url || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=500" }} 
            style={styles.facilityImg} 
          />
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.specialty || "General Hospital"}</Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.facilityName}>{item.full_name}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color="#0EA5E9" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.address || "Lusaka, Zambia"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>{item.rating || "4.8"}</Text>
            </View>
            <Text style={styles.distanceText}>• 2.4 km away</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.detailsBtn}>
          <Text style={styles.detailsBtnText}>View Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.directionBtn}>
          <MaterialCommunityIcons name="directions" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar style="light" translucent={true} />
      
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Medical Facilities</Text>
            <View style={styles.searchBar}>
              <Ionicons name="business-outline" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search hospitals or clinics..."
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
                  <MaterialCommunityIcons name="hospital-marker" size={80} color="#0EA5E9" />
                </Animated.View>
                <Text style={styles.statusText}>Locating nearby facilities...</Text>
              </View>
            ) : status === "unavailable" ? (
              <View style={styles.center}>
                <Ionicons name="business-outline" size={80} color="#334155" />
                <Text style={styles.statusText}>No facilities found</Text>
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <Text style={styles.retryText}>Refresh Search</Text>
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
  
  list: { padding: 20, paddingBottom: 40 },
  facilityCard: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 28, 
    padding: 15, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  cardHeader: { flexDirection: 'row', gap: 15 },
  imageContainer: { position: 'relative' },
  facilityImg: { width: 90, height: 90, borderRadius: 20, backgroundColor: '#1E293B' },
  typeBadge: { 
    position: 'absolute', 
    bottom: -8, 
    alignSelf: 'center', 
    backgroundColor: '#0EA5E9', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 8 
  },
  typeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  
  info: { flex: 1, justifyContent: 'center' },
  facilityName: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  locationText: { color: '#94A3B8', fontSize: 13, flex: 1 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingText: { color: '#FBBF24', fontSize: 12, fontWeight: '700' },
  distanceText: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', marginTop: 15, gap: 10 },
  detailsBtn: { flex: 1, backgroundColor: 'rgba(14, 165, 233, 0.15)', height: 45, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.2)' },
  detailsBtnText: { color: '#38BDF8', fontWeight: '700', fontSize: 14 },
  directionBtn: { width: 45, height: 45, backgroundColor: '#0EA5E9', borderRadius: 14, justifyContent: 'center', alignItems: 'center' }
});