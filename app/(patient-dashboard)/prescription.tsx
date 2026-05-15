import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase'; 
import { useAuth } from '../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

const PrescriptionScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'Active' | 'Expired'>('Active');

  const fetchPrescriptions = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      // JOIN logic: We pull doctor info AND patient info from the profiles table
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctor:profiles!doctor_id (full_name, avatar_url),
          patient:profiles!patient_id (full_name)
        `) 
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = data?.map((item) => {
        // Expiry logic: Check if current date is past expiry_date
        const isExpired = new Date(item.expiry_date) < new Date();
        return {
          ...item,
          computedStatus: isExpired ? 'Expired' : item.status
        };
      });

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

  const PrescriptionCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => router.push({
        pathname: "/view-prescription",
        params: { 
          id: item.id,
          date: item.date,
          medication: item.medication,
          dosage: item.dosage,
          duration: item.duration,
          instructions: item.instructions,
          doctor: item.doctor?.full_name,
          patientName: item.patient?.full_name, // Now correctly passing the patient name
          ref: item.reference_id
        }
      })}
      style={[styles.card, item.computedStatus === 'Expired' && { opacity: 0.6 }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.doctorInfo}>
          <Image 
            source={{ uri: item.doctor?.avatar_url || 'https://via.placeholder.com/150' }} 
            style={styles.docAvatar} 
          />
          <View>
            <Text style={styles.docName}>Freelancer. {item.doctor?.full_name}</Text>
            <Text style={styles.refId}>Ref: {item.reference_id}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, item.computedStatus === 'Expired' && styles.expiredBadge]}>
          <Text style={[styles.statusText, item.computedStatus === 'Expired' && styles.expiredText]}>
            {item.computedStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.medicationRow}>
        <View style={styles.pillIcon}>
          <MaterialCommunityIcons name="pill" size={22} color="#0EA5E9" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{item.medication}</Text>
          <Text style={styles.dosageInfo}>{item.dosage} • {item.duration} Days</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#475569" />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
          <Text style={styles.footerText}>Issued: {item.date}</Text>
        </View>
        {item.computedStatus === 'Active' && (
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={14} color="#F59E0B" />
            <Text style={[styles.footerText, { color: '#F59E0B' }]}>Valid for 72 hours</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Digital Scripts</Text>
            <View style={{ width: 45 }} />
          </View>

          <View style={styles.filterContainer}>
            {(['Active', 'Expired'] as const).map((tab) => (
              <TouchableOpacity 
                key={tab}
                onPress={() => setActiveFilter(tab)}
                style={[styles.filterTab, activeFilter === tab && styles.activeTab]}
              >
                <Text style={[styles.filterTabText, activeFilter === tab && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView 
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={fetchPrescriptions} 
                tintColor="#0EA5E9" 
              />
            }
          >
            {loading && !refreshing ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#0EA5E9" />
              </View>
            ) : (
              prescriptions
                .filter(p => p.computedStatus === activeFilter)
                .map((item) => <PrescriptionCard key={item.id} item={item} />)
            )}
            
            {!loading && prescriptions.filter(p => p.computedStatus === activeFilter).length === 0 && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#1E293B" />
                <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} scripts found</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 15 },
  filterContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 20, borderRadius: 20, padding: 6, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
  activeTab: { backgroundColor: '#0EA5E9' },
  filterTabText: { color: '#64748B', fontWeight: '800', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  doctorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docAvatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#1E293B' },
  docName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  refId: { color: '#0EA5E9', fontSize: 11, fontWeight: '800', marginTop: 2 },
  statusBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { color: '#10B981', fontSize: 10, fontWeight: '900' },
  expiredBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  expiredText: { color: '#EF4444' },
  medicationRow: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: '#0F172A', padding: 15, borderRadius: 20 },
  pillIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center' },
  medName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dosageInfo: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingHorizontal: 5 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  loader: { marginTop: 100, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#475569', fontSize: 15, fontWeight: '600', marginTop: 15 }
});

export default PrescriptionScreen;