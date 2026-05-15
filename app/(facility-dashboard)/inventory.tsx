import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Linking, 
  TextInput,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const DUNIYA_CATALOG = [
  { id: '1', name: 'Rapid Malaria Test Kits', price: 'K450', unit: 'Box of 25', stock: 'In Stock', category: 'Diagnostics', icon: 'flask-outline' },
  { id: '2', name: 'Sterile Latex Gloves', price: 'K120', unit: 'Box of 100', stock: 'Low Stock', category: 'Consumables', icon: 'hand-left-outline' },
  { id: '3', name: 'Digital BP Monitor', price: 'K850', unit: 'Per Unit', stock: 'In Stock', category: 'Equipment', icon: 'pulse-outline' },
  { id: '4', name: 'IV Cannula G22', price: 'K200', unit: 'Pack of 50', stock: 'In Stock', category: 'Consumables', icon: 'medkit-outline' },
];

const CATEGORIES = ['All', 'Diagnostics', 'Equipment', 'Consumables', 'Pharma'];

export default function InventoryScreen() {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState('All');

  const handleOrder = (itemName: string) => {
    const message = `Hello iCare Admin, my facility would like to order ${itemName} from the Duniya marketplace.`;
    // Replace with actual admin number
    Linking.openURL(`whatsapp://send?text=${message}&phone=+260XXXXXXXXX`);
  };

  const renderItem = ({ item }: { item: typeof DUNIYA_CATALOG[0] }) => (
    <View style={styles.itemCard}>
      <View style={styles.cardTop}>
        <View style={styles.iconContainer}>
          <LinearGradient colors={['#F0F9FF', '#E0F2FE']} style={styles.iconGrad}>
            <Ionicons name={item.icon as any} size={24} color="#0EA5E9" />
          </LinearGradient>
        </View>
        <View style={styles.statusChip}>
          <View style={[styles.dot, { backgroundColor: item.stock === 'Low Stock' ? '#F59E0B' : '#10B981' }]} />
          <Text style={[styles.stockText, { color: item.stock === 'Low Stock' ? '#D97706' : '#059669' }]}>
            {item.stock}
          </Text>
        </View>
      </View>

      <View style={styles.cardMid}>
        <Text style={styles.categoryLabel}>{item.category}</Text>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>{item.price}</Text>
          <Text style={styles.unitText}>/ {item.unit}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.orderAction} onPress={() => handleOrder(item.name)}>
        <Text style={styles.orderActionText}>Place Order</Text>
        <Ionicons name="cart-outline" size={18} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* IMMERSIVE HEADER */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.headerHero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.logoGroup}>
               <Text style={styles.heroTitle}>Supply <Text style={{color: '#0EA5E9'}}>Bridge</Text></Text>
               <View style={styles.partnerBadge}>
                 <Text style={styles.partnerText}>BY DUNIYA</Text>
               </View>
            </View>
            <TouchableOpacity style={styles.glassBtn}>
              <Ionicons name="search" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* PROMO BANNER */}
          <View style={styles.promoWrapper}>
            <LinearGradient 
              colors={['rgba(14, 165, 233, 0.15)', 'rgba(14, 165, 233, 0.05)']} 
              style={styles.promoContent}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
            >
              <MaterialCommunityIcons name="ticket-percent" size={24} color="#38BDF8" />
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.promoHeading}>BongoHive Exclusive</Text>
                <Text style={styles.promoSub}>10% discount on diagnostics auto-applied.</Text>
              </View>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* CATEGORY SELECTOR */}
      <View style={styles.catContainer}>
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => setActiveCat(item)}
              style={[styles.catChip, activeCat === item && styles.catChipActive]}
            >
              <Text style={[styles.catChipText, activeCat === item && styles.catChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={DUNIYA_CATALOG}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerHero: { paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  glassBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  logoGroup: { alignItems: 'center' },
  heroTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  partnerBadge: { backgroundColor: '#0EA5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  partnerText: { color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  
  promoWrapper: { paddingHorizontal: 20, marginTop: 25 },
  promoContent: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)' },
  promoHeading: { color: '#38BDF8', fontWeight: '800', fontSize: 13 },
  promoSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },

  catContainer: { marginVertical: 20 },
  catChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  catChipActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  catChipText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  catChipTextActive: { color: '#FFF' },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  itemCard: { 
    backgroundColor: '#FFF', 
    width: (width - 55) / 2, 
    borderRadius: 24, 
    padding: 15, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  iconContainer: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden' },
  iconGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 4 },
  stockText: { fontSize: 9, fontWeight: '800' },

  cardMid: { marginBottom: 15 },
  categoryLabel: { fontSize: 9, fontWeight: '900', color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemName: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginTop: 4, height: 40 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  itemPrice: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  unitText: { fontSize: 10, color: '#94A3B8', marginLeft: 2, fontWeight: '600' },

  orderAction: { 
    backgroundColor: '#0F172A', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderRadius: 14,
    gap: 8
  },
  orderActionText: { color: '#FFF', fontWeight: '800', fontSize: 12 }
});