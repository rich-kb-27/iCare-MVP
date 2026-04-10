import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, View, Text, FlatList, TouchableOpacity, 
  SafeAreaView, RefreshControl, ActivityIndicator, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { Bell, CreditCard, Video, ShieldCheck, CheckCheck, Trash2 } from 'lucide-react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler'; // Added
import { supabase } from '@/lib/supabase';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Enable LayoutAnimation for smooth expansion on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ICON_MAP = {
  payment: { icon: <CreditCard size={20} color="#EAB308" />, bg: 'rgba(234, 179, 8, 0.1)' },
  call: { icon: <Video size={20} color="#10B981" />, bg: 'rgba(16, 185, 129, 0.1)' },
  default: { icon: <ShieldCheck size={20} color="#6366F1" />, bg: 'rgba(99, 102, 241, 0.1)' },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null); // Track expanded item

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setNotifications(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark specific item as read in DB and State
  const handlePressNotification = async (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === item.id ? null : item.id);

    if (!item.is_read) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', item.id);

      if (!error) {
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
      }
    }
  };

  // Remove notification
  const deleteNotification = async (id) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const renderRightActions = (id) => (
    <TouchableOpacity 
      style={styles.deleteAction} 
      onPress={() => deleteNotification(id)}
    >
      <Trash2 color="#FFF" size={20} />
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const theme = ICON_MAP[item.type] || ICON_MAP.default;
    const isExpanded = expandedId === item.id;
    
    return (
      <Swipeable 
        renderRightActions={() => renderRightActions(item.id)}
        friction={2}
      >
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => handlePressNotification(item)}
          style={[styles.notiCard, !item.is_read && styles.unreadCard]}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.bg }]}>
            {theme.icon}
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.notiTitle}>{item.title}</Text>
              <Text style={styles.timeText}>{dayjs(item.created_at).fromNow()}</Text>
            </View>
            <Text 
              style={styles.notiBody} 
              numberOfLines={isExpanded ? undefined : 2}
            >
              {item.body}
            </Text>
          </View>

          {!item.is_read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Activity Feed</Text>
            <Text style={styles.headerSub}>Updates from your care team</Text>
          </View>
          <TouchableOpacity onPress={markAllRead} style={styles.clearBtn}>
            <CheckCheck size={16} color="#94A3B8" />
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPadding}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={() => { setRefreshing(true); fetchNotifications(); }} 
                tintColor="#6366F1"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Bell size={60} color="#1E293B" />
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySub}>No new updates right now.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    padding: 24,
    paddingBottom: 16
  },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: '#64748B', fontSize: 14, marginTop: 4 },
  clearBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 12,
    gap: 6
  },
  clearText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  notiCard: { 
    flexDirection: 'row', 
    backgroundColor: '#0F172A', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    alignItems: 'flex-start' // Changed to flex-start for multi-line support
  },
  unreadCard: { 
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.2)' 
  },
  iconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 14
  },
  textContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notiTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '700' },
  timeText: { color: '#475569', fontSize: 11, fontWeight: '500' },
  notiBody: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366F1', marginLeft: 8, marginTop: 8 },
  emptyState: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { color: '#475569', textAlign: 'center', marginTop: 4 },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '84%', // Match card height minus margin
    borderRadius: 20,
    marginBottom: 12,
    marginLeft: 8
  }
});