import { useSupabase } from "@/contexts/SupabaseProvider";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type Gate = "loading" | "landing" | "phone-auth" | "onboarding" | "tabs";

export default function IndexGate() {
  const { supabase, session, isReady } = useSupabase();
  const [gate, setGate] = useState<Gate>("loading");

  useEffect(() => {
    if (!isReady) return;

    (async () => {
      if (!session?.user) {
        setGate("landing");
        return;
      }

      const uid = session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, date_of_birth")
        .eq("id", uid)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        setGate("tabs");
        return;
      }
      if (profile?.date_of_birth) {
        setGate("onboarding");
        return;
      }
      setGate("phone-auth");
    })().catch(() => setGate("landing"));
  }, [isReady, session, supabase]);

  if (!isReady || gate === "loading") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </>
    );
  }

  if (gate === "landing") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Redirect href="/landing" />
      </>
    );
  }
  if (gate === "phone-auth") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Redirect href="/phone-auth" />
      </>
    );
  }
  if (gate === "onboarding") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Redirect href="/onboarding" />
      </>
    );
  }
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Redirect href="/(tabs)" />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
