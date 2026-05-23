import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useCartStore } from "../store/cartStore";
import { Colors } from "../constants/colors";
import { COUPONS } from "../constants/mockData";
import type { CartItem, Coupon } from "../types";

function CartItemRow({ item }: { item: CartItem }) {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <View style={styles.itemRow}>
      <Image
        source={{ uri: item.product.image }}
        style={styles.itemImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
        <Text style={styles.itemUnit}>{item.product.unit}</Text>
        <View style={styles.itemPriceRow}>
          <Text style={styles.itemPrice}>₹{item.product.price}</Text>
          {item.product.originalPrice ? (
            <Text style={styles.itemOriginal}>₹{item.product.originalPrice}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.qtyControl}>
        <Pressable style={styles.qtyBtn} onPress={() => removeItem(item.product.id)}>
          <Text style={styles.qtyBtnText}>−</Text>
        </Pressable>
        <Text style={styles.qtyCount}>{item.quantity}</Text>
        <Pressable style={styles.qtyBtn} onPress={() => addItem(item.product)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CouponCard({ coupon, applied, onApply, onRemove }: {
  coupon: Coupon;
  applied: boolean;
  onApply: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.couponCard, applied && styles.couponApplied]}>
      <View style={styles.couponLeft}>
        <Text style={styles.couponIcon}>🎟</Text>
        <View>
          <Text style={styles.couponCode}>{coupon.code}</Text>
          <Text style={styles.couponTitle}>{coupon.title}</Text>
          <Text style={styles.couponDesc}>{coupon.description}</Text>
        </View>
      </View>
      <Pressable
        style={[styles.couponBtn, applied && styles.couponBtnApplied]}
        onPress={applied ? onRemove : onApply}
      >
        <Text style={[styles.couponBtnText, applied && styles.couponBtnTextApplied]}>
          {applied ? "Remove" : "Apply"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount());
  const deliveryFee = useCartStore((s) => s.deliveryFee());
  const total = useCartStore((s) => s.total());
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const clearCart = useCartStore((s) => s.clearCart);

  const isCartEmpty = items.length === 0;

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      {isCartEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items from home to get started</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.product.id}
          renderItem={({ item }) => <CartItemRow item={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={() => (
            <View>
              {/* Delivery ETA banner */}
              <View style={styles.etaBanner}>
                <Text style={styles.etaEmoji}>⚡</Text>
                <View>
                  <Text style={styles.etaTitle}>Delivery in 10 minutes</Text>
                  <Text style={styles.etaSubtitle}>Shipment of {items.length} item{items.length !== 1 ? "s" : ""}</Text>
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={() => (
            <View>
              {/* Coupons */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Offers & Coupons</Text>
              </View>
              <View style={styles.couponsContainer}>
                {COUPONS.map((c) => (
                  <CouponCard
                    key={c.id}
                    coupon={c}
                    applied={appliedCoupon?.id === c.id}
                    onApply={() => {
                      if (subtotal >= c.minOrder) {
                        applyCoupon(c);
                      } else {
                        Alert.alert(
                          "Cannot apply coupon",
                          `Minimum order amount ₹${c.minOrder} required`,
                        );
                      }
                    }}
                    onRemove={removeCoupon}
                  />
                ))}
              </View>

              {/* Bill Details */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bill Details</Text>
              </View>
              <View style={styles.billCard}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Item Total</Text>
                  <Text style={styles.billValue}>₹{subtotal}</Text>
                </View>
                {discount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Coupon Discount</Text>
                    <Text style={[styles.billValue, styles.billSavings]}>−₹{discount}</Text>
                  </View>
                )}
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  {deliveryFee === 0 ? (
                    <View style={styles.freeRow}>
                      <Text style={[styles.billValue, styles.billSavings]}>FREE</Text>
                    </View>
                  ) : (
                    <Text style={styles.billValue}>₹{deliveryFee}</Text>
                  )}
                </View>
                <View style={styles.billDivider} />
                <View style={styles.billRow}>
                  <Text style={styles.billTotalLabel}>To Pay</Text>
                  <Text style={styles.billTotalValue}>₹{total}</Text>
                </View>
                {(discount > 0 || deliveryFee === 0) && (
                  <View style={styles.savingsBanner}>
                    <Text style={styles.savingsText}>
                      🎉 You saved ₹{discount + (subtotal >= 299 && subtotal > 0 ? 29 : 0)} on this order!
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ height: insets.bottom + 100 }} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Checkout Bar */}
      {!isCartEmpty && (
        <View style={[styles.checkoutBar, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.checkoutInfo}>
            <Text style={styles.checkoutTotal}>₹{total}</Text>
            <Text style={styles.checkoutSaving}>
              {discount > 0 ? `Saving ₹${discount}` : ""}
            </Text>
          </View>
          <Pressable
            style={styles.checkoutBtn}
            onPress={() => router.push("/checkout")}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Checkout →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 8 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: "center" },
  emptyBtn: { marginTop: 24, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  emptyBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  etaBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 8,
  },
  etaEmoji: { fontSize: 28 },
  etaTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary },
  etaSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 16,
    gap: 12,
  },
  itemImage: { width: 64, height: 64, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  itemUnit: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  itemPriceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  itemPrice: { fontSize: 15, fontWeight: "800", color: Colors.textPrimary },
  itemOriginal: { fontSize: 12, color: Colors.textFaint, textDecorationLine: "line-through" },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 18, fontWeight: "700", color: Colors.primary, lineHeight: 22 },
  qtyCount: { fontSize: 16, fontWeight: "800", color: Colors.primary, minWidth: 20, textAlign: "center" },
  separator: { height: 0.5, backgroundColor: Colors.border },
  sectionHeader: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 12 },
  couponsContainer: { gap: 10, paddingHorizontal: 16 },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  couponApplied: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  couponLeft: { flex: 1, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  couponIcon: { fontSize: 22 },
  couponCode: { fontSize: 13, fontWeight: "800", color: Colors.textPrimary },
  couponTitle: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary, marginTop: 1 },
  couponDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  couponBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  couponBtnApplied: { backgroundColor: Colors.error + "18" },
  couponBtnText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  couponBtnTextApplied: { color: Colors.error },
  billCard: { backgroundColor: Colors.white, marginHorizontal: 16, borderRadius: 12, padding: 16, gap: 12 },
  billRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  billLabel: { fontSize: 14, color: Colors.textSecondary },
  billValue: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  billSavings: { color: Colors.primary },
  freeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  billDivider: { height: 0.5, backgroundColor: Colors.border },
  billTotalLabel: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary },
  billTotalValue: { fontSize: 17, fontWeight: "800", color: Colors.textPrimary },
  savingsBanner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  savingsText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  checkoutBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    padding: 16,
    gap: 16,
  },
  checkoutInfo: { flex: 1 },
  checkoutTotal: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  checkoutSaving: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  checkoutBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
