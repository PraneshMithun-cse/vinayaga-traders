import { Tabs } from "expo-router";
import { Platform, StyleSheet, View, Text } from "react-native";
import { Colors } from "../../constants/colors";
import { FloatingCart } from "../../components/cart/FloatingCart";

function TabIcon({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={styles.flex}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.tabBarInactive,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="🏠" label="Home" />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="🔍" label="Search" />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="📦" label="Orders" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="👤" label="Profile" />
            ),
          }}
        />
      </Tabs>
      <FloatingCart />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    height: Platform.OS === "ios" ? 82 : 62,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tabIcon: { alignItems: "center", gap: 2 },
  icon: { fontSize: 22, opacity: 0.5 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, color: Colors.tabBarInactive, fontWeight: "600" },
  labelActive: { color: Colors.primary },
});
