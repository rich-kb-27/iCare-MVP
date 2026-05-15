import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Image, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Supabase
import { supabase } from '@/lib/supabase';

// High-level categories for specialized home care
// 'searchKey' matches the exact string (singular) likely used in your DB specialization column
const CARE_CATEGORIES = [
  { id: '1', title: 'Maternal Care', searchKey: 'Maternal', icon: 'baby-carriage', color: '#EC4899', description: 'Prenatal & Postnatal' },
  { id: '2', title: 'Pediatricians', searchKey: 'Pediatrician', icon: 'baby', color: '#0EA5E9', description: 'Child Specialists' },
  { id: '3', title: 'Senior Care', searchKey: 'Senior', icon: 'walking', color: '#8B5CF6', description: 'Elderly Support' },
  { id: '4', title: 'Physiotherapy', searchKey: 'Physio', icon: 'heartbeat', color: '#10B981', description: 'Home Recovery' },
];

interface Freelancer {
  id: string;
  full_name: string;
  specialization: string; 
  experience: string;
  rating: number;
  reviews_count: number;
  avatar_url: string;
  is_online: boolean;
}

const HomeCareScreen = () => {
  const router = useRouter();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CARE_CATEGORIES[0]);

  const fetchFreelancers = async () => {
  try {
    if (!refreshing) setLoading(true);

    // 1. Start the query
    let query = supabase
      .from('profiles')
      .select(`id, full_name, specialization, experience, rating, reviews_count, avatar_url, is_online`)
      .eq('role', 'freelancer');

    // 2. Handle the Specialization (The "Home Care" filter)
    // We use the searchKey from your CARE_CATEGORIES
    query = query.ilike('specialization', `%${selectedCategory.searchKey}%`);

    // 3. The Rating Check (BE CAREFUL HERE)
    // If your DB has new doctors with 0 rating, .gte('rating', 3) hides them!
    // Let's change this to include unrated doctors or just sort them.
    query = query.or('rating.gte.0,rating.is.null'); 

    const { data, error } = await query.order('rating', { ascending: false });
    
    if (error) throw error;
    setFreelancers(data || []);
  } catch (error: any) {
    console.error("Fetch Error:", error.message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    fetchFreelancers();
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFreelancers();
  };

  const FreelancerCard = ({ item }: { item: Freelancer }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <View style={styles.docCard}>
        <View style={styles.cardTop}>
          <View style={styles.imageContainer}>
            {item.avatar_url && !imageError ? (
              <Image source={{ uri: item.avatar_url }} style={styles.docImage} onError={() => setImageError(true)} />
            ) : (
              <View style={[styles.docImage, styles.placeholderImg]}>
                <FontAwesome5 name="user-md" size={30} color="#0EA5E9" />
              </View>
            )}
            {item.is_online && <View style={styles.onlineBadge} />}
          </View>
          
          <View style={styles.docMainInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.docName}>{item.full_name}</Text>
              <MaterialCommunityIcons name="check-decagram" size={18} color="#0EA5E9" />
            </View>
            <Text style={styles.docSpecialty}>{item.specialization || 'Home Care Specialist'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '5.0'} • {item.experience || '3+'} years exp</Text>
            </View>
          </View>
        </View>

        <View style={styles.subOfferBox}>
            <View>
              <Text style={styles.subLabel}>Monthly Home Subscription</Text>
              <Text style={styles.subPrice}>K1,250 <Text style={styles.subPeriod}>/ month</Text></Text>
            </View>
            <TouchableOpacity 
              style={styles.subscribeBtn}
              onPress={() => router.push({
                pathname: "/(patient-dashboard)/assign-freelancer",
                params: { doctorId: item.id, doctorName: item.full_name, plan: selectedCategory.title }
              })}
            >
              <Text style={styles.subscribeText}>View Offer</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Home Care Plans</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
        >
          {/* Horizontal Categories */}
          <Text style={styles.sectionLabel}>Select Specialization</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {CARE_CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.catCard, 
                  selectedCategory.id === cat.id && { borderColor: cat.color, backgroundColor: 'rgba(255,255,255,0.05)' }
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}>
                  <FontAwesome5 name={cat.icon} size={20} color={cat.color} />
                </View>
                <Text style={styles.catTitle}>{cat.title}</Text>
                <Text style={styles.catDesc}>{cat.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Dynamic List Header */}
          <View style={styles.listHeader}>
            <Text style={styles.sectionLabel}>{selectedCategory.title} Specialists</Text>
            <Text style={styles.resultCount}>{freelancers.length} Found</Text>
          </View>
          
          {/* Main List Rendering */}
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 40 }} />
          ) : freelancers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-search-outline" size={60} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No {selectedCategory.searchKey}s found.</Text>
            </View>
          ) : (
            freelancers.map((item) => <FreelancerCard key={item.id} item={item} />)
          )}

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  backBtn: { width: 40 },
  scroll: { paddingBottom: 60 },
  sectionLabel: { fontSize: 12, fontWeight: '900', color: '#BAE6FD', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 15 },
  catScroll: { paddingLeft: 20, marginBottom: 30 },
  catCard: { backgroundColor: 'rgba(255,255,255,0.03)', width: 140, padding: 15, borderRadius: 20, marginRight: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  iconCircle: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  catTitle: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  catDesc: { color: '#94A3B8', fontSize: 10, marginTop: 4 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  resultCount: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  docCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, marginHorizontal: 20, marginBottom: 15 },
  cardTop: { flexDirection: 'row', gap: 15 },
  imageContainer: { position: 'relative' },
  docImage: { width: 65, height: 65, borderRadius: 18 },
  placeholderImg: { backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  onlineBadge: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF' },
  docMainInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  docSpecialty: { fontSize: 12, color: '#64748B' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  subOfferBox: { 
    marginTop: 15, 
    padding: 15, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 18, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  subLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  subPrice: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginTop: 2 },
  subPeriod: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  subscribeBtn: { backgroundColor: '#0F172A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  subscribeText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94A3B8', fontSize: 14, marginTop: 10 }
});

export default HomeCareScreen;