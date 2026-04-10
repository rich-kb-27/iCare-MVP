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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";

const FacilityDashboard = () => {
  const router = useRouter();
  const navigation = useNavigation();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [profile, setProfile] = useState<{ id: string; full_name: string; role: string } | null>(null);
  
  // Badge States
  const [hasUnreadNoti, setHasUnreadNoti] = useState(false);
  const [hasUnreadMsg, setHasUnreadMsg] = useState(false);

  /**
   * 1. Fetch Profile on Mount
   */
  useEffect(() => {
    getProfile();
  }, []);

  /**
   * 2. Real-time Listeners
   * Sets up subscriptions as soon as the profile ID is available
   */
  useEffect(() => {
    console.log("Checking profile ID for Realtime:", profile?.id);
    if (!profile?.id) return;

    // Initial check when user logs in
    checkAllUnreads();

    // Listen for Notification changes (New inserts or status updates)
    const notiChannel = supabase
      .channel(`user-notifications-${profile.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${profile.id}` 
        },
        () => checkAllUnreads()
      )
      .subscribe();

    // Listen for Message changes
    const msgChannel = supabase
      .channel(`user-messages-${profile.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages', 
          filter: `receiver_id=eq.${profile.id}` 
        },
        () => checkAllUnreads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notiChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [profile?.id]);

  const checkAllUnreads = async () => {
    if (!profile?.id) return;

    // Count unread notifications
    const { count: notiCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);

    // Count unread messages
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', profile.id)
      .eq('is_read', false);

    setHasUnreadNoti((notiCount ?? 0) > 0);
    setHasUnreadMsg((msgCount ?? 0) > 0);
  };

  async function getProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        let { data, error } = await supabase
          .from("profiles")
          .select(`id, full_name, role`)
          .eq("id", user.id)
          .single();

        if (data) setProfile(data);
      }
    } catch (error) {
      console.error("Profile load error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>{profile?.role || "Facility"} Portal</Text>
              <Text style={styles.facilityName}>{profile?.full_name || "Facility Name"}</Text>
            </View>
            
            <View style={styles.headerActions}>
              {/* Messages Icon */}
              <TouchableOpacity 
                style={styles.actionIconBtn} 
                onPress={() => router.push("/messages")}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFF" />
                {hasUnreadMsg && <View style={styles.alertBadge} />}
              </TouchableOpacity>

              {/* Notifications Icon */}
              <TouchableOpacity 
                style={styles.actionIconBtn} 
                onPress={() => router.push("/notifications")}
              >
                <Ionicons name="notifications-outline" size={24} color="#FFF" />
                {hasUnreadNoti && <View style={styles.alertBadge} />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                <Ionicons name="menu-outline" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.toggleRow}>
              <View style={styles.statusBadge}>
                <View style={[styles.pulseDot, { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }]} />
                <Text style={styles.subtext}>{isOnline ? 'Accepting Patients' : 'Offline / At Capacity'}</Text>
              </View>
              <Switch
                trackColor={{ false: "#334155", true: "#0EA5E9" }}
                thumbColor={isOnline ? "#FFF" : "#F4F3F4"}
                onValueChange={() => setIsOnline(!isOnline)}
                value={isOnline}
              />
          </View>
        </View>

        {/* Traffic / Queue Overview */}
        <View style={styles.glassCard}>
          <View>
            <Text style={styles.statusLabel}>Physical Queue</Text>
            <Text style={styles.statusValue}>3 Active Referrals</Text>
          </View>
          <MaterialCommunityIcons name="hospital-marker" size={32} color="#7DD3FC" />
        </View>

        {/* Action Grid */}
        <View style={styles.actionsRow}>
          <ActionCard
            icon="people-outline"
            title="Check-ins"
            subtitle="Referral Queue"
            color="#10B981"
            onPress={() => router.push("/check-ins")} 
          />
          <ActionCard
            icon="cart-outline"
            title="Inventory"
            subtitle="Order Duniya"
            color="#0EA5E9"
            onPress={() => router.push("/inventory")}
          />
        </View>

        <View style={styles.actionsRow}>
          <ActionCard
            icon="flask-outline"
            title="Treatments"
            subtitle="Active Ops"
            color="#F59E0B"
            onPress={() => router.push("/treatments")}
          />
          <ActionCard
            icon="document-attach-outline"
            title="Reports"
            subtitle="Finalize Docs"
            color="#8B5CF6"
            onPress={() => router.push("/medical-reports")}
          />
        </View>

        {/* Pending Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Execution</Text>
          <TouchableOpacity 
            style={styles.patientItem}
            onPress={() => router.push("/treatments")}
          >
            <View style={styles.patientInfo}>
              <View style={[styles.avatar, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.avatarText}>MK</Text>
              </View>
              <View>
                <Text style={styles.patientName}>Mwansa Kapiri</Text>
                <Text style={styles.patientAction}>Awaiting Lab Result</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#7DD3FC" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </LinearGradient>
  );
};

/* ---------------- SUB-COMPONENTS ---------------- */
const ActionCard = ({ icon, title, subtitle, color, onPress }: any) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.iconWrapper}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", backgroundColor: "#0F172A" },
  scroll: { padding: 20, paddingBottom: 100 },
  header: { marginTop: Platform.OS === 'ios' ? 40 : 20, marginBottom: 25 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionIconBtn: { 
    padding: 10, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 12,
    position: 'relative'
  },
  alertBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#0F172A'
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  menuButton: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 12, marginLeft: 4 },
  greeting: { color: "#BAE6FD", fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 },
  facilityName: { color: "#FFF", fontSize: 24, fontWeight: "800", marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  subtext: { fontSize: 13, color: "#7DD3FC", fontWeight: '500' },
  
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statusLabel: { fontSize: 12, color: "#BAE6FD", textTransform: 'uppercase' },
  statusValue: { fontSize: 20, fontWeight: "700", color: "#FFF", marginTop: 4 },

  actionsRow: { flexDirection: "row", gap: 15, marginBottom: 15 },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconWrapper: { marginBottom: 15 },
  actionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  actionSubtitle: { fontSize: 11, marginTop: 4, color: "#64748B" },

  section: { marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#FFF", marginBottom: 15 },
  
  patientItem: { 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 20, 
    padding: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '800' },
  patientName: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  patientAction: { color: '#BAE6FD', fontSize: 12, marginTop: 2 },
});

export default FacilityDashboard;