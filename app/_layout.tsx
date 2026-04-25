import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; 
import AppointmentAlert from './components/AppointmentAlert'; 
import { LogBox, View } from 'react-native';

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

function RootNavigator() {
  const { session, role, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // ALERTS & CALL STATE
  const [alertVisible, setAlertVisible] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  
  const userRef = useRef(user);
  const roleRef = useRef(role);

  useEffect(() => {
    userRef.current = user;
    roleRef.current = role;
  }, [user, role]);

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
      const currentSegment = segments[0];
      if (inAuthGroup || currentSegment === 'login') {
        if (role === 'user') router.replace('/(patient-drawer)');
        else if (role === 'freelancer') router.replace('/(freelancer-drawer)');
        else if (role === 'facility') router.replace('/(facility-drawer)');
      }
    }
  }, [session, role, loading, segments]);

  // --- 2. UNIVERSAL CALL LISTENER (DOCTOR & PATIENT) ---
  useEffect(() => {
    // Only listen if logged in
    if (!session || !user?.id || !role) return;

    // Filter logic: Listen for calls where THIS user is the target (doctor or patient)
    const targetFilter = role === 'freelancer' 
      ? `doctor_id=eq.${user.id}` 
      : `patient_id=eq.${user.id}`;

    const callChannel = supabase
      .channel(`global-calls-${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'calls',
        filter: targetFilter 
      }, (payload) => {
        const data = payload.new;

        // 🔥 THE SHIELD: If I am the one who started this call, ignore the alert.
        if (data.initiated_by === userRef.current?.id) return;

        // Only react to new 'ringing' calls
        if (data.status === 'ringing') {
          console.log("Incoming call detected from:", data.caller_name || "iCare User");
          setActiveAppointment(data);
          setAlertVisible(true);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
        filter: targetFilter
      }, (payload) => {
        const data = payload.new;
        
        // Handle cleanup: Dismiss alert if caller cancels or call ends
        if (['ended', 'declined', 'cancelled'].includes(data.status)) {
          console.log("Call status updated to", data.status, ". Dismissing alert.");
          setAlertVisible(false);
          setActiveAppointment(null);
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(callChannel); 
    };
  }, [session, user?.id, role]); 

  // --- 3. JOIN HANDLER (ROUTING LOGIC) ---
  const handleJoinCall = async (appointment: any) => {
    if (!appointment?.id) return;
    
    setAlertVisible(false);
    
    // Set status to active so both parties know the connection is live
    await supabase.from('calls').update({ status: 'active' }).eq('id', appointment.id);
    
    // Determine target path based on user role
    const targetPath = role === 'freelancer'
      ? "/(freelancer-dashboard)/video-call"
      : "/(patient-dashboard)/checkup/telemedicine"; // Use your actual patient call route

    router.push({ 
      pathname: targetPath as any, 
      params: { 
        id: appointment.id, 
        name: role === 'freelancer' ? appointment.patient_name : appointment.doctor_name,
        channelName: appointment.channel_name 
      } 
    });
  }

  if (loading) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(patient-drawer)" />
        <Stack.Screen name="(freelancer-drawer)" />
        <Stack.Screen name="(facility-drawer)" />
      </Stack>

      {/* The Alert pops up for anyone (Doctor/Patient) who is the RECIPIENT */}
      {activeAppointment && (
        <AppointmentAlert 
          visible={alertVisible}
          appointment={activeAppointment}
          onDismiss={() => {
            setAlertVisible(false);
            setActiveAppointment(null);
          }}
          onJoin={() => handleJoinCall(activeAppointment)}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}