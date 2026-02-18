import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { MapPin, User, Pencil, ChevronUp, Settings } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/verified-badge';
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
} from '@/components/ui-v2';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
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
  const [matchCount, setMatchCount] = useState(0);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const sheetTouchStartY = useRef<number>(0);

  const archetypeInfo = archetype ? ARCHETYPE_INFO[archetype as ArchetypeCode] : null;
  const profileEmptyMascot = useMascot(MASCOT_SCREEN_STATES.PROFILE_EMPTY);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const profileKey = await getProfilesAuthKey(user.id);
    const [profileRes, photosRes, matchesRes] = await Promise.all([
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
      supabase
        .from('matches')
        .select('id', { count: 'exact' })
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .eq('status', 'mutual')
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
      if (matchesRes.count !== null) {
        setMatchCount(matchesRes.count);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching profile:', error);
      toast.error(t('profile.load_error', 'Kunde inte ladda profilen. Försök igen.'), {
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

  const formatHeight = (height: string | null) => {
    if (!height) return null;
    const cm = parseInt(height);
    if (isNaN(cm)) return null;
    return `${cm} cm`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-warm-dark flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden />
      </div>
    );
  }

  const age = calculateAge(profile?.date_of_birth || null);
  const height = formatHeight(profile?.height);
  const interestsList = parseInterests(profile?.interested_in);
  const archetypeKey = archetypeInfo ? toArchetypeKey(archetypeInfo.category) : undefined;

  return (
    <div className="fixed inset-0 bg-warm-dark overflow-y-auto overflow-x-hidden">
      {/* Top bar: Settings + Edit (avatar) */}
      <div className="sticky top-0 left-0 right-0 z-20 flex justify-between items-center p-4 pt-safe-top bg-warm-dark/80 backdrop-blur-sm border-b border-white/10">
        <ButtonIcon
          size="default"
          onClick={onSettings}
          className="rounded-full border border-border bg-card/80 text-foreground hover:bg-muted"
          aria-label={t('settings.title')}
        >
          <Settings className="w-5 h-5" />
        </ButtonIcon>
        <button
          type="button"
          onClick={onEdit}
          className="w-12 h-12 rounded-full border-2 border-border bg-card/80 overflow-hidden shrink-0 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-warm-dark"
          aria-label={t('profile.edit_profile')}
        >
          {photos.length > 0 ? (
            <img src={getPublicUrl(photos[0].storage_path)} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-muted-foreground mx-auto mt-2.5" />
          )}
        </button>
      </div>

      {/* Hero: profile image 3:4 */}
      <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
        {photos.length > 0 ? (
          <>
            <img
              src={getPublicUrl(photos[currentPhotoIndex].storage_path)}
              alt={profile?.display_name || 'Profilfoto'}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                  {photos.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-all',
                        index === currentPhotoIndex ? 'bg-primary' : 'bg-white/40'
                      )}
                      aria-hidden
                    />
                  ))}
                </div>
                <button type="button" onClick={prevPhoto} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" aria-label="Föregående foto" />
                <button type="button" onClick={nextPhoto} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" aria-label="Nästa foto" />
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-warm-dark/90 text-muted-foreground p-6">
            <Mascot {...profileEmptyMascot} className="mb-4" />
            <p className="text-base font-medium text-foreground mb-3">Inga foton ännu</p>
            <ButtonPrimary onClick={onEdit} className="gap-2">
              <Pencil className="w-4 h-4" />
              Lägg till foto
            </ButtonPrimary>
          </div>
        )}
      </div>

      {/* Content on warm-dark: use primary-foreground for legibility */}
      <div className="p-4 pb-8 space-y-4 text-primary-foreground">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {profile?.display_name || 'Ingen namn'}
            {profile?.id_verification_status === 'approved' && (
              <VerifiedBadge size="md" className="shrink-0 text-primary-foreground" />
            )}
          </h1>
          {age != null && (
            <span className="text-primary-foreground/80">
              {height ? `${age} · ${height}` : `${age} år`}
            </span>
          )}
        </div>
        {archetypeKey && (
          <ArchetypeBadge archetype={archetypeKey} className="shrink-0 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground" />
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm text-primary-foreground/80">
          {profile?.id_verification_status === 'approved' && <span>Verifierad</span>}
          {matchCount > 0 && <span>{matchCount} {matchCount === 1 ? 'match' : 'matcher'}</span>}
        </div>
        {profile?.bio ? (
          <section>
            <h2 className="text-sm font-semibold mb-1">Om mig</h2>
            <p className="text-primary-foreground/90 leading-relaxed">{profile.bio}</p>
          </section>
        ) : (
          <section className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-4 flex flex-col items-center text-center">
            <Mascot {...profileEmptyMascot} className="mb-2" />
            <p className="text-sm text-primary-foreground/80 mb-2">Lägg till en bio så andra får veta mer om dig.</p>
            <ButtonGhost onClick={onEdit} size="sm" className="gap-2 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
              <Pencil className="w-4 h-4" /> {t('profile.edit_profile')}
            </ButtonGhost>
          </section>
        )}
        {interestsList.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold mb-2">{t('profile.interests_title', 'Intressen')}</h2>
            <div className="flex flex-wrap gap-2">
              {interestsList.map((label) => (
                <InterestChipV2 key={label} label={label} variant="dark" className="border-primary-foreground/20 text-primary-foreground" />
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-4 flex flex-col items-center text-center">
            <Mascot {...profileEmptyMascot} className="mb-2" />
            <p className="text-sm text-primary-foreground/80 mb-2">Lägg till intressen så matchningar blir enklare.</p>
            <ButtonGhost onClick={onEdit} size="sm" className="gap-2 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
              <Pencil className="w-4 h-4" /> {t('profile.edit_profile')}
            </ButtonGhost>
          </section>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <ButtonPrimary onClick={onEdit} className="w-full gap-2">
            <Pencil className="w-4 h-4" /> {t('profile.edit_profile')}
          </ButtonPrimary>
          <button
            type="button"
            onClick={() => setShowFullInfo(!showFullInfo)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-primary-foreground/80 hover:text-primary-foreground transition-colors rounded-md border border-primary-foreground/20 hover:bg-primary-foreground/10"
          >
            <ChevronUp className={cn('w-5 h-5 shrink-0 transition-transform', showFullInfo && 'rotate-180')} />
            <span className="text-sm font-medium">{showFullInfo ? 'Dölj' : 'Visa mer'}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Info Section - Expandable (Visa mer) */}
      {showFullInfo && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 bg-card border-t border-border rounded-t-3xl max-h-[70vh] overflow-y-auto overflow-x-hidden animate-slide-up overscroll-contain shadow-elevation-2"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="p-6 space-y-6 pb-safe-bottom">
            <div
              className="flex justify-center pt-2 pb-4 cursor-grab active:cursor-grabbing touch-manipulation"
              onClick={() => setShowFullInfo(false)}
              onTouchStart={(e) => { sheetTouchStartY.current = e.touches[0].clientY; }}
              onTouchEnd={(e) => {
                const endY = e.changedTouches[0].clientY;
                if (endY - sheetTouchStartY.current > 50) setShowFullInfo(false);
              }}
              role="button"
              tabIndex={0}
              aria-label="Dra ner för att stänga"
              onKeyDown={(e) => e.key === 'Enter' && setShowFullInfo(false)}
            >
              <div className="w-12 h-1 bg-muted-foreground/40 rounded-full pointer-events-none" />
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
              {profile?.instagram && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Instagram</p>
                  <a href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                    {profile.instagram.startsWith('@') ? profile.instagram : `@${profile.instagram}`}
                  </a>
                </div>
              )}
              {profile?.linkedin && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">LinkedIn</p>
                  <a href={`https://linkedin.com/in/${getLinkedInUsername(profile.linkedin)}`} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                    {profile.linkedin.startsWith('@') ? profile.linkedin : `@${profile.linkedin}`}
                  </a>
                </div>
              )}
            </div>

            <ButtonPrimary onClick={onEdit} className="w-full gap-2 h-12">
              <Pencil className="w-4 h-4" />
              {t('profile.edit_profile')}
            </ButtonPrimary>
          </div>
        </div>
      )}
    </div>
  );
}
