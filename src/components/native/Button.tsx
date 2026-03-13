import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableProps,
} from "react-native";
import * as Haptics from "expo-haptics";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const COLORS = {
  primary: "#D4AF37",
  primaryDark: "#B8962F",
  secondary: "#1A1A1A",
  secondaryText: "#FFFFFF",
  outline: "transparent",
  outlineBorder: "#D4AF37",
  ghost: "transparent",
  destructive: "#EF4444",
  destructiveDark: "#DC2626",
  disabled: "#4A4A4A",
  disabledText: "#9A9A9A",
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  onPress,
  ...props
}: ButtonProps) {
  const handlePress = async (e: Parameters<NonNullable<PressableProps["onPress"]>>[0]) => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  const getBackgroundColor = (pressed: boolean): string => {
    if (disabled) return COLORS.disabled;
    switch (variant) {
      case "primary":
        return pressed ? COLORS.primaryDark : COLORS.primary;
      case "secondary":
        return pressed ? "#2A2A2A" : COLORS.secondary;
      case "destructive":
        return pressed ? COLORS.destructiveDark : COLORS.destructive;
      case "outline":
      case "ghost":
        return pressed ? "rgba(212, 175, 55, 0.1)" : COLORS.ghost;
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return COLORS.disabledText;
    switch (variant) {
      case "primary":
        return "#1A1A1A";
      case "secondary":
        return COLORS.secondaryText;
      case "outline":
      case "ghost":
        return COLORS.primary;
      case "destructive":
        return "#FFFFFF";
      default:
        return "#1A1A1A";
    }
  };

  const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 16 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 },
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(pressed),
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: variant === "outline" ? (disabled ? COLORS.disabled : COLORS.outlineBorder) : "transparent",
          opacity: disabled ? 0.6 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: sizeStyles[size].fontSize },
              leftIcon ? { marginLeft: 8 } : undefined,
              rightIcon ? { marginRight: 8 } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    minHeight: 44,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});
