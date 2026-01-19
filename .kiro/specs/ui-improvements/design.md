# Design Document

## Introduction

This design document outlines the technical approach for implementing UI/UX improvements across the e-commerce platform, focusing on admin panel enhancements, banner optimization, product availability handling, gesture improvements, and color scheme diversification.

## Architecture Overview

The improvements will be implemented across multiple layers:
- **Component Layer**: UI components for banners, product cards, and admin interface
- **Hook Layer**: Custom hooks for gesture handling and state management
- **Service Layer**: Database operations and business logic
- **Styling Layer**: Color scheme and responsive design updates

## Design Decisions

### 1. Admin Panel Management Button

**Approach**: Add a dropdown management button in the admin panel header
- **Location**: Top-right corner of admin panel header
- **Implementation**: React state-managed dropdown with click-outside handling
- **Styling**: Blue accent color to distinguish from other buttons

**Technical Details**:
```typescript
// State management
const [showQuickMenu, setShowQuickMenu] = useState(false);

// Click outside handler
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (showQuickMenu && !target.closest('.relative')) {
      setShowQuickMenu(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showQuickMenu]);
```

### 2. Banner Carousel PC Optimization

**Approach**: Fixed-size layout with centralized main banner
- **Main Banner**: 600px width, 400px height
- **Side Banners**: 300px width, 400px height
- **Image Handling**: CSS object-fit: cover with center positioning
- **Layout**: CSS Grid for responsive positioning

**Technical Details**:
```css
.banner-container {
  display: grid;
  grid-template-columns: 300px 600px 300px;
  gap: 1rem;
  height: 400px;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
```

### 3. Bundle Builder Stock Validation

**Approach**: Real-time stock checking with UI feedback
- **Validation Points**: Add to bundle button click, bundle builder display, checkout
- **UI Feedback**: Disabled buttons, error messages, visual indicators
- **Data Flow**: Product status check → UI state update → User feedback

**Technical Details**:
```typescript
// Stock validation
const isAvailable = product.status === 'in_stock';

// Button state
<Button 
  disabled={!isAvailable}
  onClick={handleAddToBundle}
  className={isAvailable ? 'bg-purple-500' : 'bg-gray-400'}
>
  {isAvailable ? 'В набор' : 'Недоступно'}
</Button>
```

### 4. Swipe Back Gesture Enhancement

**Approach**: Optimized touch event handling with lower thresholds
- **Threshold**: 25px (reduced from 40px)
- **Velocity**: 0.1 px/ms (reduced from 0.15)
- **Detection Zone**: 120px from left edge (increased from 80px)
- **Response Time**: 50ms delay (reduced from previous)

**Technical Details**:
```typescript
const useSwipeBack = (options = {}) => {
  const {
    threshold = 25,    // Lower threshold for faster response
    velocity = 0.1,    // Lower velocity requirement
  } = options;
  
  // Enhanced touch detection
  if (touch.clientX < 120) { // Larger detection zone
    // Initialize swipe tracking
  }
};
```

### 5. Color Scheme Diversification

**Approach**: Strategic color replacement while maintaining brand consistency
- **Purple Accents**: Premium features, bundle buttons on mobile
- **Orange Accents**: Warnings, secondary actions on desktop
- **Blue Accents**: Information, admin controls
- **Lime Green**: Primary CTA and branding (preserved)

**Color Mapping**:
```typescript
const colorScheme = {
  primary: 'lime-500',      // Main brand color
  secondary: 'purple-500',  // Premium features
  accent: 'orange-500',     // Warnings/secondary
  info: 'blue-500',         // Information/admin
  success: 'green-500',     // Success states
  error: 'red-500',         // Error states
};
```

## Component Updates

### AdminPage.tsx
- Add management dropdown button in header
- Implement click-outside handling
- Add colorful dashboard cards

### BannerCarousel.tsx
- Implement fixed-size grid layout
- Remove banner title overlays
- Optimize image sizing and positioning

### ProductCard.tsx
- Add stock status validation
- Implement color-coded buttons
- Add availability indicators

### useSwipeBack.ts
- Lower sensitivity thresholds
- Expand detection zone
- Improve response timing

## Implementation Strategy

### Phase 1: Core Functionality
1. Admin panel management button
2. Banner carousel optimization
3. Stock validation logic

### Phase 2: User Experience
1. Swipe gesture improvements
2. Color scheme updates
3. Visual feedback enhancements

### Phase 3: Testing & Refinement
1. Cross-device testing
2. Performance optimization
3. Accessibility compliance

## Testing Approach

### Unit Tests
- Component rendering with different states
- Hook behavior with various inputs
- Utility function validation

### Integration Tests
- User interaction flows
- State management across components
- API integration points

### Manual Testing
- Cross-browser compatibility
- Mobile device testing
- Accessibility validation

## Performance Considerations

### Image Optimization
- Lazy loading for banner images
- Preloading for critical banners
- Error handling for failed loads

### Gesture Handling
- Passive event listeners where possible
- Debounced state updates
- Memory leak prevention

### Color System
- CSS custom properties for theme consistency
- Minimal bundle size impact
- Runtime theme switching support

## Accessibility

### Color Contrast
- WCAG AA compliance for all color combinations
- High contrast mode support
- Color-blind friendly palette

### Keyboard Navigation
- Tab order for dropdown menus
- Escape key handling
- Focus management

### Screen Readers
- Proper ARIA labels
- Status announcements
- Semantic HTML structure

## Browser Support

### Target Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support
- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 14+

## Deployment Considerations

### Build Process
- CSS optimization
- JavaScript minification
- Asset compression

### Feature Flags
- Gradual rollout capability
- A/B testing support
- Rollback mechanisms

### Monitoring
- Performance metrics
- Error tracking
- User interaction analytics