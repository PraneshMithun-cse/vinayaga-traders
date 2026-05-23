export const Colors = {
  primary: "#16A34A",
  primaryLight: "#DCFCE7",
  primaryMid: "#22C55E",
  primaryDark: "#15803D",

  white: "#FFFFFF",
  background: "#F9FAFB",
  card: "#FFFFFF",

  textPrimary: "#111827",
  textSecondary: "#374151",
  textMuted: "#6B7280",
  textFaint: "#9CA3AF",

  border: "#E5E7EB",
  borderLight: "#F3F4F6",

  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  success: "#16A34A",

  overlay: "rgba(0,0,0,0.5)",
  overlayLight: "rgba(0,0,0,0.08)",

  shadow: "rgba(0,0,0,0.08)",
  shadowMd: "rgba(0,0,0,0.12)",
  shadowLg: "rgba(0,0,0,0.18)",

  tabBarBg: "#FFFFFF",
  tabBarActive: "#16A34A",
  tabBarInactive: "#9CA3AF",

  skeletonBase: "#E5E7EB",
  skeletonHighlight: "#F9FAFB",
} as const;

export const gradients = {
  primary: ["#16A34A", "#22C55E"] as const,
  primaryLight: ["#DCFCE7", "#F0FDF4"] as const,
  banner: ["rgba(22,163,74,0.9)", "rgba(22,163,74,0.6)"] as const,
  card: ["rgba(255,255,255,0)", "rgba(255,255,255,1)"] as const,
};
