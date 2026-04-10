import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, Image ,Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";
const { width } = Dimensions.get("window");

export default function SubscriberCheckup() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) fetchSubscribers();
  }, [user]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      // 1. Get the list of ACTIVE subscriptions for this doctor
      const { data: subs, error: subError } = await supabase
        .from("subscriptions")
        .select("patient_id, patient_name, plan_type, status")
        .eq("doctor_id", user?.id)
        .eq("status", "active"); // Ensures we only fetch active plans

      if (subError) throw subError;

      if (subs && subs.length > 0) {
        const patientIds = subs.map(s => s.patient_id);
        
        // 2. Get ACTUAL profile details (Name, Photo, Contact) from Profiles table
        const { data: profiles, error: profError } = await supabase
          .from("profiles")
          .select("id, email, phone, full_name, avatar_url")
          .in("id", patientIds);

        if (profError) throw profError;

        // 3. Merge them manually (Manual Join)
        const mergedData = subs.map(sub => {
          const profile = profiles?.find(p => p.id === sub.patient_id);
          return {
            ...sub,
            // Priority: Actual Profile Name > Subscription Table Name
            displayName: profile?.full_name || sub.patient_name || "Unknown Patient",
            avatar: profile?.avatar_url || null,
            profileDetails: profile || null
          };
        });

        setSubscribers(mergedData);
      } else {
        setSubscribers([]);
      }
    } catch (e: any) {
      console.error("Manual Fetch Error:", e.message);
      Alert.alert("Sync Error", "Could not load patient profiles.");
    } finally {
      setLoading(false);
    }
  };

  const renderSubscriber = ({ item }: any) => (
    <View style={styles.patientCard}>
      <View style={styles.cardHeader}>
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.initials}>{item.displayName?.[0] || "P"}</Text>
              </View>
            )}
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.patientName} numberOfLines={1}>{item.displayName}</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>{item.plan_type?.toUpperCase() || "STANDARD"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Details */}
      <View style={styles.contactInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>{item.profileDetails?.phone || "No phone linked"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>{item.profileDetails?.email || "No email linked"}</Text>
        </View>
      </View>

      {/* Start Call Button */}
      <TouchableOpacity 
        style={styles.callBtn}
        onPress={() => {
          const callId = Math.random().toString(36).substring(7);
          router.push({
            pathname: "/(freelancer-dashboard)/video-call",
            params: { 
              patientId: item.patient_id, 
              patientName: item.displayName,
              callId: callId 
            }
          });
        }}
      >
        <LinearGradient colors={["#0EA5E9", "#2563EB"]} style={styles.btnGradient}>
          <MaterialCommunityIcons name="video" size={20} color="#FFF" />
          <Text style={styles.btnText}>Start Checkup</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
               <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Subscribed Patients</Text>
            <View style={{ width: 40 }} /> 
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FFF" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={subscribers}
              keyExtractor={(item) => item.patient_id}
              renderItem={renderSubscriber}
              contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="account-search-outline" size={60} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>No active subscribers found.</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 10 
  },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  backBtn: { padding: 5 },
  patientCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 48, height: 48, borderRadius: 14, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { 
    width: 48, height: 48, borderRadius: 14, 
    backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#BAE6FD'
  },
  initials: { color: '#0EA5E9', fontWeight: '800', fontSize: 18 },
  patientName: { fontSize: 18, fontWeight: '800', color: '#0F172A', width: width * 0.5 },
  planBadge: { backgroundColor: '#F0F9FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  planText: { color: '#0EA5E9', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  contactInfo: { marginTop: 15, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 15, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  callBtn: { marginTop: 15, borderRadius: 16, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: 'rgba(255,255,255,0.6)', marginTop: 10, fontSize: 16 },
});