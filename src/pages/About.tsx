import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-bold">{t('about.title')}</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">{t('about.about_maak')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{t('about.intro')}</p>
            <p>{t('about.placeholder')}</p>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
