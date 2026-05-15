import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";

const CreatePrescription = () => {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [checkedInPatients, setCheckedInPatients] = useState<any[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchCheckedInPatients();
      fetchRecentHistory();
    }
  }, [user]);

  const fetchCheckedInPatients = async () => {
  try {
    const { data, error } = await supabase
      .from("check_ins")
      .select(`
        id,
        patient_id,
        reason_for_visit,
        patient:profiles!patient_id (full_name, avatar_url)
      `) // The !patient_id tells Supabase exactly which relationship to follow
      .eq("facility_id", user?.id)
      .eq("status", "seen");

    if (error) throw error;
    setCheckedInPatients(data || []);
  } catch (e: any) {
    console.error("Fetch Check-ins Error:", e.message);
  } finally {
    setLoading(false);
  }
};

  const fetchRecentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          patient:profiles!patient_id (full_name, avatar_url)
        `)
        .eq("doctor_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentPrescriptions(data || []);
    } catch (e: any) {
      console.error("History Fetch Error:", e.message);
    }
  };

  const handleIssuePrescription = async () => {
    if (!selectedPatient || !medication || !dosage || !duration) {
      Alert.alert("iCare", "Please complete all required fields.");
      return;
    }

    try {
      setSending(true);
      const now = new Date();
      const expiry = new Date();
      expiry.setDate(now.getDate() + 3);
      
      const reference_id = `ICR-${Date.now().toString().slice(-5)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const { error } = await supabase.from("prescriptions").insert([
        {
          doctor_id: user?.id,
          patient_id: selectedPatient.patient_id,
          medication,
          dosage,
          duration,
          instructions,
          status: "Active",
          reference_id: reference_id,
          expiry_date: expiry.toISOString(),
          date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        },
      ]);

      if (error) throw error;

      Alert.alert(
        "Authorized",
        `Ref: ${reference_id}\n\nPrescription sent to patient.`,
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert("System Error", e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Prescription</Text>
            <TouchableOpacity onPress={() => fetchCheckedInPatients()} style={styles.backBtn}>
              <Ionicons name="refresh" size={22} color="#0EA5E9" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              
              <Text style={styles.sectionLabel}>Active Check-ins</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientTray}>
                {loading ? (
                  <ActivityIndicator color="#0EA5E9" style={{ marginLeft: 20 }} />
                ) : checkedInPatients.length === 0 ? (
                  <Text style={{ color: '#475569', marginLeft: 5, fontSize: 13 }}>No patients waiting</Text>
                ) : (
                  checkedInPatients.map((item) => (
                    <TouchableOpacity 
                      key={item.id} 
                      onPress={() => setSelectedPatient(item)}
                      style={[styles.patientCard, selectedPatient?.id === item.id && styles.activePatientCard]}
                    >
                      <View style={styles.avatarWrapper}>
                        <Image 
                          source={
                            item.patient?.avatar_url 
                              ? { uri: item.patient.avatar_url } 
                              : { uri: `https://ui-avatars.com/api/?name=${item.patient?.full_name}&background=0EA5E9&color=fff` }
                          } 
                          style={styles.avatar} 
                        />
                        {selectedPatient?.id === item.id && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={12} color="#FFF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.patientName}>{item.patient?.full_name.split(' ')[0]}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {selectedPatient ? (
                <View style={styles.formContainer}>
                  <View style={styles.securityHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.securityText}>Authorized Script for:</Text>
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>{selectedPatient.patient?.full_name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 12 }}>Reason: {selectedPatient.reason_for_visit}</Text>
                    </View>
                    <MaterialCommunityIcons name="shield-check" size={28} color="#0EA5E9" />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>MEDICATION</Text>
                    <TextInput 
                      style={styles.input} 
                      value={medication} 
                      onChangeText={setMedication} 
                      placeholder="e.g. Amoxicillin" 
                      placeholderTextColor="#475569" 
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                      <Text style={styles.label}>DOSAGE</Text>
                      <TextInput style={styles.input} value={dosage} onChangeText={setDosage} placeholder="1x3" placeholderTextColor="#475569" />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>DAYS</Text>
                      <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="7" placeholderTextColor="#475569" />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>INSTRUCTIONS</Text>
                    <TextInput style={[styles.input, { height: 80, paddingTop: 15 }]} value={instructions} onChangeText={setInstructions} multiline placeholder="Take after meals..." placeholderTextColor="#475569" />
                  </View>

                  <TouchableOpacity style={styles.mainBtn} onPress={handleIssuePrescription} disabled={sending}>
                    {sending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.mainBtnText}>Sign & Authorize</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionLabel}>Recently Issued</Text>
                    {recentPrescriptions.map((rx) => (
                      <View key={rx.id} style={styles.historyItem}>
                        <Image 
                          source={
                            rx.patient?.avatar_url 
                              ? { uri: rx.patient.avatar_url } 
                              : { uri: `https://ui-avatars.com/api/?name=${rx.patient?.full_name}&background=1E293B&color=fff` }
                          } 
                          style={styles.historyAvatar} 
                        />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.historyName}>{rx.patient?.full_name}</Text>
                            <Text style={styles.historyMed}>{rx.medication} — {rx.date}</Text>
                        </View>
                        <View style={styles.statusBadge}>
                           <Text style={styles.statusText}>{rx.status}</Text>
                        </View>
                      </View>
                    ))}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  scroll: { paddingBottom: 40 },
  sectionLabel: { color: '#0EA5E9', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginLeft: 25, marginTop: 25, marginBottom: 15, textTransform: 'uppercase' },
  patientTray: { paddingLeft: 25, paddingRight: 10 },
  patientCard: { alignItems: 'center', marginRight: 20, opacity: 0.6 },
  activePatientCard: { opacity: 1 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#1E293B' },
  checkBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#0EA5E9', borderRadius: 10, padding: 3, borderWidth: 2, borderColor: '#0F172A' },
  patientName: { color: '#FFF', fontSize: 13, fontWeight: '600', marginTop: 8 },
  formContainer: { marginHorizontal: 20, marginTop: 20, backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 30, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: 15, borderRadius: 20 },
  securityText: { color: '#0EA5E9', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  inputGroup: { marginBottom: 15 },
  label: { color: '#475569', fontSize: 10, fontWeight: '900', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#0F172A', borderRadius: 18, height: 55, paddingHorizontal: 20, color: '#FFF', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  row: { flexDirection: 'row' },
  mainBtn: { backgroundColor: '#0EA5E9', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 20, padding: 15, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  historyAvatar: { width: 45, height: 45, borderRadius: 15 },
  historyName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  historyMed: { color: '#64748B', fontSize: 12, marginTop: 2 },
  statusBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#10B981', fontSize: 10, fontWeight: '800' }
});

export default CreatePrescription;