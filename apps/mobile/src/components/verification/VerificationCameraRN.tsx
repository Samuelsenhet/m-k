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

// Lazy-load expo-camera (native module required - not in Expo Go)
const hasCameraModule = !!NativeModules.ExpoCameraView || !!NativeModules.ExponentCamera;
let CameraView: any = null;
let useCameraPermissions: any = null;
try {
  const mod = require("expo-camera");
  CameraView = mod.CameraView;
  useCameraPermissions = mod.useCameraPermissions;
} catch {}

// Lazy-load expo-image-manipulator — required to bake EXIF orientation into
// pixels for front-camera selfies. If the binary predates this dep, fall
// back to the raw URI (photo still captured, just possibly rotated).
let ImageManipulator: any = null;
try {
  ImageManipulator = require("expo-image-manipulator");
} catch {}

type Props = {
  onCapture: (uri: string) => void;
  onSkip: () => void;
  uploading: boolean;
};

type CapturedPhoto = {
  uri: string;
  /**
   * True when ImageManipulator was unavailable and the raw URI is used.
   * RN <Image> ignores EXIF orientation, so front-camera iOS selfies render
   * 90° sideways — we compensate with a CSS transform on the preview.
   * (The uploaded file still has EXIF orientation baked in, which browsers
   * and the moderator dashboard respect correctly.)
   */
  needsCssRotation: boolean;
};

export function VerificationCameraRN({ onCapture, onSkip, uploading }: Props) {
  const { t } = useTranslation();
  const cameraRef = useRef<any>(null);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);

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

/** Inner component - only rendered when camera module exists (hooks safe). */
function CameraInner({
  cameraRef,
  photo,
  setPhoto,
  onCapture,
  onSkip,
  uploading,
}: {
  cameraRef: React.MutableRefObject<any>;
  photo: CapturedPhoto | null;
  setPhoto: (photo: CapturedPhoto | null) => void;
  onCapture: (uri: string) => void;
  onSkip: () => void;
  uploading: boolean;
}) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [frameSize, setFrameSize] = useState<{ w: number; h: number } | null>(null);

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

  // Preview mode - user took a photo
  if (photo) {
    return (
      <View style={styles.previewRoot}>
        <View style={styles.previewHeaderRow}>
          <Text style={styles.previewHeaderTitle}>
            {t("mobile.verification.preview_title", { defaultValue: "Ser bilden rätt ut?" })}
          </Text>
          <Text style={styles.previewHeaderHint}>
            {t("mobile.verification.preview_hint", {
              defaultValue: "Ditt ansikte ska vara tydligt synligt och upprätt.",
            })}
          </Text>
        </View>
        <View
          style={styles.previewFrame}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) setFrameSize({ w: width, h: height });
          }}
        >
          {photo.needsCssRotation && frameSize ? (
            // Raw EXIF-oriented image: swap dimensions (H×W) so after the
            // 90° CSS rotation the image exactly fills the portrait frame.
            // Offset centers the pre-rotation landscape box inside the frame.
            <Image
              source={{ uri: photo.uri }}
              style={{
                position: "absolute",
                width: frameSize.h,
                height: frameSize.w,
                left: (frameSize.w - frameSize.h) / 2,
                top: (frameSize.h - frameSize.w) / 2,
                transform: [{ rotate: "90deg" }],
              }}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={{ uri: photo.uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          )}
        </View>
        <View style={styles.previewActionRow}>
          {uploading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Pressable style={styles.retakeBtn} onPress={() => setPhoto(null)}>
                <Ionicons name="refresh" size={22} color={maakTokens.foreground} />
                <Text style={styles.retakeText}>{t("mobile.verification.retake")}</Text>
              </Pressable>
              <Pressable style={styles.cta} onPress={() => onCapture(photo.uri)}>
                <Text style={styles.ctaText}>{t("mobile.verification.use_photo")}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  }

  // Camera mode
  const takePicture = async () => {
    if (!cameraRef.current) return;
    const raw = await cameraRef.current.takePictureAsync({ quality: 0.9, exif: false });
    if (!raw?.uri) return;
    // <Image> ignores EXIF orientation, so front-camera iOS selfies render sideways.
    // manipulateAsync with no actions rewrites the file with orientation baked into pixels.
    // If the native module isn't in this binary yet (old dev-client / Expo Go),
    // fall back to the raw URI and mark the photo as needing a CSS rotation on preview.
    if (ImageManipulator?.manipulateAsync) {
      try {
        const normalized = await ImageManipulator.manipulateAsync(
          raw.uri,
          [],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
        );
        setPhoto({ uri: normalized.uri, needsCssRotation: false });
        return;
      } catch (e) {
        if (__DEV__) console.warn("[VerificationCamera] manipulateAsync failed:", e);
      }
    }
    setPhoto({ uri: raw.uri, needsCssRotation: true });
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
    width: 240,
    height: 320,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.85)",
  },
  ovalHint: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captureRow: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  skipBtnCamera: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
  },
  previewRoot: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  previewHeaderRow: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: "center",
  },
  previewHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  previewHeaderHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 6,
    textAlign: "center",
    maxWidth: 300,
  },
  previewFrame: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    marginBottom: 20,
    // Soft green border mirrors the MÄÄK primary token.
    borderWidth: 2,
    borderColor: `${maakTokens.primary}66`,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewActionRow: { gap: 12 },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: maakTokens.radius2xl,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  retakeText: { fontSize: 15, fontWeight: "600", color: "#fff" },
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
