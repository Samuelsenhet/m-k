import { OnboardingWizardRN } from "@/components/onboarding/OnboardingWizardRN";
import { WelcomeScreenRN } from "@/components/onboarding/WelcomeScreenRN";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { usePostHog } from "posthog-react-native";

export default function OnboardingScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const { supabase, session, isReady } = useSupabase();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [displayName, setDisplayName] = useState<string | undefined>();

  const user = session?.user;
  const userId = user?.id;

  const checkOnboardingStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const profileKey = await resolveProfilesAuthKey(supabase, userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed, date_of_birth, display_name")
        .eq(profileKey, userId)
        .maybeSingle();

      if (error || !data) {
        router.replace("/phone-auth");
        setCheckingStatus(false);
        return;
      }

      if (!data.date_of_birth) {
        router.replace("/phone-auth");
        setCheckingStatus(false);
        return;
      }

      if (data.onboarding_completed) {
        router.replace("/(tabs)");
        setCheckingStatus(false);
        return;
      }

      setDisplayName(data.display_name || undefined);
      setCheckingStatus(false);
    } catch {
      router.replace("/phone-auth");
      setCheckingStatus(false);
    }
  }, [router, supabase, userId]);

  useEffect(() => {
    if (!isReady) return;
    if (!userId) {
      router.replace("/phone-auth");
      return;
    }
    void checkOnboardingStatus();
  }, [isReady, userId, router, checkOnboardingStatus]);

  const handleWizardComplete = async () => {
    if (userId) {
      try {
        const profileKey = await resolveProfilesAuthKey(supabase, userId);
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq(profileKey, userId)
          .maybeSingle();
        setDisplayName(data?.display_name?.split(" ")[0] || undefined);
      } catch {
        /* welcome utan förnamn */
      }
    }
    posthog.capture('onboarding_completed');
    setShowWelcome(true);
  };

  const handleWelcomeContinue = () => {
    router.replace("/(tabs)");
  };

  if (!isReady || checkingStatus || !userId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={maakTokens.primary} />
        </View>
      </>
    );
  }

  if (showWelcome) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <WelcomeScreenRN
          userId={userId}
          displayName={displayName}
          onContinue={handleWelcomeContinue}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingWizardRN userId={userId} onComplete={handleWizardComplete} />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: maakTokens.background,
  },
});
