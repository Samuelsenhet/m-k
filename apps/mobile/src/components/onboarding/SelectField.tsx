import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type SelectOption = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  onValueChange: (v: string) => void;
};

export function SelectField({ label, value, placeholder, options, onValueChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={maakTokens.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.value === value && styles.optionActive]}
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[styles.optionText, item.value === value && styles.optionTextActive]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value ? (
                    <Ionicons name="checkmark" size={20} color={maakTokens.primary} />
                  ) : null}
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
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: maakTokens.foreground },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    backgroundColor: maakTokens.muted,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  triggerText: { fontSize: 16, color: maakTokens.foreground, flex: 1, marginRight: 8 },
  placeholder: { color: maakTokens.mutedForeground },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: maakTokens.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "60%",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.foreground,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  list: { paddingHorizontal: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: maakTokens.radiusMd,
  },
  optionActive: { backgroundColor: `${maakTokens.primary}14` },
  optionText: { fontSize: 16, color: maakTokens.foreground },
  optionTextActive: { color: maakTokens.primary, fontWeight: "600" },
});
