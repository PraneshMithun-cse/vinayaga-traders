import React, { useEffect } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCartStore } from "../../store/cartStore";
import { Colors } from "../../constants/colors";

export function FloatingCart() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const totalItems = useCartStore((s) => s.totalItems());
  const total = useCartStore((s) => s.total());
  const items = useCartStore((s) => s.items);

  const translateY = useSharedValue(120);
  const scale = useSharedValue(1);
  const prevCount = React.useRef(0);

  useEffect(() => {
    if (totalItems > 0) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    } else {
      translateY.value = withSpring(120, { damping: 15, stiffness: 200 });
    }
  }, [totalItems, translateY]);

  useEffect(() => {
    if (totalItems > prevCount.current) {
      scale.value = withSequence(
        withTiming(1.08, { duration: 120 }),
        withSpring(1, { damping: 10, stiffness: 300 }),
      );
    }
    prevCount.current = totalItems;
  }, [totalItems, scale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (totalItems === 0) return null;

  const lastItem = items[items.length - 1];

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + 72 },
        containerStyle,
      ]}
    >
      <Pressable
        style={styles.pill}
        onPress={() => router.push("/cart")}
        android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      >
        <View style={styles.left}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItems}</Text>
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {totalItems === 1 ? lastItem?.product.name : `${totalItems} items`}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.total}>₹{total}</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999,
  },
  pill: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  total: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  arrow: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
});
