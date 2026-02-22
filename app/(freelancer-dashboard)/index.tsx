import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const QUICK_ACTIONS = [
  { id: "1", name: "Prescriptions", icon: "pill", color: "#0EA5E9" },
  { id: "2", name: "Lab Reports", icon: "test-tube", color: "#8B5CF6" },
  { id: "3", name: "Subscribers", icon: "account-star", color: "#10B981" },
  { id: "4", name: "Schedules", icon: "calendar-clock", color: "#F59E0B" },
];

const DoctorDashboard = () => {
  const navigation = useNavigation();
  const [isActive, setIsActive] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient 
        colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} 
        style={styles.container}
      >
        {/* --- TOP NAV --- */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.logoText}>iCare</Text>
            <Text style={styles.roleText}>Doctor Console</Text>
          </View>
          <TouchableOpacity
            style={styles.hamburger}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Ionicons name="menu-outline" size={30} color="#E0F2FE" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* --- DOCTOR PROFILE & STATUS TOGGLE --- */}
          <View style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarPlaceholder}>
                <FontAwesome5 name="user-md" size={30} color="#0EA5E9" />
              </View>
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.welcomeText}>Good Day,</Text>
                <Text style={styles.doctorName}>Dr. Thando</Text>
                <Text style={styles.specialtyText}>Cardiologist</Text>
              </View>
            </View>
            
            <View style={styles.statusSection}>
              <Text style={[styles.statusText, { color: isActive ? "#10B981" : "#94A3B8" }]}>
                {isActive ? "ACTIVE" : "OFFLINE"}
              </Text>
              <Switch
                trackColor={{ false: "#334155", true: "#0EA5E9" }}
                thumbColor={isActive ? "#FFF" : "#F4F4F5"}
                onValueChange={() => setIsActive(!isActive)}
                value={isActive}
              />
            </View>
          </View>

          {/* --- HORIZONTAL QUICK ACTIONS (New Section) --- */}
          <View style={styles.quickActionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionScroll}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity key={action.id} style={styles.actionCard}>
                  <View style={[styles.actionIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <MaterialCommunityIcons name={action.icon as any} size={26} color="#FFF" />
                  </View>
                  <Text style={styles.actionLabel}>{action.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* --- METRICS ROW --- */}
          <View style={styles.statsGrid}>
            <StatBox icon="calendar-check" label="Today's Slots" value="08" color="#0EA5E9" />
            <StatBox icon="bell-ring" label="Booking Req." value="04" color="#F43F5E" />
            <StatBox icon="account-group" label="Subscribers" value="128" color="#10B981" />
          </View>

          {/* --- ACTIVE CONSULTATION / QUEUE --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Consultation</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View Queue</Text></TouchableOpacity>
          </View>

          <View style={styles.patientCard}>
            <View style={styles.patientTop}>
              <View style={styles.patientInfo}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.avatarInitial}>JM</Text>
                </View>
                <View>
                  <Text style={styles.patientName}>John Mwale</Text>
                  <Text style={styles.patientDetail}>Subscription: <Text style={{color: '#10B981', fontWeight: '700'}}>Premium</Text></Text>
                </View>
              </View>
              <View style={styles.timeTag}>
                <Text style={styles.timeText}>10:30 AM</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.patientBottom}>
               <View style={{flex: 1}}>
                  <Text style={styles.issueLabel}>Reason for Visit</Text>
                  <Text style={styles.issueText}>Post-surgery chest discomfort</Text>
               </View>
               <TouchableOpacity style={styles.videoBtn}>
                  <Ionicons name="videocam" size={20} color="#FFF" />
                  <Text style={styles.videoBtnText}>Start Call</Text>
               </TouchableOpacity>
            </View>
          </View>

        </ScrollView>

        {/* --- BOTTOM TABS (Matching User UI) --- */}
        <View style={styles.bottomTabs}>
          <TabItem icon="home" label="Home" active />
          <TabItem icon="notifications" label="Alerts" />
          
          <View style={styles.middleTabContainer}>
            <TouchableOpacity style={styles.middleButton}>
              <MaterialCommunityIcons name="stethoscope" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TabItem icon="chatbubble-ellipses" label="Chat" />
          <TabItem icon="person" label="Profile" />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

/* --- SUB-COMPONENTS --- */

const StatBox = ({ icon, label, value, color }: any) => (
  <View style={styles.statBox}>
    <MaterialCommunityIcons name={icon} size={22} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TabItem = ({ icon, label, active = false }: any) => (
  <TouchableOpacity style={styles.tabItem}>
    <Ionicons name={active ? icon : `${icon}-outline`} size={24} color={active ? "#0EA5E9" : "#94A3B8"} />
    <Text style={[styles.tabText, active && { color: "#0EA5E9" }]}>{label}</Text>
  </TouchableOpacity>
);

/* --- STYLES --- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  logoText: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  roleText: { color: '#BAE6FD', fontSize: 12, fontWeight: '600', marginTop: -4 },
  hamburger: { padding: 5 },
  scroll: { paddingBottom: 120 },

  // Profile Card
  profileCard: { 
    backgroundColor: 'rgba(255,255,255,0.12)', 
    borderRadius: 24, 
    padding: 20, 
    marginHorizontal: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 55, height: 55, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  welcomeText: { color: '#BAE6FD', fontSize: 13 },
  doctorName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  specialtyText: { color: '#BAE6FD', fontSize: 12, opacity: 0.8 },
  statusSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  statusText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  // Quick Actions Scroll
  quickActionsContainer: { marginTop: 20 },
  actionScroll: { paddingLeft: 20, gap: 15 },
  actionCard: { alignItems: 'center', width: 90 },
  actionIconBox: { width: 60, height: 60, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { color: '#FFF', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Stats Grid
  statsGrid: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginVertical: 20 },
  statBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 15, alignItems: 'center', elevation: 5 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 5 },
  statLabel: { fontSize: 10, color: '#64748B', textAlign: 'center' },

  // Patient Card
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
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  patientBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  issueLabel: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  issueText: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
  videoBtn: { backgroundColor: '#0EA5E9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, gap: 8 },
  videoBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  // Bottom Tabs
  bottomTabs: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 75, backgroundColor: '#FFF', borderRadius: 30, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
  middleTabContainer: { marginTop: -45 },
  middleButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF' },
});

export default DoctorDashboard;