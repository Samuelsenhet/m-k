import { useSupabase } from "@/contexts/SupabaseProvider";
import { i18n } from "@/lib/i18n";
import { useCallback, useState } from "react";

export type PhoneAuthStep = "phone" | "verify" | "profile";

export function usePhoneAuth() {
  const { supabase, hasValidSupabaseConfig } = useSupabase();
  const [step, setStep] = useState<PhoneAuthStep>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhoneE164 = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return `+46${digits.slice(1)}`;
    if (digits.startsWith("46")) return `+${digits}`;
    return `+46${digits}`;
  };

  const handleError = useCallback((err: unknown, fallback: string) => {
    if (__DEV__) console.error("Phone auth error:", err);
    let errorMessage = fallback;
    if (err instanceof Error) {
      errorMessage = err.message;
      if (err.message.includes("fetch") || err.message.includes("network")) {
        errorMessage = i18n.t("mobile.phone_errors.network");
      } else if (err.message.includes("environment variables")) {
        errorMessage = i18n.t("mobile.phone_errors.config_env");
      }
    } else if (typeof err === "string") {
      errorMessage = err;
    }
    setError(errorMessage);
    return false;
  }, []);

  const sendOtp = async (phone: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    if (!hasValidSupabaseConfig) {
      setError(i18n.t("mobile.phone_errors.not_configured"));
      setLoading(false);
      return false;
    }

    try {
      const formattedPhone = formatPhoneE164(phone);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { shouldCreateUser: true },
      });

      if (otpError) {
        const msg = otpError.message || i18n.t("mobile.phone_errors.send_otp_failed");
        const lower = msg.toLowerCase();
        if (lower.includes("captcha")) {
          throw new Error(i18n.t("mobile.phone_errors.captcha"));
        }
        // Only match explicit GoTrue "phone off" messages - do not use broad "provider"
        // (Twilio/SMS config errors often contain "provider" and were mislabeled as Phone off).
        if (
          lower.includes("phone provider is disabled") ||
          lower.includes("phone auth is disabled")
        ) {
          throw new Error(i18n.t("mobile.phone_errors.phone_disabled"));
        }
        if (
          lower.includes("signups not allowed") ||
          lower.includes("signup not allowed") ||
          lower.includes("sign up is disabled") ||
          lower.includes("new users are forbidden")
        ) {
          throw new Error(i18n.t("mobile.phone_errors.phone_signups_disabled"));
        }
        // Twilio 20003 = bad/mismatched Account SID + Auth Token in Supabase Phone settings
        if (/\b20003\b/.test(msg) || lower.includes("errors/20003")) {
          throw new Error(i18n.t("mobile.phone_errors.twilio_auth_failed"));
        }
        throw new Error(msg);
      }

      setStep("verify");
      return true;
    } catch (err) {
      return handleError(err, i18n.t("mobile.phone_errors.send_otp_failed"));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (phone: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    if (!hasValidSupabaseConfig) {
      setError(i18n.t("mobile.phone_errors.not_configured_short"));
      setLoading(false);
      return false;
    }

    try {
      const formattedPhone = formatPhoneE164(phone);
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: "sms",
      });

      if (verifyError) {
        const msg = verifyError.message || i18n.t("mobile.phone_errors.invalid_otp");
        if (msg.toLowerCase().includes("expired")) {
          throw new Error(i18n.t("mobile.phone_errors.code_expired"));
        }
        throw new Error(msg);
      }

      if (!data?.session) {
        throw new Error(i18n.t("auth.no_session_returned"));
      }

      setStep("profile");
      return true;
    } catch (err) {
      return handleError(err, i18n.t("mobile.phone_errors.invalid_otp"));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (phone: string) => sendOtp(phone);
  const clearError = () => setError(null);

  return {
    step,
    loading,
    error,
    setStep,
    sendOtp,
    verifyOtp,
    resendOtp,
    clearError,
    hasValidSupabaseConfig,
  };
}
