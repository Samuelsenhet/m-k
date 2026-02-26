import { type PersonalityTestResult, type DimensionKey, type PersonalityCategory, DIMENSION_LABELS, CATEGORY_INFO, ARCHETYPE_INFO, ARCHETYPE_CODES_BY_CATEGORY } from '@/types/personality';
import { ButtonPrimary, ButtonSecondary } from '@/components/ui-v2';
import { Heart, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useTranslation } from 'react-i18next';

interface PersonalityResultProps {
  result: PersonalityTestResult;
  isExistingResult?: boolean;
  onContinue?: () => void;
}

const dimensionColors: Record<DimensionKey, string> = {
  ei: 'bg-dimension-ei',
  sn: 'bg-dimension-sn',
  tf: 'bg-dimension-tf',
  jp: 'bg-dimension-jp',
  at: 'bg-dimension-at',
};

const CATEGORY_STYLES: Record<PersonalityCategory, string> = {
  DIPLOMAT: 'badge-diplomat',
  STRATEGER: 'badge-strateger',
  BYGGARE: 'badge-byggare',
  UPPTÄCKARE: 'badge-upptackare',
};

export const PersonalityResult = ({ result, isExistingResult = false, onContinue }: PersonalityResultProps) => {
  const { t } = useTranslation();
  const categoryInfo = CATEGORY_INFO[result.category];
  const archetypeInfo = result.archetype ? ARCHETYPE_INFO[result.archetype] : null;
  const { user } = useAuth();
  const isOnboarding = !!onContinue;

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft mb-4">
            <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            <span className="font-semibold text-foreground">MÄÄK</span>
          </div>
          {isExistingResult && (
            <p className="text-sm text-muted-foreground">Ditt sparade resultat</p>
          )}
        </div>

        {/* 1. En huvudkategori – din primära förbindelsestil */}
        <div className="mb-6 animate-slide-up">
          <h2 className="font-serif text-lg font-bold text-foreground mb-1">{t('personality.main_category_label', 'En huvudkategori')}</h2>
          <p className="text-sm text-muted-foreground mb-3">{t('personality.main_category_sub', 'Din primära förbindelsestil')}</p>
          <div className={cn('bg-card rounded-2xl p-4 shadow-card border border-border flex items-center gap-4', CATEGORY_STYLES[result.category])}>
            <span className="text-5xl">{categoryInfo.emoji}</span>
            <div>
              <h3 className="text-xl font-bold text-foreground">{categoryInfo.title}</h3>
              <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
            </div>
          </div>
        </div>

        {/* 2. Fyra arketyper – olika sidor av din personlighet */}
        {archetypeInfo && (
          <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <h2 className="font-serif text-lg font-bold text-foreground mb-1">{t('personality.four_archetypes_label', 'Fyra arketyper')}</h2>
            <p className="text-sm text-muted-foreground mb-2">{t('personality.four_archetypes_sub', 'Olika sidor av din personlighet – din typ är markerad')}</p>
            <p className="text-sm font-medium text-foreground mb-3">
              {t('personality.test_result_line', 'Din typ från testet: {{title}} ({{code}}) – 1 av 4 i {{category}}.', {
                title: archetypeInfo.title,
                code: archetypeInfo.name,
                category: categoryInfo.title,
              })}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ARCHETYPE_CODES_BY_CATEGORY[result.category].map((code) => {
                const info = ARCHETYPE_INFO[code];
                const isUserArchetype = result.archetype === code;
                return (
                  <div
                    key={code}
                    className={cn(
                      'p-3 rounded-xl border bg-card shadow-card flex items-center gap-2',
                      CATEGORY_STYLES[result.category],
                      isUserArchetype && 'ring-2 ring-primary'
                    )}
                  >
                    <span className="text-2xl">{info.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">
                        {info.title}
                        {isUserArchetype && <span className="ml-1 text-xs font-normal text-muted-foreground">({t('personality.your_type', 'din typ')})</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{info.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Din arketyp – full kort */}
        {archetypeInfo && (
          <div 
            className="bg-card rounded-3xl overflow-hidden shadow-card border border-border mb-6 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="gradient-primary p-6 text-primary-foreground text-center">
              <div className="text-5xl mb-3">{archetypeInfo.emoji}</div>
              <h1 className="text-2xl font-serif font-bold mb-1">{archetypeInfo.title}</h1>
              <p className="text-sm opacity-90">{archetypeInfo.name} • {categoryInfo.emoji} {categoryInfo.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">{archetypeInfo.description}</p>
              
              <div>
                <h3 className="text-sm font-semibold mb-2">Kärleksstil</h3>
                <p className="text-sm text-muted-foreground">{archetypeInfo.loveStyle}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Styrkor</h3>
                <div className="flex flex-wrap gap-2">
                  {archetypeInfo.strengths.map((strength) => (
                    <span 
                      key={strength} 
                      className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback Category Card (if no archetype) */}
        {!archetypeInfo && (
          <div 
            className="bg-card rounded-3xl p-8 shadow-card border border-border mb-6 text-center animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="text-6xl mb-4">{categoryInfo.emoji}</div>
            <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">
              Din personlighetstyp
            </p>
            <h1 className="text-3xl font-serif text-gradient mb-4">
              {categoryInfo.title}
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
              {categoryInfo.description}
            </p>
          </div>
        )}

        {/* Scores */}
        <div 
          className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          <h2 className="font-serif text-xl text-foreground mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Dina dimensioner
          </h2>
          <div className="space-y-5">
            {(Object.keys(result.scores) as DimensionKey[]).map((dim, idx) => {
              const score = result.scores[dim];
              const labels = DIMENSION_LABELS[dim];
              return (
                <div 
                  key={dim} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
                >
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{labels.left}</span>
                    <span className="font-semibold text-foreground">{score}%</span>
                    <span className="text-muted-foreground">{labels.right}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-1000 ease-out', dimensionColors[dim])}
                      style={{ 
                        width: `${score}%`,
                        animationDelay: `${0.5 + idx * 0.1}s`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div 
          className="bg-card rounded-2xl p-6 shadow-card border border-border mb-8 animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          <h2 className="font-serif text-xl text-foreground mb-4">
            💡 Tips för dig
          </h2>
          <ul className="space-y-3">
            {categoryInfo.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div 
          className="flex flex-col sm:flex-row gap-4 animate-slide-up"
          style={{ animationDelay: '0.5s' }}
        >
          {isOnboarding ? (
            <ButtonPrimary
              onClick={onContinue}
              className="flex-1 gap-2"
            >
              <Heart className="w-4 h-4" />
              Fortsätt med profilen
            </ButtonPrimary>
          ) : (
            <>
              <ButtonSecondary asChild className="flex-1 gap-2">
                <Link to="/profile">
                  <User className="w-4 h-4" />
                  Gå till profil
                </Link>
              </ButtonSecondary>
              <ButtonPrimary asChild className="flex-1 gap-2">
                <Link to="/matches">
                  <Heart className="w-4 h-4" />
                  Hitta matchningar
                </Link>
              </ButtonPrimary>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
