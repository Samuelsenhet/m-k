import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  NativeModules,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Lazy-load expo-camera (native module required — not in Expo Go)
const hasCameraModule = !!NativeModules.ExpoCameraView || !!NativeModules.ExponentCamera;
let CameraView: any = null;
let useCameraPermissions: any = null;
try {
  const mod = require("expo-camera");
  CameraView = mod.CameraView;
  useCameraPermissions = mod.useCameraPermissions;
} catch {}

type Props = {
  onCapture: (uri: string) => void;
  onSkip: () => void;
  uploading: boolean;
};

export function VerificationCameraRN({ onCapture, onSkip, uploading }: Props) {
  const { t } = useTranslation();
  const cameraRef = useRef<any>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  // Camera not available (Expo Go)
  if (!CameraView || !useCameraPermissions) {
    return (
      <View style={styles.fallback}>
        <View style={styles.iconCircle}>
          <Ionicons name="camera-outline" size={36} color={maakTokens.primary} />
        </View>
        <Text style={styles.fallbackTitle}>{t("mobile.verification.camera_title")}</Text>
        <Text style={styles.fallbackBody}>{t("mobile.verification.camera_not_available")}</Text>
        <Pressable style={styles.cta} onPress={onSkip}>
          <Text style={styles.ctaText}>{t("mobile.verification.not_now")}</Text>
        </Pressable>
      </View>
    );
  }

  return <CameraInner cameraRef={cameraRef} photo={photo} setPhoto={setPhoto} onCapture={onCapture} onSkip={onSkip} uploading={uploading} />;
}

/** Inner component — only rendered when camera module exists (hooks safe). */
function CameraInner({
  cameraRef,
  photo,
  setPhoto,
  onCapture,
  onSkip,
  uploading,
}: {
  cameraRef: React.MutableRefObject<any>;
  photo: string | null;
  setPhoto: (uri: string | null) => void;
  onCapture: (uri: string) => void;
  onSkip: () => void;
  uploading: boolean;
}) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission?.granted) {
    return (
      <View style={styles.fallback}>
        <View style={styles.iconCircle}>
          <Ionicons name="camera-outline" size={36} color={maakTokens.primary} />
        </View>
        <Text style={styles.fallbackTitle}>{t("mobile.verification.camera_permission_title")}</Text>
        <Text style={styles.fallbackBody}>{t("mobile.verification.camera_permission_body")}</Text>
        <Pressable style={styles.ctaWide} onPress={requestPermission}>
          <Text style={styles.ctaText}>{t("mobile.verification.grant_permission")}</Text>
        </Pressable>
        <Pressable onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>{t("mobile.verification.not_now")}</Text>
        </Pressable>
      </View>
    );
  }

  // Preview mode — user took a photo
  if (photo) {
    return (
      <View style={styles.previewRoot}>
        <Image source={{ uri: photo }} style={styles.previewImage} resizeMode="cover" />
        <View style={styles.previewOverlay}>
          {uploading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <View style={styles.previewActions}>
              <Pressable style={styles.retakeBtn} onPress={() => setPhoto(null)}>
                <Ionicons name="refresh" size={22} color={maakTokens.foreground} />
                <Text style={styles.retakeText}>{t("mobile.verification.retake")}</Text>
              </Pressable>
              <Pressable style={styles.cta} onPress={() => onCapture(photo)}>
                <Text style={styles.ctaText}>{t("mobile.verification.use_photo")}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Camera mode
  const takePicture = async () => {
    if (!cameraRef.current) return;
    const result = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (result?.uri) setPhoto(result.uri);
  };

  return (
    <View style={styles.cameraRoot}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mirror
      />
      {/* Oval guide overlay */}
      <View style={styles.ovalOverlay} pointerEvents="none">
        <View style={styles.oval} />
        <Text style={styles.ovalHint}>{t("mobile.verification.camera_hint")}</Text>
      </View>
      {/* Capture button */}
      <View style={styles.captureRow}>
        <Pressable style={styles.captureBtn} onPress={takePicture}>
          <View style={styles.captureBtnInner} />
        </Pressable>
      </View>
      <Pressable onPress={onSkip} style={styles.skipBtnCamera}>
        <Text style={styles.skipText}>{t("mobile.verification.not_now")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  fallbackTitle: { fontSize: 24, fontWeight: "700", color: maakTokens.foreground, textAlign: "center" },
  fallbackBody: { fontSize: 15, lineHeight: 22, color: maakTokens.mutedForeground, textAlign: "center", maxWidth: 300, marginBottom: 8 },
  cameraRoot: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  ovalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  oval: {
    width: 220,
    height: 300,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.6)",
  },
  ovalHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    marginTop: 16,
    textAlign: "center",
  },
  captureRow: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  skipBtnCamera: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
  },
  previewRoot: { flex: 1, backgroundColor: "#000" },
  previewImage: { flex: 1 },
  previewOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 60,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  previewActions: { gap: 12 },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: maakTokens.radius2xl,
    backgroundColor: maakTokens.card,
  },
  retakeText: { fontSize: 15, fontWeight: "600", color: maakTokens.foreground },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${maakTokens.primary}1A`,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  cta: {
    backgroundColor: maakTokens.primary,
    borderRadius: maakTokens.radius2xl,
    paddingVertical: 16, paddingHorizontal: 32,
    alignItems: "center",
  },
  ctaWide: {
    alignSelf: "stretch",
    backgroundColor: maakTokens.primary,
    borderRadius: maakTokens.radius2xl,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 16,
  },
  ctaText: { color: maakTokens.primaryForeground, fontSize: 16, fontWeight: "700" },
  skipBtn: { paddingVertical: 16, alignItems: "center" },
  skipText: { color: maakTokens.mutedForeground, fontSize: 15 },
});
