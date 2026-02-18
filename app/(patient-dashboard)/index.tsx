import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
// Import DrawerActions to manually trigger the drawer
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useRouter } from "expo-router";


type PatientDrawerParamList = {
  dashboard: undefined;
};

const { width } = Dimensions.get("window");

const PROMOS = [
  { id: "1", color: "#0EA5E9", title: "Vaccination Drive", subtitle: "Book your slot today" },
  { id: "2", color: "#6366F1", title: "Online Consultation", subtitle: "Chat with doctors 24/7" },
  { id: "3", color: "#10B981", title: "Medical Insurance", subtitle: "Explore iCare plans" },
];

const FEATURES = [
  { id: "1", name: "Appointments", icon: "calendar-check" },
  { id: "2", name: "Subscriptions", icon: "card-bulleted" },
  { id: "3", name: "Prescriptions", icon: "pill" },
  { id: "4", name: "Lab Reports", icon: "test-tube" },
  { id: "5", name: "Home Care", icon: "home-heart" },
];

const UserDashboard = () => {
  // Use generic navigation prop for the hook
  const navigation = useNavigation();
  const [activePromo, setActivePromo] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  const router = useRouter();


  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromo((prev) => {
        const next = prev === PROMOS.length - 1 ? 0 : prev + 1;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        {/* --- TOP NAV BAR --- */}
        <View style={styles.topBar}>
          <Text style={styles.logoText}>iCare</Text>
          <TouchableOpacity
            style={styles.hamburger}
            // FIXED: Using DrawerActions ensures the drawer opens regardless of nesting
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Ionicons name="menu-outline" size={30} color="#E0F2FE" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* --- SLIDING FEATURES LIST --- */}
          <View style={styles.featuresContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresScroll}>
              {FEATURES.map((item) => (
                <TouchableOpacity key={item.id} style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <MaterialCommunityIcons name={item.icon as any} size={24} color="#0EA5E9" />
                  </View>
                  <Text style={styles.featureText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* --- CORE ACTION CARDS --- */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.facilityCard}>
              <View style={styles.iconCircle}>
                <FontAwesome5 name="hospital-alt" size={20} color="#0EA5E9" />
              </View>
              <Text style={styles.cardTitle}>Find Facility</Text>
              <Text style={styles.cardSub}>Clinics & Hospitals</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emergencyCard}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
                <MaterialCommunityIcons name="ambulance" size={24} color="#EF4444" />
              </View>
              <Text style={[styles.cardTitle, { color: "#EF4444" }]}>Emergency</Text>
              <Text style={styles.cardSub}>Instant Support</Text>
            </TouchableOpacity>
          </View>

          {/* --- AUTO-SLIDING PROMO BANNER --- */}
          <View style={styles.promoContainer}>
            <FlatList
              ref={flatListRef}
              data={PROMOS}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.promoCard, { backgroundColor: item.color }]}>
                  <View>
                    <Text style={styles.promoTitle}>{item.title}</Text>
                    <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
                  </View>
                  <FontAwesome5 name="heartbeat" size={40} color="rgba(255,255,255,0.2)" />
                </View>
              )}
            />
          </View>

          {/* --- SECONDARY ACTIONS --- */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryCard}>
              <Ionicons name="search" size={22} color="#0EA5E9" />
              <Text style={styles.secondaryText}>Search Doctors</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryCard}>
              <Ionicons name="videocam" size={22} color="#0EA5E9" />
              <Text style={styles.secondaryText}>Tele-Consult</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* --- BOTTOM TABS --- */}
        <View style={styles.bottomTabs}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="home" size={24} color="#0EA5E9" />
            <Text style={[styles.tabText, { color: "#0EA5E9" }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="notifications" size={24} color="#94A3B8" />
            <Text style={styles.tabText}>alerts </Text>
          </TouchableOpacity>

          <View style={styles.middleTabContainer}>
            <TouchableOpacity style={styles.middleButton} onPress={() => router.push("/checkup/avaliable-doctors")}>
              <Ionicons name="medkit" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="chatbubble-outline" size={24} color="#94A3B8" />
            <Text style={styles.tabText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="person-outline" size={24} color="#94A3B8" />
            <Text style={styles.tabText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main Styles
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  logoText: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  hamburger: { padding: 5 },
  scroll: { paddingBottom: 120 },
  featuresContainer: { marginVertical: 15 },
  featuresScroll: { paddingLeft: 20, gap: 15 },
  featureItem: { alignItems: 'center', width: 85 },
  featureIconBox: { backgroundColor: 'rgba(255,255,255,0.12)', width: 60, height: 60, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  featureText: { color: '#BAE6FD', fontSize: 11, marginTop: 8, textAlign: 'center' },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 10 },
  facilityCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 5 },
  emergencyCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 5, borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.1)' },
  iconCircle: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  promoContainer: { marginTop: 25, alignItems: 'center' },
  promoCard: { width: width - 40, marginHorizontal: 20, borderRadius: 24, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 110 },
  promoTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  promoSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  secondaryActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 20 },
  secondaryCard: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', height: 50, borderRadius: 15, gap: 8 },
  secondaryText: { color: '#E0F2FE', fontWeight: '600', fontSize: 14 },
  bottomTabs: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 75, backgroundColor: '#FFF', borderRadius: 30, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
  middleTabContainer: { marginTop: -45 },
  middleButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF' },
});

export default UserDashboard;