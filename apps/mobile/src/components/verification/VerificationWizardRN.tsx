import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens } from "@maak/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VerificationIntroRN } from "./VerificationIntroRN";
import { VerificationTipsRN } from "./VerificationTipsRN";
import { VerificationHowItWorksRN } from "./VerificationHowItWorksRN";
import { VerificationConsentRN } from "./VerificationConsentRN";
import { VerificationCameraRN } from "./VerificationCameraRN";
import { VerificationPendingRN } from "./VerificationPendingRN";
import { Ionicons } from "@expo/vector-icons";

type Step = "intro" | "tips" | "how" | "consent" | "camera" | "pending";

type Props = {
  onDone: () => void;
  onSkip: () => void;
};

export function VerificationWizardRN({ onDone, onSkip }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const [step, setStep] = useState<Step>("intro");
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadSelfie = async (uri: string) => {
    if (!session?.user?.id) return;
    setUploading(true);
    try {
      const userId = session.user.id;
      const filePath = `${userId}/selfie-${Date.now()}.jpg`;

      // Upload via FormData (reliable on iOS)
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "selfie.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const bucketUrl = supabase.storage.from("id-documents").getPublicUrl("").data.publicUrl
        .replace("/object/public/id-documents/", "");
      const uploadUrl = `${bucketUrl}/object/id-documents/${filePath}`;

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "x-upsert": "true",
        },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

      // Call initiate-verification. Without checking `error` here the wizard
      // used to silently advance to "pending" even when the edge function
      // rejected the selfie, leaving the user stuck in an indefinite spinner.
      const { error: fnError } = await supabase.functions.invoke(
        "initiate-verification",
        {
          body: { selfiePath: filePath },
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      if (fnError) throw fnError;

      setStep("pending");
    } catch (e) {
      if (__DEV__) console.error("[VerificationWizard] upload:", e);
      Alert.alert(
        t("mobile.verification.upload_error_title"),
        t("mobile.verification.upload_error_body"),
      );
      // Stay on the camera step so the user can retake and retry.
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Close button */}
      <Pressable
        onPress={onSkip}
        hitSlop={12}
        style={styles.closeBtn}
        accessibilityRole="button"
        accessibilityLabel={t("common.close")}
      >
        <Ionicons name="close" size={26} color={maakTokens.foreground} />
      </Pressable>

      {step === "intro" && (
        <VerificationIntroRN
          onContinue={() => setStep("tips")}
          onSkip={onSkip}
        />
      )}
      {step === "tips" && (
        <VerificationTipsRN
          onContinue={() => setStep("how")}
          onSkip={onSkip}
        />
      )}
      {step === "how" && (
        <VerificationHowItWorksRN
          onContinue={() => setStep("consent")}
          onSkip={onSkip}
        />
      )}
      {step === "consent" && (
        <VerificationConsentRN
          onAccept={() => setStep("camera")}
          onSkip={onSkip}
        />
      )}
      {step === "camera" && (
        <VerificationCameraRN
          onCapture={(uri) => {
            setSelfieUri(uri);
            void uploadSelfie(uri);
          }}
          onSkip={onSkip}
          uploading={uploading}
        />
      )}
      {step === "pending" && (
        <VerificationPendingRN onDone={onDone} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  closeBtn: { position: "absolute", top: 56, right: 16, zIndex: 10 },
});
