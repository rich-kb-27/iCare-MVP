import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, TextInput, RefreshControl, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'; 

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  
  // States
  const [profile, setProfile] = useState<{ 
    full_name: string; 
    email: string; 
    avatar_url: string | null; 
    role: string;
    rating: number; 
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

  const THEME = {
    dark: '#0F172A',
    sky: '#0EA5E9',
    card: '#FFFFFF',
    textLight: '#E0F2FE',
    textMuted: '#94A3B8',
    warning: '#FBBF24',
  };

  useEffect(() => {
    if (user) getProfile();
  }, [user]);

  async function getProfile() {
    try {
      setLoading(true);
      // Querying the profiles_table as per your DB setup
      const { data, error } = await supabase
        .from('profiles') 
        .select(`full_name, email, avatar_url, role, rating`)
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setNewName(data.full_name || '');
    } catch (error: any) {
      console.error('Profile Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getProfile();
    setRefreshing(false);
  }, []);

  // --- 📸 IMAGE PICKER & UPLOAD ---
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        uploadAvatar(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (base64: string) => {
    try {
      setUploading(true);
      const fileName = `${user?.id}_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(fileName, decode(base64), { 
          contentType: 'image/png',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatar')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', user?.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, full_name: newName } : null);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error: any) {
      Alert.alert('Update Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: THEME.dark }]}>
        <ActivityIndicator size="large" color={THEME.sky} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.topBar}>
          <Text style={styles.logoText}>Profile</Text>
          <TouchableOpacity 
            style={styles.iconCircle}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons name={isEditing ? "close" : "create-outline"} size={22} color={THEME.textLight} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.sky} />
          }
        >
          {/* Profile Identity Section */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {uploading ? (
                <View style={[styles.avatar, styles.avatarLoader]}>
                  <ActivityIndicator color={THEME.sky} />
                </View>
              ) : (
                <Image 
                  source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/150' }} 
                  style={styles.avatar} 
                />
              )}
              <TouchableOpacity style={styles.editBadge} onPress={pickImage} disabled={uploading}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>

            {isEditing ? (
              <View style={styles.editInputContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter Full Name"
                  placeholderTextColor="#BAE6FD"
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateInfo}>
                   <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.userName}>{profile?.full_name || 'Set Your Name'}</Text>
                <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
                
                {/* 🌟 Doctor Rating Badge */}
                {profile?.role === 'freelancer' && (
                   <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={16} color={THEME.warning} />
                      <Text style={styles.ratingText}>
                        {profile.rating ? profile.rating.toFixed(1) : '5.0'} Rating
                      </Text>
                   </View>
                )}
              </>
            )}
          </View>

          {/* Account Menu */}
          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => setIsEditing(true)}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name="account-circle-outline" size={22} color={THEME.sky} />
              </View>
              <Text style={styles.menuText}>Personal Information</Text>
              <Ionicons name="chevron-forward" size={18} color={THEME.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name="shield-check-outline" size={22} color={THEME.sky} />
              </View>
              <Text style={styles.menuText}>Security & Privacy</Text>
              <Ionicons name="chevron-forward" size={18} color={THEME.textMuted} />
            </TouchableOpacity>

            {profile?.role === 'doctor' && (
              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIconBox}>
                  <MaterialCommunityIcons name="stethoscope" size={22} color={THEME.sky} />
                </View>
                <Text style={styles.menuText}>Medical Credentials</Text>
                <Ionicons name="chevron-forward" size={18} color={THEME.textMuted} />
              </TouchableOpacity>
            )}

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => signOut()}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.menuText, { color: '#EF4444' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>iCare MVP v1.0.4 | Built for Impact</Text>
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
  logoText: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 120 },
  profileHeader: { alignItems: 'center', marginVertical: 20 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 120, height: 120, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.2)' },
  avatarLoader: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  editBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#0EA5E9', width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#0B3C5D' },
  userName: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  userEmail: { fontSize: 14, color: '#BAE6FD', marginTop: 4 },
  
  // 🌟 Rating Styles
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    marginTop: 12,
    gap: 6
  },
  ratingText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  editInputContainer: { width: '85%', alignItems: 'center', marginTop: 10 },
  nameInput: { width: '100%', height: 50, borderBottomWidth: 2, borderBottomColor: '#0EA5E9', color: '#FFF', fontSize: 20, textAlign: 'center', fontWeight: '700' },
  saveBtn: { marginTop: 20, backgroundColor: '#FFF', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
  saveBtnText: { color: '#0EA5E9', fontWeight: '900' },

  contentCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 30, padding: 25, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1.5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  menuIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { color: 'rgba(186, 230, 253, 0.4)', fontSize: 11, fontWeight: '600' }
});

export default ProfileScreen;