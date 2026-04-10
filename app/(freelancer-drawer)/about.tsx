import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const AboutScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#0B3C5D", "#0EA5E9"]} style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Our Story</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* BRAND SECTION */}
          <View style={styles.heroSection}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="heart-pulse" size={50} color="#0EA5E9" />
            </View>
            <Text style={styles.companyName}>KadobiTech</Text>
            <Text style={styles.tagline}>Engineering the Future of Health</Text>
          </View>

          {/* THE MISSION */}
          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>The Vision</Text>
            <Text style={styles.bodyText}>
              At <Text style={styles.highlight}>KadobiTech</Text>, we aren't just building apps; we are building lifelines. 
              iCare was born from the necessity to bridge the gap between critical medical services and the people who need them most. 
              Our journey started with a simple question: "How can we make healthcare instant?"
            </Text>
          </View>

          {/* FOUNDER SECTION */}
          <View style={styles.founderCard}>
            <View style={styles.founderHeader}>
              <View style={styles.founderImagePlaceholder}>
                 {/* Replace with your actual photo uri */}
                <Ionicons name="person" size={40} color="#0EA5E9" />
              </View>
              <View>
                <Text style={styles.founderName}>Tando Kadobi</Text>
                <Text style={styles.founderName}>Founder & CEO</Text>
                <Text style={styles.founderRole}>Lead Programmer</Text>
              </View>
            </View>
            <Text style={styles.founderText}>
              "As a programmer and the founder of KadobiTech, I've spent countless nights refining every line of code 
              in iCare. My goal was to create a platform that is as reliable as a heartbeat. We’ve come a long way 
              from the first prototype, and we’re just getting started on our mission to revolutionize healthcare 
              technology."
            </Text>
          </View>

          {/* JOURNEY MILESTONES */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>2023</Text>
              <Text style={styles.statLabel}>Founded</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>1.0.4</Text>
              <Text style={styles.statLabel}>Current Version</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>MVP</Text>
              <Text style={styles.statLabel}>Phase</Text>
            </View>
          </View>

          <Text style={styles.footerText}>Designed & Developed by KadobiTech</Text>
          <Text style={styles.copyright}>© 2026 iCare Systems</Text>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  
  heroSection: { alignItems: 'center', marginVertical: 30 },
  logoCircle: { width: 90, height: 90, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)' },
  companyName: { fontSize: 32, fontWeight: '900', color: '#FFF', marginTop: 15 },
  tagline: { fontSize: 14, color: '#BAE6FD', fontWeight: '600', letterSpacing: 1 },

  glassCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 25, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  bodyText: { fontSize: 15, color: '#E0F2FE', lineHeight: 24, fontWeight: '400' },
  highlight: { color: '#0EA5E9', fontWeight: '700' },

  founderCard: { backgroundColor: '#FFF', padding: 25, borderRadius: 28, elevation: 10 },
  founderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 15 },
  founderImagePlaceholder: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#0EA5E9' },
  founderName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  founderRole: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  founderText: { fontSize: 14, color: '#475569', lineHeight: 22, fontStyle: 'italic' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30, paddingVertical: 20 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  statLabel: { fontSize: 11, color: '#BAE6FD', textTransform: 'uppercase', marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  footerText: { textAlign: 'center', marginTop: 40, color: '#BAE6FD', fontSize: 12, fontWeight: '700' },
  copyright: { textAlign: 'center', color: 'rgba(186, 230, 253, 0.3)', fontSize: 10, marginTop: 5 }
});

export default AboutScreen;