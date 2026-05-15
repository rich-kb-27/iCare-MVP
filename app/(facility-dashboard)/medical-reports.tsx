import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from "../../lib/supabase";
import { StatusBar } from "expo-status-bar";

export default function FinalMedicalReportScreen() {
  const [step, setStep] = useState(1); 
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data State
  const [patients, setPatients] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [facilityName, setFacilityName] = useState("Medical Facility");
  
  // Form State
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [doctorName, setDoctorName] = useState("");
  const [reportContent, setReportContent] = useState("");

  useEffect(() => {
    fetchInitialData();
    fetchHistory();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();
      
      if (profile) setFacilityName(profile.full_name);

      const { data: checkIns, error } = await supabase
        .from('check_ins')
        .select(`
          id,
          created_at,
          reason_for_visit,
          patient_id,
          profiles!check_ins_patient_id_fkey (id, full_name, avatar_url)
        `)
        .eq('facility_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(checkIns || []);
    } catch (err) {
      Alert.alert("System Error", "Could not load data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('medical_reports')
        .select(`
          id,
          created_at,
          report_content,
          diagnosis,
          notes,
          profiles:patient_id (full_name, avatar_url)
        `)
        .eq('facility_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  const finalizeAndSend = async () => {
    if (!doctorName || !reportContent) {
      Alert.alert("Wait", "Please ensure the doctor's name and report are filled.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: reportData, error: reportError } = await supabase
        .from('medical_reports')
        .insert([{
          check_in_id: selectedPatient.id,
          patient_id: selectedPatient.patient_id,
          facility_id: user?.id,
          file_name: `REPORT_${Date.now()}.txt`,
          file_url: "internal://digital_report",
          diagnosis: "Clinical Assessment", 
          report_content: reportContent,
          status: 'sent',
          is_signed: true,
          notes: `Attending Physician: ${doctorName}`,
          report_type: 'Digital Report'
        }])
        .select().single();

      if (reportError) throw reportError;

      await supabase.from('notifications').insert([{
        user_id: selectedPatient.patient_id,
        title: "New Medical Report",
        body: `${facilityName} has released your medical results.`,
        type: "medical_report",
        is_read: false,
        status: "active"
      }]);

      Alert.alert("Success", "Report dispatched and patient notified!");
      setStep(1); 
      setDoctorName("");
      setReportContent("");
      fetchInitialData(); 
      fetchHistory(); // Refresh history
    } catch (err: any) {
      Alert.alert("Database Error", err.message || "Failed to complete process.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderHistoryItem = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.glassCard, { borderColor: 'rgba(16, 185, 129, 0.2)' }]}
      onPress={() => {
        // You could add a view-only preview mode here
        Alert.alert("Report Archive", item.report_content);
      }}
    >
      <View style={styles.patientInfo}>
        <MaterialCommunityIcons name="file-check" size={24} color="#10B981" style={{ marginRight: 12 }} />
        <View>
          <Text style={styles.patientNameText}>{item.profiles?.full_name}</Text>
          <Text style={styles.timeLabel}>Sent: {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      <Ionicons name="eye-outline" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Medical Center</Text>
            {step === 1 && (
              <View style={styles.tabBar}>
                <TouchableOpacity 
                  onPress={() => setViewMode('active')} 
                  style={[styles.tab, viewMode === 'active' && styles.activeTab]}
                >
                  <Text style={[styles.tabText, viewMode === 'active' && styles.activeTabText]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setViewMode('history')} 
                  style={[styles.tab, viewMode === 'history' && styles.activeTab]}
                >
                  <Text style={[styles.tabText, viewMode === 'history' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
              </View>
            )}
        </View>

        {step === 1 && (
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <FlatList
              data={viewMode === 'active' ? patients : history}
              keyExtractor={(item) => item.id}
              renderItem={viewMode === 'active' ? ({item}) => (
                <TouchableOpacity style={styles.glassCard} onPress={() => { setSelectedPatient(item); setStep(2); }}>
                  <View style={styles.patientInfo}>
                    {item.profiles?.avatar_url ? (
                      <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarPlaceholder}><Text style={styles.avatarTxt}>{item.profiles?.full_name[0]}</Text></View>
                    )}
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.patientNameText}>{item.profiles?.full_name}</Text>
                      <Text style={styles.timeLabel}>Reason: {item.reason_for_visit}</Text>
                    </View>
                  </View>
                  <Ionicons name="create-outline" size={20} color="#0EA5E9" />
                </TouchableOpacity>
              ) : renderHistoryItem}
              ListEmptyComponent={loading ? <ActivityIndicator color="#0EA5E9" /> : <Text style={styles.emptyText}>No records found.</Text>}
            />
          </View>
        )}

        {step === 2 && (
          <ScrollView style={{ paddingHorizontal: 20 }}>
             <TouchableOpacity onPress={() => setStep(1)} style={{ marginBottom: 10 }}>
                <Text style={{ color: '#0EA5E9' }}>← Back to patients</Text>
             </TouchableOpacity>
            <Text style={styles.label}>Doctor Name</Text>
            <TextInput style={styles.input} placeholder="Dr. Name..." placeholderTextColor="#94A3B8" value={doctorName} onChangeText={setDoctorName} />
            <Text style={styles.label}>Medical Findings</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Write results here..." multiline placeholderTextColor="#94A3B8" value={reportContent} onChangeText={setReportContent} />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(3)}>
                <Text style={styles.primaryBtnText}>PREVIEW REPORT</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {step === 3 && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
             {/* Report Sheet UI remains same as your previous working version */}
             <View style={styles.reportSheet}>
                <View style={styles.reportHeader}>
                    <View>
                        <Text style={styles.brandName}>iCare <Text style={{color: '#0EA5E9'}}>Health</Text></Text>
                        <Text style={styles.facilityType}>{facilityName}</Text>
                    </View>
                    <MaterialCommunityIcons name="check-decagram" size={35} color="#0EA5E9" />
                </View>
                <View style={styles.hr} />
                <View style={styles.metaRow}>
                    <View><Text style={styles.metaLabel}>PATIENT</Text><Text style={styles.metaValue}>{selectedPatient?.profiles.full_name}</Text></View>
                    <View style={{ alignItems: 'flex-end' }}><Text style={styles.metaLabel}>DATE</Text><Text style={styles.metaValue}>{new Date().toLocaleDateString()}</Text></View>
                </View>
                <View style={styles.contentBox}>
                    <Text style={styles.reportTitle}>REPORT SUMMARY</Text>
                    <Text style={styles.reportText}>{reportContent}</Text>
                </View>
                <View style={styles.signatureArea}>
                    <View style={styles.sigLine} />
                    <Text style={styles.sigTitle}>Authorized by {doctorName}</Text>
                </View>
             </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: '#10B981' }]} 
              onPress={finalizeAndSend}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>DISPATCH & ARCHIVE</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(2)} style={{ alignSelf: 'center', marginTop: 15 }}>
                <Text style={{ color: '#94A3B8' }}>Back to edit</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  header: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginTop: 15, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#0EA5E9' },
  tabText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarImg: { width: 45, height: 45, borderRadius: 12 },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#FFF', fontWeight: '800' },
  patientNameText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  timeLabel: { color: '#94A3B8', fontSize: 11 },
  label: { color: '#7DD3FC', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 15, color: '#FFF', fontSize: 16 },
  textArea: { minHeight: 150, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: '#0EA5E9', height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 },
  primaryBtnText: { color: '#FFF', fontWeight: '900' },
  reportSheet: { backgroundColor: '#FFF', borderRadius: 4, padding: 20, minHeight: 500, elevation: 15 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  brandName: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  facilityType: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  hr: { height: 1.5, backgroundColor: '#F1F5F9', marginVertical: 15 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metaLabel: { fontSize: 8, color: '#94A3B8', fontWeight: '900' },
  metaValue: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  contentBox: { marginTop: 15 },
  reportTitle: { fontSize: 14, fontWeight: '800', color: '#0EA5E9', marginBottom: 5 },
  reportText: { fontSize: 13, color: '#334155', lineHeight: 20 },
  signatureArea: { marginTop: 50, alignItems: 'center' },
  sigLine: { width: '60%', height: 1, backgroundColor: '#CBD5E1' },
  sigTitle: { fontSize: 11, fontWeight: '800', color: '#1E293B', marginTop: 5 },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 50 }
});