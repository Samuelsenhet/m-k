## Personality Components Guide

### Overview
Components for displaying and interacting with personality types, scores, and compatibility data.

## Personality Type Structure

### MBTI Categories
```typescript
type Category = 'DIPLOMAT' | 'STRATEGER' | 'BYGGARE' | 'UPPTÄCKARE';

type ArchetypeCode = 
  // Diplomats
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  // Strategists
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  // Builders
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  // Explorers
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';
```

### Archetype Information
```typescript
interface ArchetypeInfo {
  name: string;        // "Förespråkaren"
  description: string;
  strengths: string[];
  challenges: string[];
  compatibility: {
    best: ArchetypeCode[];
    good: ArchetypeCode[];
    challenging: ArchetypeCode[];
  };
}
```

## Category Badge Component

### Implementation
```tsx
const getCategoryBadgeClass = (category: string) => {
  const classes: Record<string, string> = {
    DIPLOMAT: 'badge-diplomat',
    STRATEGER: 'badge-strateger',
    BYGGARE: 'badge-byggare',
    UPPTÄCKARE: 'badge-upptackare',
  };
  return classes[category] || 'bg-secondary text-secondary-foreground';
};

<span className={getCategoryBadgeClass(category)}>
  {category}
</span>
```

### CSS Classes
```css
.badge-diplomat {
  background: linear-gradient(135deg, hsl(280 60% 50%), hsl(280 60% 60%));
  color: white;
}

.badge-strateger {
  background: linear-gradient(135deg, hsl(220 70% 50%), hsl(220 70% 60%));
  color: white;
}

.badge-byggare {
  background: linear-gradient(135deg, hsl(145 55% 42%), hsl(145 55% 52%));
  color: white;
}

.badge-upptackare {
  background: linear-gradient(135deg, hsl(45 95% 50%), hsl(45 95% 60%));
  color: white;
}
```

## Personality Card Component

### Basic Structure
```tsx
interface PersonalityCardProps {
  archetype: ArchetypeCode;
  category: Category;
  showDetails?: boolean;
}

export function PersonalityCard({ 
  archetype, 
  category, 
  showDetails = false 
}: PersonalityCardProps) {
  const info = ARCHETYPE_INFO[archetype];
  
  return (
    <Card className="border-l-4 border-personality-diplomat">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-2xl">
            {archetype} - {info.name}
          </CardTitle>
          <span className={getCategoryBadgeClass(category)}>
            {category}
          </span>
        </div>
        <CardDescription>{info.description}</CardDescription>
      </CardHeader>
      
      {showDetails && (
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Styrkor</h4>
              <ul className="list-disc list-inside">
                {info.strengths.map((strength, i) => (
                  <li key={i}>{strength}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Utmaningar</h4>
              <ul className="list-disc list-inside">
                {info.challenges.map((challenge, i) => (
                  <li key={i}>{challenge}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
```

## Compatibility Score Display

### Score Bar Component
```tsx
interface CompatibilityScoreProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export function CompatibilityScore({ 
  score, 
  size = 'md' 
}: CompatibilityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-personality-byggare';
    if (score >= 60) return 'bg-primary';
    if (score >= 40) return 'bg-accent';
    return 'bg-muted';
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Utmärkt matchning';
    if (score >= 60) return 'God matchning';
    if (score >= 40) return 'Möjlig matchning';
    return 'Låg matchning';
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium">{getScoreLabel(score)}</span>
        <span className="text-2xl font-bold">{score}%</span>
      </div>
      <Progress value={score} className={getScoreColor(score)} />
    </div>
  );
}
```

## Dimension Score Component

### MBTI Dimensions
```tsx
interface DimensionScoreProps {
  dimension: 'ei' | 'sn' | 'tf' | 'jp' | 'at';
  score: number; // 0-100 (50 = balanced)
  label: string;
}

export function DimensionScore({ 
  dimension, 
  score, 
  label 
}: DimensionScoreProps) {
  const leftLabel = {
    ei: 'Introvert',
    sn: 'Sensing',
    tf: 'Thinking',
    jp: 'Judging',
    at: 'Assertive',
  }[dimension];
  
  const rightLabel = {
    ei: 'Extravert',
    sn: 'Intuition',
    tf: 'Feeling',
    jp: 'Perceiving',
    at: 'Turbulent',
  }[dimension];
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className={score < 50 ? 'font-bold' : ''}>
          {leftLabel}
        </span>
        <span className={score > 50 ? 'font-bold' : ''}>
          {rightLabel}
        </span>
      </div>
      
      <div className="relative h-2 bg-muted rounded-full">
        <div 
          className={`absolute h-full bg-dimension-${dimension} rounded-full`}
          style={{ width: `${score}%` }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-4 bg-foreground"
        />
      </div>
      
      <p className="text-center text-sm text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
```

## Match Card Component

### Full Implementation
```tsx
interface MatchCardProps {
  match: {
    id: string;
    display_name: string;
    archetype: ArchetypeCode;
    category: Category;
    compatibility_score: number;
    photo_url?: string;
    bio?: string;
    location?: string;
  };
  onViewProfile: (id: string) => void;
  onStartChat: (id: string) => void;
}

export function MatchCard({ 
  match, 
  onViewProfile, 
  onStartChat 
}: MatchCardProps) {
  const info = ARCHETYPE_INFO[match.archetype];
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Photo */}
      {match.photo_url && (
        <div className="aspect-square relative">
          <img 
            src={match.photo_url} 
            alt={match.display_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <span className={getCategoryBadgeClass(match.category)}>
              {match.archetype}
            </span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Name and Location */}
          <div>
            <h3 className="font-serif text-xl font-semibold">
              {match.display_name}
            </h3>
            {match.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {match.location}
              </p>
            )}
          </div>
          
          {/* Compatibility Score */}
          <CompatibilityScore score={match.compatibility_score} />
          
          {/* Bio */}
          {match.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {match.bio}
            </p>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onViewProfile(match.id)}
            >
              Se profil
            </Button>
            <Button 
              className="flex-1"
              onClick={() => onStartChat(match.id)}
            >
              <Heart className="w-4 h-4 mr-2" />
              Chatta
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Personality Test Question Component

### Question Display
```tsx
interface QuestionProps {
  question: {
    id: string;
    text: string;
    dimension: 'ei' | 'sn' | 'tf' | 'jp' | 'at';
  };
  onAnswer: (value: number) => void;
  currentAnswer?: number;
}

export function PersonalityQuestion({ 
  question, 
  onAnswer, 
  currentAnswer 
}: QuestionProps) {
  const options = [
    { value: 0, label: 'Instämmer inte' },
    { value: 25, label: 'Instämmer delvis inte' },
    { value: 50, label: 'Neutral' },
    { value: 75, label: 'Instämmer delvis' },
    { value: 100, label: 'Instämmer helt' },
  ];
  
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">
          {question.text}
        </h3>
        
        <div className="space-y-2">
          {options.map((option) => (
            <Button
              key={option.value}
              variant={currentAnswer === option.value ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => onAnswer(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Best Practices

1. **Consistent Color Usage**
   - Always use personality color variables
   - Match category colors to archetype categories
   - Use dimension colors for MBTI axis displays

2. **Accessibility**
   - Include descriptive labels for scores
   - Use semantic HTML
   - Ensure color contrast meets WCAG AA

3. **Performance**
   - Memoize personality calculations
   - Lazy load archetype descriptions
   - Use React.memo for static personality cards

4. **Data Validation**
   - Validate archetype codes against allowed types
   - Ensure scores are in 0-100 range
   - Handle missing personality data gracefully
