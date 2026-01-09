---
name: MÄÄK Brand Identity
description: Official brand colors, typography, and design system for MÄÄK dating app
---

## Overview
MÄÄK uses a modern psychological design system with personality-driven colors and a custom mascot character. The design emphasizes emotional connection through warm colors and playful animations.

## Colors

### Primary Colors
- **Primary**: `hsl(350, 75%, 55%)` `#e95d7b` - Warm Coral/Rose for CTAs
- **Primary Foreground**: `hsl(0, 0%, 100%)` `#ffffff` - Text on primary
- **Primary Glow**: `hsl(350, 80%, 65%)` `#f17a93` - Highlight effects

### Secondary Colors
- **Secondary**: `hsl(220, 15%, 20%)` `#2b3440` - Dark neutral
- **Accent**: `hsl(280, 60%, 55%)` `#a856d8` - Purple for secondary actions
- **Background**: `hsl(220, 20%, 98%)` `#f9fafb` - Light base
- **Foreground**: `hsl(220, 25%, 12%)` `#171c24` - Primary text

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

### Dark Mode
All colors have dark mode variants defined in `src/index.css` with adjusted brightness and saturation for optimal contrast.

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
