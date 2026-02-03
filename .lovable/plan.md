
# Hidden Beta UI Toggle with Material 3 Expressive Design

## Overview

This plan implements a hidden "beta UI" mode accessible by long-pressing the header logo. When enabled, the entire application switches to a new Material 3 Expressive design inspired by PixelPlayer.

---

## Part 1: Beta Mode Infrastructure

### 1.1 Create Beta UI Context Provider

Create a new context to manage the beta UI state persistently using localStorage.

**File: `src/contexts/BetaUIContext.tsx`**

- Store `isBetaUI` boolean state
- Persist preference in localStorage under key `beta-ui-enabled`
- Provide toggle function
- Wrap app in this provider

### 1.2 Add Long-Press Detection to Header Logo

Modify `src/pages/Index.tsx` header section:

- Add `onTouchStart`, `onTouchEnd`, `onMouseDown`, `onMouseUp` handlers to the logo container
- Trigger after 1.5 seconds of continuous press
- Show a toast notification: "Beta UI [Enabled/Disabled]"
- Provide subtle haptic feedback (vibrate API if available)

---

## Part 2: Material 3 Expressive Design System

### 2.1 New CSS Variables for Expressive Mode

**File: `src/index.css`** - Add new CSS class `.expressive`

New design tokens:
- `--radius-expressive: 24px` (large squircle-like corners)
- `--radius-expressive-lg: 32px` (extra large for cards/containers)
- `--radius-expressive-sm: 16px` (smaller elements)
- Vibrant color palette with higher saturation
- Expressive shadows with color tinting
- Spring-based animation timing functions

### 2.2 New Tailwind Configuration

**File: `tailwind.config.ts`** - Add expressive utilities

New additions:
- `rounded-expressive`, `rounded-expressive-lg`, `rounded-expressive-sm` border radius utilities
- Spring-based keyframe animations (`spring-bounce`, `spring-pop`, `spring-slide`)
- Expressive shadow utilities

---

## Part 3: Complete UI Redesign Components

### 3.1 Expressive Index Page

**File: `src/pages/ExpressiveIndex.tsx`** - New page component

Design characteristics:
- **Header**: Larger logo with pill-shaped container, floating appearance with subtle bounce on hover
- **Hero Section**: Bold typography with emphasis, animated gradient text, larger spacing
- **Feature Cards**: Squircle-shaped cards (32px radius), more prominent shadows, spring hover animations
- **File Upload Zone**: Large rounded container (32px radius), expressive drop state with scale animation
- **Buttons**: Fully rounded pill shape, spring-based press animation, prominent shadows
- **Footer**: Simplified, modern layout with large rounded sections

### 3.2 Expressive Feature Card

**File: `src/components/ExpressiveFeatureCard.tsx`**

- Large squircle shape (32px radius)
- Floating appearance with subtle shadow
- Spring-based hover animation (scale + shadow)
- Icon with gradient background in pill container
- Bold heading with emphasis

### 3.3 Expressive File Upload

**File: `src/components/ExpressiveFileUpload.tsx`**

- Large rounded upload zone (32px radius)
- Expressive drag state with scale + glow animation
- Pill-shaped tab switcher for conversion modes
- Progress indicator with spring animation
- Success/error states with playful iconography

### 3.4 Expressive Button Variants

**File: `src/components/ui/expressive-button.tsx`**

New button component with:
- Fully rounded (pill) shapes as default
- Spring-based press animation (scale down with bounce back)
- Expressive shadows with color tinting
- Bold typography

### 3.5 Expressive Theme Toggle

**File: `src/components/ExpressiveThemeToggle.tsx`**

- Larger toggle with pill shape
- Expressive animation between sun/moon
- Bounce/spring effect on toggle

---

## Part 4: Animation System

### 4.1 Spring Animation Keyframes

Add to `tailwind.config.ts` and `src/index.css`:

```text
Spring animations:
- spring-pop: Scale from 0.9 to 1.05 to 1 with overshoot
- spring-press: Scale to 0.95 then spring back to 1
- spring-slide-up: Translate with spring easing
- spring-bounce: Vertical bounce with decay
- spring-shake: Horizontal shake for errors
```

### 4.2 CSS Custom Easing

```text
Expressive timing functions:
- --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
- --ease-spring-soft: cubic-bezier(0.25, 1.25, 0.5, 1)
- --ease-spring-bouncy: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

## Part 5: Integration

### 5.1 Conditional Rendering in Index

**File: `src/pages/Index.tsx`**

- Import `useBetaUI` hook
- If `isBetaUI` is true, render `<ExpressiveIndex />` instead
- Pass same functionality props

### 5.2 App Provider Wrapping

**File: `src/App.tsx`**

- Wrap with `<BetaUIProvider>`

---

## Part 6: Design Specifications

### Color Palette (Expressive Mode)
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `hsl(280 70% 55%)` | More vibrant purple |
| Primary Glow | `hsl(250 80% 60%)` | Gradient accent |
| Surface | `hsl(280 15% 8%)` | Dark backgrounds |
| Surface Container | `hsl(280 10% 12%)` | Cards, containers |

### Border Radius Scale
| Name | Value | Usage |
|------|-------|-------|
| expressive-sm | 16px | Small buttons, badges |
| expressive | 24px | Standard elements |
| expressive-lg | 32px | Cards, containers |
| expressive-xl | 40px | Hero elements |
| full | 9999px | Pills, fully rounded |

### Typography Scale (Expressive)
- Display: 64px, weight 800, tight tracking
- Heading: 32px, weight 700
- Body: 18px, weight 400, relaxed leading
- Caption: 14px, weight 500

### Animation Timings
| Animation | Duration | Easing |
|-----------|----------|--------|
| Hover | 200ms | spring-soft |
| Press | 150ms | spring-bouncy |
| Page transition | 400ms | spring |
| Micro-interaction | 300ms | spring |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/BetaUIContext.tsx` | Create | Beta UI state management |
| `src/pages/ExpressiveIndex.tsx` | Create | New expressive UI page |
| `src/components/ExpressiveFeatureCard.tsx` | Create | Expressive feature card |
| `src/components/ExpressiveFileUpload.tsx` | Create | Expressive file upload |
| `src/components/ui/expressive-button.tsx` | Create | Pill-shaped expressive button |
| `src/components/ExpressiveThemeToggle.tsx` | Create | Animated expressive toggle |
| `src/index.css` | Modify | Add expressive CSS variables |
| `tailwind.config.ts` | Modify | Add expressive utilities |
| `src/pages/Index.tsx` | Modify | Add long-press handler + conditional render |
| `src/App.tsx` | Modify | Wrap with BetaUIProvider |

---

## User Experience Flow

1. User long-presses the "MRPack Converter" logo in header (1.5 seconds)
2. Toast notification appears: "Beta UI Enabled - Experimental design active!"
3. Page smoothly transitions to expressive design
4. All interactions use spring-based animations
5. Preference persists across sessions via localStorage
6. Long-press again to toggle back to classic UI
