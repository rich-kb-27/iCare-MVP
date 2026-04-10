import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

const { width } = Dimensions.get("window");

export default function PatientChatScreen() {
  const { id, name } = useLocalSearchParams(); 
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [doctorAvatar, setDoctorAvatar] = useState<string | null>(null);
  
  // Voice Recording States
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentlyPlayingMsg, setCurrentlyPlayingMsg] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackObj = useRef<Audio.Sound | null>(null);
  const messagePlaybackObj = useRef<Audio.Sound | null>(null);

  // 1. INITIAL DATA FETCH
  useEffect(() => {
    isMounted.current = true;
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data: doc } = await supabase
        .from("profiles_table") 
        .select("avatar_url")
        .eq("id", id)
        .single();
      
      if (doc?.avatar_url) setDoctorAvatar(doc.avatar_url);
    };

    initChat();
    return () => { isMounted.current = false; };
  }, [id]);

  // 2. REALTIME MESSAGES
  useEffect(() => {
    if (!userId) return;

    fetchMessages();
    markAsRead();

    const subscription = supabase
      .channel(`chat_room_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newMessage = payload.new;
          const isRelevant = 
            (newMessage.sender_id === userId && newMessage.receiver_id === id) ||
            (newMessage.sender_id === id && newMessage.receiver_id === userId);
          
          if (isRelevant && isMounted.current) {
            setMessages((prev) => [...prev, newMessage]);
            if (newMessage.receiver_id === userId) markAsRead();
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [userId, id]);

  // 3. TIMER LOGIC
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const markAsRead = async () => {
    await supabase.from("messages").update({ is_read: true }).eq("receiver_id", userId).eq("sender_id", id).eq("is_read", false);
  };

  // 4. AUDIO HANDLERS
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setSeconds(0);
      setIsRecording(true);
    } catch (err) { console.error(err); }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      setRecordingUri(recording.getURI());
      setRecording(null);
    } catch (error) { console.error(error); }
  };

  const deleteRecording = async () => {
    if (playbackObj.current) await playbackObj.current.unloadAsync();
    setRecordingUri(null);
    setSeconds(0);
    setIsPlayingPreview(false);
  };

  const playPreview = async () => {
    if (!recordingUri) return;
    if (isPlayingPreview) {
      await playbackObj.current?.stopAsync();
      setIsPlayingPreview(false);
      return;
    }
    const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
    playbackObj.current = sound;
    setIsPlayingPreview(true);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status: any) => { if (status.didJustFinish) setIsPlayingPreview(false); });
  };

  const playMessageAudio = async (url: string, msgId: string) => {
    try {
      if (currentlyPlayingMsg === msgId) {
        await messagePlaybackObj.current?.stopAsync();
        setCurrentlyPlayingMsg(null);
        return;
      }
      if (messagePlaybackObj.current) await messagePlaybackObj.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      messagePlaybackObj.current = sound;
      setCurrentlyPlayingMsg(msgId);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s: any) => { if (s.didJustFinish) setCurrentlyPlayingMsg(null); });
    } catch (e) { console.error(e); }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // 5. SEND HANDLERS
  const pickDocument = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (result.canceled) return;

      const file = result.assets[0];
      const fileName = `${Date.now()}_${file.name}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: fileName,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(`${userId}/${fileName}`, formData);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(`${userId}/${fileName}`);

      await supabase.from("messages").insert([{ 
        sender_id: userId, 
        receiver_id: id, 
        content: file.name, 
        media_url: publicUrl,
        message_type: 'file'
      }]);
    } catch (e) { Alert.alert("Upload Error", "Could not attach document."); }
  };

  const sendMessage = async () => {
    if (inputText.trim() === "" || !userId) return;
    const { error } = await supabase.from("messages").insert([{ 
      sender_id: userId, 
      receiver_id: id, 
      content: inputText.trim(),
      message_type: 'text' 
    }]);
    if (!error) setInputText("");
  };

  const sendVoiceNote = async () => {
    if (!recordingUri || !userId) return;
    try {
      const fileName = `voice_${userId}_${Date.now()}.m4a`;
      const formData = new FormData();
      formData.append('file', { uri: recordingUri, name: fileName, type: 'audio/m4a' } as any);

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(`${userId}/${fileName}`, formData);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(`${userId}/${fileName}`);

      const { error } = await supabase.from("messages").insert([{ 
        sender_id: userId, 
        receiver_id: id, 
        content: "🎤 Voice Message", 
        media_url: publicUrl,
        message_type: 'voice'
      }]);

      if (!error) deleteRecording();
    } catch (e) { Alert.alert("Error", "Could not send voice note."); }
  };

  const renderMessage = ({ item }: any) => {
    const isMine = item.sender_id === userId;
    const isVoice = item.message_type === 'voice';
    const isFile = item.message_type === 'file';
    const isPlaying = currentlyPlayingMsg === item.id;

    return (
      <View style={[styles.messageRow, isMine ? styles.rowRight : styles.rowLeft]}>
        {!isMine && (
          <View style={styles.avatarMini}>
            {doctorAvatar ? <Image source={{ uri: doctorAvatar }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>D</Text>}
          </View>
        )}
        <View style={styles.messageWrapper}>
          <LinearGradient 
            colors={isMine ? ["#0EA5E9", "#0284C7"] : ["#1E293B", "#0F172A"]} 
            style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}
          >
            {isVoice ? (
              <TouchableOpacity style={styles.mediaBubbleContent} onPress={() => playMessageAudio(item.media_url, item.id)}>
                <Ionicons name={isPlaying ? "stop" : "play"} size={22} color="#FFF" />
                <View style={styles.voiceVisualizer}>
                    <View style={[styles.voiceBar, {height: 12}]} /><View style={[styles.voiceBar, {height: 20}]} />
                    <View style={[styles.voiceBar, {height: 15}]} /><View style={[styles.voiceBar, {height: 22}]} />
                </View>
                <Text style={styles.mediaText}>Voice</Text>
              </TouchableOpacity>
            ) : isFile ? (
              <TouchableOpacity style={styles.mediaBubbleContent} onPress={() => Linking.openURL(item.media_url)}>
                <Feather name="file-text" size={20} color="#FFF" />
                <Text style={[styles.mediaText, {marginLeft: 10}]} numberOfLines={1}>{item.content}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.msgText, isMine ? styles.myText : styles.theirText]}>{item.content}</Text>
            )}
          </LinearGradient>
          <View style={[styles.metaRow, isMine && { justifyContent: 'flex-end' }]}>
            <Text style={styles.timeText}>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            {isMine && <MaterialCommunityIcons name={item.is_read ? "check-all" : "check"} size={14} color={item.is_read ? "#38BDF8" : "#475569"} style={{ marginLeft: 4 }} />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.gradientBg}>
        <View style={styles.bgIconContainer} pointerEvents="none">
            <MaterialCommunityIcons name="stethoscope" size={140} color="rgba(255,255,255,0.02)" style={{position: 'absolute', top: 100, left: -30}} />
            <MaterialCommunityIcons name="heart-pulse" size={180} color="rgba(255,255,255,0.02)" style={{position: 'absolute', bottom: 200, right: -40}} />
        </View>

        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={28} color="#FFF" /></TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{name || "Specialist"}</Text>
              <Text style={styles.onlineText}>Secure Channel</Text>
            </View>
            <TouchableOpacity 
              style={styles.callBtn} 
              onPress={() => router.push({ pathname: "/(patient-dashboard)/tele-consultation", params: { doctorId: id } })}
            >
              <MaterialCommunityIcons name="video-outline" size={24} color="#0EA5E9" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={renderMessage}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => { try { flatListRef.current?.scrollToEnd({ animated: true }); } catch (e) {} }}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                {!isRecording && !recordingUri && (
                  <TouchableOpacity onPress={pickDocument} style={styles.attachmentBtn}>
                    <Feather name="plus" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                )}

                {isRecording ? (
                  <View style={styles.recordingStatus}><View style={styles.redDot} /><Text style={styles.recordingText}>Recording {formatTime(seconds)}</Text></View>
                ) : recordingUri ? (
                  <View style={styles.previewContainer}>
                    <TouchableOpacity onPress={deleteRecording} style={styles.actionIcon}><Feather name="trash-2" size={20} color="#EF4444" /></TouchableOpacity>
                    <Text style={styles.recordingText}>Voice Note ({formatTime(seconds)})</Text>
                    <TouchableOpacity onPress={playPreview} style={styles.actionIcon}><Ionicons name={isPlayingPreview ? "stop-circle" : "play-circle"} size={32} color="#0EA5E9" /></TouchableOpacity>
                  </View>
                ) : (
                  <TextInput style={styles.input} placeholder="Message..." placeholderTextColor="#64748B" value={inputText} onChangeText={setInputText} />
                )}

                {recordingUri ? (
                  <TouchableOpacity onPress={sendVoiceNote} style={styles.sendActionBtn}><Ionicons name="send" size={20} color="#FFF" /></TouchableOpacity>
                ) : (inputText.trim().length > 0) ? (
                  <TouchableOpacity onPress={sendMessage} style={styles.sendActionBtn}><Ionicons name="send" size={20} color="#FFF" /></TouchableOpacity>
                ) : (
                  <TouchableOpacity onLongPress={startRecording} onPressOut={stopRecording} style={[styles.micBtn, isRecording && styles.micBtnActive]}>
                    <MaterialCommunityIcons name={isRecording ? "microphone" : "microphone-outline"} size={24} color={isRecording ? "#FFF" : "#94A3B8"} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#0F172A" },
  gradientBg: { flex: 1 },
  bgIconContainer: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "rgba(15,23,42,0.9)", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backBtn: { padding: 5 },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  onlineText: { color: "#22C55E", fontSize: 10, fontWeight: '600' },
  callBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(14,165,233,0.1)", justifyContent: "center", alignItems: "center" },
  listContent: { padding: 15, paddingBottom: 20 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 15 },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  avatarMini: { width: 32, height: 32, borderRadius: 16, marginRight: 8, overflow: 'hidden', backgroundColor: '#1E293B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#FFF', fontSize: 12, textAlign: 'center', marginTop: 6 },
  messageWrapper: { maxWidth: "78%" },
  bubble: { padding: 12, borderRadius: 18 },
  myBubble: { borderBottomRightRadius: 2 },
  theirBubble: { borderBottomLeftRadius: 2, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  msgText: { fontSize: 15, color: "#FFF", lineHeight: 20 },
  myText: { color: "#FFF", fontWeight: "500" },
  theirText: { color: "#E2E8F0" },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { color: "#475569", fontSize: 10 },
  inputWrapper: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: "#0F172A", borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 25, paddingLeft: 8, height: 50 },
  attachmentBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, color: "#FFF", fontSize: 16, paddingHorizontal: 10 },
  sendActionBtn: { backgroundColor: '#0EA5E9', width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  micBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  micBtnActive: { backgroundColor: '#EF4444', borderRadius: 20 },
  recordingStatus: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 8 },
  recordingText: { color: '#FFF', fontSize: 14, fontWeight: '600', flex: 1 },
  previewContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  actionIcon: { padding: 4 },
  mediaBubbleContent: { flexDirection: 'row', alignItems: 'center', minWidth: 120 },
  mediaText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  voiceVisualizer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  voiceBar: { width: 3, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 1, borderRadius: 2 },
});