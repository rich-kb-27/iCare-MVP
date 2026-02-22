import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen = () => {
  const router = useRouter();
  const { signOut } = useAuth();

  // State for toggles
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const THEME = {
    dark: '#0F172A',
    sky: '#0EA5E9',
    textLight: '#E0F2FE',
    textMuted: '#94A3B8',
  };

  const SettingRow = ({ icon, label, type = 'chevron', value, onValueChange }: any) => (
    <View style={styles.settingItem}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={THEME.sky} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      
      {type === 'chevron' && (
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color={THEME.textMuted} />
        </TouchableOpacity>
      )}

      {type === 'switch' && (
        <Switch
          trackColor={{ false: '#CBD5E1', true: '#BAE6FD' }}
          thumbColor={value ? THEME.sky : '#F4F4F5'}
          onValueChange={onValueChange}
          value={value}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} /> {/* Spacer to center title */}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* SECURITY SECTION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Security & Privacy</Text>
            <SettingRow 
              icon="finger-print-outline" 
              label="Use Biometrics" 
              type="switch" 
              value={biometrics} 
              onValueChange={setBiometrics} 
            />
            <View style={styles.divider} />
            <SettingRow icon="lock-closed-outline" label="Change Password" />
            <View style={styles.divider} />
            <SettingRow icon="document-text-outline" label="Privacy Policy" />
          </View>

          {/* NOTIFICATIONS SECTION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Notifications</Text>
            <SettingRow 
              icon="notifications-outline" 
              label="Push Notifications" 
              type="switch" 
              value={notifications} 
              onValueChange={setNotifications} 
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="mail-outline" 
              label="Email Marketing" 
              type="switch" 
              value={marketing} 
              onValueChange={setMarketing} 
            />
          </View>

          {/* DANGER ZONE */}
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionHeader, { color: '#EF4444' }]}>Danger Zone</Text>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => Alert.alert("Wait!", "Are you sure you want to delete your account?", [{text: "Cancel"}, {text: "Delete", style: 'destructive'}])}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()}>
            <MaterialCommunityIcons name="logout" size={20} color="#FFF" />
            <Text style={styles.logoutText}>Sign Out of iCare</Text>
          </TouchableOpacity>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  
  scroll: { paddingBottom: 50, paddingHorizontal: 20 },
  
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 5,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SettingsScreen;