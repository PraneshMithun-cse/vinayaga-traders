import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { PRODUCTS, CATEGORIES } from "../../constants/mockData";
import type { Product, Category } from "../../types";

const RECENT_SEARCHES = ["tomatoes", "amul butter", "atta 5kg", "coca cola", "maggi"];

const POPULAR_SEARCHES = [
  "Fresh Fruits", "Dairy", "Snacks", "Cold Drinks",
  "Bread", "Eggs", "Paneer", "Rice", "Dal",
];

function SearchResultItem({ product }: { product: Product }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.resultItem}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <Image
        source={{ uri: product.image }}
        style={styles.resultImage}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.resultUnit}>{product.unit}</Text>
        <View style={styles.resultPriceRow}>
          <Text style={styles.resultPrice}>₹{product.price}</Text>
          {product.originalPrice ? (
            <Text style={styles.resultOriginal}>₹{product.originalPrice}</Text>
          ) : null}
          {product.discount ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discount}% off</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.resultEta}>
        <Text style={styles.etaText}>⚡ {product.deliveryEta}</Text>
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filtered = query.trim()
    ? PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const showResults = query.trim().length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search for atta, dal, coke..."
            placeholderTextColor={Colors.textFaint}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {!showResults ? (
        <FlatList
          data={[]}
          ListHeaderComponent={() => (
            <View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                {RECENT_SEARCHES.map((term) => (
                  <Pressable
                    key={term}
                    style={styles.recentItem}
                    onPress={() => setQuery(term)}
                  >
                    <Text style={styles.clockIcon}>🕐</Text>
                    <Text style={styles.recentText}>{term}</Text>
                    <Text style={styles.arrowRight}>↗</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Searches</Text>
                <View style={styles.tagCloud}>
                  {POPULAR_SEARCHES.map((tag) => (
                    <Pressable
                      key={tag}
                      style={styles.tag}
                      onPress={() => setQuery(tag)}
                    >
                      <Text style={styles.tagText}>{tag}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Browse Categories</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.slice(0, 6).map((cat) => (
                    <Pressable key={cat.id} style={styles.categoryItem}>
                      <Image
                        source={{ uri: cat.image }}
                        style={styles.categoryImage}
                        contentFit="cover"
                      />
                      <Text style={styles.categoryName} numberOfLines={2}>
                        {cat.name.replace("\n", " ")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}
          renderItem={() => <View />}
          keyExtractor={(item, index) => index.toString()}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SearchResultItem product={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No results for "{query}"</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search term
              </Text>
            </View>
          )}
          ListHeaderComponent={() => (
            filtered.length > 0 ? (
              <Text style={styles.resultCount}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
              </Text>
            ) : null
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: Colors.textPrimary },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  searchBarFocused: { borderColor: Colors.primary, backgroundColor: Colors.white },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 14, color: Colors.textPrimary, padding: 0 },
  clearIcon: { fontSize: 13, color: Colors.textMuted },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  clockIcon: { fontSize: 15 },
  recentText: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  arrowRight: { fontSize: 14, color: Colors.textFaint },
  tagCloud: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryItem: { width: "30%", alignItems: "center", gap: 6 },
  categoryImage: { width: 72, height: 72, borderRadius: 36 },
  categoryName: { fontSize: 11, color: Colors.textSecondary, textAlign: "center" },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  resultImage: { width: 60, height: 60, borderRadius: 8 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  resultUnit: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  resultPriceRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  resultPrice: { fontSize: 15, fontWeight: "800", color: Colors.textPrimary },
  resultOriginal: { fontSize: 12, color: Colors.textFaint, textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: Colors.primaryLight, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontSize: 10, fontWeight: "700", color: Colors.primary },
  resultEta: { alignItems: "flex-end" },
  etaText: { fontSize: 11, color: Colors.primary, fontWeight: "600" },
  separator: { height: 0.5, backgroundColor: Colors.border, marginLeft: 88 },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: "center" },
  resultCount: { fontSize: 13, color: Colors.textMuted, padding: 16, paddingBottom: 8 },
});
