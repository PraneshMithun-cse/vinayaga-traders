import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { BANNERS } from "../../constants/mockData";
import type { Banner } from "../../types";

const { width: screenWidth } = Dimensions.get("window");

const BANNER_HEIGHT = 160;
const AUTO_SCROLL_INTERVAL = 3500;
const DOT_ACTIVE_WIDTH = 20;
const DOT_HEIGHT = 6;
const DOT_INACTIVE_SIZE = 6;

// ---------------------------------------------------------------------------
// AnimatedDot
// ---------------------------------------------------------------------------
interface AnimatedDotProps {
  active: boolean;
}

function AnimatedDot({ active }: AnimatedDotProps) {
  const width = useSharedValue(active ? DOT_ACTIVE_WIDTH : DOT_INACTIVE_SIZE);

  useEffect(() => {
    width.value = withTiming(active ? DOT_ACTIVE_WIDTH : DOT_INACTIVE_SIZE, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
  }, [active, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        active ? styles.dotActive : styles.dotInactive,
        animatedStyle,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// BannerItem
// ---------------------------------------------------------------------------
interface BannerItemProps {
  banner: Banner;
}

function BannerItem({ banner }: BannerItemProps) {
  // Derive a slightly darker shade for the gradient end colour
  const gradientEnd = banner.color + "CC"; // ~80% opacity overlay trick via second stop

  return (
    <View style={styles.bannerContainer}>
      <LinearGradient
        colors={[banner.color, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Product / lifestyle image — right 60%, full height */}
      <Image
        source={{ uri: banner.image }}
        style={styles.bannerImage}
        contentFit="cover"
        transition={300}
      />

      {/* Subtle colour overlay on the left side so text stays legible */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <LinearGradient
          colors={[banner.color, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.55, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Left content */}
      <View style={styles.bannerContent}>
        {banner.title !== undefined && (
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {banner.title}
          </Text>
        )}
        {banner.subtitle !== undefined && (
          <Text style={styles.bannerSubtitle} numberOfLines={2}>
            {banner.subtitle}
          </Text>
        )}
        {banner.cta !== undefined && (
          <Pressable style={styles.ctaButton} accessibilityRole="button">
            <Text style={styles.ctaText}>{banner.cta}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// BannerCarousel
// ---------------------------------------------------------------------------
export function BannerCarousel() {
  const flatListRef = useRef<FlatList<Banner>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndex = useRef(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const idx = viewableItems[0].index;
        setActiveIndex(idx);
        currentIndex.current = idx;
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

  const scrollToNext = useCallback(() => {
    const next = (currentIndex.current + 1) % BANNERS.length;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    currentIndex.current = next;
    setActiveIndex(next);
  }, []);

  useEffect(() => {
    autoScrollTimer.current = setInterval(scrollToNext, AUTO_SCROLL_INTERVAL);
    return () => {
      if (autoScrollTimer.current !== null) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [scrollToNext]);

  const handleScrollBeginDrag = useCallback(() => {
    if (autoScrollTimer.current !== null) {
      clearInterval(autoScrollTimer.current);
    }
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    autoScrollTimer.current = setInterval(scrollToNext, AUTO_SCROLL_INTERVAL);
  }, [scrollToNext]);

  const renderItem = useCallback(
    ({ item }: { item: Banner }) => <BannerItem banner={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Banner) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<Banner> | null | undefined, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [],
  );

  return (
    <View style={styles.wrapper}>
      <FlatList<Banner>
        ref={flatListRef}
        data={BANNERS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={getItemLayout}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        decelerationRate="fast"
        snapToInterval={screenWidth}
        snapToAlignment="start"
        bounces={false}
      />

      {/* Dot indicators */}
      <View style={styles.dotsContainer}>
        {BANNERS.map((_, idx) => (
          <AnimatedDot key={idx} active={idx === activeIndex} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  wrapper: {
    width: screenWidth,
    height: BANNER_HEIGHT + 20, // extra room for dots below
  },

  // Banner item
  bannerContainer: {
    width: screenWidth,
    height: BANNER_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 0,
  },

  bannerImage: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "60%",
    opacity: 0.9,
  },

  bannerContent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "55%",
    paddingHorizontal: 16,
    paddingVertical: 18,
    justifyContent: "center",
    gap: 6,
  },

  bannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 24,
    letterSpacing: -0.3,
  },

  bannerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 16,
    fontWeight: "500",
  },

  ctaButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },

  ctaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
    letterSpacing: 0.2,
  },

  // Dot indicators
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
    height: DOT_HEIGHT + 4,
  },

  dot: {
    height: DOT_HEIGHT,
    borderRadius: DOT_HEIGHT / 2,
  },

  dotActive: {
    backgroundColor: "#FFFFFF",
    // width is animated — set via useAnimatedStyle
  },

  dotInactive: {
    width: DOT_INACTIVE_SIZE,
    height: DOT_INACTIVE_SIZE,
    borderRadius: DOT_INACTIVE_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
