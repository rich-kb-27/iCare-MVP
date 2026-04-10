import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const LAB_REPORTS = [
  {
    id: '1',
    testName: 'Full Blood Count',
    labName: 'Main City Laboratory',
    date: 'Feb 18, 2026',
    status: 'Normal',
    result: 'Stable',
  },
  {
    id: '2',
    testName: 'Lipid Profile (Cholesterol)',
    labName: 'Kadobi Medical Center',
    date: 'Jan 10, 2026',
    status: 'Critical',
    result: 'High',
  },
  {
    id: '3',
    testName: 'COVID-19 PCR Test',
    labName: 'Airport Health Clinic',
    date: 'Dec 05, 2025',
    status: 'Normal',
    result: 'Negative',
  },
];

const LabReportsScreen = () => {
  const router = useRouter();

  const onShare = async (reportName: string) => {
    try {
      await Share.share({
        message: `Sharing Lab Report: ${reportName} from iCare App.`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const ReportCard = ({ item }: { item: typeof LAB_REPORTS[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={item.status === 'Critical' ? "alert-decagram" : "test-tube"} 
            size={24} 
            color={item.status === 'Critical' ? "#EF4444" : "#0EA5E9"} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.testName}>{item.testName}</Text>
          <Text style={styles.labName}>{item.labName}</Text>
        </View>
        <TouchableOpacity onPress={() => onShare(item.testName)}>
          <Ionicons name="share-social-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View style={styles.reportDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>DATE</Text>
          <Text style={styles.detailValue}>{item.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>RESULT</Text>
          <Text style={[styles.detailValue, { color: item.status === 'Critical' ? '#EF4444' : '#0F172A' }]}>
            {item.result}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewBtn}>
        <Text style={styles.viewBtnText}>View Detailed Report</Text>
        <Ionicons name="chevron-forward" size={16} color="#0EA5E9" />
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Lab Reports</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* INSIGHT BOX */}
          <View style={styles.insightBox}>
            <Ionicons name="information-circle" size={24} color="#BAE6FD" />
            <Text style={styles.insightText}>
              All reports are verified by licensed medical professionals from the KadobiTech network.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Recent Results</Text>
          
          {LAB_REPORTS.map((report) => (
            <ReportCard key={report.id} item={report} />
          ))}

          <View style={styles.footerInfo}>
            <MaterialCommunityIcons name="shield-check" size={16} color="rgba(255,255,255,0.4)" />
            <Text style={styles.footerInfoText}>Encrypted & Secure Medical Data</Text>
          </View>

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
  filterBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },

  insightBox: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(14, 165, 233, 0.15)', 
    padding: 16, 
    borderRadius: 20, 
    marginTop: 10, 
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)'
  },
  insightText: { color: '#E0F2FE', fontSize: 13, flex: 1, lineHeight: 18, fontWeight: '500' },

  sectionLabel: { fontSize: 12, fontWeight: '900', color: '#BAE6FD', marginBottom: 15, marginTop: 25, letterSpacing: 1.5, textTransform: 'uppercase' },

  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconContainer: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  testName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  labName: { fontSize: 13, color: '#64748B', marginTop: 2 },

  reportDetails: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 15, marginTop: 15 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 4 },

  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 5 },
  viewBtnText: { color: '#0EA5E9', fontWeight: '700', fontSize: 14 },

  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 6 },
  footerInfoText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' }
});

export default LabReportsScreen;