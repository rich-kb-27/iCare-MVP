import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions, Alert, Linking, Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams(); 
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  
  // New state for the chat partner's profile
  const [partnerProfile, setPartnerProfile] = useState<{avatar_url: string | null, full_name: string | null} | null>(null);

  // Voice Note States
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentlyPlayingMsg, setCurrentlyPlayingMsg] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackObj = useRef<Audio.Sound | null>(null);
  const messagePlaybackObj = useRef<Audio.Sound | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 1. Fetch My ID and the Partner's Profile
  useEffect(() => {
    const getInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      // Fetch the other person's profile pic
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", id)
        .single();
      
      if (profile) setPartnerProfile(profile);
    };
    getInitialData();
  }, [id]);

  useEffect(() => {
    if (!userId) return;
    fetchMessages();
    const subscription = supabase
      .channel(`chat_room_${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;
          const isRelevant = 
            (newMessage.sender_id === userId && newMessage.receiver_id === id) ||
            (newMessage.sender_id === id && newMessage.receiver_id === userId);
          if (isRelevant) setMessages((prev) => [...prev, newMessage]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [userId, id]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const fetchMessages = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });
    if (!error && data) setMessages(data);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // --- AUDIO LOGIC ---
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
    sound.setOnPlaybackStatusUpdate((s: any) => { if (s.didJustFinish) setIsPlayingPreview(false); });
  };

  const playMessageAudio = async (url: string, msgId: string) => {
    try {
      if (currentlyPlayingMsg === msgId) { await messagePlaybackObj.current?.stopAsync(); setCurrentlyPlayingMsg(null); return; }
      if (messagePlaybackObj.current) await messagePlaybackObj.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      messagePlaybackObj.current = sound;
      setCurrentlyPlayingMsg(msgId);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s: any) => { if (s.didJustFinish) setCurrentlyPlayingMsg(null); });
    } catch (e) { console.error(e); }
  };

  // --- SEND HANDLERS ---
  const sendVoiceNote = async () => {
    if (!recordingUri || !userId) return;
    try {
      const fileName = `voice_${userId}_${Date.now()}.m4a`;
      const formData = new FormData();
      formData.append('file', { uri: recordingUri, name: fileName, type: 'audio/m4a' } as any);
      
      const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(`${userId}/${fileName}`, formData);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(`${userId}/${fileName}`);
      await supabase.from("messages").insert([{ 
        sender_id: userId, receiver_id: id, content: "🎤 Voice Message", media_url: publicUrl, message_type: 'voice'
      }]);
      deleteRecording();
    } catch (e) { Alert.alert("Error", "Could not send voice note."); }
  };

  const pickAndUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (result.canceled) return;
      const file = result.assets[0];
      const fileName = `${Date.now()}_${file.name}`;
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: fileName, type: file.mimeType || 'application/octet-stream' } as any);

      const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(`${userId}/${fileName}`, formData);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(`${userId}/${fileName}`);
      await supabase.from("messages").insert([{ 
        sender_id: userId, receiver_id: id, content: file.name, media_url: publicUrl, message_type: 'file'
      }]);
    } catch (e) { Alert.alert("Upload Error", "Could not send document."); }
  };

  const sendMessage = async () => {
    if (inputText.trim() === "" || !userId) return;
    const { error } = await supabase.from("messages").insert([{ 
      sender_id: userId, receiver_id: id, content: inputText.trim(), message_type: 'text' 
    }]);
    if (!error) setInputText("");
  };

  const renderMessage = ({ item }: any) => {
    const isMine = item.sender_id === userId;
    const isVoice = item.message_type === 'voice';
    const isFile = item.message_type === 'file';
    const isPlaying = currentlyPlayingMsg === item.id;

    // Determine Avatar
    const avatarUri = partnerProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name?.toString() || "P")}&background=0EA5E9&color=fff`;

    return (
      <View style={[styles.messageRow, isMine ? styles.rowRight : styles.rowLeft]}>
        {!isMine && (
          <Image source={{ uri: avatarUri }} style={styles.avatarMini} />
        )}
        <View style={styles.messageWrapper}>
          <LinearGradient
            colors={isMine ? ["#0EA5E9", "#0284C7"] : ["#1E293B", "#0F172A"]}
            style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}
          >
            {isVoice ? (
              <TouchableOpacity style={styles.mediaRow} onPress={() => playMessageAudio(item.media_url, item.id)}>
                <Ionicons name={isPlaying ? "stop" : "play"} size={22} color="#FFF" />
                <View style={styles.voiceVisualizer}><View style={styles.bar}/><View style={[styles.bar, {height: 18}]}/><View style={styles.bar}/></View>
                <Text style={styles.mediaText}>Voice Note</Text>
              </TouchableOpacity>
            ) : isFile ? (
              <TouchableOpacity style={styles.mediaRow} onPress={() => Linking.openURL(item.media_url)}>
                <Feather name="file-text" size={20} color="#FFF" />
                <Text style={[styles.mediaText, {marginLeft: 8}]} numberOfLines={1}>{item.content}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.msgText, isMine ? styles.myText : styles.theirText]}>{item.content}</Text>
            )}
          </LinearGradient>
          <Text style={[styles.timeText, isMine && { textAlign: 'right' }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={StyleSheet.absoluteFill} />
      
      <View style={styles.backgroundGlowLeft} />
      <View style={styles.backgroundGlowRight} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={28} color="#FFF" /></TouchableOpacity>
            
            {/* Header Avatar */}
            <Image 
              source={{ uri: partnerProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name?.toString() || "P")}&background=0EA5E9&color=fff` }} 
              style={styles.headerAvatar} 
            />

            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{partnerProfile?.full_name || name || "User"}</Text>
              <View style={styles.onlineRow}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Secure Session Active</Text></View>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => router.push("/(freelancer-dashboard)/checkup")}><MaterialCommunityIcons name="video-outline" size={24} color="#0EA5E9" /></TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>

        <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 15) }]}>
          <View style={styles.inputContainer}>
            {!isRecording && !recordingUri && (
              <TouchableOpacity style={styles.attachBtn} onPress={pickAndUploadFile}>
                <Feather name="plus" size={22} color="#94A3B8" />
              </TouchableOpacity>
            )}

            {isRecording ? (
              <View style={styles.recordingStatus}><View style={styles.redDot} /><Text style={styles.recordingText}>Recording {formatTime(seconds)}</Text></View>
            ) : recordingUri ? (
              <View style={styles.previewContainer}>
                <TouchableOpacity onPress={deleteRecording}><Feather name="trash-2" size={20} color="#EF4444" /></TouchableOpacity>
                <Text style={styles.recordingText}>Voice Preview ({formatTime(seconds)})</Text>
                <TouchableOpacity onPress={playPreview}><Ionicons name={isPlayingPreview ? "stop-circle" : "play-circle"} size={32} color="#0EA5E9" /></TouchableOpacity>
              </View>
            ) : (
              <TextInput style={styles.input} placeholder="Type message..." placeholderTextColor="#64748B" value={inputText} onChangeText={setInputText} blurOnSubmit={false} />
            )}

            {recordingUri ? (
              <TouchableOpacity style={styles.sendBtn} onPress={sendVoiceNote}>
                <LinearGradient colors={["#38BDF8", "#0EA5E9"]} style={styles.sendBtnGradient}><Ionicons name="send" size={18} color="#FFF" /></LinearGradient>
              </TouchableOpacity>
            ) : inputText.length > 0 ? (
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <LinearGradient colors={["#38BDF8", "#0EA5E9"]} style={styles.sendBtnGradient}><Ionicons name="send" size={18} color="#FFF" /></LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micBtn} onLongPress={startRecording} onPressOut={stopRecording}>
                <MaterialCommunityIcons name={isRecording ? "microphone" : "microphone-outline"} size={24} color={isRecording ? "#EF4444" : "#0EA5E9"} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#0F172A" },
  safeArea: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, backgroundColor: "rgba(15,23,42,0.95)", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  headerAvatar: { width: 38, height: 38, borderRadius: 12, marginLeft: 10, backgroundColor: '#1E293B' },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerName: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  onlineText: { color: "#94A3B8", fontSize: 11, fontWeight: "600" },
  callBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(14,165,233,0.1)", justifyContent: "center", alignItems: "center" },
  backgroundGlowLeft: { position: "absolute", bottom: 100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: "#0EA5E9", opacity: 0.05 },
  backgroundGlowRight: { position: "absolute", top: 100, right: -100, width: 250, height: 250, borderRadius: 125, backgroundColor: "#38BDF8", opacity: 0.04 },
  listContent: { padding: 20, paddingBottom: 20 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 15 },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  avatarMini: { width: 32, height: 32, borderRadius: 12, backgroundColor: "#1E293B", marginRight: 8 },
  messageWrapper: { maxWidth: "80%" },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  myBubble: { borderBottomRightRadius: 4 },
  theirBubble: { borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  msgText: { fontSize: 15, color: "#FFF", lineHeight: 22 },
  myText: { color: "#FFF", fontWeight: "500" },
  theirText: { color: "#E2E8F0" },
  timeText: { color: "#475569", fontSize: 10, marginTop: 4, fontWeight: "700" },
  inputWrapper: { paddingHorizontal: 15, paddingTop: 10, backgroundColor: "#0F172A", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 25, paddingHorizontal: 12, height: 54, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  input: { flex: 1, color: "#FFF", fontSize: 15, marginLeft: 10 },
  sendBtn: { width: 40, height: 40, marginLeft: 5 },
  sendBtnGradient: { flex: 1, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  micBtn: { padding: 8 },
  attachBtn: { padding: 5 },
  backBtn: { padding: 4 },
  mediaRow: { flexDirection: 'row', alignItems: 'center', minWidth: 130 },
  mediaText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  voiceVisualizer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  bar: { width: 3, height: 12, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 1, borderRadius: 2 },
  recordingStatus: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 8 },
  recordingText: { color: '#FFF', fontSize: 14, fontWeight: '600', flex: 1 },
  previewContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 5 }
});