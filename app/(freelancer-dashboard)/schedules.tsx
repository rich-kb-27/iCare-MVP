import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Switch, Alert, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
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
  status: 'Booked' | 'Completed' | 'Cancelled';
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
  useEffect(() => { fetchSchedules(); }, [selectedDay, user]);

  const fetchInitialData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: profile } = await supabase.from('profiles').select('is_online').eq('id', user.id).single();
      if (profile) setIsOnline(profile.is_online);

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
    setLoading(true);
    
    // STRICT FILTER: Only fetching 'Booked' status
    const { data: sched, error: schedError } = await supabase
      .from('schedules')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('day_of_week', selectedDay)
      .eq('status', 'Booked') 
      .order('start_time', { ascending: false }); 

    if (!schedError) setSlots((sched as TimeSlot[]) || []);
    setLoading(false);
  };

  const updateSlotStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('schedules').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      
      // Since we only want 'Booked', we remove it from the local state immediately
      setSlots(prev => prev.filter(slot => slot.id !== id));
    } catch (e: any) { Alert.alert("Status Update Failed", e.message); }
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
      <StatusBar style="light" />
      
      <LinearGradient colors={['#1E293B', '#020617']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.navContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.navTitle}>Medical Planner</Text>
              <Text style={styles.navSub}>Active Consultations Only</Text>
            </View>
            <View style={styles.headerIconBg}>
              <FontAwesome5 name="user-md" size={18} color="#38BDF8" />
            </View>
          </View>

          <View style={styles.statusSection}>
            <View style={styles.statusPill}>
              <View style={[styles.dot, { backgroundColor: isOnline ? '#10B981' : '#64748B' }]} />
              <Text style={styles.statusText}>{isOnline ? "Accepting Patients" : "Away"}</Text>
              <Switch value={isOnline} onValueChange={toggleOnlineStatus} thumbColor="#FFF" trackColor={{ true: '#0EA5E9', false: '#334155' }} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

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
            onPress={() => { setEditingId(null); setSelectedPatient(null); setReason(''); setSelectedDaysForBooking([selectedDay]); setModalVisible(true); }}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.btnSmallText}>New Consultation</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#0EA5E9" style={{ marginTop: 40 }} />
        ) : slots.length > 0 ? (
          slots.map((slot) => (
            <View key={slot.id} style={styles.medicalCard}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>
                  {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </Text>
                <View style={styles.verticalLine} />
              </View>
              
              <View style={styles.cardMain}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity 
                    style={{ flex: 1 }}
                    onPress={() => { 
                      setEditingId(slot.id); 
                      setAppointmentTime(new Date(slot.start_time)); 
                      setReason(slot.doctor_notes); 
                      setModalVisible(true); 
                    }}
                  >
                    <Text style={styles.patientName}>{slot.patient_name}</Text>
                    <Text style={styles.notesText} numberOfLines={1}>{slot.doctor_notes || "No clinical notes"}</Text>
                  </TouchableOpacity>
                  
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity onPress={() => updateSlotStatus(slot.id, 'Completed')}>
                      <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => updateSlotStatus(slot.id, 'Cancelled')}>
                      <Ionicons name="close-circle" size={28} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-search" size={60} color="#1E293B" />
            <Text style={styles.emptyTitle}>Nothing Booked</Text>
            <Text style={styles.emptySub}>The freelancer has no booked consultations for {selectedDay}.</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal - Dark/Blue UI */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} statusBarTranslucent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          >
            {/* TouchableWithoutFeedback prevents the modal closing when clicking inside the content */}
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{editingId ? "Update Entry" : "New Consultation"}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                >
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
                      <Ionicons name="time" size={20} color="#0EA5E9" />
                      <Text style={styles.timeFieldText}>{appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </TouchableOpacity>

                  {showPicker && <DateTimePicker value={appointmentTime} mode="time" is24Hour={true} onChange={(e, d) => { setShowPicker(false); if(d) setAppointmentTime(d); }} />}

                  <Text style={styles.inputLabel}>CLINICAL NOTES</Text>
                  <TextInput 
                    style={styles.medicalInput} 
                    placeholder="Add clinical notes..." 
                    placeholderTextColor="#64748B" 
                    value={reason} 
                    onChangeText={setReason} 
                    multiline 
                    textAlignVertical="top"
                    blurOnSubmit={false}
                  />

                  <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                      <Text style={styles.submitBtnText}>Confirm & Book</Text>
                  </TouchableOpacity>
                </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  headerGradient: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 25 },
  navContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  navSub: { fontSize: 13, color: '#94A3B8' },
  statusSection: { paddingHorizontal: 20, marginTop: 20 },
  statusPill: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  statusText: { flex: 1, fontWeight: '700', color: '#CBD5E1' },
  calendarStrip: { marginVertical: 25 },
  dayCard: { width: 55, height: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 18, marginRight: 12, borderWidth: 1, borderColor: '#1E293B' },
  activeDayCard: { backgroundColor: '#0EA5E9', borderColor: '#38BDF8' },
  dayName: { fontWeight: '800', color: '#64748B' },
  activeDayText: { color: '#FFF' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  listTitle: { fontSize: 18, fontWeight: '900', color: '#F1F5F9' },
  btnSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0EA5E9', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14 },
  btnSmallText: { color: '#FFF', fontWeight: '800', fontSize: 12, marginLeft: 6 },
  medicalCard: { flexDirection: 'row', marginBottom: 26 },
  timeColumn: { width: 60, alignItems: 'center' },
  timeText: { fontSize: 14, fontWeight: '800', color: '#38BDF8' },
  verticalLine: { flex: 1, width: 2, backgroundColor: '#1E293B', marginVertical: 8 },
  cardMain: { flex: 1, backgroundColor: '#0F172A', borderRadius: 22, padding: 20, borderLeftWidth: 5, borderLeftColor: '#0EA5E9', borderWidth: 1, borderColor: '#1E293B' },
  patientName: { fontSize: 16, fontWeight: '800', color: '#F1F5F9' },
  notesText: { fontSize: 13, color: '#94A3B8' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50, paddingHorizontal: 40 },
  emptyTitle: { color: '#FFF', fontSize: 19, fontWeight: '900', marginTop: 15 },
  emptySub: { color: '#64748B', textAlign: 'center', marginTop: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0F172A', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 28, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  inputLabel: { fontSize: 11, fontWeight: '900', color: '#38BDF8', marginBottom: 15, marginTop: 20 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pill: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  pillActive: { backgroundColor: '#0EA5E9' },
  pillText: { fontWeight: '700', color: '#94A3B8' },
  timeField: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  timeFieldText: { marginLeft: 12, fontWeight: '800', color: '#FFF' },
  medicalInput: { backgroundColor: '#1E293B', borderRadius: 16, padding: 18, height: 110, marginTop: 22, borderWidth: 1, borderColor: '#334155', color: '#FFF' },
  submitBtn: { backgroundColor: '#0EA5E9', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 35, marginBottom: 20 },
  submitBtnText: { color: '#FFF', fontWeight: '900' },
});

export default ScheduleScreen;