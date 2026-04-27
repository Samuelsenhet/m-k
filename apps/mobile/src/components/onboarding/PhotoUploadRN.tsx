import { useSupabase } from "@/contexts/SupabaseProvider";
import { readFileAsBase64 } from "@/lib/readFileAsBytes";
import { maakTokens } from "@maak/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
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
  media_type?: "image" | "video";
}

const MAX_PHOTOS = 6;
const MAX_VIDEO_DURATION = 30;

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "m4v"];

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
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t("mobile.photo.permission_title"), t("mobile.photo.permission_body"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        videoMaxDuration: MAX_VIDEO_DURATION,
        base64: true,
        quality: 0.9,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const isVideo = asset.type === "video";

      if (isVideo && asset.duration && asset.duration / 1000 > MAX_VIDEO_DURATION) {
        Alert.alert(
          t("mobile.photo.video_too_long_title"),
          t("mobile.photo.video_too_long_body", { max: MAX_VIDEO_DURATION }),
        );
        return;
      }

      setBusySlot(slotIndex);
      const uri = asset.uri;
      const ext = uri.split(".").pop()?.split("?")[0] || (isVideo ? "mp4" : "jpg");
      const extLower = (ext || "").toLowerCase();

      let safeExt: string;
      let contentType: string;
      let mediaType: "image" | "video";

      if (VIDEO_EXTENSIONS.includes(extLower)) {
        safeExt = extLower;
        contentType = safeExt === "mov" ? "video/quicktime" : "video/mp4";
        mediaType = "video";
      } else {
        safeExt = IMAGE_EXTENSIONS.includes(extLower) ? extLower : "jpg";
        contentType =
          safeExt === "png" ? "image/png" : safeExt === "webp" ? "image/webp" : "image/jpeg";
        mediaType = "image";
      }

      const filePath = `${userId}/${Date.now()}-${slotIndex}.${safeExt}`;

      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw new Error(t("auth.session_expired"));

      // Upload via storage-proxy edge function. Direct storage.upload to
      // profile-photos returns 403 RLS on this project despite correct
      // policies — platform bug. Edge function validates JWT, then writes
      // via service_role.
      let base64 = asset.base64 ?? "";
      if (!base64) base64 = await readFileAsBase64(uri);
      if (!base64) throw new Error("Kunde inte läsa bildfilen — välj en annan");

      const { error: fnErr } = await supabase.functions.invoke("storage-proxy", {
        body: {
          action: "upload",
          bucket: "profile-photos",
          path: filePath,
          contentType,
          base64,
        },
      });
      if (fnErr) {
        let detail = "";
        try {
          const ctx = (fnErr as { context?: Response }).context;
          if (ctx) detail = await ctx.text();
        } catch {
          /* ignore */
        }
        throw new Error(detail || fnErr.message || t("profile.photos.upload_failed"));
      }

      const { data: existing } = await supabase
        .from("profile_photos")
        .select("id, storage_path")
        .eq("user_id", userId)
        .eq("display_order", slotIndex)
        .maybeSingle();

      if (existing?.storage_path && existing.storage_path !== filePath) {
        // Best-effort; ignore errors so a failed cleanup doesn't break new upload
        await supabase.functions.invoke("storage-proxy", {
          body: {
            action: "remove",
            bucket: "profile-photos",
            paths: [existing.storage_path],
          },
        });
      }

      const { data: row, error: dbErr } = await supabase
        .from("profile_photos")
        .upsert(
          {
            ...(existing?.id ? { id: existing.id } : {}),
            user_id: userId,
            storage_path: filePath,
            display_order: slotIndex,
            prompt: promptAt(slotIndex),
            media_type: mediaType,
          },
          { onConflict: "user_id,display_order" },
        )
        .select()
        .single();
      if (dbErr) throw dbErr;

      const next = [...photos];
      next[slotIndex] = {
        id: row.id,
        storage_path: filePath,
        display_order: slotIndex,
        prompt: promptAt(slotIndex),
        media_type: mediaType,
      };
      onPhotosChange(next);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: unknown }).message)
            : JSON.stringify(e);
      Alert.alert(
        t("profile.photos.upload"),
        msg || t("profile.photos.upload_failed"),
      );
    } finally {
      setBusySlot(null);
    }
  };

  const removePhoto = async (slotIndex: number) => {
    const slot = photos[slotIndex];
    if (!slot?.storage_path || !slot.id) return;
    setBusySlot(slotIndex);
    try {
      await supabase.functions.invoke("storage-proxy", {
        body: {
          action: "remove",
          bucket: "profile-photos",
          paths: [slot.storage_path],
        },
      });
      await supabase.from("profile_photos").delete().eq("id", slot.id);
      const next = [...photos];
      next[slotIndex] = { storage_path: "", display_order: slotIndex, prompt: "", media_type: "image" };
      onPhotosChange(next);
    } catch {
      // removal is best-effort
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
                {p.media_type === "video" ? (
                  <>
                    <View style={styles.videoPlaceholder}>
                      <Ionicons name="videocam" size={28} color={maakTokens.primary} />
                      <Text style={styles.videoLabel}>{t("mobile.photo.video_label")}</Text>
                    </View>
                    <View style={styles.videoBadge}>
                      <Ionicons name="play" size={14} color="#fff" />
                    </View>
                  </>
                ) : (
                  <Image
                    source={{ uri: publicUrl(supabase, p.storage_path) }}
                    style={styles.thumb}
                    resizeMode="contain"
                  />
                )}
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removePhoto(i)}
                  hitSlop={6}
                  accessibilityLabel={t("common.delete")}
                >
                  <Ionicons name="close-circle" size={22} color={maakTokens.destructive} />
                </Pressable>
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
  videoPlaceholder: {
    flex: 1,
    width: "100%",
    backgroundColor: `${maakTokens.primary}14`,
    borderRadius: maakTokens.radiusMd,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  videoLabel: { fontSize: 11, color: maakTokens.mutedForeground, fontWeight: "600" },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 11,
  },
  videoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  plus: { fontSize: 36, color: maakTokens.primary },
  prompt: {
    fontSize: 10,
    color: maakTokens.mutedForeground,
    marginTop: 4,
    textAlign: "center",
    flexShrink: 0,
  },
});
