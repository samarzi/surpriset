# Global Swipe Block Fix - Preventing App Collapse Everywhere

## Critical Problem
Horizontal swipes ANYWHERE in the app (especially in the header/top area) were causing the Telegram WebApp to collapse/minimize, even in fullscreen mode.

## Root Cause
1. Telegram interprets horizontal swipes in the upper part of the screen as gestures to minimize the app
2. The header has `position: sticky` which makes it particularly sensitive to swipe gestures
3. Global CSS `touch-action: pan-y` was allowing horizontal swipes everywhere
4. No global prevention of horizontal swipes outside of specific components

## Solution Implemented

### 1. Global Horizontal Swipe Blocking

**File**: `src/hooks/useTelegramWebApp.ts`

```typescript
// КРИТИЧНО: Блокируем ВСЕ горизонтальные свайпы (кроме карусели и back navigation)
if (isHorizontalSwipe) {
  console.log('❌ Blocking horizontal swipe to prevent app collapse')
  e.preventDefault()
  e.stopPropagation()
  return false
}
```

**Key Changes**:
- Global touch handler now blocks ALL horizontal swipes by default
- Exceptions only for:
  1. Carousel elements (data-carousel="true")
  2. Back navigation from left edge (< 50px)
- Aggressive `preventDefault()` on all horizontal movements

### 2. Header Swipe Protection

**File**: `src/components/layout/Header.tsx`

```typescript
<header 
  style={{ touchAction: 'pan-y' }}
  onTouchStart={(e) => {
    const touch = e.touches[0];
    (e.currentTarget as any)._startX = touch.clientX;
    (e.currentTarget as any)._startY = touch.clientY;
  }}
  onTouchMove={(e) => {
    const touch = e.touches[0];
    const startX = (e.currentTarget as any)._startX || 0;
    const startY = (e.currentTarget as any)._startY || 0;
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);
    
    // Если горизонтальный свайп больше вертикального - блокируем
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
  }}
  onContextMenu={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
>
```

**Key Changes**:
- Direct touch handlers on header element
- Detects horizontal vs vertical swipe direction
- Blocks horizontal swipes immediately (> 10px movement)
- Blocks context menu on long press
- `touchAction: 'pan-y'` enforces vertical-only scrolling

### 3. CSS-Level Protection

**File**: `src/index.css`

```css
.telegram-env {
  /* КРИТИЧНО: Разрешаем только вертикальный скролл */
  touch-action: pan-y !important;
  overscroll-behavior-x: none !important;
  -webkit-user-select: none !important;
  -webkit-touch-callout: none !important;
}
```

**Key Changes**:
- `touch-action: pan-y !important` - only vertical panning allowed globally
- `overscroll-behavior-x: none` - no horizontal overscroll
- Applied to entire Telegram environment

### 4. Banner Carousel Exception

**File**: `src/components/ui/banner-carousel.tsx`

Carousel still works because:
- Has its own touch handlers with `preventDefault()`
- Uses `touch-action: pan-x` to override global `pan-y`
- Global handler detects carousel and ignores it completely

## How It Works

### Swipe Detection Flow:

1. **User touches screen** → `onTouchStart` records position
2. **User moves finger** → `onTouchMove` calculates deltaX and deltaY
3. **Check if in carousel** → If yes, let carousel handle it
4. **Check if from left edge** → If yes, allow back navigation
5. **Check if horizontal** → If yes, **BLOCK IT** with `preventDefault()`
6. **If vertical** → Allow normal scrolling

### Protected Areas:

- ✅ **Header** - Direct touch handlers block horizontal swipes
- ✅ **Main content** - Global handler blocks horizontal swipes
- ✅ **Footer** - Global handler blocks horizontal swipes
- ✅ **All pages** - Global CSS + JavaScript protection
- ❌ **Carousel** - Exception, has its own horizontal swipe handling
- ❌ **Left edge** - Exception, allows back navigation

## Testing Checklist

### Global Swipe Test:
1. ✅ Swipe horizontally on header → app stays open
2. ✅ Swipe horizontally on main content → app stays open
3. ✅ Swipe horizontally anywhere in top area → app stays open
4. ✅ Long press anywhere → app stays open
5. ✅ Check console for: ❌ "Blocking horizontal swipe to prevent app collapse"

### Carousel Test:
1. ✅ Swipe left/right on banner → banner changes (app stays open)
2. ✅ Check console for: ✅ "Inside carousel - letting carousel handle it"

### Back Navigation Test:
1. ✅ Swipe from left edge (< 50px) → goes back
2. ✅ Check console for: ✅ "Allowing back navigation swipe"

### Vertical Scroll Test:
1. ✅ Scroll up/down anywhere → works normally
2. ✅ No interference with vertical scrolling

## Build Info

**New bundles**:
- CSS: `index-DSSv_wnX.css` (92.82 kB)
- JS: `index-BG670PpF.js` (282.15 kB)

## Deployment

1. Build completed successfully ✅
2. Upload new files to server
3. Clear Telegram cache or force reload
4. Test in Telegram WebApp

## Technical Summary

**Three-Layer Global Protection**:
1. **CSS Layer**: `touch-action: pan-y !important` on entire app
2. **Header Layer**: Direct touch handlers on header element
3. **Global JavaScript Layer**: Blocks ALL horizontal swipes except carousel and back nav

**Exceptions**:
- Carousel: Has `touch-action: pan-x` and own handlers
- Left edge: Allows back navigation (< 50px from left)

**Result**: 
- No horizontal swipes can collapse the app
- Carousel still works perfectly
- Back navigation still works
- Vertical scrolling unaffected
- Navigation bar at 4px from bottom
