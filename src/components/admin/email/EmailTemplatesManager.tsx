import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Eye, Copy, X } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface EmailTemplateRow {
  id: string;
  name: string;
  subject_sv: string;
  body_sv: string;
  subject_en: string | null;
  body_en: string | null;
  category: string | null;
  description: string | null;
  last_used: string | null;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'system', label: 'System', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'reports', label: 'Rapporter', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
  { value: 'appeals', label: 'Överklaganden', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'marketing', label: 'Marknadsföring', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'users', label: 'Användare', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
];

export default function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<EmailTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EmailTemplateRow> | null>(null);
  const [preview, setPreview] = useState<EmailTemplateRow | null>(null);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('id, name, subject_sv, body_sv, subject_en, body_en, category, description, last_used, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    } else {
      setTemplates((data ?? []) as EmailTemplateRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const saveTemplate = async () => {
    if (!editing) return;
    const payload = {
      name: editing.name?.trim() || 'unnamed',
      subject_sv: editing.subject_sv?.trim() || '',
      body_sv: editing.body_sv?.trim() || '',
      subject_en: editing.subject_en?.trim() || null,
      body_en: editing.body_en?.trim() || null,
      category: editing.category || 'system',
      description: editing.description?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editing.id) {
      const { error } = await supabase.from('email_templates').update(payload).eq('id', editing.id);
      if (error) {
        console.error('Error updating template:', error);
        return;
      }
    } else {
      const { error } = await supabase.from('email_templates').insert(payload);
      if (error) {
        console.error('Error inserting template:', error);
        return;
      }
    }
    setEditing(null);
    fetchTemplates();
  };

  const copyTemplate = async (t: EmailTemplateRow) => {
    const { error } = await supabase.from('email_templates').insert({
      name: `${t.name} (kopia)`,
      subject_sv: t.subject_sv,
      body_sv: t.body_sv,
      subject_en: t.subject_en,
      body_en: t.body_en,
      category: t.category || 'system',
      description: t.description,
    });
    if (error) {
      console.error('Error copying template:', error);
      return;
    }
    fetchTemplates();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl font-semibold">E-postmallar</h2>
        <Button
          onClick={() =>
            setEditing({
              name: '',
              subject_sv: '',
              body_sv: '',
              subject_en: '',
              body_en: '',
              category: 'system',
            })
          }
        >
          Ny mall
        </Button>
      </div>

      {editing && (
        <Card className="border-primary/30">
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-medium">{editing.id ? 'Redigera mall' : 'Ny mall'}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Namn (intern nyckel)</label>
                <Input
                  value={editing.name ?? ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="t.ex. report_received"
                  disabled={!!editing.id}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editing.category ?? 'system'}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ämne (SV)</label>
              <Input
                value={editing.subject_sv ?? ''}
                onChange={(e) => setEditing({ ...editing, subject_sv: e.target.value })}
                placeholder="Ämnesrad svenska"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ämne (EN)</label>
              <Input
                value={editing.subject_en ?? ''}
                onChange={(e) => setEditing({ ...editing, subject_en: e.target.value })}
                placeholder="Subject line English"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Innehåll (SV) – HTML</label>
              <Textarea
                className="min-h-[120px] font-mono text-sm"
                value={editing.body_sv ?? ''}
                onChange={(e) => setEditing({ ...editing, body_sv: e.target.value })}
                placeholder="<div>...</div>"
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Innehåll (EN) – HTML</label>
              <Textarea
                className="min-h-[120px] font-mono text-sm"
                value={editing.body_en ?? ''}
                onChange={(e) => setEditing({ ...editing, body_en: e.target.value })}
                placeholder="<div>...</div>"
                rows={6}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={saveTemplate}>Spara</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Avbryt
              </Button>
              {editing.body_sv && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPreview(
                      editing as EmailTemplateRow
                    )
                  }
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Förhandsvisa
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {preview && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Förhandsvisning</h3>
              <Button variant="ghost" size="icon" onClick={() => setPreview(null)} aria-label="Stäng">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{preview.subject_sv}</p>
            <div
              className="rounded-md border bg-muted/30 p-4 prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: preview.body_sv || '' }}
            />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Laddar mallar...</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Namn</th>
                <th className="p-3 text-left font-medium">Kategori</th>
                <th className="p-3 text-left font-medium">Språk</th>
                <th className="p-3 text-left font-medium">Senast använd</th>
                <th className="p-3 text-left font-medium">Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{t.subject_sv}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'inline-flex px-2 py-0.5 rounded text-xs font-medium',
                        CATEGORIES.find((c) => c.value === (t.category || 'system'))?.color ?? 'bg-muted'
                      )}
                    >
                      {CATEGORIES.find((c) => c.value === (t.category || 'system'))?.label ?? t.category ?? 'System'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {t.subject_sv && (
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          SV
                        </span>
                      )}
                      {t.subject_en && (
                        <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">EN</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {t.last_used ? format(new Date(t.last_used), 'd MMM yyyy', { locale: sv }) : 'Aldrig'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditing(t)}
                        aria-label="Redigera"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPreview(t)}
                        aria-label="Förhandsvisa"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyTemplate(t)}
                        aria-label="Kopiera"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Edge-funktionen <code className="bg-muted px-1 rounded">send-email</code> använder för närvarande inbyggda mallar. Ändringar här sparas i databasen och kan användas när utskicket kopplas till DB-mallar.
      </p>
    </div>
  );
}
