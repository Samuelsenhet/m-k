import { Question } from '@/types/personality';
import { LikertScale } from './LikertScale';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  answer: number;
  onAnswer: (value: number) => void;
  isActive: boolean;
}

export const QuestionCard = ({ question, answer, onAnswer, isActive }: QuestionCardProps) => {
  return (
    <div
      className={cn(
        'bg-card rounded-2xl p-6 shadow-card border border-border',
        'transition-all duration-500',
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'
      )}
    >
      <p className="text-lg font-medium text-foreground mb-6 leading-relaxed">
        {question.text}
      </p>
      <LikertScale value={answer} onChange={onAnswer} />
    </div>
  );
};
