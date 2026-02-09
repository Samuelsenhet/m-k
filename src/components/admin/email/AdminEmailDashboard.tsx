import { useState, useEffect } from 'react';
import { Mail, Send, FileText, BarChart3, Calendar, History, Template } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">E-posthantering</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hantera e-postmallar, skicka utskick och se loggar
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                <Mail className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skickade idag</p>
                <p className="text-xl font-bold">{stats.sentToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mallar</p>
                <p className="text-xl font-bold">{stats.totalTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Schemalagda / utkast</p>
                <p className="text-xl font-bold">{stats.pendingBulk}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="templates" className="gap-1.5">
            <Template className="w-4 h-4" />
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
