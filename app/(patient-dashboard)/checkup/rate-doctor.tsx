import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, SafeAreaView, StatusBar, Platform, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Star, CheckCircle2, Award, Users, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

// iCare Theme Colors
const COLORS = {
  primary: '#0EA5E9',   // Sky Blue
  accent: '#2563EB',    // Blue Accent
  gold: '#F59E0B',      // Rating Gold
  success: '#10B981',   // Emerald
  danger: '#F43F5E',    // Rose
  dark: '#020617',      // Rich Navy
  darkCard: 'rgba(30, 41, 59, 0.7)', 
  slate: '#94A3B8',     
  white: '#FFFFFF',
};

const UI_RATING_NOTES = [
  "",
  "Penalty: Critically Bad", 
  "Minimal Service",         
  "Decent / Neutral",        
  "Good Service",             
  "Excellent Care"           
];

export default function RateDoctorScreen() {
  const { doctorId, doctorName } = useLocalSearchParams();
  const router = useRouter();
  
  const [selectedRating, setSelectedRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);

  // Function to handle the final exit to drawer
  const handleFinalExit = () => {
    router.replace('/(patient-drawer)');
  };

  // Timer logic for auto-redirect after success
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    if (isSubmitted) {
      // Auto-redirect after 3 seconds
      timer = setTimeout(() => {
        handleFinalExit();
      }, 3000);

      // Countdown display logic
      interval = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isSubmitted]);

  const handleSubmitFeedback = async () => {
    if (selectedRating === 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.rpc('submit_review', {
        target_id: doctorId,    
        star_rating: selectedRating 
      });

      if (error) throw error;
      setIsSubmitted(true);
    } catch (err) {
      console.error("Rating Submission Error:", err);
      Alert.alert("Error", "Could not submit rating. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip Feedback",
      "Are you sure you want to skip rating Dr. " + doctorName + "?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Skip", onPress: handleFinalExit, style: 'destructive' },
      ]
    );
  };

  // SUCCESS VIEW
  if (isSubmitted) {
    return (
      <View style={[styles.container, styles.successCenter]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[COLORS.dark, '#0F172A']} style={StyleSheet.absoluteFillObject} />
        
        {/* Manual Exit on Success */}
        <TouchableOpacity style={styles.manualCloseBtn} onPress={handleFinalExit}>
          <X size={28} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.successAnimationCard}>
          <View style={styles.successIconWrapper}>
            <CheckCircle2 size={80} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successSub}>
            Your feedback helps maintain the quality of care on iCare. We've updated Dr. {doctorName}'s profile.
          </Text>

          {/* Countdown Badge */}
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>Redirecting in {secondsLeft}s</Text>
          </View>
        </View>
      </View>
    );
  }

  // RATING VIEW
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.dark, '#0F172A', '#0B3C5D']} style={styles.gradientBg} />
      
      <View style={styles.header}>
        <Text style={styles.headerLabel}>iCare Consultation Complete</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
          <X size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <BlurView intensity={Platform.OS === 'ios' ? 70 : 100} tint="dark" style={styles.rateCard}>
          <View style={styles.expertAvatarContainer}>
            <View style={styles.avatarGlow} />
            <Award size={40} color={COLORS.gold} />
          </View>
          
          <Text style={styles.title}>Rate Your Expert</Text>
          <Text style={styles.subtitle}>
            How was your iCare consultation with Dr. {doctorName}?
          </Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setSelectedRating(s)} style={styles.starWrapper}>
                <Star 
                  size={46} 
                  color={s <= selectedRating ? COLORS.gold : COLORS.slate} 
                  fill={s <= selectedRating ? COLORS.gold : "transparent"} 
                />
              </TouchableOpacity>
            ))}
          </View>

          {selectedRating > 0 && (
            <Text style={styles.ratingNote}>
              {UI_RATING_NOTES[selectedRating]}
            </Text>
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, selectedRating === 0 && styles.disabledBtn]} 
            onPress={handleSubmitFeedback}
            disabled={loading || selectedRating === 0}
          >
            <LinearGradient
              colors={selectedRating === 0 ? ['#475569', '#334155'] : [COLORS.primary, COLORS.accent]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit iCare Feedback</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
        
        <View style={styles.communityTrustCard}>
          <Users size={20} color={COLORS.primary} />
          <Text style={styles.communityText}>
            Your rating helps other iCare patients find trusted medical advice in Zambia.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  gradientBg: { ...StyleSheet.absoluteFillObject },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, zIndex: 10 },
  headerLabel: { color: COLORS.primary, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  closeBtn: { padding: 5 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  rateCard: { width: '100%', padding: 30, borderRadius: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', backgroundColor: COLORS.darkCard },
  expertAvatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: COLORS.gold },
  avatarGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 40, backgroundColor: 'rgba(255, 215, 0, 0.05)', transform: [{ scale: 1.2 }] },
  
  title: { color: COLORS.white, fontSize: 26, fontWeight: '900', marginBottom: 10, letterSpacing: 0.5 },
  subtitle: { color: COLORS.slate, textAlign: 'center', marginBottom: 35, fontSize: 16, lineHeight: 22, paddingHorizontal: 10 },
  
  starRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  starWrapper: { transform: [{ scale: 1.0 }] },
  ratingNote: { color: COLORS.gold, fontSize: 14, fontWeight: '700', marginBottom: 30, letterSpacing: 0.5 },
  
  submitBtn: { width: '100%', height: 60, borderRadius: 20, overflow: 'hidden', marginTop: 10 },
  disabledBtn: { opacity: 0.7 },
  btnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  
  // SUCCESS STATE STYLES
  successCenter: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  successAnimationCard: { width: '85%', padding: 40, borderRadius: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: COLORS.darkCard, overflow: 'hidden' },
  successIconWrapper: { shadowColor: COLORS.success, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  successTitle: { color: COLORS.white, fontSize: 26, fontWeight: '900', marginTop: 25, marginBottom: 15 },
  successSub: { color: COLORS.slate, textAlign: 'center', fontSize: 16, lineHeight: 22 },
  manualCloseBtn: { position: 'absolute', top: 60, right: 30, zIndex: 110, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  timerBadge: { marginTop: 30, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(14, 165, 233, 0.1)', borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.2)' },
  timerText: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },

  communityTrustCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 40, backgroundColor: 'rgba(14, 165, 233, 0.05)', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.1)' },
  communityText: { color: COLORS.slate, fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },
});