import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const registerForPushNotificationsAsync = async (userId: string) => {
    if (!Device.isDevice) return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
    } catch (e) {
      console.error('❌ Notification error:', e);
    }
  };

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) return null;
      return data?.role ?? null;
    } catch (err) {
      return null;
    }
  };

  const signOut = async () => {
    try {
      if (session?.user) {
        await supabase.from('profiles').update({ expo_push_token: null }).eq('id', session.user.id);
      }
      await supabase.auth.signOut();
      setSession(null);
      setRole(null);
    } catch (error) {
      await supabase.auth.signOut();
    }
  };

  useEffect(() => {
    // 🛡️ INTERNAL HANDLER: Keeps the logic consistent
    const handleAuthChange = async (event: string, currentSession: Session | null) => {
      console.log('🔄 AUTH EVENT:', event);

      // 🛑 GUARD: If the user updated their password, don't trigger the global "loading" state.
      // This is what prevents the blank screen during reset.
      if (event === 'USER_UPDATED') {
        setSession(currentSession);
        return; 
      }

      setLoading(true);
      setSession(currentSession);

      if (currentSession?.user) {
        const userRole = await fetchRole(currentSession.user.id);
        setRole(userRole);

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await registerForPushNotificationsAsync(currentSession.user.id);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    };

    // 🚀 Init session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange('INITIAL_SESSION', session);
    });

    // 🎧 Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      handleAuthChange(event, currentSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);