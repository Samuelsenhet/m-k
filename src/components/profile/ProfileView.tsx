import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Pencil, MapPin, Briefcase, GraduationCap, Ruler, 
  Heart, Sparkles, ChevronLeft, ChevronRight, Wine, 
  Cigarette, Church, Vote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ARCHETYPE_INFO, ArchetypeCode } from '@/types/personality';

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  gender: string | null;
  looking_for: string | null;
  height: number | null;
  work: string | null;
  education: string | null;
  hometown: string | null;
  religion: string | null;
  politics: string | null;
  smoking: string | null;
  alcohol: string | null;
  sexuality: string | null;
  pronouns: string | null;
}

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
  prompt?: string;
}

interface ProfileViewProps {
  onEdit: () => void;
  archetype?: string | null;
}

export function ProfileView({ onEdit, archetype }: ProfileViewProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const archetypeInfo = archetype ? ARCHETYPE_INFO[archetype as ArchetypeCode] : null;

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [profileRes, photosRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, bio, gender, looking_for, height, work, education, hometown, religion, politics, smoking, alcohol, sexuality, pronouns')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('profile_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order')
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
    }

    if (photosRes.data) {
      setPhotos(photosRes.data.filter(p => p.storage_path));
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

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="aspect-[3/4] bg-muted rounded-2xl" />
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    );
  }

  const infoItems = [
    { icon: MapPin, value: profile?.hometown, label: 'Bor i' },
    { icon: Briefcase, value: profile?.work, label: 'Jobbar som' },
    { icon: GraduationCap, value: profile?.education, label: 'Utbildning' },
    { icon: Ruler, value: profile?.height ? `${profile.height} cm` : null, label: 'Längd' },
  ].filter(item => item.value);

  const lifestyleItems = [
    { icon: Wine, value: profile?.alcohol, label: 'Alkohol' },
    { icon: Cigarette, value: profile?.smoking, label: 'Rökning' },
    { icon: Church, value: profile?.religion, label: 'Religion' },
    { icon: Vote, value: profile?.politics, label: 'Politik' },
  ].filter(item => item.value);

  return (
    <div className="space-y-4 pb-20">
      {/* Hero Photo Section */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-card bg-muted">
        {photos.length > 0 ? (
          <>
            <img
              src={getPublicUrl(photos[currentPhotoIndex].storage_path)}
              alt={profile?.display_name || 'Profilfoto'}
              className="w-full h-full object-cover"
            />
            
            {/* Photo Navigation */}
            {photos.length > 1 && (
              <>
                {/* Photo indicators */}
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

                {/* Navigation buttons */}
                <button
                  onClick={prevPhoto}
                  className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-start pl-2"
                  aria-label="Föregående foto"
                >
                  <ChevronLeft className="w-8 h-8 text-white/70 hover:text-white transition-colors" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-2"
                  aria-label="Nästa foto"
                >
                  <ChevronRight className="w-8 h-8 text-white/70 hover:text-white transition-colors" />
                </button>
              </>
            )}

            {/* Gradient overlay for text */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-20">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-white">
                    {profile?.display_name || 'Ingen namn'}
                  </h1>
                  {profile?.pronouns && (
                    <p className="text-white/80 text-sm">{profile.pronouns}</p>
                  )}
                </div>
                {archetypeInfo && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <span className="text-lg">{archetypeInfo.emoji}</span>
                    <span className="text-white text-sm font-medium">{archetypeInfo.name}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Heart className="w-16 h-16 mb-4 opacity-30" />
            <p>Inga foton än</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onEdit}>
              Lägg till foton
            </Button>
          </div>
        )}
      </div>

      {/* Edit Button */}
      <Button 
        onClick={onEdit}
        className="w-full gradient-primary text-primary-foreground"
      >
        <Pencil className="w-4 h-4 mr-2" />
        Redigera profil
      </Button>

      {/* Bio Section */}
      {profile?.bio && (
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <h3 className="font-serif font-semibold text-lg mb-2">Om mig</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Personality Section */}
      {archetypeInfo && (
        <Card className="shadow-soft overflow-hidden">
          <div className="gradient-primary p-4">
            <div className="flex items-center gap-3 text-primary-foreground">
              <span className="text-3xl">{archetypeInfo.emoji}</span>
              <div>
                <h3 className="font-serif font-bold text-lg">{archetypeInfo.title}</h3>
                <p className="text-sm opacity-90">{archetypeInfo.name}</p>
              </div>
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">{archetypeInfo.description}</p>
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                Kärleksstil
              </p>
              <p className="text-sm text-muted-foreground">{archetypeInfo.loveStyle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {archetypeInfo.strengths.map((strength) => (
                <Badge key={strength} variant="secondary" className="text-xs">
                  {strength}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info Section */}
      {infoItems.length > 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Grundläggande
            </h3>
            <div className="space-y-3">
              {infoItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lifestyle Section */}
      {lifestyleItems.length > 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <h3 className="font-serif font-semibold text-lg mb-3">Livsstil</h3>
            <div className="flex flex-wrap gap-2">
              {lifestyleItems.map((item, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1.5 py-1.5 px-3">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Looking For Section */}
      {profile?.looking_for && (
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <h3 className="font-serif font-semibold text-lg mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Jag söker
            </h3>
            <p className="text-muted-foreground capitalize">{profile.looking_for}</p>
          </CardContent>
        </Card>
      )}

      {/* Photo Gallery */}
      {photos.length > 1 && (
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <h3 className="font-serif font-semibold text-lg mb-3">Alla foton</h3>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <button
                  key={photo.id || index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={cn(
                    "aspect-square rounded-lg overflow-hidden ring-2 ring-offset-2 transition-all",
                    currentPhotoIndex === index 
                      ? "ring-primary" 
                      : "ring-transparent hover:ring-primary/50"
                  )}
                >
                  <img
                    src={getPublicUrl(photo.storage_path)}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
