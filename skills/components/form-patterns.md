## Form Patterns Guide

### Overview
Standard patterns for building forms with validation, error handling, and accessibility in MÄÄK.

## Form Libraries

### Stack
- **react-hook-form** - Form state management
- **zod** - Schema validation
- **@hookform/resolvers** - Zod integration

## Basic Form Pattern

### With Zod Validation
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  displayName: z.string()
    .min(2, 'Namnet måste vara minst 2 tecken')
    .max(50, 'Namnet får vara max 50 tecken'),
  bio: z.string()
    .max(500, 'Bion får vara max 500 tecken')
    .optional(),
  location: z.string()
    .min(1, 'Plats krävs'),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      location: '',
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    try {
      // Submit logic
      console.log(data);
    } catch (error) {
      form.setError('root', {
        message: 'Ett fel uppstod vid sparande',
      });
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields */}
    </form>
  );
}
```

## Form Field Components

### Text Input
```tsx
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TextFieldProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
}

export function TextField<T extends FieldValues = FieldValues>({ 
  form, 
  name, 
  label, 
  placeholder,
  type = 'text' 
}: TextFieldProps<T>) {
  const error = form.formState.errors[name];
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...form.register(name)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

### Textarea Field
```tsx
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';

interface TextareaFieldProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  rows?: number;
}

export function TextareaField<T extends FieldValues = FieldValues>({ 
  form, 
  name, 
  label, 
  placeholder,
  rows = 4 
}: TextareaFieldProps<T>) {
  const error = form.formState.errors[name];
  const value = form.watch(name) || '';
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label htmlFor={name}>{label}</Label>
        <span className="text-sm text-muted-foreground">
          {value.length} / 500
        </span>
      </div>
      <Textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        {...form.register(name)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

### Select Field
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';

interface SelectFieldProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField<T extends FieldValues = FieldValues>({ 
  form, 
  name, 
  label, 
  options,
  placeholder 
}: SelectFieldProps<T>) {
  const error = form.formState.errors[name];
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select
        value={form.watch(name)}
        onValueChange={(value) => form.setValue(name, value)}
      >
        <SelectTrigger 
          id={name} 
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

### Checkbox Field
```tsx
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';

interface CheckboxFieldProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  description?: string;
}

export function CheckboxField<T extends FieldValues = FieldValues>({ 
  form, 
  name, 
  label,
  description 
}: CheckboxFieldProps<T>) {
  const error = form.formState.errors[name];
  
  return (
    <div className="flex items-start space-x-3">
      <Checkbox
        id={name}
        checked={form.watch(name)}
        onCheckedChange={(checked) => form.setValue(name, checked)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      <div className="space-y-1">
        <Label htmlFor={name} className="cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={`${name}-error`} className="text-sm text-destructive">
            {error.message as string}
          </p>
        )}
      </div>
    </div>
  );
}
```

## Phone Number Validation

### Swedish Phone Format
```typescript
import { z } from 'zod';

const phoneSchema = z.string()
  .min(9, 'Ange ett giltigt telefonnummer')
  .max(10, 'Ange ett giltigt telefonnummer')
  .regex(/^0?7[0-9]{8}$/, 'Ange ett giltigt svenskt mobilnummer');

const formatPhoneE164 = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return `+46${digits.slice(1)}`;
  }
  return `+46${digits}`;
};
```

### Phone Input Component
```tsx
import { Input } from '@/components/ui/input';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const cleaned = e.target.value.replace(/\D/g, '');
    onChange(cleaned);
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor="phone">Telefonnummer</Label>
      <div className="flex gap-2">
        <div className="flex items-center px-3 py-2 bg-muted rounded-md">
          +46
        </div>
        <Input
          id="phone"
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder="701234567"
          maxLength={10}
          aria-invalid={!!error}
          aria-describedby={error ? "phone-error" : undefined}
        />
      </div>
      {error && (
        <p id="phone-error" className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
```

## Date Input Pattern

### Age Verification Form
```tsx
import { z } from 'zod';

const dateOfBirthSchema = z.object({
  day: z.string().min(1, 'Välj dag'),
  month: z.string().min(1, 'Välj månad'),
  year: z.string().min(1, 'Välj år'),
});

const calculateAge = (day: string, month: string, year: string): number => {
  const birthDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  );
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

type DateOfBirthFormData = z.infer<typeof dateOfBirthSchema>;

export function AgeVerificationForm() {
  const form = useForm<DateOfBirthFormData>({
    resolver: zodResolver(dateOfBirthSchema),
  });
  
  const onSubmit = (data: DateOfBirthFormData) => {
    const age = calculateAge(data.day, data.month, data.year);
    
    if (age < 20) {
      form.setError('root', {
        message: 'Du måste vara minst 20 år',
      });
      return;
    }
    
    // Proceed with submission
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 gap-2">
        <SelectField
          form={form}
          name="day"
          label="Dag"
          options={Array.from({ length: 31 }, (_, i) => ({
            value: String(i + 1),
            label: String(i + 1),
          }))}
        />
        <SelectField
          form={form}
          name="month"
          label="Månad"
          options={[
            { value: '1', label: 'Januari' },
            { value: '2', label: 'Februari' },
            // ... all months
          ]}
        />
        <SelectField
          form={form}
          name="year"
          label="År"
          options={Array.from({ length: 100 }, (_, i) => ({
            value: String(2024 - i),
            label: String(2024 - i),
          }))}
        />
      </div>
    </form>
  );
}
```

## File Upload Pattern

### Photo Upload
```tsx
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PhotoUploadProps {
  userId: string;
  onUploadComplete: (url: string) => void;
}

export function PhotoUpload({ userId, onUploadComplete }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vänligen välj en bildfil');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bilden får vara max 5MB');
      return;
    }
    
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `photos/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
      
      onUploadComplete(data.publicUrl);
      toast.success('Bild uppladdad!');
    } catch (error: any) {
      toast.error('Kunde inte ladda upp bild');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <Label htmlFor="photo" className="cursor-pointer">
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition">
          {uploading ? (
            <p>Laddar upp...</p>
          ) : (
            <>
              <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Klicka för att välja bild
              </p>
            </>
          )}
        </div>
      </Label>
      <Input
        id="photo"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
      />
    </div>
  );
}
```

## Form Submission Patterns

### With Loading State
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const onSubmit = async (data: FormValues) => {
  setIsSubmitting(true);
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    toast.success('Profil uppdaterad!');
  } catch (error: any) {
    toast.error('Kunde inte spara');
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};

<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Sparar...' : 'Spara'}
</Button>
```

## Best Practices

1. **Validation**
   - Define schemas with Zod
   - Validate on blur for better UX
   - Show inline errors immediately

2. **Accessibility**
   - Use proper label associations
   - Include aria-invalid on error
   - Provide clear error messages

3. **User Experience**
   - Show loading states during submission
   - Disable submit button during processing
   - Clear success/error feedback

4. **Performance**
   - Use controlled inputs sparingly
   - Debounce expensive validations
   - Memoize large option lists
