import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ButtonIcon, ButtonSecondary, CardV2, CardV2Content, CardV2Header, CardV2Title } from '@/components/ui-v2';
import { ChevronLeft, AlertCircle, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

interface ReportRow {
  id: string;
  context: string;
  violation_type: string;
  description: string;
  status: ReportStatus;
  created_at: string;
}

const STATUS_CONFIG: Record<ReportStatus, { labelKey: string; icon: typeof Clock }> = {
  pending: { labelKey: 'report.status_pending', icon: Clock },
  reviewing: { labelKey: 'report.status_reviewing', icon: FileText },
  resolved: { labelKey: 'report.status_resolved', icon: CheckCircle },
  dismissed: { labelKey: 'report.status_dismissed', icon: XCircle },
};

export default function ReportHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/phone-auth');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, context, violation_type, description, status, created_at')
        .eq('reporter_id', user.id)
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
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
          <h1 className="font-serif text-lg font-bold">{t('report.history_title')}</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground">{t('report.history_intro')}</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : reports.length === 0 ? (
          <CardV2 padding="none">
            <CardV2Content className="p-6 flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('report.history_empty')}</p>
              <ButtonSecondary asChild>
                <Link to="/report">{t('report.report_problem')}</Link>
              </ButtonSecondary>
            </CardV2Content>
          </CardV2>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => {
              const config = STATUS_CONFIG[r.status as ReportStatus] ?? STATUS_CONFIG.pending;
              const Icon = config.icon;
              return (
                <li key={r.id}>
                  <CardV2 padding="none">
                    <CardV2Header className="p-6 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardV2Title className="font-serif text-sm flex items-center gap-2">
                          <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                          {t(`report.violation_${r.violation_type}`)}
                        </CardV2Title>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(r.created_at), 'd MMM yyyy', { locale: sv })}
                        </span>
                      </div>
                    </CardV2Header>
                    <CardV2Content className="p-6 pt-0 space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                      <p className="text-xs font-medium text-foreground">
                        {t(config.labelKey)}
                      </p>
                    </CardV2Content>
                  </CardV2>
                </li>
              );
            })}
          </ul>
        )}

        <ButtonSecondary className="w-full" asChild>
          <Link to="/reporting">{t('report.view_policy')}</Link>
        </ButtonSecondary>
      </div>
      <BottomNav />
    </div>
  );
}
