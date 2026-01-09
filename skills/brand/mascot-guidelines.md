## MÄÄK Mascot Implementation Guide

### Character Design
The MÄÄK mascot is a bubble-style character with 3D glossy effects, heart-shaped ears, and expressive emoji face.

#### Anatomy
- **Body**: Large rounded bubble (420px tall)
- **Head**: Circular bubble (105px radius)
- **Ears**: Heart-shaped bubbles (animated)
- **Arms**: Rounded limbs (25px radius)
- **Legs**: Small bubble paws (20px radius)

#### Colors
```typescript
// Body gradient (3D effect)
bodyGradient3D: radialGradient(
  '#ffffff' 0%,
  '#fefdfb' 30%,
  '#f8f5f0' 70%,
  '#ebe6dc' 100%
)

// Heart ears
heartGradient3D: radialGradient(
  '#ffc9de' 0%,
  '#ffaac9' 50%,
  '#ff8fb4' 100%
)

// Limbs
limbGradient3D: radialGradient(
  '#ffeee0' 0%,
  '#f5ddc8' 60%,
  '#e8cfb8' 100%
)
```

### Poses

| Pose | Description | Use Case |
|------|-------------|----------|
| `idle` | Default breathing animation | General display |
| `happy` | Bouncing with heart ears | Celebration, success |
| `jump` | Upward motion (-20px y) | New matches, achievements |
| `asleep` | Slow breathing, closed | Waiting state |
| `startled` | Quick reaction (±20° rotate) | User interaction |
| `love` | Hearts glow, happy bounce | Romantic context |
| `tired` | Slow movement | Loading, processing |
| `fall` | Downward motion (+40px y) | Error state |

### Expressions

| Emoji | Meaning | Context |
|-------|---------|---------|
| 😊 | Default happy | General positive |
| 😴 | Sleeping | Waiting, idle |
| 😍 | In love | Matches, romance |
| 😮 | Surprised | Startled, notifications |
| 🤗 | Welcoming | Onboarding, greetings |
| 😵‍💫 | Confused | Error, loading |
| 😡 | Angry | (Rarely used) |
| 😐 | Neutral | Default fallback |

### Component Usage

#### Basic Implementation
```tsx
import { MaakMascot } from '@/components/mascot';

<MaakMascot 
  size={280}
  pose="idle"
  expression="😊"
/>
```

#### With State Management
```tsx
import { useMascotState } from '@/hooks/useMascotState';

const { pose, expression, message } = useMascotState(journeyPhase);

<MaakMascot 
  size={300}
  pose={pose}
  expression={expression}
/>
{message && <p>{message}</p>}
```

#### With Click Handler
```tsx
<MaakMascot 
  size={250}
  onClick={() => console.log('Mascot tapped!')}
/>
```

### Animation States

#### Onboarding
```tsx
pose="idle"
expression="😊"
message={null}
```

#### Waiting for Matches
```tsx
pose="idle"
expression="😊"
message="Dina matchningar analyseras... 🔍"
```

#### First Match
```tsx
pose="happy"
expression="😍"
message="Din första matchning! Välkommen till MÄÄK! 🥳"
effects={['confetti', 'sparkles']}
```

#### New Batch
```tsx
pose="jump"
expression="😊"
message="Nya matchningar har anlänt! 🔥"
effects={['pulse']}
```

### Performance
- SVG-based for scalability
- Framer Motion animations (60fps)
- Size prop controls dimensions
- Animations respect `prefers-reduced-motion`

### Best Practices
1. Default size: 280px for hero sections, 200px for cards
2. Always provide appropriate pose for context
3. Use `onClick` for interactive elements
4. Match expression to user's emotional state
5. Combine with toast messages for feedback
