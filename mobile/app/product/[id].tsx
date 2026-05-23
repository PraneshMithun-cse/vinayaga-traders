import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useCartStore } from "../../store/cartStore";
import { Colors } from "../../constants/colors";
import { PRODUCTS } from "../../constants/mockData";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const product = PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const cartItem = cartItems.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleAdd = () => {
    btnScale.value = withSpring(0.95, { damping: 10 }, () => {
      btnScale.value = withSpring(1);
    });
    addItem(product);
  };

  const RELATED = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 6);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
          />
          {product.discount ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discount}% OFF</Text>
            </View>
          ) : null}
          {product.isBestseller ? (
            <View style={styles.bestsellerBadge}>
              <Text style={styles.bestsellerText}>🏆 Bestseller</Text>
            </View>
          ) : null}
        </View>

        {/* Product Info */}
        <View style={styles.infoCard}>
          {/* Delivery ETA */}
          <View style={styles.etaRow}>
            <Text style={styles.etaIcon}>⚡</Text>
            <Text style={styles.etaText}>Delivery in {product.deliveryEta}</Text>
          </View>

          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productUnit}>{product.unit}</Text>

          {/* Rating */}
          {product.rating ? (
            <View style={styles.ratingRow}>
              <View style={styles.ratingPill}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingVal}>{product.rating}</Text>
              </View>
              <Text style={styles.reviewCount}>{product.reviewCount?.toLocaleString()} ratings</Text>
            </View>
          ) : null}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.originalPrice ? (
              <>
                <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>Save ₹{product.originalPrice - product.price}</Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Stock & Veg indicator */}
          <View style={styles.tagsRow}>
            {product.isVeg ? (
              <View style={styles.vegTag}>
                <View style={styles.vegDot} />
                <Text style={styles.vegText}>Vegetarian</Text>
              </View>
            ) : null}
            {product.inStock ? (
              <View style={styles.stockTag}>
                <Text style={styles.stockText}>✓ In Stock</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.description}>
            Fresh {product.name.toLowerCase()} sourced directly from farms. Delivered within minutes
            to maintain freshness and quality. Rich in essential nutrients and minerals.
            Our products go through strict quality checks before delivery.
          </Text>
        </View>

        {/* Nutritional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Highlights</Text>
          <View style={styles.highlightsGrid}>
            {[
              { icon: "🌿", label: "100% Natural" },
              { icon: "🧊", label: "Fresh Daily" },
              { icon: "🚚", label: "Express Delivery" },
              { icon: "✅", label: "Quality Assured" },
            ].map((h) => (
              <View key={h.label} style={styles.highlight}>
                <Text style={styles.highlightIcon}>{h.icon}</Text>
                <Text style={styles.highlightLabel}>{h.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Related Products */}
        {RELATED.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
              {RELATED.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.relatedCard}
                  onPress={() => router.push(`/product/${p.id}`)}
                >
                  <Image source={{ uri: p.image }} style={styles.relatedImage} contentFit="cover" />
                  <Text style={styles.relatedName} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.relatedPrice}>₹{p.price}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Add to Cart Bar */}
      <View style={[styles.addToCart, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>
            {quantity > 0 ? `${quantity} in cart` : "Add to Cart"}
          </Text>
          {quantity > 0 && (
            <Text style={styles.cartTotal}>₹{product.price * quantity} total</Text>
          )}
        </View>

        {quantity === 0 ? (
          <Animated.View style={btnStyle}>
            <Pressable style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.qtyControl}>
            <Pressable style={styles.qtyBtn} onPress={() => removeItem(product.id)}>
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qtyCount}>{quantity}</Text>
            <Pressable style={styles.qtyBtn} onPress={() => addItem(product)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  imageContainer: { width, height: 280, position: "relative", backgroundColor: Colors.white },
  productImage: { width: "100%", height: "100%" },
  discountBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discountText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  bestsellerBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: Colors.warning,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bestsellerText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  infoCard: { backgroundColor: Colors.white, padding: 16, marginBottom: 8 },
  etaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  etaIcon: { fontSize: 14 },
  etaText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  productName: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary, marginBottom: 4 },
  productUnit: { fontSize: 14, color: Colors.textMuted, marginBottom: 12 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingStar: { fontSize: 11, color: "#fff" },
  ratingVal: { fontSize: 12, fontWeight: "800", color: "#fff" },
  reviewCount: { fontSize: 13, color: Colors.textMuted },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  price: { fontSize: 24, fontWeight: "900", color: Colors.textPrimary },
  originalPrice: { fontSize: 16, color: Colors.textFaint, textDecorationLine: "line-through" },
  savingsBadge: { backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  savingsText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  tagsRow: { flexDirection: "row", gap: 8 },
  vegTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0FDF4", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary },
  vegDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, borderWidth: 1, borderColor: Colors.primaryDark },
  vegText: { fontSize: 11, fontWeight: "600", color: Colors.primary },
  stockTag: { backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  stockText: { fontSize: 11, fontWeight: "600", color: Colors.primary },
  section: { backgroundColor: Colors.white, margin: 8, marginTop: 0, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 12 },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  highlightsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  highlight: { width: "45%", flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.background, borderRadius: 10, padding: 10 },
  highlightIcon: { fontSize: 20 },
  highlightLabel: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  relatedScroll: { marginHorizontal: -16, paddingLeft: 16 },
  relatedCard: { width: 120, marginRight: 12, backgroundColor: Colors.background, borderRadius: 10, overflow: "hidden" },
  relatedImage: { width: 120, height: 90 },
  relatedName: { fontSize: 12, fontWeight: "600", color: Colors.textPrimary, padding: 8, paddingBottom: 2 },
  relatedPrice: { fontSize: 13, fontWeight: "800", color: Colors.primary, paddingHorizontal: 8, paddingBottom: 8 },
  addToCart: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  totalInfo: {},
  totalLabel: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  cartTotal: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  addBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  qtyBtnText: { fontSize: 20, fontWeight: "700", color: "#fff", lineHeight: 24 },
  qtyCount: { fontSize: 18, fontWeight: "900", color: Colors.primary, minWidth: 24, textAlign: "center" },
});
