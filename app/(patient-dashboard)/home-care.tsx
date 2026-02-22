import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FAMILY_DOCTORS = [
  {
    id: '1',
    name: 'Dr. Chipo Moyo',
    specialty: 'Family Physician',
    experience: '12 years',
    rating: '4.9',
    reviews: '124',
    image: 'https://i.pravatar.cc/150?u=chipo',
    available: true,
  },
  {
    id: '2',
    name: 'Dr. Kelvin Zimba',
    specialty: 'Pediatrician (Kids Specialist)',
    experience: '8 years',
    rating: '4.8',
    reviews: '98',
    image: 'https://i.pravatar.cc/150?u=kelvin',
    available: true,
  },
  {
    id: '3',
    name: 'Dr. Mwansa K.',
    specialty: 'Geriatrician (Senior Care)',
    experience: '15 years',
    rating: '5.0',
    reviews: '210',
    image: 'https://i.pravatar.cc/150?u=mwansa',
    available: false,
  },
];

const HomeCareScreen = () => {
  const router = useRouter();

  const DoctorCard = ({ item }: { item: typeof FAMILY_DOCTORS[0] }) => (
    <View style={styles.docCard}>
      <View style={styles.cardTop}>
        <Image source={{ uri: item.image }} style={styles.docImage} />
        <View style={styles.docMainInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.docName}>{item.name}</Text>
            <MaterialCommunityIcons name="check-decagram" size={18} color="#0EA5E9" />
          </View>
          <Text style={styles.docSpecialty}>{item.specialty}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating} ({item.reviews} reviews)</Text>
            <Text style={styles.expText}>• {item.experience} exp</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.chatBtn} onPress={() => router.push("/(patient-dashboard)/chat")}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#0EA5E9" />
          <Text style={styles.chatBtnText}>Consult</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.bookBtn, !item.available && styles.disabledBtn]}
          disabled={!item.available}
        >
          <Text style={styles.bookBtnText}>{item.available ? "Book Home Visit" : "Fully Booked"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Family Home-Care</Text>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* BANNER */}
          <View style={styles.promoBanner}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Personalized Care</Text>
              <Text style={styles.promoSub}>Access Zambia's top specialists for your entire family's needs.</Text>
            </View>
            <MaterialCommunityIcons name="home-heart" size={50} color="rgba(255,255,255,0.4)" />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Top Recommended Doctors</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          
          {FAMILY_DOCTORS.map((doc) => (
            <DoctorCard key={doc.id} item={doc} />
          ))}

          {/* EMERGENCY CTA */}
          <TouchableOpacity style={styles.emergencyBox}>
            <LinearGradient 
              colors={["#EF4444", "#991B1B"]} 
              start={{x: 0, y: 0}} 
              end={{x: 1, y: 0}} 
              style={styles.emergencyGradient}
            >
              <Ionicons name="notifications-outline" size={24} color="#FFF" />
              <View>
                <Text style={styles.emergencyTitle}>Emergency Dispatch</Text>
                <Text style={styles.emergencySub}>Request an immediate home visit now</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  backBtn: { width: 40 },
  searchBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },

  promoBanner: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    padding: 22, 
    borderRadius: 28, 
    marginTop: 10, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  promoContent: { flex: 1 },
  promoTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  promoSub: { fontSize: 13, color: '#BAE6FD', marginTop: 4, lineHeight: 18 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 15 },
  sectionLabel: { fontSize: 12, fontWeight: '900', color: '#BAE6FD', letterSpacing: 1.2, textTransform: 'uppercase' },
  seeAll: { color: '#0EA5E9', fontSize: 13, fontWeight: '700' },

  docCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, marginBottom: 15, elevation: 4 },
  cardTop: { flexDirection: 'row', gap: 15 },
  docImage: { width: 70, height: 70, borderRadius: 20 },
  docMainInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  docSpecialty: { fontSize: 13, color: '#64748B', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  expText: { fontSize: 12, color: '#94A3B8' },

  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },

  cardActions: { flexDirection: 'row', gap: 10 },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 15, borderWidth: 1, borderColor: '#E0F2FE' },
  chatBtnText: { color: '#0EA5E9', fontWeight: '800', fontSize: 14 },
  bookBtn: { flex: 2, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderRadius: 15, paddingVertical: 12 },
  bookBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  disabledBtn: { backgroundColor: '#CBD5E1' },

  emergencyBox: { marginTop: 20, borderRadius: 24, overflow: 'hidden' },
  emergencyGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  emergencyTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  emergencySub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }
});

export default HomeCareScreen;