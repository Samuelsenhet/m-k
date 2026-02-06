import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, MapPin, ArrowLeft, Send, MoreVertical, ChevronUp, AlertCircle } from 'lucide-react';
import { cn, getInstagramUsername, getLinkedInUsername } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { ARCHETYPE_INFO, ARCHETYPE_CODES_BY_CATEGORY, CATEGORY_INFO, ArchetypeCode, type PersonalityCategory } from '@/types/personality';
import { getProfilesAuthKey } from '@/lib/profiles';
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
}

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
}

interface MatchProfileViewProps {
  userId: string;
  matchId?: string;
  onBack?: () => void;
  onLike?: () => void;
  onPass?: () => void;
}

export function MatchProfileView({ 
  userId, 
  matchId,
  onBack
}: MatchProfileViewProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MatchProfileData | null>(null);
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [archetype, setArchetype] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      const profileKey = await getProfilesAuthKey(userId);
      const [profileRes, photosRes, archetypeRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, bio, date_of_birth, hometown, work, height, instagram, linkedin, education, gender, id_verification_status')
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
      setLoading(false);
    }
  }, [userId]);

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

  const getUsername = () => {
    const name = profile?.display_name || '';
    if (!name) return '@user';
    return `@${name.toLowerCase().replace(/\s+/g, '_')}`;
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
              
              <p className="text-sm text-blue-400 font-medium">
                {getUsername()}
              </p>
              {(profile?.instagram || profile?.linkedin) && (
                <p className="text-sm text-white/80 font-medium">
                  {[
                    profile?.instagram && `Instagram ${profile.instagram.startsWith('@') ? profile.instagram : `@${profile.instagram}`}`,
                    profile?.linkedin && `LinkedIn ${profile.linkedin.startsWith('@') ? profile.linkedin : `@${profile.linkedin}`}`,
                  ].filter(Boolean).join(' · ')}
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

              {/* Personality Badge */}
              {archetypeInfo && (
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                    {archetypeInfo.emoji} {archetypeInfo.title}
                  </span>
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

        {/* Scrollable Info Section - Expandable */}
        {showFullInfo && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl rounded-t-3xl max-h-[70vh] overflow-y-auto overflow-x-hidden animate-slide-up overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="p-6 space-y-6 pb-safe-bottom">
              {/* Drag indicator */}
              <div className="flex justify-center pt-2 pb-4">
                <div className="w-12 h-1 bg-white/30 rounded-full" />
              </div>

              {/* Bio Section */}
              {profile?.bio && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Om mig</h2>
                  <p className="text-white/80 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Personality Section */}
              {archetypeInfo && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-3">Personlighetstyp</h2>
                    <div className="p-4 rounded-2xl border bg-white/10 border-white/20">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-4xl">{archetypeInfo.emoji}</span>
                        <div>
                          <h3 className="text-xl font-bold text-white">{archetypeInfo.title}</h3>
                          <p className="text-sm text-white/70">{archetypeInfo.name}</p>
                        </div>
                      </div>
                      <p className="text-white/80 mb-4">{archetypeInfo.description}</p>
                      
                      {/* Strengths */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-white/90 mb-2">Stärkor</h4>
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

                      {/* Love Style */}
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
