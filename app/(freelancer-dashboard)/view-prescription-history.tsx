import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";

const ViewPrescriptionHistory = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { patientId } = useLocalSearchParams(); // Get patientId if passed

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchHistory();
  }, [user, patientId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("prescriptions")
        .select(`
          *,
          patient:profiles!patient_id (full_name, avatar_url)
        `)
        .eq("doctor_id", user?.id)
        .order("created_at", { ascending: false });

      // If we came from a specific patient, filter by their ID
      if (patientId) {
        query = query.eq("patient_id", patientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setHistory(data || []);
    } catch (e: any) {
      console.error("Error fetching history:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPrescriptionCard = ({ item }: { item: any }) => {
    const isExpired = new Date(item.expiry_date) < new Date();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.patientInfo}>
            <Image source={{ uri: item.patient?.avatar_url }} style={styles.miniAvatar} />
            <View>
              <Text style={styles.patientName}>{item.patient?.full_name}</Text>
              <Text style={styles.refId}>{item.reference_id}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, isExpired && styles.expiredBadge]}>
            <Text style={[styles.statusText, isExpired && styles.expiredText]}>
              {isExpired ? "EXPIRED" : item.status}
            </Text>
          </View>
        </View>

        <View style={styles.medicationRow}>
          <MaterialCommunityIcons name="pill" size={20} color="#0EA5E9" />
          <Text style={styles.medText}>{item.medication}</Text>
          <Text style={styles.dosageText}>{item.dosage}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
            <Text style={styles.detailText}>{item.duration} Days</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text style={styles.detailText}>Issued: {item.date}</Text>
          </View>
        </View>

        {item.instructions && (
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText} numberOfLines={2}>
              "{item.instructions}"
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={26} color="#FFF" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Prescription Log</Text>
              <Text style={styles.headerSub}>
                {patientId ? "Patient History" : "Complete Record"}
              </Text>
            </View>
            <TouchableOpacity onPress={fetchHistory} style={styles.backBtn}>
              <Ionicons name="reload" size={20} color="#0EA5E9" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#0EA5E9" />
              <Text style={styles.loadingText}>Fetching Records...</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderPrescriptionCard}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="file-search-outline" size={60} color="#1E293B" />
                  <Text style={styles.emptyText}>No prescriptions found.</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 15 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#0EA5E9', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  listContent: { padding: 20, paddingBottom: 50 },
  card: { backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#1E293B' },
  patientName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  refId: { color: '#475569', fontSize: 11, fontWeight: '600', marginTop: 2 },
  statusBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#10B981', fontSize: 10, fontWeight: '900' },
  expiredBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  expiredText: { color: '#EF4444' },
  medicationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  medText: { color: '#FFF', fontSize: 16, fontWeight: '700', flex: 1 },
  dosageText: { color: '#0EA5E9', fontSize: 14, fontWeight: '800' },
  detailsContainer: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  instructionBox: { backgroundColor: '#0F172A', padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#0EA5E9' },
  instructionText: { color: '#94A3B8', fontSize: 12, fontStyle: 'italic' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#475569', fontSize: 14, marginTop: 15, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#475569', fontSize: 16, marginTop: 20, fontWeight: '600' }
});

export default ViewPrescriptionHistory;