import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
// 🔥 THE FIX: Match the exact filename "facility-incoming-call"
import FacilityIncomingCall from './facility-incoming-call'; 

export default function FacilityLayout() {
  const [facilityId, setFacilityId] = useState<string | null>(null);

  useEffect(() => {
    async function getFacility() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setFacilityId(user.id);
    }
    getFacility();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />

      {/* This renders the logic in the background of every screen */}
      {facilityId && <FacilityIncomingCall facilityId={facilityId} />}
    </View>
  );
}