/**
 * Data Router config (createBrowserRouter + loaders/actions).
 *
 * - Root loader: provides session for the app.
 * - Profile loader: prefetches profile + archetype + moderator (use useLoaderData<ProfileLoaderData>() in Profile).
 * - Matches loader: reuses root session.
 * - Report action: POST form data to create a report (use useFetcher + useActionData<ReportActionData>() for form submit).
 */
import {
  createBrowserRouter,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProfilesAuthKey } from "@/lib/profiles";
import { RootLayout } from "@/RootLayout";
import Index from "@/pages/Index";
import PhoneAuth from "@/pages/PhoneAuth";
import Profile from "@/pages/Profile";
import Matches from "@/pages/Matches";
import Chat from "@/pages/Chat";
import Onboarding from "@/pages/Onboarding";
import ViewMatchProfile from "@/pages/ViewMatchProfile";
import DemoSeed from "@/pages/DemoSeed";
import DemoGroupChat from "@/pages/DemoGroupChat";
import PersonalityGuide from "@/pages/PersonalityGuide";
import Notifications from "@/pages/Notifications";
import Terms from "@/pages/Terms";
import Reporting from "@/pages/Reporting";
import About from "@/pages/About";
import ReportHistory from "@/pages/ReportHistory";
import Report from "@/pages/Report";
import Appeal from "@/pages/Appeal";
import AdminReports from "@/pages/AdminReports";
import LaunchChecklist from "@/pages/LaunchChecklist";
import NotFound from "@/pages/NotFound";

// --- Loader/action types for useLoaderData / useActionData ---

export type RootLoaderData = {
  session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];
};

export type ProfileLoaderData = {
  session: RootLoaderData["session"];
  profileData: {
    displayName: string | null;
    archetype: string | null;
    isModerator: boolean;
  } | null;
};

export type ReportActionData = { ok: true } | { ok: false; error: string };

// --- Root loader: session for optional use in layout/children ---

async function rootLoader(): Promise<RootLoaderData> {
  try {
    const { data } = await supabase.auth.getSession();
    return { session: data.session };
  } catch (err) {
    if (import.meta.env.DEV) console.error("Root loader error", err);
    return { session: null };
  }
}

// --- Profile loader: prefetch profile + archetype + moderator ---

async function profileLoader({
  request,
}: LoaderFunctionArgs): Promise<ProfileLoaderData> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user) {
      return { session: null, profileData: null };
    }
    const userId = session.user.id;
    const profileKey = await getProfilesAuthKey(userId);
    const [profileRes, archetypeRes, moderatorRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq(profileKey, userId)
        .maybeSingle(),
      supabase
        .from("personality_results")
        .select("archetype")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("moderator_roles").select("user_id").eq("user_id", userId).maybeSingle(),
    ]);
    const profileData = {
      displayName: profileRes.data?.display_name ?? null,
      archetype: archetypeRes.data?.archetype ?? null,
      isModerator: !!moderatorRes.data,
    };
    return { session, profileData };
  } catch (err) {
    if (import.meta.env.DEV) console.error("Profile loader error", err);
    return { session: null, profileData: null };
  }
}

// --- Report action: submit report form (optional; page can still use inline submit) ---

async function reportAction({
  request,
}: ActionFunctionArgs): Promise<ReportActionData> {
  if (request.method !== "POST") return { ok: false, error: "Method not allowed" };
  const formData = await request.formData();
  const violationType = String(formData.get("violation_type") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const reportedUserId = formData.get("reported_user_id")
    ? String(formData.get("reported_user_id"))
    : null;
  const matchId = formData.get("match_id") ? String(formData.get("match_id")) : null;
  const context = formData.get("context") ? String(formData.get("context")) : "general";

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }
  if (!violationType || !description) {
    return { ok: false, error: "Violation type and description are required" };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    match_id: matchId,
    context,
    violation_type: violationType,
    description,
    evidence_paths: [],
    witness_statement: null,
    status: "pending",
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// --- Router config ---

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    loader: rootLoader,
    errorElement: (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center text-destructive">
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Refresh the page or try again later.
          </p>
        </div>
      </div>
    ),
    children: [
      { index: true, element: <Index /> },
      { path: "phone-auth", element: <PhoneAuth /> },
      { path: "onboarding", element: <Onboarding /> },
      {
        path: "profile",
        element: <Profile />,
        loader: profileLoader,
      },
      {
        path: "matches",
        element: <Matches />,
        loader: async (): Promise<RootLoaderData> => rootLoader(),
      },
      { path: "chat", element: <Chat /> },
      { path: "match/:userId", element: <ViewMatchProfile /> },
      { path: "view-match", element: <ViewMatchProfile /> },
      { path: "demo-seed", element: <DemoSeed /> },
      { path: "demo-samlingar", element: <DemoGroupChat /> },
      { path: "personality-guide", element: <PersonalityGuide /> },
      { path: "notifications", element: <Notifications /> },
      { path: "terms", element: <Terms /> },
      { path: "reporting", element: <Reporting /> },
      { path: "about", element: <About /> },
      { path: "launch-checklist", element: <LaunchChecklist /> },
      { path: "report-history", element: <ReportHistory /> },
      {
        path: "report",
        element: <Report />,
        action: reportAction,
      },
      { path: "appeal", element: <Appeal /> },
      { path: "admin/reports", element: <AdminReports /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
