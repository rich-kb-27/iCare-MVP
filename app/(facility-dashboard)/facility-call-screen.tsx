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
  Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera, User, Activity
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const APP_ID = 'e8ea1a516c9b49d4af42422e2fcae0b3';

export default function FacilityCallScreen() {
  const { facilityId, patientName, callId } = useLocalSearchParams(); 
  const router = useRouter();
  
  const engine = useRef<IRtcEngine>(createAgoraRtcEngine());
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  const channelName = (facilityId as string)?.toLowerCase().trim();

  useEffect(() => {
    initAgora();
    
    // Listen for patient hanging up
    const callSubscription = supabase
      .channel(`call_status_${callId}`)
      .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'calls', 
          filter: `id=eq.${callId}` 
        }, 
        (payload) => {
          if (payload.new.status === 'ended') {
            terminateSession();
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(callSubscription);
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
    } catch (e) { console.error(e); }
  };

  const terminateSession = () => {
    engine.current.leaveChannel();
    router.replace('/(facility-drawer)'); 
  };

  const onHangUp = async () => {
    await supabase.from('calls').update({ status: 'ended' }).eq('id', callId);
    terminateSession();
  };

  return (
    <View style={styles.container}>
      {/* MAIN VIEW: THE PATIENT */}
      {remoteUid !== 0 ? (
        <RtcSurfaceView 
          canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }} 
          style={styles.fullView} 
        />
      ) : (
        <View style={styles.waitingContainer}>
          <Activity size={40} color="#0EA5E9" />
          <Text style={styles.waitingText}>Connecting to Patient...</Text>
        </View>
      )}

      {/* TOP INFO BAR */}
      <SafeAreaView style={styles.topOverlay}>
        <BlurView intensity={20} tint="dark" style={styles.infoBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.patientNameText}>{patientName || "Ongoing Session"}</Text>
        </BlurView>
        
        <TouchableOpacity 
          onPress={() => engine.current.switchCamera()} 
          style={styles.utilityBtn}
        >
          <SwitchCamera size={20} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* FACILITY LOCAL PREVIEW (PiP) */}
      <View style={styles.pipContainer}>
        {!isVideoPaused ? (
          <RtcSurfaceView 
            canvas={{ uid: 0, mirrorMode: VideoMirrorModeType.VideoMirrorModeEnabled }} 
            style={styles.pipVideo} 
          />
        ) : (
          <View style={styles.pipPlaceholder}>
            <User size={24} color="#475569" />
          </View>
        )}
      </View>

      {/* CONTROL DASHBOARD */}
      <View style={styles.bottomActions}>
        <BlurView intensity={80} tint="dark" style={styles.controlsBlur}>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              onPress={() => {
                setIsMuted(!isMuted);
                engine.current.muteLocalAudioStream(!isMuted);
              }}
              style={[styles.iconBtn, isMuted && styles.activeRed]}
            >
              {isMuted ? <MicOff size={26} color="#FFF" /> : <Mic size={26} color="#FFF" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={onHangUp} style={styles.endCallBtn}>
              <PhoneOff size={32} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setIsVideoPaused(!isVideoPaused);
                engine.current.enableLocalVideo(!isVideoPaused);
              }}
              style={[styles.iconBtn, isVideoPaused && styles.activeOrange]}
            >
              {isVideoPaused ? <VideoOff size={26} color="#FFF" /> : <Video size={26} color="#FFF" />}
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  fullView: { ...StyleSheet.absoluteFillObject },
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  waitingText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 20,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 10 },
  patientNameText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  utilityBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  pipContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    width: 110,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: '#0F172A',
    zIndex: 30,
  },
  pipVideo: { flex: 1 },
  pipPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  bottomActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  controlsBlur: {
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 20,
  },
  actionRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  iconBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallBtn: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  activeRed: { backgroundColor: '#F43F5E' },
  activeOrange: { backgroundColor: '#F59E0B' },
});