import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Upload, FileImage, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getProfilesAuthKey } from '@/lib/profiles';
import { useAchievementsContextOptional } from '@/contexts/AchievementsContext';

type VerificationStatus = 'pending' | 'approved' | 'rejected' | null;

interface IdVerificationStepProps {
  onSubmit: () => void;
  /** When provided (e.g. from Settings), no profile fetch is done. */
  initialStatus?: VerificationStatus;
  initialFrontPath?: string | null;
  initialBackPath?: string | null;
}

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';
const MAX_SIZE_MB = 5;

export function IdVerificationStep({
  initialStatus: initialStatusProp,
  initialFrontPath: initialFrontPathProp,
  initialBackPath: initialBackPathProp,
  onSubmit,
}: IdVerificationStepProps) {
  const { user } = useAuth();
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<VerificationStatus>(initialStatusProp ?? null);
  const [profileFrontPath, setProfileFrontPath] = useState<string | null>(initialFrontPathProp ?? null);
  const [profileBackPath, setProfileBackPath] = useState<string | null>(initialBackPathProp ?? null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const hasInitial = initialStatusProp !== undefined || initialFrontPathProp !== undefined || initialBackPathProp !== undefined;
    if (hasInitial) {
      setStatus(initialStatusProp ?? null);
      setProfileFrontPath(initialFrontPathProp ?? null);
      setProfileBackPath(initialBackPathProp ?? null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const profileKey = await getProfilesAuthKey(user.id);
        const { data } = await supabase
          .from('profiles')
          .select('id_verification_status, id_document_front_path, id_document_back_path')
          .eq(profileKey, user.id)
          .maybeSingle();
        if (!cancelled && data) {
          setStatus((data.id_verification_status as VerificationStatus) ?? null);
          setProfileFrontPath(data.id_document_front_path ?? null);
          setProfileBackPath(data.id_document_back_path ?? null);
        }
      } catch {
        if (!cancelled) setStatus(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, initialStatusProp, initialFrontPathProp, initialBackPathProp]);

  useEffect(() => {
    if (status === 'approved' && achievementsCtx) {
      achievementsCtx.checkAndAwardAchievement('id_verified');
    }
  }, [status]);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Filen får max vara ${MAX_SIZE_MB} MB`);
      return false;
    }
    const type = file.type.toLowerCase();
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type)) {
      toast.error('Endast JPG, PNG eller WebP.');
      return false;
    }
    return true;
  };

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) return;
    setFrontFile(file);
    const url = URL.createObjectURL(file);
    setFrontPreview(url);
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) return;
    setBackFile(file);
    const url = URL.createObjectURL(file);
    setBackPreview(url);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!frontFile && !profileFrontPath) {
      toast.error('Ladda upp framsidan av ditt ID.');
      return;
    }

    setSubmitting(true);
    try {
      const profileKey = await getProfilesAuthKey(user.id);
      let frontPath: string | null = initialFrontPath;
      let backPath: string | null = initialBackPath;

      if (frontFile) {
        const ext = frontFile.name.split('.').pop() || 'jpg';
        frontPath = `${user.id}/front-${Date.now()}.${ext}`;
        const { error: frontErr } = await supabase.storage
          .from('id-documents')
          .upload(frontPath, frontFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: frontFile.type,
          });
        if (frontErr) throw frontErr;
      }

      if (backFile) {
        const ext = backFile.name.split('.').pop() || 'jpg';
        backPath = `${user.id}/back-${Date.now()}.${ext}`;
        const { error: backErr } = await supabase.storage
          .from('id-documents')
          .upload(backPath, backFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: backFile.type,
          });
        if (backErr) throw backErr;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          id_document_front_path: frontPath,
          id_document_back_path: backPath,
          id_verification_status: 'pending',
          id_verification_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq(profileKey, user.id);

      if (error) throw error;

      setStatus('pending');
      setProfileFrontPath(frontPath);
      setProfileBackPath(backPath);
      toast.success('ID skickat för verifiering. Du får besked när det är granskat.');
      onSubmit();
    } catch (err) {
      console.error('ID verification submit error:', err);
      toast.error('Kunde inte skicka in. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFront = () => {
    setFrontFile(null);
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontPreview(null);
    if (frontInputRef.current) frontInputRef.current.value = '';
  };

  const clearBack = () => {
    setBackFile(null);
    if (backPreview) URL.revokeObjectURL(backPreview);
    setBackPreview(null);
    if (backInputRef.current) backInputRef.current.value = '';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Laddar...</p>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <h2 className="text-xl font-serif font-bold text-foreground">Kontot är verifierat</h2>
        <p className="text-muted-foreground text-sm">
          Din identitet har verifierats. Du kan gå vidare.
        </p>
        <Button onClick={onSubmit} className="w-full">
          Fortsätt
        </Button>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
        </div>
        <h2 className="text-xl font-serif font-bold text-foreground">Verifiering avvisad</h2>
        <p className="text-muted-foreground text-sm">
          Din ID-verifiering kunde inte godkännas. Kontakta support om du har frågor.
        </p>
        <Button variant="outline" onClick={onSubmit}>
          Fortsätt ändå
        </Button>
      </div>
    );
  }

  if (status === 'pending' && initialFrontPath && !frontFile) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-serif font-bold text-foreground">Väntar på granskning</h2>
        <p className="text-muted-foreground text-sm">
          Ditt ID har skickats in och väntar på verifiering. Du får besked när det är klart.
        </p>
        <Button onClick={onSubmit}>Fortsätt</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-serif font-bold text-foreground">Verifiera ditt konto</h2>
        <p className="text-sm text-muted-foreground">
          Ladda upp ett foto av ditt ID (körkort eller pass) så att vi kan verifiera din identitet. Framsidan krävs, baksidan är valfri.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Framsida av ID *</Label>
          <input
            ref={frontInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFrontChange}
            className="hidden"
          />
          {frontPreview ? (
            <div className="relative rounded-xl border border-border overflow-hidden bg-muted/30">
              <img src={frontPreview} alt="ID framsida" className="w-full h-40 object-contain" />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearFront}
              >
                Byt
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => frontInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors py-8 flex flex-col items-center gap-2 text-muted-foreground"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">Ladda upp framsida</span>
              <span className="text-xs">JPG, PNG eller WebP, max {MAX_SIZE_MB} MB</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="id-verification-back" className="text-sm font-medium">Baksida av ID (valfritt)</Label>
          <input
            id="id-verification-back"
            name="idBack"
            ref={backInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleBackChange}
            className="hidden"
            aria-label="Ladda upp baksida av ID"
          />
          {backPreview ? (
            <div className="relative rounded-xl border border-border overflow-hidden bg-muted/30">
              <img src={backPreview} alt="ID baksida" className="w-full h-40 object-contain" />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearBack}
              >
                Byt
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => backInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors py-6 flex flex-col items-center gap-2 text-muted-foreground"
            >
              <FileImage className="w-6 h-6" />
              <span className="text-sm">Ladda upp baksida (valfritt)</span>
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Dina uppgifter hanteras säkert och används endast för verifiering. Efter granskning kan dokumenten arkiveras enligt vår integritetspolicy.
      </p>

      <Button
        onClick={handleSubmit}
        disabled={submitting || (!frontFile && !profileFrontPath)}
        className="w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Skickar...
          </>
        ) : (
          'Skicka in för verifiering'
        )}
      </Button>
    </div>
  );
}
