-- Revoke anon role's table-level GRANTs on public-schema tables that should
-- never be readable without auth. RLS already blocks rows for these, but the
-- default Supabase Data API GRANT exposes column names + types via the
-- /graphql/v1 introspection endpoint (advisor lint pg_graphql_anon_table_exposed).
--
-- Kept public to anon (catalog data with USING true policy):
--   - achievements
--
-- All other public tables: REVOKE ALL FROM anon. Authenticated + service_role
-- grants are untouched.

REVOKE ALL ON TABLE public.achievement_cycles            FROM anon;
REVOKE ALL ON TABLE public.ai_usage                      FROM anon;
REVOKE ALL ON TABLE public.app_logs                      FROM anon;
REVOKE ALL ON TABLE public.appeals                       FROM anon;
REVOKE ALL ON TABLE public.blocked_users                 FROM anon;
REVOKE ALL ON TABLE public.bulk_emails                   FROM anon;
REVOKE ALL ON TABLE public.consents                      FROM anon;
REVOKE ALL ON TABLE public.dealbreakers                  FROM anon;
REVOKE ALL ON TABLE public.email_logs                    FROM anon;
REVOKE ALL ON TABLE public.email_templates               FROM anon;
REVOKE ALL ON TABLE public.expo_push_tokens              FROM anon;
REVOKE ALL ON TABLE public.group_chat_members            FROM anon;
REVOKE ALL ON TABLE public.group_chat_messages           FROM anon;
REVOKE ALL ON TABLE public.group_chats                   FROM anon;
REVOKE ALL ON TABLE public.group_members                 FROM anon;
REVOKE ALL ON TABLE public.group_messages                FROM anon;
REVOKE ALL ON TABLE public.groups                        FROM anon;
REVOKE ALL ON TABLE public.host_profiles                 FROM anon;
REVOKE ALL ON TABLE public.introductions                 FROM anon;
REVOKE ALL ON TABLE public.last_daily_matches            FROM anon;
REVOKE ALL ON TABLE public.match_engagement_scores       FROM anon;
REVOKE ALL ON TABLE public.matches                       FROM anon;
REVOKE ALL ON TABLE public.messages                      FROM anon;
REVOKE ALL ON TABLE public.moderator_roles               FROM anon;
REVOKE ALL ON TABLE public.notifications                 FROM anon;
REVOKE ALL ON TABLE public.personality_results           FROM anon;
REVOKE ALL ON TABLE public.personality_scores            FROM anon;
REVOKE ALL ON TABLE public.privacy_settings              FROM anon;
REVOKE ALL ON TABLE public.profile_photos                FROM anon;
REVOKE ALL ON TABLE public.profile_views                 FROM anon;
REVOKE ALL ON TABLE public.profiles                      FROM anon;
REVOKE ALL ON TABLE public.push_subscriptions            FROM anon;
REVOKE ALL ON TABLE public.reports                       FROM anon;
REVOKE ALL ON TABLE public.subscriptions                 FROM anon;
REVOKE ALL ON TABLE public."träff_rsvp_counts"           FROM anon;
REVOKE ALL ON TABLE public."träff_rsvps"                 FROM anon;
REVOKE ALL ON TABLE public."träffar"                     FROM anon;
REVOKE ALL ON TABLE public.user_achievements             FROM anon;
REVOKE ALL ON TABLE public.user_daily_match_pools        FROM anon;
REVOKE ALL ON TABLE public.user_match_delivery_status    FROM anon;
REVOKE ALL ON TABLE public.user_match_preferences        FROM anon;
REVOKE ALL ON TABLE public.waitlist_signups              FROM anon;
REVOKE ALL ON TABLE public.webhook_events                FROM anon;
