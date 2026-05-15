import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, PermissionsAndroid, Platform, Alert 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router'; 
import { 
  createAgoraRtcEngine, 
  ChannelProfileType, 
  ClientRoleType, 
  RtcSurfaceView, 
  VideoMirrorModeType,
  IRtcEngine,
  RenderModeType
} from 'react-native-agora';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera, Radio 
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const APP_ID = 'e8ea1a516c9b49d4af42422e2fcae0b3';

export default function FacilityCallScreen() {
  // Now pulling facilityId and facilityName specifically
  const { facilityId, facilityName, callId } = useLocalSearchParams(); 
  const router = useRouter();
  
  const engine = useRef<IRtcEngine>(createAgoraRtcEngine());
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  // Channel is defined by the unique Facility ID
  const channelName = (facilityId as string)?.toLowerCase().trim();

  // --- 1. REAL-TIME CALL MONITORING ---
  useEffect(() => {
    if (!callId) return;

    const callSubscription = supabase
      .channel(`facility_call_${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          // Check if facility rep ended the call
          if (payload.new.status === 'ended' || payload.new.status === 'declined') {
             terminateSession();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callSubscription);
    };
  }, [callId]);

  // --- 2. AGORA ENGINE SETUP ---
  useEffect(() => {
    if (!channelName) {
      Alert.alert("Error", "Invalid Facility Room.");
      router.back();
      return;
    }
    initAgora();
    return () => {
      engine.current.leaveChannel();
      engine.current.release();
    };
  }, []);

  const initAgora = async () => {
    try {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
      }

      engine.current.initialize({ appId: APP_ID });
      
      engine.current.registerEventHandler({
        onJoinChannelSuccess: () => setJoined(true),
        onUserJoined: (_connection, uid) => setRemoteUid(uid),
        onUserOffline: () => setRemoteUid(0),
      });

      engine.current.enableVideo();
      engine.current.joinChannel('', channelName, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });
    } catch (e) { console.error("Agora Setup Error:", e); }
  };

  // --- 3. UI ACTIONS ---
  const terminateSession = () => {
    engine.current.leaveChannel();
    router.replace('/search-facilities'); 
  };

  const onHangUp = async () => {
    // Update the record using the new facility_id structure
    await supabase
      .from('calls')
      .update({ status: 'ended' })
      .eq('id', callId);
    
    terminateSession();
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
      {/* FACILITY VIDEO FEED (REMOTE) */}
      {remoteUid !== 0 ? (
        <RtcSurfaceView 
          canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }} 
          style={styles.fullView} 
        />
      ) : (
        <View style={styles.waitingZone}>
          <Text style={styles.waitingText}>Connecting to {facilityName}...</Text>
          <View style={styles.liveIndicator}>
            <Radio size={18} color="#0EA5E9" />
            <Text style={styles.liveLabel}>Waiting for staff to pick up...</Text>
          </View>
        </View>
      )}

      {/* PATIENT VIDEO FEED (LOCAL PIP) */}
      <View style={[styles.pipCard, isVideoPaused && styles.pipOff]}>
        {!isVideoPaused ? (
          <RtcSurfaceView 
            canvas={{ uid: 0, mirrorMode: VideoMirrorModeType.VideoMirrorModeEnabled }} 
            style={styles.pipVideo} 
          />
        ) : (
          <VideoOff size={24} color="#64748B" />
        )}
      </View>

      {/* CALL CONTROLS */}
      <SafeAreaView style={styles.uiLayer} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => engine.current.switchCamera()} style={styles.roundBtn}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <SwitchCamera size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.controlWrapper}>
          <BlurView intensity={90} tint="dark" style={styles.blurPad}>
            <View style={styles.btnRow}>
              <TouchableOpacity onPress={toggleMic} style={[styles.actionBtn, isMuted && styles.bgRed]}>
                {isMuted ? <MicOff size={24} color="#FFF" /> : <Mic size={24} color="#FFF" />}
              </TouchableOpacity>

              <TouchableOpacity onPress={onHangUp} style={styles.hangUpBtn}>
                <PhoneOff size={32} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleVideo} style={[styles.actionBtn, isVideoPaused && styles.bgOrange]}>
                {isVideoPaused ? <VideoOff size={24} color="#FFF" /> : <Video size={24} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  fullView: { ...StyleSheet.absoluteFillObject },
  waitingZone: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitingText: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', paddingHorizontal: 40 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: 'rgba(14, 165, 233, 0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)' },
  liveLabel: { color: '#38BDF8', marginLeft: 10, fontWeight: '700' },
  pipCard: { position: 'absolute', top: 50, right: 20, width: 120, height: 180, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: '#0F172A', zIndex: 10 },
  pipVideo: { flex: 1 },
  pipOff: { justifyContent: 'center', alignItems: 'center' },
  uiLayer: { flex: 1, justifyContent: 'space-between' },
  topBar: { padding: 20 },
  roundBtn: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  controlWrapper: { marginHorizontal: 30, marginBottom: 50, borderRadius: 40, overflow: 'hidden', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  blurPad: { paddingVertical: 30 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  actionBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  hangUpBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', shadowColor: '#EF4444', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  bgRed: { backgroundColor: '#F43F5E' },
  bgOrange: { backgroundColor: '#F59E0B' }
});