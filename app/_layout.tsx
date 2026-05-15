import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; 

import { LogBox, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

function RootNavigator() {
  const { session, role, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const userRef = useRef(user);
  const roleRef = useRef(role);

  useEffect(() => {
    userRef.current = user;
    roleRef.current = role;
  }, [user, role]);

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

  useEffect(() => {
    if (!session || !user?.id || !role) return;

    const targetFilter = role === 'freelancer' 
      ? `doctor_id=eq.${user.id}` 
      : `patient_id=eq.${user.id}`;

    const callChannel = supabase
      .channel(`global-events-${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'calls',
        filter: targetFilter 
      }, (payload) => {
        const data = payload.new;
        if (String(data.initiated_by) === String(userRef.current?.id)) return;

        if (data.status === 'ringing') {
          const incomingPath = roleRef.current === 'freelancer'
            ? "/(freelancer-dashboard)/incoming-call"
            : "/(patient-dashboard)/incoming-call";

          router.push({
            pathname: incomingPath as any,
            params: { 
              callId: data.id,
              callerName: roleRef.current === 'freelancer' ? data.patient_name : data.doctor_name,
              channelName: data.channel_name
            }
          });
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(callChannel); 
    };
  }, [session, user?.id, role]); 

  if (loading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(patient-drawer)" />
          <Stack.Screen name="(freelancer-drawer)" />
          <Stack.Screen name="(facility-drawer)" />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}