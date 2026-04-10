import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  Animated, TextInput, ActivityIndicator, Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../../context/AuthContext";

export default function PatientChatList() {
  const { user } = useAuth();
  const [subscribedDoctors, setSubscribedDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

  // --- 1. DATA ENGINE (Parallel Fetching) ---
  const fetchSubscriptions = useCallback(async (query = "") => {
    if (!user?.id) return;
    
    try {
      // Step A: Get ONLY active subscriptions for this patient
      let subQuery = supabase
        .from("subscriptions")
        .select("doctor_id, plan_type, status, id")
        .eq("patient_id", user.id)
        .eq("status", "active");

      const { data: subs, error: subError } = await subQuery;
      if (subError) throw subError;

      if (subs && subs.length > 0) {
        const doctorIds = subs.map(s => s.doctor_id);

        // Step B: Fetch Doctor Profiles and Messages in Parallel
        const [profRes, msgRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, avatar_url, role").in("id", doctorIds),
          supabase.from("messages")
            .select("content, created_at, sender_id, receiver_id, is_read")
            .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
        ]);

        // Step C: Merge and Calculate Stats
        const merged = subs.map(sub => {
          const profile = profRes.data?.find(p => p.id === sub.doctor_id);
          
          // Filter messages for this specific chat pair
          const chatHistory = msgRes.data?.filter(m => 
            m.sender_id === sub.doctor_id || m.receiver_id === sub.doctor_id
          ) || [];

          const lastMsg = chatHistory[0];
          
          // Count messages sent BY Doctor TO Patient that are NOT read
          const unreadCount = chatHistory.filter(m => 
            m.sender_id === sub.doctor_id && 
            m.receiver_id === user.id && 
            !m.is_read
          ).length;

          return {
            ...sub,
            profileDetails: profile,
            lastMessage: lastMsg?.content || "Start your consultation...",
            lastMsgTime: lastMsg?.created_at,
            unreadCount
          };
        });

        // Search filtering on the merged list
        const filtered = query 
          ? merged.filter(m => m.profileDetails?.full_name.toLowerCase().includes(query.toLowerCase()))
          : merged;

        // Sort by latest message
        setSubscribedDoctors(filtered.sort((a, b) => 
          new Date(b.lastMsgTime || 0).getTime() - new Date(a.lastMsgTime || 0).getTime()
        ));
      } else {
        setSubscribedDoctors([]);
      }
    } catch (err: any) {
      console.error("Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // --- 2. REALTIME & INIT ---
  useEffect(() => {
    fetchSubscriptions();

    const channel = supabase
      .channel('patient-chat-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchSubscriptions(searchQuery);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, searchQuery]);

  // --- 3. HANDLE NAVIGATION & READ STATUS ---
  const handleOpenChat = async (doctor: any) => {
    // Mark doctor's messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', doctor.doctor_id)
      .eq('receiver_id', user?.id)
      .eq('is_read', false);

    router.push({
      pathname: "/(patient-dashboard)/chat/[id]",
      params: { id: doctor.doctor_id, name: doctor.profileDetails?.full_name }
    });
  };

  const renderDoctorItem = ({ item }: any) => {
    const profile = item.profileDetails;
    const name = profile?.full_name || "Expert";
    const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0EA5E9&color=fff`;

    return (
      <TouchableOpacity 
        style={styles.chatCard}
        onPress={() => handleOpenChat(item)}
      >
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.doctorName}>{name}</Text>
            {item.lastMsgTime && (
              <Text style={styles.timeText}>
                {new Date(item.lastMsgTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          <Text 
            style={[styles.lastMsg, item.unreadCount > 0 && styles.activeMsgText]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>

        <View style={styles.planIndicator}>
           <View style={[styles.planDot, { backgroundColor: item.plan_type === 'Premium' ? '#F59E0B' : '#0EA5E9' }]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          
          <View style={styles.header}>
            <Text style={styles.title}>My Experts</Text>
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color="#94A3B8" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search active consults..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color="#0EA5E9" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={subscribedDoctors}
              keyExtractor={(item) => item.id}
              renderItem={renderDoctorItem}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.center}>
                  <MaterialCommunityIcons name="comment-search-outline" size={60} color="#1E293B" />
                  <Text style={styles.emptyText}>No active experts found</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24 },
  title: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 15 },
  searchBox: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 15, height: 48, alignItems: 'center' },
  searchInput: { flex: 1, marginLeft: 10, color: '#FFF' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  chatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 20, marginBottom: 12 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#020617' },
  unreadBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1E293B' },
  unreadBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  chatInfo: { flex: 1, marginLeft: 15 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between' },
  doctorName: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  timeText: { color: '#475569', fontSize: 11 },
  lastMsg: { color: '#64748B', fontSize: 13, marginTop: 4 },
  activeMsgText: { color: '#FFF', fontWeight: '700' },
  planIndicator: { marginLeft: 10 },
  planDot: { width: 8, height: 8, borderRadius: 4 },
  center: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#475569', marginTop: 10 }
});