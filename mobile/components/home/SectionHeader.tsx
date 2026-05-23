import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
}

export function SectionHeader({ title, subtitle, onViewAll }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onViewAll ? (
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAll}>View All ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  left: { flex: 1, marginRight: 8 },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
});
