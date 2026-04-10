import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const MOCK_CHECKINS = [
  {
    id: "1",
    patientName: "Mwansa Kapiri",
    managedBy: "Dr. Chileshe (Private Doctor)", // The Freelancer acting as the Private MD
    type: "DOCTOR_LED",
    reason: "Severe Malaria - IV Quinine Required",
    status: "Arrived",
    time: "10:30 AM",
  },
  {
    id: "2",
    patientName: "John Phiri",
    managedBy: "Self Check-in", // The User checked themselves in
    type: "SELF",
    reason: "Wound Dressing & Tetanus Shot",
    status: "En Route",
    time: "11:15 AM",
  },
  {
    id: "3",
    patientName: "Sarah Zulu",
    managedBy: "Dr. Mumba (Private Doctor)",
    type: "DOCTOR_LED",
    reason: "Full Blood Count (Lab Order)",
    status: "Waiting",
    time: "09:45 AM",
  },
];

const CheckInsScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const renderCheckInItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.checkInCard}
      onPress={() => router.push(`/check-ins/${item.id}`)}
    >
      <View style={styles.cardTop}>
        {/* Type Badge: Private Doctor vs Self */}
        <View style={[styles.typeBadge, { backgroundColor: item.type === 'DOCTOR_LED' ? '#0EA5E9' : '#64748B' }]}>
          <Text style={styles.typeText}>{item.type === 'DOCTOR_LED' ? 'DOCTOR MANAGED' : 'DIRECT ENTRY'}</Text>
        </View>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>

      <Text style={styles.patientName}>{item.patientName}</Text>
      
      <View style={styles.managerRow}>
        <Ionicons 
          name={item.type === 'DOCTOR_LED' ? "medical-outline" : "person-outline"} 
          size={14} 
          color="#64748B" 
        />
        <Text style={styles.managedByText}>{item.managedBy}</Text>
      </View>
      
      <View style={styles.reasonContainer}>
        <Text style={styles.reasonHeader}>Required Treatment:</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
        <View style={[styles.statusTag, { backgroundColor: item.status === 'Arrived' ? '#DCFCE7' : '#FEF9C3' }]}>
          <Text style={[styles.statusText, { color: item.status === 'Arrived' ? '#166534' : '#854D0E' }]}>
            {item.status}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#0EA5E9" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Intake & Check-ins</Text>
      </LinearGradient>

      {/* QR Section for the Facility to "Accept" the Doctor's Referral */}
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
          <Ionicons name="search-outline" size={20} color="#94A3B8" />
          <TextInput 
            placeholder="Search active patients..." 
            style={styles.searchInput}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <FlatList
          data={MOCK_CHECKINS}
          keyExtractor={(item) => item.id}
          renderItem={renderCheckInItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { marginRight: 15 },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  
  scannerSection: { padding: 20, marginTop: -30 },
  scanButton: { 
    backgroundColor: "#0EA5E9", 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 20,
    elevation: 8,
  },
  scanTextContainer: { marginLeft: 15 },
  scanTitle: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  scanSub: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  listContainer: { flex: 1, paddingHorizontal: 20 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    marginBottom: 20
  },
  searchInput: { marginLeft: 10, flex: 1 },

  listContent: { paddingBottom: 40 },
  checkInCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  typeText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  timeText: { fontSize: 12, color: '#94A3B8' },
  patientName: { fontSize: 19, fontWeight: '700', color: '#0F172A' },
  managerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  managedByText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  reasonContainer: { marginTop: 12, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 },
  reasonHeader: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700' },
  reasonText: { fontSize: 14, color: '#334155', marginTop: 2, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
});

export default CheckInsScreen;