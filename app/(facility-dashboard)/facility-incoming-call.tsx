import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, Modal, Animated 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Phone, X, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface IncomingCallProps {
  facilityId: string;
}

export default function FacilityPickupOverlay({ facilityId }: IncomingCallProps) {
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    if (!facilityId) return;

    // Listen for new calls specifically for this facility
    const channel = supabase
      .channel('facility_incoming_calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `facility_id=eq.${facilityId}`,
        },
        (payload) => {
          if (payload.new.status === 'ringing') {
            setIncomingCall(payload.new);
            triggerAnimation();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [facilityId]);

  const triggerAnimation = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const onAccept = async () => {
    if (!incomingCall) return;

    // Update status to 'ongoing' so the patient knows you joined
    await supabase
      .from('calls')
      .update({ status: 'ongoing' })
      .eq('id', incomingCall.id);

    const callData = incomingCall;
    setIncomingCall(null);

    // Navigate to the Call Screen with the proper params
    router.push({
      pathname: '/facility-call-screen',
      params: { 
        callId: callData.id, 
        facilityId: callData.facility_id,
        patientName: callData.patient_name || 'Patient' 
      }
    });
  };

  const onDecline = async () => {
    if (!incomingCall) return;

    await supabase
      .from('calls')
      .update({ status: 'declined' })
      .eq('id', incomingCall.id);

    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <Modal transparent animationType="fade" visible={!!incomingCall}>
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.avatarCircle}>
            <User size={50} color="#38BDF8" />
            <View style={styles.pulseRing} />
          </View>

          <Text style={styles.incomingText}>Incoming Emergency Call</Text>
          <Text style={styles.patientName}>{incomingCall.patient_name || "Unknown Patient"}</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onDecline} style={[styles.btn, styles.declineBtn]}>
              <X size={28} color="#FFF" />
              <Text style={styles.btnLabel}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onAccept} style={[styles.btn, styles.acceptBtn]}>
              <Phone size={28} color="#FFF" />
              <Text style={styles.btnLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
  },
  card: {
    width: '85%',
    backgroundColor: '#1E293B',
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#38BDF8',
    opacity: 0.5,
  },
  incomingText: {
    color: '#94A3B8',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  },
  patientName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 10,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 20,
  },
  btn: {
    flex: 1,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnLabel: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  declineBtn: {
    backgroundColor: '#EF4444',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
});