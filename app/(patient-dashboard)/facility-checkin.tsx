import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Platform 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";

export default function CheckInScreen() {
  const { facilityId, facilityName, facilityType } = useLocalSearchParams();
  const router = useRouter();
  
  // UX Update: Switch from TextInput to Category Selection
  const [visitType, setVisitType] = useState<'checkin' | 'query' | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkFacilityStatus();
    const channel = supabase
      .channel(`status-${facilityId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${facilityId}` 
      }, (payload) => {
        setIsOnline(payload.new.is_online);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [facilityId]);

  const checkFacilityStatus = async () => {
    try {
      const { data } = await supabase.from('profiles').select('is_online').eq('id', facilityId).single();
      setIsOnline(data?.is_online ?? false);
    } catch (err) {
      setIsOnline(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleAction = async (mode: 'video' | 'chat') => {
    if (!visitType) {
      Alert.alert("Selection Required", "Please select whether you are here for a Check-in or a General Query.");
      return;
    }

    if (mode === 'video' && !isOnline) {
      Alert.alert("Facility Offline", "This facility is currently not accepting video calls.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const patientName = user?.user_metadata?.full_name || "Patient";

      // Create the call/check-in record in your unified table
      const { data: newCall, error } = await supabase.from('calls').insert([
        { 
          patient_id: user?.id, 
          patient_name: patientName,
          facility_id: facilityId, 
          facility_name: facilityName,
          call_type: 'facility',
          status: 'pending',
          channel_name: (facilityId as string).toLowerCase().trim(),
          reason: visitType === 'checkin' ? "Medical Check-in" : "General Inquiry"
        }
      ]).select().single();

      if (error) throw error;

      // Navigate to your facility-specific call screen with all params
      router.push({ 
        pathname: "/facility-calls", 
        params: { 
          facilityId, 
          facilityName, 
          callId: newCall.id,
          mode: mode // pass if it's video or chat
        } 
      });

    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.statusHeader}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#34D399' : '#EF4444' }]} />
            <Text style={styles.statusHeaderText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <FontAwesome5 name="hospital-alt" size={35} color="#0EA5E9" />
            </View>
            <Text style={styles.facilityTitle}>{facilityName}</Text>
            <Text style={styles.facilitySubtitle}>{String(facilityType).toUpperCase()}</Text>
          </View>

          {/* NEW: QUICK SELECTION UI */}
          <Text style={styles.label}>Purpose of Visit</Text>
          <View style={styles.selectorRow}>
            <TouchableOpacity 
              style={[styles.selectorBtn, visitType === 'checkin' && styles.selectorActive]}
              onPress={() => setVisitType('checkin')}
            >
              <MaterialCommunityIcons 
                name="hospital-box" 
                size={24} 
                color={visitType === 'checkin' ? "#FFF" : "#94A3B8"} 
              />
              <Text style={[styles.selectorText, visitType === 'checkin' && styles.textWhite]}>Check-in</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.selectorBtn, visitType === 'query' && styles.selectorActive]}
              onPress={() => setVisitType('query')}
            >
              <MaterialCommunityIcons 
                name="help-circle" 
                size={24} 
                color={visitType === 'query' ? "#FFF" : "#94A3B8"} 
              />
              <Text style={[styles.selectorText, visitType === 'query' && styles.textWhite]}>Query</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Select Communication Mode</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, !isOnline && styles.disabledBtn]} 
              onPress={() => handleAction('video')}
              disabled={submitting || checkingStatus}
            >
              <LinearGradient 
                colors={isOnline ? ["#0EA5E9", "#2563EB"] : ["#334155", "#1E293B"]} 
                style={styles.btnGradient}
              >
                <MaterialCommunityIcons name="video-plus" size={32} color="#FFF" />
                <Text style={styles.btnMainText}>Video Call</Text>
                <Text style={styles.btnSubText}>{isOnline ? "Virtual Triage" : "Unavailable"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.chatBtn]} 
              onPress={() => handleAction('chat')}
              disabled={submitting || checkingStatus}
            >
              <View style={styles.chatInner}>
                <Ionicons name="chatbubble-ellipses" size={30} color="#38BDF8" />
                <Text style={[styles.btnMainText, { color: '#38BDF8' }]}>Instant Chat</Text>
                <Text style={[styles.btnSubText, { color: '#94A3B8' }]}>Text Inquiry</Text>
              </View>
            </TouchableOpacity>
          </View>

          {submitting && <ActivityIndicator color="#0EA5E9" style={{ marginTop: 30 }} />}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusHeaderText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  hero: { alignItems: 'center', marginVertical: 40 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.2)' },
  facilityTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  facilitySubtitle: { color: '#38BDF8', fontSize: 13, fontWeight: '700', marginTop: 5, letterSpacing: 2 },
  label: { color: '#BAE6FD', fontSize: 14, fontWeight: '800', marginBottom: 15, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 1 },
  
  // Selector Styles
  selectorRow: { flexDirection: 'row', gap: 15, marginBottom: 40 },
  selectorBtn: { flex: 1, height: 60, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  selectorActive: { backgroundColor: '#0EA5E9', borderColor: '#38BDF8' },
  selectorText: { color: '#94A3B8', fontWeight: '700', fontSize: 16 },
  textWhite: { color: '#FFF' },

  actionRow: { flexDirection: 'row', gap: 15 },
  actionBtn: { flex: 1, height: 160, borderRadius: 24, overflow: 'hidden' },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
  chatBtn: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
  chatInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnMainText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 12 },
  btnSubText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4, fontWeight: '600' },
  disabledBtn: { opacity: 0.5 }
});