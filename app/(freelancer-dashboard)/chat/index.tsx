import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function ModernChatList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (query = "") => {
    setLoading(true);

    let request = supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "user");

    if (query) {
      request = request.ilike("full_name", `%${query}%`);
    }

    const { data } = await request;
    setPatients(data || []);
    setLoading(false);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(freelancer-dashboard)/chat/[id]",
          params: { id: item.id, name: item.full_name },
        })
      }
    >
      <View style={styles.cardContent}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri:
                item.avatar_url ||
                `https://ui-avatars.com/api/?name=${item.full_name}&background=0ea5e9&color=ffffff`,
            }}
            style={styles.avatar}
          />
          {item.is_online && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.textDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.patientName}>{item.full_name}</Text>
            <Text style={styles.timeText}>2m ago</Text>
          </View>

          <Text style={styles.messagePreview} numberOfLines={1}>
            {item.last_symptom || "Tap to view patient records..."}
          </Text>
        </View>

        <View style={styles.actionArea}>
          <View style={styles.unreadDot} />
          <Feather name="chevron-right" size={18} color="#64748B" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.title}>Messages</Text>
          </View>

          <TouchableOpacity style={styles.iconCircle}>
            <Feather name="edit-3" size={20} color="#0EA5E9" />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.input}
              placeholder="Search patients..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                fetchPatients(t);
              }}
            />
          </View>
        </View>

        {/* LIST */}
        <View style={styles.listWrapper}>
          <FlatList
            data={patients}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyState}>
                  <Feather name="message-square" size={40} color="#334155" />
                  <Text style={styles.emptyText}>
                    No active conversations
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 25,
  },

  dateText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 4,
  },

  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(14,165,233,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.2)",
  },

  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },

  searchBar: {
    flexDirection: "row",
    backgroundColor: "rgba(30,41,59,0.8)",
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 52,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#FFFFFF",
  },

  listWrapper: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 100,
  },

  card: {
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: "rgba(30,41,59,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },

  avatarWrapper: { position: "relative" },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#334155",
  },

  onlineBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#0F172A",
  },

  textDetails: { flex: 1, marginLeft: 16 },

  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  patientName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  timeText: {
    fontSize: 12,
    color: "#64748B",
  },

  messagePreview: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
    maxWidth: "90%",
  },

  actionArea: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0EA5E9",
  },

  emptyState: {
    alignItems: "center",
    marginTop: 100,
  },

  emptyText: {
    color: "#64748B",
    marginTop: 12,
    fontSize: 16,
  },
});