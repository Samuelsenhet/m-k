import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export interface EmailLogRow {
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

const PAGE_SIZE = 50;

export default function EmailLogs() {
  const [logs, setLogs] = useState<EmailLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      let query = supabase
        .from('email_logs')
        .select('id, recipient_email, subject, template_name, status, report_id, appeal_id, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (filter.trim()) {
        query = query.or(`recipient_email.ilike.%${filter.trim()}%,subject.ilike.%${filter.trim()}%,template_name.ilike.%${filter.trim()}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching email logs:', error);
        setLogs([]);
      } else {
        setLogs((data ?? []) as EmailLogRow[]);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [filter, statusFilter]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sändningsloggar</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Sök mottagare, ämne eller mall..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Alla statusar</option>
          <option value="sent">Skickad</option>
          <option value="failed">Misslyckad</option>
          <option value="bounced">Bounced</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        ) : logs.length === 0 ? (
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Inga e-postmeddelanden hittades.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Datum</th>
                  <th className="p-3 text-left font-medium">Mottagare</th>
                  <th className="p-3 text-left font-medium max-w-[140px] truncate">Ämne</th>
                  <th className="p-3 text-left font-medium">Mall</th>
                  <th className="p-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), 'd MMM HH:mm', { locale: sv })}
                    </td>
                    <td className="p-3 truncate max-w-[160px]" title={log.recipient_email}>
                      {log.recipient_email}
                    </td>
                    <td className="p-3 truncate max-w-[140px]" title={log.subject}>
                      {log.subject}
                    </td>
                    <td className="p-3 text-muted-foreground">{log.template_name ?? '–'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          log.status === 'sent'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : log.status === 'bounced'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {log.status === 'sent' ? 'Skickad' : log.status === 'bounced' ? 'Bounced' : 'Misslyckad'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
