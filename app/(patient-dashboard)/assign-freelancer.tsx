import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Image, Platform, Modal 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const PLANS = [
  { id: 'daily', label: '1 Day', dbValue: '1 Day ', price: 50, duration: 1, description: '24hr emergency access' },
  { id: 'weekly', label: '1 Week', dbValue: '1 Week', price: 250, duration: 7, description: 'Follow-ups & recovery' },
  { id: 'biweekly', label: '2 Weeks', dbValue: '2 Weeks', price: 450, duration: 14, description: 'Chronic care support' },
  { id: 'monthly', label: '1 Month', dbValue: '1 Month', price: 800, duration: 30, description: 'Full month cover' },
  { id: 'family', label: 'Full Family', dbValue: '1 Month Family', price: 1200, duration: 30, description: '1 Month full family coverage' },
];

const AssignFreelancer = () => {
  const { doctorId, doctorName, specialty, avatar } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + selectedPlan.duration);

      // Using UPSERT to handle the duplicate key issue automatically
      const { error } = await supabase.from('subscriptions').upsert(
        {
          doctor_id: doctorId,
          patient_id: user?.id,
          patient_name: "Thando", 
          plan_type: selectedPlan.dbValue,
          expiry_date: expiryDate.toISOString(),
          status: 'active'
        },
        { onConflict: 'doctor_id, patient_id' }
      );

      if (error) throw error;
      setShowSuccess(true);

    } catch (e: any) {
      alert("Payment Failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.topSection}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.doctorInfo}>
            <View style={styles.avatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar as string }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                   <MaterialCommunityIcons name="account" size={50} color="#0EA5E9" />
                </View>
              )}
              <View style={styles.onlineBadge} />
            </View>
            <Text style={styles.nameText}>Dr. {doctorName}</Text>
            <Text style={styles.specText}>{specialty}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.bottomSection}>
        <Text style={styles.sectionTitle}>Select Your Service Plan</Text>
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {PLANS.map((plan) => (
            <TouchableOpacity 
              key={plan.id} 
              onPress={() => setSelectedPlan(plan)}
              style={[
                styles.planCard, 
                selectedPlan.id === plan.id && styles.selectedPlanCard
              ]}
            >
              <View style={styles.planInfo}>
                <Text style={[styles.planLabel, selectedPlan.id === plan.id && {color: '#0EA5E9'}]}>
                    {plan.label} Access
                </Text>
                <Text style={styles.planDesc}>{plan.description}</Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.currency}>K</Text>
                <Text style={styles.price}>{plan.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity 
            style={styles.payBtn} 
            onPress={handleSubscribe}
            disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="wallet" size={22} color="#FFF" />
              <Text style={styles.payBtnText}>Pay K{selectedPlan.price} with KadobiPay</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* --- CUSTOM SUCCESS MODAL --- */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={styles.successCard}>
            <View style={styles.checkCircle}>
              <MaterialCommunityIcons name="check-bold" size={40} color="#FFF" />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successText}>
              You now have active coverage with Dr. {doctorName}. Your digital clinic is ready.
            </Text>
            
            <TouchableOpacity 
              style={styles.continueBtn} 
              onPress={() => {
                setShowSuccess(false);
                router.replace("/(patient-drawer)");
              }}
            >
              <Text style={styles.continueBtnText}>Enter Clinic</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  topSection: { paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  backBtn: { paddingHorizontal: 20, paddingTop: 10 },
  doctorInfo: { alignItems: 'center', marginTop: 5 },
  avatarContainer: { width: 100, height: 100, marginBottom: 15, position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#FFF' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  onlineBadge: { position: 'absolute', bottom: 5, right: 5, width: 18, height: 18, borderRadius: 9, backgroundColor: '#32d332', borderWidth: 3, borderColor: '#0B3C5D' },
  nameText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  specText: { color: '#BAE6FD', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  
  bottomSection: { flex: 1, padding: 25, marginTop: -20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  planCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', 
    marginBottom: 12, backgroundColor: '#F8FAFC'
  },
  selectedPlanCard: { borderColor: '#0EA5E9', backgroundColor: '#F0F9FF', borderWidth: 2 },
  planInfo: { flex: 1 },
  planLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  planDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  priceBox: { flexDirection: 'row', alignItems: 'flex-start' },
  currency: { fontSize: 12, fontWeight: '700', color: '#0EA5E9', marginTop: 4 },
  price: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  
  payBtn: { 
    backgroundColor: '#32d332', height: 65, borderRadius: 20, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    gap: 12, marginBottom: Platform.OS === 'ios' ? 20 : 10 
  },
  payBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },

  /* MODAL STYLES */
  modalOverlay: { 
    flex: 1, justifyContent: 'center', alignItems: 'center', 
    backgroundColor: 'rgba(2, 6, 23, 0.85)' 
  },
  successCard: { 
    width: '85%', backgroundColor: '#FFF', borderRadius: 30, 
    padding: 30, alignItems: 'center', elevation: 20, shadowColor: '#000', 
    shadowOpacity: 0.3, shadowRadius: 15 
  },
  checkCircle: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#32d332', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    shadowColor: '#32d332', shadowOpacity: 0.4, shadowRadius: 10
  },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
  successText: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  continueBtn: { 
    width: '100%', height: 55, backgroundColor: '#0F172A', 
    borderRadius: 15, justifyContent: 'center', alignItems: 'center' 
  },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});

export default AssignFreelancer;