import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PhotoUpload } from './PhotoUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, User, Heart, Info, Sparkles, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getProfilesAuthKey } from '@/lib/profiles';
import { useAchievementsContextOptional } from '@/contexts/AchievementsContext';

interface ProfileData {
  display_name: string;
  bio: string;
  gender: string;
  looking_for: string;
  height: string;
  work: string;
  education: string;
  hometown: string;
  country: string;
  instagram: string;
  religion: string;
  politics: string;
  smoking: string;
  alcohol: string;
  pronouns: string;
  dating_intention: string;
  dating_intention_extra: string;
  relationship_type: string;
  relationship_type_extra: string;
}

interface PrivacySettings {
  show_age: boolean;
  show_job: boolean;
  show_education: boolean;
  show_last_name: boolean;
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
  const { t } = useTranslation();
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
    country: '',
    instagram: '',
    linkedin: '',
    religion: '',
    politics: '',
    smoking: '',
    alcohol: '',
    pronouns: '',
    dating_intention: '',
    dating_intention_extra: '',
    relationship_type: '',
    relationship_type_extra: '',
    interested_in: '',
  });
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    show_age: true,
    show_job: true,
    show_education: true,
    show_last_name: false,
  });
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    const profileKey = await getProfilesAuthKey(user.id);
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, bio, gender, looking_for, height, work, education, hometown, country, instagram, linkedin, religion, politics, smoking, alcohol, pronouns, dating_intention, dating_intention_extra, relationship_type, relationship_type_extra, show_age, show_job, show_education, show_last_name')
      .eq(profileKey, user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      toast.error(t('common.error') + '. ' + t('common.retry'));
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
        country: data.country || 'SE',
        instagram: data.instagram || '',
        linkedin: data.linkedin || '',
        religion: data.religion || '',
        politics: data.politics || '',
        smoking: data.smoking || '',
        alcohol: data.alcohol || '',
        pronouns: data.pronouns || '',
        dating_intention: data.dating_intention || '',
        dating_intention_extra: data.dating_intention_extra || '',
        relationship_type: data.relationship_type || '',
        relationship_type_extra: data.relationship_type_extra || '',
        interested_in: data.interested_in || '',
      });
      setPrivacy({
        show_age: data.show_age ?? true,
        show_job: data.show_job ?? true,
        show_education: data.show_education ?? true,
        show_last_name: data.show_last_name ?? false,
      });
    }
    setLoading(false);
  }, [user, t]);

  const fetchPhotos = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (error) {
      console.error('Error fetching photos:', error);
      toast.error(t('common.error') + '. ' + t('common.retry'));
    } else {
      const photoSlots: PhotoSlot[] = Array.from({ length: 6 }, (_, i) => {
        const photo = data?.find(p => p.display_order === i);
        return photo || { storage_path: '', display_order: i };
      });
      setPhotos(photoSlots);
    }
  }, [user, t]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPhotos();
    }
  }, [user, fetchProfile, fetchPhotos]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const profileKey = await getProfilesAuthKey(user.id);
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
        country: profile.country || null,
        instagram: profile.instagram || null,
        religion: profile.religion || null,
        politics: profile.politics || null,
        smoking: profile.smoking || null,
        alcohol: profile.alcohol || null,
        pronouns: profile.pronouns || null,
        dating_intention: profile.dating_intention || null,
        dating_intention_extra: profile.dating_intention_extra || null,
        relationship_type: profile.relationship_type || null,
        relationship_type_extra: profile.relationship_type_extra || null,
        show_age: privacy.show_age,
        show_job: privacy.show_job,
        show_education: privacy.show_education,
        show_last_name: privacy.show_last_name,
        updated_at: new Date().toISOString(),
      })
      .eq(profileKey, user.id);

    if (error) {
      toast.error('Kunde inte spara profilen');
    } else {
      toast.success('Profil sparad!');
      onComplete?.();
      // Award achievements when criteria are met
      if (achievementsCtx) {
        const hasKeyFields = !!(profile.display_name?.trim() && profile.bio?.trim() && profile.gender);
        if (hasKeyFields && photos.length >= 1) {
          achievementsCtx.checkAndAwardAchievement('profile_complete');
        }
        if (photos.length >= 1) {
          achievementsCtx.checkAndAwardAchievement('photo_upload');
        }
      }
    }
    setSaving(false);
  };

  const updatePrivacy = (field: keyof PrivacySettings, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [field]: value }));
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

          {/* Dejtingavsikter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t('profile.dating_intention_title')}</Label>
            <Select
              value={profile.dating_intention}
              onValueChange={(value) => updateField('dating_intention', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('profile.select_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="livspartner">{t('profile.dating_livspartner')}</SelectItem>
                <SelectItem value="langsiktigt_forhallande">{t('profile.dating_langsiktigt')}</SelectItem>
                <SelectItem value="langsiktigt_oppen_kort">{t('profile.dating_langsiktigt_oppen_kort')}</SelectItem>
                <SelectItem value="kortvarigt_oppen_lang">{t('profile.dating_kortvarigt_oppen_lang')}</SelectItem>
                <SelectItem value="kortvarigt">{t('profile.dating_kortvarigt')}</SelectItem>
                <SelectItem value="klura_ut">{t('profile.dating_klura_ut')}</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={profile.dating_intention_extra}
              onChange={(e) => updateField('dating_intention_extra', e.target.value)}
              placeholder={t('profile.dating_intention_placeholder')}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Relationstyper */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t('profile.relationship_type_title')}</Label>
            <Select
              value={profile.relationship_type}
              onValueChange={(value) => updateField('relationship_type', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('profile.select_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monogam">{t('profile.relation_monogam')}</SelectItem>
                <SelectItem value="icke_monogami">{t('profile.relation_icke_monogami')}</SelectItem>
                <SelectItem value="ta_reda_pa">{t('profile.relation_ta_reda_pa')}</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={profile.relationship_type_extra}
              onChange={(e) => updateField('relationship_type_extra', e.target.value)}
              placeholder={t('profile.relationship_type_placeholder')}
              rows={2}
              className="resize-none"
            />
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
          <div className="space-y-1.5">
            <Label htmlFor="interested_in" className="text-xs">{t('profile.interests_title', 'Intressen')}</Label>
            <Textarea
              id="interested_in"
              value={profile.interested_in}
              onChange={(e) => updateField('interested_in', e.target.value)}
              placeholder={t('profile.interests_placeholder', 't.ex. konst, resor, matlagning, träning...')}
              rows={2}
              className="resize-none"
            />
          </div>
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

          <div className="space-y-1.5">
            <Label className="text-xs">Land</Label>
            <Select
              value={profile.country || 'none'}
              onValueChange={(value) => updateField('country', value === 'none' ? '' : value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Välj land..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Välj land...</SelectItem>
                <SelectItem value="SE">Sverige</SelectItem>
                <SelectItem value="NO">Norge</SelectItem>
                <SelectItem value="DK">Danmark</SelectItem>
                <SelectItem value="FI">Finland</SelectItem>
                <SelectItem value="IS">Island</SelectItem>
                <SelectItem value="DE">Tyskland</SelectItem>
                <SelectItem value="GB">Storbritannien</SelectItem>
                <SelectItem value="US">USA</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Används bland annat för utskick (t.ex. nyhetsbrev per land).</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="instagram" className="text-xs">Instagram</Label>
              <Input
                id="instagram"
                value={profile.instagram}
                onChange={(e) => updateField('instagram', e.target.value)}
                placeholder="@användarnamn"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin" className="text-xs">LinkedIn</Label>
              <Input
                id="linkedin"
                value={profile.linkedin}
                onChange={(e) => updateField('linkedin', e.target.value)}
                placeholder="@användarnamn"
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
              <Label htmlFor="profile-politics" className="text-xs">Politik</Label>
              <Select
                value={profile.politics}
                onValueChange={(value) => updateField('politics', value)}
              >
                <SelectTrigger id="profile-politics" className="h-9">
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

      {/* Privacy Settings */}
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            {t('privacy.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('privacy.description')}
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <Label htmlFor="show_age" className="text-sm cursor-pointer">
                {t('privacy.showAge')}
              </Label>
              <Checkbox
                id="show_age"
                checked={privacy.show_age}
                onCheckedChange={(checked) => updatePrivacy('show_age', checked === true)}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <Label htmlFor="show_job" className="text-sm cursor-pointer">
                {t('privacy.showJob')}
              </Label>
              <Checkbox
                id="show_job"
                checked={privacy.show_job}
                onCheckedChange={(checked) => updatePrivacy('show_job', checked === true)}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <Label htmlFor="show_education" className="text-sm cursor-pointer">
                {t('privacy.showEducation')}
              </Label>
              <Checkbox
                id="show_education"
                checked={privacy.show_education}
                onCheckedChange={(checked) => updatePrivacy('show_education', checked === true)}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="show_last_name" className="text-sm cursor-pointer">
                {t('privacy.showLastName')}
              </Label>
              <Checkbox
                id="show_last_name"
                checked={privacy.show_last_name}
                onCheckedChange={(checked) => updatePrivacy('show_last_name', checked === true)}
              />
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
