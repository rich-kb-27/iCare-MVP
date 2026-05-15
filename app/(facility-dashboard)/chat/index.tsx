import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  // Filter logic for the Search Bar
  const filteredChats = useMemo(() => {
    return chats.filter(chat => 
      chat.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, chats]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch 'seen' check-ins
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select(`patient_id, profiles!check_ins_patient_id_fkey (id, full_name, avatar_url)`)
        .eq('facility_id', user.id)
        .eq('status', 'seen');

      // 2. Fetch messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      const chatMap = new Map();

      if (checkIns) {
        checkIns.forEach(check => {
          const profile = check.profiles;
          if (profile) {
            chatMap.set(profile.id, {
              otherId: profile.id,
              profile: profile,
              content: "Tap to start chatting",
              created_at: null,
              isPlaceholder: true
            });
          }
        });
      }

      if (messages) {
        messages.forEach(msg => {
          const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          const existing = chatMap.get(otherId);
          if (!existing || existing.isPlaceholder || new Date(msg.created_at) > new Date(existing.created_at)) {
            chatMap.set(otherId, { ...msg, otherId, isPlaceholder: false });
          }
        });
      }

      const finalChatArray = Array.from(chatMap.values());
      const missingProfileIds = finalChatArray.filter(c => !c.profile).map(c => c.otherId);

      if (missingProfileIds.length > 0) {
        const { data: extraProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', missingProfileIds);
        extraProfiles?.forEach(p => {
          const entry = chatMap.get(p.id);
          if (entry) entry.profile = p;
        });
      }

      setChats(finalChatArray.sort((a, b) => {
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Patient Inbox</Text>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search patients by name..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.otherId}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No patients found</Text>
          </View>
        ) : <ActivityIndicator color="#0EA5E9" style={{ marginTop: 50 }} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.glassCard}
            onPress={() => router.push({
                pathname: `/(facility-dashboard)/chat/${item.otherId}`,
                params: { 
                  name: item.profile?.full_name, 
                  avatar: item.profile?.avatar_url 
                }
            })}
          >
            <View>
              {item.profile?.avatar_url ? (
                <Image source={{ uri: item.profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{item.profile?.full_name?.charAt(0) || 'P'}</Text>
                </View>
              )}
            </View>

            <View style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.profile?.full_name || "Unknown Patient"}</Text>
                {item.created_at && (
                  <Text style={styles.time}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
              <Text style={[styles.msg, item.isPlaceholder && { fontStyle: 'italic', color: '#7DD3FC' }]} numberOfLines={1}>
                {item.content}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12, marginRight: 15 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '500' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  avatar: { width: 50, height: 50, borderRadius: 14 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, marginLeft: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  name: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  time: { color: '#64748B', fontSize: 11 },
  msg: { color: '#94A3B8', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyTitle: { color: '#64748B', fontSize: 16 }
});