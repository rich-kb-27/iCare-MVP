import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from "../../lib/supabase";
import { StatusBar } from 'expo-status-bar';

export default function ReportDetailScreen() {
  const router = useRouter();
  const { reportId } = useLocalSearchParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [reportId]);

  const fetchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_reports')
        .select(`
          *,
          facility:facility_id (full_name),
          patient:patient_id (full_name)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const createPDF = async () => {
    const htmlContent = `
      <html>
        <body style="font-family: Helvetica; padding: 40px; color: #333;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 style="color: #0F172A; margin: 0;">iCare Health</h1>
              <p style="color: #64748B; font-weight: bold;">${report?.facility?.full_name}</p>
            </div>
            <div style="color: #0EA5E9; font-size: 24px;">✔</div>
          </div>
          <hr style="border: 0.5px solid #E2E8F0; margin: 20px 0;" />
          <div style="display: flex; justify-content: space-between;">
            <div>
              <p style="font-size: 10px; color: #94A3B8; margin: 0;">PATIENT NAME</p>
              <p style="font-weight: bold;">${report?.patient?.full_name}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 10px; color: #94A3B8; margin: 0;">DATE</p>
              <p style="font-weight: bold;">${new Date(report?.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div style="margin-top: 30px;">
            <h3 style="color: #0EA5E9; font-size: 12px; letter-spacing: 1px;">CLINICAL FINDINGS</h3>
            <p style="font-weight: bold; font-size: 18px;">${report?.diagnosis}</p>
            <p style="line-height: 1.6; color: #334155;">${report?.report_content}</p>
          </div>
          <div style="margin-top: 100px; text-align: center;">
            <div style="width: 200px; border-top: 1px solid #CBD5E1; margin: 0 auto;"></div>
            <p style="font-weight: bold;">${report?.notes || "Digitally Signed"}</p>
            <p style="font-size: 10px; color: #94A3B8;">Verified Electronic Health Record</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "Could not generate PDF");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
        
        {/* TOP NAV */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical Report</Text>
          <TouchableOpacity onPress={createPDF} style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.reportSheet}>
            
            {/* BRANDING */}
            <View style={styles.reportHeader}>
              <View>
                <Text style={styles.brandName}>iCare <Text style={{color: '#0EA5E9'}}>Health</Text></Text>
                <Text style={styles.facilityType}>{report?.facility?.full_name}</Text>
              </View>
              <MaterialCommunityIcons name="check-decagram" size={40} color="#0EA5E9" />
            </View>

            <View style={styles.hr} />

            {/* PATIENT INFO BOX */}
            <View style={styles.patientBox}>
               <Text style={styles.metaLabel}>PATIENT NAME</Text>
               <Text style={styles.patientName}>{report?.patient?.full_name || "Unknown Patient"}</Text>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>DATE</Text>
                <Text style={styles.metaValue}>{new Date(report?.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.metaBox, { alignItems: 'flex-end' }]}>
                <Text style={styles.metaLabel}>REF ID</Text>
                <Text style={styles.metaValue}>#{report?.id.slice(0, 8).toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.hr} />

            {/* FINDINGS */}
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeading}>CLINICAL FINDINGS</Text>
              <Text style={styles.diagnosisTitle}>{report?.diagnosis}</Text>
              <Text style={styles.reportBodyText}>{report?.report_content}</Text>
            </View>

            {/* FOOTER */}
            <View style={styles.signatureSection}>
              <View style={styles.sigLine} />
              <Text style={styles.sigText}>{report?.notes || "Digitally Authorized"}</Text>
              <Text style={styles.verifiedSub}>Verified Electronic Record</Text>
            </View>

          </View>

          <TouchableOpacity style={styles.downloadAction} onPress={createPDF}>
            <Ionicons name="cloud-download" size={22} color="#0EA5E9" />
            <Text style={styles.downloadText}>Save as Official PDF</Text>
          </TouchableOpacity>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  iconBtn: { width: 45, height: 45, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  reportSheet: { backgroundColor: '#FFF', borderRadius: 8, padding: 25, elevation: 10, minHeight: 600 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandName: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  facilityType: { fontSize: 12, color: '#64748B', fontWeight: '700', marginTop: 2 },
  hr: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
  patientBox: { marginBottom: 15 },
  patientName: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  metaBox: { flex: 1 },
  metaLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  metaValue: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 3 },
  contentSection: { marginTop: 10 },
  sectionHeading: { fontSize: 11, fontWeight: '900', color: '#0EA5E9', letterSpacing: 1.5, marginBottom: 15 },
  diagnosisTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  reportBodyText: { fontSize: 14, lineHeight: 22, color: '#334155' },
  signatureSection: { marginTop: 60, alignItems: 'center' },
  sigLine: { width: '70%', height: 1, backgroundColor: '#CBD5E1', marginBottom: 8 },
  sigText: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  verifiedSub: { fontSize: 10, color: '#94A3B8', marginTop: 2, fontStyle: 'italic' },
  downloadAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, gap: 8 },
  downloadText: { color: '#0EA5E9', fontWeight: '700', fontSize: 15 }
});