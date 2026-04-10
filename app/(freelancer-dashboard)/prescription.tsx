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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";

const CreatePrescription = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Data State
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Selection & Form State
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (user?.id) fetchActiveSubscribers();
  }, [user]);

  const fetchActiveSubscribers = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      /** * UPGRADE: We are selecting everything from subscriptions 
       * AND joining the 'profiles' table based on the patient_id.
       */
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          patient_profile:profiles!patient_id (
            full_name,
            avatar_url,
            email
          )
        `)
        .eq("doctor_id", user?.id)
        .eq("status", "active")
        .gt("expiry_date", now);

      if (error) throw error;
      setSubscribers(data || []);
    } catch (e: any) {
      Alert.alert("Error", "Could not load subscribers: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIssuePrescription = async () => {
    if (!selectedPatient || !medication || !dosage || !duration) {
      Alert.alert("Missing Info", "Please select a patient and fill in the medication details.");
      return;
    }

    try {
      setSending(true);
      
      // Use the name from the profile if available, otherwise fallback
      const patientName = selectedPatient.patient_profile?.full_name || selectedPatient.patient_name;

      const { error } = await supabase.from("prescriptions").insert([
        {
          doctor_id: user?.id,
          patient_id: selectedPatient.patient_id,
          medication: medication,
          dosage: dosage,
          duration: duration,
          instructions: instructions,
          status: "Active",
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        },
      ]);

      if (error) throw error;

      Alert.alert("Success!", `Prescription sent to ${patientName}`, [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert("Failed", e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Issue Prescription</Text>
            <View style={{ width: 40 }} />
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              
              {/* --- PATIENT SELECTION --- */}
              <Text style={styles.sectionLabel}>1. Select Subscribed Patient</Text>
              {loading ? (
                <ActivityIndicator color="#0EA5E9" style={{ marginVertical: 20 }} />
              ) : subscribers.length > 0 ? (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientListContainer}>
                    {subscribers.map((item) => {
                      const isSelected = selectedPatient?.id === item.id;
                      const profile = item.patient_profile;
                      const displayName = profile?.full_name || item.patient_name;
                      
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => setSelectedPatient(item)}
                          style={[
                            styles.patientCard,
                            isSelected && styles.selectedPatientCard,
                          ]}
                        >
                          <View style={styles.avatarWrapper}>
                            {profile?.avatar_url ? (
                              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                            ) : (
                              <View style={[styles.avatar, isSelected && { backgroundColor: '#FFF' }]}>
                                <FontAwesome5 name="user" size={16} color={isSelected ? "#0EA5E9" : "#64748B"} />
                              </View>
                            )}
                          </View>
                          
                          <Text style={[styles.patientName, isSelected && { color: '#FFF' }]} numberOfLines={1}>
                            {displayName.split(' ')[0]}
                          </Text>
                          
                          <View style={[styles.planBadge, isSelected && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Text style={[styles.planText, isSelected && { color: '#FFF' }]}>{item.plan_type}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No active subscribers found.</Text>
                </View>
              )}

              {/* --- FORM SECTION --- */}
              {selectedPatient && (
                <View style={styles.formContainer}>
                  <Text style={styles.formHeading}>Prescription Details</Text>
                  
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Medication Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Amoxicillin 500mg"
                      placeholderTextColor="#94A3B8"
                      value={medication}
                      onChangeText={setMedication}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Dosage / Frequency</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1 Tablet, 3x daily"
                      placeholderTextColor="#94A3B8"
                      value={dosage}
                      onChangeText={setDosage}
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputWrapper, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.inputLabel}>Duration</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 7 Days"
                        placeholderTextColor="#94A3B8"
                        value={duration}
                        onChangeText={setDuration}
                      />
                    </View>
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Category</Text>
                      <View style={[styles.input, { justifyContent: 'center' }]}>
                        <Text style={{ color: '#0F172A' }}>Antibiotic</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Additional Instructions (Optional)</Text>
                    <TextInput
                      style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                      placeholder="Take after meals..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      value={instructions}
                      onChangeText={setInstructions}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.submitBtn, sending && { opacity: 0.7 }]} 
                    onPress={handleIssuePrescription}
                    disabled={sending}
                  >
                    {sending ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="send" size={20} color="#FFF" />
                        <Text style={styles.submitBtnText}>Send to Patient</Text>
                      </>
                    )}
                  </TouchableOpacity>
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  backBtn: { padding: 5 },
  scroll: { paddingBottom: 40 },
  sectionLabel: { color: '#BAE6FD', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginHorizontal: 20, marginBottom: 15, marginTop: 10 },
  patientListContainer: { paddingLeft: 20, paddingRight: 20, paddingBottom: 10 },
  patientCard: { width: 110, height: 140, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 12, marginRight: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  selectedPatientCard: { backgroundColor: '#0EA5E9', borderColor: '#7DD3FC' },
  avatarWrapper: { marginBottom: 8 },
  avatarImg: { width: 45, height: 45, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  avatar: { width: 45, height: 45, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  patientName: { color: '#FFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  planBadge: { marginTop: 6, backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  planText: { color: '#10B981', fontSize: 9, fontWeight: '900' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14 },
  formContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, marginTop: 10, minHeight: 500 },
  formHeading: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  inputWrapper: { marginBottom: 18 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 15, height: 55, color: '#0F172A', fontSize: 15 },
  row: { flexDirection: 'row' },
  submitBtn: { backgroundColor: '#0F172A', height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10, elevation: 4 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

export default CreatePrescription;