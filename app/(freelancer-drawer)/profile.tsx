import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'; 

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; email: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Fix: Added missing state
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

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
        .select(`full_name, email, avatar_url`)
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

  // Handle Pull-to-Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getProfile();
    setRefreshing(false);
  }, []);

  // --- 📸 IMAGE PICKER & UPLOAD LOGIC ---
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
      
      // 1. Ensure the file path is clean. 
      // Using just the filename or a simple folder structure.
      const fileExt = 'png';
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      const filePath = fileName; // Uploads to the root of the 'avatar' bucket

      // 2. Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatar') // <--- Double check this matches the Dashboard exactly
        .upload(filePath, decode(base64), { 
          contentType: 'image/png',
          upsert: true // Good practice to allow overwriting if needed
        });

      if (uploadError) {
        // If it says "Bucket not found", the bucket 'avatar' does not exist in Storage
        throw uploadError;
      }

      // 3. Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath);

      // 4. Update the User's Profile in the Database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      console.error("Storage Error Detail:", error); // Log full error to see status codes
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- 📝 UPDATE PERSONAL INFO ---
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
              </>
            )}
          </View>

          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => setIsEditing(true)}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name="account-circle-outline" size={22} color={THEME.sky} />
              </View>
              <Text style={styles.menuText}>Edit Personal Info</Text>
              <Ionicons name="chevron-forward" size={18} color={THEME.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name="shield-check-outline" size={22} color={THEME.sky} />
              </View>
              <Text style={styles.menuText}>Security Settings</Text>
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
  avatarLoader: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  editInputContainer: { width: '80%', alignItems: 'center', marginTop: 10 },
  nameInput: { 
    width: '100%', 
    height: 50, 
    borderBottomWidth: 2, 
    borderBottomColor: '#0EA5E9', 
    color: '#FFF', 
    fontSize: 20, 
    textAlign: 'center',
    fontWeight: '700'
  },
  saveBtn: { marginTop: 15, backgroundColor: '#0EA5E9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  saveBtnText: { color: '#FFF', fontWeight: '800' },
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