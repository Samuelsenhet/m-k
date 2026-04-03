import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens } from "@maak/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export interface PhotoSlotRN {
  id?: string;
  storage_path: string;
  display_order: number;
  prompt?: string;
}

const MAX_PHOTOS = 6;

type Props = {
  userId: string;
  photos: PhotoSlotRN[];
  onPhotosChange: (p: PhotoSlotRN[]) => void;
};

function publicUrl(supabase: SupabaseClient, path: string) {
  const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
  return data.publicUrl;
}

export function PhotoUploadRN({ userId, photos, onPhotosChange }: Props) {
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const [busySlot, setBusySlot] = useState<number | null>(null);

  const promptAt = (i: number) => t(`mobile.wizard.photo_prompt_${i}`);

  const pickAndUpload = async (slotIndex: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("mobile.photo.permission_title"), t("mobile.photo.permission_body"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setBusySlot(slotIndex);
    const uri = result.assets[0].uri;
    const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes((ext || "").toLowerCase())
      ? ext.toLowerCase()
      : "jpg";
    const filePath = `${userId}/${Date.now()}-${slotIndex}.${safeExt}`;

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const contentType =
        safeExt === "png"
          ? "image/png"
          : safeExt === "webp"
            ? "image/webp"
            : "image/jpeg";

      const { error: upErr } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, blob, { cacheControl: "3600", upsert: true, contentType });

      if (upErr) throw upErr;

      const slot = photos[slotIndex];
      if (slot?.id) {
        if (slot.storage_path) {
          await supabase.storage.from("profile-photos").remove([slot.storage_path]);
        }
        const { error: uErr } = await supabase
          .from("profile_photos")
          .update({ storage_path: filePath })
          .eq("id", slot.id);
        if (uErr) throw uErr;
        const next = [...photos];
        next[slotIndex] = {
          ...next[slotIndex],
          storage_path: filePath,
          display_order: slotIndex,
          prompt: promptAt(slotIndex),
        };
        onPhotosChange(next);
      } else {
        const { data: row, error: iErr } = await supabase
          .from("profile_photos")
          .insert({
            user_id: userId,
            storage_path: filePath,
            display_order: slotIndex,
            prompt: promptAt(slotIndex),
          })
          .select()
          .single();
        if (iErr) throw iErr;
        const next = [...photos];
        next[slotIndex] = {
          id: row.id,
          storage_path: filePath,
          display_order: slotIndex,
          prompt: promptAt(slotIndex),
        };
        onPhotosChange(next);
      }
    } catch (e) {
      Alert.alert(
        t("profile.photos.upload"),
        e instanceof Error ? e.message : t("profile.photos.upload_failed"),
      );
    } finally {
      setBusySlot(null);
    }
  };

  const photoCount = photos.filter((p) => p.storage_path).length;

  return (
    <View style={styles.wrap}>
      <Text style={styles.counter}>
        {t("mobile.photo.counter", { current: photoCount, max: MAX_PHOTOS })}
      </Text>
      <View style={styles.grid}>
        {photos.map((p, i) => (
          <Pressable
            key={i}
            style={styles.cell}
            onPress={() => void pickAndUpload(i)}
            disabled={busySlot !== null}
          >
            {busySlot === i ? (
              <View style={styles.thumbWrap}>
                <ActivityIndicator color={maakTokens.primary} />
              </View>
            ) : p.storage_path ? (
              <View style={styles.thumbWrap}>
                <Image
                  source={{ uri: publicUrl(supabase, p.storage_path) }}
                  style={styles.thumb}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.thumbWrap}>
                <Text style={styles.plus}>+</Text>
              </View>
            )}
            <Text style={styles.prompt} numberOfLines={2}>
              {promptAt(i)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  counter: { textAlign: "center", fontSize: 14, color: maakTokens.mutedForeground },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  cell: {
    width: "47%",
    aspectRatio: 0.85,
    backgroundColor: maakTokens.muted,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
    overflow: "hidden",
    flexDirection: "column",
    alignItems: "stretch",
    padding: 6,
  },
  /** Fills cell minus prompt so `contain` can show the full photo (letterboxing if needed). */
  thumbWrap: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    borderRadius: maakTokens.radiusMd,
    overflow: "hidden",
    backgroundColor: `${maakTokens.background}E6`,
    justifyContent: "center",
    alignItems: "center",
  },
  thumb: { width: "100%", height: "100%" },
  plus: { fontSize: 36, color: maakTokens.primary },
  prompt: {
    fontSize: 10,
    color: maakTokens.mutedForeground,
    marginTop: 4,
    textAlign: "center",
    flexShrink: 0,
  },
});
