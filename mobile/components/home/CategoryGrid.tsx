import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View, type ListRenderItemInfo } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { CATEGORIES } from "../../constants/mockData";
import type { Category } from "../../types";

// Each column item contains up to 2 categories stacked vertically
type CategoryColumn = [Category] | [Category, Category];

function chunkIntoPairs(items: Category[]): CategoryColumn[] {
  const columns: CategoryColumn[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const top = items[i];
    const bottom = items[i + 1];
    if (top !== undefined && bottom !== undefined) {
      columns.push([top, bottom]);
    } else if (top !== undefined) {
      columns.push([top]);
    }
  }
  return columns;
}

const COLUMNS = chunkIntoPairs(CATEGORIES);

interface CategoryCellProps {
  category: Category;
  isActive: boolean;
  onPress: (id: string) => void;
}

function CategoryCell({ category, isActive, onPress }: CategoryCellProps) {
  const scale = useSharedValue(1);

  // Animate whenever isActive changes (parent re-renders with new activeId)
  useEffect(() => {
    scale.value = withTiming(isActive ? 1.05 : 1, { duration: 150 });
  }, [isActive, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    onPress(category.id);
  }, [category.id, onPress]);

  return (
    <Pressable onPress={handlePress} style={{ width: 80, alignItems: "center", marginBottom: 12 }}>
      <Animated.View style={animStyle}>
        {/* Circle image container */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: category.color ?? "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
            // Active ring
            borderWidth: isActive ? 2 : 0,
            borderColor: "#16A34A",
          }}
        >
          <Image
            source={{ uri: category.image }}
            style={{ width: 50, height: 50 }}
            contentFit="contain"
            transition={200}
          />
        </View>

        <Text
          numberOfLines={2}
          style={{
            fontSize: 10,
            fontWeight: "600",
            color: "#374151",
            textAlign: "center",
            marginTop: 6,
            width: 80,
          }}
        >
          {category.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

interface ColumnItemProps {
  column: CategoryColumn;
  activeId: string | null;
  onPress: (id: string) => void;
}

function ColumnItem({ column, activeId, onPress }: ColumnItemProps) {
  return (
    <View style={{ flexDirection: "column" }}>
      {column.map((cat) => (
        <CategoryCell
          key={cat.id}
          category={cat}
          isActive={activeId === cat.id}
          onPress={onPress}
        />
      ))}
    </View>
  );
}

export function CategoryGrid() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handlePress = useCallback((id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CategoryColumn>) => (
      <ColumnItem column={item} activeId={activeId} onPress={handlePress} />
    ),
    [activeId, handlePress],
  );

  const keyExtractor = useCallback(
    (item: CategoryColumn) => item.map((c) => c.id).join("-"),
    [],
  );

  return (
    <View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: "#111827",
          marginBottom: 12,
        }}
      >
        Shop by Category
      </Text>

      <FlatList<CategoryColumn>
        data={COLUMNS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        contentContainerStyle={{ paddingRight: 16 }}
      />
    </View>
  );
}
