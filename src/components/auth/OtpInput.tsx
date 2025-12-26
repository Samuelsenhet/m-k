import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const OtpInput = ({ 
  length = 6, 
  value, 
  onChange, 
  error, 
  disabled 
}: OtpInputProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    
    const newValue = value.split('');
    newValue[index] = digit.slice(-1);
    const joined = newValue.join('').slice(0, length);
    onChange(joined);
    
    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pastedData);
  };

  // Auto-focus first empty input on mount
  useEffect(() => {
    const firstEmptyIndex = value.length < length ? value.length : length - 1;
    inputRefs.current[firstEmptyIndex]?.focus();
  }, []);

  return (
    <div className="space-y-3">
      <Label>Verifieringskod</Label>
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={disabled}
            className={cn(
              "w-12 h-14 text-center text-xl font-bold",
              error && "border-destructive",
              value[index] && "border-primary bg-primary/5"
            )}
          />
        ))}
      </div>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
};
