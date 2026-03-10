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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";

export default function PatientChatScreen() {
  const { id, name } = useLocalSearchParams(); // 'id' is the Doctor's ID
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // 1. Get User ID on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  // 2. Fetch messages & Subscribe to Realtime once userId is known
  useEffect(() => {
    if (!userId) return;

    fetchMessages();
    markAsRead(); // Mark messages as read when patient opens chat

    const subscription = supabase
      .channel(`chat_room_${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" }, // Listening to INSERT and UPDATE (for read ticks)
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMessage = payload.new;
            const isRelevant = 
              (newMessage.sender_id === userId && newMessage.receiver_id === id) ||
              (newMessage.sender_id === id && newMessage.receiver_id === userId);
            
            if (isRelevant) {
              setMessages((prev) => [...prev, newMessage]);
              if (newMessage.receiver_id === userId) markAsRead(); // Auto-read new incoming messages
            }
          } else if (payload.eventType === "UPDATE") {
            // Update read status in real-time
            setMessages((prev) => 
              prev.map(msg => msg.id === payload.new.id ? payload.new : msg)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, id]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    if (!error && data) setMessages(data);
  };

  const markAsRead = async () => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", userId)
      .eq("sender_id", id)
      .eq("is_read", false);
  };

  const sendMessage = async () => {
    if (inputText.trim() === "" || !userId) return;
    
    const newMessage = {
      sender_id: userId,
      receiver_id: id,
      content: inputText.trim(),
    };

    const { error } = await supabase.from("messages").insert([newMessage]);
    if (!error) setInputText("");
  };

  const renderMessage = ({ item }: any) => {
    const isMine = item.sender_id === userId;

    return (
      <View style={[styles.messageRow, isMine ? styles.rowRight : styles.rowLeft]}>
        {!isMine && (
          <View style={styles.avatarMini}>
            <Text style={styles.avatarText}>
              {(name?.toString()?.[0] || "D").toUpperCase()}
            </Text>
          </View>
        )}

        <View style={[styles.messageWrapper]}>
          <LinearGradient
            colors={isMine ? ["#0EA5E9", "#0284C7"] : ["#1E293B", "#0F172A"]}
            style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}
          >
            <Text style={[styles.msgText, isMine ? styles.myText : styles.theirText]}>
              {item.content}
            </Text>
          </LinearGradient>

          <View style={[styles.metaRow, isMine && { justifyContent: 'flex-end' }]}>
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            {isMine && (
              <MaterialCommunityIcons 
                name={item.is_read ? "check-all" : "check"} 
                size={14} 
                color={item.is_read ? "#38BDF8" : "#475569"} 
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.gradientBg}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{name || "Medical Specialist"}</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Secure Channel</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <MaterialCommunityIcons name="video-outline" size={24} color="#0EA5E9" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={renderMessage}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>Start your consultation</Text>
                  <Text style={styles.emptySub}>Messages are encrypted and private.</Text>
                </View>
              )}
            />

            {/* INPUT */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Type a message..."
                  placeholderTextColor="#64748B"
                  value={inputText}
                  onChangeText={setInputText}
                />
                <TouchableOpacity 
                  style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
                  onPress={sendMessage}
                  disabled={!inputText.trim()}
                >
                  <LinearGradient colors={["#38BDF8", "#0EA5E9"]} style={styles.sendBtnGradient}>
                    <Ionicons name="paper-plane" size={18} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
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
  safeArea: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(15,23,42,0.8)" },
  backBtn: { padding: 5 },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  onlineText: { color: "#94A3B8", fontSize: 11 },
  callBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(14,165,233,0.1)", justifyContent: "center", alignItems: "center" },
  listContent: { padding: 20, paddingBottom: 20 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 18 },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  avatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#0EA5E9", justifyContent: "center", alignItems: "center", marginRight: 8 },
  avatarText: { color: "#FFF", fontWeight: "700", fontSize: 12 },
  messageWrapper: { maxWidth: "80%" },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  myBubble: { borderBottomRightRadius: 2 },
  theirBubble: { borderBottomLeftRadius: 2, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  msgText: { fontSize: 15, lineHeight: 22 },
  myText: { color: "#FFF" },
  theirText: { color: "#E2E8F0" },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { color: "#475569", fontSize: 10, fontWeight: "600" },
  inputWrapper: { padding: 15, backgroundColor: "rgba(15,23,42,0.9)" },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 25, paddingLeft: 15, height: 50 },
  input: { flex: 1, color: "#FFF", fontSize: 16 },
  sendBtn: { width: 40, height: 40, marginRight: 5 },
  sendBtnGradient: { flex: 1, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#94A3B8', fontSize: 13, marginTop: 5 }
});