import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, 
  PermissionsAndroid, Platform, Alert, TextInput, ScrollView, 
  KeyboardAvoidingView, ActivityIndicator, Keyboard
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router'; 
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType, RtcSurfaceView, VideoMirrorModeType, IRtcEngine, RenderModeType, AreaCode } from 'react-native-agora';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ClipboardList, Send, ChevronDown, Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const APP_ID = 'e8ea1a516c9b49d4af42422e2fcae0b3';

export default function DoctorVideoCall() {
  const { patientId, patientName, callId } = useLocalSearchParams(); 
  const router = useRouter();
  const engine = useRef<IRtcEngine>(createAgoraRtcEngine());
  const scrollRef = useRef<ScrollView>(null);
  
  // Call States
  const [remoteUid, setRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  // Prescription Dynamic State
  const [isPrescribing, setIsPrescribing] = useState(false);
  const [medList, setMedList] = useState([{ medication: '', dosage: '', duration: '', instructions: '' }]);
  const [loading, setLoading] = useState(false);

  // CRITICAL: Must match the Patient side channel name
  const channelName = (callId as string);
  const localUid = 200;

  useEffect(() => {
    if (!callId) return;

    const getChannelAndSubscribe = async () => {
      // 1. Fetch the actual UUID stored in the DB
      const { data, error } = await supabase
        .from('calls')
        .select('channel_name')
        .eq('id', callId)
        .single();

      if (data?.channel_name) {
        console.log("🚀 Specialist joining UUID channel:", data.channel_name);
        // 2. Mark the call as active
        await supabase.from('calls').update({ status: 'active' }).eq('id', callId);
        
        // 3. Initialize Agora with the correct UUID
        init(data.channel_name); 
      }

      // 4. Listen for status changes (e.g., patient hanging up)
      const callSubscription = supabase
        .channel(`call_status_${callId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'calls', 
          filter: `id=eq.${callId}` 
        }, (payload) => {
          if (payload.new.status === 'ended') exitCall();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(callSubscription);
        engine.current.leaveChannel();
        engine.current.release();
      };
    };

    getChannelAndSubscribe();
  }, [callId]);

// REMOVE THE OLD setupCall() ENTIRELY to avoid accidental init() calls without a channel name.

  const setupCall = async () => {
    // Automatically update status to 'in-progress' when doctor joins
    await supabase.from('calls').update({ status: 'active' }).eq('id', callId);
    init();
  };

  const init = async (actualChannelName: string) => {
    try {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
      }

      engine.current.initialize({ 
        appId: APP_ID,
        areaCode: AreaCode.AreaCodeGlobal 
      });

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection) => {
          console.log("✅ Specialist Success: Joined channel", connection.channelId);
        },
        onUserJoined: (_connection, uid) => {
          console.log("👤 Patient Joined! Remote UID:", uid);
          setRemoteUid(uid);
        },
        onUserOffline: () => {
          setRemoteUid(0);
        }
      });

      engine.current.enableVideo();
      engine.current.enableAudio();
      engine.current.startPreview();

      // We use the UUID fetched from the DB
      engine.current.joinChannel('', actualChannelName, localUid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });

    } catch (e) {
      console.error("Agora Init Failed:", e);
    }
  };

  // UI Actions
  const addMedication = () => {
    setMedList([...medList, { medication: '', dosage: '', duration: '', instructions: '' }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };
  
  const removeMedication = (index: number) => {
    if (medList.length > 1) {
      const newList = [...medList];
      newList.splice(index, 1);
      setMedList(newList);
    }
  };

  const updateMed = (index: number, field: string, value: string) => {
    const newList = [...medList];
    // @ts-ignore
    newList[index][field] = value;
    setMedList(newList);
  };

  const handleIssuePrescription = async () => {
    if (!medList[0].medication) return Alert.alert("Incomplete", "Please enter at least one medication.");
    setLoading(true);
    Keyboard.dismiss();
    
    const { data: { user } } = await supabase.auth.getUser();

    const inserts = medList.map(m => ({
      doctor_id: user?.id,
      patient_id: patientId,
      medication: m.medication,
      dosage: m.dosage,
      duration: m.duration,
      instructions: m.instructions,
      status: "Active",
      date: new Date().toISOString() // Better for DB sorting
    }));

    const { error } = await supabase.from("prescriptions").insert(inserts);
    setLoading(false);
    if (!error) {
      Alert.alert("Authorized", `Prescriptions for ${patientName} have been synced.`);
      setIsPrescribing(false);
      setMedList([{ medication: '', dosage: '', duration: '', instructions: '' }]);
    } else {
      Alert.alert("Sync Error", error.message);
    }
  };

  const exitCall = () => {
    engine.current.leaveChannel();
    router.replace('/(freelancer-drawer)'); 
  };

  const onEndCall = async () => {
    await supabase.from('calls').update({ status: 'ended' }).eq('id', callId);
    exitCall();
  };

  return (
    <View style={styles.container}>
      {/* BACKGROUND: REMOTE VIDEO */}
      {remoteUid !== 0 ? (
        <RtcSurfaceView canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }} style={styles.fullScreenVideo} />
      ) : (
        <View style={styles.waitingContainer}>
            <ActivityIndicator color="#38BDF8" style={{ marginBottom: 20 }} />
            <Text style={styles.waitingText}>WAITING FOR PATIENT...</Text>
        </View>
      )}

      {/* FLOATING: LOCAL VIDEO */}
      <View style={styles.localVideoCard}>
        <RtcSurfaceView canvas={{ uid: 0, mirrorMode: VideoMirrorModeType.VideoMirrorModeEnabled }} style={styles.localVideo} />
      </View>

      {/* THE PRESCRIPTION BLADE */}
      {isPrescribing && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrapper}
        >
          <BlurView intensity={120} tint="dark" style={styles.glassBlade}>
            <View style={styles.dragHandle} />
            
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Rx Terminal</Text>
                <Text style={styles.sheetSubtitle}>SYNCING WITH: {patientName}</Text>
              </View>
              <TouchableOpacity onPress={() => { Keyboard.dismiss(); setIsPrescribing(false); }}>
                <ChevronDown size={30} color="#38BDF8" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              ref={scrollRef}
              style={{ flex: 1 }} 
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {medList.map((item, index) => (
                <View key={index} style={styles.medCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.medCount}>ENTRY 0{index + 1}</Text>
                    {index > 0 && (
                      <TouchableOpacity onPress={() => removeMedication(index)}>
                        <Trash2 size={18} color="#F43F5E" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TextInput 
                    placeholder="Medication Name" placeholderTextColor="#475569"
                    style={styles.futuristicInput} value={item.medication}
                    onChangeText={(val) => updateMed(index, 'medication', val)}
                  />
                  <View style={styles.row}>
                    <TextInput 
                      placeholder="Dosage" placeholderTextColor="#475569"
                      style={[styles.futuristicInput, { flex: 1, marginRight: 10 }]} value={item.dosage}
                      onChangeText={(val) => updateMed(index, 'dosage', val)}
                    />
                    <TextInput 
                      placeholder="Duration" placeholderTextColor="#475569"
                      style={[styles.futuristicInput, { flex: 1 }]} value={item.duration}
                      onChangeText={(val) => updateMed(index, 'duration', val)}
                    />
                  </View>
                  <TextInput 
                    placeholder="Special Instructions" placeholderTextColor="#475569"
                    style={[styles.futuristicInput, { height: 50 }]} multiline
                    value={item.instructions} onChangeText={(val) => updateMed(index, 'instructions', val)}
                  />
                </View>
              ))}

              <TouchableOpacity onPress={addMedication} style={styles.addBtn}>
                <Plus size={18} color="#38BDF8" />
                <Text style={styles.addBtnText}>ADD NEW MEDICATION</Text>
              </TouchableOpacity>

              <TouchableOpacity disabled={loading} onPress={handleIssuePrescription} style={styles.glowBtn}>
                {loading ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Send size={20} color="#000" style={{ marginRight: 10 }} />
                    <Text style={styles.glowBtnText}>AUTHORIZE SYNC</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </BlurView>
        </KeyboardAvoidingView>
      )}

      {/* BOTTOM HUD CONTROLS */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.controlHub}>
          <BlurView intensity={40} tint="dark" style={styles.controlBlur}>
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={() => { setIsMuted(!isMuted); engine.current.muteLocalAudioStream(!isMuted); }} 
                style={[styles.circleBtn, isMuted && styles.dangerBtn]}>
                {isMuted ? <MicOff size={22} color="#FFF" /> : <Mic size={22} color="#FFF" />}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsPrescribing(true)} style={[styles.circleBtn, { backgroundColor: '#38BDF8' }]}>
                <ClipboardList size={22} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={onEndCall} style={styles.mainEndBtn}><PhoneOff size={28} color="#FFF" /></TouchableOpacity>

              <TouchableOpacity onPress={() => { setIsVideoPaused(!isVideoPaused); engine.current.enableLocalVideo(isVideoPaused); }}
                style={[styles.circleBtn, isVideoPaused && styles.dangerBtn]}>
                {isVideoPaused ? <VideoOff size={22} color="#FFF" /> : <Video size={22} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fullScreenVideo: { ...StyleSheet.absoluteFillObject },
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' },
  waitingText: { color: '#38BDF8', fontSize: 10, letterSpacing: 4, fontWeight: 'bold' },
  localVideoCard: { position: 'absolute', top: 50, right: 20, width: 90, height: 130, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.5)', zIndex: 10 },
  localVideo: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  controlHub: { marginHorizontal: 30, marginBottom: 30, borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  controlBlur: { paddingVertical: 10 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  circleBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  dangerBtn: { backgroundColor: '#EF4444' },
  mainEndBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  sheetWrapper: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
  glassBlade: { height: '85%', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 25, borderTopWidth: 1, borderColor: 'rgba(56, 189, 248, 0.4)' },
  dragHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sheetTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  sheetSubtitle: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
  medCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  medCount: { color: '#64748B', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  row: { flexDirection: 'row' },
  futuristicInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: 15, color: '#FFF', fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#38BDF8', borderRadius: 18, marginBottom: 20 },
  addBtnText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 11, marginLeft: 10, letterSpacing: 1 },
  glowBtn: { backgroundColor: '#38BDF8', flexDirection: 'row', padding: 20, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#38BDF8', shadowRadius: 25, shadowOpacity: 0.6 },
  glowBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 2 }
});