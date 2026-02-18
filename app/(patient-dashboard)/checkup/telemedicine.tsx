import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  PermissionsAndroid, 
  Platform 
} from 'react-native';
import { BlurView } from 'expo-blur';
// 1. Add these for Expo Router
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
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  SwitchCamera, 
  Radio 
} from 'lucide-react-native';

const APP_ID = 'caa371430b3246f98baa0322879d02f1';

// 2. Change to default export and use router/params
export default function VideoCallScreen() {
  const { doctorId, doctorName } = useLocalSearchParams(); // Get data from Checkup screen
  const router = useRouter();
  
  const engine = useRef<IRtcEngine>(createAgoraRtcEngine());
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // We use the doctorId as the channel name so both parties join the same room
  const channelName = (doctorId as string) || 'test-room';

  useEffect(() => {
    init();
    return () => {
      engine.current.leaveChannel();
      engine.current.release();
    };
  }, []);

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
        onJoinChannelSuccess: () => setJoined(true),
        onUserJoined: (_connection, uid) => setRemoteUid(uid),
        onUserOffline: () => setRemoteUid(0),
      });

      engine.current.enableVideo();
      engine.current.setVideoEncoderConfiguration({
        dimensions: { width: 640, height: 480 },
        frameRate: 24, 
        bitrate: 800,
      });

      engine.current.joinChannel('', channelName, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });
    } catch (e) { console.error(e); }
  };

  const onEndCall = () => {
    engine.current.leaveChannel();
    router.replace('/(patient-dashboard)'); // Or wherever you want them to go after the call
  };

  const toggleMic = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    engine.current.muteLocalAudioStream(newState);
  };

  const toggleVideo = () => {
    const newState = !isVideoPaused;
    setIsVideoPaused(newState);
    engine.current.enableLocalVideo(!newState); 
  };

  const switchCamera = () => {
    engine.current.switchCamera();
    setIsFrontCamera(!isFrontCamera);
  };

  return (
    <View style={styles.container}>
      {/* REMOTE VIDEO */}
      {remoteUid !== 0 ? (
        <RtcSurfaceView 
          canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }} 
          style={styles.fullScreenVideo} 
        />
      ) : (
        <View style={styles.waitingContainer}>
           <Text style={{color: '#64748b', marginBottom: 10}}>Calling {doctorName}...</Text>
          <View style={styles.statusBadge}>
            <Radio size={16} color="#10B981" />
            <Text style={styles.statusText}>Connecting to secure line...</Text>
          </View>
        </View>
      )}

      {/* LOCAL VIDEO CARD */}
      {!isVideoPaused ? (
        <View style={styles.localVideoCard}>
          <RtcSurfaceView 
            canvas={{ 
              uid: 0, 
              mirrorMode: isFrontCamera ? VideoMirrorModeType.VideoMirrorModeEnabled : VideoMirrorModeType.VideoMirrorModeDisabled 
            }} 
            style={styles.localVideo} 
          />
        </View>
      ) : (
        <View style={[styles.localVideoCard, styles.videoOffPlaceholder]}>
          <VideoOff size={32} color="#94A3B8" />
        </View>
      )}

      {/* OVERLAY CONTROLS */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topControls}>
          <TouchableOpacity onPress={switchCamera} style={styles.iconCircle}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <SwitchCamera size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSheetContainer}>
          <BlurView 
            intensity={60} 
            tint="dark" 
            style={styles.bottomSheetBlur}
          >
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
    </View>
  );
}

// ... styles remain the same ...

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  fullScreenVideo: { ...StyleSheet.absoluteFillObject },
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusText: { color: '#FFF', marginLeft: 8, fontSize: 14, fontWeight: '600' },
  
  localVideoCard: {
    position: 'absolute', top: 60, right: 20,
    width: 110, height: 160, borderRadius: 24,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: '#1E293B', elevation: 20, zIndex: 10
  },
  localVideo: { flex: 1 },
  videoOffPlaceholder: { justifyContent: 'center', alignItems: 'center' },

  overlay: { flex: 1, justifyContent: 'space-between' },
  topControls: { paddingHorizontal: 20, paddingTop: 10 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },

  bottomSheetContainer: { marginHorizontal: 20, marginBottom: 30, borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bottomSheetBlur: { paddingVertical: 20, paddingHorizontal: 10 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  endCallBtn: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#EF4444', shadowOpacity: 0.5, shadowRadius: 15 },
  dangerBtn: { backgroundColor: '#F43F5E' },
  warningBtn: { backgroundColor: '#F59E0B' },
});