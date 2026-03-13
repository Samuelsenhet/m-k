import React from "react";
import { View, StyleSheet, ViewStyle, Pressable, PressableProps } from "react-native";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  style?: ViewStyle;
  onPress?: PressableProps["onPress"];
}

const COLORS = {
  background: "#1A1A1A",
  border: "#333333",
  elevated: "#222222",
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  style,
  onPress,
}: CardProps) {
  const paddingValues = {
    none: 0,
    sm: 8,
    md: 16,
    lg: 24,
  };

  const getBackgroundColor = (): string => {
    switch (variant) {
      case "elevated":
        return COLORS.elevated;
      default:
        return COLORS.background;
    }
  };

  const cardStyle: ViewStyle = {
    ...styles.card,
    backgroundColor: getBackgroundColor(),
    padding: paddingValues[padding],
    borderWidth: variant === "outlined" ? 1 : 0,
    borderColor: COLORS.border,
    ...(variant === "elevated" && styles.elevated),
    ...(style as object),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
