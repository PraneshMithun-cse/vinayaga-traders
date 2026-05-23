import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { FLASH_DEALS } from "../../constants/mockData";
import type { FlashDeal } from "../../types";
import { QuantitySelector } from "./QuantitySelector";

// ---------------------------------------------------------------------------
// Countdown helpers
// ---------------------------------------------------------------------------
function getRemaining(endsAt: Date): number {
  return Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

// ---------------------------------------------------------------------------
// Countdown — one shared timer for the section header
// ---------------------------------------------------------------------------
function useCountdown(endsAt: Date): string {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt));
  // Keep endsAt in a ref so the interval callback always reads the latest value
  // without being listed as an effect dependency (it's stable from useRef.current).
  const endsAtRef = useRef(endsAt);
  endsAtRef.current = endsAt;

  useEffect(() => {
    const id = setInterval(() => {
      const next = getRemaining(endsAtRef.current);
      setRemaining(next);
      if (next === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return formatCountdown(remaining);
}

// ---------------------------------------------------------------------------
// StockBar
// ---------------------------------------------------------------------------
interface StockBarProps {
  sold: number;
  total: number;
}

function StockBar({ sold, total }: StockBarProps) {
  const ratio = total > 0 ? Math.min(sold / total, 1) : 0;
  const pct = `${Math.round(ratio * 100)}%` as const;

  return (
    <View style={styles.stockBarTrack}>
      <View style={[styles.stockBarFill, { width: pct }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// DealCard
// ---------------------------------------------------------------------------
interface DealCardProps {
  deal: FlashDeal;
}

function DealCard({ deal }: DealCardProps) {
  const { product, dealPrice, stock, sold } = deal;
  const remaining = stock - sold;
  const originalPrice = product.originalPrice ?? product.price;

  return (
    <View style={styles.card}>
      {/* Product image */}
      <View style={styles.cardImageWrapper}>
        <Image
          source={{ uri: product.image }}
          style={styles.cardImage}
          contentFit="cover"
          transition={200}
        />
        {/* FLASH badge */}
        <View style={styles.flashBadge}>
          <Text style={styles.flashBadgeText}>FLASH</Text>
        </View>
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productUnit}>{product.unit}</Text>

        {/* Prices */}
        <View style={styles.priceRow}>
          <Text style={styles.dealPrice}>₹{dealPrice}</Text>
          <Text style={styles.originalPrice}>₹{originalPrice}</Text>
        </View>

        {/* Stock progress */}
        <StockBar sold={sold} total={stock} />

        <Text style={styles.stockLeft}>
          {remaining > 0 ? `${remaining} left` : "Sold out"}
        </Text>

        {/* Quantity selector */}
        <View style={styles.quantityRow}>
          <QuantitySelector product={product} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// FlashDealsSection
// ---------------------------------------------------------------------------
export function FlashDealsSection() {
  // Use the first deal's endsAt for the section-level countdown header
  const sectionEndsAt = useRef(FLASH_DEALS[0]?.endsAt ?? new Date()).current;
  const countdown = useCountdown(sectionEndsAt);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FlashDeal>) => <DealCard deal={item} />,
    [],
  );

  const keyExtractor = useCallback((item: FlashDeal) => item.id, []);

  if (FLASH_DEALS.length === 0) return null;

  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚡ Flash Deals</Text>
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>{countdown}</Text>
        </View>
      </View>

      {/* Horizontal deal list */}
      <FlatList<FlashDeal>
        data={FLASH_DEALS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        decelerationRate="fast"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const CARD_WIDTH = 140;

const styles = StyleSheet.create({
  section: {
    marginVertical: 8,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.2,
  },

  timerPill: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  timerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
    fontVariant: ["tabular-nums"],
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  // Deal card
  card: {
    width: CARD_WIDTH,
    marginRight: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    // Shadow — iOS
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Shadow — Android
    elevation: 3,
  },

  cardImageWrapper: {
    width: CARD_WIDTH,
    height: 100,
    position: "relative",
  },

  cardImage: {
    width: CARD_WIDTH,
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  flashBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#EF4444",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },

  flashBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  // Card body
  cardBody: {
    padding: 8,
    gap: 3,
  },

  productName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 16,
  },

  productUnit: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 1,
  },

  // Prices
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 2,
  },

  dealPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#EF4444",
  },

  originalPrice: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },

  // Stock bar
  stockBarTrack: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },

  stockBarFill: {
    height: 4,
    backgroundColor: "#EF4444",
    borderRadius: 2,
  },

  stockLeft: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },

  // Quantity selector wrapper
  quantityRow: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
});
