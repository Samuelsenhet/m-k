---
name: MÄÄK Brand Identity
description: Official brand colors, typography, and design system for MÄÄK dating app
---

## Overview
MÄÄK uses a modern psychological design system aligned with **Material Design 3** token principles and the **Eucalyptus Grove** palette: grounded, peaceful, and authentic. Primary, secondary, tertiary, and surface roles use "on" variants for WCAG 2.1 AA contrast. The system includes personality-driven colors, a custom mascot, and consistent motion (100–300ms for UI feedback).

## Colors (Eucalyptus Grove)

### Primary Colors
- **Primary**: `#4B6E48` – Forest green for CTAs (trust, growth)
- **Primary Foreground**: `#ffffff` – Text on primary
- **Primary Glow**: Slightly lighter green for highlights

### Secondary & Accent
- **Secondary**: Sage tint `hsl(45 18% 88%)` – Soft emphasis
- **Accent**: Sage `#B2AC88` – Links, badges, complementary actions
- **Background**: Off-white `#F2F0EF` – Light base
- **Foreground**: Dark forest `#253D2C` – Primary text
- **Muted**: Gray `#898989` – Body text, secondary content

### Personality Type Colors
- **Diplomat**: `hsl(280, 60%, 50%)` `#9933cc` - Purple (INFJ, INFP, ENFJ, ENFP)
- **Strateger**: `hsl(220, 70%, 50%)` `#2979ff` - Blue (INTJ, INTP, ENTJ, ENTP)
- **Byggare**: `hsl(145, 55%, 42%)` `#32a66f` - Green (ISTJ, ISFJ, ESTJ, ESFJ)
- **Upptäckare**: `hsl(45, 95%, 50%)` `#ffbf00` - Gold (ISTP, ISFP, ESTP, ESFP)

### Dimension Colors (MBTI Axes)
- **E/I**: `hsl(280, 60%, 55%)` - Purple for Extraversion/Introversion
- **S/N**: `hsl(220, 70%, 50%)` - Blue for Sensing/Intuition
- **T/F**: `hsl(350, 75%, 55%)` - Rose for Thinking/Feeling
- **J/P**: `hsl(145, 55%, 42%)` - Green for Judging/Perceiving
- **A/T**: `hsl(45, 95%, 50%)` - Gold for Assertive/Turbulent

### Token Roles (Material Design 3–aligned)
- **Surface**: Elevated containers (`--surface`, `--surface-foreground`)
- **Tertiary**: Subtle emphasis (`--tertiary`, `--tertiary-foreground`)
- **Shape**: `--radius`, `--radius-sm` through `--radius-2xl` (4px–28px scale)
- **Motion**: `--duration-fast` (100ms), `--duration-normal` (200ms), `--duration-slow` (300ms) for UI feedback

### Dark Mode
All colors have dark mode variants defined in `src/index.css` with adjusted brightness and saturation for optimal contrast. Use design tokens (e.g. `text-foreground`, `bg-card`, `border-border`) instead of raw grays so themes stay consistent.

## Typography

### Fonts
- **Sans**: `'DM Sans', sans-serif` - Body text, UI elements, forms
- **Serif**: `'Playfair Display', serif` - Headers, personality type names, emphasis

### Usage
```css
/* Body text */
font-family: 'DM Sans', sans-serif;

/* Headers */
font-family: 'Playfair Display', serif;
```

## Gradients

### Primary Gradient
```css
background: linear-gradient(135deg, hsl(350 75% 55%), hsl(280 60% 55%));
/* Coral to Purple - Hero sections, CTAs */
```

### Personality Gradients
```css
/* Diplomat */
background: linear-gradient(135deg, hsl(280 60% 50%), hsl(280 60% 60%));

/* Strateger */
background: linear-gradient(135deg, hsl(220 70% 50%), hsl(220 70% 60%));

/* Byggare */
background: linear-gradient(135deg, hsl(145 55% 42%), hsl(145 55% 52%));

/* Upptäckare */
background: linear-gradient(135deg, hsl(45 95% 50%), hsl(45 95% 60%));
```

## CSS Classes

### Utility Classes
- `.gradient-primary` - Primary gradient background
- `.gradient-hero` - Hero section gradient
- `.gradient-accent` - Accent gradient
- `.shadow-glow` - Glowing shadow effect
- `.badge-diplomat`, `.badge-strateger`, `.badge-byggare`, `.badge-upptackare` - Personality badges

**Note:** Badge class names use ASCII-safe variants (e.g., `upptackare` instead of `upptäckare`) to avoid issues with special characters in CSS class names. Always use the ASCII form in code.

## Workflows
[For color implementation in components, read "./colors.md"]
[For mascot usage and animation, read "./mascot-guidelines.md"]
[For typography standards, read "./typography.md"]
