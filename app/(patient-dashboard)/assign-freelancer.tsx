import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const PLANS = [
  // Notice the '1 Day ' below has the space to match your DB exactly
  { id: 'daily', label: '1 Day', dbValue: '1 Day ', price: 50, duration: 1, description: '24hr emergency access' },
  { id: 'weekly', label: '1 Week', dbValue: '1 Week', price: 250, duration: 7, description: 'Follow-ups & recovery' },
  { id: 'biweekly', label: '2 Weeks', dbValue: '2 Weeks', price: 450, duration: 14, description: 'Chronic care support' },
  { id: 'monthly', label: '1 Month', dbValue: '1 Month', price: 800, duration: 30, description: 'Full family coverage' },
];

const AssignFreelancer = () => {
  const { doctorId, doctorName, specialty, avatar } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      
      // Calculate Expiry Date based on selected plan
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + selectedPlan.duration);

      const { error } = await supabase.from('subscriptions').insert([{
        doctor_id: doctorId,
        patient_id: user?.id,
        patient_name: "Thando", // This should ideally come from your profile state
        plan_type: selectedPlan.dbValue ,
        expiry_date: expiryDate.toISOString(),
        status: 'active'
      }]);

      if (error) throw error;

      Alert.alert(
        "Subscription Active", 
        `You now have access to Dr. ${doctorName} for ${selectedPlan.label}.`,
        [{ text: "Great!", onPress: () => router.push("/prescription") }]
      );

    } catch (e: any) {
      Alert.alert("Payment Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.topSection}>
        <SafeAreaView>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.doctorInfo}>
            <View style={styles.avatarCircle}>
              <FontAwesome5 name="user-md" size={40} color="#0EA5E9" />
            </View>
            <Text style={styles.nameText}>Dr. {doctorName}</Text>
            <Text style={styles.specText}>{specialty}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.bottomSection}>
        <Text style={styles.sectionTitle}>Select Your Service Plan</Text>
        
        <ScrollView showsVerticalScrollIndicator={false}>
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
              <MaterialCommunityIcons name="wallet" size={20} color="#FFF" />
              <Text style={styles.payBtnText}>Pay K{selectedPlan.price} with KadobiPay</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  topSection: { paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  backBtn: { padding: 20 },
  doctorInfo: { alignItems: 'center', marginTop: 10 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  nameText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  specText: { color: '#BAE6FD', fontSize: 14, fontWeight: '600' },
  
  bottomSection: { flex: 1, padding: 25, marginTop: -20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  planCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 12,
    backgroundColor: '#F8FAFC'
  },
  selectedPlanCard: { borderColor: '#0EA5E9', backgroundColor: '#F0F9FF', borderWidth: 2 },
  planInfo: { flex: 1 },
  planLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  planDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  priceBox: { flexDirection: 'row', alignItems: 'flex-start' },
  currency: { fontSize: 12, fontWeight: '700', color: '#0EA5E9', marginTop: 4 },
  price: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  
  payBtn: { backgroundColor: '#32d332', height: 65, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10 },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});

export default AssignFreelancer;