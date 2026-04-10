import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

// STEP 1: Define the Interface to fix those "never" type errors
interface LabReport {
  id: string;
  test_name: string;
  lab_name: string;
  patient_id: string;
  date?: string; // Optional if you have a date column
  status: 'Ready' | 'Pending';
  created_at: string;
}

const LabReportsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  // STEP 2: Explicitly type the state as an array of LabReport objects
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const { data, error } = await supabase
        .from('lab_reports')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // STEP 3: Cast the data to the LabReport array type
      setReports((data as LabReport[]) || []);
    } catch (e: any) {
      console.error("Fetch Error:", e.message);
      Alert.alert("Error", "Could not load lab reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchReports();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  // Filter logic for the search bar
  const filteredReports = reports.filter(report => 
    report.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.lab_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Light status bar for the dark gradient top */}
      <StatusBar style="light" />

      <LinearGradient colors={["#0F172A", "#0B3C5D"]} style={styles.topSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.navContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={26} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Medical Reports</Text>
            <View style={{ width: 40 }} /> 
          </View>

          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput 
                placeholder="Search tests or labs..." 
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.bottomSection}>
        <Text style={styles.sectionTitle}>Recent Results</Text>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 40 }} />
          ) : filteredReports.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-search-outline" size={60} color="#E2E8F0" />
              <Text style={styles.emptyText}>
                {searchQuery ? "No matching reports" : "No reports found yet"}
              </Text>
            </View>
          ) : (
            filteredReports.map((report) => (
              <TouchableOpacity key={report.id} style={styles.reportCard} activeOpacity={0.7}>
                <View style={styles.iconContainer}>
                   <MaterialCommunityIcons 
                    name="test-tube" 
                    size={22} 
                    color={report.status === 'Ready' ? '#0EA5E9' : '#94A3B8'} 
                  />
                </View>
                
                <View style={styles.cardInfo}>
                  <Text style={styles.testName}>{report.test_name}</Text>
                  <Text style={styles.labName}>{report.lab_name}</Text>
                </View>

                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: report.status === 'Ready' ? '#DCFCE7' : '#F1F5F9' }
                ]}>
                  <Text style={[
                    styles.statusText, 
                    { color: report.status === 'Ready' ? '#166534' : '#64748B' }
                  ]}>
                    {report.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => Alert.alert("Upload", "Upload feature coming soon!")}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  topSection: { 
    paddingBottom: 30, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40 
  },
  navContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 10
  },
  backBtn: { padding: 15 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  searchWrapper: { paddingHorizontal: 25, marginTop: 10 },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    alignItems: 'center' 
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A' },
  bottomSection: { flex: 1, padding: 25, marginTop: -20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  reportCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 12,
    backgroundColor: '#F8FAFC'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  cardInfo: { flex: 1 },
  testName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  labName: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 25, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#0EA5E9', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5 
  },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94A3B8', marginTop: 10 }
});

export default LabReportsScreen;