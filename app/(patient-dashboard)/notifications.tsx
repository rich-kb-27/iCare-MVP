import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Appointment Confirmed',
    message: 'Your session with Dr. Sarah Phiri is confirmed for tomorrow at 10:30 AM.',
    time: '2 mins ago',
    type: 'appointment',
    read: false,
  },
  {
    id: '2',
    title: 'Lab Report Ready',
    message: 'Your Full Blood Count results have been uploaded by Main City Lab.',
    time: '1 hour ago',
    type: 'report',
    read: false,
  },
  {
    id: '3',
    title: 'Subscription Active',
    message: 'Welcome to iCare Pro! Your premium benefits are now active.',
    time: '5 hours ago',
    type: 'billing',
    read: true,
  },
  {
    id: '4',
    title: 'Health Tip',
    message: 'Remember to stay hydrated! Drinking 8 glasses of water daily improves skin health.',
    time: 'Yesterday',
    type: 'tip',
    read: true,
  },
];

const NotificationsScreen = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment': return { name: 'calendar-check', color: '#0EA5E9' };
      case 'report': return { name: 'file-document-outline', color: '#8B5CF6' };
      case 'billing': return { name: 'shield-check-outline', color: '#10B981' };
      default: return { name: 'lightbulb-outline', color: '#F59E0B' };
    }
  };

  const NotificationItem = ({ item }: { item: typeof NOTIFICATIONS[0] }) => (
    <TouchableOpacity style={[styles.notiCard, !item.read && styles.unreadCard]}>
      <View style={[styles.iconBox, { backgroundColor: `${getIcon(item.type).color}15` }]}>
        <MaterialCommunityIcons name={getIcon(item.type).name as any} size={24} color={getIcon(item.type).color} />
      </View>
      
      <View style={styles.textContent}>
        <View style={styles.notiHeader}>
          <Text style={styles.notiTitle}>{item.title}</Text>
          <Text style={styles.notiTime}>{item.time}</Text>
        </View>
        <Text style={styles.notiMessage} numberOfLines={2}>{item.message}</Text>
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={80} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>All caught up!</Text>
            </View>
          }
          renderItem={({ item }) => <NotificationItem item={item} />}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>POWERED BY KADOBITECH CLOUD</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  backBtn: { width: 40 },
  markReadText: { color: '#BAE6FD', fontSize: 13, fontWeight: '600' },

  listContainer: { padding: 20, paddingBottom: 100 },
  
  notiCard: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  unreadCard: { 
    backgroundColor: 'rgba(255,255,255,0.12)', 
    borderColor: 'rgba(14, 165, 233, 0.3)' 
  },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  textContent: { flex: 1, marginLeft: 15, marginRight: 10 },
  notiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notiTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  notiTime: { color: '#94A3B8', fontSize: 11 },
  notiMessage: { color: '#BAE6FD', fontSize: 13, lineHeight: 18 },
  
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0EA5E9' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 18, fontWeight: '600', marginTop: 20 },

  footer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800', letterSpacing: 2 }
});

export default NotificationsScreen;