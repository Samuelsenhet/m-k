import { useSupabase } from "@/contexts/SupabaseProvider";
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
const MAX_VIDEO_DURATION = 30; // seconds
const MAX_VIDEO_SIZE_MB = 50;

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
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("mobile.photo.permission_title"), t("mobile.photo.permission_body"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.85,
      videoMaxDuration: MAX_VIDEO_DURATION,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const isVideo = asset.type === "video";

    // Validate video duration
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

    try {
      // Build FormData with the local file URI - works reliably for both
      // images and videos on iOS (fetch(uri).blob() returns 0 bytes for videos).
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: filePath.split("/").pop() ?? `upload.${safeExt}`,
        type: contentType,
      } as unknown as Blob);

      // Upload via raw fetch to Supabase Storage REST API (supports FormData)
      const bucketUrl = supabase.storage.from("profile-photos").getPublicUrl("").data.publicUrl.replace("/object/public/profile-photos/", "");
      const uploadUrl = `${bucketUrl}/object/profile-photos/${filePath}`;
      const session = (await supabase.auth.getSession()).data.session;

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          "x-upsert": "true",
          "cache-control": "3600",
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errBody = await uploadRes.text();
        throw new Error(errBody || `Upload failed: ${uploadRes.status}`);
      }

      const upErr: { message: string } | null = null;

      if (upErr) throw upErr;

      const slot = photos[slotIndex];
      if (slot?.id) {
        if (slot.storage_path) {
          await supabase.storage.from("profile-photos").remove([slot.storage_path]);
        }
        const { error: uErr } = await supabase
          .from("profile_photos")
          .update({ storage_path: filePath, media_type: mediaType })
          .eq("id", slot.id);
        if (uErr) throw uErr;
        const next = [...photos];
        next[slotIndex] = {
          ...next[slotIndex],
          storage_path: filePath,
          display_order: slotIndex,
          prompt: promptAt(slotIndex),
          media_type: mediaType,
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
            media_type: mediaType,
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
          media_type: mediaType,
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

  const removePhoto = async (slotIndex: number) => {
    const slot = photos[slotIndex];
    if (!slot?.storage_path || !slot.id) return;
    setBusySlot(slotIndex);
    try {
      await supabase.storage.from("profile-photos").remove([slot.storage_path]);
      await supabase.from("profile_photos").delete().eq("id", slot.id);
      const next = [...photos];
      next[slotIndex] = { storage_path: "", display_order: slotIndex, prompt: "" };
      onPhotosChange(next);
    } catch (e) {
      if (__DEV__) console.error("[PhotoUploadRN] remove:", e);
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
