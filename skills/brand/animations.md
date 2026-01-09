## Animation Guidelines

### Overview
Animation standards using Framer Motion for MÄÄK to create delightful, performant interactions.

## Animation Principles

### Design Philosophy
1. **Purposeful** - Animations should guide user attention and provide feedback
2. **Subtle** - Don't distract from content
3. **Fast** - Complete in 200-400ms for most interactions
4. **Natural** - Use easing curves that feel organic
5. **Accessible** - Respect `prefers-reduced-motion`

## Framer Motion Basics

### Installation
```bash
npm install framer-motion
```

### Import
```typescript
import { motion, AnimatePresence } from 'framer-motion';
```

## Common Animation Patterns

### Fade In
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Slide Up
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
>
  Content
</motion.div>
```

### Scale In
```tsx
<motion.div
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>
```

### Stagger Children
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

## Page Transitions

### Route Changes
```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Routes location={location}>
          {/* routes */}
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
```

### Modal Animations
```tsx
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-background rounded-lg p-6"
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

## Interactive Animations

### Hover Effects
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

### Drag Interactions
```tsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300, top: 0, bottom: 0 }}
  dragElastic={0.2}
  whileDrag={{ scale: 1.1 }}
>
  Drag me
</motion.div>
```

### Gesture Controls
```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  onTap={() => console.log('Tapped')}
>
  Interactive card
</motion.div>
```

## Mascot Animations

### Breathing Effect
```tsx
<motion.svg
  animate={{ 
    scale: [1, 1.05, 1],
    y: [0, -5, 0]
  }}
  transition={{ 
    duration: 2.5, 
    repeat: Infinity, 
    ease: 'easeInOut' 
  }}
>
  {/* mascot SVG */}
</motion.svg>
```

### Jump Animation
```tsx
<motion.div
  animate={{ y: isJumping ? -20 : 0 }}
  transition={{ 
    type: 'spring', 
    stiffness: 300, 
    damping: 20 
  }}
>
  <MaakMascot />
</motion.div>
```

### Heart Beat
```tsx
<motion.path
  animate={{ scale: [1, 1.2, 1] }}
  transition={{ 
    duration: 0.6, 
    repeat: Infinity,
    repeatDelay: 0.8 
  }}
  style={{ transformOrigin: 'center' }}
/>
```

## List Animations

### Animated List
```tsx
import { AnimatePresence, motion } from 'framer-motion';

function MatchList({ matches }: { matches: Match[] }) {
  return (
    <AnimatePresence>
      {matches.map((match, index) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ 
            delay: index * 0.05,
            duration: 0.3 
          }}
          layout
        >
          <MatchCard match={match} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

### Reordering Animation
```tsx
<motion.div layout transition={{ type: 'spring', stiffness: 300 }}>
  {/* Content that might reorder */}
</motion.div>
```

## Loading States

### Spinner
```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ 
    duration: 1, 
    repeat: Infinity, 
    ease: 'linear' 
  }}
  className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
/>
```

### Pulse Effect
```tsx
<motion.div
  animate={{ 
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1]
  }}
  transition={{ 
    duration: 2, 
    repeat: Infinity 
  }}
>
  Loading...
</motion.div>
```

### Skeleton Loader
```tsx
<motion.div
  className="h-20 bg-muted rounded-lg"
  animate={{ 
    opacity: [0.5, 1, 0.5] 
  }}
  transition={{ 
    duration: 1.5, 
    repeat: Infinity 
  }}
/>
```

## Notification Animations

### Toast Enter
```tsx
<motion.div
  initial={{ opacity: 0, y: 50, scale: 0.3 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
  transition={{ type: 'spring', damping: 25 }}
>
  Notification content
</motion.div>
```

### Success Checkmark
```tsx
<motion.svg
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  <motion.path
    d="M5 13l4 4L19 7"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  />
</motion.svg>
```

## Performance Optimization

### Use Transform
```tsx
// ❌ Causes reflow
<motion.div animate={{ left: 100, top: 100 }} />

// ✅ GPU accelerated
<motion.div animate={{ x: 100, y: 100 }} />
```

### Will Change
```tsx
<motion.div
  style={{ willChange: 'transform' }}
  animate={{ x: 100 }}
/>
```

### Reduce Motion
```tsx
import { useReducedMotion } from 'framer-motion';

function Component() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={{ x: prefersReducedMotion ? 0 : 100 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

## Easing Curves

### Built-in Easings
```typescript
// Linear
transition={{ ease: 'linear' }}

// Ease in/out
transition={{ ease: 'easeIn' }}
transition={{ ease: 'easeOut' }}
transition={{ ease: 'easeInOut' }}

// Custom cubic bezier
transition={{ ease: [0.17, 0.67, 0.83, 0.67] }}
```

### Spring Physics
```typescript
transition={{ 
  type: 'spring',
  stiffness: 300,  // Higher = snappier
  damping: 20,     // Higher = less bounce
  mass: 1          // Higher = slower
}}
```

## Animation Timings

### Standard Durations
```typescript
// Micro interactions (hover, tap)
duration: 0.15

// UI transitions (modal, dropdown)
duration: 0.3

// Page transitions
duration: 0.4

// Emphasis animations
duration: 0.6

// Background effects
duration: 2.0
```

### Delays and Stagger
```typescript
// Single delay
transition={{ delay: 0.2 }}

// Stagger children
transition={{ 
  staggerChildren: 0.1,
  delayChildren: 0.2 
}}
```

## Accessibility

### Respect User Preferences
```css
/* In CSS */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// In React
const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={shouldReduceMotion ? {} : { x: 100 }}
/>
```

### Focus States
```tsx
<motion.button
  whileFocus={{ scale: 1.05 }}
  className="focus-visible:ring-2"
>
  Accessible button
</motion.button>
```

## Best Practices

1. **Keep It Simple**
   - One or two animated properties max
   - Subtle movements more professional

2. **Performance First**
   - Use transform and opacity only when possible
   - Avoid animating layout properties
   - Test on low-end devices

3. **Consistent Timing**
   - Use standard duration values
   - Same easing for similar interactions
   - Maintain rhythm across app

4. **Purpose-Driven**
   - Every animation should have a reason
   - Guide attention, provide feedback, or delight
   - Don't animate just because you can

5. **Test Extensively**
   - Check on different devices
   - Verify reduced motion works
   - Ensure no jank or stutter
