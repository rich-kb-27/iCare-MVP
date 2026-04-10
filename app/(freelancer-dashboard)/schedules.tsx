import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Switch, Alert, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase'; 
import { useAuth } from '../../context/AuthContext'; 

interface Subscriber {
  patient_id: string;
  subscription_type: string;
  profiles: { full_name: string; email: string; };
}

interface TimeSlot {
  id: string;
  patient_id: string;
  patient_name: string;
  start_time: string; 
  end_time: string;
  doctor_notes: string;
  day_of_week: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ScheduleScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isOnline, setIsOnline] = useState(false);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay()]);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Subscriber | null>(null);
  const [selectedDaysForBooking, setSelectedDaysForBooking] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { fetchInitialData(); }, [user]);
  useEffect(() => { fetchSchedules(); }, [selectedDay]);

  const fetchInitialData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Fetch Profile Status
      const { data: profile } = await supabase.from('profiles').select('is_online').eq('id', user.id).single();
      if (profile) setIsOnline(profile.is_online);

      // Fetch Active Subscribers
      const { data: subs } = await supabase.from('subscriptions').select('patient_id, plan_type').eq('doctor_id', user.id).eq('status', 'active');
      if (subs) {
        const patientIds = subs.map(s => s.patient_id);
        const { data: profileData } = await supabase.from('profiles').select('id, full_name, email').in('id', patientIds);
        const formatted = subs.map(s => ({
          patient_id: s.patient_id,
          subscription_type: s.plan_type,
          profiles: profileData?.find(p => p.id === s.patient_id) || { full_name: 'Unknown', email: 'N/A' }
        }));
        setSubscribers(formatted as any);
      }
    } catch (e: any) { console.error(e.message); } finally { setLoading(false); }
  };

  const fetchSchedules = async () => {
  if (!user?.id) return;
  
  // Sorting by start_time descending (Latest one to start shows at the top)
  const { data: sched, error: schedError } = await supabase
    .from('schedules')
    .select('*')
    .eq('doctor_id', user.id)
    .eq('day_of_week', selectedDay)
    .order('start_time', { ascending: false }); // CHANGED THIS TO FALSE

  if (schedError) {
    console.error("Fetch Schedules Error:", schedError.message);
    return;
  }
  
  setSlots((sched as TimeSlot[]) || []);
};
  const toggleOnlineStatus = async (value: boolean) => {
    setIsOnline(value);
    await supabase.from('profiles').update({ is_online: value }).eq('id', user?.id);
  };

  const handleSave = async () => {
    if (!selectedPatient) return Alert.alert("Required", "Select a patient.");
    if (selectedDaysForBooking.length === 0 && !editingId) return Alert.alert("Required", "Select days.");

    try {
      if (editingId) {
        const startTime = appointmentTime.toISOString();
        const endTime = new Date(appointmentTime.getTime() + 30 * 60000).toISOString();
        await supabase.from('schedules').update({
          patient_id: selectedPatient.patient_id,
          patient_name: selectedPatient.profiles.full_name,
          start_time: startTime,
          end_time: endTime,
          day_of_week: selectedDay,
          doctor_notes: reason,
        }).eq('id', editingId);
      } else {
        // Multi-day calculation to avoid duplicate key errors
        const newBookings = selectedDaysForBooking.map(dayName => {
          const targetIdx = DAYS.indexOf(dayName);
          const now = new Date();
          const todayIdx = now.getDay();
          let diff = (targetIdx - todayIdx + 7) % 7;
          
          const bookingDate = new Date();
          bookingDate.setDate(now.getDate() + diff);
          bookingDate.setHours(appointmentTime.getHours(), appointmentTime.getMinutes(), 0, 0);

          return {
            doctor_id: user?.id,
            patient_id: selectedPatient.patient_id,
            patient_name: selectedPatient.profiles.full_name,
            start_time: bookingDate.toISOString(),
            end_time: new Date(bookingDate.getTime() + 30 * 60000).toISOString(),
            day_of_week: dayName,
            doctor_notes: reason,
            status: 'Booked'
          };
        });
        const { error } = await supabase.from('schedules').insert(newBookings);
        if (error) throw error;
      }
      setModalVisible(false);
      fetchSchedules();
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.topNav}>
        <View style={styles.navContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}><Ionicons name="chevron-back" size={24} color="#0F172A" /></TouchableOpacity>
          <View>
            <Text style={styles.navTitle}>Medical Planner</Text>
            <Text style={styles.navSub}>Sorted by earliest start time</Text>
          </View>
          <FontAwesome5 name="user-md" size={24} color="#0EA5E9" />
        </View>
      </SafeAreaView>

      <View style={styles.statusSection}>
        <View style={[styles.statusPill, isOnline ? styles.onlinePill : styles.offlinePill]}>
          <View style={[styles.dot, { backgroundColor: isOnline ? '#10B981' : '#64748B' }]} />
          <Text style={styles.statusText}>{isOnline ? "Accepting Patients" : "Away"}</Text>
          <Switch value={isOnline} onValueChange={toggleOnlineStatus} />
        </View>
      </View>

      <View style={styles.calendarStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {DAYS.map((day) => (
            <TouchableOpacity key={day} onPress={() => setSelectedDay(day)} style={[styles.dayCard, selectedDay === day && styles.activeDayCard]}>
              <Text style={[styles.dayName, selectedDay === day && styles.activeDayText]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Today's Queue</Text>
          <TouchableOpacity 
  style={styles.btnSmall} 
  onPress={() => { 
    setEditingId(null); 
    setSelectedPatient(null); 
    setReason(''); // Clear notes
    setSelectedDaysForBooking([selectedDay]); // Default to the day you're looking at
    setModalVisible(true); 
  }}
>
  <Ionicons name="add" size={20} color="#FFF" />
  <Text style={styles.btnSmallText}>New Consultation</Text>
</TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color="#0EA5E9" /> : slots.map((slot) => (
          <View key={slot.id} style={styles.medicalCard}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeText}>{new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
              <View style={styles.verticalLine} />
            </View>
            <TouchableOpacity style={styles.cardMain} onPress={() => { setEditingId(slot.id); setAppointmentTime(new Date(slot.start_time)); setReason(slot.doctor_notes); setModalVisible(true); }}>
              <Text style={styles.patientName}>{slot.patient_name}</Text>
              <Text style={styles.notesText}>{slot.doctor_notes || "No clinical notes"}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
             <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? "Update Entry" : "New Consultation"}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#64748B" /></TouchableOpacity>
             </View>

             <Text style={styles.inputLabel}>PATIENT & PLAN</Text>
             <View style={styles.pillContainer}>
                {subscribers.map(sub => (
                  <TouchableOpacity key={sub.patient_id} onPress={() => setSelectedPatient(sub)} style={[styles.pill, selectedPatient?.patient_id === sub.patient_id && styles.pillActive]}>
                    <Text style={[styles.pillText, selectedPatient?.patient_id === sub.patient_id && {color: '#FFF'}]}>
                      {sub.profiles.full_name} ({sub.subscription_type})
                    </Text>
                  </TouchableOpacity>
                ))}
             </View>

             <Text style={styles.inputLabel}>RECURRING DAYS</Text>
             <View style={styles.pillContainer}>
                {DAYS.map(day => (
                  <TouchableOpacity key={day} onPress={() => setSelectedDaysForBooking(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} style={[styles.pill, selectedDaysForBooking.includes(day) && styles.pillActive]}>
                    <Text style={[styles.pillText, selectedDaysForBooking.includes(day) && {color: '#FFF'}]}>{day}</Text>
                  </TouchableOpacity>
                ))}
             </View>

             <Text style={styles.inputLabel}>START TIME</Text>
             <TouchableOpacity style={styles.timeField} onPress={() => setShowPicker(true)}>
                <Ionicons name="time-outline" size={20} color="#0EA5E9" />
                <Text style={styles.timeFieldText}>{appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
             </TouchableOpacity>

             {showPicker && <DateTimePicker value={appointmentTime} mode="time" is24Hour={true} onChange={(e, d) => { setShowPicker(false); if(d) setAppointmentTime(d); }} />}

             <TextInput style={styles.medicalInput} placeholder="Add clinical notes..." value={reason} onChangeText={setReason} multiline />

             <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                <Text style={styles.submitBtnText}>Confirm & Book</Text>
             </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

// ... Styles stay mostly the same as previous version ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topNav: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  navContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  navSub: { fontSize: 12, color: '#64748B' },
  statusSection: { padding: 20 },
  statusPill: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 100, backgroundColor: '#FFF', elevation: 2 },
  onlinePill: { borderLeftWidth: 4, borderLeftColor: '#10B981' },
  offlinePill: { borderLeftWidth: 4, borderLeftColor: '#64748B' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  statusText: { flex: 1, fontWeight: '700' },
  calendarStrip: { marginBottom: 20 },
  dayCard: { width: 60, height: 45, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  activeDayCard: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  dayName: { fontWeight: '700', color: '#64748B' },
  activeDayText: { color: '#FFF' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  listTitle: { fontSize: 16, fontWeight: '800' },
  btnSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnSmallText: { color: '#FFF', fontWeight: '700', fontSize: 12, marginLeft: 4 },
  medicalCard: { flexDirection: 'row', marginBottom: 20 },
  timeColumn: { width: 50, alignItems: 'center' },
  timeText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  verticalLine: { flex: 1, width: 2, backgroundColor: '#E2E8F0', marginVertical: 5 },
  cardMain: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#0EA5E9', elevation: 3 },
  patientName: { fontSize: 15, fontWeight: '800' },
  notesText: { fontSize: 13, color: '#64748B' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  inputLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginBottom: 10, marginTop: 15 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F1F5F9' },
  pillActive: { backgroundColor: '#0EA5E9' },
  pillText: { fontWeight: '700', color: '#475569', fontSize: 12 },
  timeField: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  timeFieldText: { marginLeft: 10, fontWeight: '800' },
  medicalInput: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 15, height: 80, marginTop: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  submitBtn: { backgroundColor: '#0EA5E9', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 25 },
  submitBtnText: { color: '#FFF', fontWeight: '900' },
});

export default ScheduleScreen;
