import { useState, useMemo } from 'react';
import { QUESTIONS } from '@/data/questions';
import { type PersonalityTestResult, type DimensionKey, calculateArchetype, getCategoryFromArchetype } from '@/types/personality';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';



// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface PersonalityTestProps {
  onComplete: (result: PersonalityTestResult) => void;
}

export const PersonalityTest = ({ onComplete }: PersonalityTestProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();
  
  // Shuffle questions once per user session
  const shuffledQuestions = useMemo(() => shuffleArray(QUESTIONS), []);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const currentQuestion = shuffledQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === shuffledQuestions.length;

  const setAnswer = (value: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));

    // Auto-advance after a brief delay
    if (currentIndex < shuffledQuestions.length - 1) {
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

    // Group answers by dimension using original question data
    const dimensionCounts: Record<DimensionKey, number> = { ei: 0, sn: 0, tf: 0, jp: 0, at: 0 };
    
    QUESTIONS.forEach((q) => {
      const answerValue = answers[q.id];
      if (answerValue) {
        scores[q.dimension] += answerValue;
        dimensionCounts[q.dimension]++;
      }
    });

    // Convert to 0-100 scale
    (Object.keys(scores) as DimensionKey[]).forEach((k) => {
      const count = dimensionCounts[k] || 1;
      const avg = scores[k] / count;
      scores[k] = Math.round(((avg - 1) / 4) * 100);
    });

    const archetype = calculateArchetype(scores);
    const category = getCategoryFromArchetype(archetype);

    // Convert answers record to array for storage
    const answersArray = QUESTIONS.map(q => answers[q.id] || 0);

    return {
      scores,
      category,
      archetype,
      answers: answersArray,
    };
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
          <p className="text-muted-foreground mb-4">Upptäck din matchningsprofil</p>
          
          {/* Important notice */}
          <div className="bg-accent/50 border border-accent rounded-xl p-4 text-left max-w-md mx-auto">
            <p className="text-sm font-semibold text-foreground mb-1">⚠️ Viktigt att veta</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Du får bara en chans att göra detta test. Svara ärligt och noggrant på varje fråga – 
              dina svar påverkar vilka matchningar du får. Ta dig tid och tänk igenom varje fråga ordentligt.
            </p>
          </div>
        </div>

        {/* Progress */}
        <ProgressBar current={answeredCount} total={shuffledQuestions.length} className="mb-8" />

        {/* Question */}
        <div className="relative min-h-[200px] mb-8">
          {shuffledQuestions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              answer={answers[q.id] || 0}
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

          {currentIndex < shuffledQuestions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex((i) => Math.min(shuffledQuestions.length - 1, i + 1))}
              disabled={!answers[currentQuestion.id]}
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
