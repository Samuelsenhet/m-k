import { Link } from 'react-router-dom';
import { ButtonIcon, CardV2, CardV2Content, CardV2Header, CardV2Title } from '@/components/ui-v2';
import { ChevronLeft } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <ButtonIcon asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </ButtonIcon>
          <h1 className="font-serif text-lg font-bold">{t('about.title')}</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <CardV2 padding="none">
          <CardV2Header className="p-6">
            <CardV2Title className="font-serif">{t('about.about_maak')}</CardV2Title>
          </CardV2Header>
          <CardV2Content className="p-6 pt-0 space-y-4 text-sm text-muted-foreground">
            <p>{t('about.intro')}</p>
            <p>{t('about.placeholder')}</p>
            <p className="pt-2">
              <Link to="/launch-checklist" className="text-primary hover:underline">
                Release-checklista (för releaseansvarig)
              </Link>
            </p>
          </CardV2Content>
        </CardV2>
      </div>
      <BottomNav />
    </div>
  );
}
