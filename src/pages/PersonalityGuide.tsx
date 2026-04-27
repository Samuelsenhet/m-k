import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronLeft, ChevronDown, Sparkles } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  CATEGORY_INFO,
  ARCHETYPE_INFO,
  ARCHETYPE_CODES_BY_CATEGORY,
  DIMENSION_LABELS,
  type PersonalityCategory,
  type ArchetypeCode,
  type DimensionKey,
} from '@/types/personality';

const CATEGORY_ORDER: PersonalityCategory[] = ['DIPLOMAT', 'STRATEGER', 'BYGGARE', 'UPPTÄCKARE'];

const CATEGORY_STYLES: Record<PersonalityCategory, { className: string }> = {
  DIPLOMAT: { className: 'badge-diplomat' },
  STRATEGER: { className: 'badge-strateger' },
  BYGGARE: { className: 'badge-byggare' },
  UPPTÄCKARE: { className: 'badge-upptackare' },
};

export default function PersonalityGuide() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-bold">{t('personality_guide.title', 'Personlighet & arketyper')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <section>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('personality_guide.learn_title', 'Lär känna din personlighet')}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {t('personality_guide.intro', 'Efter vårt 30-frågor-test får du en huvudkategori och fyra arketyper som beskriver olika sidor av din personlighet. Klicka på varje arketyp för att läsa mer.')}
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-foreground">1.</span>
              {t('personality.mainCategory', 'EN HUVUDKATEGORI – Din primära förbindelsestil')}
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-foreground">2.</span>
              {t('personality.fourArchetypesIntro', 'FYRA ARKETYPER – Olika sidor av din personlighet')}
            </li>
          </ul>
        </section>

        {CATEGORY_ORDER.map((categoryKey) => {
          const category = CATEGORY_INFO[categoryKey];
          const codes = ARCHETYPE_CODES_BY_CATEGORY[categoryKey];
          const style = CATEGORY_STYLES[categoryKey];

          return (
            <Card key={categoryKey} className={cn('overflow-hidden', style.className)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>{category.emoji}</span>
                  {category.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground opacity-90">{category.description}</p>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {codes.map((code) => {
                  const info = ARCHETYPE_INFO[code as ArchetypeCode];
                  return (
                    <Collapsible key={code} defaultOpen={false} className="group/collapse">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            'w-full justify-between h-auto py-3 px-4 rounded-xl border bg-background/60 hover:bg-background/80',
                            style.className
                          )}
                        >
                          <span className="flex items-center gap-2 text-left">
                            <span className="text-2xl">{info.emoji}</span>
                            <div>
                              <p className="font-semibold text-foreground">{info.title}</p>
                              <p className="text-xs text-muted-foreground">{info.name}</p>
                            </div>
                          </span>
                          <ChevronDown className="w-5 h-5 shrink-0 opacity-70 transition-transform group-data-[state=open]/collapse:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 ml-2 pl-4 border-l-2 border-border space-y-4 py-3">
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              {t('personality.overview', 'Översikt')}
                            </h4>
                            <p className="text-sm text-foreground">{info.description}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              {t('personality.strengths', 'Styrkor')}
                            </h4>
                            <ul className="space-y-1">
                              {info.strengths.map((s, i) => (
                                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                  <span className="text-muted-foreground">●</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              I relationer
                            </h4>
                            <p className="text-sm text-foreground">{info.loveStyle}</p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('personality_guide.abbreviations_title', 'Förkortningar')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('personality_guide.abbreviations_intro', 'Varje arketyp har en förkortning (t.ex. INFP) som beskriver dess kärna.')}
            </p>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm">
              {(['ei', 'sn', 'tf', 'jp'] as DimensionKey[]).map((dim) => {
                const labels = DIMENSION_LABELS[dim];
                const leftLetter = dim === 'ei' ? 'I' : dim === 'sn' ? 'S' : dim === 'tf' ? 'T' : 'J';
                const rightLetter = dim === 'ei' ? 'E' : dim === 'sn' ? 'N' : dim === 'tf' ? 'F' : 'P';
                return (
                  <div key={dim} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-border pb-2 last:border-0 last:pb-0">
                    <dt className="font-mono font-semibold text-foreground w-6">{leftLetter}</dt>
                    <dd className="text-muted-foreground flex-1">{labels.left}</dd>
                    <dt className="font-mono font-semibold text-foreground w-6">{rightLetter}</dt>
                    <dd className="text-muted-foreground flex-1">{labels.right}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="text-xs text-muted-foreground mt-3">
              {t('personality_guide.example_code', 'Exempel: INFP = Introversion, Intuition, Feeling, Prospecting')}
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
