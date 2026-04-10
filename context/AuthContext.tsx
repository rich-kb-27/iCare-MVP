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

  // 🔔 Register push notifications
  const registerForPushNotificationsAsync = async (userId: string) => {
    if (!Device.isDevice) return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);

      console.log('✅ Push token saved for:', userId);
    } catch (e) {
      console.error('❌ Notification error:', e);
    }
  };

  // 🧠 Fetch user role safely
  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('❌ ROLE FETCH ERROR:', error.message);
        return null;
      }

      return data?.role ?? null;
    } catch (err) {
      console.log('❌ ROLE FETCH EXCEPTION:', err);
      return null;
    }
  };

  // 🚪 Sign out
  const signOut = async () => {
    try {
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ expo_push_token: null })
          .eq('id', session.user.id);
      }

      await supabase.auth.signOut();

      setSession(null);
      setRole(null);
    } catch (error) {
      console.error('Sign out error:', error);
      await supabase.auth.signOut();
    }
  };

  // 🚀 INIT + AUTH LISTENER
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        const userRole = await fetchRole(session.user.id);
        setRole(userRole);

        await registerForPushNotificationsAsync(session.user.id);
      } else {
        setRole(null);
      }

      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔄 AUTH EVENT:', event);

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

        setLoading(false); // ✅ CRITICAL FIX
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);