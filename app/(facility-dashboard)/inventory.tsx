import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, LayoutRectangle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {LinearGradient} from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUNIYA_CATALOG = [
  { id: '1', name: 'Rapid Malaria Test Kits', price: 'K450 (Box of 25)', stock: 'In Stock', category: 'Diagnostics', icon: 'flask-outline' },
  { id: '2', name: 'Sterile Latex Gloves', price: 'K120 (Box of 100)', stock: 'Low Stock', category: 'Consumables', icon: 'hand-left-outline' },
  { id: '3', name: 'Digital Blood Pressure Monitor', price: 'K850', stock: 'In Stock', category: 'Equipment', icon: 'pulse-outline' },
  { id: '4', name: 'IV Cannula G22', price: 'K200 (Pack of 50)', stock: 'In Stock', category: 'Consumables', icon: 'medkit-outline' },
];

export default function InventoryScreen() {
  const router = useRouter();

  const handleOrder = (itemName: string) => {
    const message = `Hello iCare Admin, my facility would like to order ${itemName} from Duniya.`;
    Linking.openURL(`whatsapp://send?text=${message}&phone=+260XXXXXXXXX`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Supply Bridge</Text>
          <Text style={styles.headerSub}>Powered by Duniya</Text>
        </View>
        <MaterialCommunityIcons name="truck-delivery-outline" size={28} color="#0EA5E9" />
      </View>

      <View style={styles.promoCard}>
        <LinearGradient colors={['#0EA5E9', '#0284C7']} style={styles.promoGradient}>
          <Text style={styles.promoTitle}>BongoHive Partner Discount</Text>
          <Text style={styles.promoText}>Get 10% off all Duniya diagnostic tools this month.</Text>
        </LinearGradient>
      </View>

      <FlatList
        data={DUNIYA_CATALOG}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.iconBox}>
              <Ionicons name={item.icon as any} size={24} color="#0EA5E9" />
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.categoryText}>{item.category}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price}</Text>
              <Text style={[styles.stockText, { color: item.stock === 'Low Stock' ? '#EF4444' : '#10B981' }]}>
                ● {item.stock}
              </Text>
            </View>
            <TouchableOpacity style={styles.orderBtn} onPress={() => handleOrder(item.name)}>
              <Text style={styles.orderText}>Order</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B' },
  promoCard: { padding: 20 },
  promoGradient: { padding: 15, borderRadius: 16 },
  promoTitle: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  promoText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  itemCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  iconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  infoBox: { flex: 1, marginLeft: 15 },
  categoryText: { fontSize: 10, fontWeight: '700', color: '#0EA5E9', textTransform: 'uppercase' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  itemPrice: { fontSize: 13, color: '#64748B', marginTop: 2 },
  stockText: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  orderBtn: { backgroundColor: '#0F172A', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  orderText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
});