import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const FreelancerDashboard = () => {
  return (
    <LinearGradient
      colors={["#0F172A", "#0B3C5D", "#0EA5E9"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.username}>Dr. Thando</Text>
          <Text style={styles.status}>Available for Consultations</Text>
        </View>

        {/* Availability Card */}
        <View style={styles.availabilityCard}>
          <View>
            <Text style={styles.availabilityLabel}>Current Status</Text>
            <Text style={styles.availabilityValue}>ONLINE</Text>
          </View>
          <TouchableOpacity style={styles.toggleButton}>
            <Ionicons name="power-outline" size={22} color="#0EA5E9" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <ActionCard
            icon="videocam-outline"
            title="Live Consult"
            subtitle="Start session"
          />
          <ActionCard
            icon="calendar-outline"
            title="Appointments"
            subtitle="View schedule"
          />
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsAmount}>ZMW 0.00</Text>
          </View>
          <Ionicons name="cash-outline" size={28} color="#0EA5E9" />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Consultations" value="0" />
          <StatCard label="Rating" value="0.0" />
          <StatCard label="Hours Online" value="0h" />
        </View>

        {/* Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming Requests</Text>

          <View style={styles.emptyState}>
            <Ionicons
              name="pulse-outline"
              size={32}
              color="#7DD3FC"
            />
            <Text style={styles.emptyText}>
              No consultation requests yet
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default FreelancerDashboard;

/* ---------------- COMPONENTS ---------------- */

const ActionCard = ({
  icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle: string;
}) => (
  <TouchableOpacity style={styles.actionCard}>
    <Ionicons name={icon} size={28} color="#0EA5E9" />
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scroll: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginTop: 20,
    marginBottom: 24,
  },

  greeting: {
    color: "#BAE6FD",
    fontSize: 14,
  },

  username: {
    color: "#E0F2FE",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
  },

  status: {
    marginTop: 6,
    fontSize: 12,
    color: "#7DD3FC",
  },

  availabilityCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  availabilityLabel: {
    fontSize: 13,
    color: "#475569",
  },

  availabilityValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#16A34A",
    marginTop: 6,
  },

  toggleButton: {
    backgroundColor: "#E0F2FE",
    padding: 12,
    borderRadius: 14,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },

  actionCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 18,
    elevation: 4,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
    color: "#0F172A",
  },

  actionSubtitle: {
    fontSize: 12,
    marginTop: 4,
    color: "#475569",
  },

  earningsCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  earningsLabel: {
    fontSize: 13,
    color: "#475569",
  },

  earningsAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 6,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 26,
  },

  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },

  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },

  statLabel: {
    fontSize: 12,
    marginTop: 6,
    color: "#475569",
  },

  section: {
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E0F2FE",
    marginBottom: 14,
  },

  emptyState: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
  },

  emptyText: {
    marginTop: 12,
    color: "#E0F2FE",
    fontSize: 13,
  },
});
