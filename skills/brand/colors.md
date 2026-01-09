## Color Implementation Guide

### CSS Variables
All colors are defined as CSS custom properties in `src/index.css`:

```css
:root {
  --primary: 350 75% 55%;
  --diplomat: 280 60% 50%;
  --strateger: 220 70% 50%;
  --byggare: 145 55% 42%;
  --upptackare: 45 95% 50%;
  --dimension-ei: 280 50% 55%;
  --dimension-sn: 200 60% 50%;
  --dimension-tf: 350 55% 52%;
  --dimension-jp: 160 50% 50%;
}
```

### Tailwind Usage
```tsx
// Primary color
<Button className="bg-primary text-primary-foreground">Click me</Button>

// Personality colors
<div className="bg-personality-diplomat">Diplomat</div>
<div className="bg-personality-strateger">Strateger</div>
<div className="bg-personality-byggare">Byggare</div>
<div className="bg-personality-upptackare">Upptäckare</div>

// Dimension colors
<div className="bg-dimension-ei">E/I Dimension</div>
<div className="bg-dimension-sn">S/N Dimension</div>
```

### Component Examples

#### Badge Component
```tsx
const getCategoryBadgeClass = (category: string) => {
  const classes: Record<string, string> = {
    DIPLOMAT: 'badge-diplomat',
    STRATEGER: 'badge-strateger',
    BYGGARE: 'badge-byggare',
    UPPTÄCKARE: 'badge-upptackare',
  };
  return classes[category] || 'bg-primary';
};

<span className={getCategoryBadgeClass(category)}>
  {category}
</span>
```

#### Card with Personality Color
```tsx
<Card className="border-l-4 border-personality-diplomat">
  <CardContent>Diplomat content</CardContent>
</Card>
```

### Accessibility
- All color combinations meet WCAG AA contrast ratios
- Dark mode colors adjusted for readability
- Focus states use ring colors with sufficient contrast
