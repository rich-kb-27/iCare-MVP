import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  appointment: any;
  onJoin: (id: string, name: string) => void;
  onDismiss: () => void;
}

export const AppointmentAlert = ({ visible, appointment, onJoin, onDismiss }: Props) => {
  if (!appointment) return null;

  const patientPhoto = appointment.profiles?.avatar_url;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={Platform.OS === 'ios' ? 70 : 140} tint="dark" style={styles.blurBg}>
          
          <View style={styles.alertContainer}>
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.card}>
              
              {/* Header Info */}
              <View style={styles.topHeader}>
                <View style={styles.scheduleBadge}>
                  <MaterialCommunityIcons name="calendar-clock" size={14} color="#0EA5E9" />
                  <Text style={styles.scheduleText}>SCHEDULED SESSION</Text>
                </View>
              </View>

              {/* Patient Profile Section */}
              <View style={styles.profileSection}>
                <View style={styles.imageWrapper}>
                  {patientPhoto ? (
                    <Image source={{ uri: patientPhoto }} style={styles.patientImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.placeholderText}>
                        {appointment.patient_name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {/* Static focus ring (not pulsing, feels more like a stable reminder) */}
                  <View style={styles.focusRing} />
                </View>
              </View>

              <View style={styles.content}>
                <Text style={styles.title}>{appointment.patient_name}</Text>
                <View style={styles.statusRow}>
                  <View style={styles.dueDot} />
                  <Text style={styles.dueText}>Session is now due</Text>
                </View>
                <Text style={styles.description}>
                  The consultation you scheduled with this patient is ready to begin.
                </Text>
              </View>

              {/* Action Area */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
                  <Text style={styles.dismissText}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={styles.joinBtn} 
                  onPress={() => onJoin(appointment.patient_id, appointment.patient_name)}
                >
                  <LinearGradient colors={['#38BDF8', '#0EA5E9']} style={styles.gradientBtn}>
                    <FontAwesome5 name="door-open" size={16} color="#FFF" />
                    <Text style={styles.joinText}>Enter Session</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </LinearGradient>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  blurBg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  alertContainer: { width: width * 0.88 },
  card: { 
    width: '100%', 
    borderRadius: 35, 
    padding: 25, 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 30
  },
  topHeader: { width: '100%', alignItems: 'center', marginBottom: 20 },
  scheduleBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(14,165,233,0.1)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)'
  },
  scheduleText: { color: '#0EA5E9', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  profileSection: { marginBottom: 15, alignItems: 'center' },
  imageWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientImage: { width: '100%', height: '100%', borderRadius: 55 },
  imagePlaceholder: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 55, 
    backgroundColor: '#334155', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText: { color: '#FFF', fontSize: 38, fontWeight: '700' },
  focusRing: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1.5,
    borderColor: 'rgba(14,165,233,0.5)',
  },
  content: { alignItems: 'center', marginBottom: 25 },
  title: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  dueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  dueText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  description: { color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingHorizontal: 10, lineHeight: 20 },
  buttonContainer: { flexDirection: 'row', gap: 12, width: '100%' },
  dismissBtn: { flex: 1, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  dismissText: { color: '#94A3B8', fontWeight: '700', fontSize: 14 },
  joinBtn: { flex: 2, height: 54, borderRadius: 18, overflow: 'hidden' },
  gradientBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  joinText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
export default AppointmentAlert;