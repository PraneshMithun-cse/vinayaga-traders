import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors } from "../../constants/colors";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 6, style }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 700, easing: Easing.ease }),
        withTiming(1, { duration: 700, easing: Easing.ease }),
      ),
      -1,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: Colors.skeletonBase },
        animStyle,
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={120} borderRadius={0} style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
      <View style={styles.body}>
        <Skeleton height={13} width="90%" />
        <View style={{ height: 6 }} />
        <Skeleton height={11} width="50%" />
        <View style={{ height: 10 }} />
        <Skeleton height={15} width="40%" />
        <View style={{ height: 8 }} />
        <Skeleton height={32} borderRadius={8} />
      </View>
    </View>
  );
}

export function BannerSkeleton() {
  return <Skeleton height={160} borderRadius={16} style={{ marginHorizontal: 16 }} />;
}

export function CategorySkeleton() {
  return (
    <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={{ alignItems: "center", gap: 6 }}>
          <Skeleton width={72} height={72} borderRadius={36} />
          <Skeleton width={60} height={10} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  body: {
    padding: 10,
  },
});
