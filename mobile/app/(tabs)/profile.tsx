import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { Colors } from "../../constants/colors";
import { COUPONS } from "../../constants/mockData";

interface MenuItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, value, onPress, danger }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      </View>
      {!danger && <Text style={styles.menuArrow}>›</Text>}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeAddress = useAuthStore((s) => s.activeAddress);
  const clearCart = useCartStore((s) => s.clearCart);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          clearCart();
          useAuthStore.getState().logout();
        },
      },
    ]);
  };

  const applicableCoupons = COUPONS.filter((c) => c.isApplicable).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name.split(" ").map((n) => n[0]).join("") ?? "?"}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name ?? "Guest"}</Text>
        <Text style={styles.userPhone}>{user?.phone ?? ""}</Text>
        {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}

        <View style={styles.walletBadge}>
          <Text style={styles.walletIcon}>💰</Text>
          <Text style={styles.walletText}>₹{user?.walletBalance ?? 0} in wallet</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>₹{user?.walletBalance ?? 0}</Text>
          <Text style={styles.statLabel}>Wallet</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{applicableCoupons}</Text>
          <Text style={styles.statLabel}>Coupons</Text>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="📍"
            label="Saved Addresses"
            value={`${user?.addresses.length ?? 0} saved`}
          />
          <View style={styles.menuSeparator} />
          <MenuItem
            icon="💳"
            label="Payment Methods"
            value="UPI, Cards"
          />
          <View style={styles.menuSeparator} />
          <MenuItem
            icon="🎟"
            label="My Coupons"
            value={`${applicableCoupons} available`}
          />
          <View style={styles.menuSeparator} />
          <MenuItem
            icon="💰"
            label="Instamart Wallet"
            value={`₹${user?.walletBalance ?? 0}`}
          />
        </View>
      </View>

      {/* Orders Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders & Subscriptions</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="📦" label="My Orders" onPress={() => router.push("/(tabs)/orders")} />
          <View style={styles.menuSeparator} />
          <MenuItem icon="🔄" label="Recurring Orders" value="Set up auto-delivery" />
          <View style={styles.menuSeparator} />
          <MenuItem icon="⭐" label="Rate & Review Products" />
        </View>
      </View>

      {/* Offers */}
      <View style={styles.offersCard}>
        <View style={styles.offersLeft}>
          <Text style={styles.offersTitle}>🎉 Exclusive Offers for You!</Text>
          <Text style={styles.offersSubtitle}>{applicableCoupons} coupons waiting to be used</Text>
        </View>
        <Pressable style={styles.offersBtn}>
          <Text style={styles.offersBtnText}>View All</Text>
        </Pressable>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="🎧" label="Customer Support" />
          <View style={styles.menuSeparator} />
          <MenuItem icon="📋" label="FAQs" />
          <View style={styles.menuSeparator} />
          <MenuItem icon="🔒" label="Privacy Policy" />
          <View style={styles.menuSeparator} />
          <MenuItem icon="📄" label="Terms of Service" />
        </View>
      </View>

      {/* Logout */}
      <View style={[styles.section, { marginBottom: 0 }]}>
        <View style={styles.menuCard}>
          <MenuItem icon="🚪" label="Logout" onPress={handleLogout} danger />
        </View>
      </View>

      <Text style={styles.version}>Instamart v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: Colors.primary },
  userName: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  userPhone: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  userEmail: { fontSize: 13, color: Colors.textFaint, marginTop: 1 },
  walletBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  walletIcon: { fontSize: 14 },
  walletText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    marginTop: 1,
    paddingVertical: 16,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: Colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  menuCard: { backgroundColor: Colors.white, borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuItemPressed: { backgroundColor: Colors.background },
  menuIcon: { fontSize: 20, width: 28, textAlign: "center" },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  menuLabelDanger: { color: Colors.error },
  menuValue: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  menuArrow: { fontSize: 20, color: Colors.textFaint },
  menuSeparator: { height: 0.5, backgroundColor: Colors.border, marginLeft: 56 },
  offersCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  offersLeft: { flex: 1 },
  offersTitle: { fontSize: 14, fontWeight: "800", color: "#fff" },
  offersSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  offersBtn: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  offersBtnText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  version: { textAlign: "center", fontSize: 12, color: Colors.textFaint, marginTop: 24, marginBottom: 8 },
});
