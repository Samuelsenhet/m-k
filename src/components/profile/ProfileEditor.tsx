import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoUpload } from './PhotoUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, User, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  display_name: string;
  bio: string;
  gender: string;
  looking_for: string;
}

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
  prompt?: string;
}

export function ProfileEditor() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    bio: '',
    gender: '',
    looking_for: '',
  });
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPhotos();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, bio, gender, looking_for')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile({
        display_name: data.display_name || '',
        bio: data.bio || '',
        gender: data.gender || '',
        looking_for: data.looking_for || '',
      });
    }
    setLoading(false);
  };

  const fetchPhotos = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (error) {
      console.error('Error fetching photos:', error);
    } else {
      // Map to array with empty slots
      const photoSlots: PhotoSlot[] = Array.from({ length: 6 }, (_, i) => {
        const photo = data?.find(p => p.display_order === i);
        return photo || { storage_path: '', display_order: i };
      });
      setPhotos(photoSlots);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        gender: profile.gender,
        looking_for: profile.looking_for,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Kunde inte spara profilen');
    } else {
      toast.success('Profil sparad!');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Photos Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Dina foton
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
        </CardContent>
      </Card>

      {/* Basic Info Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Om dig
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Visningsnamn</Label>
            <Input
              id="display_name"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Ditt namn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Berätta lite om dig själv..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {profile.bio.length}/500
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jag identifierar mig som</Label>
              <Select
                value={profile.gender}
                onValueChange={(value) => setProfile({ ...profile, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kvinna">Kvinna</SelectItem>
                  <SelectItem value="man">Man</SelectItem>
                  <SelectItem value="icke-binär">Icke-binär</SelectItem>
                  <SelectItem value="annat">Annat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jag söker</Label>
              <Select
                value={profile.looking_for}
                onValueChange={(value) => setProfile({ ...profile, looking_for: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kvinnor">Kvinnor</SelectItem>
                  <SelectItem value="män">Män</SelectItem>
                  <SelectItem value="alla">Alla</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full gradient-primary text-primary-foreground"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sparar...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Spara profil
          </>
        )}
      </Button>
    </div>
  );
}
