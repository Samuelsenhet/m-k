import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, MapPin, ArrowLeft, Send, MoreVertical, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';
import { cn, getInstagramUsername, getLinkedInUsername } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { ARCHETYPE_INFO, ARCHETYPE_CODES_BY_CATEGORY, CATEGORY_INFO, ArchetypeCode, type PersonalityCategory } from '@/types/personality';
import { getProfilesAuthKey } from '@/lib/profiles';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

interface MatchProfileData {
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  hometown: string | null;
  work: string | null;
  height: string | null;
  education?: string | null;
  gender?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
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

interface MatchProfileViewProps {
  userId: string;
  matchId?: string;
  matchScore?: number;
  /** AI explanation for why this match is likhet/motsatt – shown as comment on matching */
  personalityInsight?: string | null;
  onBack?: () => void;
  onLike?: () => void;
  onPass?: () => void;
}

const CATEGORY_STYLES: Record<string, { className: string; label: string }> = {
  DIPLOMAT: { className: 'badge-diplomat', label: 'Diplomat' },
  STRATEGER: { className: 'badge-strateger', label: 'Strateg' },
  BYGGARE: { className: 'badge-byggare', label: 'Byggare' },
  UPPTÄCKARE: { className: 'badge-upptackare', label: 'Upptäckare' },
};

export function MatchProfileView({ 
  userId, 
  matchId,
  matchScore,
  onBack
}: MatchProfileViewProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<MatchProfileData | null>(null);
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [archetype, setArchetype] = useState<string | null>(null);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const sheetTouchStartY = useRef<number>(0);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      const profileKey = await getProfilesAuthKey(userId);
      const [profileRes, photosRes, archetypeRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, bio, date_of_birth, hometown, work, height, instagram, linkedin, education, gender, id_verification_status, dating_intention, dating_intention_extra, relationship_type, relationship_type_extra, interested_in')
          .eq(profileKey, userId)
          .single(),
        supabase
          .from('profile_photos')
          .select('*')
          .eq('user_id', userId)
          .order('display_order'),
        supabase
          .from('personality_results')
          .select('archetype')
          .eq('user_id', userId)
          .maybeSingle()
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      if (photosRes.data) {
        setPhotos(photosRes.data.filter(p => p.storage_path));
      }

      if (archetypeRes.data?.archetype) {
        setArchetype(archetypeRes.data.archetype);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching match profile:', error);
      toast.error(t('common.error') + '. ' + t('common.retry'));
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

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

  const archetypeInfo = archetype ? ARCHETYPE_INFO[archetype as ArchetypeCode] : null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
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
          onClick={() => onBack ? onBack() : navigate(-1)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-black/60 transition-colors" aria-label={t('report.report_user')}>
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem onClick={() => navigate(`/report?userId=${encodeURIComponent(userId)}&context=profile`)} className="cursor-pointer">
              <AlertCircle className="w-4 h-4 mr-2" />
              {t('report.report_user')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                  onClick={prevPhoto}
                  className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                  aria-label="Föregående foto"
                />
                <button
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
            <p className="text-lg">Inga foton</p>
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
              
              {profile?.hometown && (
                <p className="text-sm text-white/80 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.hometown}
                </p>
              )}

              {/* Personality Badge – same as ProfileView: category + archetype style */}
              {archetypeInfo && (
                <div className="mt-2">
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-semibold border border-white/30",
                    CATEGORY_STYLES[archetypeInfo.category]?.className || 'bg-white/20 text-white'
                  )}>
                    {CATEGORY_INFO[archetypeInfo.category].emoji} {CATEGORY_INFO[archetypeInfo.category].title}
                  </span>
                </div>
              )}

              {/* Matchning – match score (keep in matching profile) */}
              {matchScore != null && (
                <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/20">
                  <span className="text-sm font-medium text-white/80">Matchning</span>
                  <span className="text-xl font-bold text-rose-400">{matchScore}%</span>
                </div>
              )}

              {/* AI explanation: why likhet/motsatt – visible directly in profile (no need to open "Visa mer") */}
              {personalityInsight && (
                <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/25 shadow-lg shadow-black/10 backdrop-blur-sm">
                  <p className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/30 text-primary-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    {t('chat.why_you_matched', 'Varför ni matchade')}
                  </p>
                  <p className="text-xs text-white/90 leading-relaxed line-clamp-3 pl-9">{personalityInsight}</p>
                </div>
              )}

              {/* Progress indicator */}
              <div className="flex gap-1 mt-3">
                <div className="h-1 flex-1 bg-white rounded-full" />
                <div className="h-1 flex-1 bg-white/40 rounded-full" />
                <div className="h-1 flex-1 bg-white/40 rounded-full" />
              </div>

              {/* Expand button */}
              <button
                onClick={() => setShowFullInfo(!showFullInfo)}
                className="mt-3 w-full flex items-center justify-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <ChevronUp className={cn("w-5 h-5 transition-transform", showFullInfo && "rotate-180")} />
                <span className="text-sm font-medium">{showFullInfo ? 'Dölj' : 'Visa mer'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Info Section – same structure and behaviour as ProfileView */}
        {showFullInfo && (
          <div
            className="absolute bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl rounded-t-3xl max-h-[70vh] overflow-y-auto overflow-x-hidden animate-slide-up overscroll-contain"
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="p-6 space-y-6 pb-safe-bottom">
              {/* Drag handle – tap or swipe down to close (same as ProfileView) */}
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

              {/* Intressen */}
              {profile?.interested_in && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{t('profile.interests_title', 'Intressen')}</h2>
                  <p className="text-white/80 leading-relaxed">{profile.interested_in}</p>
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

              {/* AI comment: why likhet/motsatt – attractive card */}
              {personalityInsight && (
                <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-card">
                  <p className="flex items-center gap-2 text-base font-bold text-primary mb-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    {t('chat.why_you_matched', 'Varför ni matchade')}
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-10">{personalityInsight}</p>
                </div>
              )}

              {/* Matchning – match score (keep this in matching profile) */}
              {matchScore != null && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-white/10">
                  <span className="text-sm font-medium text-muted-foreground">Matchning</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                    {matchScore}%
                  </span>
                </div>
              )}

              {/* Personality Section – same order as ProfileView: 1. Main category, 2. Four archetypes grid, 3. Their archetype card */}
              {archetypeInfo && (
                <div className="space-y-4">
                  {/* 1. En huvudkategori */}
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

                  {/* 2. Fyra arketyper – grid with their type highlighted */}
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">{t('personality.four_archetypes_label', 'Fyra arketyper')}</h2>
                    <p className="text-sm text-white/70 mb-3">{t('personality.four_archetypes_sub', 'Olika sidor av personligheten – deras typ är markerad')}</p>
                    <p className="text-sm text-white/90 mb-3 font-medium">
                      {t('personality.test_result_line', 'Deras typ: {{title}} ({{code}}) – 1 av 4 i {{category}}.', {
                        title: archetypeInfo.title,
                        code: archetypeInfo.name,
                        category: CATEGORY_INFO[archetypeInfo.category].title,
                      })}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {ARCHETYPE_CODES_BY_CATEGORY[archetypeInfo.category as PersonalityCategory].map((code) => {
                        const info = ARCHETYPE_INFO[code];
                        const style = CATEGORY_STYLES[archetypeInfo.category];
                        const isMatchArchetype = archetype === code;
                        return (
                          <div
                            key={code}
                            className={cn(
                              'p-3 rounded-xl border flex items-center gap-2',
                              style?.className || 'bg-white/10 border-white/20',
                              isMatchArchetype && 'ring-2 ring-white/50'
                            )}
                          >
                            <span className="text-2xl">{info.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-white truncate">
                                {info.title}
                                {isMatchArchetype && (
                                  <span className="ml-1 text-xs font-normal text-white/80">({t('personality.their_type', 'deras typ')})</span>
                                )}
                              </p>
                              <p className="text-xs text-white/70">{info.name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Deras arketyp – full card (same as "Din arketyp" in ProfileView) */}
                  <div>
                    <h2 className="text-xl font-bold text-white mb-3">{t('personality.their_archetype_card', 'Deras arketyp')}</h2>
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
                {profile?.hometown && (
                  <div>
                    <p className="text-xs text-white/60 mb-1">Plats</p>
                    <p className="text-white font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.hometown}
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

              {/* Chatta CTA – same position as "Redigera profil" in ProfileView */}
              {matchId && (
                <Button
                  onClick={() => navigate(`/chat?match=${matchId}`)}
                  className="w-full bg-primary text-white hover:bg-primary/90 h-12 rounded-full font-medium [&_svg]:text-white gap-2"
                >
                  <Send className="w-4 h-4" />
                  Chatta
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Message Button - Bottom Right (only if matched) */}
        {matchId && (
          <div className="absolute right-4 bottom-24 z-20">
            <button 
              onClick={() => navigate(`/chat?match=${matchId}`)}
              className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-glow-primary hover:opacity-90 transition-all active:scale-95"
            >
              <Send className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
