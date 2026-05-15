import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ViewPrescriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? dateValue : d.toLocaleDateString('en-GB');
  };

  const downloadPrescription = async () => {
    setIsGenerating(true);
    try {
      const htmlContent = `
        <html>
          <body style="font-family: 'Helvetica', sans-serif; padding: 40px; color: #1e293b;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px;">
              <div>
                <h1 style="margin: 0; color: #0f172a;">iCare <span style="color: #0ea5e9;">Health</span></h1>
                <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: bold; color: #64748b; letter-spacing: 1px;">DIGITAL PRESCRIPTION RECORD</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 10px; color: #94a3b8;">REFERENCE ID</p>
                <p style="margin: 2px 0 0 0; font-weight: bold;">#${params.ref || params.id?.toString().slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <div style="margin-top: 30px; display: flex; justify-content: space-between;">
              <div>
                <p style="margin: 0; font-size: 10px; color: #94a3b8;">PATIENT NAME</p>
                <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 16px;">${params.patientName || 'N/A'}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 10px; color: #94a3b8;">DATE ISSUED</p>
                <p style="margin: 5px 0 0 0; font-weight: bold;">${formatDate(params.date)}</p>
              </div>
            </div>

            <div style="margin-top: 40px;">
              <p style="margin: 0; font-size: 10px; color: #94a3b8; letter-spacing: 1px;">MEDICATION</p>
              <h2 style="margin: 5px 0 0 0; font-size: 28px; color: #0f172a;">${params.medication}</h2>
              <div style="display: inline-block; background: #e0f2fe; padding: 5px 12px; border-radius: 6px; margin-top: 10px;">
                <span style="color: #0369a1; font-weight: bold;">${params.dosage}</span>
              </div>
            </div>

            <div style="margin-top: 30px;">
              <p style="margin: 0; font-size: 10px; color: #94a3b8; letter-spacing: 1px;">DURATION</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #334155;">${params.duration} Days</p>
            </div>

            <div style="margin-top: 30px; background: #f8fafc; padding: 20px; border-left: 4px solid #0ea5e9; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; font-size: 10px; color: #94a3b8; font-weight: bold;">PHYSICIAN INSTRUCTIONS</p>
              <p style="margin: 0; font-style: italic; line-height: 1.5;">${params.instructions || 'Follow standard dosage instructions.'}</p>
            </div>

            <div style="margin-top: 80px; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">AUTHORIZING HEALTHCARE PROVIDER</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">Freelancer. ${params.doctor}</p>
              <div style="width: 200px; height: 1px; background: #e2e8f0; margin: 15px auto;"></div>
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">Digitally Signed via iCare Secure Gateway</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
        
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription Details</Text>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={downloadPrescription}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="download-outline" size={22} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.reportSheet}>
            <View style={styles.reportHeader}>
              <View>
                <Text style={styles.brandName}>iCare <Text style={{color: '#0EA5E9'}}>Health</Text></Text>
                <Text style={styles.docType}>DIGITAL PRESCRIPTION RECORD</Text>
              </View>
              <MaterialCommunityIcons name="check-decagram" size={35} color="#0EA5E9" />
            </View>

            <View style={styles.hr} />

            {/* Added Patient Name Row */}
            <View style={{ marginBottom: 25 }}>
               <Text style={styles.metaLabel}>PATIENT NAME</Text>
               <Text style={[styles.metaValue, { fontSize: 18 }]}>{params.patientName || 'N/A'}</Text>
            </View>

            <View style={styles.metaGrid}>
              <View>
                <Text style={styles.metaLabel}>DATE ISSUED</Text>
                <Text style={styles.metaValue}>{formatDate(params.date)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>PRESCRIPTION ID</Text>
                <Text style={styles.metaValue}>#{params.ref || params.id?.toString().slice(0,8).toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.contentSection}>
              <Text style={styles.sectionHeading}>MEDICATION NAME</Text>
              <Text style={styles.medName}>{params.medication}</Text>
              <View style={styles.dosageBadge}>
                <Text style={styles.dosageText}>{params.dosage}</Text>
              </View>

              <Text style={[styles.sectionHeading, { marginTop: 30 }]}>DURATION</Text>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#0EA5E9" />
                <Text style={styles.infoRowText}>{params.duration} Days</Text>
              </View>

              <Text style={[styles.sectionHeading, { marginTop: 30 }]}>PHYSICIAN INSTRUCTIONS</Text>
              <View style={styles.instructionBox}>
                <Text style={styles.instructionText}>{params.instructions || "No specific instructions provided."}</Text>
              </View>
            </View>

            <View style={styles.signatureSection}>
              <Text style={styles.metaLabel}>AUTHORIZING DOCTOR</Text>
              <Text style={styles.doctorName}>Dr. {params.doctor}</Text>
              <View style={styles.sigLine} />
              <Text style={styles.verifiedText}>Digitally Signed via iCare Gateway</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.pharmacyBtn}
            onPress={() => router.push('/search-facilities')}
          >
            <MaterialCommunityIcons name="store-marker" size={22} color="#FFF" />
            <Text style={styles.pharmacyBtnText}>Locate Nearby Pharmacy</Text>
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
  iconBtn: { width: 45, height: 45, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  reportSheet: { backgroundColor: '#FFF', borderRadius: 28, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandName: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  docType: { fontSize: 10, color: '#64748B', fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  hr: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  metaLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  metaValue: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  contentSection: { flex: 1 },
  sectionHeading: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 12 },
  medName: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
  dosageBadge: { backgroundColor: '#E0F2FE', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginTop: 10 },
  dosageText: { color: '#0369A1', fontWeight: '800', fontSize: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoRowText: { fontSize: 18, color: '#334155', fontWeight: '700' },
  instructionBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 18, borderLeftWidth: 5, borderLeftColor: '#0EA5E9' },
  instructionText: { fontSize: 16, color: '#475569', lineHeight: 26, fontStyle: 'italic' },
  signatureSection: { marginTop: 60, alignItems: 'center' },
  doctorName: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 5 },
  sigLine: { width: '70%', height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  verifiedText: { fontSize: 11, color: '#94A3B8' },
  pharmacyBtn: { backgroundColor: '#0EA5E9', height: 65, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 25 },
  pharmacyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});