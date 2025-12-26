import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Camera, MapPin, ChevronLeft, ChevronRight, Pencil, 
  ImagePlus, MessageSquarePlus, Heart, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ARCHETYPE_INFO, ArchetypeCode } from '@/types/personality';
import { Link } from 'react-router-dom';

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

// Personality trait categories with colors
const TRAIT_CATEGORIES = {
  emotional: { 
    label: 'Emotionell', 
    bgClass: 'bg-rose-400', 
    textClass: 'text-white',
    traits: ['Vårdande', 'Empatisk', 'Känslosam']
  },
  creative: { 
    label: 'Kreativ', 
    bgClass: 'bg-rose-400', 
    textClass: 'text-white',
    traits: ['Konstnärlig', 'Fantasifull', 'Innovativ']
  },
  social: { 
    label: 'Social', 
    bgClass: 'bg-rose-400', 
    textClass: 'text-white',
    traits: ['Empatisk', 'Utåtriktad', 'Omtänksam']
  },
  mental: { 
    label: 'Mental', 
    bgClass: 'bg-emerald-400', 
    textClass: 'text-white',
    traits: ['Reflekterande', 'Analytisk', 'Logisk']
  },
  intellectual: { 
    label: 'Intellektuell', 
    bgClass: 'bg-emerald-100', 
    textClass: 'text-emerald-700',
    traits: ['Analytisk', 'Nyfiken', 'Strategisk']
  },
  physical: { 
    label: 'Fysisk', 
    bgClass: 'bg-rose-100', 
    textClass: 'text-rose-700',
    traits: ['Äventyrlig', 'Aktiv', 'Energisk']
  },
  spiritual: { 
    label: 'Andlig', 
    bgClass: 'bg-emerald-100', 
    textClass: 'text-emerald-700',
    traits: ['Visionär', 'Intuitiv', 'Reflekterande']
  },
};

// Map archetypes to trait combinations
const getArchetypeTraits = (archetype: string) => {
  const traitMap: Record<string, { category: string; trait: string; primary?: boolean }[]> = {
    'INFJ': [
      { category: 'emotional', trait: 'Vårdande', primary: true },
      { category: 'creative', trait: 'Konstnärlig', primary: true },
      { category: 'social', trait: 'Empatisk', primary: true },
      { category: 'mental', trait: 'Reflekterande', primary: true },
      { category: 'intellectual', trait: 'Analytisk' },
      { category: 'spiritual', trait: 'Visionär' },
    ],
    'ENFP': [
      { category: 'creative', trait: 'Fantasifull', primary: true },
      { category: 'social', trait: 'Utåtriktad', primary: true },
      { category: 'emotional', trait: 'Empatisk', primary: true },
      { category: 'mental', trait: 'Reflekterande', primary: true },
      { category: 'physical', trait: 'Äventyrlig' },
      { category: 'spiritual', trait: 'Intuitiv' },
    ],
    'INTJ': [
      { category: 'mental', trait: 'Analytisk', primary: true },
      { category: 'intellectual', trait: 'Strategisk', primary: true },
      { category: 'creative', trait: 'Innovativ', primary: true },
      { category: 'spiritual', trait: 'Visionär', primary: true },
      { category: 'emotional', trait: 'Vårdande' },
      { category: 'physical', trait: 'Aktiv' },
    ],
    'ESFJ': [
      { category: 'social', trait: 'Omtänksam', primary: true },
      { category: 'emotional', trait: 'Vårdande', primary: true },
      { category: 'mental', trait: 'Reflekterande', primary: true },
      { category: 'creative', trait: 'Konstnärlig', primary: true },
      { category: 'physical', trait: 'Energisk' },
      { category: 'intellectual', trait: 'Analytisk' },
    ],
  };
  
  return traitMap[archetype] || [
    { category: 'emotional', trait: 'Vårdande', primary: true },
    { category: 'social', trait: 'Empatisk', primary: true },
    { category: 'mental', trait: 'Reflekterande', primary: true },
    { category: 'creative', trait: 'Konstnärlig', primary: true },
    { category: 'intellectual', trait: 'Analytisk' },
    { category: 'spiritual', trait: 'Visionär' },
  ];
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
            <h2 className="font-serif font-bold text-lg text-center mb-5">
              Arketyper & Profil
            </h2>
            
            {/* Primary traits - larger badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {traits.filter(t => t.primary).map((trait, index) => {
                const category = TRAIT_CATEGORIES[trait.category as keyof typeof TRAIT_CATEGORIES];
                return (
                  <span
                    key={index}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium",
                      category?.bgClass || 'bg-muted',
                      category?.textClass || 'text-foreground'
                    )}
                  >
                    {category?.label}: {trait.trait}
                  </span>
                );
              })}
            </div>

            {/* Secondary traits - smaller badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {traits.filter(t => !t.primary).map((trait, index) => {
                const category = TRAIT_CATEGORIES[trait.category as keyof typeof TRAIT_CATEGORIES];
                return (
                  <span
                    key={index}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border",
                      category?.bgClass.includes('100') ? category.bgClass : 'bg-muted/50',
                      category?.textClass || 'text-foreground'
                    )}
                  >
                    {category?.label}: {trait.trait}
                  </span>
                );
              })}
            </div>

            <Link to="/" className="block">
              <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary/80">
                🧠 Ta personlighetstestet igen
              </Button>
            </Link>
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

      {/* Profile Insights */}
      <Card className="shadow-soft rounded-2xl">
        <CardContent className="p-5">
          <h2 className="font-serif font-bold text-lg mb-4">Profil Insights</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100">
              <p className="text-3xl font-bold text-rose-500">{matchCount}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Matchningar
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
              <p className="text-3xl font-bold text-emerald-500">
                {archetypeInfo ? '94%' : '-'}
              </p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                Kompatibilitet
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          onClick={onEdit}
          className="w-full h-12 rounded-full bg-gradient-to-r from-rose-400 to-emerald-400 hover:from-rose-500 hover:to-emerald-500 text-white font-medium"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Uppdatera Profil
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={onEdit}
            className="h-11 rounded-full"
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Lägg till foto
          </Button>
          <Button 
            variant="outline"
            className="h-11 rounded-full"
          >
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Ny prompt
          </Button>
        </div>
      </div>
    </div>
  );
}
