import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
// Correct import from safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const THEME = {
    dark: '#0F172A',
    sky: '#0EA5E9',
    card: '#FFFFFF',
    textLight: '#E0F2FE',
    textMuted: '#94A3B8',
  };

  useEffect(() => {
    if (user) getProfile();
  }, [user]);

  async function getProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`full_name, email`)
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Profile Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: THEME.dark }]}>
        <ActivityIndicator size="large" color={THEME.sky} />
      </View>
    );
  }

  return (
    // Replicating your dashboard's edges config
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        {/* --- TOP NAV BAR (Sync with Dashboard) --- */}
        <View style={styles.topBar}>
          <Text style={styles.logoText}>Profile</Text>
          <TouchableOpacity style={styles.iconCircle}>
            <Ionicons name="settings-outline" size={22} color={THEME.textLight} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* --- USER HEADER --- */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/150' }} 
                style={styles.avatar} 
              />
              <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{profile?.full_name || 'Set Your Name'}</Text>
            <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
          </View>

          {/* --- SETTINGS CARD (Match Action Cards) --- */}
          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name="account-circle-outline" size={22} color={THEME.sky} />
              </View>
              <Text style={styles.menuText}>Personal Info</Text>
              <Ionicons name="chevron-forward" size={18} color={THEME.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name="shield-check-outline" size={22} color={THEME.sky} />
              </View>
              <Text style={styles.menuText}>Security</Text>
              <Ionicons name="chevron-forward" size={18} color={THEME.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => signOut()}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.menuText, { color: '#EF4444' }]}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>iCare MVP v1.0.4</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  logoText: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  
  scroll: { paddingBottom: 120 },
  
  profileHeader: { alignItems: 'center', marginVertical: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 110, height: 110, borderRadius: 30, borderWidth: 3, borderColor: 'rgba(14, 165, 233, 0.3)' },
  editBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#0EA5E9', width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#0B3C5D' },
  
  userName: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  userEmail: { fontSize: 14, color: '#BAE6FD', marginTop: 4 },

  contentCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, padding: 20, elevation: 5 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  menuIconBox: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { color: 'rgba(186, 230, 253, 0.3)', fontSize: 11, fontWeight: '600' }
});

export default ProfileScreen;