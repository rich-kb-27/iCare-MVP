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
  const [activeFilter, setActiveFilter] = useState<'Active' | 'Expired'>('Active');

  // Helper: Rips numbers out of text and does the math
  const checkExpiry = (dateStr: string, durationStr: string) => {
    if (!dateStr || !durationStr) return false;
    
    try {
      const issueDate = new Date(dateStr);
      if (isNaN(issueDate.getTime())) return false;

      // Extract only digits from the text (e.g., "7 days" -> 7)
      const durationMatch = durationStr.match(/\d+/);
      const durationDays = durationMatch ? parseInt(durationMatch[0]) : 0;
      
      if (durationDays === 0) return false;

      const expiryDate = new Date(issueDate);
      expiryDate.setDate(issueDate.getDate() + durationDays);
      
      // End of day logic
      expiryDate.setHours(23, 59, 59, 999);
      
      const isPast = new Date() > expiryDate;

      // DEBUG: Keep an eye on your console to see the "Text to Number" conversion
      console.log(`Med: ${dateStr} | Duration Text: "${durationStr}" -> ${durationDays} days | Expired: ${isPast}`);

      return isPast;
    } catch (e) {
      console.error("Expiry calculation failed:", e);
      return false;
    }
  };

  const updatePrescriptionStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('prescriptions').update({ status: newStatus }).eq('id', id);
    } catch (e) {
      console.error("DB Update Error:", e);
    }
  };

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
        .order('date', { ascending: false });

      if (error) throw error;
      
      const formattedData: Prescription[] = await Promise.all((data as any[])?.map(async (item) => {
        const name = item.doctor?.full_name || "Medical Specialist";
        const startDate = item.date; 
        
        const isExpired = checkExpiry(startDate, item.duration);
        let currentStatus = item.status || 'Active';

        // Auto-flip status if text duration math says it's time
        if (isExpired && currentStatus === 'Active') {
            await updatePrescriptionStatus(item.id, 'Expired');
            currentStatus = 'Expired';
        }

        return {
          id: item.id,
          medication: item.medication,
          dosage: item.dosage,
          date: startDate,
          duration: item.duration,
          status: currentStatus,
          instructions: item.instructions,
          doctor_name: name
        };
      }));

      setPrescriptions(formattedData || []);
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
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

  const filteredData = prescriptions.filter(p => p.status === activeFilter);

  const PrescriptionCard = ({ item }: { item: Prescription }) => (
    <View style={[styles.card, item.status === 'Expired' && { opacity: 0.8 }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.medIconBox, item.status === 'Expired' && { backgroundColor: '#F1F5F9' }]}>
          <MaterialCommunityIcons 
            name="pill" 
            size={26} 
            color={item.status === 'Active' ? "#0EA5E9" : "#94A3B8"} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{item.medication}</Text>
          <Text style={styles.dosageText}>{item.dosage}</Text>
        </View>
        
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'Active' ? '#DCFCE7' : '#FFE4E6' }
        ]}>
          <Text style={[
            styles.statusText, 
            { color: item.status === 'Active' ? '#166534' : '#E11D48' }
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
          <Text style={styles.infoLabel}>Prescribed On</Text>
          <Text style={styles.infoValue}>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</Text>
        </View>
      </View>

      {item.status === 'Active' ? (
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.downloadBtn}>
              <Ionicons name="download-outline" size={18} color="#0EA5E9" />
              <Text style={styles.downloadText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pharmacyBtn} onPress={() => router.push('/search-facilities')}>
              <MaterialCommunityIcons name="store-outline" size={18} color="#FFF" />
              <Text style={styles.pharmacyText}>Pharmacy</Text>
            </TouchableOpacity>
          </View>
      ) : (
          <TouchableOpacity style={styles.renewActionBtn} onPress={() => router.push('/checkup/avaliable-doctors')}>
             <Text style={styles.renewActionText}>Consult Doctor for Renewal</Text>
             <Ionicons name="arrow-forward" size={16} color="#64748B" />
          </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.container}>
        
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescriptions</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.filterContainer}>
            {(['Active', 'Expired'] as const).map((tab) => (
                <TouchableOpacity 
                    key={tab}
                    onPress={() => setActiveFilter(tab)}
                    style={[styles.filterTab, activeFilter === tab && styles.activeTab]}
                >
                    <Text style={[styles.filterTabText, activeFilter === tab && styles.activeTabText]}>
                        {tab} ({prescriptions.filter(p => p.status === tab).length})
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#FFF" style={{ marginTop: 50 }} />
          ) : filteredData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} prescriptions.</Text>
            </View>
          ) : (
            filteredData.map((item) => (
              <PrescriptionCard key={item.id} item={item} />
            ))
          )}

          <TouchableOpacity style={styles.requestBtn}>
            <Text style={styles.requestText}>Request Medical Record Export</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  backBtn: { width: 40 },
  filterContainer: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    marginHorizontal: 20, 
    borderRadius: 15, 
    padding: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#0EA5E9' },
  filterTabText: { color: '#94A3B8', fontWeight: '800', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medIconBox: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  medName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  dosageText: { fontSize: 13, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingVertical: 15, borderTopWidth: 1, borderColor: '#F1F5F9' },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  downloadBtn: { flex: 0.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E0F2FE' },
  downloadText: { color: '#0EA5E9', fontWeight: '700', fontSize: 14 },
  pharmacyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: '#0F172A' },
  pharmacyText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  renewActionBtn: { marginTop: 15, padding: 15, backgroundColor: '#F8FAFC', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  renewActionText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  requestBtn: { marginTop: 10, alignItems: 'center', padding: 15 },
  requestText: { color: '#BAE6FD', fontWeight: '700', textDecorationLine: 'underline' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#BAE6FD', marginTop: 10, fontSize: 14 }
});

export default PrescriptionScreen;