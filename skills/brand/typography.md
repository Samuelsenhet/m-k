## Typography Guidelines

### Font Families

#### DM Sans (Sans-serif)
- **Weight range**: 100-1000 (variable)
- **Usage**: Body text, UI elements, buttons, forms, navigation
- **Characteristics**: Modern, clean, highly readable

#### Playfair Display (Serif)
- **Weights**: 400, 500, 600, 700
- **Usage**: Page titles, personality type names, section headers
- **Characteristics**: Elegant, distinctive, emphasizes importance

### Font Sizes

```css
/* Tailwind defaults extended */
text-xs: 0.75rem (12px)
text-sm: 0.875rem (14px)
text-base: 1rem (16px)
text-lg: 1.125rem (18px)
text-xl: 1.25rem (20px)
text-2xl: 1.5rem (24px)
text-3xl: 1.875rem (30px)
text-4xl: 2.25rem (36px)
```

### Component Examples

#### Page Title
```tsx
<h1 className="font-serif text-4xl font-bold text-foreground">
  Upptäck Din Personlighet
</h1>
```

#### Section Header
```tsx
<h2 className="font-serif text-3xl font-semibold text-primary">
  Dina Matchningar
</h2>
```

#### Body Text
```tsx
<p className="font-sans text-base text-muted-foreground">
  Baserat på ditt personlighetstest har vi hittat potentiella matchningar.
</p>
```

#### Button Text
```tsx
<Button className="font-sans text-lg font-medium">
  Fortsätt
</Button>
```

#### Card Title
```tsx
<CardTitle className="font-serif text-2xl font-semibold">
  INFJ - Förespråkaren
</CardTitle>
```

#### Personality Type Badge
```tsx
<span className="font-sans text-sm font-medium uppercase tracking-wide">
  DIPLOMAT
</span>
```

### Line Height

```css
leading-none: 1
leading-tight: 1.25
leading-snug: 1.375
leading-normal: 1.5 (body text)
leading-relaxed: 1.625 (long-form content)
leading-loose: 2
```

### Letter Spacing

```css
tracking-tighter: -0.05em
tracking-tight: -0.025em
tracking-normal: 0em (default)
tracking-wide: 0.025em (buttons, badges)
tracking-wider: 0.05em (uppercase headings)
tracking-widest: 0.1em
```

### Text Colors

```css
/* Primary text */
text-foreground: Main content

/* Secondary text */
text-muted-foreground: Less important content

/* On colored backgrounds */
text-primary-foreground: On primary color
text-secondary-foreground: On secondary color

/* Personality types */
text-personality-diplomat
text-personality-strateger
text-personality-byggare
text-personality-upptackare
```

### Accessibility

- Minimum font size: 16px for body text
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Use `font-semibold` or `font-bold` for emphasis instead of color alone
- Ensure readable line length (45-75 characters)

### Swedish Language Considerations

- Support for Swedish characters: å, ä, ö, Å, Ä, Ö
- DM Sans and Playfair Display fully support Swedish diacritics
- Use proper Swedish typographic quotes: "text" not "text"
