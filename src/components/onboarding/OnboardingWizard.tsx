import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoUpload } from '@/components/profile/PhotoUpload';
import { Heart, ArrowRight, ArrowLeft, CalendarIcon, Check, Sparkles, User, Camera, Users } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
  prompt?: string;
}

const STEPS = [
  { id: 'name', title: 'Namn', icon: User },
  { id: 'birthday', title: 'Födelsedag', icon: CalendarIcon },
  { id: 'photos', title: 'Foton', icon: Camera },
  { id: 'preferences', title: 'Preferenser', icon: Users },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    Array.from({ length: 6 }, (_, i) => ({ storage_path: '', display_order: i }))
  );

  const age = dateOfBirth ? differenceInYears(new Date(), dateOfBirth) : null;
  const photoCount = photos.filter(p => p.storage_path).length;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return firstName.trim().length >= 2;
      case 1: return dateOfBirth && age !== null && age >= 20;
      case 2: return photoCount >= 1;
      case 3: return gender && lookingFor;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: firstName + (lastName ? ` ${lastName}` : ''),
          date_of_birth: dateOfBirth?.toISOString().split('T')[0],
          gender,
          looking_for: lookingFor,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profil skapad!');
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Kunde inte spara profilen');
    } finally {
      setSaving(false);
    }
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
            <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="text-2xl font-serif font-bold text-foreground">MÄÄK</span>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-2 mb-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStep
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index < currentStep ? (
                <Check className="w-3 h-3" />
              ) : (
                <step.icon className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container max-w-md mx-auto px-4 py-8">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Name */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <User className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                    Du är unik
                  </h1>
                  <p className="text-muted-foreground">
                    Det ska även din profil vara. Vad heter du?
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Förnamn *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ditt förnamn"
                      className="text-lg py-6"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Efternamn <span className="text-muted-foreground text-sm">(valfritt)</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ditt efternamn"
                      className="text-lg py-6"
                    />
                    <p className="text-xs text-muted-foreground">
                      Delas endast med dina matchningar
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Birthday */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <CalendarIcon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                    När fyller du år?
                  </h1>
                  <p className="text-muted-foreground">
                    Du måste vara minst 20 år för att använda MÄÄK
                  </p>
                </div>

                <div className="flex justify-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full max-w-xs py-6 text-lg justify-start',
                          !dateOfBirth && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {dateOfBirth ? format(dateOfBirth, 'PPP', { locale: sv }) : 'Välj datum'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={dateOfBirth}
                        onSelect={setDateOfBirth}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1920-01-01')
                        }
                        defaultMonth={new Date(2000, 0)}
                        captionLayout="dropdown-buttons"
                        fromYear={1920}
                        toYear={new Date().getFullYear() - 18}
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {dateOfBirth && age !== null && (
                  <div className={cn(
                    'text-center p-4 rounded-xl',
                    age >= 20 ? 'bg-primary/10' : 'bg-destructive/10'
                  )}>
                    {age >= 20 ? (
                      <>
                        <p className="text-2xl font-bold text-foreground mb-1">
                          Du är {age} år
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Född {format(dateOfBirth, 'd MMMM yyyy', { locale: sv })}
                        </p>
                      </>
                    ) : (
                      <p className="text-destructive font-medium">
                        Du måste vara minst 20 år för att använda MÄÄK
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Photos */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <Camera className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                    Visa dig själv
                  </h1>
                  <p className="text-muted-foreground">
                    Ladda upp minst 1 foto, gärna 4-6 stycken
                  </p>
                </div>

                <PhotoUpload photos={photos} onPhotosChange={setPhotos} />

                <div className="text-center text-sm text-muted-foreground">
                  {photoCount} av 6 foton uppladdade
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                    Nästan klart!
                  </h1>
                  <p className="text-muted-foreground">
                    Berätta lite om dig och vem du söker
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Jag identifierar mig som</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="py-6 text-lg">
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
                    <Select value={lookingFor} onValueChange={setLookingFor}>
                      <SelectTrigger className="py-6 text-lg">
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
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="flex-1 gradient-primary text-primary-foreground border-0 gap-2"
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                {saving ? 'Sparar...' : 'Slutför'}
                <Check className="w-4 h-4" />
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
