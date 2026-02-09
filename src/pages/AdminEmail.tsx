import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useProfileData } from '@/hooks/useProfileData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Mail, FileText, Users, Send, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface EmailLogRow {
  id: string;
  recipient_email: string;
  subject: string;
  template_name: string | null;
  status: string;
  report_id: string | null;
  appeal_id: string | null;
  error_message: string | null;
  created_at: string;
}

const EMAIL_CATEGORIES = [
  { label: 'Rapporter', value: 'reports', icon: FileText, templates: ['report_received', 'report_resolved'] },
  { label: 'Överklaganden', value: 'appeals', icon: Users, templates: ['appeal_received', 'appeal_decision'] },
];

export default function AdminEmail() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isModerator } = useProfileData(user?.id);
  const [logs, setLogs] = useState<EmailLogRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/phone-auth');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !isModerator) return;

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('id, recipient_email, subject, template_name, status, report_id, appeal_id, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching email logs:', error);
        setLogs([]);
      } else {
        setLogs((data ?? []) as EmailLogRow[]);
      }
      setLoadingLogs(false);
    };

    fetchLogs();
  }, [user, isModerator]);

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
        <p className="text-muted-foreground text-center mb-4">Du har inte behörighet till denna sida.</p>
        <Button asChild>
          <Link to="/profile">Tillbaka</Link>
        </Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-bold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            E-posthantering
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* E-postmallar */}
        <section>
          <h2 className="text-lg font-semibold mb-4">E-postmallar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EMAIL_CATEGORIES.map((cat) => (
              <Card key={cat.value} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <cat.icon className="w-4 h-4 text-primary" />
                    {cat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-2">
                    Mallar: {cat.templates.join(', ')}
                  </p>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90 p-0 h-auto font-medium">
                    Hantera mallar →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Skicka e-post (placeholder) */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Skicka e-post</h2>
          <Card>
            <CardContent className="pt-6">
              <textarea
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground resize-y"
                rows={4}
                placeholder="Skriv ditt meddelande... (kommer att kopplas till mallar och mottagare)"
                readOnly
                disabled
              />
              <div className="flex flex-wrap gap-3 mt-3">
                <Button size="sm" className="gap-2" disabled>
                  <Send className="w-4 h-4" />
                  Skicka till valda användare
                </Button>
                <Button size="sm" variant="outline" disabled>
                  Spara som mall
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Bulk-utskick och mallredigering kommer i en senare version.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Sändningsloggar */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Sändningsloggar</h2>
          <Card>
            {loadingLogs ? (
              <CardContent className="py-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </CardContent>
            ) : logs.length === 0 ? (
              <CardContent className="py-6 text-center text-muted-foreground text-sm">
                Inga e-postmeddelanden skickade än.
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Datum</th>
                      <th className="p-3 text-left font-medium">Mottagare</th>
                      <th className="p-3 text-left font-medium max-w-[120px] truncate">Ämne</th>
                      <th className="p-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), 'd MMM HH:mm', { locale: sv })}
                        </td>
                        <td className="p-3 truncate max-w-[140px]" title={log.recipient_email}>
                          {log.recipient_email}
                        </td>
                        <td className="p-3 truncate max-w-[120px]" title={log.subject}>
                          {log.subject}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              log.status === 'sent'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {log.status === 'sent' ? 'Skickad' : 'Misslyckad'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
