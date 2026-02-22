import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

function RootNavigator() {
  const { session, role, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    if (session && role && inAuthGroup) {
      if (role === 'user') {
        router.replace('/(patient-drawer)');
      }

      if (role === 'freelancer') {
        router.replace('/(freelancer-dashboard)');
      }

      if (role === 'facility') {
        router.replace('/(facility-dashboard)');
      }
    }
  }, [session, role, loading]);

  if (loading) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
