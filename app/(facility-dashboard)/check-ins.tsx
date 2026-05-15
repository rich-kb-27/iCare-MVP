import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

interface CheckIn {
  id: string;
  status: "pending" | "seen";
  created_at: string;
  reason_for_visit: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const CheckInsScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "seen">("pending");

  // --- Stats Calculations ---
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const totalToday = requests.length;
  const seenToday = requests.filter((r) => r.status === "seen").length;

  useEffect(() => {
    fetchActiveRequests();

    const channel = supabase
      .channel("facility_incoming")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "check_ins" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            fetchActiveRequests();
          } else if (payload.eventType === "UPDATE") {
            setRequests((prev) =>
              prev.map((req) => (req.id === payload.new.id ? { ...req, ...payload.new } : req))
            );
          } else if (payload.eventType === "DELETE") {
            setRequests((prev) => prev.filter((req) => req.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("check_ins")
        .select(`
          *,
          profiles!check_ins_patient_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("facility_id", user?.id)
        .in("status", ["pending", "seen"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const approveCheckIn = async (id: string) => {
    const originalRequests = [...requests];
    // Optimistic UI Update
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "seen" } : req))
    );

    try {
      const { error } = await supabase
        .from("check_ins")
        .update({ status: "seen" })
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      setRequests(originalRequests);
      Alert.alert("Network Error", "Could not approve at this time.");
    }
  };

  const renderCheckInItem = ({ item }: { item: CheckIn }) => {
    const isPending = item.status === "pending";
    const patientProfile = item.profiles;

    return (
      <View style={styles.checkInCard}>
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: isPending ? "#F59E0B" : "#10B981" }]}>
            <Text style={styles.typeText}>{item.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.timeText}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.patientRow}>
          {patientProfile?.avatar_url ? (
            <Image source={{ uri: patientProfile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{patientProfile?.full_name?.charAt(0) || "P"}</Text>
            </View>
          )}
          <Text style={styles.patientName}>{patientProfile?.full_name || "Patient"}</Text>
        </View>

        <View style={styles.managerRow}>
          <Ionicons name="person-outline" size={14} color="#7DD3FC" />
          <Text style={styles.managedByText}>Self Check-in</Text>
        </View>

        <View style={styles.reasonContainer}>
          <Text style={styles.reasonHeader}>Reason for Visit:</Text>
          <Text style={styles.reasonText}>{item.reason_for_visit}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          {isPending ? (
            <TouchableOpacity style={styles.approveBtn} onPress={() => approveCheckIn(item.id)}>
              <Text style={styles.approveBtnText}>ACCEPT REQUEST</Text>
              <Ionicons name="checkmark-circle" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.openToolsBtn} onPress={() => router.push(`/check-ins/${item.id}`)}>
              <Text style={styles.openToolsText}>OPEN CONSULTATION</Text>
              <Ionicons name="chevron-forward" size={18} color="#0EA5E9" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const filteredData = requests.filter(r => 
    r.status === activeTab && 
    r.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#E0F2FE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Intake & Check-ins</Text>
        </View>

        {/* Progress Overview - NEW */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL CHECK-INS</Text>
            <View style={styles.statValueContainer}>
              <Ionicons name="people" size={18} color="#0EA5E9" />
              <Text style={styles.statValue}>{totalToday}</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SEEN & PROCESSED</Text>
            <View style={styles.statValueContainer}>
              <Ionicons name="checkmark-done-circle" size={18} color="#10B981" />
              <Text style={styles.statValue}>{seenToday}</Text>
            </View>
          </View>
        </View>

        <View style={styles.scannerSection}>
          <TouchableOpacity style={styles.scanButton}>
            <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFF" />
            <View style={styles.scanTextContainer}>
              <Text style={styles.scanTitle}>Verify Check-in</Text>
              <Text style={styles.scanSub}>Scan Doctor's Referral or User ID</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#7DD3FC" />
            <TextInput 
              placeholder="Search active patients..." 
              style={styles.searchInput}
              placeholderTextColor="#94A3B8"
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'pending' && styles.activeTab]} 
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>PENDING</Text>
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'seen' && styles.activeTab]} 
              onPress={() => setActiveTab('seen')}
            >
              <Text style={[styles.tabText, activeTab === 'seen' && styles.activeTabText]}>SEEN / ACTIVE</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id}
              renderItem={renderCheckInItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No patients in this category.</Text>}
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  header: { padding: 20, flexDirection: "row", alignItems: "center" },
  backButton: { marginRight: 15 },
  headerTitle: { color: "#FFF", fontSize: 22, fontWeight: "800" },
  
  // Stats Bar
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 5,
  },
  statCard: { alignItems: "center", flex: 1 },
  statDivider: { width: 1, height: "60%", backgroundColor: "rgba(255,255,255,0.1)" },
  statLabel: { color: "#94A3B8", fontSize: 8, fontWeight: "900", letterSpacing: 1, marginBottom: 4 },
  statValueContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  statValue: { color: "#FFF", fontSize: 20, fontWeight: "900" },

  scannerSection: { padding: 20 },
  scanButton: { 
    backgroundColor: "#0EA5E9", 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 20, 
    borderRadius: 24, 
    elevation: 10,
    shadowColor: "#0EA5E9",
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  scanTextContainer: { marginLeft: 15 },
  scanTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  scanSub: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  listContainer: { flex: 1, paddingHorizontal: 20 },
  searchBar: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "rgba(255,255,255,0.08)", 
    padding: 12, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.1)", 
    marginBottom: 15 
  },
  searchInput: { marginLeft: 10, flex: 1, color: "#FFF" },
  
  tabContainer: { 
    flexDirection: "row", 
    marginBottom: 20, 
    backgroundColor: "rgba(255,255,255,0.05)", 
    borderRadius: 15, 
    padding: 5 
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 12, 
    borderRadius: 12,
    gap: 8
  },
  activeTab: { backgroundColor: "#0EA5E9" },
  tabText: { color: "#94A3B8", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  activeTabText: { color: "#FFF" },
  badge: { 
    backgroundColor: "#EF4444", 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center'
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "900" },

  listContent: { paddingBottom: 40 },
  checkInCard: { 
    backgroundColor: "rgba(255,255,255,0.08)", 
    borderRadius: 22, 
    padding: 16, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.05)" 
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 9, fontWeight: "900", color: "#FFF" },
  timeText: { fontSize: 12, color: "#7DD3FC" },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: { width: 45, height: 45, borderRadius: 14 },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#0B3C5D', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  patientName: { fontSize: 19, fontWeight: "700", color: "#FFF" },
  managerRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  managedByText: { fontSize: 13, color: "#BAE6FD", fontWeight: "500" },
  reasonContainer: { marginTop: 12, backgroundColor: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 12 },
  reasonHeader: { fontSize: 10, color: "#7DD3FC", textTransform: "uppercase", fontWeight: "700" },
  reasonText: { fontSize: 14, color: "#E2E8F0", marginTop: 2, fontWeight: "500" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  approveBtn: { backgroundColor: "#10B981", flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 12, gap: 10 },
  approveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  openToolsBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  openToolsText: { color: '#0EA5E9', fontWeight: '800', fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontSize: 14 },
});

export default CheckInsScreen;