import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, MapPin, ImagePlus, HelpCircle, User, Pencil, ChevronUp, Settings } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { useTranslation } from 'react-i18next';
import { cn, getInstagramUsername, getLinkedInUsername } from '@/lib/utils';
import { ARCHETYPE_INFO, ARCHETYPE_CODES_BY_CATEGORY, CATEGORY_INFO, ArchetypeCode, type PersonalityCategory } from '@/types/personality';
import { getProfilesAuthKey } from '@/lib/profiles';

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  hometown: string | null;
  country: string | null;
  work: string | null;
  height: string | null;
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

// Category color mapping using design system
const CATEGORY_STYLES: Record<string, { className: string; label: string }> = {
  DIPLOMAT: { className: 'badge-diplomat', label: 'Diplomat' },
  STRATEGER: { className: 'badge-strateger', label: 'Strateg' },
  BYGGARE: { className: 'badge-byggare', label: 'Byggare' },
  UPPTÄCKARE: { className: 'badge-upptackare', label: 'Upptäckare' },
};

// Get traits from archetype info
const getArchetypeTraits = (archetype: string) => {
  const info = ARCHETYPE_INFO[archetype as ArchetypeCode];
  if (!info) return [];
  
  return info.strengths.map((strength, i) => ({
    trait: strength,
    primary: i < 2,
    category: info.category,
  }));
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

  const fetchData = useCallback(async () => {
    if (!user) return;

    const profileKey = await getProfilesAuthKey(user.id);
    const [profileRes, photosRes, matchesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, bio, date_of_birth, hometown, country, work, height, instagram, linkedin')
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
      <div className="fixed inset-0 bg-black animate-pulse">
        <div className="w-full h-full bg-muted" />
      </div>
    );
  }

  const age = calculateAge(profile?.date_of_birth || null);
  const height = formatHeight(profile?.height);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 pt-safe-top">
        <button
          type="button"
          onClick={onSettings}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={t('settings.title')}
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 overflow-hidden shrink-0 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={t('profile.edit_profile')}
        >
          {photos.length > 0 ? (
            <img
              src={getPublicUrl(photos[0].storage_path)}
              alt="Profile"
              className="w-full h-full object-cover object-center scale-110"
            />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Main Photo Section - Full Screen */}
      <div className="relative w-full h-full">
        {photos.length > 0 ? (
          <>
            <img
              src={getPublicUrl(photos[currentPhotoIndex].storage_path)}
              alt={profile?.display_name || 'Profilfoto'}
              className="w-full h-full object-cover"
            />
            
            {/* Photo indicators */}
            {photos.length > 1 && (
              <div className="absolute top-20 left-4 right-4 flex gap-1 z-10">
                {photos.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all",
                      index === currentPhotoIndex 
                        ? "bg-white" 
                        : "bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Navigation areas for swiping */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                  aria-label="Föregående foto"
                />
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
                  aria-label="Nästa foto"
                />
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 bg-gradient-to-br from-gray-900 to-black">
            <Camera className="w-20 h-20 mb-4 opacity-40" />
            <p className="text-lg">Inga foton ännu</p>
            <Button
              onClick={onEdit}
              variant="outline"
              className="mt-4 border-white/20 text-white hover:bg-white/10"
            >
              <ImagePlus className="w-4 h-4 mr-2" />
              Lägg till foto
            </Button>
          </div>
        )}

        {/* User Info Overlay - Bottom Left */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-24">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 max-w-[75%]">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  {profile?.display_name || 'Ingen namn'}
                  {profile?.id_verification_status === 'approved' && (
                    <VerifiedBadge size="md" className="text-white shrink-0" />
                  )}
                </h1>
                {age && height && (
                  <span className="text-xl text-white/90">
                    {age} | {height}
                  </span>
                )}
                {age && !height && (
                  <span className="text-xl text-white/90">{age}</span>
                )}
              </div>
              
              {(profile?.instagram || profile?.linkedin) && (
                <p className="text-sm text-white/80 font-medium flex flex-wrap items-center gap-x-1 gap-y-0.5">
                  {profile?.instagram && (
                    <a
                      href={`https://instagram.com/${getInstagramUsername(profile.instagram)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Instagram {profile.instagram.startsWith('@') ? profile.instagram : `@${profile.instagram}`}
                    </a>
                  )}
                  {profile?.instagram && profile?.linkedin && <span>·</span>}
                  {profile?.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${getLinkedInUsername(profile.linkedin)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      LinkedIn {profile.linkedin.startsWith('@') ? profile.linkedin : `@${profile.linkedin}`}
                    </a>
                  )}
                </p>
              )}
              
              {profile?.work && (
                <p className="text-base text-white/90 font-medium">
                  {profile.work}
                </p>
              )}
              
              {(profile?.hometown || profile?.country) && (
                <p className="text-sm text-white/80 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[profile.hometown, profile.country && COUNTRY_LABELS[profile.country]].filter(Boolean).join(', ')}
                </p>
              )}

              {/* Personality Badge – huvudkategori (inte arketyp) */}
              {archetypeInfo && (
                <div className="mt-2">
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/30",
                    CATEGORY_STYLES[archetypeInfo.category]?.className || 'bg-white/20'
                  )}>
                    {CATEGORY_INFO[archetypeInfo.category].emoji} {CATEGORY_INFO[archetypeInfo.category].title}
                  </span>
                </div>
              )}

              {/* Edit profile + Expand */}
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  onClick={onEdit}
                  variant="outline"
                  size="sm"
                  className="w-full border-white/40 bg-black/50 text-white hover:bg-black/60 hover:text-white"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  {t('profile.edit_profile')}
                </Button>
                <button
                  onClick={() => setShowFullInfo(!showFullInfo)}
                  className="w-full flex items-center justify-center gap-2 text-white/80 hover:text-white transition-colors py-2"
                >
                  <ChevronUp className={cn("w-5 h-5 shrink-0 transition-transform", showFullInfo && "rotate-180")} />
                  <span className="text-sm font-medium">{showFullInfo ? 'Dölj' : 'Visa mer'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Scrollable Info Section - Expandable */}
      {showFullInfo && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl rounded-t-3xl max-h-[70vh] overflow-y-auto overflow-x-hidden animate-slide-up overscroll-contain"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="p-6 space-y-6 pb-safe-bottom">
            {/* Drag handle – tap or swipe down to close */}
            <div
              className="flex justify-center pt-2 pb-4 cursor-grab active:cursor-grabbing touch-manipulation"
              onClick={() => setShowFullInfo(false)}
              onTouchStart={(e) => {
                sheetTouchStartY.current = e.touches[0].clientY;
              }}
              onTouchEnd={(e) => {
                const endY = e.changedTouches[0].clientY;
                if (endY - sheetTouchStartY.current > 50) setShowFullInfo(false);
              }}
              role="button"
              tabIndex={0}
              aria-label="Dra ner för att stänga"
              onKeyDown={(e) => e.key === 'Enter' && setShowFullInfo(false)}
            >
              <div className="w-12 h-1 bg-white/30 rounded-full pointer-events-none" />
            </div>

            {/* Bio Section */}
            {profile?.bio && (
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Om mig</h2>
                <p className="text-white/80 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Dejtingavsikter & Relationstyper */}
            {(profile?.dating_intention || profile?.relationship_type || profile?.dating_intention_extra || profile?.relationship_type_extra) && (
              <div className="space-y-3">
                {profile.dating_intention && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{t('profile.dating_intention_title')}</h2>
                    <p className="text-white/90 font-medium">
                      {t(('profile.dating_' + profile.dating_intention) as 'profile.dating_livspartner')}
                    </p>
                    {profile.dating_intention_extra && (
                      <p className="text-white/80 text-sm mt-1">{profile.dating_intention_extra}</p>
                    )}
                  </div>
                )}
                {profile.relationship_type && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{t('profile.relationship_type_title')}</h2>
                    <p className="text-white/90 font-medium">
                      {t(('profile.relation_' + profile.relationship_type) as 'profile.relation_monogam')}
                    </p>
                    {profile.relationship_type_extra && (
                      <p className="text-white/80 text-sm mt-1">{profile.relationship_type_extra}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Personality Section – 1. En huvudkategori  2. Fyra arketyper (PDF metod) */}
            {archetypeInfo && (
              <div className="space-y-4">
                {/* 1. En huvudkategori – din primära förbindelsestil */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{t('personality.main_category_label', '1. En huvudkategori')}</h2>
                  <p className="text-sm text-white/70 mb-2">{t('personality.main_category_sub', 'Din primära förbindelsestil')}</p>
                  <div className={cn(
                    "p-4 rounded-2xl border flex items-center gap-3",
                    CATEGORY_STYLES[archetypeInfo.category]?.className || 'bg-white/10 border-white/20'
                  )}>
                    <span className="text-4xl">{CATEGORY_INFO[archetypeInfo.category].emoji}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{CATEGORY_INFO[archetypeInfo.category].title}</h3>
                      <p className="text-sm text-white/80">{CATEGORY_INFO[archetypeInfo.category].description}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Fyra arketyper – olika sidor av din personlighet */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{t('personality.four_archetypes_label', 'Fyra arketyper')}</h2>
                  <p className="text-sm text-white/70 mb-3">{t('personality.four_archetypes_sub', 'Olika sidor av din personlighet – din typ är markerad')}</p>
                  <p className="text-sm text-white/90 mb-3 font-medium">
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
                            'p-3 rounded-xl border flex items-center gap-2',
                            style?.className || 'bg-white/10 border-white/20',
                            isUserArchetype && 'ring-2 ring-white/50'
                          )}
                        >
                          <span className="text-2xl">{info.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate">
                              {info.title}
                              {isUserArchetype && (
                                <span className="ml-1 text-xs font-normal text-white/80">({t('personality.your_type', 'din typ')})</span>
                              )}
                            </p>
                            <p className="text-xs text-white/70">{info.name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Din arketyp – full kort (Personlighetstyp) */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-3">{t('personality.your_archetype_card', 'Din arketyp')}</h2>
                  <div className={cn(
                    "p-4 rounded-2xl border",
                    CATEGORY_STYLES[archetypeInfo.category]?.className || 'bg-white/10 border-white/20'
                  )}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{archetypeInfo.emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{archetypeInfo.title}</h3>
                        <p className="text-sm text-white/70">{archetypeInfo.name}</p>
                      </div>
                    </div>
                    <p className="text-white/80 mb-4">{archetypeInfo.description}</p>
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-white/90 mb-2">{t('profile.strengths', 'Styrkor')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {archetypeInfo.strengths.map((strength, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20"
                          >
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-sm text-white/70">
                        <span className="font-semibold text-white">I relationer:</span> {archetypeInfo.loveStyle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4">
              {profile?.work && (
                <div>
                  <p className="text-xs text-white/60 mb-1">Jobb</p>
                  <p className="text-white font-medium">{profile.work}</p>
                </div>
              )}
              {profile?.education && (
                <div>
                  <p className="text-xs text-white/60 mb-1">Utbildning</p>
                  <p className="text-white font-medium">{profile.education}</p>
                </div>
              )}
              {(profile?.hometown || profile?.country) && (
                <div>
                  <p className="text-xs text-white/60 mb-1">Plats</p>
                  <p className="text-white font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[profile.hometown, profile.country && COUNTRY_LABELS[profile.country]].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {age && (
                <div>
                  <p className="text-xs text-white/60 mb-1">Ålder</p>
                  <p className="text-white font-medium">{age} år</p>
                </div>
              )}
              {height && (
                <div>
                  <p className="text-xs text-white/60 mb-1">Längd</p>
                  <p className="text-white font-medium">{height}</p>
                </div>
              )}
              {profile?.gender && (
                <div>
                  <p className="text-xs text-white/60 mb-1">Kön</p>
                  <p className="text-white font-medium">{profile.gender}</p>
                </div>
              )}
              {profile?.instagram && (
                <div>
                  <p className="text-xs text-white/60 mb-1">Instagram</p>
                  <a
                    href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium text-blue-400 hover:underline"
                  >
                    {profile.instagram.startsWith('@') ? profile.instagram : `@${profile.instagram}`}
                  </a>
                </div>
              )}
              {profile?.linkedin && (
                <div>
                  <p className="text-xs text-white/60 mb-1">LinkedIn</p>
                  <a
                    href={`https://linkedin.com/in/${getLinkedInUsername(profile.linkedin)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium text-blue-400 hover:underline"
                  >
                    {profile.linkedin.startsWith('@') ? profile.linkedin : `@${profile.linkedin}`}
                  </a>
                </div>
              )}
            </div>

            {/* Edit Button */}
            <Button
              onClick={onEdit}
              className="w-full bg-primary text-white hover:bg-primary/90 h-12 rounded-full font-medium [&_svg]:text-white"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Redigera profil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
