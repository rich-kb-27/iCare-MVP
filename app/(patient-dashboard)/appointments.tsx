import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

// Supabase & Auth
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";

interface Appointment {
  id: string;
  doctor_id: string;
  patient_name: string;
  start_time: string;
  doctor_notes: string;
  status: string;
  day_of_week: string;
  doctor_profile?: {
    full_name: string;
    specialty: string;
    avatar_url?: string;
  };
}

const AppointmentsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- 1. DATA FETCHING WITH DOCTOR AVATARS ---
  const fetchAppointments = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      const { data: schedData, error: schedError } = await supabase
        .from('schedules')
        .select('*')
        .eq('patient_id', user.id); // Sorting handled in the frontend filter below

      if (schedError) throw schedError;

      if (schedData && schedData.length > 0) {
        const doctorIds = [...new Set(schedData.map(s => s.doctor_id))];

        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('id, full_name, specialty, avatar_url')
          .in('id', doctorIds);

        if (profError) throw profError;

        const merged = schedData.map(slot => ({
          ...slot,
          doctor_profile: profData?.find(p => p.id === slot.doctor_id) || { 
            full_name: 'Specialist', 
            specialty: 'Medical Partner',
            avatar_url: null
          }
        }));

        setAppointments(merged);
      } else {
        setAppointments([]);
      }
    } catch (e: any) {
      console.error("Fetch Error:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  // --- 2. CANCEL LOGIC ---
  const handleCancel = (id: string) => {
    Alert.alert("Cancel Appointment", "Are you sure you want to cancel this session?", [
      { text: "No", style: "cancel" },
      { 
        text: "Yes, Cancel", 
        style: 'destructive', 
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('schedules')
              .update({ status: 'Cancelled' })
              .eq('id', id);
            
            if (error) throw error;
            fetchAppointments();
          } catch (err: any) {
            Alert.alert("Error", "Could not cancel. Try again.");
          }
        }
      }
    ]);
  };

  // --- 3. SMART FILTERING & SORTING (NEWEST FIRST FOR PAST) ---
  const filteredList = appointments
    .filter(app => {
      const now = new Date();
      const appDate = new Date(app.start_time);

      if (activeTab === "Upcoming") {
        return app.status === "Booked" && appDate > now;
      }
      if (activeTab === "Cancelled") {
        return app.status === "Cancelled";
      }
      if (activeTab === "Past") {
        return appDate < now && app.status !== "Cancelled";
      }
      return false;
    })
    .sort((a, b) => {
      const dateA = new Date(a.start_time).getTime();
      const dateB = new Date(b.start_time).getTime();
      // If Past: Sort Descending (Newest first). If Upcoming: Sort Ascending (Soonest first).
      return activeTab === "Past" ? dateB - dateA : dateA - dateB;
    });

  const AppointmentCard = ({ item }: { item: Appointment }) => {
    const dateObj = new Date(item.start_time);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const doctorPhoto = item.doctor_profile?.avatar_url;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.docInfo}>
            {/* AVATAR BOX */}
            <View style={styles.avatarWrapper}>
              {doctorPhoto ? (
                <Image source={{ uri: doctorPhoto }} style={styles.docImage} />
              ) : (
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="doctor" size={24} color="#0EA5E9" />
                </View>
              )}
            </View>
            
            <View>
              <Text style={styles.docName}>{item.doctor_profile?.full_name}</Text>
              <Text style={styles.specialty}>{item.doctor_profile?.specialty}</Text>
            </View>
          </View>

          <View style={[
            styles.statusBadge, 
            { backgroundColor: item.status === 'Booked' ? '#DCFCE7' : '#FEE2E2' }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: item.status === 'Booked' ? '#166534' : '#991B1B' }
            ]}>
              {item.status === 'Booked' ? 'Confirmed' : item.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.footerText}>{formattedDate}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.footerText}>{formattedTime}</Text>
          </View>
        </View>

        {activeTab === "Upcoming" && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
            <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabContainer}>
          {["Upcoming", "Past", "Cancelled"].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointments(); }} tintColor="#FFF" />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator color="#FFF" style={{ marginTop: 50 }} />
          ) : filteredList.length > 0 ? (
            <View style={styles.listContainer}>
              {filteredList.map(item => (
                <AppointmentCard key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={60} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} appointments</Text>
            </View>
          )}

          <LinearGradient colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]} style={styles.ctaCard}>
            <View style={styles.ctaInfo}>
              <Text style={styles.ctaTitle}>Need a Checkup?</Text>
              <Text style={styles.ctaSub}>Connect with a specialist now.</Text>
            </View>
            <TouchableOpacity 
              style={styles.bookBtn}
              onPress={() => router.push("/(patient-drawer)/home")}
            >
              <Text style={styles.bookBtnText}>Book Now</Text>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  backBtn: { width: 40 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginVertical: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeTab: { backgroundColor: '#FFF' },
  tabText: { color: '#BAE6FD', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#0F172A' },
  scroll: { paddingBottom: 100, paddingHorizontal: 20 },
  listContainer: { marginTop: 15, gap: 15 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  docInfo: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatarWrapper: { width: 56, height: 56, borderRadius: 18, overflow: 'hidden', backgroundColor: '#F0F9FF' },
  docImage: { width: '100%', height: '100%' },
  iconCircle: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  docName: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  specialty: { fontSize: 13, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  cardFooter: { flexDirection: 'row', gap: 20 },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  cancelBtn: { marginTop: 18, backgroundColor: '#FEF2F2', paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  cancelBtnText: { color: '#991B1B', fontWeight: '700', fontSize: 14 },
  ctaCard: { marginTop: 30, padding: 25, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctaInfo: { flex: 1, marginRight: 10 },
  ctaTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  ctaSub: { color: '#BAE6FD', fontSize: 13, marginTop: 4 },
  bookBtn: { backgroundColor: '#0EA5E9', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 },
  bookBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 15 },
  emptyText: { color: 'rgba(186, 230, 253, 0.5)', fontSize: 16, fontWeight: '600' }
});

export default AppointmentsScreen;