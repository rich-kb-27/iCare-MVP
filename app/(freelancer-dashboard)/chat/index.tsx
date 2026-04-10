import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  TextInput, Dimensions, ActivityIndicator, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase"; 
import { useAuth } from "../../../context/AuthContext";
import { StatusBar } from "expo-status-bar";

export default function ModernChatList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  // --- 1. THE DATA ENGINE ---
  const fetchSubscribedPatients = useCallback(async (query = "") => {
    if (!user?.id) return;
    
    try {
      // Step A: Get ONLY active subscriptions for this doctor
      let subQuery = supabase
        .from("subscriptions")
        .select("patient_id, patient_name, plan_type, status")
        .eq("doctor_id", user.id)
        .eq("status", "active");

      if (query) subQuery = subQuery.ilike("patient_name", `%${query}%`);

      const { data: subs, error: subError } = await subQuery;
      if (subError) throw subError;

      if (subs && subs.length > 0) {
        const patientIds = subs.map(s => s.patient_id);

        // Step B: Parallel fetch Profiles and All Messages for the context
        const [profRes, msgRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, avatar_url").in("id", patientIds),
          supabase.from("messages")
            .select("id, content, created_at, sender_id, receiver_id, is_read")
            .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
        ]);

        // Step C: Merge Subscription, Profile, and Chat Stats
        const merged = subs.map(sub => {
          const profile = profRes.data?.find(p => p.id === sub.patient_id);
          
          // Filter messages belonging to THIS specific patient chat
          const chatHistory = msgRes.data?.filter(m => 
            m.sender_id === sub.patient_id || m.receiver_id === sub.patient_id
          ) || [];

          const lastMsg = chatHistory[0]; // The top message is the latest due to order
          
          // Count messages sent BY patient TO doctor that are NOT read
          const unreadCount = chatHistory.filter(m => 
            m.sender_id === sub.patient_id && 
            m.receiver_id === user.id && 
            !m.is_read
          ).length;

          return {
            ...sub,
            profileDetails: profile || null,
            lastMessage: lastMsg?.content || "No messages yet",
            lastMsgTime: lastMsg?.created_at,
            unreadCount
          };
        });

        // Step D: Sort list so the most recent activity is at the top
        const sorted = merged.sort((a, b) => {
          const timeA = new Date(a.lastMsgTime || 0).getTime();
          const timeB = new Date(b.lastMsgTime || 0).getTime();
          return timeB - timeA;
        });

        setPatients(sorted);
      } else {
        setPatients([]);
      }
    } catch (e: any) {
      console.error("Sync Error:", e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // --- 2. REALTIME SYNC ---
  useEffect(() => {
    fetchSubscribedPatients();

    // Listen for any message changes (New inserts or is_read updates)
    const channel = supabase
      .channel('realtime-chat-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        fetchSubscribedPatients(searchQuery);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, searchQuery]);

  // --- 3. NAVIGATION & MARK AS READ ---
  const handleOpenChat = async (patientId: string, patientName: string) => {
    // Optimization: Instantly mark as read in DB so the badge disappears
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', patientId)
      .eq('receiver_id', user?.id)
      .eq('is_read', false);

    if (error) console.log("Read-status sync error:", error.message);

    router.push({
      pathname: "/(freelancer-dashboard)/chat/[id]",
      params: { id: patientId, name: patientName },
    });
  };

  const renderItem = ({ item }: any) => {
    const profile = item.profileDetails;
    const displayName = profile?.full_name || item.patient_name;
    const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0EA5E9&color=fff&bold=true`;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => handleOpenChat(item.patient_id, displayName)}
      >
        <LinearGradient colors={["#1E293B", "#0F172A"]} style={styles.cardGradient}>
          <View style={styles.cardContent}>
            {/* Avatar Section */}
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              {item.unreadCount > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeTextCount}>{item.unreadCount}</Text>
                </View>
              )}
            </View>

            {/* Info Section */}
            <View style={styles.infoContainer}>
              <View style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
                {item.lastMsgTime && (
                  <Text style={styles.time}>
                    {new Date(item.lastMsgTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
              
              <Text 
                style={[styles.lastMsg, item.unreadCount > 0 && styles.unreadMsgText]} 
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
            </View>

            {/* Plan Badge */}
            <View style={styles.tagWrapper}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.plan_type}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#020617"]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSmall}>Tele-Consults</Text>
            <Text style={styles.headerLarge}>Messages</Text>
          </View>
          <TouchableOpacity 
            style={styles.syncBtn} 
            onPress={() => fetchSubscribedPatients(searchQuery)}
          >
            <Feather name="refresh-cw" size={20} color="#0EA5E9" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <View style={styles.searchInner}>
            <Feather name="search" size={18} color="#475569" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search active patients..."
              placeholderTextColor="#475569"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#0EA5E9" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={patients}
            keyExtractor={(item) => item.patient_id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="comment-off-outline" size={48} color="#1E293B" />
                <Text style={styles.emptyText}>No active patient consultations.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  headerSmall: { color: '#38B2AC', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  headerLarge: { color: '#FFF', fontSize: 34, fontWeight: '900' },
  syncBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  searchBox: { paddingHorizontal: 24, marginBottom: 20 },
  searchInner: { flexDirection: 'row', backgroundColor: '#1E293B', height: 50, borderRadius: 15, alignItems: 'center', paddingHorizontal: 15 },
  searchInput: { flex: 1, marginLeft: 10, color: '#FFF', fontSize: 16 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 50 },
  card: { marginBottom: 12, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardGradient: { flex: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 62, height: 62, borderRadius: 20, backgroundColor: '#020617' },
  badgeCount: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#1E293B' },
  badgeTextCount: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  infoContainer: { flex: 1, marginLeft: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  time: { fontSize: 11, color: '#475569' },
  lastMsg: { fontSize: 14, color: '#64748B', marginTop: 4 },
  unreadMsgText: { color: '#FFF', fontWeight: '700' },
  tagWrapper: { marginLeft: 10 },
  tag: { backgroundColor: 'rgba(56, 178, 172, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { color: '#38B2AC', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#475569', marginTop: 15, fontSize: 15 }
});