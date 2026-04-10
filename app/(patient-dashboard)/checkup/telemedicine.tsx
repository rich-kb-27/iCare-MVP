import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, PermissionsAndroid, 
  Platform, Alert, Modal, ScrollView, ActivityIndicator 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router'; 
import { 
  createAgoraRtcEngine, ChannelProfileType, ClientRoleType, RtcSurfaceView, 
  VideoMirrorModeType, IRtcEngine, RenderModeType
} from 'react-native-agora';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera, Radio, Star, CheckCircle2, X, ChevronRight
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const APP_ID = 'e8ea1a516c9b49d4af42422e2fcae0b3';

const SUBSCRIPTION_PLANS = [
  { id: '1', name: 'Day Pass', price: 'K50', features: ['24h Video Calls', 'Unlimited Chats'], type: '1_day' },
  { id: '2', name: 'Recovery & Follow-up', price: 'K250', features: ['1 Week Coverage', 'Includes 1 Home Visit', 'Follow-up calls'], type: '1_week' },
  { id: '3', name: 'Chronic Care Support', price: 'K450', features: ['2 Weeks Coverage', 'Private Care Services', 'Vitals Monitoring'], popular: true, type: '2_weeks' },
  { id: '4', name: 'Full Recovery Coverage', price: 'K800', features: ['1 Month Coverage', '24/7 Medical Assistant', 'Priority Access'], type: '1_month_recovery' },
  { id: '5', name: 'Full Family Coverage', price: 'K1200', features: ['1 Month Coverage', 'Covers up to 4 members', 'Unlimited Video/Chat'], type: '1_month_family' },
];

export default function VideoCallScreen() {
  const { doctorId, doctorName, callId } = useLocalSearchParams(); 
  const router = useRouter();
  
  const engine = useRef<IRtcEngine>(createAgoraRtcEngine());
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activePlanName, setActivePlanName] = useState('');
  const [loading, setLoading] = useState(false);

  // FIXED UID PROTOCOL: Patient is always 2
  const localUid = 2;
  const channelName = (callId as string);

  useEffect(() => {
    if (!callId) return;
    
    const callSubscription = supabase
      .channel(`call_status_${callId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'calls', 
        filter: `id=eq.${callId}` 
      }, 
      (payload) => {
        if (payload.new.status === 'ended' || payload.new.status === 'declined') {
            exitCall();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(callSubscription); };
  }, [callId]);

  useEffect(() => {
    if (channelName) {
        init();
    }
    return () => {
      engine.current.leaveChannel();
      engine.current.release();
    };
  }, [channelName]);

  // Inside your init function
const init = async () => {
  try {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
    
    engine.current.initialize({ appId: APP_ID });
    
    engine.current.registerEventHandler({
      onJoinChannelSuccess: () => {
        setJoined(true);
        // Only update if we actually have a callId
        if (callId) {
          supabase.from('calls')
            .update({ status: 'active' })
            .eq('id', callId);
        }
      },
      onUserJoined: (_connection, uid) => {
        setRemoteUid(uid);
      },
      onUserOffline: () => setRemoteUid(0),
    });

    engine.current.enableVideo();
    engine.current.startPreview();

    engine.current.joinChannel('', channelName, localUid, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
    });
  } catch (e) { 
      console.error("Agora Init Error:", e); 
  }
};

  const handleSubscribe = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session not found");

      const now = new Date();
      let expiryDate = new Date();

      switch (plan.type) {
        case '1_day': expiryDate.setDate(now.getDate() + 1); break;
        case '1_week': expiryDate.setDate(now.getDate() + 7); break;
        case '2_weeks': expiryDate.setDate(now.getDate() + 14); break;
        case '1_month_recovery':
        case '1_month_family': expiryDate.setMonth(now.getMonth() + 1); break;
        default: expiryDate.setMonth(now.getMonth() + 1);
      }

      const { error } = await supabase
        .from('subscriptions')
        .insert([{
          doctor_id: doctorId,
          patient_id: user.id,
          patient_name: user.user_metadata?.full_name || 'Patient',
          plan_type: plan.name,
          expiry_date: expiryDate.toISOString()
        }]);

      if (error) throw error;

      setActivePlanName(plan.name);
      setShowSubModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
      
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const exitCall = () => {
    engine.current.leaveChannel();
    router.replace('/(patient-drawer)'); 
  };

  const onEndCall = async () => {
    await supabase.from('calls').update({ status: 'ended' }).eq('id', callId);
    exitCall();
  };

  const toggleMic = () => {
    setIsMuted(!isMuted);
    engine.current.muteLocalAudioStream(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoPaused(!isVideoPaused);
    engine.current.enableLocalVideo(isVideoPaused); 
  };

  return (
    <View style={styles.container}>
      {/* REMOTE VIDEO (Doctor) */}
      {remoteUid !== 0 ? (
        <RtcSurfaceView 
          canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }} 
          style={styles.fullScreenVideo} 
        />
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingLabel}>Calling Dr. {doctorName}...</Text>
          <View style={styles.statusBadge}>
            <Radio size={16} color="#10B981" />
            <Text style={styles.statusText}>Connecting to secure line...</Text>
          </View>
        </View>
      )}

      {/* LOCAL VIDEO (Patient) */}
      <View style={[styles.localVideoCard, isVideoPaused && styles.videoOffPlaceholder]}>
        {!isVideoPaused ? (
          <RtcSurfaceView 
            canvas={{ uid: localUid, mirrorMode: VideoMirrorModeType.VideoMirrorModeEnabled }} 
            style={styles.localVideo} 
          />
        ) : (
          <VideoOff size={32} color="#94A3B8" />
        )}
      </View>

      {/* OVERLAY CONTROLS */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topControls}>
          <TouchableOpacity onPress={() => engine.current.switchCamera()} style={styles.iconCircle}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <SwitchCamera size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowSubModal(true)} style={[styles.iconCircle, { backgroundColor: '#EAB308' }]}>
            <Star size={24} color="#FFF" fill="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSheetContainer}>
          <BlurView intensity={60} tint="dark" style={styles.bottomSheetBlur}>
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={toggleMic} style={[styles.controlBtn, isMuted && styles.dangerBtn]}>
                {isMuted ? <MicOff size={26} color="#FFF" /> : <Mic size={26} color="#FFF" />}
              </TouchableOpacity>

              <TouchableOpacity onPress={onEndCall} style={styles.endCallBtn}>
                <PhoneOff size={32} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleVideo} style={[styles.controlBtn, isVideoPaused && styles.warningBtn]}>
                {isVideoPaused ? <VideoOff size={26} color="#FFF" /> : <Video size={26} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>

      {/* MODALS REMAIN THE SAME... */}
      <Modal transparent visible={showSuccess} animationType="fade">
        <View style={styles.successOverlay}>
          <BlurView intensity={100} tint="dark" style={styles.successCard}>
            <View style={styles.checkCircle}>
              <CheckCircle2 size={50} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Plan Activated!</Text>
            <Text style={styles.successSub}>
              Your <Text style={{color: '#EAB308', fontWeight: '900'}}>{activePlanName}</Text> is now active.
            </Text>
          </BlurView>
        </View>
      </Modal>

      <Modal transparent visible={showSubModal} animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSubModal(false)} />
          <BlurView intensity={90} tint="dark" style={styles.subContent}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Subscription Options</Text>
                <Text style={styles.modalSubTitle}>Secure your care with Dr. {doctorName}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSubModal(false)}>
                <X size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <TouchableOpacity 
                  key={plan.id} 
                  style={[styles.planCard, plan.popular && styles.popularPlan]}
                  onPress={() => handleSubscribe(plan)}
                  disabled={loading}
                >
                  <View style={styles.planHeader}>
                    <View style={{flex: 1}}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                    </View>
                    <ChevronRight size={20} color="#EAB308" />
                  </View>
                  
                  <View style={styles.featuresList}>
                    {plan.features.map((feat, i) => (
                      <View key={i} style={styles.featRow}>
                        <CheckCircle2 size={14} color="#10B981" />
                        <Text style={styles.featText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>MOST POPULAR</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            {loading && <ActivityIndicator color="#EAB308" style={{ marginTop: 10 }} />}
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  fullScreenVideo: { ...StyleSheet.absoluteFillObject },
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitingLabel: { color: '#94A3B8', marginBottom: 12, fontSize: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusText: { color: '#FFF', marginLeft: 8, fontSize: 14, fontWeight: '600' },
  localVideoCard: { position: 'absolute', top: 60, right: 20, width: 110, height: 160, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: '#1E293B', zIndex: 10 },
  localVideo: { flex: 1 },
  videoOffPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topControls: { paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  bottomSheetContainer: { marginHorizontal: 20, marginBottom: 30, borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bottomSheetBlur: { paddingVertical: 20 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  endCallBtn: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  dangerBtn: { backgroundColor: '#F43F5E' },
  warningBtn: { backgroundColor: '#F59E0B' },
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  successCard: { width: '80%', padding: 30, borderRadius: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', overflow: 'hidden' },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 10 },
  successSub: { color: '#94A3B8', textAlign: 'center', fontSize: 16, lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  subContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%', paddingBottom: 40, overflow: 'hidden' },
  dragHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  modalSubTitle: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  planCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  popularPlan: { borderColor: '#EAB308', backgroundColor: 'rgba(234, 179, 8, 0.1)' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planName: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  planPrice: { color: '#EAB308', fontSize: 20, fontWeight: '900', marginTop: 4 },
  featuresList: { marginTop: 8 },
  featRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 },
  featText: { color: '#CBD5E1', fontSize: 14 },
  popularBadge: { position: 'absolute', top: -10, right: 20, backgroundColor: '#EAB308', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  popularText: { color: '#000', fontSize: 10, fontWeight: '900' }
});