import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function FacilityDashboard() {
  const router = useRouter();
  const navigation = useNavigation();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);
  const [pendingCheckIns, setPendingCheckIns] = useState<any[]>([]);

  // Helper check for Dynamic Rendering - now using facility_type
  const isPharmacy = profile?.facility_type?.toLowerCase() === "pharmacy";

  // --- 1. DATA ENGINE ---
  const fetchDashboardStats = useCallback(async (userId: string) => {
    try {
      const [msgRes, notiRes, checkInRes] = await Promise.all([
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", userId)
          .eq("is_read", false),
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_read", false),
        supabase
          .from("check_ins")
          .select("*, profiles:patient_id(full_name)")
          .eq("facility_id", userId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(3)
      ]);

      setUnreadMsgCount(msgRes.count || 0);
      setUnreadNotiCount(notiRes.count || 0);
      setPendingCheckIns(checkInRes.data || []);
    } catch (err) {
      console.error("Stat sync error:", err);
    }
  }, []);

  // --- 2. INITIALIZATION & REAL-TIME ---
  useEffect(() => {
    let syncChannel: any;

    const setupDashboard = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // CRITICAL FIX: Added facility_type to the select query
          const { data: profData } = await supabase
            .from("profiles")
            .select("id, full_name, role, facility_type")
            .eq("id", user.id)
            .single();

          if (profData) {
            setProfile(profData);
            await fetchDashboardStats(profData.id);

            syncChannel = supabase
              .channel(`facility_hub_${profData.id}`)
              .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${profData.id}` },
                () => fetchDashboardStats(profData.id)
              )
              .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${profData.id}` },
                () => fetchDashboardStats(profData.id)
              )
              .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "check_ins", filter: `facility_id=eq.${profData.id}` },
                () => fetchDashboardStats(profData.id)
              )
              .subscribe();
          }
        }
      } catch (err) {
        console.error("Dashboard Init Error:", err);
      } finally {
        setLoading(false);
      }
    };

    setupDashboard();
    return () => {
      if (syncChannel) supabase.removeChannel(syncChannel);
    };
  }, [fetchDashboardStats]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        <View style={styles.topBar}>
          <Text style={styles.logoText}>iCare</Text>
          <TouchableOpacity
            style={styles.hamburger}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Ionicons name="menu-outline" size={30} color="#E0F2FE" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <View style={styles.welcomeRow}>
              <View>
                <Text style={styles.greeting}>{profile?.role || "Facility"} Portal</Text>
                <Text style={styles.facilityName}>{profile?.full_name || "Medical Center"}</Text>
              </View>
              
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.actionIconBtn} 
                  onPress={() => router.push("/(facility-dashboard)/chat")}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFF" />
                  {unreadMsgCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadMsgCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionIconBtn} 
                  onPress={() => router.push("/notifications")}
                >
                  <Ionicons name="notifications-outline" size={24} color="#FFF" />
                  {unreadNotiCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadNotiCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.statusIndicator}>
                <View style={[styles.pulseDot, { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }]} />
                <Text style={styles.subtext}>{isOnline ? 'Online & Syncing' : 'Currently Offline'}</Text>
              </View>
              <Switch
                trackColor={{ false: "#334155", true: "#0EA5E9" }}
                thumbColor={"#FFF"}
                onValueChange={() => setIsOnline(!isOnline)}
                value={isOnline}
              />
            </View>
          </View>

          {/* SPONSORED ADS SECTION */}
          <TouchableOpacity 
            style={styles.adCard} 
            onPress={() => router.push("/inventory")} 
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["rgba(14, 165, 233, 0.15)", "rgba(15, 23, 42, 0.4)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.adGradient}
            >
              <View style={styles.adContent}>
                <View style={styles.adBadge}>
                  <Text style={styles.adBadgeText}>Sponsored</Text>
                </View>
                <Text style={styles.adTitle}>New Medical Supplies Available</Text>
                <Text style={styles.adDescription}>
                  Get 15% off on all surgical equipment this month from Duniya Logistics.
                </Text>
              </View>
              <MaterialCommunityIcons name="truck-delivery-outline" size={40} color="#7DD3FC" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.grid}>
            <ActionCard
              icon="people-outline"
              title="Check-ins"
              subtitle="Active Queue"
              color="#10B981"
              onPress={() => router.push("/check-ins")}
            />
            <ActionCard
              icon="cart-outline"
              title="Inventory"
              subtitle="Duniya Logistics"
              color="#0EA5E9"
              onPress={() => router.push("/inventory")}
            />
          </View>

          {/* DYNAMIC RENDERING: HIDE TREATMENTS & REPORTS FOR PHARMACY */}
          {!isPharmacy && (
            <View style={styles.grid}>
              <ActionCard
                icon="flask-outline"
                title="Treatments"
                subtitle="Op History"
                color="#F59E0B"
                onPress={() => router.push("/treatments")}
              />
              <ActionCard
                icon="document-text-outline"
                title="Reports"
                subtitle="Finalize Results"
                color="#8B5CF6"
                onPress={() => router.push("/medical-reports")}
              />
            </View>
          )}

          {/* DYNAMIC RENDERING: HIDE PRESCRIBE FOR PHARMACY */}
          <View style={styles.grid}>
            {!isPharmacy && (
              <ActionCard
                icon="create-outline"
                title="Prescribe"
                subtitle="Write New"
                color="#F43F5E"
                onPress={() => router.push("/write-prescription")}
              />
            )}
            <ActionCard
              icon="checkmark-circle-outline"
              title={isPharmacy ? "Approve Orders" : "Approve"}
              subtitle={isPharmacy ? "Verify Dispense" : "Verify Orders"}
              color="#06B6D4"
              onPress={() => router.push("/approve-prescription")}
            />
            {isPharmacy && <View style={{ flex: 1 }} />}
          </View>

          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>Pending Check-ins</Text>
              {pendingCheckIns.length > 0 && (
                <Text style={styles.subtext}>{pendingCheckIns.length} waiting</Text>
              )}
            </View>
            
            {pendingCheckIns.length === 0 ? (
              <View style={styles.taskCard}>
                <Text style={[styles.taskStatus, { textAlign: 'center', width: '100%' }]}>
                  No new check-ins at the moment.
                </Text>
              </View>
            ) : (
              pendingCheckIns.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.taskCard, { marginBottom: 12 }]} 
                  onPress={() => router.push("/check-ins")}
                >
                  <View style={styles.taskInfo}>
                    <View style={[styles.avatarBox, { backgroundColor: '#0EA5E9' }]}>
                      <Text style={styles.avatarText}>
                        {item.profiles?.full_name ? item.profiles.full_name[0] : 'P'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.taskName}>{item.profiles?.full_name || "New Patient"}</Text>
                      <Text style={styles.taskStatus}>
                        {item.reason_for_visit || "General Check-up"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#7DD3FC" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const ActionCard = ({ icon, title, subtitle, color, onPress }: any) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.cardIcon}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" },
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 10 
  },
  logoText: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  hamburger: { padding: 5 },
  scroll: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 25 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: "#BAE6FD", fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 },
  facilityName: { color: "#FFF", fontSize: 24, fontWeight: "800", marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 10 },
  actionIconBtn: { 
    padding: 10, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 15,
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B3C5D'
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  subtext: { fontSize: 13, color: "#7DD3FC", fontWeight: '500' },
  
  adCard: {
    marginHorizontal: 0,
    marginBottom: 25,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.2)',
  },
  adGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adContent: {
    flex: 1,
    marginRight: 15,
  },
  adBadge: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  adBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  adDescription: {
    fontSize: 12,
    color: '#BAE6FD',
    marginTop: 4,
    lineHeight: 16,
  },

  grid: { flexDirection: "row", gap: 15, marginBottom: 15 },
  card: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardIcon: { marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  cardSubtitle: { fontSize: 12, marginTop: 4, color: "#64748B" },

  section: { marginTop: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#FFF", marginBottom: 15 },
  taskCard: { 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 22, 
    padding: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  taskInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarBox: { width: 45, height: 45, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  taskName: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  taskStatus: { color: '#BAE6FD', fontSize: 12, marginTop: 2 },
});