import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Bell, CreditCard, Video, ShieldCheck } from 'lucide-react-native';
import dayjs from 'dayjs';

const ICON_MAP = {
  payment: { icon: <CreditCard size={24} color="#EAB308" />, bg: 'rgba(234, 179, 8, 0.1)', label: 'Payment' },
  call: { icon: <Video size={24} color="#10B981" />, bg: 'rgba(16, 185, 129, 0.1)', label: 'Video Call' },
  default: { icon: <ShieldCheck size={24} color="#6366F1" />, bg: 'rgba(99, 102, 241, 0.1)', label: 'System' },
};

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { title, body, created_at, type } = useLocalSearchParams();
  
  const theme = ICON_MAP[type as keyof typeof ICON_MAP] || ICON_MAP.default;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <ChevronLeft color="#FFF" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Type Badge */}
        <View style={[styles.badge, { backgroundColor: theme.bg }]}>
          {theme.icon}
          <Text style={[styles.badgeText, { color: theme.icon.props.color }]}>
            {theme.label}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Timestamp */}
        <View style={styles.timeRow}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.timeText}>
            {dayjs(created_at as string).format('DD MMMM YYYY • HH:mm')}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Message Body */}
        <Text style={styles.bodyText}>{body}</Text>
        
      </ScrollView>

      {/* Action Button (Optional) */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.back()}
        >
          <Text style={styles.actionButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  timeText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  bodyText: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});