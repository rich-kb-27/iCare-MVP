import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SplashScreen = () => {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 📳 Subtle premium haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();

    // 🫀 Calm breathing / pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ⏱ Redirect to onboarding
    const timer = setTimeout(() => {
      router.replace('/(auth)/OnboardingScreen');
    }, 10000); // adjust timing if needed

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#0F172A', '#0B3C5D', '#0EA5E9']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* 🩺 Background icon */}
      <Animated.View
        style={[
          styles.backgroundIcon,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <FontAwesome5
          name="stethoscope"
          size={250}
          color="#38BDF8"
        />
      </Animated.View>

      {/* Center Branding */}
      <View style={styles.centerContent}>
        <Animated.Text
          style={[
            styles.iCareText,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          iCare
        </Animated.Text>

        <Animated.Text
          style={[styles.tagline, { opacity: fadeAnim }]}
        >
          your health, simplified
        </Animated.Text>
      </View>

      {/* Footer */}
      <View style={styles.bottomContent}>
        <Text style={styles.poweredByText}>
          powered by <Text style={styles.brand}>kadobiTech</Text>
        </Text>
      </View>
    </LinearGradient>
  );
};

export default SplashScreen;



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  backgroundIcon: {
    position: 'absolute',
    top: '28%',
    opacity: 0.06, // ultra-subtle = premium
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iCareText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#E0F2FE',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(14,165,233,0.35)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 24,
  },

  tagline: {
    marginTop: 12,
    fontSize: 16,
    color: '#BAE6FD',
    fontWeight: '400',
    letterSpacing: 0.4,
  },

  bottomContent: {
    paddingBottom: 48,
  },

  poweredByText: {
    fontSize: 13,
    color: '#CBD5E1',
  },

  brand: {
    fontWeight: '600',
    color: '#E0F2FE',
  },
});
