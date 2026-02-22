import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRESCRIPTIONS = [
  {
    id: '1',
    medication: 'Amoxicillin 500mg',
    dosage: '1 Tablet, 3x daily',
    doctor: 'Dr. Sarah Phiri',
    date: 'Feb 20, 2026',
    duration: '7 Days',
    status: 'Active',
  },
  {
    id: '2',
    medication: 'Ibuprofen 400mg',
    dosage: '1 Tablet, as needed',
    doctor: 'Dr. James Banda',
    date: 'Jan 15, 2026',
    duration: '14 Days',
    status: 'Expired',
  },
];

const PrescriptionScreen = () => {
  const router = useRouter();

  const PrescriptionCard = ({ item }: { item: typeof PRESCRIPTIONS[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.medIconBox}>
          <MaterialCommunityIcons name="pill" size={26} color="#0EA5E9" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{item.medication}</Text>
          <Text style={styles.dosageText}>{item.dosage}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Active' ? '#DCFCE7' : '#F1F5F9' }]}>
          <Text style={[styles.statusText, { color: item.status === 'Active' ? '#166534' : '#64748B' }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Doctor</Text>
          <Text style={styles.infoValue}>{item.doctor}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Date Issued</Text>
          <Text style={styles.infoValue}>{item.date}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Duration</Text>
          <Text style={styles.infoValue}>{item.duration}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.downloadBtn}>
          <Ionicons name="download-outline" size={18} color="#0EA5E9" />
          <Text style={styles.downloadText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pharmacyBtn}>
          <MaterialCommunityIcons name="store-outline" size={18} color="#FFF" />
          <Text style={styles.pharmacyText}>Find Pharmacy</Text>
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
          <Text style={styles.headerTitle}>Prescriptions</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          <View style={styles.summaryBox}>
            <View>
              <Text style={styles.summaryTitle}>Active Medications</Text>
              <Text style={styles.summarySub}>You have 1 current prescription</Text>
            </View>
            <MaterialCommunityIcons name="medical-bag" size={40} color="rgba(255,255,255,0.3)" />
          </View>

          <Text style={styles.sectionLabel}>Recent Prescriptions</Text>
          
          {PRESCRIPTIONS.map((item) => (
            <PrescriptionCard key={item.id} item={item} />
          ))}

          <TouchableOpacity style={styles.requestBtn}>
            <Text style={styles.requestText}>Request Refill</Text>
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  backBtn: { width: 40 },
  
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },

  summaryBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', 
    padding: 20, 
    borderRadius: 24, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  summaryTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  summarySub: { fontSize: 13, color: '#BAE6FD', marginTop: 2 },

  sectionLabel: { fontSize: 12, fontWeight: '900', color: '#BAE6FD', marginBottom: 15, marginTop: 25, letterSpacing: 1.5, textTransform: 'uppercase' },

  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medIconBox: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  medName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  dosageText: { fontSize: 13, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },

  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 4 },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  downloadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E0F2FE' },
  downloadText: { color: '#0EA5E9', fontWeight: '700', fontSize: 14 },
  pharmacyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: '#0F172A' },
  pharmacyText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  requestBtn: { marginTop: 10, alignItems: 'center', padding: 15 },
  requestText: { color: '#FFF', fontWeight: '700', textDecorationLine: 'underline' }
});

export default PrescriptionScreen;