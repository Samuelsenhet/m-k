import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PhotoUpload } from '@/components/profile/PhotoUpload';
import { PersonalityTest } from '@/components/personality/PersonalityTest';
import { PersonalityResult } from '@/components/personality/PersonalityResult';
import { 
  Heart, ArrowRight, ArrowLeft, Check, Sparkles, User, Camera, 
  Users, Brain, Briefcase, SkipForward, ChevronRight, Shield, ShieldCheck
} from 'lucide-react';
import { IdVerificationStep } from '@/components/onboarding/IdVerificationStep';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { type PersonalityTestResult, ARCHETYPE_INFO, type ArchetypeCode } from '@/types/personality';
import { getProfilesAuthKey } from '@/lib/profiles';
import { useAchievementsContextOptional } from '@/contexts/AchievementsContext';

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
  prompt?: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  pronouns: string;
  gender: string;
  height: string;
  instagram: string;
  sexuality: string;
  lookingFor: string;
  hometown: string;
  work: string;
  education: string;
  religion: string;
  politics: string;
  alcohol: string;
  smoking: string;
}

interface PrivacySettings {
  showAge: boolean;
  showJob: boolean;
  showEducation: boolean;
  showLastName: boolean;
}

const STEPS = [
  { id: 'basics', title: 'Grundläggande', icon: User, required: true },
  { id: 'personality', title: 'Personlighet', icon: Brain, required: true },
  { id: 'background', title: 'Bakgrund', icon: Briefcase, required: false },
  { id: 'photos', title: 'Foton', icon: Camera, required: true },
  { id: 'privacy', title: 'Integritet', icon: Shield, required: true },
  { id: 'id_verification', title: 'ID-verifiering', icon: ShieldCheck, required: false },
  { id: 'complete', title: 'Klart', icon: Sparkles, required: true },
];

const PHOTO_PROMPTS = [
  "Vad gör dig genuint lycklig?",
  "Din mest äventyrliga sida",
  "En vanlig dag i ditt liv",
  "Något du är stolt över",
  "Din dolda talang",
  "Med dina favoritpersoner",
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1);
  
  // Helper function to get photo URL
  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(storagePath);
    return data?.publicUrl || '';
  };
  
  // Profile data state
  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    pronouns: '',
    gender: '',
    height: '',
    instagram: '',
    linkedin: '',
    sexuality: '',
    lookingFor: '',
    hometown: '',
    work: '',
    education: '',
    religion: '',
    politics: '',
    alcohol: '',
    smoking: '',
  });

  // Personality test state
  const [personalityResult, setPersonalityResult] = useState<PersonalityTestResult | null>(null);
  const [showPersonalityResult, setShowPersonalityResult] = useState(false);
  const [hasExistingPersonality, setHasExistingPersonality] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    Array.from({ length: 6 }, (_, i) => ({ 
      storage_path: '', 
      display_order: i,
      prompt: PHOTO_PROMPTS[i]
    }))
  );

  // Privacy settings state
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    showAge: true,
    showJob: true,
    showEducation: true,
    showLastName: false,
  });

  // Removed age calculation - age verification handled in phone auth
  const photoCount = photos.filter(p => p.storage_path).length;

  // Check for existing personality result
  const checkExistingPersonality = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('personality_results')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setHasExistingPersonality(true);
      setPersonalityResult({
        scores: data.scores as PersonalityTestResult['scores'],
        category: data.category as PersonalityTestResult['category'],
        archetype: (data.archetype || 'INFJ') as ArchetypeCode,
        answers: [],
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkExistingPersonality();
    }
  }, [user, checkExistingPersonality]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let filled = 0;
    const total = 9;

    if (profile.firstName) filled++;
    if (profile.gender) filled++;
    if (profile.sexuality) filled++;
    if (profile.lookingFor) filled++;
    if (personalityResult) filled++;
    if (photoCount >= 1) filled++;
    if (photoCount >= 4) filled++;
    if (profile.hometown || profile.work || profile.education) filled++;
    if (profile.pronouns || profile.height) filled++;

    return Math.round((filled / total) * 100);
  };

  const updateProfile = (field: keyof ProfileData, value: ProfileData[keyof ProfileData]) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basics
        return profile.firstName.trim().length >= 2 && 
               profile.gender &&
               profile.sexuality &&
               profile.lookingFor;
      case 1: // Personality
        return personalityResult !== null;
      case 2: // Background (optional)
        return true;
      case 3: // Photos
        return photoCount >= 1;
      case 4: // Privacy
        return true;
      case 5: // ID Verification (optional – can skip)
        return true;
      case 6: // Complete
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    setDirection(1);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setDirection(1);
    setCurrentStep(prev => prev + 1);
  };

  const handlePersonalityComplete = async (result: PersonalityTestResult) => {
    setPersonalityResult(result);
    setShowPersonalityResult(true);

    // Save to database
    if (user && !hasExistingPersonality) {
      await supabase.from('personality_results').insert({
        user_id: user.id,
        scores: result.scores,
        category: result.category,
        archetype: result.archetype,
      });
      if (achievementsCtx) {
        achievementsCtx.checkAndAwardAchievement('personality_test');
      }
    }
  };

  const handlePersonalityResultContinue = () => {
    setShowPersonalityResult(false);
    handleNext();
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const profileKey = await getProfilesAuthKey(user.id);
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.firstName + (profile.lastName ? ` ${profile.lastName}` : ''),
          pronouns: profile.pronouns || null,
          gender: profile.gender,
          height: profile.height ? parseInt(profile.height) : null,
          sexuality: profile.sexuality,
          looking_for: profile.lookingFor,
          hometown: profile.hometown || null,
          work: profile.work || null,
          education: profile.education || null,
          instagram: profile.instagram || null,
          linkedin: profile.linkedin || null,
          religion: profile.religion || null,
          politics: profile.politics || null,
          alcohol: profile.alcohol || null,
          smoking: profile.smoking || null,
          profile_completion: calculateCompletion(),
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
          show_age: privacy.showAge,
          show_job: privacy.showJob,
          show_education: privacy.showEducation,
          show_last_name: privacy.showLastName,
        })
        .eq(profileKey, user.id);

      if (error) throw error;

      toast.success('Din profil är skapad!');
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Kunde inte spara profilen');
    } finally {
      setSaving(false);
    }
  };

  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  // Show personality test as full screen
  if (currentStep === 1 && !personalityResult) {
    return <PersonalityTest onComplete={handlePersonalityComplete} />;
  }

  // Show personality result
  if (showPersonalityResult && personalityResult) {
    return (
      <PersonalityResult 
        result={personalityResult} 
        onContinue={handlePersonalityResultContinue}
      />
    );
  }

  const completion = calculateCompletion();

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
            <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="text-2xl font-serif font-bold text-foreground">MÄÄK</span>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Profil</span>
            <span className="text-xs font-medium text-primary">{completion}% komplett</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-1 mb-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === currentStep
                  ? 'w-8 bg-primary'
                  : index < currentStep
                  ? 'w-4 bg-primary/50'
                  : 'w-4 bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container max-w-md mx-auto px-4 py-4 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Basic Info */}
            {currentStep === 0 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-glow">
                    <User className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-serif font-bold text-foreground mb-1">
                    Berätta om dig själv
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Grundläggande information för din profil
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm">Förnamn *</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => updateProfile('firstName', e.target.value)}
                        placeholder="Förnamn"
                        className="py-5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-sm">Efternamn</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => updateProfile('lastName', e.target.value)}
                        placeholder="Valfritt"
                        className="py-5"
                      />
                    </div>
                  </div>

                  {/* Pronouns & Height */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Pronomen</Label>
                      <Select value={profile.pronouns} onValueChange={(v) => updateProfile('pronouns', v)}>
                        <SelectTrigger className="py-5">
                          <SelectValue placeholder="Välj..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hon/henne">hon/henne</SelectItem>
                          <SelectItem value="han/honom">han/honom</SelectItem>
                          <SelectItem value="hen/hen">hen/hen</SelectItem>
                          <SelectItem value="de/dem">de/dem</SelectItem>
                          <SelectItem value="annat">annat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Längd (cm)</Label>
                      <Input
                        type="number"
                        value={profile.height}
                        onChange={(e) => updateProfile('height', e.target.value)}
                        placeholder="175"
                        className="py-5"
                        min={100}
                        max={250}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Instagram</Label>
                      <Input
                        value={profile.instagram}
                        onChange={(e) => updateProfile('instagram', e.target.value)}
                        placeholder="@användarnamn"
                        className="py-5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">LinkedIn</Label>
                      <Input
                        value={profile.linkedin}
                        onChange={(e) => updateProfile('linkedin', e.target.value)}
                        placeholder="@användarnamn"
                        className="py-5"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Jag identifierar mig som *</Label>
                    <Select value={profile.gender} onValueChange={(v) => updateProfile('gender', v)}>
                      <SelectTrigger className="py-5">
                        <SelectValue placeholder="Välj..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kvinna">Kvinna</SelectItem>
                        <SelectItem value="man">Man</SelectItem>
                        <SelectItem value="icke-binär">Icke-binär</SelectItem>
                        <SelectItem value="transkvinna">Transkvinna</SelectItem>
                        <SelectItem value="transman">Transman</SelectItem>
                        <SelectItem value="annat">Annat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sexuality */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Sexualitet *</Label>
                    <Select value={profile.sexuality} onValueChange={(v) => updateProfile('sexuality', v)}>
                      <SelectTrigger className="py-5">
                        <SelectValue placeholder="Välj..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heterosexuell">Heterosexuell</SelectItem>
                        <SelectItem value="homosexuell">Homosexuell</SelectItem>
                        <SelectItem value="bisexuell">Bisexuell</SelectItem>
                        <SelectItem value="pansexuell">Pansexuell</SelectItem>
                        <SelectItem value="asexuell">Asexuell</SelectItem>
                        <SelectItem value="annat">Annat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Looking for */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Jag söker *</Label>
                    <Select value={profile.lookingFor} onValueChange={(v) => updateProfile('lookingFor', v)}>
                      <SelectTrigger className="py-5">
                        <SelectValue placeholder="Välj..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kvinnor">Kvinnor</SelectItem>
                        <SelectItem value="män">Män</SelectItem>
                        <SelectItem value="icke-binära">Icke-binära</SelectItem>
                        <SelectItem value="alla">Alla</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Personality (already completed) */}
            {currentStep === 1 && personalityResult && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-glow">
                    <Brain className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-serif font-bold text-foreground mb-1">
                    Din personlighet
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {hasExistingPersonality ? 'Du har redan gjort testet' : 'Testet är klart!'}
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">
                    {ARCHETYPE_INFO[personalityResult.archetype].emoji}
                  </div>
                  <h2 className="text-lg font-serif font-bold text-foreground mb-1">
                    {ARCHETYPE_INFO[personalityResult.archetype].name}
                  </h2>
                  <p className="text-sm text-primary font-medium mb-3">
                    {ARCHETYPE_INFO[personalityResult.archetype].title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ARCHETYPE_INFO[personalityResult.archetype].description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {ARCHETYPE_INFO[personalityResult.archetype].strengths.map((strength, i) => (
                    <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Background (Skippable) */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-glow">
                    <Briefcase className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-serif font-bold text-foreground mb-1">
                    Bakgrund
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Valfritt - du kan fylla i detta senare
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Hemstad</Label>
                    <Input
                      value={profile.hometown}
                      onChange={(e) => updateProfile('hometown', e.target.value)}
                      placeholder="Stockholm"
                      className="py-5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">Arbete</Label>
                    <Input
                      value={profile.work}
                      onChange={(e) => updateProfile('work', e.target.value)}
                      placeholder="Titel @ Företag"
                      className="py-5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">Utbildning</Label>
                    <Input
                      value={profile.education}
                      onChange={(e) => updateProfile('education', e.target.value)}
                      placeholder="Program @ Universitet"
                      className="py-5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Religion</Label>
                      <Select value={profile.religion} onValueChange={(v) => updateProfile('religion', v)}>
                        <SelectTrigger className="py-5">
                          <SelectValue placeholder="Välj..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agnostiker">Agnostiker</SelectItem>
                          <SelectItem value="ateist">Ateist</SelectItem>
                          <SelectItem value="kristen">Kristen</SelectItem>
                          <SelectItem value="muslim">Muslim</SelectItem>
                          <SelectItem value="jude">Jude</SelectItem>
                          <SelectItem value="buddhist">Buddhist</SelectItem>
                          <SelectItem value="hindu">Hindu</SelectItem>
                          <SelectItem value="spirituell">Spirituell</SelectItem>
                          <SelectItem value="annat">Annat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Politik</Label>
                      <Select value={profile.politics} onValueChange={(v) => updateProfile('politics', v)}>
                        <SelectTrigger className="py-5">
                          <SelectValue placeholder="Välj..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vänster">Vänster</SelectItem>
                          <SelectItem value="liberal">Liberal</SelectItem>
                          <SelectItem value="moderat">Moderat</SelectItem>
                          <SelectItem value="konservativ">Konservativ</SelectItem>
                          <SelectItem value="höger">Höger</SelectItem>
                          <SelectItem value="opolitisk">Opolitisk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Alkohol</Label>
                      <Select value={profile.alcohol} onValueChange={(v) => updateProfile('alcohol', v)}>
                        <SelectTrigger className="py-5">
                          <SelectValue placeholder="Välj..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aldrig">Aldrig</SelectItem>
                          <SelectItem value="sällan">Sällan</SelectItem>
                          <SelectItem value="socialt">Socialt</SelectItem>
                          <SelectItem value="ofta">Ofta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Rökning/Snus</Label>
                      <Select value={profile.smoking} onValueChange={(v) => updateProfile('smoking', v)}>
                        <SelectTrigger className="py-5">
                          <SelectValue placeholder="Välj..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aldrig">Aldrig</SelectItem>
                          <SelectItem value="ibland">Ibland</SelectItem>
                          <SelectItem value="regelbundet">Regelbundet</SelectItem>
                          <SelectItem value="dagligen">Dagligen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-glow">
                    <Camera className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-serif font-bold text-foreground mb-1">
                    Visa dig själv
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Minst 1 foto krävs, 4-6 rekommenderas
                  </p>
                </div>

                <div className="bg-card/50 border border-border rounded-xl p-4 mb-4">
                  <p className="text-sm text-center italic text-muted-foreground">
                    "{PHOTO_PROMPTS[0]}" - Berätta genom dina bilder
                  </p>
                </div>

                <PhotoUpload photos={photos} onPhotosChange={setPhotos} />

                <div className="text-center">
                  <span className={cn(
                    "text-sm font-medium",
                    photoCount >= 4 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {photoCount} av 6 foton
                  </span>
                </div>
              </div>
            )}

            {/* Step 4: Privacy Settings */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-glow">
                    <Shield className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-serif font-bold text-foreground mb-1">
                    Integritet & slutförande
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Kontrollera dina integritetsinställningar innan du slutför din profil
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-foreground mb-4">Synlighetsalternativ</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
                      <span className="text-sm text-foreground">Visa min ålder</span>
                      <Checkbox 
                        checked={privacy.showAge}
                        onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showAge: checked === true }))}
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
                      <span className="text-sm text-foreground">Visa mitt jobb</span>
                      <Checkbox 
                        checked={privacy.showJob}
                        onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showJob: checked === true }))}
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 border-b border-border cursor-pointer">
                      <span className="text-sm text-foreground">Visa min utbildning</span>
                      <Checkbox 
                        checked={privacy.showEducation}
                        onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showEducation: checked === true }))}
                      />
                    </label>
                    <label className="flex items-center justify-between py-2 cursor-pointer">
                      <span className="text-sm text-foreground">Visa mitt efternamn för matchningar</span>
                      <Checkbox 
                        checked={privacy.showLastName}
                        onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showLastName: checked === true }))}
                      />
                    </label>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Du kan ändra dessa inställningar när som helst i din profil
                </p>
              </div>
            )}

            {/* Step 5: ID Verification */}
            {currentStep === 5 && (
              <IdVerificationStep
                onSubmit={() => setCurrentStep((prev) => prev + 1)}
              />
            )}

            {/* Step 6: Complete */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow animate-pulse">
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                    Din profil är {completion}% komplett!
                  </h1>
                  <p className="text-muted-foreground">
                    Du är redo att börja matcha
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      {photos[0]?.storage_path && (
                        <img 
                          src={getPhotoUrl(photos[0].storage_path)}
                          alt="Profile"
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {profile.firstName} {profile.lastName}
                        </h3>
                        
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {personalityResult && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{ARCHETYPE_INFO[personalityResult.archetype].emoji}</span>
                        <span className="text-sm text-foreground">
                          {ARCHETYPE_INFO[personalityResult.archetype].title}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {profile.hometown && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          📍 {profile.hometown}
                        </span>
                      )}
                      {profile.work && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          💼 {profile.work}
                        </span>
                      )}
                      {profile.education && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          🎓 {profile.education}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Du kan alltid uppdatera din profil senare
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-border bg-card">
        <div className="container max-w-md mx-auto flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </Button>
          )}
          
          {/* Skip button for optional steps */}
          {(currentStep === 2 || currentStep === 5) && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="gap-2"
            >
              Hoppa över
              <SkipForward className="w-4 h-4" />
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="flex-1 gradient-primary text-primary-foreground border-0 gap-2"
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                {saving ? 'Sparar...' : 'Börja matcha'}
                <Heart className="w-4 h-4" />
              </>
            ) : currentStep === 0 ? (
              <>
                Nästa: Personlighetstest
                <Brain className="w-4 h-4" />
              </>
            ) : (
              <>
                Fortsätt
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
