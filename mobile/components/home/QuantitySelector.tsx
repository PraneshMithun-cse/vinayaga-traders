import React, { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Product } from "../../types";
import { useCartStore } from "../../store/cartStore";

interface QuantitySelectorProps {
  product: Product;
  onFirstAdd?: () => void;
}

const SPRING_CONFIG = { damping: 12, stiffness: 200 };

export function QuantitySelector({ product, onFirstAdd }: QuantitySelectorProps) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const cartItem = items.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  const addScale = useSharedValue(1);
  const rowScale = useSharedValue(quantity > 0 ? 1 : 0);

  const addAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addScale.value }],
  }));

  const rowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rowScale.value }],
    opacity: rowScale.value,
  }));

  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isFirst = quantity === 0;
    addItem(product);

    if (isFirst) {
      rowScale.value = withSpring(1, SPRING_CONFIG);
      onFirstAdd?.();
    } else {
      addScale.value = withSpring(1.15, SPRING_CONFIG, () => {
        addScale.value = withSpring(1, SPRING_CONFIG);
      });
    }
  }, [quantity, product, addItem, rowScale, addScale, onFirstAdd]);

  const handleRemove = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (quantity === 1) {
      rowScale.value = withSpring(0, SPRING_CONFIG);
      setTimeout(() => removeItem(product.id), 150);
    } else {
      removeItem(product.id);
    }
  }, [quantity, product.id, removeItem, rowScale]);

  if (quantity === 0) {
    return (
      <Pressable
        onPress={handleAdd}
        style={{
          width: 72,
          height: 32,
          borderRadius: 8,
          backgroundColor: "#16A34A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 18,
            fontWeight: "700",
            lineHeight: 22,
          }}
        >
          +
        </Text>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[rowAnimStyle, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
      <Pressable
        onPress={handleRemove}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: "#16A34A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#16A34A",
            fontSize: 18,
            fontWeight: "700",
            lineHeight: 22,
          }}
        >
          −
        </Text>
      </Pressable>

      <View style={{ width: 28, alignItems: "center" }}>
        <Text
          style={{
            color: "#16A34A",
            fontSize: 14,
            fontWeight: "700",
          }}
        >
          {quantity}
        </Text>
      </View>

      <Animated.View style={addAnimStyle}>
        <Pressable
          onPress={handleAdd}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: "#16A34A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#16A34A",
              fontSize: 18,
              fontWeight: "700",
              lineHeight: 22,
            }}
          >
            +
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
