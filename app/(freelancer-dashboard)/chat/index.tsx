import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  TextInput, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../../context/AuthContext";

export default function FreelancerChatList() {
  const { user } = useAuth();
  const [chatList, setChatList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchFreelancerChats = useCallback(async (query = "") => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // 1. Get ALL relevant subscriptions (to check for active vs expired)
      const { data: subs, error: subError } = await supabase
        .from("subscriptions")
        .select("patient_id, plan_type, status, id")
        .eq("doctor_id", user.id);

      if (subError) throw subError;

      // 2. Get ALL message history involving the user
      const { data: allMsgs, error: msgError } = await supabase
        .from("messages")
        .select("content, created_at, sender_id, receiver_id, is_read")
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // 3. Extract unique partner IDs from message history
      const messagePartnerIds = Array.from(new Set(
        allMsgs?.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id) || []
      ));

      if (messagePartnerIds.length === 0) {
        setChatList([]);
        return;
      }

      // 4. Fetch Profiles for all partners found in messages
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .in("id", messagePartnerIds);

      if (profError) throw profError;

      // 5. MASTER MERGE LOGIC
      const combined = profiles?.map(profile => {
        const subEntry = subs?.find(s => s.patient_id === profile.id);
        
        /** 
         * LOGIC:
         * - If they exist in 'subscriptions' table: Must be 'active' to show up.
         * - If they DON'T exist in 'subscriptions' table: It's a facility/direct chat, show them.
         */
        const isInSubscriptionTable = !!subEntry;
        const isActivePatient = subEntry?.status === 'active';

        if (isInSubscriptionTable && !isActivePatient) {
            return null; // Expired patient - hide from list
        }

        const chatHistory = allMsgs?.filter(m => 
          m.sender_id === profile.id || m.receiver_id === profile.id
        ) || [];

        const lastMsg = chatHistory[0];
        const unreadCount = chatHistory.filter(m => 
          m.sender_id === profile.id && m.receiver_id === user.id && !m.is_read
        ).length;

        // Set Plan Label: If no sub exists, label as Facility/Inquiry
        let displayPlan = "Facility";
        if (subEntry) {
            displayPlan = subEntry.plan_type;
        } else if (profile.role === 'patient') {
            displayPlan = "Inquiry";
        }

        return {
          id: subEntry?.id || `direct-${profile.id}`, 
          partner_id: profile.id, 
          plan_type: displayPlan,
          profileDetails: profile,
          lastMessage: lastMsg?.content || "No messages yet...",
          lastMsgTime: lastMsg?.created_at || new Date(0).toISOString(),
          unreadCount
        };
      }).filter(Boolean) || [];

      // 6. Filter by Search Query & Sort by Time
      const filtered = query 
        ? combined.filter(m => m.profileDetails?.full_name.toLowerCase().includes(query.toLowerCase()))
        : combined;

      setChatList(filtered.sort((a, b) => 
        new Date(b.lastMsgTime).getTime() - new Date(a.lastMsgTime).getTime()
      ));

    } catch (err: any) {
      console.error("Freelancer List Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFreelancerChats();
    
    // Real-time listener for new messages
    const channel = supabase
      .channel('freelancer-chat-sync')
      .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'messages' 
      }, () => {
        fetchFreelancerChats(searchQuery);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, searchQuery]);

  const handleOpenChat = async (item: any) => {
    // Mark as read before navigating
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', item.partner_id)
      .eq('receiver_id', user?.id)
      .eq('is_read', false);

    router.push({
      pathname: "/(freelancer-dashboard)/chat/[id]",
      params: { id: item.partner_id, name: item.profileDetails?.full_name }
    });
  };

  const renderChatItem = ({ item }: any) => {
    const profile = item.profileDetails;
    const name = profile?.full_name || "User";
    const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10B981&color=fff`;

    return (
      <TouchableOpacity style={styles.chatCard} onPress={() => handleOpenChat(item)}>
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
            <Text style={styles.partnerName}>{name}</Text>
            {item.lastMsgTime !== new Date(0).toISOString() && (
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
           <Text style={[
               styles.planLabel, 
               { color: item.plan_type === 'Premium' ? '#F59E0B' : item.plan_type === 'Facility' ? '#60A5FA' : '#10B981' }
            ]}>
             {item.plan_type}
           </Text>
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
            <Text style={styles.title}>Messages</Text>
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color="#94A3B8" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search contacts..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color="#10B981" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={chatList}
              keyExtractor={(item) => item.partner_id}
              renderItem={renderChatItem}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.center}>
                  <MaterialCommunityIcons name="message-off-outline" size={60} color="#1E293B" />
                  <Text style={styles.emptyText}>No active conversations</Text>
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
  partnerName: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  timeText: { color: '#475569', fontSize: 11 },
  lastMsg: { color: '#64748B', fontSize: 13, marginTop: 4 },
  activeMsgText: { color: '#FFF', fontWeight: '700' },
  planIndicator: { marginLeft: 10 },
  planLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  center: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#475569', marginTop: 10 }
});