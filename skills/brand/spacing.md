## Spacing and Layout Guidelines

### Overview
Consistent spacing system for creating harmonious layouts in MÄÄK.

## Spacing Scale

### Tailwind Spacing
MÄÄK uses Tailwind's default spacing scale based on 0.25rem (4px) increments:

```css
0: 0px
0.5: 2px (0.125rem)
1: 4px (0.25rem)
2: 8px (0.5rem)
3: 12px (0.75rem)
4: 16px (1rem)
5: 20px (1.25rem)
6: 24px (1.5rem)
8: 32px (2rem)
10: 40px (2.5rem)
12: 48px (3rem)
16: 64px (4rem)
20: 80px (5rem)
24: 96px (6rem)
32: 128px (8rem)
40: 160px (10rem)
48: 192px (12rem)
64: 256px (16rem)
```

## Component Spacing

### Card Padding
```tsx
// Small card
<Card className="p-4">
  {/* 16px padding */}
</Card>

// Medium card (default)
<Card className="p-6">
  {/* 24px padding */}
</Card>

// Large card
<Card className="p-8">
  {/* 32px padding */}
</Card>
```

### Section Spacing
```tsx
// Vertical spacing between sections
<section className="py-12 md:py-16 lg:py-24">
  {/* 48px/64px/96px vertical padding */}
</section>

// Container padding
<div className="container px-4 md:px-6">
  {/* Responsive horizontal padding */}
</div>
```

### Element Gaps
```tsx
// Tight spacing (related elements)
<div className="space-y-2">
  {/* 8px gap between children */}
</div>

// Normal spacing (form fields, list items)
<div className="space-y-4">
  {/* 16px gap */}
</div>

// Loose spacing (sections)
<div className="space-y-8">
  {/* 32px gap */}
</div>

// Extra loose (major sections)
<div className="space-y-12">
  {/* 48px gap */}
</div>
```

## Layout Patterns

### Page Container
```tsx
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="h-16 sticky top-0 z-50">
        {/* Nav content */}
      </nav>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
```

### Two Column Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
  <div>{/* Left column */}</div>
  <div>{/* Right column */}</div>
</div>
```

### Three Column Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <div key={item.id}>{/* Column content */}</div>
  ))}
</div>
```

### Sidebar Layout
```tsx
<div className="flex flex-col md:flex-row gap-6">
  {/* Sidebar */}
  <aside className="w-full md:w-64 shrink-0">
    {/* Sidebar content */}
  </aside>
  
  {/* Main content */}
  <main className="flex-1 min-w-0">
    {/* Main content */}
  </main>
</div>
```

## Responsive Spacing

### Mobile First Approach
```tsx
// Starts small, grows on larger screens
<div className="p-4 md:p-6 lg:p-8">
  {/* 16px → 24px → 32px */}
</div>

<div className="space-y-4 md:space-y-6 lg:space-y-8">
  {/* 16px → 24px → 32px gaps */}
</div>
```

### Breakpoints
```typescript
// Tailwind breakpoints
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1400px // Large desktops (custom in config)
```

## Typography Spacing

### Headings
```tsx
// Page title
<h1 className="text-4xl font-bold mb-6">
  Title
</h1>

// Section heading
<h2 className="text-3xl font-semibold mb-4">
  Section
</h2>

// Subsection
<h3 className="text-2xl font-medium mb-3">
  Subsection
</h3>
```

### Paragraphs
```tsx
// Body text with spacing
<div className="space-y-4">
  <p className="text-base leading-relaxed">
    First paragraph
  </p>
  <p className="text-base leading-relaxed">
    Second paragraph
  </p>
</div>

// Line height
leading-none: 1
leading-tight: 1.25
leading-snug: 1.375
leading-normal: 1.5
leading-relaxed: 1.625
leading-loose: 2
```

## Form Spacing

### Form Layout
```tsx
<form className="space-y-6">
  {/* Field */}
  <div className="space-y-2">
    <Label>Name</Label>
    <Input />
    <p className="text-sm text-muted-foreground">
      Helper text
    </p>
  </div>
  
  {/* Field */}
  <div className="space-y-2">
    <Label>Email</Label>
    <Input />
  </div>
  
  {/* Submit */}
  <Button className="w-full">
    Submit
  </Button>
</form>
```

### Input Padding
```tsx
// Default input
<Input className="px-3 py-2" />

// Large input
<Input className="px-4 py-3 text-lg" />

// Small input
<Input className="px-2 py-1 text-sm" />
```

## Card Layouts

### Match Card
```tsx
<Card className="overflow-hidden">
  {/* Image - no padding */}
  <div className="aspect-square">
    <img src={photo} className="w-full h-full object-cover" />
  </div>
  
  {/* Content - standard padding */}
  <CardContent className="p-4 space-y-3">
    <h3 className="text-xl font-semibold">Name</h3>
    <p className="text-sm text-muted-foreground">Bio</p>
    
    {/* Actions */}
    <div className="flex gap-2 pt-2">
      <Button className="flex-1">View</Button>
      <Button className="flex-1">Chat</Button>
    </div>
  </CardContent>
</Card>
```

### Info Card
```tsx
<Card className="p-6">
  <CardHeader className="p-0 pb-4">
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  
  <CardContent className="p-0">
    {/* Content */}
  </CardContent>
</Card>
```

## Modal Spacing

### Modal Layout
```tsx
<Dialog>
  <DialogContent className="max-w-md">
    {/* Header */}
    <DialogHeader className="space-y-3 pb-4">
      <DialogTitle className="text-2xl">
        Title
      </DialogTitle>
      <DialogDescription>
        Description
      </DialogDescription>
    </DialogHeader>
    
    {/* Body */}
    <div className="space-y-4">
      {/* Content */}
    </div>
    
    {/* Footer */}
    <DialogFooter className="pt-6">
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## List Spacing

### Vertical List
```tsx
<ul className="space-y-3">
  {items.map(item => (
    <li key={item.id} className="p-4 border rounded-lg">
      {item.content}
    </li>
  ))}
</ul>
```

### Grid List
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {items.map(item => (
    <div key={item.id} className="aspect-square">
      {item.content}
    </div>
  ))}
</div>
```

## Navigation Spacing

### Header Nav
```tsx
<header className="h-16 px-4 flex items-center justify-between">
  {/* Logo */}
  <div className="flex items-center gap-2">
    <Logo />
    <span className="text-xl font-bold">MÄÄK</span>
  </div>
  
  {/* Nav links */}
  <nav className="flex items-center gap-6">
    <a href="/matches">Matches</a>
    <a href="/chat">Chat</a>
    <a href="/profile">Profile</a>
  </nav>
</header>
```

### Bottom Nav (Mobile)
```tsx
<nav className="fixed bottom-0 inset-x-0 h-16 border-t bg-background">
  <div className="flex items-center justify-around h-full">
    {navItems.map(item => (
      <a 
        key={item.href}
        href={item.href}
        className="flex flex-col items-center gap-1 p-2"
      >
        <Icon className="w-6 h-6" />
        <span className="text-xs">{item.label}</span>
      </a>
    ))}
  </div>
</nav>
```

## Max Width Constraints

### Content Width
```tsx
// Text content (optimal reading width)
<div className="max-w-prose mx-auto">
  {/* ~65ch width */}
</div>

// Form (comfortable form width)
<form className="max-w-md mx-auto">
  {/* 448px max */}
</form>

// Card grid
<div className="max-w-7xl mx-auto">
  {/* 1280px max */}
</div>

// Full width section
<section className="w-full">
  <div className="max-w-7xl mx-auto px-4">
    {/* Centered container */}
  </div>
</section>
```

## White Space

### Breathing Room
```tsx
// Tight (data-dense UI)
<div className="p-2 space-y-1">

// Comfortable (standard UI)
<div className="p-4 space-y-3">

// Spacious (emphasis, landing pages)
<div className="p-8 space-y-6">
```

### Visual Hierarchy
```tsx
<section className="space-y-12">
  {/* Major section 1 */}
  <div className="space-y-6">
    <h2>Section Title</h2>
    
    {/* Subsections */}
    <div className="space-y-4">
      {/* Items */}
      <div className="space-y-2">
        {/* Tightly related content */}
      </div>
    </div>
  </div>
  
  {/* Major section 2 */}
  <div className="space-y-6">
    {/* ... */}
  </div>
</section>
```

## Negative Space

### Margin vs Padding
```tsx
// Use padding for internal spacing
<Card className="p-6">
  {/* Content */}
</Card>

// Use margin for external spacing
<div className="mb-8">
  <Card className="p-6">
    {/* Content */}
  </Card>
</div>

// Or use gap utilities in parent
<div className="space-y-8">
  <Card className="p-6">{/* Card 1 */}</Card>
  <Card className="p-6">{/* Card 2 */}</Card>
</div>
```

## Best Practices

1. **Consistency**
   - Use spacing scale consistently
   - Same spacing for similar elements
   - Maintain vertical rhythm

2. **Responsive**
   - Reduce spacing on mobile
   - Increase on larger screens
   - Test at all breakpoints

3. **Hierarchy**
   - More space = more importance
   - Group related items close
   - Separate unrelated content

4. **Touch Targets**
   - Minimum 44x44px on mobile
   - Add padding around clickable areas
   - Ensure comfortable tap spacing

5. **Reading Comfort**
   - Limit line length (65ch)
   - Adequate line height (1.5-1.625)
   - Paragraph spacing (1em)
