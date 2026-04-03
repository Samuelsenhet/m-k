import { maakTokens } from "@maak/core";
import { Picker } from "@react-native-picker/picker";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { calculateAge } from "@/lib/age";

const MONTH_VALUES = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) =>
  (currentYear - 18 - i).toString(),
);

function getDaysInMonth(month: string, year: string): number {
  if (!month || !year) return 31;
  return new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
}

type Dob = { day: string; month: string; year: string };

type Props = {
  dateOfBirth: Dob;
  onChange: (d: Dob) => void;
  error?: string;
};

export function AgeVerificationRN({ dateOfBirth, onChange, error }: Props) {
  const { t, i18n } = useTranslation();
  const { day, month, year } = dateOfBirth;
  const daysInMonth = getDaysInMonth(month, year);
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, "0")),
    [daysInMonth],
  );

  const months = useMemo(
    () =>
      MONTH_VALUES.map((value) => ({
        value,
        label: t(`mobile.age.m${value}`),
      })),
    [t, i18n.language],
  );

  let age: number | null = null;
  let showAgeWarning = false;
  let isOldEnough = false;
  try {
    if (day && month && year) {
      age = calculateAge(day, month, year);
      showAgeWarning = age < 20;
      isOldEnough = age >= 20;
    }
  } catch {
    age = null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t("mobile.age.dob")}</Text>
      <Text style={styles.hint}>{t("mobile.age.hint")}</Text>

      <View style={styles.row}>
        <View style={styles.pickerCol}>
          <Picker
            selectedValue={day || ""}
            onValueChange={(v) => onChange({ ...dateOfBirth, day: v })}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label={t("mobile.age.day")} value="" enabled={false} />
            {days.map((d) => (
              <Picker.Item key={d} label={d} value={d} />
            ))}
          </Picker>
        </View>
        <View style={styles.pickerColWide}>
          <Picker
            selectedValue={month || ""}
            onValueChange={(v) => onChange({ ...dateOfBirth, month: v })}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label={t("mobile.age.month")} value="" enabled={false} />
            {months.map((m) => (
              <Picker.Item key={m.value} label={m.label} value={m.value} />
            ))}
          </Picker>
        </View>
        <View style={styles.pickerCol}>
          <Picker
            selectedValue={year || ""}
            onValueChange={(v) => onChange({ ...dateOfBirth, year: v })}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label={t("mobile.age.year")} value="" enabled={false} />
            {YEARS.map((y) => (
              <Picker.Item key={y} label={y} value={y} />
            ))}
          </Picker>
        </View>
      </View>

      {showAgeWarning ? (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>{t("mobile.age.too_young")}</Text>
        </View>
      ) : null}

      {isOldEnough && age != null ? (
        <Text style={styles.ok}>{t("mobile.age.confirmed", { age })}</Text>
      ) : null}

      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: maakTokens.foreground,
  },
  hint: { fontSize: 13, color: maakTokens.mutedForeground },
  row: { flexDirection: "row", gap: 4, alignItems: "stretch" },
  pickerCol: { flex: 1, minWidth: 72 },
  pickerColWide: { flex: 1.4, minWidth: 100 },
  picker: { width: "100%" },
  pickerItem: { fontSize: 15 },
  warnBox: {
    backgroundColor: `${maakTokens.destructive}18`,
    padding: 12,
    borderRadius: maakTokens.radiusLg,
  },
  warnText: { color: maakTokens.destructive, fontSize: 13 },
  ok: { fontSize: 13, color: maakTokens.primary },
  fieldError: { fontSize: 13, color: maakTokens.destructive },
});
