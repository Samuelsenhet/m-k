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
import { Loader2, Save, User, Heart, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  display_name: string;
  bio: string;
  gender: string;
  looking_for: string;
  height: string;
  work: string;
  education: string;
  hometown: string;
  religion: string;
  politics: string;
  smoking: string;
  alcohol: string;
  pronouns: string;
}

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
  prompt?: string;
}

interface ProfileEditorProps {
  onComplete?: () => void;
}

export function ProfileEditor({ onComplete }: ProfileEditorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    bio: '',
    gender: '',
    looking_for: '',
    height: '',
    work: '',
    education: '',
    hometown: '',
    religion: '',
    politics: '',
    smoking: '',
    alcohol: '',
    pronouns: '',
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
      .select('display_name, bio, gender, looking_for, height, work, education, hometown, religion, politics, smoking, alcohol, pronouns')
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
        height: data.height?.toString() || '',
        work: data.work || '',
        education: data.education || '',
        hometown: data.hometown || '',
        religion: data.religion || '',
        politics: data.politics || '',
        smoking: data.smoking || '',
        alcohol: data.alcohol || '',
        pronouns: data.pronouns || '',
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
        display_name: profile.display_name || null,
        bio: profile.bio || null,
        gender: profile.gender || null,
        looking_for: profile.looking_for || null,
        height: profile.height ? parseInt(profile.height) : null,
        work: profile.work || null,
        education: profile.education || null,
        hometown: profile.hometown || null,
        religion: profile.religion || null,
        politics: profile.politics || null,
        smoking: profile.smoking || null,
        alcohol: profile.alcohol || null,
        pronouns: profile.pronouns || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Kunde inte spara profilen');
    } else {
      toast.success('Profil sparad!');
      onComplete?.();
    }
    setSaving(false);
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Photos Section */}
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Foton
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Grundläggande
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="display_name" className="text-xs">Namn</Label>
              <Input
                id="display_name"
                value={profile.display_name}
                onChange={(e) => updateField('display_name', e.target.value)}
                placeholder="Ditt namn"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pronouns" className="text-xs">Pronomen</Label>
              <Input
                id="pronouns"
                value={profile.pronouns}
                onChange={(e) => updateField('pronouns', e.target.value)}
                placeholder="t.ex. hon/hen"
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-xs">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Berätta lite om dig själv..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {profile.bio.length}/500
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Jag identifierar mig som</Label>
              <Select
                value={profile.gender}
                onValueChange={(value) => updateField('gender', value)}
              >
                <SelectTrigger className="h-9">
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

            <div className="space-y-1.5">
              <Label className="text-xs">Jag söker</Label>
              <Select
                value={profile.looking_for}
                onValueChange={(value) => updateField('looking_for', value)}
              >
                <SelectTrigger className="h-9">
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

      {/* More About Me */}
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Mer om mig
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="height" className="text-xs">Längd (cm)</Label>
              <Input
                id="height"
                type="number"
                value={profile.height}
                onChange={(e) => updateField('height', e.target.value)}
                placeholder="175"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hometown" className="text-xs">Bor i</Label>
              <Input
                id="hometown"
                value={profile.hometown}
                onChange={(e) => updateField('hometown', e.target.value)}
                placeholder="Stockholm"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="work" className="text-xs">Jobb</Label>
              <Input
                id="work"
                value={profile.work}
                onChange={(e) => updateField('work', e.target.value)}
                placeholder="Designer"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="education" className="text-xs">Utbildning</Label>
              <Input
                id="education"
                value={profile.education}
                onChange={(e) => updateField('education', e.target.value)}
                placeholder="Universitet"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle */}
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Livsstil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Alkohol</Label>
              <Select
                value={profile.alcohol}
                onValueChange={(value) => updateField('alcohol', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Välj..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dricker inte">Dricker inte</SelectItem>
                  <SelectItem value="Sällan">Sällan</SelectItem>
                  <SelectItem value="Socialt">Socialt</SelectItem>
                  <SelectItem value="Regelbundet">Regelbundet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Rökning</Label>
              <Select
                value={profile.smoking}
                onValueChange={(value) => updateField('smoking', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Välj..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Röker inte">Röker inte</SelectItem>
                  <SelectItem value="Sällan">Sällan</SelectItem>
                  <SelectItem value="Socialt">Socialt</SelectItem>
                  <SelectItem value="Regelbundet">Regelbundet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Religion</Label>
              <Select
                value={profile.religion}
                onValueChange={(value) => updateField('religion', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Välj..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agnostisk">Agnostisk</SelectItem>
                  <SelectItem value="Ateist">Ateist</SelectItem>
                  <SelectItem value="Buddist">Buddist</SelectItem>
                  <SelectItem value="Kristen">Kristen</SelectItem>
                  <SelectItem value="Hindu">Hindu</SelectItem>
                  <SelectItem value="Judisk">Judisk</SelectItem>
                  <SelectItem value="Muslim">Muslim</SelectItem>
                  <SelectItem value="Spirituell">Spirituell</SelectItem>
                  <SelectItem value="Annat">Annat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Politik</Label>
              <Select
                value={profile.politics}
                onValueChange={(value) => updateField('politics', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Välj..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vänster">Vänster</SelectItem>
                  <SelectItem value="Liberal">Liberal</SelectItem>
                  <SelectItem value="Moderat">Moderat</SelectItem>
                  <SelectItem value="Konservativ">Konservativ</SelectItem>
                  <SelectItem value="Opolitisk">Opolitisk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
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
            Spara ändringar
          </>
        )}
      </Button>
    </div>
  );
}
