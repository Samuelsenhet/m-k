import { useSupabase } from "@/contexts/SupabaseProvider";
import { useHostProfile } from "@/hooks/useHostProfile";
import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Skapa Träff — form för aktiva Värdar.
 *
 * Skriver direkt mot `träffar`-tabellen via supabase-client. RLS-policyn
 * `träffar_active_host_insert` kollar att user_id finns i host_profiles
 * med status='active', så vi får defence-in-depth: frontend gate + RLS.
 *
 * Time-pickern är medvetet enkel — rå TextInput för ISO-datum. En
 * riktig wheel/calendar kan läggas till senare när UI-polishing tas.
 */

const TITLE_MIN = 3;
const TITLE_MAX = 80;
const DESC_MIN = 10;
const DESC_MAX = 600;
const MIN_ATTENDEES = 4;
const MAX_ATTENDEES_CAP = 20;

export default function CreateTraffScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const host = useHostProfile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [startsAtIso, setStartsAtIso] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("8");
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async () => {
    if (submitting) return;
    const hostId = session?.user?.id;
    if (!hostId) return;

    // ── Validation ──────────────────────────────────────────
    if (title.trim().length < TITLE_MIN || title.trim().length > TITLE_MAX) {
      Alert.alert(
        t("common.error", { defaultValue: "Fel" }),
        t("traffar.create.error_title", {
          defaultValue: `Titeln måste vara ${TITLE_MIN}–${TITLE_MAX} tecken.`,
        }),
      );
      return;
    }
    if (description.trim().length < DESC_MIN || description.trim().length > DESC_MAX) {
      Alert.alert(
        t("common.error", { defaultValue: "Fel" }),
        t("traffar.create.error_description", {
          defaultValue: `Beskrivningen måste vara ${DESC_MIN}–${DESC_MAX} tecken.`,
        }),
      );
      return;
    }
    if (!locationLabel.trim() || !locationCity.trim()) {
      Alert.alert(
        t("common.error", { defaultValue: "Fel" }),
        t("traffar.create.error_location", {
          defaultValue: "Plats och stad krävs.",
        }),
      );
      return;
    }
    // Starts_at: parse the user's string as local time. If it looks like
    // "2026-05-01 19:00" without TZ, append Z or local TZ. Simpler: try
    // Date() and validate >now.
    const startsAt = new Date(startsAtIso.trim());
    if (Number.isNaN(startsAt.getTime())) {
      Alert.alert(
        t("common.error", { defaultValue: "Fel" }),
        t("traffar.create.error_starts_at", {
          defaultValue:
            "Ogiltigt datum. Använd formatet 2026-05-01 19:00 (tid lokalt).",
        }),
      );
      return;
    }
    if (startsAt.getTime() <= Date.now() + 60 * 60 * 1000) {
      Alert.alert(
        t("common.error", { defaultValue: "Fel" }),
        t("traffar.create.error_starts_at_too_soon", {
          defaultValue: "Träffen måste vara minst en timme in i framtiden.",
        }),
      );
      return;
    }
    const maxN = Number.parseInt(maxAttendees, 10);
    if (
      !Number.isFinite(maxN) ||
      maxN < MIN_ATTENDEES ||
      maxN > MAX_ATTENDEES_CAP
    ) {
      Alert.alert(
        t("common.error", { defaultValue: "Fel" }),
        t("traffar.create.error_max_attendees", {
          defaultValue: `Max antal deltagare måste vara mellan ${MIN_ATTENDEES} och ${MAX_ATTENDEES_CAP}.`,
        }),
      );
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("träffar")
        .insert({
          host_user_id: hostId,
          title: title.trim(),
          description: description.trim(),
          location_label: locationLabel.trim(),
          location_city: locationCity.trim(),
          starts_at: startsAt.toISOString(),
          max_attendees: maxN,
          min_confirm_attendees: MIN_ATTENDEES,
          status: "open",
        })
        .select("id")
        .single();
      if (error) throw error;
      if (!data) throw new Error("No row returned");

      Alert.alert(
        t("traffar.create.success_title", { defaultValue: "Träff skapad" }),
        t("traffar.create.success_body", {
          defaultValue:
            "Den är nu synlig i Träff-feeden. När minst 4 personer anmält sig markeras den som bekräftad.",
        }),
        [
          {
            text: t("common.done", { defaultValue: "Klar" }),
            onPress: () => router.back(),
          },
        ],
      );
    } catch (err) {
      if (__DEV__) console.error("[create träff] error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      const isRlsDenied =
        msg.includes("row-level security") ||
        msg.includes("new row violates") ||
        msg.includes("permission denied");
      Alert.alert(
        t("common.error", { defaultValue: "Fel" }),
        isRlsDenied
          ? t("traffar.create.error_not_host", {
              defaultValue:
                "Endast aktiva Värdar kan skapa Träffar. Din status är inte aktiv.",
            })
          : t("traffar.create.error_generic", {
              defaultValue: "Kunde inte skapa Träffen. Försök igen.",
            }),
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    session?.user?.id,
    title,
    description,
    locationLabel,
    locationCity,
    startsAtIso,
    maxAttendees,
    supabase,
    t,
    router,
  ]);

  // ── Host gate ─────────────────────────────────────────────
  if (!host.loading && !host.isActive) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={maakTokens.foreground} />
          </Pressable>
          <Text style={styles.topTitle}>
            {t("traffar.create.title", { defaultValue: "Skapa Träff" })}
          </Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.rejectWrap}>
          <Ionicons
            name="lock-closed"
            size={40}
            color={maakTokens.mutedForeground}
          />
          <Text style={styles.rejectText}>
            {t("traffar.create.host_gate", {
              defaultValue:
                "Endast aktiva Värdar kan skapa Träffar. Bli Värd genom att bygga en aktiv Samling eller skicka lyckade introduktioner.",
            })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={maakTokens.foreground} />
        </Pressable>
        <Text style={styles.topTitle}>
          {t("traffar.create.title", { defaultValue: "Skapa Träff" })}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: maakTokens.screenPaddingHorizontal,
            paddingBottom: insets.bottom + 120,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.hero}>
            {t("traffar.create.hero", {
              defaultValue:
                "Skapa en Träff så andra MÄÄK-användare kan anmäla sig. När 4+ har anmält sig bekräftas den automatiskt.",
            })}
          </Text>

          <Field
            label={t("traffar.create.field_title", { defaultValue: "Titel" })}
            value={title}
            onChangeText={setTitle}
            placeholder={t("traffar.create.placeholder_title", {
              defaultValue: "Söndagsbrunch på Katarinabaren",
            })}
            maxLength={TITLE_MAX}
            hint={`${title.length} / ${TITLE_MAX}`}
          />

          <Field
            label={t("traffar.create.field_description", {
              defaultValue: "Beskrivning",
            })}
            value={description}
            onChangeText={setDescription}
            placeholder={t("traffar.create.placeholder_description", {
              defaultValue: "Lugn brunch för dig som vill träffa fler...",
            })}
            maxLength={DESC_MAX}
            hint={`${description.length} / ${DESC_MAX}`}
            multiline
            minHeight={110}
          />

          <View style={styles.inlineRow}>
            <View style={{ flex: 2 }}>
              <Field
                label={t("traffar.create.field_location", {
                  defaultValue: "Plats",
                })}
                value={locationLabel}
                onChangeText={setLocationLabel}
                placeholder={t("traffar.create.placeholder_location", {
                  defaultValue: "Katarinabaren",
                })}
                maxLength={100}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t("traffar.create.field_city", {
                  defaultValue: "Stad",
                })}
                value={locationCity}
                onChangeText={setLocationCity}
                placeholder={t("traffar.create.placeholder_city", {
                  defaultValue: "Stockholm",
                })}
                maxLength={40}
              />
            </View>
          </View>

          <Field
            label={t("traffar.create.field_starts_at", {
              defaultValue: "Startar (YYYY-MM-DD HH:MM)",
            })}
            value={startsAtIso}
            onChangeText={setStartsAtIso}
            placeholder="2026-05-01 19:00"
            maxLength={30}
            hint={t("traffar.create.starts_at_hint", {
              defaultValue: "Tolkas som lokal tid.",
            })}
          />

          <Field
            label={t("traffar.create.field_max_attendees", {
              defaultValue: "Max antal deltagare (4–20)",
            })}
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            keyboardType="number-pad"
            maxLength={2}
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={submit}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.submitButtonBusy]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitLabel}>
                {t("traffar.create.submit", {
                  defaultValue: "Skapa Träff",
                })}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  hint,
  multiline,
  minHeight,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  hint?: string;
  multiline?: boolean;
  minHeight?: number;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={maakTokens.mutedForeground}
        maxLength={maxLength}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          styles.input,
          multiline && { minHeight: minHeight ?? 60, textAlignVertical: "top" },
        ]}
      />
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: maakTokens.foreground },
  hero: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
  },
  field: { marginTop: 14 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: maakTokens.mutedForeground,
    marginBottom: 6,
  },
  input: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(37, 61, 44, 0.08)",
    fontSize: 15,
    color: maakTokens.foreground,
  },
  fieldHint: {
    marginTop: 4,
    fontSize: 11,
    color: maakTokens.mutedForeground,
    textAlign: "right",
  },
  inlineRow: { flexDirection: "row", gap: 12 },
  footer: {
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(37, 61, 44, 0.08)",
    backgroundColor: maakTokens.background,
  },
  submitButton: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonBusy: { opacity: 0.7 },
  submitLabel: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  rejectWrap: { padding: 40, alignItems: "center", gap: 16 },
  rejectText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
  },
});
