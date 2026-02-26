import { useState, useEffect } from 'react';
import { Mail, Send, FileText, BarChart3, Calendar, History, LayoutTemplate } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ButtonPrimary, CardV2, CardV2Content, InputV2 } from '@/components/ui-v2';
import { toast } from 'sonner';
import EmailTemplatesManager from './EmailTemplatesManager';
import BulkEmailSender from './BulkEmailSender';
import EmailAnalytics from './EmailAnalytics';
import EmailLogs from './EmailLogs';

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export default function AdminEmailDashboard() {
  const [stats, setStats] = useState({
    sentToday: 0,
    totalTemplates: 0,
    pendingBulk: 0,
  });
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const [logsRes, templatesRes, bulkRes] = await Promise.all([
        supabase
          .from('email_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayStart()),
        supabase.from('email_templates').select('id', { count: 'exact', head: true }),
        supabase
          .from('bulk_emails')
          .select('id', { count: 'exact', head: true })
          .in('status', ['draft', 'scheduled']),
      ]);

      setStats({
        sentToday: logsRes.count ?? 0,
        totalTemplates: templatesRes.count ?? 0,
        pendingBulk: bulkRes.count ?? 0,
      });
    };

    fetchStats();
  }, []);

  const sendTestEmail = async () => {
    const to = testEmail.trim();
    if (!to) {
      toast.error('Ange en e-postadress');
      return;
    }
    setTestSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          template: 'report_received',
          data: { report_id: `test-${Date.now()}` },
          language: 'sv',
        },
      });

      if (error) {
        const err = error as { message?: string; error?: string };
        const errMsg =
          err.error ??
          err.message ??
          (data as { error?: string } | null)?.error ??
          'Anrop till send-email misslyckades. Kontrollera att funktionen är deployad och att RESEND_API_KEY är satt i Supabase (Edge Functions → send-email → Secrets).';
        toast.error('Testmail misslyckades', { description: errMsg });
        return;
      }

      if (data?.skipped) {
        toast.info('E-post hoppades över', { description: data.reason ?? 'T.ex. placeholder-adress' });
      } else if (data?.success) {
        toast.success('Testmail skickat', {
          description: `Till ${to}. Kolla inkorg och skräppost. Fick du inget? Se fliken Loggar nedan och Resend.com → Logs.`,
        });
        setStats((s) => ({ ...s, sentToday: s.sentToday + 1 }));
      } else {
        const errMsg = (data as { error?: string; details?: unknown })?.error ?? 'Okänt fel';
        const details = (data as { details?: { message?: string } })?.details;
        toast.error('Kunde inte skicka', {
          description: details?.message ? `${errMsg}: ${details.message}` : errMsg,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Kunde inte anropa send-email';
      toast.error('Testmail misslyckades', { description: msg });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">E-posthantering</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hantera e-postmallar, skicka utskick och se loggar
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardV2 padding="none">
          <CardV2Content className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/15 dark:bg-primary/20">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skickade idag</p>
                <p className="text-xl font-bold">{stats.sentToday}</p>
              </div>
            </div>
          </CardV2Content>
        </CardV2>
        <CardV2 padding="none">
          <CardV2Content className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mallar</p>
                <p className="text-xl font-bold">{stats.totalTemplates}</p>
              </div>
            </div>
          </CardV2Content>
        </CardV2>
        <CardV2 padding="none">
          <CardV2Content className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Schemalagda / utkast</p>
                <p className="text-xl font-bold">{stats.pendingBulk}</p>
              </div>
            </div>
          </CardV2Content>
        </CardV2>
      </div>

      <CardV2 padding="none">
        <CardV2Content className="pt-6">
          <h3 className="font-semibold mb-2">Skicka testmail</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Skickar ett e-postmeddelande med mallen &quot;Rapport mottagen&quot; till adressen du anger. Använd för att verifiera att e-postfunktionen fungerar.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <InputV2
              type="email"
              placeholder="t.ex. din@epost.se"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="max-w-xs"
            />
            <ButtonPrimary onClick={sendTestEmail} disabled={testSending}>
              {testSending ? 'Skickar...' : 'Skicka testmail'}
            </ButtonPrimary>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Om det misslyckas: kontrollera att Edge Function &quot;send-email&quot; är deployad och att <strong>RESEND_API_KEY</strong> är satt i Supabase (Edge Functions → send-email → Secrets). Avsändardomän (t.ex. maakapp.se) måste vara verifierad i Resend.
          </p>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Fick du inget mejl trots &quot;Testmail skickat&quot;?</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Kolla <strong>skräppost</strong> och &quot;Promotions&quot; (Gmail).</li>
              <li>Öppna fliken <strong>Loggar</strong> nedan – står mailet som &quot;Skickad&quot; eller &quot;Misslyckad&quot;? Vid misslyckad visas felmeddelande från Resend.</li>
              <li>Logga in på <strong>resend.com</strong> → <strong>Logs</strong> – se om mailet levererades eller studsade (bounce).</li>
              <li>Avsändare är <strong>MAIL_FROM</strong> (standard: no-reply@maakapp.se). Domänen måste vara verifierad i Resend → Domains.</li>
            </ul>
          </div>
        </CardV2Content>
      </CardV2>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="templates" className="gap-1.5">
            <LayoutTemplate className="w-4 h-4" />
            Mallar
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-1.5">
            <Send className="w-4 h-4" />
            Skicka
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Analys
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <History className="w-4 h-4" />
            Loggar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="mt-6">
          <EmailTemplatesManager />
        </TabsContent>
        <TabsContent value="send" className="mt-6">
          <BulkEmailSender />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <EmailAnalytics />
        </TabsContent>
        <TabsContent value="logs" className="mt-6">
          <EmailLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
