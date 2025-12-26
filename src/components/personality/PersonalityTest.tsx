import { useState } from 'react';
import { QUESTIONS } from '@/data/questions';
import { type PersonalityTestResult, type DimensionKey, type PersonalityCategory, calculateArchetype, getCategoryFromArchetype } from '@/types/personality';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DIMENSION_ORDER: DimensionKey[] = ['ei', 'sn', 'tf', 'jp', 'at'];

interface PersonalityTestProps {
  onComplete: (result: PersonalityTestResult) => void;
}

export const PersonalityTest = ({ onComplete }: PersonalityTestProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS.length).fill(0));
  const { toast } = useToast();

  const currentQuestion = QUESTIONS[currentIndex];
  const isComplete = answers.every((a) => a >= 1 && a <= 5);
  const answeredCount = answers.filter((a) => a >= 1).length;

  const setAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = value;
    setAnswers(newAnswers);

    // Auto-advance after a brief delay
    if (currentIndex < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
      }, 400);
    }
  };

  const computeResult = (): PersonalityTestResult => {
    const scores: Record<DimensionKey, number> = {
      ei: 0,
      sn: 0,
      tf: 0,
      jp: 0,
      at: 0,
    };

    for (let i = 0; i < QUESTIONS.length; i++) {
      const dim = DIMENSION_ORDER[Math.floor(i / 6)];
      scores[dim] += answers[i];
    }

    // Convert 1-5 average to 0-100
    (Object.keys(scores) as DimensionKey[]).forEach((k) => {
      const avg = scores[k] / 6;
      scores[k] = Math.round(((avg - 1) / 4) * 100);
    });

    const archetype = calculateArchetype(scores);
    const category = getCategoryFromArchetype(archetype);

    return {
      scores,
      category,
      archetype,
      answers,
    };
  };

  const determineCategory = (scores: Record<DimensionKey, number>): PersonalityCategory => {
    const order = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const top = order[0][0] as DimensionKey;

    switch (top) {
      case 'sn':
        return 'UPPTÄCKARE';
      case 'ei':
        return 'DIPLOMAT';
      case 'tf':
        return 'STRATEGER';
      case 'jp':
        return 'BYGGARE';
      case 'at':
        return scores.at > 55 ? 'STRATEGER' : 'DIPLOMAT';
      default:
        return 'DIPLOMAT';
    }
  };

  const handleSubmit = () => {
    if (!isComplete) {
      toast({
        title: 'Slutför testet',
        description: 'Vänligen besvara alla frågor innan du går vidare.',
        variant: 'destructive',
      });
      return;
    }

    const result = computeResult();
    onComplete(result);
  };

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft mb-4">
            <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            <span className="font-semibold text-foreground">MÄÄK</span>
          </div>
          <h1 className="text-2xl font-serif text-foreground mb-2">Personlighetstest</h1>
          <p className="text-muted-foreground">Upptäck din matchningsprofil</p>
        </div>

        {/* Progress */}
        <ProgressBar current={answeredCount} total={QUESTIONS.length} className="mb-8" />

        {/* Question */}
        <div className="relative min-h-[200px] mb-8">
          {QUESTIONS.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              answer={answers[idx]}
              onAnswer={setAnswer}
              isActive={idx === currentIndex}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Föregående
          </Button>

          {currentIndex < QUESTIONS.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex((i) => Math.min(QUESTIONS.length - 1, i + 1))}
              disabled={answers[currentIndex] === 0}
              className="gap-2 gradient-primary text-primary-foreground border-0"
            >
              Nästa
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isComplete}
              className="gap-2 gradient-primary text-primary-foreground border-0 shadow-glow"
            >
              <Heart className="w-4 h-4" />
              Visa resultat
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
