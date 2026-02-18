import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Healthcare, made accessible',
    description:
      'Get reliable and affordable private healthcare anytime, anywhere in Zambia.',
    icon: 'heartbeat',
  },
  {
    title: 'Empowering healthcare professionals',
    description:
      'Creating a new freelancing market for doctors and healthcare professionals.',
    icon: 'user-md',
  },
  {
    title: 'Building the future of healthcare',
    description:
      'AI-assisted diagnosis, data-driven care, and drone-powered medical delivery.',
    icon: 'rocket',
  },
];

const OnboardingScreen = () => {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (index < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#0B3C5D', '#0EA5E9']}
      style={styles.container}
    >
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onScroll={(e) => {
          const slideIndex = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setIndex(slideIndex);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <FontAwesome5
              name={item.icon}
              size={72}
              color="#E0F2FE"
              style={styles.icon}
            />

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      {/* Pagination */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              index === i && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {index === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 40,
  },

  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  icon: {
    marginBottom: 32,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#E0F2FE',
    textAlign: 'center',
    marginBottom: 16,
  },

  description: {
    fontSize: 16,
    color: '#BAE6FD',
    textAlign: 'center',
    lineHeight: 24,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#E0F2FE',
    width: 16,
  },

  button: {
    marginHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
  },

  buttonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
});
