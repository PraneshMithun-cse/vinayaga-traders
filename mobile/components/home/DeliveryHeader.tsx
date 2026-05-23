import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface DeliveryHeaderProps {
  address: string;
  onAddressPress: () => void;
}

export function DeliveryHeader({ address, onAddressPress }: DeliveryHeaderProps) {
  const insets = useSafeAreaInsets();
  const dotScale = useSharedValue(1);

  useEffect(() => {
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 800 }),
        withTiming(1.0, { duration: 800 }),
      ),
      -1,
    );
  }, [dotScale]);

  const dotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Left: location info */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{
            fontSize: 11,
            color: "#6B7280",
            fontWeight: "500",
          }}
        >
          Delivery in
        </Text>

        {/* ETA row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#111827",
            }}
          >
            ⚡ 10 minutes
          </Text>
          <Animated.View
            style={[
              {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#16A34A",
              },
              dotAnimStyle,
            ]}
          />
        </View>

        {/* Address row */}
        <Pressable
          onPress={onAddressPress}
          style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              color: "#374151",
              flex: 1,
              flexShrink: 1,
            }}
          >
            {address}
          </Text>
          <Text style={{ fontSize: 10, color: "#16A34A" }}>▼</Text>
        </Pressable>
      </View>

      {/* Right: ETA badge + avatar */}
      <View style={{ alignItems: "center", gap: 6 }}>
        {/* Instamart badge */}
        <View
          style={{
            backgroundColor: "#16A34A",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            Instamart
          </Text>
        </View>

        {/* User avatar */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "#DCFCE7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 16 }}>👤</Text>
        </View>
      </View>
    </View>
  );
}
