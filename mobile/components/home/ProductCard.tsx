import React, { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import type { Product } from "../../types";
import { QuantitySelector } from "./QuantitySelector";

interface ProductCardProps {
  product: Product;
}

const PRESS_SPRING = { damping: 15, stiffness: 300 };
const ADD_PULSE_SPRING = { damping: 12, stiffness: 200 };

export function ProductCard({ product }: ProductCardProps) {
  const cardScale = useSharedValue(1);
  const imageScale = useSharedValue(1);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    cardScale.value = withSpring(0.97, PRESS_SPRING);
  }, [cardScale]);

  const handlePressOut = useCallback(() => {
    cardScale.value = withSpring(1, PRESS_SPRING);
  }, [cardScale]);

  const handleFirstAdd = useCallback(() => {
    imageScale.value = withSpring(1.15, ADD_PULSE_SPRING, () => {
      imageScale.value = withSpring(1.0, ADD_PULSE_SPRING);
    });
  }, [imageScale]);

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const hasDiscount =
    product.discount !== undefined && product.discount > 0;
  const hasOriginalPrice =
    product.originalPrice !== undefined && product.originalPrice > product.price;

  return (
    <Animated.View
      style={[
        cardAnimStyle,
        {
          width: 160,
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
          overflow: "visible",
        },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ borderRadius: 12, overflow: "hidden" }}
      >
        <View style={{ position: "relative" }}>
          <Animated.View style={[imageAnimStyle, { overflow: "hidden", borderTopLeftRadius: 12, borderTopRightRadius: 12 }]}>
            <Image
              source={{ uri: product.image }}
              style={{ width: 160, height: 120 }}
              contentFit="cover"
              transition={200}
            />
          </Animated.View>

          {hasDiscount && (
            <View
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                backgroundColor: "#16A34A",
                borderRadius: 6,
                paddingVertical: 4,
                paddingHorizontal: 6,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {product.discount}% OFF
              </Text>
            </View>
          )}
        </View>

        <View style={{ padding: 10 }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#111827",
              lineHeight: 18,
            }}
          >
            {product.name}
          </Text>

          <Text
            style={{
              fontSize: 11,
              color: "#6B7280",
              marginTop: 2,
            }}
          >
            {product.unit}
          </Text>

          {product.rating !== undefined && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
                gap: 2,
              }}
            >
              <Text style={{ fontSize: 11, color: "#F59E0B" }}>★</Text>
              <Text style={{ fontSize: 11, color: "#111827" }}>
                {product.rating.toFixed(1)}
              </Text>
              {product.reviewCount !== undefined && (
                <Text style={{ fontSize: 11, color: "#6B7280" }}>
                  {" | "}{product.reviewCount}
                </Text>
              )}
            </View>
          )}

          {product.deliveryEta !== undefined && (
            <Text
              style={{
                fontSize: 11,
                color: "#16A34A",
                marginTop: 3,
                fontWeight: "500",
              }}
            >
              🕐 {product.deliveryEta}
            </Text>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 6,
              gap: 6,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              ₹{product.price}
            </Text>
            {hasOriginalPrice && (
              <Text
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  textDecorationLine: "line-through",
                }}
              >
                ₹{product.originalPrice}
              </Text>
            )}
          </View>

          <View style={{ marginTop: 10, alignItems: "flex-start" }}>
            <QuantitySelector product={product} onFirstAdd={handleFirstAdd} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
