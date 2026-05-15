import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase'; // Ensure your path is correct

export default function ApprovePrescription() {
  const router = useRouter();
  
  // State Management
  const [refInput, setRefInput] = useState('');
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Logic: Verify if Ref exists, is Active, and is NOT Expired
  const verifyPrescription = async () => {
    if (!refInput) return Alert.alert("iCare", "Please enter a Reference ID.");

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:profiles!patient_id (full_name),
          doctor:profiles!doctor_id (full_name)
        `)
        .eq('reference_id', refInput.trim().toUpperCase())
        .single();

      if (error || !data) {
        throw new Error("Invalid Reference ID. Please check and try again.");
      }

      // Check Status
      if (data.status !== 'Active') {
        throw new Error(`This prescription is already marked as ${data.status.toUpperCase()}.`);
      }

      // Check Expiry Date
      const expiry = new Date(data.expiry_date);
      if (expiry < new Date()) {
        throw new Error("This prescription has expired and cannot be fulfilled.");
      }

      setPrescription(data);
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message);
      setPrescription(null);
    } finally {
      setLoading(false);
    }
  };

  // 2. Logic: Mark as Used/Fulfilled
  const handleConfirmSell = async () => {
    Alert.alert(
      "Confirm Transaction",
      "Confirming this will mark the prescription as USED. Do you have the medication in stock?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Confirm Sell", 
          onPress: async () => {
            setIsProcessing(true);
            try {
              const { error } = await supabase
                .from('prescriptions')
                .update({ 
                  status: 'Used', 
                  fulfilled_at: new Date().toISOString() 
                })
                .eq('id', prescription.id);

              if (error) throw error;

              Alert.alert("Success", "Inventory updated. Prescription marked as fulfilled.");
              router.back();
            } catch (e: any) {
              Alert.alert("Update Error", e.message);
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // Helper for formatting
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? dateValue : d.toLocaleDateString('en-GB');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Script</Text>
          <View style={{ width: 45 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Reference Input Section */}
          {!prescription && (
            <View style={styles.searchBox}>
               <Text style={styles.searchLabel}>ENTER REFERENCE NUMBER</Text>
               <TextInput 
                  style={styles.refInput}
                  placeholder="ICR-XXXXX-XXX"
                  placeholderTextColor="#475569"
                  value={refInput}
                  onChangeText={setRefInput}
                  autoCapitalize="characters"
               />
               <TouchableOpacity style={styles.verifyBtn} onPress={verifyPrescription}>
                 {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyBtnText}>Verify Prescription</Text>}
               </TouchableOpacity>
            </View>
          )}

          {/* Result Display: Only shows if prescription is valid */}
          {prescription && (
            <>
              <View style={styles.reportSheet}>
                <View style={styles.reportHeader}>
                  <View>
                    <Text style={styles.brandName}>iCare <Text style={{color: '#0EA5E9'}}>Health</Text></Text>
                    <Text style={styles.docType}>DIGITAL PRESCRIPTION RECORD</Text>
                  </View>
                  <MaterialCommunityIcons name="check-decagram" size={35} color="#0EA5E9" />
                </View>

                <View style={styles.hr} />

                <View style={{ marginBottom: 25 }}>
                   <Text style={styles.metaLabel}>PATIENT NAME</Text>
                   <Text style={[styles.metaValue, { fontSize: 18 }]}>{prescription.patient?.full_name}</Text>
                </View>

                <View style={styles.metaGrid}>
                  <View>
                    <Text style={styles.metaLabel}>DATE ISSUED</Text>
                    <Text style={styles.metaValue}>{formatDate(prescription.created_at)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.metaLabel}>PRESCRIPTION ID</Text>
                    <Text style={styles.metaValue}>#{prescription.reference_id}</Text>
                  </View>
                </View>

                <View style={styles.contentSection}>
                  <Text style={styles.sectionHeading}>MEDICATION NAME</Text>
                  <Text style={styles.medName}>{prescription.medication}</Text>
                  <View style={styles.dosageBadge}>
                    <Text style={styles.dosageText}>{prescription.dosage}</Text>
                  </View>

                  <Text style={[styles.sectionHeading, { marginTop: 30 }]}>DURATION</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color="#0EA5E9" />
                    <Text style={styles.infoRowText}>{prescription.duration} Days</Text>
                  </View>

                  <Text style={[styles.sectionHeading, { marginTop: 30 }]}>PHYSICIAN INSTRUCTIONS</Text>
                  <View style={styles.instructionBox}>
                    <Text style={styles.instructionText}>{prescription.instructions || "No specific instructions provided."}</Text>
                  </View>
                </View>

                <View style={styles.signatureSection}>
                  <Text style={styles.metaLabel}>AUTHORIZING DOCTOR</Text>
                  <Text style={styles.doctorName}>Dr. {prescription.doctor?.full_name}</Text>
                  <View style={styles.sigLine} />
                  <Text style={styles.verifiedText}>Digitally Signed & Validated</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity 
                style={styles.confirmBtn}
                onPress={handleConfirmSell}
                disabled={isProcessing}
              >
                {isProcessing ? (
                   <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cart-check" size={24} color="#FFF" />
                    <Text style={styles.confirmBtnText}>Confirm & Sell Meds</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setPrescription(null)} style={styles.cancelLink}>
                  <Text style={styles.cancelLinkText}>Reset Search</Text>
              </TouchableOpacity>
            </>
          )}
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
  
  // Search Box Styles
  searchBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 20 },
  searchLabel: { color: '#0EA5E9', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
  refInput: { backgroundColor: '#0F172A', height: 65, borderRadius: 20, paddingHorizontal: 20, color: '#FFF', fontSize: 20, fontWeight: '700', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', textAlign: 'center' },
  verifyBtn: { backgroundColor: '#0EA5E9', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  verifyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  // Report Styles (Preserved from your code)
  reportSheet: { backgroundColor: '#FFF', borderRadius: 28, padding: 25, elevation: 10 },
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
  signatureSection: { marginTop: 40, alignItems: 'center' },
  doctorName: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 5 },
  sigLine: { width: '70%', height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  verifiedText: { fontSize: 11, color: '#94A3B8' },

  // Final Action Styles
  confirmBtn: { backgroundColor: '#10B981', height: 70, borderRadius: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 25 },
  confirmBtnText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  cancelLink: { marginTop: 20, alignItems: 'center' },
  cancelLinkText: { color: '#64748B', fontSize: 14 }
});