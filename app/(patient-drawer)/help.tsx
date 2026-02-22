import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const HelpScreen = () => {
  const router = useRouter();

  const THEME = { 
    dark: '#0F172A', 
    sky: '#0EA5E9', 
    textMuted: '#94A3B8' 
  };

  const HelpOption = ({ icon, title, sub, onPress, color = '#0EA5E9' }: any) => (
    <TouchableOpacity style={styles.helpCard} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={THEME.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionLabel}>Contact Us</Text>
          
          <HelpOption 
            icon="chatbubbles-outline" 
            title="Live Chat" 
            sub="Speak with our medical assistants" 
            onPress={() => router.push("/(patient-dashboard)/chat")}
          />

          <HelpOption 
            icon="mail-outline" 
            title="Email Support" 
            sub="Get a response within 24 hours" 
            onPress={() => Linking.openURL('mailto:support@icaremvp.com')}
          />

          <Text style={styles.sectionLabel}>Emergency</Text>
          
          <HelpOption 
            icon="call" 
            title="Emergency Hotline" 
            sub="Immediate medical assistance" 
            color="#EF4444"
            onPress={() => Linking.openURL('tel:911')}
          />

          {/* FAQ Section with fixed styles */}
          <View style={styles.faqSection}>
            <Text style={styles.sectionLabel}>Common Questions</Text>
            {['How to book an appointment?', 'Viewing my lab reports', 'Updating insurance info'].map((q, i) => (
              <TouchableOpacity key={i} style={styles.faqItem}>
                <Text style={styles.faqText}>{q}</Text>
                <Ionicons name="add" size={20} color={THEME.sky} />
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: '#BAE6FD', 
    marginBottom: 15, 
    marginTop: 20, 
    letterSpacing: 1.5, 
    textTransform: 'uppercase' 
  },
  helpCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  iconCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  
  // FIXED: Added missing faqSection style
  faqSection: {
    marginTop: 10,
    marginBottom: 30
  },
  faqItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  faqText: { color: '#E0F2FE', fontSize: 14, fontWeight: '600' },
});

export default HelpScreen;