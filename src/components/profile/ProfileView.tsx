import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { MapPin, User, Pencil, ChevronUp, Settings, Shield, Edit2, Briefcase, GraduationCap, ExternalLink } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui-v2';
import { COLORS } from '@/design/tokens';
import { useTranslation } from 'react-i18next';
import { cn, getInstagramUsername, getLinkedInUsername } from '@/lib/utils';
import { ARCHETYPE_INFO, ARCHETYPE_CODES_BY_CATEGORY, CATEGORY_INFO, ArchetypeCode, type PersonalityCategory } from '@/types/personality';
import { getProfilesAuthKey } from '@/lib/profiles';
import { toast } from 'sonner';
import {
  ButtonPrimary,
  ButtonGhost,
  ButtonIcon,
  ArchetypeBadge,
  InterestChipV2,
  LoadingStateWithMascot,
} from '@/components/ui-v2';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
import { useEmotionalState } from '@/hooks/useEmotionalState';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';
import type { ArchetypeKey } from '@/components/ui-v2/badge';

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

/** Map API category to ui-v2 ArchetypeKey */
function toArchetypeKey(category: string | undefined): ArchetypeKey | undefined {
  if (!category) return undefined;
  const key = category.toLowerCase();
  if (key === 'diplomat' || key === 'strateger' || key === 'byggare' || key === 'upptackare') return key;
  return undefined;
}

/** Parse interested_in string to array of labels for InterestChipV2 */
function parseInterests(interestedIn: string | null | undefined): string[] {
  if (!interestedIn || typeof interestedIn !== 'string') return [];
  return interestedIn.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
}

/** Safe height formatter: never call .trim() on non-string. */
function formatHeightSafe(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return `${value} cm`;
  return "";
}

// Category styling for expandable "Visa mer" section (token-aligned where possible)
const CATEGORY_STYLES: Record<string, { className: string; label: string }> = {
  DIPLOMAT: { className: 'bg-personality-diplomat/20 text-personality-diplomat border-personality-diplomat/30', label: 'Diplomat' },
  STRATEGER: { className: 'bg-personality-strateger/20 text-personality-strateger border-personality-strateger/30', label: 'Strateg' },
  BYGGARE: { className: 'bg-personality-byggare/20 text-personality-byggare border-personality-byggare/30', label: 'Byggare' },
  UPPTÄCKARE: { className: 'bg-personality-upptackare/20 text-personality-upptackare border-personality-upptackare/30', label: 'Upptäckare' },
};

export function ProfileView({ onEdit, archetype, onSettings }: ProfileViewProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFullInfo, setShowFullInfo] = useState(false);

  const archetypeInfo = archetype ? ARCHETYPE_INFO[archetype as ArchetypeCode] : null;
  const emotionalConfig = { screen: "profile" as const };
  const { surfaceClass: emotionalSurfaceClass } = useEmotionalState(emotionalConfig);

  const fetchData = useCallback(async () => {
    if (!user) return;

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
    } catch (error) {
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
  const heightDisplay = formatHeightSafe(profile?.height);
  const height = heightDisplay ? (heightDisplay.endsWith(" cm") ? heightDisplay : `${heightDisplay} cm`) : null;
  const interestsList = parseInterests(profile?.interested_in);
  const archetypeKey = archetypeInfo ? toArchetypeKey(archetypeInfo.category) : undefined;
  const locationLabel = [profile?.hometown, profile?.country && COUNTRY_LABELS[profile.country]].filter(Boolean).join(', ') || null;

  return (
    <div className={cn("overflow-x-hidden rounded-2xl", emotionalSurfaceClass)} style={{ background: COLORS.neutral.dark }}>
      {/* Photo section – design system: gradient overlay transparent → dark; show full image with center focus */}
      <div className="relative min-h-[18rem] h-72 rounded-t-2xl overflow-hidden">
        {photos.length > 0 ? (
          <>
            <img
              src={getPublicUrl(photos[currentPhotoIndex].storage_path)}
              alt={profile?.display_name || 'Profilfoto'}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            {photos.length > 1 && (
              <button type="button" onClick={prevPhoto} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" aria-label={t('profile.prev_photo', 'Föregående foto')} />
            )}
            {photos.length > 1 && (
              <button type="button" onClick={nextPhoto} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" aria-label={t('profile.next_photo', 'Nästa foto')} />
            )}
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${COLORS.sage[300]} 0%, ${COLORS.sage[200]} 100%)` }}
          >
            <span className="text-7xl" aria-hidden>{archetypeInfo?.emoji ?? '👤'}</span>
            <p className="mt-2 text-sm font-medium" style={{ color: COLORS.neutral.dark }}>Inga foton ännu</p>
            <ButtonPrimary onClick={onEdit} className="mt-3 gap-2">
              <Pencil className="w-4 h-4" />
              Lägg till foto
            </ButtonPrimary>
          </div>
        )}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${COLORS.neutral.dark} 0%, transparent 60%)` }}
        />
        {/* Top actions – glass variant */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
          <ButtonIcon
            size="sm"
            variant="glass"
            onClick={onSettings}
            aria-label={t('settings.title')}
          >
            <Settings className="w-4 h-4" />
          </ButtonIcon>
          <ButtonIcon
            size="sm"
            variant="glass"
            onClick={onEdit}
            aria-label={t('profile.edit_profile')}
          >
            <Edit2 className="w-4 h-4" />
          </ButtonIcon>
        </div>
        {/* Photo indicator dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5 z-10">
            {photos.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all"
                style={{
                  width: i === currentPhotoIndex ? 24 : 8,
                  background: i === currentPhotoIndex ? COLORS.neutral.white : 'rgba(255,255,255,0.4)',
                }}
                aria-hidden
              />
            ))}
          </div>
        )}
      </div>

      {/* Content – design system: text below image, no overlap */}
      <div className="px-6 pt-6 relative z-10 pb-8">
        {/* Name, age, height, Shield (verified) */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-white">
                {profile?.display_name || 'Ditt namn'}
                {age != null && `, ${age}`}
                {formatHeightSafe(profile?.height) && ` | ${formatHeightSafe(profile?.height)}`}
              </h1>
              {profile?.id_verification_status === 'approved' && (
                <Shield className="w-5 h-5 shrink-0" style={{ color: COLORS.primary[400] }} aria-hidden />
              )}
            </div>
            {/* Social links – Instagram, LinkedIn */}
            {(String(profile?.instagram ?? '').trim() || String(profile?.linkedin ?? '').trim()) && (
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {String(profile?.instagram ?? '').trim() && (() => {
                  const igUser = getInstagramUsername(String(profile?.instagram ?? ''));
                  const igUrl = `https://instagram.com/${igUser}`;
                  return (
                    <a
                      href={igUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                      style={{ color: COLORS.primary[400] }}
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
                      Instagram @{igUser}
                    </a>
                  );
                })()}
                {String(profile?.linkedin ?? '').trim() && (() => {
                  const liUser = getLinkedInUsername(String(profile?.linkedin ?? ''));
                  const liUrl = `https://linkedin.com/in/${liUser}`;
                  return (
                    <a
                      href={liUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                      style={{ color: COLORS.primary[400] }}
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
                      LinkedIn
                    </a>
                  );
                })()}
              </div>
            )}
            {archetypeKey && (
              <ArchetypeBadge archetype={archetypeKey} className="shrink-0 border-white/20 bg-white/10 text-white" />
            )}
          </div>
        </div>

        {/* Om mig */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-2">{t('profile.about_me', 'Om mig')}</h3>
          <p style={{ color: COLORS.neutral.gray }}>
            {profile?.bio || t('profile.bio_placeholder', 'Lägg till en beskrivning om dig själv...')}
          </p>
        </div>

        {/* Intressen – InterestChipV2 (design system US-016) */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">{t('profile.interests_title', 'Intressen')}</h3>
          <div className="flex flex-wrap gap-2">
            {interestsList.length > 0
              ? interestsList.map((label) => (
                  <InterestChipV2 key={label} label={label} />
                ))
              : (
                  <span className="text-sm" style={{ color: COLORS.neutral.gray }}>Lägg till intressen</span>
                )}
          </div>
        </div>

        {/* Info items – MapPin, Briefcase, GraduationCap */}
        <div className="space-y-3">
          {locationLabel && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 shrink-0" style={{ color: COLORS.neutral.gray }} />
              <span className="text-white">{locationLabel}</span>
            </div>
          )}
          {profile?.work && (
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 shrink-0" style={{ color: COLORS.neutral.gray }} />
              <span className="text-white">{profile.work}</span>
            </div>
          )}
          {profile?.education && (
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 shrink-0" style={{ color: COLORS.neutral.gray }} />
              <span className="text-white">{profile.education}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <ButtonPrimary onClick={onEdit} className="w-full gap-2">
            <Pencil className="w-4 h-4" /> {t('profile.edit_profile')}
          </ButtonPrimary>
          <button
            type="button"
            onClick={() => setShowFullInfo(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 transition-colors rounded-md"
            style={{ color: COLORS.neutral.gray }}
          >
            <ChevronUp className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Visa mer</span>
          </button>
        </div>
      </div>

      {/* Overlay: Visa mer – Sheet from bottom with backdrop */}
      <Sheet open={showFullInfo} onOpenChange={setShowFullInfo}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-t-3xl border-t border-border bg-card p-0"
        >
          <div className="p-6 space-y-6 pb-safe-bottom">
            <div className="flex justify-center pt-2 pb-4" aria-hidden>
              <div className="w-12 h-1 bg-muted-foreground/40 rounded-full" />
            </div>
            {profile?.bio && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Om mig</h2>
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {(profile?.dating_intention || profile?.relationship_type || profile?.dating_intention_extra || profile?.relationship_type_extra) && (
              <div className="space-y-3">
                {profile.dating_intention && (
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">{t('profile.dating_intention_title')}</h2>
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
                    <h2 className="text-xl font-bold text-foreground mb-1">{t('profile.relationship_type_title')}</h2>
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

            {/* Personality Section – 1. En huvudkategori  2. Fyra arketyper (PDF metod) */}
            {archetypeInfo && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{t('personality.main_category_label', '1. En huvudkategori')}</h2>
                  <p className="text-sm text-muted-foreground mb-2">{t('personality.main_category_sub', 'Din primära förbindelsestil')}</p>
                  <div className={cn(
                    'p-4 rounded-2xl border border-border flex items-center gap-3',
                    CATEGORY_STYLES[archetypeInfo.category]?.className || 'bg-muted/50'
                  )}>
                    <span className="text-4xl">{CATEGORY_INFO[archetypeInfo.category].emoji}</span>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{CATEGORY_INFO[archetypeInfo.category].title}</h3>
                      <p className="text-sm text-muted-foreground">{CATEGORY_INFO[archetypeInfo.category].description}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{t('personality.four_archetypes_label', 'Fyra arketyper')}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{t('personality.four_archetypes_sub', 'Olika sidor av din personlighet – din typ är markerad')}</p>
                  <p className="text-sm text-foreground mb-3 font-medium">
                    {t('personality.test_result_line', 'Din typ från testet: {{title}} ({{code}}) – 1 av 4 i {{category}}.', {
                      title: archetypeInfo.title,
                      code: archetypeInfo.name,
                      category: CATEGORY_INFO[archetypeInfo.category].title,
                    })}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {ARCHETYPE_CODES_BY_CATEGORY[archetypeInfo.category as PersonalityCategory].map((code) => {
                      const info = ARCHETYPE_INFO[code];
                      const style = CATEGORY_STYLES[archetypeInfo.category];
                      const isUserArchetype = archetype === code;
                      return (
                        <div
                          key={code}
                          className={cn(
                            'p-3 rounded-xl border border-border flex items-center gap-2',
                            style?.className || 'bg-muted/50',
                            isUserArchetype && 'ring-2 ring-primary'
                          )}
                        >
                          <span className="text-2xl">{info.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">
                              {info.title}
                              {isUserArchetype && (
                                <span className="ml-1 text-xs font-normal text-muted-foreground">({t('personality.your_type', 'din typ')})</span>
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
                  <h2 className="text-xl font-bold text-foreground mb-3">{t('personality.your_archetype_card', 'Din arketyp')}</h2>
                  <div className={cn(
                    'p-4 rounded-2xl border border-border',
                    CATEGORY_STYLES[archetypeInfo.category]?.className || 'bg-muted/50'
                  )}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{archetypeInfo.emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{archetypeInfo.title}</h3>
                        <p className="text-sm text-muted-foreground">{archetypeInfo.name}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{archetypeInfo.description}</p>
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2">{t('profile.strengths', 'Styrkor')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {archetypeInfo.strengths.map((strength, index) => (
                          <span key={index} className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">I relationer:</span> {archetypeInfo.loveStyle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {profile?.work && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Jobb</p>
                  <p className="text-foreground font-medium">{profile.work}</p>
                </div>
              )}
              {profile?.education && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Utbildning</p>
                  <p className="text-foreground font-medium">{profile.education}</p>
                </div>
              )}
              {(profile?.hometown || profile?.country) && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Plats</p>
                  <p className="text-foreground font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[profile.hometown, profile.country && COUNTRY_LABELS[profile.country]].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {age && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ålder</p>
                  <p className="text-foreground font-medium">{age} år</p>
                </div>
              )}
              {height && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Längd</p>
                  <p className="text-foreground font-medium">{height}</p>
                </div>
              )}
              {profile?.gender && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Kön</p>
                  <p className="text-foreground font-medium">{profile.gender}</p>
                </div>
              )}
              {String(profile?.instagram ?? "").trim() && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Instagram</p>
                  <a href={`https://instagram.com/${String(profile.instagram).replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                    {String(profile.instagram).startsWith('@') ? String(profile.instagram) : `@${String(profile.instagram)}`}
                  </a>
                </div>
              )}
              {String(profile?.linkedin ?? "").trim() && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">LinkedIn</p>
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
