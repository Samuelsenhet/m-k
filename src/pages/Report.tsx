import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ButtonPrimary, ButtonIcon, CardV2, CardV2Content, CardV2Header, CardV2Title } from '@/components/ui-v2';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, AlertCircle, Upload, X } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const VIOLATION_TYPES = [
  'harassment',
  'hate_speech',
  'fraud',
  'nude_content',
  'spam',
  'fake_profile',
  'other',
] as const;

export default function Report() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const reportedUserId = searchParams.get('userId') ?? undefined;
  const matchIdParam = searchParams.get('matchId') ?? undefined;
  const contextParam = searchParams.get('context') ?? 'general';
  const context = ['profile', 'chat', 'general'].includes(contextParam) ? contextParam : 'general';

  const [violationType, setViolationType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [witnessStatement, setWitnessStatement] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const valid = files.filter((f) => allowed.includes(f.type));
    if (valid.length < files.length) {
      toast.error(t('report.invalid_file_type'));
    }
    setEvidenceFiles((prev) => [...prev, ...valid].slice(0, 5));
  }, [t]);

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitReport = async () => {
    if (!user) {
      navigate('/phone-auth');
      return;
    }
    if (!violationType || !description.trim()) {
      toast.error(t('report.fill_required'));
      return;
    }

    setSubmitting(true);
    try {
      const evidencePaths: string[] = [];
      for (const file of evidenceFiles) {
        const ext = file.name.split('.').pop() ?? 'bin';
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('report-evidence')
          .upload(path, file, { upsert: false });
        if (uploadError) {
          if (import.meta.env.DEV) console.error('Evidence upload error:', uploadError);
          toast.error(t('report.upload_error'));
          setSubmitting(false);
          return;
        }
        evidencePaths.push(path);
      }

      const { data: newReport, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId || null,
          match_id: matchIdParam || null,
          context,
          violation_type: violationType,
          description: description.trim(),
          evidence_paths: evidencePaths,
          witness_statement: witnessStatement.trim() || null,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        if (import.meta.env.DEV) console.error('Report insert error:', error);
        toast.error(t('report.submit_error'));
        setSubmitting(false);
        return;
      }

      const reporterEmail = user.email?.trim();
      const isPlaceholderEmail = reporterEmail?.includes('@phone.maak.app') ?? true;
      if (reporterEmail && !isPlaceholderEmail && newReport?.id) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: reporterEmail,
              template: 'report_received',
              data: { report_id: newReport.id },
              language: i18n.language?.startsWith('en') ? 'en' : 'sv',
            },
          });
        } catch (e) {
          if (import.meta.env.DEV) console.warn('Report confirmation email failed:', e);
        }
      }

      setSubmitted(true);
      toast.success(t('report.received'));
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      toast.error(t('report.submit_error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col items-center justify-center px-4">
        <CardV2 className="max-w-lg w-full" padding="none">
          <CardV2Header className="p-6">
            <CardV2Title className="font-serif flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              {t('report.received_title')}
            </CardV2Title>
          </CardV2Header>
          <CardV2Content className="p-6 pt-0 space-y-4 text-sm text-muted-foreground">
            <p>{t('report.received_message')}</p>
            <ButtonPrimary asChild className="w-full">
              <Link to="/profile">{t('common.back')}</Link>
            </ButtonPrimary>
          </CardV2Content>
        </CardV2>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          {context === 'general' ? (
            <ButtonIcon asChild>
              <Link to="/profile" state={{ openSettings: true }}>
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </ButtonIcon>
          ) : (
            <ButtonIcon onClick={() => navigate(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </ButtonIcon>
          )}
          <h1 className="font-serif text-lg font-bold">{t('report.title')}</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <p className="text-sm text-muted-foreground">{t('report.intro')}</p>

        <CardV2 padding="none">
          <CardV2Header className="p-6">
            <CardV2Title className="font-serif text-base">{t('report.form_title')}</CardV2Title>
          </CardV2Header>
          <CardV2Content className="p-6 pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="violation">{t('report.violation_type')} *</Label>
              <Select value={violationType} onValueChange={setViolationType} required>
                <SelectTrigger id="violation">
                  <SelectValue placeholder={t('report.select_violation')} />
                </SelectTrigger>
                <SelectContent>
                  {VIOLATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`report.violation_${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('report.context_evidence')} *</Label>
              <Textarea
                id="description"
                placeholder={t('report.context_placeholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('report.evidence')}</Label>
              <div className="flex flex-wrap gap-2">
                {evidenceFiles.map((file, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-sm"
                  >
                    {file.name}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-0.5 rounded hover:bg-muted-foreground/20"
                      aria-label={t('common.cancel')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                {evidenceFiles.length < 5 && (
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-dashed border-muted-foreground/40 text-sm cursor-pointer hover:bg-muted/50">
                    <Upload className="w-4 h-4" />
                    {t('report.attach')}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                      multiple
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t('report.evidence_hint')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="witness">{t('report.witness_optional')}</Label>
              <Textarea
                id="witness"
                placeholder={t('report.witness_placeholder')}
                value={witnessStatement}
                onChange={(e) => setWitnessStatement(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <ButtonPrimary
              className="w-full"
              onClick={submitReport}
              disabled={submitting || !violationType || !description.trim()}
            >
              {submitting ? t('common.sending') : t('report.submit')}
            </ButtonPrimary>
          </CardV2Content>
        </CardV2>

        <p className="text-xs text-muted-foreground text-center">
          <Link to="/reporting" className="underline hover:text-foreground">
            {t('report.view_policy')}
          </Link>
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
