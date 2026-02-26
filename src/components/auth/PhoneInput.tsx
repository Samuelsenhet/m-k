import { useRef } from 'react';
import { InputV2 } from '@/components/ui-v2';
import { Label } from '@/components/ui/label';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLORS } from '@/design/tokens';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Swedish phone format: 07X XXX XX XX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  } else if (digits.length <= 8) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
};

export const PhoneInput = ({ value, onChange, error, disabled }: PhoneInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '').slice(0, 10);
    onChange(digits);
  };

  const displayValue = formatPhoneNumber(value);

  return (
    <div className="space-y-2">
      <Label htmlFor="phone" className="text-sm font-medium" style={{ color: COLORS.primary[800] }}>
        Telefonnummer
      </Label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          +46
        </div>
        <InputV2
          ref={inputRef}
          id="phone"
          type="tel"
          placeholder="7X XXX XX XX"
          value={displayValue}
          onChange={handleChange}
          variant={error ? "error" : "default"}
          className="pl-20"
          disabled={disabled}
          autoComplete="tel"
        />
      </div>
      {error && (
        <p className="text-sm" style={{ color: COLORS.coral[600] }}>
          {error}
        </p>
      )}
    </div>
  );
};
