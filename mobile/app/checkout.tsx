import React, { useState } from "react";
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
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { Colors } from "../constants/colors";

type PaymentMethod = "UPI" | "Card" | "COD" | "Wallet";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { id: "UPI", label: "UPI", icon: "📱", desc: "GPay, PhonePe, Paytm" },
  { id: "Card", label: "Credit/Debit Card", icon: "💳", desc: "Visa, Mastercard, Rupay" },
  { id: "Wallet", label: "Instamart Wallet", icon: "💰", desc: "₹250 available" },
  { id: "COD", label: "Cash on Delivery", icon: "💵", desc: "Pay when delivered" },
];

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [loading, setLoading] = useState(false);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount());
  const deliveryFee = useCartStore((s) => s.deliveryFee());
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);

  const user = useAuthStore((s) => s.user);
  const activeAddress = useAuthStore((s) => s.activeAddress);

  const handlePlaceOrder = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    clearCart();
    router.replace("/order-tracking");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
          {activeAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressLabel}>
                  <Text style={styles.addressLabelText}>{activeAddress.label}</Text>
                </View>
                <Pressable>
                  <Text style={styles.changeText}>Change</Text>
                </Pressable>
              </View>
              <Text style={styles.addressLine1}>{activeAddress.line1}</Text>
              {activeAddress.line2 ? (
                <Text style={styles.addressLine2}>{activeAddress.line2}</Text>
              ) : null}
              <Text style={styles.addressCity}>{activeAddress.city} - {activeAddress.pincode}</Text>
            </View>
          ) : null}
        </View>

        {/* Delivery Slot */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Delivery in 10 minutes</Text>
          <View style={styles.slotCard}>
            <Text style={styles.slotEmoji}>🛵</Text>
            <View style={styles.slotInfo}>
              <Text style={styles.slotTitle}>Express Delivery</Text>
              <Text style={styles.slotDesc}>Estimated delivery by 10:42 AM</Text>
            </View>
            <View style={styles.slotBadge}>
              <Text style={styles.slotBadgeText}>Selected</Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Order Summary ({items.length} items)</Text>
          <View style={styles.summaryCard}>
            {items.slice(0, 3).map((item) => (
              <View key={item.product.id} style={styles.summaryRow}>
                <Text style={styles.summaryName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.summaryQty}>×{item.quantity}</Text>
                <Text style={styles.summaryPrice}>₹{item.product.price * item.quantity}</Text>
              </View>
            ))}
            {items.length > 3 && (
              <Text style={styles.moreItems}>+{items.length - 3} more items</Text>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item Total</Text>
              <Text style={styles.summaryValue}>₹{subtotal}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coupon Discount</Text>
                <Text style={[styles.summaryValue, styles.savings]}>−₹{discount}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={[styles.summaryValue, deliveryFee === 0 && styles.savings]}>
                {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
              </Text>
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>₹{total}</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Method</Text>
          <View style={styles.paymentCard}>
            {PAYMENT_METHODS.map((method) => (
              <Pressable
                key={method.id}
                style={[styles.paymentOption, paymentMethod === method.id && styles.paymentOptionSelected]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>{method.label}</Text>
                  <Text style={styles.paymentDesc}>{method.desc}</Text>
                </View>
                <View style={[styles.radio, paymentMethod === method.id && styles.radioSelected]}>
                  {paymentMethod === method.id && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Safety Note */}
        <View style={styles.safetyNote}>
          <Text style={styles.safetyIcon}>🔒</Text>
          <Text style={styles.safetyText}>100% secure payment. Your data is protected.</Text>
        </View>
      </ScrollView>

      {/* Place Order Bar */}
      <View style={[styles.placeOrderBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.placeOrderInfo}>
          <Text style={styles.placeOrderTotal}>₹{total}</Text>
          <Text style={styles.placeOrderMethod}>{paymentMethod}</Text>
        </View>
        <Pressable
          style={[styles.placeOrderBtn, loading && styles.placeOrderBtnLoading]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.placeOrderBtnText}>
            {loading ? "Placing Order..." : "Place Order →"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  section: { margin: 16, marginBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 10 },
  addressCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14 },
  addressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  addressLabel: { backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  addressLabelText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  changeText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  addressLine1: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  addressLine2: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  addressCity: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  slotCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  slotEmoji: { fontSize: 28 },
  slotInfo: { flex: 1 },
  slotTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  slotDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  slotBadge: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  slotBadgeText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  summaryCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 10 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryName: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  summaryQty: { fontSize: 13, color: Colors.textMuted, marginHorizontal: 8 },
  summaryPrice: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  moreItems: { fontSize: 12, color: Colors.textMuted, fontStyle: "italic" },
  summaryDivider: { height: 0.5, backgroundColor: Colors.border },
  summaryLabel: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  savings: { color: Colors.primary },
  summaryTotalRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  summaryTotalLabel: { flex: 1, fontSize: 16, fontWeight: "800", color: Colors.textPrimary },
  summaryTotalValue: { fontSize: 17, fontWeight: "900", color: Colors.textPrimary },
  paymentCard: { backgroundColor: Colors.white, borderRadius: 14, overflow: "hidden" },
  paymentOption: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  paymentOptionSelected: { backgroundColor: Colors.primaryLight },
  paymentIcon: { fontSize: 22, width: 32, textAlign: "center" },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  paymentDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  safetyNote: { flexDirection: "row", alignItems: "center", gap: 8, margin: 16, marginBottom: 0 },
  safetyIcon: { fontSize: 16 },
  safetyText: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  placeOrderBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 16,
  },
  placeOrderInfo: {},
  placeOrderTotal: { fontSize: 20, fontWeight: "900", color: Colors.textPrimary },
  placeOrderMethod: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  placeOrderBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  placeOrderBtnLoading: { opacity: 0.7 },
  placeOrderBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
