import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { usePhoneAuth, PhoneAuthStep } from '@/hooks/usePhoneAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { OtpInput } from '@/components/auth/OtpInput';
import { AgeVerification, calculateAge } from '@/components/auth/AgeVerification';
import { Heart, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const phoneSchema = z.string()
  .min(9, 'Ange ett giltigt telefonnummer')
  .max(10, 'Ange ett giltigt telefonnummer')
  .regex(/^0?7[0-9]{8}$/, 'Ange ett giltigt svenskt mobilnummer');

const otpSchema = z.string().length(6, 'Koden måste vara 6 siffror');

const profileSchema = z.object({
  dateOfBirth: z.object({
    day: z.string().min(1, 'Välj dag'),
    month: z.string().min(1, 'Välj månad'),
    year: z.string().min(1, 'Välj år'),
  }),
});

export default function PhoneAuth() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState({ day: '', month: '', year: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(0);
  
  const { step, loading, error, sendOtp, verifyOtp, resendOtp, setStep } = usePhoneAuth();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (user) {
        // Check user profile status
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, date_of_birth')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.onboarding_completed) {
          // Already completed everything, go to matches
          navigate('/matches');
        } else if (profile?.date_of_birth) {
          // Age already verified, go to onboarding (returning user or completed age step)
          navigate('/onboarding');
        }
        // If no date_of_birth and user just verified phone, they'll see the profile step
        // This only happens for NEW users who haven't verified age yet
      }
    };
    
    checkUserStatus();
  }, [user, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    try {
      phoneSchema.parse(phone);
      setErrors({});
      const success = await sendOtp(phone);
      if (success) {
        toast.success('Verifieringskod skickad!');
        setCountdown(60);
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors({ phone: e.errors[0].message });
      }
    }
  };

  const handleVerifyOtp = async () => {
    try {
      otpSchema.parse(otp);
      setErrors({});
      const success = await verifyOtp(phone, otp);
      if (success) {
        toast.success('Telefon verifierad!');
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors({ otp: e.errors[0].message });
      }
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    const success = await resendOtp(phone);
    if (success) {
      toast.success('Ny kod skickad!');
      setCountdown(60);
    }
  };

  const handleCompleteProfile = async () => {
    try {
      profileSchema.parse({ dateOfBirth });
      
      const age = calculateAge(dateOfBirth.day, dateOfBirth.month, dateOfBirth.year);
      if (age < 20) {
        setErrors({ age: 'Du måste vara minst 20 år' });
        return;
      }
      
      setErrors({});
      
      // Format date for database
      const dobString = `${dateOfBirth.year}-${dateOfBirth.month.padStart(2, '0')}-${dateOfBirth.day.padStart(2, '0')}`;
      const formattedPhone = phone.startsWith('0') ? `+46${phone.slice(1)}` : `+46${phone}`;
      
      // Update profile in database
      const { data: session } = await supabase.auth.getSession();
      
      if (session.session) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            date_of_birth: dobString,
            phone: formattedPhone,
            phone_verified_at: new Date().toISOString(),
          })
          .eq('user_id', session.session.user.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
          // If profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: session.session.user.id,
              date_of_birth: dobString,
              phone: formattedPhone,
              phone_verified_at: new Date().toISOString(),
            });
          
          if (insertError) {
            console.error('Profile insert error:', insertError);
            toast.error('Kunde inte spara profil');
            return;
          }
        }

        toast.success('Profil skapad!');
        
        // Check if user already completed onboarding (returning user)
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', session.session.user.id)
          .single();
        
        if (profileCheck?.onboarding_completed) {
          navigate('/matches');
        } else {
          navigate('/onboarding');
        }
      } else {
        // No session - show error and redirect to start
        toast.error('Sessionen har gått ut. Försök igen.');
        setStep('phone');
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        e.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative">
        <button
          onClick={() => step === 'phone' ? navigate('/') : setStep('phone')}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 'phone' ? 'Tillbaka till startsidan' : 'Ändra nummer'}
        </button>

        <Card className="shadow-card border-border overflow-hidden">
          <CardHeader className="text-center">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Heart className="w-7 h-7 text-primary-foreground" fill="currentColor" />
            </div>
            <CardTitle className="text-2xl font-serif">
              {step === 'phone' && 'Ange ditt nummer'}
              {step === 'verify' && 'Verifiera din telefon'}
              {step === 'profile' && 'Bekräfta din ålder'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' && 'Vi skickar en verifieringskod via SMS'}
              {step === 'verify' && `Ange koden vi skickade till +46 ${phone}`}
              {step === 'profile' && 'Du måste vara minst 20 år för att använda MÄÄK'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === 'phone' && (
                <motion.div
                  key="phone"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    error={errors.phone || (error || undefined)}
                    disabled={loading}
                  />
                  
                  <Button
                    onClick={handleSendOtp}
                    className="w-full gradient-primary text-primary-foreground border-0 shadow-glow"
                    disabled={loading || phone.replace(/\D/g, '').length < 9}
                  >
                    {loading ? 'Skickar...' : 'Skicka kod'}
                  </Button>

                  {/* Email auth link removed - phone only */}
                </motion.div>
              )}

              {step === 'verify' && (
                <motion.div
                  key="verify"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    error={errors.otp || (error || undefined)}
                    disabled={loading}
                  />
                  
                  <Button
                    onClick={handleVerifyOtp}
                    className="w-full gradient-primary text-primary-foreground border-0 shadow-glow"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? 'Verifierar...' : 'Verifiera'}
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || loading}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {countdown > 0 ? `Skicka igen om ${countdown}s` : 'Skicka ny kod'}
                    </button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Tips: I demo-läge, använd koden <span className="font-mono font-bold">123456</span>
                  </p>
                </motion.div>
              )}

              {step === 'profile' && (
                <motion.div
                  key="profile"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <AgeVerification
                    dateOfBirth={dateOfBirth}
                    onChange={setDateOfBirth}
                    error={errors.age || errors['dateOfBirth.day'] || errors['dateOfBirth.month'] || errors['dateOfBirth.year']}
                  />

                  <Button
                    onClick={handleCompleteProfile}
                    className="w-full gradient-primary text-primary-foreground border-0 shadow-glow"
                    disabled={loading || !dateOfBirth.day || !dateOfBirth.month || !dateOfBirth.year}
                  >
                    {loading ? 'Sparar...' : 'Slutför registrering'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {['phone', 'verify', 'profile'].map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                step === s ? 'bg-primary' : 
                ['phone', 'verify', 'profile'].indexOf(step) > i ? 'bg-primary/50' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
