import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase'; 
import { useAuth } from '../../context/AuthContext';

// Defining an interface to stop TypeScript from complaining about "never"
interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  date: string;
  duration: string;
  status: string;
  instructions: string | null;
  doctor_name: string;
}

const PrescriptionScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          id,
          medication,
          dosage,
          date,
          duration,
          status,
          instructions,
          doctor:profiles!doctor_id (
            full_name
          )
        `) 
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Formatting the data to handle the joined doctor name safely
      const formattedData: Prescription[] = (data as any[])?.map(item => {
        let name = "Specialist";
        
        if (item.doctor) {
          // Check if doctor is an array or a single object
          name = Array.isArray(item.doctor) 
            ? item.doctor[0]?.full_name 
            : item.doctor?.full_name;
        }

        return {
          id: item.id,
          medication: item.medication,
          dosage: item.dosage,
          date: item.date || 'N/A',
          duration: item.duration,
          status: item.status || 'Active',
          instructions: item.instructions,
          doctor_name: name || "Medical Specialist"
        };
      });

      setPrescriptions(formattedData || []);
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
      Alert.alert("Sync Error", "Could not refresh your prescriptions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchPrescriptions();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrescriptions();
  };

  const PrescriptionCard = ({ item }: { item: Prescription }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.medIconBox}>
          <MaterialCommunityIcons name="pill" size={26} color="#0EA5E9" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{item.medication}</Text>
          <Text style={styles.dosageText}>{item.dosage}</Text>
        </View>
        
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'Active' ? '#DCFCE7' : '#F1F5F9' }
        ]}>
          <Text style={[
            styles.statusText, 
            { color: item.status === 'Active' ? '#166534' : '#64748B' }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Doctor</Text>
          <Text style={styles.infoValue}>Dr. {item.doctor_name}</Text>
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

      {item.instructions && (
        <View style={styles.instructionsBox}>
          <Ionicons name="information-circle-outline" size={16} color="#64748B" />
          <Text style={styles.instructionsText}>{item.instructions}</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.downloadBtn}>
          <Ionicons name="download-outline" size={18} color="#0EA5E9" />
          <Text style={styles.downloadText}>PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pharmacyBtn} onPress={() => router.push('/')}>
          <MaterialCommunityIcons name="store-outline" size={18} color="#FFF" />
          <Text style={styles.pharmacyText}>Pharmacy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescriptions</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
          }
        >
          
          <View style={styles.summaryBox}>
            <View>
              <Text style={styles.summaryTitle}>Active Medications</Text>
              <Text style={styles.summarySub}>
                You have {prescriptions.filter(p => p.status === 'Active').length} current meds
              </Text>
            </View>
            <MaterialCommunityIcons name="medical-bag" size={40} color="rgba(255,255,255,0.3)" />
          </View>

          <Text style={styles.sectionLabel}>Medical History</Text>
          
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#FFF" style={{ marginTop: 50 }} />
          ) : prescriptions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No prescriptions found.</Text>
            </View>
          ) : (
            prescriptions.map((item) => (
              <PrescriptionCard key={item.id} item={item} />
            ))
          )}

          <TouchableOpacity style={styles.requestBtn}>
            <Text style={styles.requestText}>Request Refill or Consultation</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 24, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
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
  instructionsBox: { flexDirection: 'row', gap: 8, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginTop: 15 },
  instructionsText: { flex: 1, fontSize: 12, color: '#64748B', fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  downloadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E0F2FE' },
  downloadText: { color: '#0EA5E9', fontWeight: '700', fontSize: 14 },
  pharmacyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: '#0F172A' },
  pharmacyText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  requestBtn: { marginTop: 10, alignItems: 'center', padding: 15 },
  requestText: { color: '#FFF', fontWeight: '700', textDecorationLine: 'underline' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#BAE6FD', marginTop: 10, fontSize: 14 }
});

export default PrescriptionScreen;