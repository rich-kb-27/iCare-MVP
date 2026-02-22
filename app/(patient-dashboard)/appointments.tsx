import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const APPOINTMENTS = [
  {
    id: "1",
    doctor: "Dr. Sarah Phiri",
    specialty: "Cardiologist",
    date: "Feb 28, 2026",
    time: "10:30 AM",
    status: "Confirmed",
  },
  {
    id: "2",
    doctor: "Dr. James Banda",
    specialty: "General Practitioner",
    date: "March 05, 2026",
    time: "02:15 PM",
    status: "Pending",
  },
];

const AppointmentsScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Upcoming");

  const AppointmentCard = ({ item }: { item: typeof APPOINTMENTS[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.docInfo}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="doctor" size={24} color="#0EA5E9" />
          </View>
          <View>
            <Text style={styles.docName}>{item.doctor}</Text>
            <Text style={styles.specialty}>{item.specialty}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Confirmed' ? '#DCFCE7' : '#FEF9C3' }]}>
          <Text style={[styles.statusText, { color: item.status === 'Confirmed' ? '#166534' : '#854D0E' }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View style={styles.dateTimeItem}>
          <Ionicons name="calendar-outline" size={16} color="#64748B" />
          <Text style={styles.footerText}>{item.date}</Text>
        </View>
        <View style={styles.dateTimeItem}>
          <Ionicons name="time-outline" size={16} color="#64748B" />
          <Text style={styles.footerText}>{item.time}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.rescheduleBtn}>
        <Text style={styles.rescheduleText}>Reschedule</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        {/* --- TOP BAR --- */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointments</Text>
          <TouchableOpacity style={styles.plusBtn}>
             <Ionicons name="add" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* --- TABS --- */}
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {activeTab === "Upcoming" ? (
            <View style={styles.listContainer}>
              {APPOINTMENTS.map(item => (
                <AppointmentCard key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={60} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} appointments</Text>
            </View>
          )}

          {/* --- CTA CARD --- */}
          <LinearGradient colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]} style={styles.ctaCard}>
            <View style={styles.ctaInfo}>
              <Text style={styles.ctaTitle}>Need a Checkup?</Text>
              <Text style={styles.ctaSub}>Book a session with a specialist in minutes.</Text>
            </View>
            <TouchableOpacity 
              style={styles.bookBtn}
              onPress={() => router.push("/checkup/avaliable-doctors")}
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
  plusBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginVertical: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeTab: { backgroundColor: '#FFF' },
  tabText: { color: '#BAE6FD', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#0F172A' },

  scroll: { paddingBottom: 100, paddingHorizontal: 20 },
  listContainer: { marginTop: 15, gap: 15 },
  
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  docInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  docName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  specialty: { fontSize: 13, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  
  cardFooter: { flexDirection: 'row', gap: 20 },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  
  rescheduleBtn: { marginTop: 15, backgroundColor: '#F8FAFC', paddingVertical: 12, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  rescheduleText: { color: '#0F172A', fontWeight: '700', fontSize: 14 },

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