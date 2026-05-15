import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Alert, RefreshControl, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

// Define Plan Prices for Revenue Logic
const PLAN_PRICES: { [key: string]: number } = {
  'Basic': 150,
  'Premium': 350,
  'Elite': 600
};

interface Subscriber {
  id: string;
  patient_id: string;
  plan_type: string;
  expiry_date: string;
  status: 'active' | 'expired';
  profiles: {
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  };
}

const FreelancerSubscribers = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const syncAndFetchSubscribers = async () => {
    try {
      if (!refreshing) setLoading(true);
      if (!user) return;

      const now = new Date().toISOString();

      // 1. AUTO-SYNC: Update any 'active' plans that have passed their expiry date
      const { error: syncError } = await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('doctor_id', user.id)
        .eq('status', 'active')
        .lt('expiry_date', now); // If expiry_date is LESS THAN now

      if (syncError) console.error("Sync Error:", syncError.message);

      // 2. FETCH: Get the updated list
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id, patient_id, plan_type, expiry_date, status,
          profiles:patient_id (full_name, avatar_url, phone)
        `)
        .eq('doctor_id', user.id)
        .order('status', { ascending: true }); // Active usually comes before Expired alphabetically

      if (error) throw error;
      
      const subs = (data as any) || [];
      setSubscribers(subs);

      // 3. CALC REVENUE: Sum up prices of only ACTIVE subscriptions
      const revenue = subs.reduce((acc: number, sub: Subscriber) => {
        if (sub.status === 'active') {
          return acc + (PLAN_PRICES[sub.plan_type] || 150); // Fallback to 150
        }
        return acc;
      }, 0);
      
      setTotalRevenue(revenue);

    } catch (e: any) {
      Alert.alert("Sync Error", "Failed to update subscription statuses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    syncAndFetchSubscribers();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    syncAndFetchSubscribers();
  };

  const handleChatPress = (item: Subscriber) => {
    if (item.status === 'expired') {
      Alert.alert(
        "Subscription Expired",
        `${item.profiles?.full_name}'s plan has expired. They need to renew before you can continue the consultation.`,
        [{ text: "OK" }]
      );
      return;
    }

    router.push({
      pathname: "/(freelancer-dashboard)/chat/[id]",
      params: { id: item.patient_id, name: item.profiles?.full_name }
    });
  };

  const renderSubscriber = ({ item }: { item: Subscriber }) => {
    const isExpired = item.status === 'expired';
    
    return (
      <TouchableOpacity 
        style={[styles.subscriberCard, isExpired && styles.expiredCard]} 
        activeOpacity={0.8}
        onPress={() => handleChatPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            {item.profiles?.avatar_url ? (
              <Image source={{ uri: item.profiles.avatar_url }} style={[styles.avatar, isExpired && { opacity: 0.5 }]} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.profiles?.full_name?.charAt(0) || 'P'}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.patientName, isExpired && { color: '#94A3B8' }]}>
              {item.profiles?.full_name || "Unknown Patient"}
            </Text>
            <View style={styles.planRow}>
              <MaterialCommunityIcons name="shield-check" size={14} color={isExpired ? "#94A3B8" : "#0EA5E9"} />
              <Text style={styles.planBadge}>{item.plan_type} Access</Text>
            </View>
          </View>

          <View style={[styles.statusIndicator, { backgroundColor: isExpired ? '#64748B' : '#22C55E' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>
              {isExpired ? "Expired on: " : "Valid until: "}
              {new Date(item.expiry_date).toLocaleDateString()}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.chatBtn, isExpired && styles.chatBtnDisabled]}
            onPress={() => handleChatPress(item)}
          >
            <Ionicons name={isExpired ? "lock-closed" : "chatbubble-ellipses"} size={16} color="#FFF" />
            <Text style={styles.chatBtnText}>{isExpired ? "Locked" : "Message"}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerSubtitle}>Revenue & Practice</Text>
              <Text style={styles.headerTitle}>Subscribers</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {subscribers.filter(s => s.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Active Patients</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                K{totalRevenue.toLocaleString()} 
              </Text>
              <Text style={styles.statLabel}>Monthly Rev.</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.bottomSection}>
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#0EA5E9" />
          </View>
        ) : (
          <FlatList
            data={subscribers}
            keyExtractor={(item) => item.id}
            renderItem={renderSubscriber}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-group-outline" size={80} color="#CBD5E1" />
                <Text style={styles.emptyText}>No active subscriptions found.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingBottom: 30, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  headerSubtitle: { color: '#38BDF8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  refreshBtn: { backgroundColor: 'rgba(255,255,255,0.12)', padding: 12, borderRadius: 15 },
  statsRow: { flexDirection: 'row', marginTop: 25, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#94A3B8', fontSize: 12, marginTop: 4, fontWeight: '700' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 15 },
  bottomSection: { flex: 1 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingBottom: 40 },
  subscriberCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 18, marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  expiredCard: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', opacity: 0.8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 18 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#0EA5E9', fontWeight: '900', fontSize: 20 },
  patientName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  planBadge: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  statusIndicator: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  chatBtn: { backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, gap: 8 },
  chatBtnDisabled: { backgroundColor: '#94A3B8' },
  chatBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#1E293B', marginTop: 20, fontSize: 16, fontWeight: '700' }
});

export default FreelancerSubscribers;