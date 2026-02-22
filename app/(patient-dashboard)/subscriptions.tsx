import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const SubscriptionScreen = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('Monthly');

  const FEATURES = [
    "Unlimited Video Consultations",
    "Instant Lab Report Analysis",
    "Priority Emergency Dispatch",
    "Health Data Cloud Storage",
    "Family Account Sharing (Up to 4)"
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>iCare Pro</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* HERO ICON */}
          <View style={styles.heroSection}>
            <View style={styles.crownCircle}>
              <MaterialCommunityIcons name="crown" size={50} color="#0EA5E9" />
            </View>
            <Text style={styles.heroTitle}>Upgrade Your Health</Text>
            <Text style={styles.heroSub}>Get full access to the KadobiTech medical network.</Text>
          </View>

          {/* FEATURES CARD */}
          <View style={styles.featuresCard}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={22} color="#0EA5E9" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* PLAN SELECTOR */}
          <View style={styles.planContainer}>
            <TouchableOpacity 
              style={[styles.planBox, selectedPlan === 'Monthly' && styles.activePlan]} 
              onPress={() => setSelectedPlan('Monthly')}
            >
              <Text style={[styles.planLabel, selectedPlan === 'Monthly' && styles.activePlanLabel]}>Monthly</Text>
              <Text style={[styles.planPrice, selectedPlan === 'Monthly' && styles.activePlanText]}>$19.99</Text>
              {selectedPlan === 'Monthly' && <Ionicons name="checkmark-circle" size={20} color="#0F172A" style={styles.checkIcon} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.planBox, selectedPlan === 'Annual' && styles.activePlan]} 
              onPress={() => setSelectedPlan('Annual')}
            >
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>SAVE 20%</Text>
              </View>
              <Text style={[styles.planLabel, selectedPlan === 'Annual' && styles.activePlanLabel]}>Annual</Text>
              <Text style={[styles.planPrice, selectedPlan === 'Annual' && styles.activePlanText]}>$189.99</Text>
              {selectedPlan === 'Annual' && <Ionicons name="checkmark-circle" size={20} color="#0F172A" style={styles.checkIcon} />}
            </TouchableOpacity>
          </View>

          {/* ACTION BUTTON */}
          <TouchableOpacity style={styles.subscribeBtn}>
            <Text style={styles.subscribeBtnText}>Upgrade Now</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Secure payment via KadobiTech Pay. Recurring billing. Cancel anytime in settings.
          </Text>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', textTransform: 'uppercase', letterSpacing: 1 },
  backBtn: { width: 40 },
  
  scroll: { paddingHorizontal: 25, paddingBottom: 60 },

  heroSection: { alignItems: 'center', marginVertical: 30 },
  crownCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.4)' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  heroSub: { fontSize: 14, color: '#BAE6FD', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },

  featuresCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 30 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 18 },
  featureText: { color: '#E0F2FE', fontSize: 15, fontWeight: '500' },

  planContainer: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  planBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: 'relative' },
  activePlan: { backgroundColor: '#FFF', borderColor: '#FFF' },
  planLabel: { fontSize: 12, fontWeight: '800', color: '#BAE6FD', textTransform: 'uppercase', marginBottom: 5 },
  activePlanLabel: { color: '#64748B' },
  planPrice: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  activePlanText: { color: '#0F172A' },
  checkIcon: { position: 'absolute', top: 10, right: 10 },
  
  saveBadge: { position: 'absolute', top: -10, alignSelf: 'center', backgroundColor: '#0EA5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  saveText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

  subscribeBtn: { backgroundColor: '#0EA5E9', height: 65, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 8, shadowColor: '#0EA5E9', shadowOpacity: 0.4, shadowRadius: 15 },
  subscribeBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  termsText: { textAlign: 'center', color: 'rgba(186, 230, 253, 0.4)', fontSize: 11, marginTop: 20, lineHeight: 16 }
});

export default SubscriptionScreen;