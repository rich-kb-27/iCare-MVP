import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen = () => {
  const router = useRouter();
  const { signOut } = useAuth();

  // State for toggles & Modals
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  
  // Modal states
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'help' | null>(null);

  const THEME = {
    dark: '#0F172A',
    sky: '#0EA5E9',
    textLight: '#E0F2FE',
    textMuted: '#94A3B8',
  };

  const showComingSoon = (feature: string) => {
    Alert.alert("Coming Soon", `${feature} is currently in development for the next iCare update.`);
  };

  const SettingRow = ({ icon, label, type = 'chevron', value, onValueChange, onPress }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress} 
      disabled={type === 'switch'}
      activeOpacity={0.7}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={THEME.sky} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      
      {type === 'chevron' && (
        <Ionicons name="chevron-forward" size={20} color={THEME.textMuted} />
      )}

      {type === 'switch' && (
        <Switch
          trackColor={{ false: '#CBD5E1', true: '#BAE6FD' }}
          thumbColor={value ? THEME.sky : '#F4F4F5'}
          onValueChange={onValueChange}
          value={value}
        />
      )}
    </TouchableOpacity>
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
          <View style={{ width: 40 }} /> 
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
              onValueChange={() => showComingSoon("Biometric Authentication")} 
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="lock-closed-outline" 
              label="Change Password" 
              onPress={() => router.push('/forgot-password')} 
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="document-text-outline" 
              label="Privacy Policy" 
              onPress={() => setModalType('privacy')}
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="shield-checkmark-outline" 
              label="Terms of Service" 
              onPress={() => setModalType('terms')}
            />
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
              onValueChange={() => showComingSoon("Marketing Preferences")} 
            />
          </View>

          {/* SUPPORT SECTION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Support</Text>
            <SettingRow 
              icon="help-circle-outline" 
              label="Help Center" 
              onPress={() => setModalType('help')}
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="chatbubble-ellipses-outline" 
              label="Contact Support" 
              onPress={() => showComingSoon("Live Chat Support")}
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

          <Text style={styles.versionText}>Version 1.0.0 • Developed by KadobiTech</Text>

        </ScrollView>

        {/* UNIVERSAL MODAL SYSTEM */}
        <Modal visible={!!modalType} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'privacy' && "Privacy Policy"}
                {modalType === 'terms' && "Terms of Service"}
                {modalType === 'help' && "Help Center"}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close-circle" size={30} color={THEME.dark} />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalBody}>
              {modalType === 'privacy' && (
                <>
                  <Text style={styles.policyHeading}>1. Information We Collect</Text>
                  <Text style={styles.policyText}>We collect personal information including name, contact details, and medical history to provide healthcare services in Lusaka and beyond.</Text>
                  <Text style={styles.policyHeading}>2. How We Use Data</Text>
                  <Text style={styles.policyText}>Your data is strictly used for telemedicine routing and medical record management. We do not sell data to third parties.</Text>
                </>
              )}

              {modalType === 'terms' && (
                <>
                  <Text style={styles.policyHeading}>1. Acceptance of Terms</Text>
                  <Text style={styles.policyText}>By using iCare, you agree to comply with our healthcare regulations and safety protocols for remote consultations.</Text>
                  <Text style={styles.policyHeading}>2. User Conduct</Text>
                  <Text style={styles.policyText}>Users must provide accurate medical history. Misrepresentation of identity or health status is strictly prohibited.</Text>
                </>
              )}

              {modalType === 'help' && (
                <>
                  <Text style={styles.policyHeading}>Common Questions</Text>
                  <Text style={styles.policyText}>• How do I book a doctor?{"\n"}Go to the Dashboard and select "Book Consultation".</Text>
                  <Text style={styles.policyText}>• Is my payment secure?{"\n"}Yes, all transactions are handled via KadobiPay orchestration layers with bank-grade security.</Text>
                </>
              )}
              
              <Text style={styles.policyFooter}>Last Updated: May 2026</Text>
            </ScrollView>
          </View>
        </Modal>

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
  sectionCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 5 },
  logoutBtn: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.15)', height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, gap: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  logoutText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  versionText: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: 20, fontSize: 12 },
  
  // Modal Styles
  modalContent: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalBody: { padding: 20 },
  policyHeading: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 15, marginBottom: 5 },
  policyText: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 10 },
  policyFooter: { fontSize: 12, color: '#94A3B8', marginTop: 30, textAlign: 'center', marginBottom: 50 },
});

export default SettingsScreen;