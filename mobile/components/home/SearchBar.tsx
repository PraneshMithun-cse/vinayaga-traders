import React, { useCallback, useRef } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface SearchBarProps {
  onPress?: () => void;
  editable?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

export function SearchBar({
  onPress,
  editable = true,
  value,
  onChangeText,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);

  // 0 = unfocused, 1 = focused — drives all animations inside the worklet
  const focusAnim = useSharedValue(0);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderWidth: withTiming(focusAnim.value === 1 ? 1.5 : 0, { duration: 200 }),
    borderColor: "#16A34A",
    backgroundColor: withTiming(
      focusAnim.value === 1 ? "#FFFFFF" : "#F3F4F6",
      { duration: 200 },
    ),
  }));

  const handleFocus = useCallback(() => {
    focusAnim.value = withTiming(1, { duration: 200 });
  }, [focusAnim]);

  const handleBlur = useCallback(() => {
    focusAnim.value = withTiming(0, { duration: 200 });
  }, [focusAnim]);

  // Non-editable mode: tap-to-navigate overlay (e.g. on home screen)
  if (!editable) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <SearchIcon />
          {/* Use a View-wrapped disabled TextInput so it looks right but doesn't steal touches */}
          <View style={{ flex: 1 }} pointerEvents="none">
            <TextInput
              editable={false}
              placeholder="Search for atta, dal, coke..."
              placeholderTextColor="#9CA3AF"
              value={value}
              style={{
                flex: 1,
                fontSize: 14,
                color: "#111827",
              }}
            />
          </View>
          <MicIcon />
        </View>
      </Pressable>
    );
  }

  return (
    <Animated.View
      style={[
        {
          borderRadius: 12,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
        },
        animatedContainerStyle,
      ]}
    >
      <SearchIcon />
      <TextInput
        ref={inputRef}
        placeholder="Search for atta, dal, coke..."
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        style={{
          flex: 1,
          fontSize: 14,
          color: "#111827",
          paddingVertical: 0,
        }}
      />
      <MicIcon />
    </Animated.View>
  );
}

function SearchIcon() {
  return (
    <Animated.Text
      style={{
        color: "#9CA3AF",
        fontSize: 16,
        marginRight: 8,
      }}
    >
      🔍
    </Animated.Text>
  );
}

function MicIcon() {
  return (
    <Animated.Text
      style={{
        color: "#16A34A",
        fontSize: 16,
      }}
    >
      🎤
    </Animated.Text>
  );
}
