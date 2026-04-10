import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, Dimensions, RefreshControl, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Supabase
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function SubscriptionManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const fetchMySubscriptions = async () => {
    try {
      if (!refreshing) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch subscriptions (including status check)
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          plan_type,
          start_date,
          expiry_date, 
          doctor_id,
          patient_name,
          status
        `)
        .eq('patient_id', user.id);

      if (subError) throw subError;

      if (subData && subData.length > 0) {
        // 2. Fetch Doctor Names AND Profile Pictures
        const doctorIds = subData.map(s => s.doctor_id);
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url') // Added avatar_url
          .in('id', doctorIds);

        // 3. Merge data and check for expirations
        const merged = subData.map(sub => {
          const doctorInfo = profData?.find(p => p.id === sub.doctor_id);
          const daysLeft = calculateRemainingDays(sub.expiry_date);
          
          // Logic: If time is up but DB still says 'active', sync it
          if (daysLeft === 0 && sub.status !== 'expired') {
            updateSubscriptionToExpired(sub.id);
          }

          return {
            ...sub,
            doctor: doctorInfo,
            currentDaysLeft: daysLeft // Add for easier rendering
          };
        });

        setSubscriptions(merged);
      } else {
        setSubscriptions([]);
      }
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
      Alert.alert("Connection Error", "Could not load subscriptions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to sync expired status to DB
  const updateSubscriptionToExpired = async (subId: string) => {
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('id', subId);
  };

  useEffect(() => {
    fetchMySubscriptions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMySubscriptions();
  };

  const calculateRemainingDays = (expiry: string) => {
    if (!expiry) return 0;
    const end = new Date(expiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endNormalized = new Date(end);
    endNormalized.setHours(0, 0, 0, 0);

    const diffTime = endNormalized.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getProgress = (start: string, expire: string) => {
    if (!start || !expire) return 0;
    const startTime = new Date(start).getTime();
    const expireTime = new Date(expire).getTime();
    const nowTime = new Date().getTime();
    const totalDuration = expireTime - startTime;
    const elapsed = nowTime - startTime;
    const ratio = 1 - (elapsed / totalDuration);
    return Math.max(0, Math.min(1, ratio)); 
  };

  const renderSubscriptionCard = ({ item }: any) => {
    const daysLeft = item.currentDaysLeft;
    const progress = getProgress(item.start_date, item.expiry_date);
    const doctorName = item.doctor?.full_name || "Specialist";
    const doctorPic = item.doctor?.avatar_url;

    const isExpired = daysLeft === 0 || item.status === 'expired';
    const isEndingSoon = daysLeft > 0 && daysLeft <= 5;
    const progressColor = isExpired ? '#EF4444' : isEndingSoon ? '#F59E0B' : '#0EA5E9';

    return (
      <View style={styles.cardContainer}>
        <LinearGradient colors={["#1E293B", "#0F172A"]} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.doctorAvatar}>
              {doctorPic ? (
                <Image source={{ uri: doctorPic }} style={styles.avatarImg} />
              ) : (
                <FontAwesome5 name="user-md" size={22} color="#0EA5E9" />
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.doctorName}>Dr. {doctorName}</Text>
              <Text style={styles.planBadge}>{item.plan_type?.toUpperCase()} ACCESS</Text>
            </View>
            {isExpired && (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredText}>EXPIRED</Text>
              </View>
            )}
          </View>

          <View style={styles.statusSection}>
            <View style={styles.daysRow}>
              <Text style={styles.statusLabel}>Access Period</Text>
              <Text style={[
                styles.daysHighlight, 
                isEndingSoon && { color: '#F59E0B' },
                isExpired && { color: '#EF4444' }
              ]}>
                {isExpired ? "Subscription Ended" : `${daysLeft} Days Remaining`}
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[
                styles.progressFill, 
                { width: `${progress * 100}%`, backgroundColor: progressColor }
              ]} />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <TouchableOpacity 
              style={[styles.chatBtn, isExpired && styles.disabledBtn]}
              disabled={isExpired}
              onPress={() => router.push({ 
                pathname: "/chat", 
                params: { id: item.doctor_id, name: doctorName } 
              })}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
              <Text style={styles.chatBtnText}>Chat Now</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.manageBtn}
              onPress={() => router.push('/checkup/avaliable-doctors')}
            >
              <Text style={styles.manageBtnText}>Renew Access</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Subscriptions</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.backCircle}>
            <Ionicons name="refresh" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={{ color: '#94A3B8', marginTop: 15 }}>Checking Status...</Text>
          </View>
        ) : (
          <FlatList
            data={subscriptions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSubscriptionCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="card-search-outline" size={60} color="#334155" />
                <Text style={styles.emptyText}>No active subscriptions found.</Text>
                <TouchableOpacity style={styles.findBtn} onPress={() => router.push('/checkup/avaliable-doctors')}>
                  <Text style={styles.findBtnText}>Find a Doctor</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20 },
  cardContainer: { marginBottom: 18 },
  card: { borderRadius: 28, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  doctorAvatar: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(14,165,233,0.15)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  headerText: { flex: 1, marginLeft: 15 },
  doctorName: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  planBadge: { color: '#38BDF8', fontSize: 11, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  expiredBadge: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  expiredText: { color: '#F87171', fontSize: 10, fontWeight: '900' },
  statusSection: { marginBottom: 22 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statusLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  daysHighlight: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  cardFooter: { flexDirection: 'row', gap: 12 },
  chatBtn: { flex: 1.2, height: 52, backgroundColor: '#0EA5E9', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  disabledBtn: { backgroundColor: '#334155', opacity: 0.5 },
  chatBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  manageBtn: { flex: 1, height: 52, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  manageBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#64748B', fontSize: 16, marginTop: 15, fontWeight: '600' },
  findBtn: { marginTop: 20, backgroundColor: '#0EA5E9', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  findBtnText: { color: '#FFF', fontWeight: '800' }
});