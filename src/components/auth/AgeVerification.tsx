import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateAge } from './age-utils';

interface AgeVerificationProps {
  dateOfBirth: { day: string; month: string; year: string };
  onChange: (dob: { day: string; month: string; year: string }) => void;
  error?: string;
}

const MONTHS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Maj' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Augusti' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => (currentYear - 18 - i).toString());

const getDaysInMonth = (month: string, year: string): number => {
  if (!month || !year) return 31;
  return new Date(parseInt(year), parseInt(month), 0).getDate();
};

export const AgeVerification = ({ dateOfBirth, onChange, error }: AgeVerificationProps) => {
  const { day, month, year } = dateOfBirth;
  const daysInMonth = getDaysInMonth(month, year);
  const days = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  const age = day && month && year ? calculateAge(day, month, year) : null;
  const isOldEnough = age !== null && age >= 20;
  const showAgeWarning = age !== null && age < 20;

  return (
    <div className="space-y-3">
      <Label>Födelsedatum</Label>
      <p className="text-sm text-muted-foreground">
        Du måste vara minst 20 år för att använda MÄÄK
      </p>
      
      <div className="grid grid-cols-3 gap-2">
        <Select
          value={day}
          onValueChange={(value) => onChange({ ...dateOfBirth, day: value })}
        >
          <SelectTrigger className={cn(error && "border-destructive")}>
            <SelectValue placeholder="Dag" />
          </SelectTrigger>
          <SelectContent>
            {days.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={month}
          onValueChange={(value) => onChange({ ...dateOfBirth, month: value })}
        >
          <SelectTrigger className={cn(error && "border-destructive")}>
            <SelectValue placeholder="Månad" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={year}
          onValueChange={(value) => onChange({ ...dateOfBirth, year: value })}
        >
          <SelectTrigger className={cn(error && "border-destructive")}>
            <SelectValue placeholder="År" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showAgeWarning && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Du måste vara minst 20 år för att skapa ett konto.</span>
        </div>
      )}

      {isOldEnough && (
        <div className="flex items-center gap-2 text-primary text-sm bg-primary/10 p-3 rounded-lg">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>Ålder bekräftad: {age} år</span>
        </div>
      )}

      {error && !showAgeWarning && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
