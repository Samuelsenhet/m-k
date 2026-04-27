import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

type ColumnKey = "day" | "month" | "year";

export function AgeVerificationRN({ dateOfBirth, onChange, error }: Props) {
  const { t, i18n } = useTranslation();
  const { day, month, year } = dateOfBirth;
  const daysInMonth = getDaysInMonth(month, year);
  const [openCol, setOpenCol] = useState<ColumnKey | null>(null);

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

  const selectDay = (v: string) => {
    onChange({ ...dateOfBirth, day: v });
    setOpenCol(null);
  };
  const selectMonth = (v: string) => {
    onChange({ ...dateOfBirth, month: v });
    setOpenCol(null);
  };
  const selectYear = (v: string) => {
    onChange({ ...dateOfBirth, year: v });
    setOpenCol(null);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t("mobile.age.dob")}</Text>
      <Text style={styles.hint}>{t("mobile.age.hint")}</Text>

      <View style={styles.row}>
        <Pressable style={[styles.pickerCol, !day && styles.pickerEmpty]} onPress={() => setOpenCol("day")}>
          <Text style={[styles.pickerText, !day && styles.pickerPlaceholder]}>
            {day || t("mobile.age.day")}
          </Text>
          <Ionicons name="chevron-down" size={16} color={maakTokens.mutedForeground} />
        </Pressable>

        <Pressable style={[styles.pickerColWide, !month && styles.pickerEmpty]} onPress={() => setOpenCol("month")}>
          <Text style={[styles.pickerText, !month && styles.pickerPlaceholder]}>
            {month ? months.find((m) => m.value === month)?.label ?? month : t("mobile.age.month")}
          </Text>
          <Ionicons name="chevron-down" size={16} color={maakTokens.mutedForeground} />
        </Pressable>

        <Pressable style={[styles.pickerCol, !year && styles.pickerEmpty]} onPress={() => setOpenCol("year")}>
          <Text style={[styles.pickerText, !year && styles.pickerPlaceholder]}>
            {year || t("mobile.age.year")}
          </Text>
          <Ionicons name="chevron-down" size={16} color={maakTokens.mutedForeground} />
        </Pressable>
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

      <Modal visible={openCol === "day"} transparent animationType="fade" onRequestClose={() => setOpenCol(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpenCol(null)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>{t("mobile.age.day")}</Text>
            <FlatList
              data={days}
              keyExtractor={(d) => d}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable style={[styles.option, item === day && styles.optionActive]} onPress={() => selectDay(item)}>
                  <Text style={[styles.optionText, item === day && styles.optionTextActive]}>{item}</Text>
                  {item === day ? <Ionicons name="checkmark" size={20} color={maakTokens.primary} /> : null}
                </Pressable>
              )}
              initialScrollIndex={day ? Math.max(0, days.indexOf(day) - 2) : 0}
              getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={openCol === "month"} transparent animationType="fade" onRequestClose={() => setOpenCol(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpenCol(null)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>{t("mobile.age.month")}</Text>
            <FlatList
              data={months}
              keyExtractor={(m) => m.value}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable style={[styles.option, item.value === month && styles.optionActive]} onPress={() => selectMonth(item.value)}>
                  <Text style={[styles.optionText, item.value === month && styles.optionTextActive]}>{item.label}</Text>
                  {item.value === month ? <Ionicons name="checkmark" size={20} color={maakTokens.primary} /> : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={openCol === "year"} transparent animationType="fade" onRequestClose={() => setOpenCol(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpenCol(null)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>{t("mobile.age.year")}</Text>
            <FlatList
              data={YEARS}
              keyExtractor={(y) => y}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable style={[styles.option, item === year && styles.optionActive]} onPress={() => selectYear(item)}>
                  <Text style={[styles.optionText, item === year && styles.optionTextActive]}>{item}</Text>
                  {item === year ? <Ionicons name="checkmark" size={20} color={maakTokens.primary} /> : null}
                </Pressable>
              )}
              initialScrollIndex={year ? Math.max(0, YEARS.indexOf(year) - 2) : 0}
              getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 15, fontWeight: "600", color: maakTokens.foreground },
  hint: { fontSize: 13, color: maakTokens.mutedForeground },
  row: { flexDirection: "row", gap: 8, alignItems: "stretch" },
  pickerCol: {
    flex: 1,
    minWidth: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    backgroundColor: maakTokens.muted,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pickerColWide: {
    flex: 1.4,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    backgroundColor: maakTokens.muted,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pickerEmpty: {},
  pickerText: { fontSize: 15, color: maakTokens.foreground, marginRight: 4 },
  pickerPlaceholder: { color: maakTokens.mutedForeground },
  warnBox: {
    backgroundColor: `${maakTokens.destructive}18`,
    padding: 12,
    borderRadius: maakTokens.radiusLg,
  },
  warnText: { color: maakTokens.destructive, fontSize: 13 },
  ok: { fontSize: 13, color: maakTokens.primary },
  fieldError: { fontSize: 13, color: maakTokens.destructive },
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
    maxHeight: "50%",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.foreground,
    textAlign: "center",
    marginBottom: 12,
  },
  list: { paddingHorizontal: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: maakTokens.radiusMd,
    height: 48,
  },
  optionActive: { backgroundColor: `${maakTokens.primary}14` },
  optionText: { fontSize: 16, color: maakTokens.foreground },
  optionTextActive: { color: maakTokens.primary, fontWeight: "600" },
});
