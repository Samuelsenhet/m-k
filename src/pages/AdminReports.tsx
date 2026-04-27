import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ButtonPrimary, ButtonIcon, CardV2, CardV2Content, CardV2Header, CardV2Title } from '@/components/ui-v2';
import { ChevronLeft, Shield, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  context: string;
  violation_type: string;
  description: string;
  status: ReportStatus;
  created_at: string;
}

export default function AdminReports() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isModerator, setIsModerator] = useState<boolean | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/phone-auth');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const checkModerator = async () => {
      const { data } = await supabase
        .from('moderator_roles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      setIsModerator(!!data);
    };
    checkModerator();
  }, [user]);

  useEffect(() => {
    if (!user || !isModerator) return;

    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, reporter_id, reported_user_id, context, violation_type, description, status, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching reports:', error);
        setReports([]);
      } else {
        setReports((data ?? []) as ReportRow[]);
      }
      setLoading(false);
    };

    fetchReports();
  }, [user, isModerator]);

  const updateStatus = async (reportId: string, status: ReportStatus) => {
    setUpdatingId(reportId);
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId);
    if (error) {
      if (import.meta.env.DEV) console.error('Error updating report:', error);
    } else {
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    }
    setUpdatingId(null);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isModerator === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20">
        <p className="text-muted-foreground text-center mb-4">{t('admin.access_denied')}</p>
        <ButtonPrimary asChild>
          <Link to="/profile">{t('common.back')}</Link>
        </ButtonPrimary>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
<ButtonIcon asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </ButtonIcon>
          <h1 className="font-serif text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('admin.reports_title')}
          </h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <CardV2 padding="none">
            <CardV2Content className="pt-6 text-center text-muted-foreground">
              {t('admin.no_reports')}
            </CardV2Content>
          </CardV2>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id}>
                <CardV2 padding="none">
                  <CardV2Header className="pb-2">
                    <CardV2Title className="font-serif text-sm flex items-center justify-between gap-2">
                      <span>{t(`report.violation_${r.violation_type}`)}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {format(new Date(r.created_at), 'd MMM yyyy HH:mm', { locale: sv })}
                      </span>
                    </CardV2Title>
                  </CardV2Header>
                  <CardV2Content className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('report.context_evidence')}: {r.context}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-muted-foreground">{t('admin.status')}:</span>
                      <Select
                        value={r.status}
                        onValueChange={(v) => updateStatus(r.id, v as ReportStatus)}
                        disabled={updatingId === r.id}
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t('report.status_pending')}</SelectItem>
                          <SelectItem value="reviewing">{t('report.status_reviewing')}</SelectItem>
                          <SelectItem value="resolved">{t('report.status_resolved')}</SelectItem>
                          <SelectItem value="dismissed">{t('report.status_dismissed')}</SelectItem>
                        </SelectContent>
                      </Select>
                      {updatingId === r.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </CardV2Content>
                </CardV2>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
