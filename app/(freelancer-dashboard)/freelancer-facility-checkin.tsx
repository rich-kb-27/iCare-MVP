import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Animated
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { StatusBar } from "expo-status-bar";

export default function CheckInProcessScreen() {
  const { facilityId, facilityName, facilityType } = useLocalSearchParams();
  const router = useRouter();
  
  // --- STATE ---
  const [currentStep, setCurrentStep] = useState(1); // 1: Select, 2: Pending, 3: Unlocked
  const [visitType, setVisitType] = useState<'checkin' | 'query' | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Sync Check-in Status
   */
  const syncStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('check_ins')
        .select('*')
        .eq('patient_id', user?.id)
        .eq('facility_id', facilityId)
        .in('status', ['pending', 'seen'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        if (data.status === 'pending') setCurrentStep(2);
        if (data.status === 'seen') setCurrentStep(3);
      } else {
        setCurrentStep(1);
      }
    } catch (err) {
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  /**
   * Check Facility Online Status
   */
  const checkFacilityStatus = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('last_seen')
        .eq('id', facilityId)
        .single();

      if (data?.last_seen) {
        const lastSeen = new Date(data.last_seen).getTime();
        const now = new Date().getTime();
        // Online if active in the last 5 minutes
        setIsOnline(now - lastSeen < 300000);
      } else {
        setIsOnline(false);
      }
    } catch (err) {
      setIsOnline(false);
    }
  }, [facilityId]);

  useEffect(() => {
    syncStatus();
    checkFacilityStatus();

    // Real-time listener for the "Acceptance" event
    const channel = supabase
      .channel(`triage_${facilityId}`)
      .on('postgres_changes', { 
        event: '*', schema: 'public', table: 'check_ins', filter: `facility_id=eq.${facilityId}` 
      }, () => syncStatus())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [facilityId, syncStatus, checkFacilityStatus]);

  const handleInitialCheckIn = async () => {
    if (!visitType) return Alert.alert("Required", "Select your purpose of visit.");
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const patientName = user?.user_metadata?.full_name || "Patient";

      // 1. Insert Check-in
      const { error: checkInError } = await supabase.from('check_ins').insert([{
        patient_id: user?.id,
        facility_id: facilityId,
        patient_name: patientName,
        reason_for_visit: visitType === 'checkin' ? "Medical Check-in" : "General Inquiry",
        status: 'pending'
      }]);

      if (checkInError) throw checkInError;

      // 2. Notify Facility
      await supabase.from('notifications').insert([{
        user_id: facilityId,
        title: "New Patient Check-in",
        body: `${patientName} is waiting for a ${visitType === 'checkin' ? 'Medical Check-in' : 'General Query'}.`,
        type: "check_in_request",
        is_read: false,
        status: "active"
      }]);

      setCurrentStep(2);
    } catch (err) {
      Alert.alert("Error", "Could not check in. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#0EA5E9" /></View>;

  return (
    <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER AREA */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {currentStep} OF 3</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          
          {/* STEP 1: PURPOSE SELECTION */}
          {currentStep === 1 && (
            <View>
              <View style={styles.hero}>
                <Text style={styles.title}>Welcome to {facilityName}</Text>
                
                {/* ONLINE STATUS INDICATOR */}
                <View style={styles.statusRow}>
                  <View style={[styles.dot, { backgroundColor: isOnline ? '#10B981' : '#64748B' }]} />
                  <Text style={styles.statusLabel}>
                    {isOnline === null ? "Checking connection..." : isOnline ? "Facility is Online" : "Facility is currently offline"}
                  </Text>
                </View>

                <Text style={styles.subtitle}>Please select your reason for visiting today.</Text>
              </View>

              <TouchableOpacity 
                style={[styles.selectCard, visitType === 'checkin' && styles.selectActive]}
                onPress={() => setVisitType('checkin')}
              >
                <MaterialCommunityIcons name="hospital-box" size={32} color={visitType === 'checkin' ? "#FFF" : "#0EA5E9"} />
                <View>
                  <Text style={[styles.selectTitle, visitType === 'checkin' && styles.whiteText]}>Medical Check-in</Text>
                  <Text style={styles.selectDesc}>I am here to see a doctor or nurse.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.selectCard, visitType === 'query' && styles.selectActive]}
                onPress={() => setVisitType('query')}
              >
                <MaterialCommunityIcons name="help-circle" size={32} color={visitType === 'query' ? "#FFF" : "#0EA5E9"} />
                <View>
                  <Text style={[styles.selectTitle, visitType === 'query' && styles.whiteText]}>General Query</Text>
                  <Text style={styles.selectDesc}>I have a question or need info.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.nextBtn} onPress={handleInitialCheckIn} disabled={submitting}>
                <LinearGradient colors={["#0EA5E9", "#2563EB"]} style={styles.btnGrad}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.nextText}>Request Check-in</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: WAITING ROOM */}
          {currentStep === 2 && (
            <View style={styles.waitBox}>
              <View style={styles.lottieMock}>
                <ActivityIndicator size="large" color="#0EA5E9" />
              </View>
              <Text style={styles.waitTitle}>Waiting for Approval</Text>
              <Text style={styles.waitDesc}>
                We've notified {facilityName}. Please stay on this screen. Once they accept your request, your consultation tools will unlock.
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.badgeText}>STATUS: PENDING</Text>
              </View>
            </View>
          )}

          {/* STEP 3: CONSULTATION TOOLS */}
          {currentStep === 3 && (
            <View>
              <View style={styles.hero}>
                <Ionicons name="checkmark-circle" size={60} color="#10B981" />
                <Text style={styles.title}>You're All Set!</Text>
                <Text style={styles.subtitle}>The facility is ready. Choose how you'd like to proceed.</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.toolCard} onPress={() => router.push({ pathname: "/facility-calls", params: { facilityId, facilityName, mode: 'video' }})}>
                  <LinearGradient colors={["#10B981", "#059669"]} style={styles.toolGrad}>
                    <Ionicons name="videocam" size={30} color="#FFF" />
                    <Text style={styles.toolTitle}>Video Call</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.toolCard} onPress={() => router.push({ pathname: "/chat/[id]", params: { id: facilityId, name: facilityName }})}>
                  <View style={styles.toolInner}>
                    <Ionicons name="chatbubbles" size={30} color="#0EA5E9" />
                    <Text style={[styles.toolTitle, { color: '#0EA5E9' }]}>Instant Chat</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  container: { padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  stepIndicator: { backgroundColor: 'rgba(14, 165, 233, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  stepText: { color: '#38BDF8', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  hero: { alignItems: 'center', marginVertical: 30 },
  title: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 20 },

  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

  selectCard: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 20, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  selectActive: { backgroundColor: '#0EA5E9', borderColor: '#38BDF8' },
  selectTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  selectDesc: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  whiteText: { color: '#FFF' },

  nextBtn: { height: 60, borderRadius: 18, overflow: 'hidden', marginTop: 20 },
  btnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  nextText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  waitBox: { alignItems: 'center', marginTop: 50 },
  lottieMock: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  waitTitle: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  waitDesc: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginTop: 15, lineHeight: 24, paddingHorizontal: 20 },
  statusBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginTop: 30 },
  badgeText: { color: '#0F172A', fontWeight: '900', fontSize: 12 },

  actionRow: { flexDirection: 'row', gap: 15, marginTop: 20 },
  toolCard: { flex: 1, height: 140, borderRadius: 25, overflow: 'hidden' },
  toolGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toolInner: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)' },
  toolTitle: { color: '#FFF', fontWeight: '800', marginTop: 10 }
});