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

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    getUserId();
    fetchMessages();

    const subscription = supabase
      .channel(`chat_${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const getUserId = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) setUserId(data.user.id);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (inputText.trim() === "") return;
    const newMessage = {
      sender_id: userId,
      receiver_id: id,
      content: inputText,
    };
    const { error } = await supabase.from("messages").insert([newMessage]);
    if (!error) setInputText("");
  };

  const renderMessage = ({ item }: any) => {
    const isMine = item.sender_id === userId;

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.rowRight : styles.rowLeft,
        ]}
      >
        {!isMine && (
          <View style={styles.avatarMini}>
            <Text style={styles.avatarText}>
              {(name?.toString()?.[0] || "S").toUpperCase()}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageWrapper,
            isMine ? styles.myMsgWrapper : styles.theirMsgWrapper,
          ]}
        >
          <LinearGradient
            colors={
              isMine
                ? ["#0EA5E9", "#0284C7"]
                : ["#1E293B", "#0F172A"]
            }
            style={[
              styles.bubble,
              isMine ? styles.myBubble : styles.theirBubble,
            ]}
          >
            <Text
              style={[
                styles.msgText,
                isMine ? styles.myText : styles.theirText,
              ]}
            >
              {item.content}
            </Text>
          </LinearGradient>

          <Text style={styles.timeText}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={["#0F172A", "#0B3C5D"]}
        style={styles.gradientBg}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>
                {name || "Specialist"}
              </Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>
                  End-to-End Encrypted
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.callBtn}>
              <MaterialCommunityIcons
                name="video-outline"
                size={24}
                color="#0EA5E9"
              />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={{ flex: 1 }}>
              {/* Background Glow Layers */}
              <View style={styles.backgroundGlowLeft} />
              <View style={styles.backgroundGlowRight} />

              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderMessage}
                contentContainerStyle={[
                  styles.listContent,
                  messages.length === 0 && {
                    flex: 1,
                    justifyContent: "center",
                  },
                ]}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <LinearGradient
                      colors={[
                        "rgba(56,189,248,0.15)",
                        "rgba(14,165,233,0.05)",
                      ]}
                      style={styles.emptyIconWrapper}
                    >
                      <MaterialCommunityIcons
                        name="shield-lock-outline"
                        size={40}
                        color="#38BDF8"
                      />
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>
                      Secure Medical Chat
                    </Text>
                    <Text style={styles.emptySub}>
                      Your consultation messages are private,
                      encrypted and HIPAA-ready.
                    </Text>
                  </View>
                )}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({
                    animated: true,
                  })
                }
                showsVerticalScrollIndicator={false}
              />
            </View>

            {/* INPUT */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.attachBtn}>
                  <Ionicons
                    name="add-circle-outline"
                    size={26}
                    color="#94A3B8"
                  />
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder="Type secure message..."
                  placeholderTextColor="#64748B"
                  value={inputText}
                  onChangeText={setInputText}
                />

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    !inputText.trim() && { opacity: 0.5 },
                  ]}
                  onPress={sendMessage}
                  disabled={!inputText.trim()}
                >
                  <LinearGradient
                    colors={["#38BDF8", "#0EA5E9"]}
                    style={styles.sendBtnGradient}
                  >
                    <Ionicons
                      name="paper-plane"
                      size={18}
                      color="#FFF"
                    />
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(15,23,42,0.8)",
  },

  backBtn: { padding: 5 },
  headerInfo: { flex: 1, marginLeft: 10 },

  headerName: {
    color: "#FFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },

  onlineText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },

  callBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "rgba(14,165,233,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  listContent: { padding: 20, paddingBottom: 20 },

  backgroundGlowLeft: {
    position: "absolute",
    bottom: -100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#0EA5E9",
    opacity: 0.04,
  },

  backgroundGlowRight: {
    position: "absolute",
    top: 100,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#38BDF8",
    opacity: 0.03,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 18,
  },

  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },

  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0EA5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  avatarText: {
    color: "#FFF",
    fontWeight: "700",
  },

  messageWrapper: { maxWidth: "85%" },

  bubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  myBubble: { borderBottomRightRadius: 2 },
  theirBubble: {
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  msgText: { fontSize: 15, lineHeight: 22 },
  myText: { color: "#FFF", fontWeight: "500" },
  theirText: { color: "#E2E8F0" },

  timeText: {
    color: "#475569",
    fontSize: 10,
    marginTop: 5,
    fontWeight: "700",
  },

  inputWrapper: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "rgba(15,23,42,0.8)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 30,
    paddingRight: 6,
    paddingLeft: 12,
    height: 56,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  attachBtn: { padding: 5 },

  input: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    paddingHorizontal: 10,
  },

  sendBtn: { width: 44, height: 44 },

  sendBtnGradient: {
    flex: 1,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0EA5E9",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 10,
  },

  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },

  emptySub: {
    color: "#94A3B8",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },
  myMsgWrapper: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6', // Or your preferred color
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    maxWidth: '80%',
  },
  theirMsgWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECECEC', // Or your preferred color
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    maxWidth: '80%',
  },
});