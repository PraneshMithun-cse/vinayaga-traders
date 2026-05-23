import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import type { OrderStatus } from "../../types";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  placed: { label: "Order Placed", color: "#F59E0B", bg: "#FFFBEB", icon: "📋" },
  confirmed: { label: "Confirmed", color: "#3B82F6", bg: "#EFF6FF", icon: "✅" },
  picking: { label: "Picking Items", color: "#8B5CF6", bg: "#F5F3FF", icon: "🧺" },
  packed: { label: "Packed", color: "#06B6D4", bg: "#ECFEFF", icon: "📦" },
  out_for_delivery: { label: "On the way", color: "#16A34A", bg: "#DCFCE7", icon: "🛵" },
  delivered: { label: "Delivered", color: "#16A34A", bg: "#DCFCE7", icon: "🎉" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2", icon: "✕" },
};

const MOCK_ORDERS = [
  {
    id: "ORD-001",
    status: "out_for_delivery" as OrderStatus,
    total: 284,
    itemCount: 5,
    placedAt: new Date(Date.now() - 15 * 60 * 1000),
    deliveryEta: "3 mins",
    items: ["Organic Spinach", "Amul Butter", "Bananas"],
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80",
  },
  {
    id: "ORD-002",
    status: "delivered" as OrderStatus,
    total: 512,
    itemCount: 8,
    placedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    items: ["Aashirvaad Atta 5kg", "Maggi Noodles", "Tata Tea"],
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=200&q=80",
  },
  {
    id: "ORD-003",
    status: "delivered" as OrderStatus,
    total: 199,
    itemCount: 3,
    placedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    items: ["Roma Tomatoes", "Green Capsicum", "Coca-Cola"],
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80",
  },
];

function OrderCard({ order }: { order: typeof MOCK_ORDERS[0] }) {
  const router = useRouter();
  const config = STATUS_CONFIG[order.status];
  const isActive = !["delivered", "cancelled"].includes(order.status);
  const timeAgo = getTimeAgo(order.placedAt);

  return (
    <Pressable
      style={styles.orderCard}
      onPress={() => isActive && router.push("/order-tracking")}
    >
      <View style={styles.orderHeader}>
        <Image source={{ uri: order.image }} style={styles.orderThumb} contentFit="cover" />
        <View style={styles.orderInfo}>
          <View style={styles.orderTopRow}>
            <Text style={styles.orderId}>{order.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Text style={styles.statusIcon}>{config.icon}</Text>
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <Text style={styles.orderItems} numberOfLines={1}>
            {order.items.join(" • ")}
          </Text>
          <View style={styles.orderMeta}>
            <Text style={styles.orderTotal}>₹{order.total}</Text>
            <Text style={styles.orderDot}>·</Text>
            <Text style={styles.orderCount}>{order.itemCount} items</Text>
            <Text style={styles.orderDot}>·</Text>
            <Text style={styles.orderTime}>{timeAgo}</Text>
          </View>
        </View>
      </View>

      {isActive && (
        <View style={styles.activeBar}>
          <View style={styles.etaRow}>
            <Text style={styles.etaLabel}>⚡ Arriving in</Text>
            <Text style={styles.etaValue}>{order.deliveryEta}</Text>
          </View>
          <Pressable style={styles.trackBtn} onPress={() => router.push("/order-tracking")}>
            <Text style={styles.trackBtnText}>Track Order</Text>
          </Pressable>
        </View>
      )}

      {!isActive && order.status === "delivered" && (
        <View style={styles.reorderRow}>
          <Pressable style={styles.reorderBtn}>
            <Text style={styles.reorderText}>Reorder</Text>
          </Pressable>
          <Pressable>
            <Text style={styles.rateText}>Rate Order ★</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"active" | "past">("active");

  const activeOrders = MOCK_ORDERS.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const pastOrders = MOCK_ORDERS.filter((o) => ["delivered", "cancelled"].includes(o.status));
  const displayOrders = tab === "active" ? activeOrders : pastOrders;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <View style={styles.tabs}>
        {(["active", "past"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "active" ? `Active (${activeOrders.length})` : "Past Orders"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={displayOrders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No {tab} orders</Text>
            <Text style={styles.emptySubtitle}>
              {tab === "active"
                ? "Place an order to see it here"
                : "Your past orders will appear here"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white },
  title: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  tabs: { flexDirection: "row", backgroundColor: Colors.white, paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  tabActive: { backgroundColor: Colors.primaryLight },
  tabText: { fontSize: 14, fontWeight: "600", color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  list: { padding: 16 },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  orderHeader: { flexDirection: "row", padding: 14, gap: 12 },
  orderThumb: { width: 56, height: 56, borderRadius: 10 },
  orderInfo: { flex: 1 },
  orderTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  orderId: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusIcon: { fontSize: 11 },
  statusText: { fontSize: 11, fontWeight: "700" },
  orderItems: { fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderTotal: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  orderDot: { color: Colors.textFaint, fontSize: 12 },
  orderCount: { fontSize: 12, color: Colors.textMuted },
  orderTime: { fontSize: 12, color: Colors.textMuted },
  activeBar: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  etaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  etaLabel: { fontSize: 12, color: Colors.textSecondary },
  etaValue: { fontSize: 13, fontWeight: "800", color: Colors.primary },
  trackBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  trackBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  reorderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  reorderBtn: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  reorderText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  rateText: { fontSize: 13, fontWeight: "600", color: Colors.warning },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: "center", paddingHorizontal: 32 },
});
