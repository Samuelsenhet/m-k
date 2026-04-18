import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens } from "@maak/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VerificationIntroRN } from "./VerificationIntroRN";
import { VerificationTipsRN } from "./VerificationTipsRN";
import { VerificationHowItWorksRN } from "./VerificationHowItWorksRN";
import { VerificationConsentRN } from "./VerificationConsentRN";
import { VerificationCameraRN } from "./VerificationCameraRN";
import { VerificationPendingRN } from "./VerificationPendingRN";
import { MascotAssets } from "@/lib/mascotAssets";
import { Ionicons } from "@expo/vector-icons";

type Step = "loading" | "intro" | "tips" | "how" | "consent" | "camera" | "pending" | "already";

type Props = {
  onDone: () => void;
  onSkip: () => void;
};

export function VerificationWizardRN({ onDone, onSkip }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const [step, setStep] = useState<Step>("loading");
  const [, setSelfieUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Block re-runs: once approved or pending, the wizard is a read-only status screen.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        if (!cancelled) setStep("intro");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id_verification_status")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setStep("intro");
        return;
      }
      const status = data?.id_verification_status;
      if (status === "approved") setStep("already");
      else if (status === "pending") setStep("pending");
      else setStep("intro");
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [supabase, session?.user?.id]);

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

      if (!session.access_token) throw new Error("No active session");

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
      const message = e instanceof Error ? e.message : String(e);
      // FunctionsHttpError wraps the non-2xx Response in `context`. Read the
      // body so we can see what the edge function actually returned — this is
      // the difference between "upload failed" (useless) and the exact Postgres
      // error (diagnoseable).
      let detail = "";
      try {
        const ctx = (e as { context?: unknown })?.context;
        if (ctx && typeof (ctx as Response).text === "function") {
          detail = await (ctx as Response).text();
        } else if (ctx) {
          detail = typeof ctx === "string" ? ctx : JSON.stringify(ctx);
        }
      } catch {
        /* ignore body-read errors */
      }
      if (__DEV__) {
        console.error("[VerificationWizard] upload:", e, "\ndetail:", detail);
      }
      try {
        const { posthog } = await import("@/lib/posthog");
        posthog.capture("verification_upload_failed", {
          error_message: message,
          error_detail: detail || null,
          user_id: session?.user?.id,
        });
      } catch {
        // posthog may be a no-op shim in some environments; don't swallow the user-facing alert.
      }
      Alert.alert(
        t("mobile.verification.upload_error_title"),
        __DEV__ && detail
          ? `${t("mobile.verification.upload_error_body")}\n\nDEV: ${detail.slice(0, 500)}`
          : t("mobile.verification.upload_error_body"),
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

      {step === "loading" && (
        <View style={styles.centered}>
          <ActivityIndicator color={maakTokens.primary} />
        </View>
      )}
      {step === "already" && (
        <View style={styles.centered}>
          <Image
            source={MascotAssets.waitingTea}
            style={styles.mascot}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Ionicons
            name="shield-checkmark"
            size={32}
            color={maakTokens.primary}
            style={{ marginBottom: 8 }}
          />
          <Text style={styles.alreadyTitle}>
            {t("mobile.verification.already_verified_title")}
          </Text>
          <Text style={styles.alreadyBody}>
            {t("mobile.verification.already_verified_body")}
          </Text>
          <Pressable style={styles.alreadyCta} onPress={onDone}>
            <Text style={styles.alreadyCtaText}>
              {t("mobile.verification.done")}
            </Text>
          </Pressable>
        </View>
      )}
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  mascot: { width: 120, height: 120, marginBottom: 16 },
  alreadyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: maakTokens.foreground,
    textAlign: "center",
  },
  alreadyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    maxWidth: 300,
    marginBottom: 24,
  },
  alreadyCta: {
    alignSelf: "stretch",
    backgroundColor: maakTokens.primary,
    borderRadius: maakTokens.radius2xl,
    paddingVertical: 16,
    alignItems: "center",
  },
  alreadyCtaText: {
    color: maakTokens.primaryForeground,
    fontSize: 16,
    fontWeight: "700",
  },
});
