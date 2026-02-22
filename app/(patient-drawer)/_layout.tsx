import { Drawer } from "expo-router/drawer";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSidebarProfile();
    }
  }, [user]);

  async function fetchSidebarProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user?.id)
        .single();

      if (data) setProfile(data);
    } catch (err) {
      console.error("Sidebar fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <LinearGradient colors={["#0F172A", "#1E293B"]} style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        
        {/* --- USER PROFILE SECTION --- */}
        <View style={styles.userSection}>
          <LinearGradient 
            colors={["#0EA5E9", "#2563EB"]} 
            style={styles.avatarBorder}
          >
            <Image
              source={{ 
                uri: `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=0F172A&color=fff` 
              }}
              style={styles.avatar}
            />
          </LinearGradient>
          
          <View style={styles.userInfo}>
            {loading ? (
              <ActivityIndicator size="small" color="#38BDF8" style={{ alignSelf: 'flex-start' }} />
            ) : (
              <>
                <Text style={styles.userName} numberOfLines={1}>
                  {profile?.full_name || "iCare User"}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.userTag}>{profile?.role || "Patient"}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- NAV ITEMS --- */}
        <View style={styles.navSection}>
          <DrawerItemList {...props} />
        </View>

        {/* --- KADOBITECH TECH SUPPORT CARD --- */}
        <TouchableOpacity 
          style={styles.helpCard}
          onPress={() => router.push("/help")}
        >
          <View style={styles.helpHeader}>
            <MaterialCommunityIcons name="shield-plus" size={22} color="#38BDF8" />
            <Text style={styles.helpTitle}>iCare Plus</Text>
          </View>
          <Text style={styles.helpSub}>
            24/7 priority access to KadobiTech medical assistance.
          </Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* --- FOOTER --- */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FB7185" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.companyCredit}>ENGINEERED BY KADOBITECH</Text>
      </View>
    </LinearGradient>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front", // Overlay mode: Fixes the "pushing" issue
        overlayColor: "rgba(15, 23, 42, 0.75)",
        drawerActiveBackgroundColor: "rgba(14, 165, 233, 0.12)",
        drawerActiveTintColor: "#38BDF8",
        drawerInactiveTintColor: "#94A3B8",
        drawerLabelStyle: {
          marginLeft: -10,
          fontSize: 15,
          fontWeight: "700",
        },
        drawerStyle: {
          width: "82%",
          backgroundColor: "#0F172A",
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Home Dashboard",
          drawerIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "My Health Profile",
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
          drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="help"
        options={{
          drawerLabel: "Help & Support",
          drawerIcon: ({ color }) => <Ionicons name="help-buoy-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          drawerLabel: "About KadobiTech",
          drawerIcon: ({ color }) => <Ionicons name="business-outline" size={22} color={color} />,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  userSection: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  avatarBorder: {
    width: 72,
    height: 72,
    borderRadius: 24,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#0F172A",
  },
  userInfo: {
    gap: 2,
  },
  userName: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
    marginTop: 4,
  },
  userTag: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "800",
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  navSection: {
    paddingHorizontal: 10,
  },
  helpCard: {
    margin: 20,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  helpTitle: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
  },
  helpSub: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 113, 133, 0.08)",
    padding: 16,
    borderRadius: 18,
    gap: 12,
  },
  logoutText: {
    color: "#FB7185",
    fontWeight: "800",
    fontSize: 16,
  },
  companyCredit: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.15)',
    fontSize: 9,
    marginTop: 15,
    fontWeight: '800',
    letterSpacing: 2,
  }
});
