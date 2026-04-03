import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import Slider from "@react-native-community/slider";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Preferences = {
  min_age: number;
  max_age: number;
  max_distance: number;
};

const AGE_MIN = 20;
const AGE_MAX = 70;
const DISTANCE_MIN = 5;
const DISTANCE_MAX = 200;

export function MatchingSettingsRN() {
  const { t } = useTranslation();
  const { supabase, session } = useSupabase();
  const user = session?.user;
  const fromLabel = t("mobile.matching.from");
  const toLabel = t("mobile.matching.to");

  const [preferences, setPreferences] = useState<Preferences>({
    min_age: AGE_MIN,
    max_age: 38,
    max_distance: 40,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profileKey = await resolveProfilesAuthKey(supabase, user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("min_age, max_age, max_distance")
        .eq(profileKey, user.id)
        .maybeSingle();

      if (data && !error) {
        const rawMin = Number(data.min_age);
        const rawMax = Number(data.max_age);
        const rawDist = Number(data.max_distance);
        setPreferences({
          min_age: Math.max(
            Number.isNaN(rawMin) || rawMin < AGE_MIN ? AGE_MIN : rawMin,
            AGE_MIN,
          ),
          max_age: Math.min(Number.isNaN(rawMax) ? 38 : rawMax, AGE_MAX),
          max_distance: Math.min(
            Math.max(Number.isNaN(rawDist) ? 40 : rawDist, DISTANCE_MIN),
            DISTANCE_MAX,
          ),
        });
      }
      setHasChanges(false);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    void fetchPreferences();
  }, [fetchPreferences]);

  const setMinAge = (v: number) => {
    const min = Math.round(Math.max(v, AGE_MIN));
    setPreferences((prev) => {
      const max = prev.max_age < min ? min : prev.max_age;
      return { ...prev, min_age: min, max_age: max };
    });
    setHasChanges(true);
    setSavedFlash(false);
  };

  const setMaxAge = (v: number) => {
    const max = Math.round(Math.min(v, AGE_MAX));
    setPreferences((prev) => {
      const min = prev.min_age > max ? max : prev.min_age;
      return { ...prev, min_age: min, max_age: max };
    });
    setHasChanges(true);
    setSavedFlash(false);
  };

  const setDistance = (v: number) => {
    const stepped = Math.round(v / 5) * 5;
    const d = Math.min(Math.max(stepped, DISTANCE_MIN), DISTANCE_MAX);
    setPreferences((prev) => ({ ...prev, max_distance: d }));
    setHasChanges(true);
    setSavedFlash(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const profileKey = await resolveProfilesAuthKey(supabase, user.id);
      const minAge = Math.max(preferences.min_age, AGE_MIN);
      const { error } = await supabase
        .from("profiles")
        .update({
          min_age: minAge,
          max_age: preferences.max_age,
          max_distance: preferences.max_distance,
        })
        .eq(profileKey, user.id);

      if (error) throw error;
      setHasChanges(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e) {
      if (__DEV__) console.warn("[MatchingSettingsRN save]", e);
      Alert.alert(t("common.error"), t("profile.error_saving"));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.cardTitle}>{t("settings.matching_settings")}</Text>

      {loading ? (
        <ActivityIndicator color={maakTokens.primary} style={{ marginVertical: 12 }} />
      ) : null}

      <View style={[styles.block, loading && styles.blockMuted]}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{t("settings.age")}</Text>
          <Text style={styles.value}>
            {Math.max(preferences.min_age, AGE_MIN)}–{preferences.max_age}
          </Text>
        </View>
        <Text style={styles.subLabel}>{fromLabel}</Text>
        <Slider
          style={styles.slider}
          minimumValue={AGE_MIN}
          maximumValue={AGE_MAX}
          step={1}
          value={preferences.min_age}
          onValueChange={(v) => setMinAge(v)}
          disabled={loading}
          minimumTrackTintColor={maakTokens.primary}
          maximumTrackTintColor={maakTokens.border}
          thumbTintColor={maakTokens.card}
        />
        <Text style={styles.subLabel}>{toLabel}</Text>
        <Slider
          style={styles.slider}
          minimumValue={AGE_MIN}
          maximumValue={AGE_MAX}
          step={1}
          value={preferences.max_age}
          onValueChange={(v) => setMaxAge(v)}
          disabled={loading}
          minimumTrackTintColor={maakTokens.primary}
          maximumTrackTintColor={maakTokens.border}
          thumbTintColor={maakTokens.card}
        />
      </View>

      <View style={[styles.block, loading && styles.blockMuted]}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{t("settings.distance")}</Text>
          <Text style={styles.value}>{preferences.max_distance} km</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={DISTANCE_MIN}
          maximumValue={DISTANCE_MAX}
          step={5}
          value={preferences.max_distance}
          onValueChange={(v) => setDistance(v)}
          disabled={loading}
          minimumTrackTintColor={maakTokens.primary}
          maximumTrackTintColor={maakTokens.border}
          thumbTintColor={maakTokens.card}
        />
      </View>

      {savedFlash ? (
        <Text style={styles.saved}>{t("profile.changes_saved")}</Text>
      ) : null}

      <Pressable
        style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]}
        onPress={() => void handleSave()}
        disabled={!hasChanges || saving}
      >
        {saving ? (
          <ActivityIndicator color={maakTokens.primaryForeground} />
        ) : (
          <Text style={styles.saveBtnText}>{t("settings.submit")}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    gap: 16,
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radius2xl,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  block: { gap: 6 },
  blockMuted: { opacity: 0.5 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 14, fontWeight: "600", color: maakTokens.foreground },
  value: { fontSize: 14, fontWeight: "700", color: maakTokens.foreground },
  subLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: maakTokens.mutedForeground,
    marginTop: 4,
  },
  slider: { width: "100%", height: 40 },
  saveBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    color: maakTokens.primaryForeground,
    fontWeight: "700",
    fontSize: 16,
  },
  saved: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: maakTokens.primary,
  },
});
