import { CardV2, CardV2Content } from '@/components/ui-v2';

export default function EmailAnalytics() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Analys</h2>
      <CardV2 padding="none">
        <CardV2Content className="py-8 text-center text-muted-foreground text-sm">
          Öppningsgrad och klickstatistik kommer när e-posttracking (t.ex. tracking-pixel) är på plats. Kolumnerna <code className="bg-muted px-1 rounded">opened_at</code> och <code className="bg-muted px-1 rounded">clicked_at</code> finns i <code className="bg-muted px-1 rounded">email_logs</code>.
        </CardV2Content>
      </CardV2>
    </div>
  );
}
