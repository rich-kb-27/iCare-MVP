import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MedicalReportsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Reports</Text>
      </View>

      <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Upload Zone */}
        <TouchableOpacity style={styles.uploadZone}>
          <View style={styles.dashedBox}>
            <MaterialCommunityIcons name="camera-plus-outline" size={40} color="#0EA5E9" />
            <Text style={styles.uploadTitle}>Scan or Upload Result</Text>
            <Text style={styles.uploadSub}>Attach lab findings, scans, or notes</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Pending Sign-offs</Text>
        
        <View style={styles.reportRow}>
          <View style={styles.reportIcon}>
            <Ionicons name="document-text" size={24} color="#F59E0B" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.reportFileName}>Malaria_RDT_Result_Kapiri.jpg</Text>
            <Text style={styles.reportMeta}>Patient: Mwansa Kapiri • Needs Signing</Text>
          </View>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="create-outline" size={22} color="#0EA5E9" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Sent to Private Doctor</Text>

        <View style={styles.reportRow}>
          <View style={styles.reportIcon}>
            <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.reportFileName}>FBC_Report_Zulu.pdf</Text>
            <Text style={styles.reportMeta}>Delivered to Dr. Mumba • 1h ago</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { marginLeft: 15, fontSize: 20, fontWeight: '800', color: '#0F172A' },
  uploadZone: { marginBottom: 30 },
  dashedBox: { height: 160, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', padding: 20 },
  uploadTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  uploadSub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginTop: 10 },
  reportRow: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  reportIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  reportFileName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  reportMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  actionIcon: { padding: 8 },
});