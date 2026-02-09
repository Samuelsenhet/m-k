import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

export default function BulkEmailSender() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Skicka e-post</h2>
      <Card>
        <CardContent className="pt-6">
          <Textarea
            className="min-h-[120px] resize-y"
            rows={4}
            placeholder="Skriv ditt meddelande... (bulk-utskick kommer att kopplas till mallar och mottagarlista)"
            readOnly
            disabled
          />
          <div className="flex flex-wrap gap-3 mt-4">
            <Button size="sm" className="gap-2" disabled>
              <Send className="w-4 h-4" />
              Skicka till valda användare
            </Button>
            <Button size="sm" variant="outline" disabled>
              Spara som mall
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Bulk-utskick och schemaläggning kommer i nästa version. Tabellen <code className="bg-muted px-1 rounded">bulk_emails</code> finns i databasen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
