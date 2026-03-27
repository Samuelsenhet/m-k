import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import {
  MapPin,
  Pencil,
  ChevronUp,
  Settings,
  Shield,
  Edit2,
  Briefcase,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import { COLORS } from '@/design/tokens';
import { useTranslation } from 'react-i18next';
import { cn, getInstagramUsername, getLinkedInUsername } from '@/lib/utils';
import { ARCHETYPE_INFO, ARCHETYPE_CODES_BY_CATEGORY, CATEGORY_INFO, ArchetypeCode, type PersonalityCategory } from '@/types/personality';
import { getProfilesAuthKey } from '@/lib/profiles';
import { normalizeArchetypeCode } from '@/lib/normalizeArchetype';
import { toast } from 'sonner';
import { ButtonPrimary, ButtonIcon, InterestChipV2, LoadingStateWithMascot } from '@/components/ui-v2';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useEmotionalState } from '@/hooks/useEmotionalState';

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  hometown: string | null;
  country: string | null;
  work: string | null;
  height: string | null;
  interested_in?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  education?: string | null;
  gender?: string | null;
  id_verification_status?: string | null;
  dating_intention?: string | null;
  dating_intention_extra?: string | null;
  relationship_type?: string | null;
  relationship_type_extra?: string | null;
}

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
}

interface ProfileViewProps {
  onEdit: () => void;
  archetype?: string | null;
  onSettings?: () => void;
}

const COUNTRY_LABELS: Record<string, string> = {
  SE: 'Sverige', NO: 'Norge', DK: 'Danmark', FI: 'Finland', IS: 'Island',
  DE: 'Tyskland', GB: 'Storbritannien', US: 'USA',
};

/** Parse interested_in to labels for InterestChipV2; dedupe case-insensitively. */
function parseInterests(interestedIn: string | null | undefined): string[] {
  if (!interestedIn || typeof interestedIn !== 'string') return [];
  const seen = new Set<string>();
  return interestedIn
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Normalizes height for display (cm). Handles number from DB, strings like "167", "167 cm", "ca 180".
 * Returns digits only; caller appends " cm" once.
 */
function formatHeightSafe(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    const r = Math.round(value);
    return r > 0 ? String(r) : "";
  }
  if (typeof value === "string") {
    const digits = value.replace(/[^\d]/g, "");
    if (!digits) return "";
    const n = parseInt(digits.length > 3 ? digits.slice(0, 3) : digits, 10);
    return !Number.isNaN(n) && n > 0 ? String(n) : "";
  }
  return "";
}

/** Overlapping profile card — reference charcoal. */
const CHARCOAL_CARD = '#1a1a1a';

/**
 * Social links on charcoal: must stay lighter than `text-primary` from :root (forest ~#4B6E48),
 * which has poor contrast on #1a1a1a and looks “unchanged” vs white text. Aligns with IMG_9673 sage link.
 */
const PROFILE_CARD_LINK = COLORS.primary[300];

/** Emoji stack so category glyphs (e.g. 🏗️) don’t pick up serif body fonts (avoids wrong glyph on WebKit). */
const EMOJI_FONT_STACK =
  'ui-sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

function categoryEmojiDisplay(category: PersonalityCategory): string {
  if (category === 'BYGGARE') {
    return `${String.fromCodePoint(0x1f3d7)}\uFE0F`;
  }
  return CATEGORY_INFO[category].emoji;
}

/** Sheet / grid: force emoji font so glyphs don’t inherit Playfair (wrong 🏛️ vs 🏗️ on WebKit). */
function PersonalityEmoji({
  emoji,
  className,
}: {
  emoji: string;
  className?: string;
}) {
  return (
    <span
      className={cn('select-none leading-none', className)}
      style={{ fontFamily: EMOJI_FONT_STACK }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

/** Mint / pastel tiles in “Visa mer” — parity with product screenshots. */
const SHEET_CATEGORY_STYLES: Record<string, { className: string }> = {
  DIPLOMAT: {
    className:
      'bg-[#E8EEFC] text-foreground border border-[rgba(59,130,246,0.35)]',
  },
  STRATEGER: {
    className:
      'bg-[#EDE9FC] text-foreground border border-[rgba(139,92,246,0.35)]',
  },
  BYGGARE: {
    className:
      'bg-[#DCF5E3] text-foreground border border-[rgba(75,110,72,0.45)]',
  },
  UPPTÄCKARE: {
    className:
      'bg-[#FDF3D6] text-foreground border border-[rgba(245,158,11,0.4)]',
  },
};

export function ProfileView({ onEdit, archetype, onSettings }: ProfileViewProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFullInfo, setShowFullInfo] = useState(false);

  const resolvedArchetype = normalizeArchetypeCode(archetype ?? undefined);
  const archetypeInfo = resolvedArchetype ? ARCHETYPE_INFO[resolvedArchetype] : null;
  const emotionalConfig = { screen: "profile" as const };
  const { surfaceClass: emotionalSurfaceClass } = useEmotionalState(emotionalConfig);

  const fetchData = useCallback(async () => {
    if (!user) return;
    // #region agent log
    fetch('http://127.0.0.1:7879/ingest/af153d1e-1223-499f-a1c7-264a1d53c784',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'829c5f'},body:JSON.stringify({sessionId:'829c5f',runId:'run-2',hypothesisId:'H3',location:'src/components/profile/ProfileView.tsx:174',message:'ProfileView fetchData start',data:{onLine:typeof navigator!=='undefined'?navigator.onLine:null,userId:user?.id ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const profileKey = await getProfilesAuthKey(user.id);
    const [profileRes, photosRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, bio, date_of_birth, hometown, country, work, height, interested_in, instagram, linkedin, id_verification_status, education, gender, dating_intention, dating_intention_extra, relationship_type, relationship_type_extra')
        .eq(profileKey, user.id)
        .maybeSingle(),
      supabase
        .from('profile_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order'),
    ]);

    try {
      if (profileRes.error) {
        throw profileRes.error;
      }
      if (profileRes.data) {
        setProfile(profileRes.data);
      }
      if (photosRes.data) {
        setPhotos(photosRes.data.filter(p => p.storage_path));
      }
      // #region agent log
      fetch('http://127.0.0.1:7879/ingest/af153d1e-1223-499f-a1c7-264a1d53c784',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'829c5f'},body:JSON.stringify({sessionId:'829c5f',runId:'run-2',hypothesisId:'H3',location:'src/components/profile/ProfileView.tsx:199',message:'ProfileView fetchData success',data:{hasProfile:!!profileRes.data,photoCount:photosRes.data?.length ?? 0,onLine:typeof navigator!=='undefined'?navigator.onLine:null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      const e = error as { message?: string; code?: string };
      fetch('http://127.0.0.1:7879/ingest/af153d1e-1223-499f-a1c7-264a1d53c784',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'829c5f'},body:JSON.stringify({sessionId:'829c5f',runId:'run-1',hypothesisId:'H3',location:'src/components/profile/ProfileView.tsx:200',message:'ProfileView fetchData catch',data:{message:e?.message ?? String(error),code:e?.code ?? null,onLine:typeof navigator!=='undefined'?navigator.onLine:null,userId:user?.id ?? null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (import.meta.env.DEV) console.error('Error fetching profile:', error);
      const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch';
      const message = isNetworkError
        ? t('profile.network_error', 'Ingen internetanslutning. Kontrollera nätverket och försök igen.')
        : t('profile.load_error', 'Kunde inte ladda profilen. Försök igen.');
      toast.error(message, {
        action: { label: t('common.retry', 'Försök igen'), onClick: () => fetchData() },
      });
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const nextPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-[280px] rounded-2xl border border-border bg-card/80">
        <LoadingStateWithMascot message={t('common.loading')} emotionalConfig={emotionalConfig} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[280px] rounded-2xl border border-border bg-card/80">
        <LoadingStateWithMascot message={t('profile.load_error', 'Kunde inte ladda profilen.')} emotionalConfig={emotionalConfig} />
      </div>
    );
  }

  const age = calculateAge(profile?.date_of_birth || null);
  const heightCm = formatHeightSafe(profile?.height);
  const height = heightCm ? `${heightCm} cm` : null;
  const interestsList = parseInterests(profile?.interested_in);
  const locationLabel =
    [profile?.hometown, profile?.country && COUNTRY_LABELS[profile.country]]
      .filter(Boolean)
      .join(', ') || null;

  const displayName = profile?.display_name || t('profile.placeholder_name', 'Ditt namn');
  const nameAgeHeightLine = (() => {
    const tail = [age != null ? String(age) : null, height].filter(Boolean).join(' | ');
    if (!tail) return displayName;
    return `${displayName}, ${tail}`;
  })();

  /** Dark frosted glass on photo — m-k-backup-style `ButtonIcon` glass; overrides ui-v2 default light `glass` on dark hero. */
  const heroGlassIconClass =
    'border-white/20 bg-black/40 text-white shadow-sm backdrop-blur-md hover:bg-black/50';

  return (
    <div
      className={cn('overflow-x-hidden w-full', emotionalSurfaceClass)}
      style={{ background: COLORS.neutral.dark }}
    >
      <div className="relative w-full min-h-[260px] h-[28rem] max-h-[72vh] overflow-hidden sm:h-[30rem]">
        {photos.length > 0 ? (
          <>
            <img
              src={getPublicUrl(photos[currentPhotoIndex].storage_path)}
              alt={profile?.display_name || 'Profilfoto'}
              // Tailwind `object-position`: shift focus slightly down so more of the profile photo is visible.
              className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
            />
            {photos.length > 1 && (
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                aria-label={t('profile.prev_photo', 'Föregående foto')}
              />
            )}
            {photos.length > 1 && (
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
                aria-label={t('profile.next_photo', 'Nästa foto')}
              />
            )}
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.sage[300]} 0%, ${COLORS.sage[200]} 100%)`,
            }}
          >
            <PersonalityEmoji emoji={archetypeInfo?.emoji ?? '👤'} className="text-7xl" />
            <p className="mt-2 text-sm font-medium" style={{ color: COLORS.neutral.dark }}>
              {t('profile.no_photos_yet', 'Inga foton ännu')}
            </p>
            <ButtonPrimary onClick={onEdit} className="mt-3 gap-2">
              <Pencil className="w-4 h-4" />
              {t('profile.addPhoto', 'Lägg till foto')}
            </ButtonPrimary>
          </div>
        )}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              'linear-gradient(to top, #1a1a1a 0%, rgba(26,26,26,0.72) 22%, rgba(31,30,27,0.2) 52%, transparent 72%)',
          }}
        />
        <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start sm:top-4 sm:left-4 sm:right-4">
          <ButtonIcon
            type="button"
            size="lg"
            variant="glass"
            onClick={() => onSettings?.()}
            aria-label={t('settings.title')}
            className={heroGlassIconClass}
          >
            <Settings strokeWidth={2} />
          </ButtonIcon>
          <ButtonIcon
            type="button"
            size="lg"
            variant="glass"
            onClick={onEdit}
            aria-label={t('profile.edit_profile')}
            className={heroGlassIconClass}
          >
            <Edit2 strokeWidth={2} />
          </ButtonIcon>
        </div>
        {photos.length > 1 && (
          <div
            className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-2"
            aria-hidden
          >
            {photos.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full transition-all',
                  i === currentPhotoIndex ? 'h-1 w-7 bg-white' : 'h-1.5 w-1.5 bg-white/45',
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className="relative z-10 -mt-7 rounded-t-3xl px-5 pt-6 pb-7 shadow-[0_-10px_36px_rgba(0,0,0,0.5)]"
        style={{ backgroundColor: CHARCOAL_CARD }}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="font-heading text-2xl font-bold leading-snug text-white sm:text-[1.65rem]">
              {nameAgeHeightLine}
            </h1>
            {profile?.id_verification_status === 'approved' && (
              <Shield className="h-5 w-5 shrink-0 text-white sm:h-6 sm:w-6" aria-hidden />
            )}
          </div>

          {(String(profile?.instagram ?? '').trim() || String(profile?.linkedin ?? '').trim()) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] font-medium">
              {String(profile?.instagram ?? '').trim() && (
                <a
                  href={`https://instagram.com/${getInstagramUsername(String(profile.instagram))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 underline-offset-2 hover:underline"
                  style={{ color: PROFILE_CARD_LINK }}
                >
                  <ExternalLink className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
                  Instagram @{getInstagramUsername(String(profile.instagram))}
                </a>
              )}
              {String(profile?.linkedin ?? '').trim() && (
                <a
                  href={`https://linkedin.com/in/${getLinkedInUsername(String(profile.linkedin))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 underline-offset-2 hover:underline"
                  style={{ color: PROFILE_CARD_LINK }}
                >
                  <ExternalLink className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
                  LinkedIn
                </a>
              )}
            </div>
          )}

          {archetypeInfo && (
            <div>
              <Badge
                variant="outline"
                className="h-auto gap-2 rounded-full border-white/25 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/25"
              >
                <PersonalityEmoji
                  emoji={categoryEmojiDisplay(archetypeInfo.category)}
                  className="text-[1.05rem]"
                />
                {t(`personality.guide_category_${archetypeInfo.category}_title`, {
                  defaultValue: CATEGORY_INFO[archetypeInfo.category].title,
                })}
              </Badge>
            </div>
          )}

          <div className="space-y-2">
            {locationLabel && (
              <p className="flex items-center gap-2 text-[15px] text-white">
                <MapPin className="h-4 w-4 shrink-0 text-white/75" />
                {locationLabel}
              </p>
            )}
            {profile?.work && (
              <p className="flex items-start gap-2 text-[15px] font-semibold text-white">
                <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-white/75" aria-hidden />
                {profile.work}
              </p>
            )}
            {profile?.education && (
              <p className="flex items-center gap-2 text-[15px] text-white/90">
                <GraduationCap className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
                {profile.education}
              </p>
            )}
          </div>

          {(!height || !String(profile?.work ?? '').trim()) && (
            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
              {!height && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="block w-full text-left text-sm text-white/50 transition-colors hover:text-white/85"
                >
                  {t('profile.add_height_cta')}
                </button>
              )}
              {!String(profile?.work ?? '').trim() && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="block w-full text-left text-sm text-white/50 transition-colors hover:text-white/85"
                >
                  {t('profile.add_work_cta')}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
            <ButtonPrimary onClick={onEdit} fullWidth className="min-h-12 gap-2 rounded-full">
              <Pencil className="h-4 w-4" />
              {t('profile.edit_profile')}
            </ButtonPrimary>
            <button
              type="button"
              onClick={() => setShowFullInfo(true)}
              className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-white/65 transition-colors hover:text-white/90"
            >
              <ChevronUp className="h-4 w-4 shrink-0 opacity-80" />
              {t('profile.show_more', 'Visa mer')}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay: Visa mer – Sheet from bottom with backdrop */}
      <Sheet open={showFullInfo} onOpenChange={setShowFullInfo}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-t-3xl border-t border-black/[0.06] bg-[#FAF9F8] p-0 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
        >
          <div className="space-y-6 p-6 pb-safe-bottom text-foreground">
            <div className="flex justify-center pb-2 pt-1" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-neutral-400/45" />
            </div>
            {/* Om mig – i Visa mer */}
            <div>
              <h2 className="font-heading mb-2 text-xl font-bold text-foreground">{t('profile.about_me', 'Om mig')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {profile?.bio || t('profile.bio_placeholder', 'Berätta något om dig själv...')}
              </p>
            </div>

            {/* Intressen – i Visa mer */}
            <div>
              <h2 className="font-heading mb-2 text-xl font-bold text-foreground">{t('profile.interests_title', 'Intressen')}</h2>
              <div className="flex flex-wrap gap-2">
                {interestsList.length > 0
                  ? interestsList.map((label) => (
                      <InterestChipV2
                        key={label}
                        label={label}
                        variant="default"
                        className="border-[rgba(122,158,136,0.55)] bg-white/90 text-foreground"
                      />
                    ))
                  : (
                      <span className="text-sm text-muted-foreground">{t('profile.interests_empty', 'Lägg till intressen')}</span>
                    )}
              </div>
            </div>

            {(profile?.dating_intention || profile?.relationship_type || profile?.dating_intention_extra || profile?.relationship_type_extra) && (
              <div className="space-y-3">
                {profile.dating_intention && (
                  <div>
                    <h2 className="font-heading mb-1 text-xl font-bold text-foreground">{t('profile.dating_intention_title')}</h2>
                    <p className="text-foreground font-medium">
                      {t(('profile.dating_' + profile.dating_intention) as 'profile.dating_livspartner')}
                    </p>
                    {profile.dating_intention_extra && (
                      <p className="text-muted-foreground text-sm mt-1">{profile.dating_intention_extra}</p>
                    )}
                  </div>
                )}
                {profile.relationship_type && (
                  <div>
                    <h2 className="font-heading mb-1 text-xl font-bold text-foreground">{t('profile.relationship_type_title')}</h2>
                    <p className="text-foreground font-medium">
                      {t(('profile.relation_' + profile.relationship_type) as 'profile.relation_monogam')}
                    </p>
                    {profile.relationship_type_extra && (
                      <p className="text-muted-foreground text-sm mt-1">{profile.relationship_type_extra}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Personality Section – i18n titles/descriptions (not raw CATEGORY_INFO English) */}
            {archetypeInfo && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                    {t("personality.main_category_label", "En huvudkategori")}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("personality.main_category_sub", "Din primära förbindelsestil")}
                  </p>
                  <div
                    className={cn(
                      "p-4 rounded-2xl border border-border flex items-center gap-3",
                      SHEET_CATEGORY_STYLES[archetypeInfo.category]?.className || "bg-muted/50",
                    )}
                  >
                    <PersonalityEmoji
                      emoji={categoryEmojiDisplay(archetypeInfo.category)}
                      className="text-4xl"
                    />
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground">
                        {t(`personality.guide_category_${archetypeInfo.category}_title`, {
                          defaultValue: CATEGORY_INFO[archetypeInfo.category].title,
                        })}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(`personality.guide_category_${archetypeInfo.category}_desc`, {
                          defaultValue: CATEGORY_INFO[archetypeInfo.category].description,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                    {t("personality.four_archetypes_label", "Fyra arketyper")}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t(
                      "personality.four_archetypes_sub",
                      "Olika sidor av din personlighet – din typ är markerad",
                    )}
                  </p>
                  <p className="text-sm text-foreground mb-3 font-medium">
                    {t("personality.test_result_line", {
                      title: t(`personality.archetypes.${resolvedArchetype}.title`, {
                        defaultValue: archetypeInfo.title,
                      }),
                      code: archetypeInfo.name,
                      category: t(`personality.guide_category_${archetypeInfo.category}_title`, {
                        defaultValue: CATEGORY_INFO[archetypeInfo.category].title,
                      }),
                    })}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {ARCHETYPE_CODES_BY_CATEGORY[
                      archetypeInfo.category as PersonalityCategory
                    ].map((code) => {
                      const info = ARCHETYPE_INFO[code];
                      const style = SHEET_CATEGORY_STYLES[archetypeInfo.category];
                      const isUserArchetype = resolvedArchetype === code;
                      return (
                        <div
                          key={code}
                          className={cn(
                            'flex items-center gap-2 rounded-xl p-3',
                            style?.className || 'border border-border bg-muted/50',
                            isUserArchetype &&
                              'border-[3px] !border-[#2d5a3d] shadow-sm ring-0',
                          )}
                        >
                          <PersonalityEmoji emoji={info.emoji} className="text-2xl" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">
                              {t(`personality.archetypes.${code}.title`, {
                                defaultValue: info.title,
                              })}
                              {isUserArchetype && (
                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                  ({t("personality.your_type", "din typ")})
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{info.name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground mb-3">
                    {t("personality.your_archetype_card", "Din arketyp")}
                  </h2>
                  <div
                    className={cn(
                      "p-4 rounded-2xl border border-border",
                      SHEET_CATEGORY_STYLES[archetypeInfo.category]?.className || "bg-muted/50",
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <PersonalityEmoji emoji={archetypeInfo.emoji} className="text-4xl" />
                      <div>
                        <h3 className="font-heading text-xl font-bold text-foreground">
                          {t(`personality.archetypes.${resolvedArchetype}.title`, {
                            defaultValue: archetypeInfo.title,
                          })}
                        </h3>
                        <p className="text-sm text-muted-foreground">{archetypeInfo.name}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {t(`personality.archetypes.${resolvedArchetype}.description`, {
                        defaultValue: archetypeInfo.description,
                      })}
                    </p>
                    <div className="mb-4">
                      <h4 className="font-heading text-sm font-semibold text-foreground mb-2">
                        {t("profile.strengths", "Styrkor")}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const raw = t(
                            `personality.archetypes.${resolvedArchetype}.strengths`,
                            { returnObjects: true },
                          );
                          const list = Array.isArray(raw)
                            ? (raw as string[])
                            : archetypeInfo.strengths;
                          return list.map((strength, index) => (
                            <span
                              key={index}
                              className="rounded-full border border-black/[0.08] bg-white/90 px-3 py-1 text-xs font-medium text-foreground"
                            >
                              {strength}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {t("profile.in_relationships_label", "I relationer:")}
                        </span>{" "}
                        {t(`personality.archetypes.${resolvedArchetype}.loveStyle`, {
                          defaultValue: archetypeInfo.loveStyle,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {profile?.work && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.fact_work", "Jobb")}
                  </p>
                  <p className="text-foreground font-medium">{profile.work}</p>
                </div>
              )}
              {profile?.education && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.fact_education", "Utbildning")}
                  </p>
                  <p className="text-foreground font-medium">{profile.education}</p>
                </div>
              )}
              {(profile?.hometown || profile?.country) && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.fact_location", "Plats")}
                  </p>
                  <p className="text-foreground font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[profile.hometown, profile.country && COUNTRY_LABELS[profile.country]].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
              {age != null && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.fact_age", "Ålder")}
                  </p>
                  <p className="text-foreground font-medium">
                    {t("profile.fact_age_years", { age })}
                  </p>
                </div>
              )}
              {height ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.fact_height", "Längd")}
                  </p>
                  <p className="text-foreground font-medium">{height}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.fact_height", "Längd")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFullInfo(false);
                      onEdit();
                    }}
                    className="text-left text-sm font-medium text-primary hover:underline"
                  >
                    {t("profile.add_height_cta")}
                  </button>
                </div>
              )}
              {!String(profile?.work ?? "").trim() && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.fact_work", "Jobb")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFullInfo(false);
                      onEdit();
                    }}
                    className="text-left text-sm font-medium text-primary hover:underline"
                  >
                    {t("profile.add_work_cta")}
                  </button>
                </div>
              )}
              {profile?.gender && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.fact_gender", "Kön")}
                  </p>
                  <p className="text-foreground font-medium">{profile.gender}</p>
                </div>
              )}
              {String(profile?.instagram ?? "").trim() && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.fact_instagram", "Instagram")}
                  </p>
                  <a href={`https://instagram.com/${String(profile.instagram).replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                    {String(profile.instagram).startsWith('@') ? String(profile.instagram) : `@${String(profile.instagram)}`}
                  </a>
                </div>
              )}
              {String(profile?.linkedin ?? "").trim() && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.fact_linkedin", "LinkedIn")}
                  </p>
                  <a href={`https://linkedin.com/in/${getLinkedInUsername(String(profile.linkedin))}`} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                    {String(profile.linkedin).startsWith('@') ? String(profile.linkedin) : `@${String(profile.linkedin)}`}
                  </a>
                </div>
              )}
            </div>

            <ButtonPrimary onClick={() => { setShowFullInfo(false); onEdit(); }} className="w-full gap-2 h-12">
              <Pencil className="w-4 h-4" />
              {t('profile.edit_profile')}
            </ButtonPrimary>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
