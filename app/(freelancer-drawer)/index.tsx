import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Switch,
  ActivityIndicator,
  Image,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const formatTime = (isoString: string) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });
};

const QUICK_ACTIONS = [
  { id: "1", name: "Prescriptions", icon: "pill", color: "#0EA5E9", route: "/(freelancer-dashboard)/prescription" },
  { id: "2", name: "Facility Checkin", icon: "hospital", color: "#8B5CF6", route: "/(freelancer-dashboard)/lab-reports" },
  { id: "3", name: "Subscribers", icon: "account-star", color: "#10B981", route: "/(freelancer-dashboard)/patients" },
  { id: "4", name: "Schedules", icon: "calendar-clock", color: "#F59E0B", route: "/(freelancer-dashboard)/schedules" },
];

const DoctorDashboard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const navigation = useNavigation();
  const { user, role, loading: authLoading } = useAuth();

  const [isActive, setIsActive] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", specialization: "", avatar_url: "" });
  const [stats, setStats] = useState({ slots: "0", subs: "0" });
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [patientAvatar, setPatientAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  // --- STABLE FETCH FUNCTION ---
  const fetchDashboardData = useCallback(async () => {
    try {
      if (!user) return;

      const now = new Date().toISOString();
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      // 1. Fetch Doctor Profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, specialization, avatar_url, is_online")
        .eq("id", user.id)
        .maybeSingle();

      if (prof) {
        setProfile({
          full_name: prof.full_name,
          specialization: prof.specialization,
          avatar_url: prof.avatar_url,
        });
        setIsActive(prof.is_online ?? false);
      }

      // 2. Stats & BADGE COUNTS - Filtered by "NOW" to keep it real-time
      const [subRes, slotRes, msgRes, notifRes] = await Promise.all([
        supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("doctor_id", user.id).eq("status", "active"),
        supabase.from("schedules")
          .select("*", { count: "exact", head: true })
          .eq("doctor_id", user.id)
          .gte("start_time", now) // Changed from startOfToday to now
          .lte("start_time", endOfToday.toISOString()),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
      ]);

      setStats({
        subs: subRes.count?.toString() || "0",
        slots: slotRes.count?.toString() || "0",
      });
      setUnreadChatCount(msgRes.count || 0);
      setAlertCount(notifRes.count || 0);

      // 3. Next Appointment
      const { data: upcoming } = await supabase
        .from("schedules")
        .select("id, patient_id, patient_name, start_time, doctor_notes")
        .eq("doctor_id", user.id)
        .not("patient_id", "is", null) 
        .gte("start_time", now) // Ensure it's in the future
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextAppointment(upcoming);

      if (upcoming?.patient_id) {
        const { data: pAvatar } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", upcoming.patient_id)
          .maybeSingle();
        setPatientAvatar(pAvatar?.avatar_url || null);
      } else {
        setPatientAvatar(null);
      }

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // --- REAL-TIME, APPSTATE, & TIME TICKER SYNC ---
  useEffect(() => {
    if (!user) return;
    
    fetchDashboardData();

    // 1. DATABASE REAL-TIME LISTENERS
    const channelId = `doctor_dash_${user.id}_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "schedules", 
          filter: `doctor_id=eq.${user.id}` 
      }, () => fetchDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, () => fetchDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchDashboardData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "calls", filter: `doctor_id=eq.${user.id}` }, (payload) => {
        if (payload.new.status === 'ringing') {
          router.push({
            pathname: "/(freelancer-dashboard)/incoming-call",
            params: { callId: payload.new.id, patientName: payload.new.patient_name, patientId: payload.new.patient_id },
          });
        }
      })
      .subscribe();

    // 2. TIME TICKER: Refresh every 60 seconds to clear out passed appointments automatically
    const timer = setInterval(() => {
        console.log("Minute tick: Checking for expired appointments...");
        fetchDashboardData();
    }, 60000);

    // 3. APP STATE SYNC
    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        fetchDashboardData();
      }
    });

    return () => { 
      supabase.removeChannel(channel); 
      appStateSub.remove();
      clearInterval(timer); // Clean up timer
    };
  }, [user, fetchDashboardData]);

  const toggleOnlineStatus = async (status: boolean) => {
    try {
      setIsActive(status);
      await supabase.from("profiles").update({ is_online: status }).eq("id", user?.id);
    } catch (err) {
      setIsActive(!status);
    }
  };

  if (authLoading || (loading && !nextAppointment)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#202f52" }}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          
          <View style={styles.topBar}>
            <View>
              <Text style={styles.logoText}>iCare</Text>
              <Text style={styles.roleText}>{role || "Medical"} Console</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <Ionicons name="menu-outline" size={30} color="#E0F2FE" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}><FontAwesome5 name="user-md" size={26} color="#0EA5E9" /></View>
                  )}
                  <View style={[styles.activeIndicator, { backgroundColor: isActive ? "#10B981" : "#94A3B8" }]} />
                </View>
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.welcomeText}>Good Day,</Text>
                  <Text style={styles.doctorName}>Dr. {profile.full_name || "Doctor"}</Text>
                  <Text style={styles.specialtyText}>{profile.specialization || "General Practitioner"}</Text>
                </View>
              </View>
              <View style={styles.statusSection}>
                <Text style={[styles.statusText, { color: isActive ? "#10B981" : "#94A3B8" }]}>{isActive ? "ACTIVE & READY" : "OFFLINE"}</Text>
                <Switch trackColor={{ false: "#334155", true: "#0EA5E9" }} thumbColor={isActive ? "#FFF" : "#F4F4F5"} onValueChange={toggleOnlineStatus} value={isActive} />
              </View>
            </View>

            <View style={styles.quickActionsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionScroll}>
                {QUICK_ACTIONS.map((action) => (
                  <TouchableOpacity key={action.id} style={styles.actionCard} onPress={() => router.push(action.route as any)}>
                    <View style={styles.actionIconBox}><MaterialCommunityIcons name={action.icon as any} size={26} color="#FFF" /></View>
                    <Text style={styles.actionLabel}>{action.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.statsGrid}>
              <StatBox icon="calendar-check" label="Slots Left Today" value={stats.slots} color="#0EA5E9" />
              <StatBox icon="bell-ring" label="Alerts" value={alertCount > 0 ? alertCount.toString() : "0"} color="#F43F5E" />
              <StatBox icon="account-group" label="Subscribers" value={stats.subs} color="#10B981" />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Next Appointment</Text>
              <TouchableOpacity onPress={() => router.push("/(freelancer-dashboard)/schedules" as any)}><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
            </View>

            {nextAppointment ? (
              <View style={styles.patientCard}>
                <View style={styles.patientTop}>
                  <View style={styles.patientInfo}>
                    <View style={styles.patientAvatar}>
                        {patientAvatar ? (
                          <Image source={{ uri: patientAvatar }} style={{width: 45, height: 45, borderRadius: 15}} />
                        ) : (
                          <Text style={styles.avatarInitial}>{nextAppointment.patient_name?.charAt(0) || "P"}</Text>
                        )}
                    </View>
                    <View style={{marginLeft: 12}}>
                      <Text style={styles.patientName}>{nextAppointment.patient_name || "Patient"}</Text>
                      <Text style={styles.patientDetail}>Zambia • <Text style={{color: '#10B981', fontWeight: '700'}}>Confirmed</Text></Text>
                    </View>
                  </View>
                  <View style={styles.timeTag}><Text style={styles.timeText}>{formatTime(nextAppointment.start_time)}</Text></View>
                </View>

                <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>APPOINTMENT REASON / NOTES</Text>
                    <Text style={styles.notesText} numberOfLines={2}>{nextAppointment.doctor_notes || "General medical consultation."}</Text>
                </View>

                <View style={styles.divider} />
                <View style={styles.patientBottom}>
                    <View style={{flex: 1}}><Text style={styles.issueLabel}>Type</Text><Text style={styles.issueText}>Tele-Consultation</Text></View>
                    <TouchableOpacity style={styles.videoBtn} onPress={() => router.push({ pathname: "/(freelancer-dashboard)/chat/[id]" as any, params: { id: nextAppointment.patient_id, name: nextAppointment.patient_name } })}>
                       <Ionicons name="chatbubbles" size={20} color="#FFF" /><Text style={styles.videoBtnText}>Message</Text>
                    </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <MaterialCommunityIcons name="calendar-blank" size={40} color="#CBD5E1" />
                <Text style={styles.emptyStateText}>No upcoming appointments today</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.bottomTabs}>
            <TabItem icon="home" label="Home" active={pathname.includes("dashboard")} onPress={() => router.push("/(freelancer-drawer)" as any)} />
            <View>
              <TabItem icon="notifications" label="Alerts" onPress={() => router.push("/(freelancer-dashboard)/alerts" as any)} />
              {alertCount > 0 && <View style={styles.tabBadge}><Text style={styles.badgeText}>{alertCount}</Text></View>}
            </View>
            <View style={styles.middleTabContainer}>
              <TouchableOpacity style={styles.middleButton} onPress={() => router.push("/(freelancer-dashboard)/checkup" as any)}>
                <MaterialCommunityIcons name="stethoscope" size={30} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View>
              <TabItem icon="chatbubble-ellipses" label="Chat" onPress={() => router.push("/(freelancer-dashboard)/chat" as any)} />
              {unreadChatCount > 0 && <View style={styles.tabBadge}><Text style={styles.badgeText}>{unreadChatCount}</Text></View>}
            </View>
            <TabItem icon="person" label="Profile" onPress={() => router.push("/(freelancer-drawer)/profile" as any)} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const StatBox = ({ icon, label, value, color }: any) => (
  <View style={styles.statBox}>
    <MaterialCommunityIcons name={icon} size={22} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TabItem = ({ icon, label, active = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.6}>
    <Ionicons name={active ? icon : (`${icon}-outline` as any)} size={24} color={active ? "#0EA5E9" : "#94A3B8"} />
    <Text style={[styles.tabText, active && { color: "#0EA5E9" }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#0F172A' },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  logoText: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  roleText: { color: '#BAE6FD', fontSize: 12, fontWeight: '600', marginTop: -4 },
  scroll: { paddingBottom: 130 },
  profileCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 24, padding: 20, marginHorizontal: 20, marginTop: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatarImage: { width: 55, height: 55, borderRadius: 18, borderWidth: 2, borderColor: '#FFF' },
  avatarPlaceholder: { width: 55, height: 55, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  activeIndicator: { position: 'absolute', bottom: -2, right: -2, width: 15, height: 15, borderRadius: 7.5, borderWidth: 2, borderColor: '#0B3C5D' },
  welcomeText: { color: '#BAE6FD', fontSize: 13 },
  doctorName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  specialtyText: { color: '#BAE6FD', fontSize: 12, opacity: 0.8 },
  statusSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  statusText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  quickActionsContainer: { marginTop: 20 },
  actionScroll: { paddingLeft: 20, gap: 15 },
  actionCard: { alignItems: 'center', width: 90 },
  actionIconBox: { width: 60, height: 60, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  actionLabel: { color: '#FFF', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  statsGrid: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginVertical: 20 },
  statBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 15, alignItems: 'center', elevation: 5 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 5 },
  statLabel: { fontSize: 10, color: '#64748B', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 15, alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  viewAll: { color: '#BAE6FD', fontSize: 13 },
  patientCard: { backgroundColor: '#FFF', borderRadius: 24, marginHorizontal: 20, padding: 20, elevation: 10 },
  patientTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#0EA5E9' },
  avatarInitial: { color: '#0EA5E9', fontWeight: '800' },
  patientName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  patientDetail: { fontSize: 11, color: '#64748B' },
  timeTag: { backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  timeText: { color: '#0EA5E9', fontSize: 12, fontWeight: '700' },
  notesContainer: { marginTop: 15, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  notesLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  notesText: { fontSize: 12, color: '#475569', lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  patientBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  issueLabel: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  issueText: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
  videoBtn: { backgroundColor: '#0EA5E9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, gap: 8 },
  videoBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  emptyStateCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, marginHorizontal: 20, padding: 40, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  emptyStateText: { color: '#94A3B8', marginTop: 10, fontWeight: '600' },
  bottomTabs: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 75, backgroundColor: '#FFF', borderRadius: 30, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  tabItem: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  tabText: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
  middleTabContainer: { marginTop: -45 },
  middleButton: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center', borderWidth: 5, borderColor: '#FFF', shadowColor: '#0EA5E9', shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
  tabBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
}); 

export default DoctorDashboard;