export type ThirdPartyService = {
  id: string;
  name: string;
  purposeKey: string;
  privacyUrl: string;
};

export const THIRD_PARTY_SERVICES: readonly ThirdPartyService[] = [
  {
    id: "supabase",
    name: "Supabase",
    purposeKey: "shared_data.services.supabase_purpose",
    privacyUrl: "https://supabase.com/privacy",
  },
  {
    id: "twilio",
    name: "Twilio",
    purposeKey: "shared_data.services.twilio_purpose",
    privacyUrl: "https://www.twilio.com/legal/privacy",
  },
  {
    id: "resend",
    name: "Resend",
    purposeKey: "shared_data.services.resend_purpose",
    privacyUrl: "https://resend.com/legal/privacy-policy",
  },
  {
    id: "revenuecat",
    name: "RevenueCat",
    purposeKey: "shared_data.services.revenuecat_purpose",
    privacyUrl: "https://www.revenuecat.com/privacy",
  },
  {
    id: "posthog",
    name: "PostHog",
    purposeKey: "shared_data.services.posthog_purpose",
    privacyUrl: "https://posthog.com/privacy",
  },
  {
    id: "openai",
    name: "OpenAI",
    purposeKey: "shared_data.services.openai_purpose",
    privacyUrl: "https://openai.com/policies/privacy-policy",
  },
] as const;
