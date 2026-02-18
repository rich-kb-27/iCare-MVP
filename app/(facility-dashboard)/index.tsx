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

const FacilityDashboard = () => {
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
          <Text style={styles.greeting}>Facility Overview</Text>
          <Text style={styles.facilityName}>Kadobi Medical Center</Text>
          <Text style={styles.subtext}>Operational Status: Active</Text>
        </View>

        {/* Facility Status */}
        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusLabel}>Today’s Activity</Text>
            <Text style={styles.statusValue}>Running Smoothly</Text>
          </View>
          <Ionicons name="shield-checkmark-outline" size={28} color="#16A34A" />
        </View>

        {/* Quick Controls */}
        <View style={styles.actionsRow}>
          <ActionCard
            icon="people-outline"
            title="Staff"
            subtitle="Manage doctors"
          />
          <ActionCard
            icon="calendar-outline"
            title="Bookings"
            subtitle="Appointments"
          />
        </View>

        <View style={styles.actionsRow}>
          <ActionCard
            icon="medkit-outline"
            title="Services"
            subtitle="Facility offerings"
          />
          <ActionCard
            icon="analytics-outline"
            title="Reports"
            subtitle="Performance data"
          />
        </View>

        {/* Revenue */}
        <View style={styles.revenueCard}>
          <View>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueAmount}>ZMW 0.00</Text>
          </View>
          <Ionicons name="wallet-outline" size={30} color="#0EA5E9" />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Doctors" value="0" />
          <StatCard label="Patients" value="0" />
          <StatCard label="Bookings" value="0" />
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={30} color="#7DD3FC" />
            <Text style={styles.emptyText}>
              No recent activity recorded
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default FacilityDashboard;

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
    fontSize: 13,
  },

  facilityName: {
    color: "#E0F2FE",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 6,
  },

  subtext: {
    marginTop: 6,
    fontSize: 12,
    color: "#7DD3FC",
  },

  statusCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  statusLabel: {
    fontSize: 13,
    color: "#475569",
  },

  statusValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
    marginTop: 6,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
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

  revenueCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },

  revenueLabel: {
    fontSize: 13,
    color: "#475569",
  },

  revenueAmount: {
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
