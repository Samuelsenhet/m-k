import { useSupabase } from "@/contexts/SupabaseProvider";
import { resolveProfilesAuthKey } from "@maak/core";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Match } from "./useMatches";

type SetMatches = React.Dispatch<React.SetStateAction<Match[]>>;

export function useMatchActions(matches: Match[], setMatches: SetMatches) {
  const { supabase, session } = useSupabase();
  const { t } = useTranslation();

  const generateIcebreakers = useCallback(
    async (
      matchId: string,
      userArchetype: string | undefined,
      matchedUserArchetype: string | undefined,
      userName: string,
      matchedUserName: string,
    ) => {
      try {
        const sess = (await supabase.auth.getSession()).data.session;
        const { error: fnError } = await supabase.functions.invoke("generate-icebreakers", {
          body: {
            matchId,
            userArchetype: userArchetype ?? null,
            matchedUserArchetype: matchedUserArchetype ?? null,
            userName,
            matchedUserName,
          },
          headers: sess?.access_token
            ? { Authorization: `Bearer ${sess.access_token}` }
            : undefined,
        });
        if (fnError && __DEV__) console.error("generate-icebreakers:", fnError);
      } catch (e) {
        if (__DEV__) console.error(e);
      }
    },
    [supabase],
  );

  const likeMatch = useCallback(
    async (matchId: string) => {
      const uid = session?.user?.id;
      if (!uid) return;
      try {
        const { error: updateError } = await supabase
          .from("matches")
          .update({ status: "liked" })
          .eq("id", matchId);
        if (updateError) throw updateError;

        const match = matches.find((m) => m.id === matchId);
        if (match) {
          const { data: reverseMatch, error: reverseError } = await supabase
            .from("matches")
            .select("*")
            .eq("user_id", match.matchedUser.userId)
            .eq("matched_user_id", uid)
            .eq("status", "liked")
            .maybeSingle();
          if (reverseError) throw reverseError;

          if (reverseMatch) {
            await supabase.from("matches").update({ status: "mutual" }).eq("id", matchId);
            await supabase.from("matches").update({ status: "mutual" }).eq("id", reverseMatch.id);

            const profileKey = await resolveProfilesAuthKey(supabase, uid);
            const { data: userProfileResult } = await supabase
              .from("profiles")
              .select("display_name")
              .eq(profileKey, uid)
              .single();

            void generateIcebreakers(
              matchId,
              match.matchedUser.archetype ?? undefined,
              match.matchedUser.archetype ?? undefined,
              userProfileResult?.display_name || t("common.user"),
              match.matchedUser.displayName,
            );

            setMatches((prev) =>
              prev.map((m) => (m.id === matchId ? { ...m, status: "active_chat" } : m)),
            );
            return;
          }
        }

        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? { ...m, status: "pending_intro" } : m)),
        );
      } catch (e) {
        if (__DEV__) console.error("likeMatch:", e);
      }
    },
    [session?.user?.id, supabase, matches, setMatches, generateIcebreakers, t],
  );

  const passMatch = useCallback(
    async (matchId: string) => {
      try {
        const { error: updateError } = await supabase
          .from("matches")
          .update({ status: "passed" })
          .eq("id", matchId);
        if (updateError) throw updateError;
        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? { ...m, status: "expired_no_intro" } : m)),
        );
      } catch (e) {
        if (__DEV__) console.error("passMatch:", e);
      }
    },
    [supabase, setMatches],
  );

  return { likeMatch, passMatch, generateIcebreakers };
}
