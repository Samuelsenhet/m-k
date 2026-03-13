import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Image } from "expo-image";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

const COLORS = {
  background: "#333333",
  text: "#D4AF37",
  online: "#22C55E",
  offline: "#666666",
};

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 36,
};

export function Avatar({
  source,
  name,
  size = "md",
  style,
  showOnlineIndicator = false,
  isOnline = false,
}: AvatarProps) {
  const sizeValue = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];

  const getInitials = (name?: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const indicatorSize = sizeValue * 0.25;

  return (
    <View style={[styles.container, { width: sizeValue, height: sizeValue }, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[styles.image, { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}
      {showOnlineIndicator && (
        <View
          style={[
            styles.indicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              backgroundColor: isOnline ? COLORS.online : COLORS.offline,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    backgroundColor: COLORS.background,
  },
  fallback: {
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: COLORS.text,
    fontWeight: "600",
  },
  indicator: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#0A0A0A",
  },
});
