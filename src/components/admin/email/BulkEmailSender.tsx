import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { ButtonPrimary, ButtonSecondary, CardV2, CardV2Content, InputV2 } from '@/components/ui-v2';
import { Label } from '@/components/ui/label';
import { Send, Calendar, Filter, Users } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateOption {
  id: string;
  name: string;
  category: string | null;
}

interface CampaignState {
  name: string;
  template_id: string;
  filters: { country?: string; active?: string; created_after?: string };
  scheduled_for: string;
}

export default function BulkEmailSender() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [userCount, setUserCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<CampaignState>({
    name: '',
    template_id: '',
    filters: {},
    scheduled_for: '',
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('email_templates')
        .select('id, name, category')
        .order('name');
      setTemplates((data as TemplateOption[]) ?? []);
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    const estimateCount = async () => {
      let query = supabase.from('profiles').select('id', { count: 'exact', head: true });
      if (campaign.filters.country) {
        query = query.eq('country', campaign.filters.country);
      }
      const { count } = await query;
      setUserCount(count ?? 0);
    };
    estimateCount();
  }, [campaign.filters]);

  const sendCampaign = async () => {
    if (!user) {
      toast.error('Du måste vara inloggad.');
      return;
    }
    if (!campaign.name.trim()) {
      toast.error('Ange ett kampanjnamn.');
      return;
    }
    if (!campaign.template_id) {
      toast.error('Välj en e-postmall.');
      return;
    }

    setLoading(true);
    try {
      const { data: row, error: insertError } = await supabase
        .from('bulk_emails')
        .insert({
          name: campaign.name.trim(),
          template_id: campaign.template_id || null,
          filters: Object.keys(campaign.filters).length ? campaign.filters : null,
          status: campaign.scheduled_for ? 'scheduled' : 'draft',
          scheduled_for: campaign.scheduled_for || null,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (insertError) {
        toast.error(insertError.message || 'Kunde inte skapa kampanj');
        setLoading(false);
        return;
      }

      if (!campaign.scheduled_for && row?.id) {
        const { data: invokeData, error: invokeError } = await supabase.functions.invoke('send-bulk-email', {
          body: { campaign_id: row.id },
        });
        if (invokeError) {
          toast.error(invokeError.message || 'Kunde inte starta utskick');
        } else if (invokeData?.success) {
          toast.success(`Skickat: ${invokeData.sent} lyckade, ${invokeData.failed} misslyckade.`);
          setCampaign({ name: '', template_id: '', filters: {}, scheduled_for: '' });
        } else {
          toast.error(invokeData?.error || 'Utskick misslyckades');
        }
      } else {
        toast.success('Kampanjen är schemalagd.');
        setCampaign({ name: '', template_id: '', filters: {}, scheduled_for: '' });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Skapa utskick</h2>

      <CardV2 padding="none">
        <CardV2Content className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Kampanjnamn</Label>
              <InputV2
                id="campaign-name"
                value={campaign.name}
                onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                placeholder="t.ex. Välkomstmail"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-template">E-postmall</Label>
              <select
                id="campaign-template"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={campaign.template_id}
                onChange={(e) => setCampaign({ ...campaign, template_id: e.target.value })}
              >
                <option value="">Välj en mall</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <Filter className="w-4 h-4" />
              Filter (valfritt)
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Land</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  value={campaign.filters.country ?? ''}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      filters: { ...campaign.filters, country: e.target.value || undefined },
                    })
                  }
                >
                  <option value="">Alla</option>
                  <option value="SE">Sverige</option>
                  <option value="NO">Norge</option>
                  <option value="DK">Danmark</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Skicka vid (datum/tid)</Label>
                <InputV2
                  type="datetime-local"
                  className="h-9"
                  value={campaign.scheduled_for}
                  onChange={(e) => setCampaign({ ...campaign, scheduled_for: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Lämna datum tomt för att skicka direkt.</p>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Uppskattat antal mottagare</span>
            </div>
            <span className="text-lg font-bold">{userCount}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Endast användare med en riktig e-postadress (inte @phone.maak.app) får mailet. Antalet ovan är alla profiler.
          </p>

          <div className="flex flex-wrap gap-2">
            <ButtonPrimary
              onClick={sendCampaign}
              disabled={loading || !campaign.name.trim() || !campaign.template_id}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {campaign.scheduled_for ? 'Schemalägg' : 'Skicka nu'}
            </ButtonPrimary>
            <ButtonSecondary
              onClick={() => setCampaign({ name: '', template_id: '', filters: {}, scheduled_for: '' })}
            >
              Rensa
            </ButtonSecondary>
          </div>
        </CardV2Content>
      </CardV2>
    </div>
  );
}
