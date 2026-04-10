import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; 
import AppointmentAlert from './components/AppointmentAlert'; 
import { LogBox, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

function RootNavigator() {
  const { session, role, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Doctor Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  
  // Patient Incoming Call State (The Realtime Overlay)
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  
  const activeCallUUID = useRef<string | null>(null);

  // --- 1. NAVIGATION GUARDS ---
  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)' || segments.length === 0;

    if (!session) {
      if (!inAuthGroup && segments[0] !== 'login') {
        router.replace('/login');
      }
      return;
    }

    if (session && role) {
      if (inAuthGroup || segments[0] === 'login' || segments[0] === '(auth)') {
        if (role === 'user') router.replace('/(patient-drawer)');
        else if (role === 'freelancer') router.replace('/(freelancer-drawer)');
        else if (role === 'facility') router.replace('/(facility-drawer)');
      }
    }
  }, [session, role, loading, segments]);

  // --- 2. GLOBAL CALL LISTENER ---
  useEffect(() => {
    if (!session || !user?.id) return;

    const channel = supabase
      .channel('calls-trigger')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'calls',
      }, (payload) => {
        const data = payload.new;

        // A. THE MIRROR SHIELD (Blocks self-calling)
        if (data.initiated_by === user.id) return; 
        
        // B. RECIPIENT VERIFICATION
        const isForMeAsDoctor = role === 'freelancer' && data.id === user.id;
        const isForMeAsPatient = role === 'user' && data.patient_id === user.id;

        // C. LOGIC GATE: Status check
        if (data.status === 'ringing' && (isForMeAsDoctor || isForMeAsPatient)) {
          
          if (activeCallUUID.current === data.id) return;
          activeCallUUID.current = data.id;

          if (role === 'freelancer') {
            setActiveAppointment(data);
            setAlertVisible(true);
          } else if (role === 'user') {
            // Patient sees the full-screen overlay (Realtime, no router.push)
            setIncomingCallData(data);
          }
        } 

        // D. CLEANUP: Auto-dismiss if status changes to ended or declined
        if (['ended', 'declined'].includes(data.status)) {
            if (activeCallUUID.current === data.id) {
                setIncomingCallData(null);
                setAlertVisible(false);
                activeCallUUID.current = null;
            }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, user?.id, role]);

  // --- 3. DOCTOR JOIN HANDLER ---
  const handleJoinCall = async (id: string, name: string) => {
    if (!id) return;
    setAlertVisible(false);

    // Update status to 'active' (matching your DB constraint)
    await supabase
      .from('calls')
      .update({ status: 'active' }) 
      .eq('id', id);

    router.push({
      pathname: "/(freelancer-dashboard)/video-call",
      params: { id, name }
    });
  };

  if (loading) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(patient-drawer)" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(freelancer-drawer)" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(facility-drawer)" options={{ animation: 'slide_from_right' }} />

        <Stack.Screen 
          name="checkup/telemedicine" 
          options={{ presentation: 'fullScreenModal', animation: 'fade' }} 
        />
        
        <Stack.Screen 
            name="(patient-dashboard)/chat/[id]" 
            options={{ presentation: 'card' }} 
        />
      </Stack>

      {/* FREELANCER (DOCTOR) POPUP ALERT */}
      {activeAppointment && (
        <AppointmentAlert 
          visible={alertVisible}
          appointment={activeAppointment}
          onDismiss={() => {
            setAlertVisible(false);
            activeCallUUID.current = null;
          }}
          onJoin={() => {
            if (activeAppointment?.id) {
              handleJoinCall(activeAppointment.id, activeAppointment.patient_name || 'Patient');
            }
          }}
        />
      )}

      {/* PATIENT INCOMING CALL OVERLAY (PURE REALTIME) */}
      {incomingCallData && (
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill}>
            <SafeAreaView style={styles.overlayContainer}>
              
              <View style={styles.header}>
                <MaterialCommunityIcons name="shield-lock" size={20} color="#0EA5E9" />
                <Text style={styles.headerText}>SECURE INCOMING CALL</Text>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.avatarCircle}>
                   <Ionicons name="person" size={60} color="#FFF" />
                </View>
                <Text style={styles.doctorName}>Dr. {incomingCallData.doctor_name || 'Specialist'}</Text>
                <Text style={styles.specialtyText}>{incomingCallData.doctor_specialty || 'Medical Professional'}</Text>
              </View>

              <View style={styles.actionRow}>
                {/* DECLINE BUTTON */}
                <TouchableOpacity 
                  onPress={async () => {
                    await supabase.from('calls').update({ status: 'declined' }).eq('id', incomingCallData.id);
                    setIncomingCallData(null);
                    activeCallUUID.current = null;
                  }}
                  style={styles.actionBtn}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#EF4444' }]}>
                    <MaterialCommunityIcons name="phone-hangup" size={32} color="#FFF" />
                  </View>
                  <Text style={[styles.btnLabel, { color: '#EF4444' }]}>Decline</Text>
                </TouchableOpacity>

                {/* ACCEPT BUTTON */}
                <TouchableOpacity 
                  onPress={() => {
                    const callId = incomingCallData.id;
                    setIncomingCallData(null); // Clear overlay
                    router.push({
                      pathname: "/checkup/telemedicine",
                      params: { callId: callId } 
                    });
                  }}
                  style={styles.actionBtn}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#22C55E' }]}>
                    <MaterialCommunityIcons name="phone-check" size={32} color="#FFF" />
                  </View>
                  <Text style={[styles.btnLabel, { color: '#22C55E' }]}>Accept</Text>
                </TouchableOpacity>
              </View>

            </SafeAreaView>
          </BlurView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: { flex: 1, alignItems: 'center', justifyContent: 'space-around', paddingVertical: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(14, 165, 233, 0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  headerText: { color: '#0EA5E9', fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },
  infoSection: { alignItems: 'center' },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 10, shadowColor: '#0EA5E9', shadowOpacity: 0.5, shadowRadius: 15 },
  doctorName: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  specialtyText: { color: '#94A3B8', fontSize: 16, marginTop: 5 },
  actionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', paddingHorizontal: 30 },
  actionBtn: { alignItems: 'center' },
  iconCircle: { width: 75, height: 75, borderRadius: 38, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  btnLabel: { marginTop: 12, fontWeight: 'bold', fontSize: 14 }
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}