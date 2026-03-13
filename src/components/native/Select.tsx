import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

const COLORS = {
  background: "#1A1A1A",
  border: "#333333",
  borderFocus: "#D4AF37",
  borderError: "#EF4444",
  text: "#FFFFFF",
  placeholder: "#666666",
  label: "#AAAAAA",
  error: "#EF4444",
  modalBackground: "#0A0A0A",
  optionHover: "#2A2A2A",
  checkmark: "#D4AF37",
};

export function Select({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  error,
  disabled = false,
  containerStyle,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = async (optionValue: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const getBorderColor = (): string => {
    if (error) return COLORS.borderError;
    if (isOpen) return COLORS.borderFocus;
    return COLORS.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        style={[
          styles.selectButton,
          { borderColor: getBorderColor(), opacity: disabled ? 0.6 : 1 },
        ]}
      >
        <Text
          style={[
            styles.selectText,
            !selectedOption && { color: COLORS.placeholder },
          ]}
        >
          {selectedOption?.label ?? placeholder}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color={COLORS.placeholder}
        />
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent}>
            {label && <Text style={styles.modalTitle}>{label}</Text>}
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item.value)}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && { backgroundColor: COLORS.optionHover },
                    item.value === value && styles.optionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && { color: COLORS.checkmark },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={20} color={COLORS.checkmark} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    color: COLORS.label,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  selectText: {
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.modalBackground,
    borderRadius: 16,
    width: "100%",
    maxHeight: "60%",
    overflow: "hidden",
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionSelected: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  optionText: {
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
  },
});
