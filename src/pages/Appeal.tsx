import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, FileQuestion, CheckCircle } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function Appeal() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/phone-auth');
      return;
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reason.trim()) {
      toast.error(t('appeal.fill_reason'));
      return;
    }
    setSubmitting(true);
    const { data: newAppeal, error } = await supabase
      .from('appeals')
      .insert({
        user_id: user.id,
        reason: reason.trim(),
        status: 'pending',
      })
      .select('id')
      .single();
    if (error) {
      console.error('Appeal insert error:', error);
      toast.error(t('appeal.submit_error'));
      setSubmitting(false);
      return;
    }
    const userEmail = user.email?.trim();
    const isPlaceholderEmail = userEmail?.includes('@phone.maak.app') ?? true;
    if (userEmail && !isPlaceholderEmail && newAppeal?.id) {
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userEmail,
            template: 'appeal_received',
            data: { appeal_id: newAppeal.id },
            language: i18n.language?.startsWith('en') ? 'en' : 'sv',
          },
        });
      } catch (e) {
        console.warn('Appeal confirmation email failed:', e);
      }
    }
    setSubmitting(false);
    setSubmitted(true);
    toast.success(t('appeal.received'));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              {t('appeal.received_title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{t('appeal.received_message')}</p>
            <Button asChild className="w-full">
              <Link to="/profile">{t('common.back')}</Link>
            </Button>
          </CardContent>
        </Card>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-bold flex items-center gap-2">
            <FileQuestion className="w-5 h-5" />
            {t('appeal.title')}
          </h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <p className="text-sm text-muted-foreground">{t('appeal.intro')}</p>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-base">{t('appeal.form_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">{t('appeal.reason')} *</Label>
                <Textarea
                  id="reason"
                  placeholder={t('appeal.reason_placeholder')}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  required
                  className="resize-none"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !reason.trim()}>
                {submitting ? t('common.sending') : t('appeal.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>

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
