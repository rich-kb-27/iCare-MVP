import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ACTIVE_TREATMENTS = [
  { id: '1', patient: 'Mwansa Kapiri', task: 'Administer IV Quinine', doctor: 'Dr. Chileshe (Private)', status: 'In Progress', urgency: 'High' },
  { id: '2', patient: 'John Phiri', task: 'Dress Leg Wound', doctor: 'Self Check-in', status: 'Pending', urgency: 'Normal' },
  { id: '3', patient: 'Sarah Zulu', task: 'Draw Blood for FBC', doctor: 'Dr. Mumba (Private)', status: 'In Progress', urgency: 'High' },
];

export default function TreatmentsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Active Operations</Text>
        <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#7DD3FC" />
      </View>

      <FlatList
        data={ACTIVE_TREATMENTS}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.treatmentCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.urgencyBadge, { backgroundColor: item.urgency === 'High' ? '#FEE2E2' : '#F1F5F9' }]}>
                <Text style={[styles.urgencyText, { color: item.urgency === 'High' ? '#EF4444' : '#64748B' }]}>{item.urgency} Priority</Text>
              </View>
              <Text style={styles.statusLabel}>{item.status}</Text>
            </View>
            
            <Text style={styles.patientName}>{item.patient}</Text>
            <View style={styles.taskBox}>
              <MaterialCommunityIcons name="format-list-checks" size={18} color="#0EA5E9" />
              <Text style={styles.taskText}>{item.task}</Text>
            </View>

            <View style={styles.divider} />
            
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.docLabel}>Ordering Doctor</Text>
                <Text style={styles.docName}>{item.doctor}</Text>
              </View>
              <TouchableOpacity style={styles.doneBtn}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.doneText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#0F172A', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  list: { padding: 20 },
  treatmentCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  urgencyText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  statusLabel: { fontSize: 12, color: '#0EA5E9', fontWeight: '600' },
  patientName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  taskBox: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8, backgroundColor: '#F0F9FF', padding: 12, borderRadius: 12 },
  taskText: { fontSize: 14, color: '#0369A1', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docLabel: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase' },
  docName: { fontSize: 13, color: '#475569', fontWeight: '600' },
  doneBtn: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 6 },
  doneText: { color: '#FFF', fontWeight: '700' },
});