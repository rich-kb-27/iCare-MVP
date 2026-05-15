import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Share, 
  ActivityIndicator,
  FlatList,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from "../../lib/supabase"; // Path to your client
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const LabReportsScreen = () => {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealReports();
  }, []);

  const fetchRealReports = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('medical_reports')
        .select(`
          id,
          created_at,
          diagnosis,
          report_content,
          report_type,
          status,
          profiles:facility_id (full_name)
        `)
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onShare = async (report: any) => {
    try {
      await Share.share({
        message: `iCare Medical Report\nType: ${report.report_type}\nDiagnosis: ${report.diagnosis}\nFacility: ${report.profiles?.full_name}`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const ReportCard = ({ item }: { item: any }) => (
    <View style={styles.glassCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons 
            name={item.report_type === 'Emergency' ? "alert-octagon" : "file-document-outline"} 
            size={22} 
            color="#FFF" 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.testName}>{item.report_type || "General Report"}</Text>
          <Text style={styles.labName}>{item.profiles?.full_name}</Text>
        </View>
        <TouchableOpacity onPress={() => onShare(item)} style={styles.miniActionBtn}>
          <Ionicons name="share-social" size={18} color="#BAE6FD" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DATE</Text>
          <Text style={styles.statValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>STATUS</Text>
          <View style={styles.statusBadge}>
             <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.detailBtn}
        onPress={() => router.push({
            pathname: "/report-detail", // Create this screen next to show report_content
            params: { reportId: item.id }
        })}
      >
        <Text style={styles.detailBtnText}>Open Detailed Findings</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#1E293B", "#0EA5E9"]} style={styles.container}>
        
        {/* TOP NAV */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical Records</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchRealReports}>
            <Ionicons name="refresh" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* HIGH-END SUMMARY BOX */}
          <View style={styles.summaryBox}>
            <View>
                <Text style={styles.summaryTitle}>Health Vault</Text>
                <Text style={styles.summarySub}>{reports.length} Verified Reports</Text>
            </View>
            <MaterialCommunityIcons name="shield-lock-outline" size={40} color="rgba(255,255,255,0.2)" />
          </View>

          <Text style={styles.sectionLabel}>Timeline</Text>
          
          {loading ? (
            <ActivityIndicator color="#0EA5E9" size="large" style={{ marginTop: 40 }} />
          ) : (
            reports.map((report) => (
              <ReportCard key={report.id} item={report} />
            ))
          )}

          {!loading && reports.length === 0 && (
            <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={60} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>No reports found in your history.</Text>
            </View>
          )}

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  backBtn: { padding: 8 },
  refreshBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  summaryBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    padding: 25, 
    borderRadius: 30, 
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 10
  },
  summaryTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  summarySub: { color: '#BAE6FD', fontSize: 14, fontWeight: '600', marginTop: 4 },

  sectionLabel: { fontSize: 12, fontWeight: '900', color: '#BAE6FD', marginBottom: 15, marginTop: 30, letterSpacing: 2, textTransform: 'uppercase' },

  // HIGH END GLASS CARD
  glassCard: { 
    backgroundColor: 'rgba(255, 255, 255, 0.08)', 
    borderRadius: 28, 
    padding: 20, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center', shadowColor: '#0EA5E9', shadowOpacity: 0.5, shadowRadius: 10 },
  testName: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  labName: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  miniActionBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10 },

  statsRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
  statBox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 18 },
  statLabel: { fontSize: 9, fontWeight: '900', color: '#64748B', letterSpacing: 1 },
  statValue: { fontSize: 13, fontWeight: '700', color: '#FFF', marginTop: 4 },
  
  statusBadge: { alignSelf: 'flex-start', marginTop: 4 },
  statusText: { color: '#10B981', fontSize: 11, fontWeight: '900' },

  detailBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20, 
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 15
  },
  detailBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: 'rgba(255,255,255,0.3)', marginTop: 15, fontWeight: '600' }
});

export default LabReportsScreen;