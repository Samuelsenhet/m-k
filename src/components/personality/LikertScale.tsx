import { cn } from '@/lib/utils';

interface LikertScaleProps {
  value: number;
  onChange: (value: number) => void;
}

const labels = [
  { value: 1, label: 'Instämmer inte alls' },
  { value: 2, label: 'Instämmer inte' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Instämmer' },
  { value: 5, label: 'Instämmer helt' },
];

export const LikertScale = ({ value, onChange }: LikertScaleProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2">
        {labels.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 py-4 px-2 rounded-xl font-medium text-sm transition-all duration-300',
              'hover:scale-105 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              value === option.value
                ? 'gradient-primary text-primary-foreground shadow-glow'
                : 'bg-card text-foreground shadow-soft hover:shadow-card border border-border'
            )}
          >
            <span className="block text-xl mb-1">{option.value}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Instämmer inte</span>
        <span>Instämmer helt</span>
      </div>
    </div>
  );
};
