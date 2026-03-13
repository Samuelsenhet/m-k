import React from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface CheckboxProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

const COLORS = {
  checked: "#D4AF37",
  unchecked: "#333333",
  checkmark: "#1A1A1A",
  border: "#333333",
  label: "#FFFFFF",
  description: "#AAAAAA",
  disabled: "#4A4A4A",
};

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  containerStyle,
}: CheckboxProps) {
  const handlePress = async () => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(!checked);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, containerStyle, disabled && { opacity: 0.6 }]}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? COLORS.checked : "transparent",
            borderColor: checked ? COLORS.checked : COLORS.border,
          },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={16} color={COLORS.checkmark} />}
      </View>
      {(label || description) && (
        <View style={styles.textContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    color: COLORS.label,
    fontSize: 16,
    fontWeight: "500",
  },
  description: {
    color: COLORS.description,
    fontSize: 14,
    marginTop: 2,
  },
});
