import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "error";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: "#333333", text: "#FFFFFF" },
  primary: { bg: "rgba(212, 175, 55, 0.2)", text: "#D4AF37" },
  secondary: { bg: "#2A2A2A", text: "#AAAAAA" },
  success: { bg: "rgba(34, 197, 94, 0.2)", text: "#22C55E" },
  warning: { bg: "rgba(234, 179, 8, 0.2)", text: "#EAB308" },
  error: { bg: "rgba(239, 68, 68, 0.2)", text: "#EF4444" },
};

const SIZE_STYLES: Record<BadgeSize, { paddingH: number; paddingV: number; fontSize: number }> = {
  sm: { paddingH: 6, paddingV: 2, fontSize: 10 },
  md: { paddingH: 8, paddingV: 4, fontSize: 12 },
  lg: { paddingH: 12, paddingV: 6, fontSize: 14 },
};

export function Badge({ label, variant = "default", size = "md", icon, style }: BadgeProps) {
  const colors = COLORS[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: sizeStyle.paddingH,
          paddingVertical: sizeStyle.paddingV,
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, { color: colors.text, fontSize: sizeStyle.fontSize }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: "600",
  },
});
