import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Colors } from "../constants/colors";

const { width } = Dimensions.get("window");

const ORDER_STEPS = [
  { id: 1, icon: "📋", label: "Order Placed", sublabel: "Just now", done: true },
  { id: 2, icon: "✅", label: "Order Confirmed", sublabel: "10:32 AM", done: true },
  { id: 3, icon: "🧺", label: "Picking Items", sublabel: "10:33 AM", done: true },
  { id: 4, icon: "📦", label: "Packed & Ready", sublabel: "10:36 AM", done: false, active: true },
  { id: 5, icon: "🛵", label: "Out for Delivery", sublabel: "Estimated 10:42 AM", done: false },
  { id: 6, icon: "🎉", label: "Delivered", sublabel: "Estimated 10:42 AM", done: false },
];

function PulsingDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 600, easing: Easing.ease }),
        withTiming(1, { duration: 600, easing: Easing.ease }),
      ),
      -1,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 600, easing: Easing.ease }),
        withTiming(1, { duration: 600, easing: Easing.ease }),
      ),
      -1,
    );
  }, [scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulseDotContainer}>
      <Animated.View style={[styles.pulseDotRing, animStyle]} />
      <View style={styles.pulseDot} />
    </View>
  );
}

function AgentCard() {
  const slideUp = useSharedValue(80);

  useEffect(() => {
    slideUp.value = withSpring(0, { damping: 18, stiffness: 200 });
  }, [slideUp]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideUp.value }],
  }));

  return (
    <Animated.View style={[styles.agentCard, animStyle]}>
      <View style={styles.agentLeft}>
        <View style={styles.agentAvatar}>
          <Text style={styles.agentAvatarText}>RS</Text>
          <View style={styles.agentOnline} />
        </View>
        <View>
          <Text style={styles.agentName}>Rahul Singh</Text>
          <Text style={styles.agentRole}>Your delivery partner</Text>
          <View style={styles.agentRating}>
            <Text style={styles.agentStar}>★</Text>
            <Text style={styles.agentRatingText}>4.8 · 2,341 deliveries</Text>
          </View>
        </View>
      </View>
      <View style={styles.agentActions}>
        <Pressable style={styles.agentBtn}>
          <Text style={styles.agentBtnIcon}>📞</Text>
        </Pressable>
        <Pressable style={styles.agentBtn}>
          <Text style={styles.agentBtnIcon}>💬</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(0.6, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.closeBtn}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Track Order</Text>
        <Text style={styles.orderId}>ORD-001</Text>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapArea}>
        <View style={styles.mapBg}>
          <View style={styles.mapGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.mapGridLine} />
            ))}
          </View>
          {/* Delivery route visualization */}
          <View style={styles.routeContainer}>
            <View style={styles.routeStart}>
              <Text style={styles.routeEmoji}>🏪</Text>
              <Text style={styles.routeLabel}>Store</Text>
            </View>
            <View style={styles.routeLine}>
              <Animated.View style={[styles.routeFill, progressStyle]} />
              <View style={styles.routeScooter}>
                <Text style={styles.routeScooterEmoji}>🛵</Text>
              </View>
            </View>
            <View style={styles.routeEnd}>
              <Text style={styles.routeEmoji}>📍</Text>
              <Text style={styles.routeLabel}>Home</Text>
            </View>
          </View>

          {/* ETA overlay */}
          <View style={styles.etaOverlay}>
            <View style={styles.etaPill}>
              <Text style={styles.etaTime}>⚡ 4 mins</Text>
              <Text style={styles.etaLabel}>away</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Status Steps */}
      <View style={styles.stepsCard}>
        <View style={styles.stepsHeader}>
          <Text style={styles.stepsTitle}>Order Status</Text>
          <PulsingDot />
          <Text style={styles.stepsLive}>Live</Text>
        </View>

        <View style={styles.stepsList}>
          {ORDER_STEPS.map((step, index) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[
                  styles.stepDot,
                  step.done && styles.stepDotDone,
                  step.active && styles.stepDotActive,
                ]}>
                  {step.done ? (
                    <Text style={styles.stepCheck}>✓</Text>
                  ) : step.active ? (
                    <View style={styles.stepActiveDot} />
                  ) : null}
                </View>
                {index < ORDER_STEPS.length - 1 && (
                  <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                )}
              </View>
              <View style={[styles.stepContent, step.active && styles.stepContentActive]}>
                <Text style={styles.stepIcon}>{step.icon}</Text>
                <View style={styles.stepTextBlock}>
                  <Text style={[styles.stepLabel, step.active && styles.stepLabelActive]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepSublabel}>{step.sublabel}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Agent Card */}
      <View style={styles.agentContainer}>
        <AgentCard />
      </View>

      {/* Bottom: Help button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable style={styles.helpBtn}>
          <Text style={styles.helpText}>🎧  Need Help?</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel Order</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  closeBtn: { fontSize: 18, color: Colors.textPrimary, padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.textPrimary },
  orderId: { fontSize: 13, color: Colors.textMuted },

  mapArea: { height: 200, backgroundColor: "#E8F5E9" },
  mapBg: { flex: 1, position: "relative", overflow: "hidden" },
  mapGrid: { ...StyleSheet.absoluteFillObject, flexDirection: "row", justifyContent: "space-around" },
  mapGridLine: { width: 0.5, backgroundColor: "rgba(22,163,74,0.15)", height: "100%" },

  routeContainer: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeStart: { alignItems: "center" },
  routeEnd: { alignItems: "center" },
  routeEmoji: { fontSize: 24 },
  routeLabel: { fontSize: 10, fontWeight: "700", color: Colors.textSecondary, marginTop: 2 },
  routeLine: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    position: "relative",
  },
  routeFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  routeScooter: { position: "absolute", top: -12, left: "55%" },
  routeScooterEmoji: { fontSize: 22 },

  etaOverlay: { position: "absolute", top: 16, right: 16 },
  etaPill: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  etaTime: { fontSize: 16, fontWeight: "900", color: "#fff" },
  etaLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)" },

  stepsCard: { backgroundColor: Colors.white, margin: 16, borderRadius: 16, padding: 16 },
  stepsHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 6 },
  stepsTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, flex: 1 },
  stepsLive: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  pulseDotContainer: { width: 12, height: 12, alignItems: "center", justifyContent: "center" },
  pulseDotRing: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },

  stepsList: { gap: 0 },
  stepRow: { flexDirection: "row", gap: 12 },
  stepLeft: { alignItems: "center", width: 20 },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepDotActive: { backgroundColor: Colors.white, borderColor: Colors.primary, borderWidth: 2.5 },
  stepActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  stepCheck: { fontSize: 10, color: "#fff", fontWeight: "800" },
  stepLine: { width: 2, flex: 1, backgroundColor: Colors.border, minHeight: 28, marginVertical: 2 },
  stepLineDone: { backgroundColor: Colors.primary },
  stepContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 20 },
  stepContentActive: { backgroundColor: Colors.primaryLight, borderRadius: 8, padding: 8, marginLeft: -4 },
  stepIcon: { fontSize: 18 },
  stepTextBlock: {},
  stepLabel: { fontSize: 14, fontWeight: "600", color: Colors.textMuted },
  stepLabelActive: { color: Colors.primary, fontWeight: "800" },
  stepSublabel: { fontSize: 11, color: Colors.textFaint, marginTop: 1 },

  agentContainer: { paddingHorizontal: 16, marginTop: -8 },
  agentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  agentLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  agentAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", position: "relative" },
  agentAvatarText: { fontSize: 15, fontWeight: "800", color: Colors.primary },
  agentOnline: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, borderWidth: 2, borderColor: "#fff" },
  agentName: { fontSize: 15, fontWeight: "800", color: Colors.textPrimary },
  agentRole: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  agentRating: { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 2 },
  agentStar: { fontSize: 12, color: Colors.warning },
  agentRatingText: { fontSize: 11, color: Colors.textMuted },
  agentActions: { flexDirection: "row", gap: 8 },
  agentBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  agentBtnIcon: { fontSize: 18 },

  bottomBar: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  helpBtn: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  helpText: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.error,
  },
  cancelText: { fontSize: 14, fontWeight: "700", color: Colors.error },
});
