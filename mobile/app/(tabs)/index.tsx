import React, { useCallback } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { PRODUCT_SECTIONS } from "../../constants/mockData";
import { Colors } from "../../constants/colors";
import { DeliveryHeader } from "../../components/home/DeliveryHeader";
import { SearchBar } from "../../components/home/SearchBar";
import { BannerCarousel } from "../../components/home/BannerCarousel";
import { CategoryGrid } from "../../components/home/CategoryGrid";
import { FlashDealsSection } from "../../components/home/FlashDealsSection";
import { ProductCard } from "../../components/home/ProductCard";
import { SectionHeader } from "../../components/home/SectionHeader";
import type { Product } from "../../types";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeAddress = useAuthStore((s) => s.activeAddress);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const addressText = activeAddress
    ? `${activeAddress.line1}, ${activeAddress.city}`
    : "Select delivery location";

  return (
    <View style={styles.container}>
      <DeliveryHeader
        address={addressText}
        onAddressPress={() => {}}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.searchContainer}>
          <SearchBar onPress={() => router.push("/(tabs)/search")} editable={false} />
        </View>

        <View style={styles.section}>
          <BannerCarousel />
        </View>

        <View style={styles.section}>
          <CategoryGrid />
        </View>

        <View style={styles.section}>
          <FlashDealsSection />
        </View>

        {PRODUCT_SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <SectionHeader
              title={section.title}
              subtitle={section.subtitle}
              onViewAll={() => {}}
            />
            <FlatList
              data={section.products}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item: Product) => item.id}
              contentContainerStyle={styles.productList}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }: { item: Product }) => <ProductCard product={item} />}
            />
          </View>
        ))}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 4 },
  section: { marginTop: 16 },
  productList: { paddingHorizontal: 16, paddingVertical: 4 },
});
