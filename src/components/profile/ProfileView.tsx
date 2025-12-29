import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, MapPin, Pencil, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ARCHETYPE_INFO, ArchetypeCode } from '@/types/personality';

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  hometown: string | null;
}

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
}

interface ProfileViewProps {
  onEdit: () => void;
  archetype?: string | null;
}

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

export function ProfileView({ onEdit, archetype }: ProfileViewProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchCount, setMatchCount] = useState(0);

  const archetypeInfo = archetype ? ARCHETYPE_INFO[archetype as ArchetypeCode] : null;
  const traits = archetype ? getArchetypeTraits(archetype) : [];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [profileRes, photosRes, matchesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, bio, date_of_birth, hometown')
        .eq('user_id', user.id)
        .single(),
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

    if (profileRes.data) {
      setProfile(profileRes.data);
    }

    if (photosRes.data) {
      setPhotos(photosRes.data.filter(p => p.storage_path));
    }

    if (matchesRes.count !== null) {
      setMatchCount(matchesRes.count);
    }

    setLoading(false);
  };

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
      <div className="animate-pulse space-y-4">
        <div className="aspect-[4/5] bg-muted rounded-2xl" />
        <div className="h-8 bg-muted rounded w-1/2" />
      </div>
    );
  }

  const age = calculateAge(profile?.date_of_birth || null);

  return (
    <div className="space-y-4 pb-6">
      {/* Hero Photo Section */}
      <Card className="overflow-hidden rounded-2xl shadow-card">
        <div className="relative aspect-[4/5] bg-gradient-to-br from-rose-100 via-white to-emerald-50">
          {photos.length > 0 ? (
            <>
              <img
                src={getPublicUrl(photos[currentPhotoIndex].storage_path)}
                alt={profile?.display_name || 'Profilfoto'}
                className="w-full h-full object-cover"
              />
              
              {/* Photo indicators */}
              {photos.length > 1 && (
                <div className="absolute top-3 left-3 right-3 flex gap-1">
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

              {/* Navigation areas */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-0 top-0 bottom-0 w-1/3"
                    aria-label="Föregående foto"
                  />
                  <button
                    onClick={nextPhoto}
                    className="absolute right-0 top-0 bottom-0 w-1/3"
                    aria-label="Nästa foto"
                  />
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Camera className="w-16 h-16 mb-2 opacity-40" />
              <p className="text-sm">Foto kommer snart</p>
            </div>
          )}

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 pt-16">
            <h1 className="text-3xl font-serif font-bold text-white">
              {profile?.display_name || 'Ingen namn'}
            </h1>
            <p className="text-white/90 flex items-center gap-2">
              {age && <span>{age} år</span>}
              {age && profile?.hometown && <span>-</span>}
              {profile?.hometown && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.hometown}
                </span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Archetype & Profile Section */}
      {archetypeInfo && (
        <Card className="shadow-soft rounded-2xl">
          <CardContent className="p-5">
            {/* Archetype header with category color */}
            <div className="text-center mb-5">
              <span className="text-4xl mb-2 block">{archetypeInfo.emoji}</span>
              <h2 className="font-serif font-bold text-xl">{archetypeInfo.title}</h2>
              <span className={cn(
                "inline-block px-3 py-1 rounded-full text-xs font-medium mt-2",
                CATEGORY_STYLES[archetypeInfo.category]?.className || 'bg-muted'
              )}>
                {CATEGORY_STYLES[archetypeInfo.category]?.label}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground text-center mb-4">
              {archetypeInfo.description}
            </p>
            
            {/* Strengths as badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {archetypeInfo.strengths.map((strength, index) => (
                <span
                  key={index}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium",
                    CATEGORY_STYLES[archetypeInfo.category]?.className || 'bg-muted'
                  )}
                >
                  {strength}
                </span>
              ))}
            </div>

            {/* Love style */}
            <div className="bg-muted/50 rounded-xl p-3 mb-4">
              <p className="text-xs text-muted-foreground text-center">
                <span className="font-medium text-foreground">I relationer:</span> {archetypeInfo.loveStyle}
              </p>
            </div>

          </CardContent>
        </Card>
      )}

      {/* Bio Section */}
      {profile?.bio && (
        <Card className="shadow-soft rounded-2xl">
          <CardContent className="p-5">
            <h2 className="font-serif font-bold text-lg mb-2">Om mig</h2>
            <p className="text-muted-foreground">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          onClick={onEdit}
          className="w-full h-12 rounded-full bg-gradient-to-r from-rose-400 to-emerald-400 hover:from-rose-500 hover:to-emerald-500 text-white font-medium"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Uppdatera Profil
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onEdit}
          className="w-full h-11 rounded-full"
        >
          <ImagePlus className="w-4 h-4 mr-2" />
          Lägg till foto
        </Button>
      </div>
    </div>
  );
}
