import { PhotoUploadRN, type PhotoSlotRN } from "@/components/onboarding/PhotoUploadRN";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens } from "@maak/core";
import type { TFunction } from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const MAX_PHOTOS = 6;

type PhotoRow = {
  id: string;
  storage_path: string;
  display_order: number;
  prompt?: string | null;
};

function buildSlots(rows: PhotoRow[], t: TFunction): PhotoSlotRN[] {
  const sorted = [...rows].sort((a, b) => a.display_order - b.display_order);
  return Array.from({ length: MAX_PHOTOS }, (_, i) => {
    const row = sorted.find((r) => r.display_order === i);
    if (row?.storage_path) {
      return {
        id: row.id,
        storage_path: row.storage_path,
        display_order: i,
        prompt: row.prompt ?? t(`mobile.wizard.photo_prompt_${i}`),
      };
    }
    return { storage_path: "", display_order: i, prompt: "" };
  });
}

type Props = {
  userId: string;
  onPhotosUpdated?: () => void;
};

export function ProfilePhotosSection({ userId, onPhotosUpdated }: Props) {
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const [photos, setPhotos] = useState<PhotoSlotRN[]>(() =>
    Array.from({ length: MAX_PHOTOS }, (_, i) => ({
      storage_path: "",
      display_order: i,
      prompt: "",
    })),
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("id, storage_path, display_order, prompt")
        .eq("user_id", userId)
        .order("display_order", { ascending: true });
      if (error) {
        if (__DEV__) console.error("[ProfilePhotosSection]", error);
        return;
      }
      setPhotos(buildSlots((data ?? []) as PhotoRow[], t));
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t("profile.photos.title")}</Text>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={maakTokens.primary} />
      ) : (
        <PhotoUploadRN
          userId={userId}
          photos={photos}
          onPhotosChange={(next) => {
            setPhotos(next);
            onPhotosUpdated?.();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20 },
  loader: { marginVertical: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 10,
  },
});
