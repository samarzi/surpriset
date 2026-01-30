# How It Works Section - Transparent Background Fix

## Status: ✅ COMPLETE

## Problem
User requested to remove the semi-transparent background squares from the "How It Works" section cards.

## Solution
Removed the gradient background and border styling from both desktop and mobile card layouts:

### Changes Made

**Desktop/Tablet Cards:**
- Removed: `bg-gradient-to-br ${step.bgGradient}`
- Removed: `backdrop-blur-sm`
- Removed: `border border-border/50`
- Removed: `group-hover:shadow-xl`
- Removed: `group-hover:border-primary/30`
- Kept: Core layout, padding, and scale animations

**Mobile Cards:**
- Removed: `bg-gradient-to-br ${step.bgGradient}`
- Removed: `backdrop-blur-sm`
- Removed: `border border-border/50`
- Kept: Core layout, padding, and touch interactions

## Result
- Cards now have transparent backgrounds
- Icons and text remain visible and styled
- Hover effects and animations still work
- Cleaner, more minimal appearance
- Build successful (7.77s)

## Files Modified
- ✅ `src/components/home/HowItWorksSection.tsx` - Removed background styling from cards
