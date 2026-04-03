import { maakTokens } from "@maak/core";
import { Picker } from "@react-native-picker/picker";
import { StyleSheet, Text, View } from "react-native";

export type SelectOption = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  onValueChange: (v: string) => void;
};

export function SelectField({ label, value, placeholder, options, onValueChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={value || "__none__"}
          onValueChange={(v) => onValueChange(v === "__none__" ? "" : v)}
          style={styles.picker}
          itemStyle={styles.item}
        >
          <Picker.Item label={placeholder} value="__none__" />
          {options.map((o) => (
            <Picker.Item key={o.value} label={o.label} value={o.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: maakTokens.foreground },
  pickerBox: {
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    backgroundColor: maakTokens.muted,
    overflow: "hidden",
  },
  picker: { width: "100%" },
  item: { fontSize: 16 },
});
