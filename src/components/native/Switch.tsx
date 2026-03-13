import React from "react";
import { View, Text, StyleSheet, Switch as RNSwitch, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

interface SwitchProps {
  label?: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

const COLORS = {
  trackActive: "#D4AF37",
  trackInactive: "#333333",
  thumb: "#FFFFFF",
  label: "#FFFFFF",
  description: "#AAAAAA",
};

export function Switch({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  containerStyle,
}: SwitchProps) {
  const handleChange = async (newValue: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(newValue);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.textContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <RNSwitch
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{ false: COLORS.trackInactive, true: COLORS.trackActive }}
        thumbColor={COLORS.thumb}
        ios_backgroundColor={COLORS.trackInactive}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    color: COLORS.label,
    fontSize: 16,
    fontWeight: "500",
  },
  description: {
    color: COLORS.description,
    fontSize: 14,
    marginTop: 4,
  },
});
