# Tasks Document

## Implementation Tasks

This document breaks down the UI improvements into specific, actionable tasks with clear acceptance criteria and implementation details.

## Task 1: Admin Panel Management Button

**Priority**: High  
**Estimated Effort**: 2 hours  
**Dependencies**: None

### Description
Add a management dropdown button in the admin panel header for quick access to all admin sections.

### Implementation Steps
1. **Update AdminPage.tsx header section**
   - Add management button with Settings icon
   - Implement dropdown menu with navigation links
   - Add blue accent styling for the button

2. **Add state management**
   - Add `showQuickMenu` state variable
   - Implement click handler for button toggle

3. **Implement click-outside handling**
   - Add useEffect for document click listener
   - Close menu when clicking outside the dropdown
   - Clean up event listeners on unmount

4. **Style the dropdown menu**
   - Position absolutely relative to button
   - Add shadow and border styling
   - Include icons for each menu item

### Acceptance Criteria
- [ ] Management button appears in top-right corner of admin header
- [ ] Clicking button opens/closes dropdown menu
- [ ] Dropdown contains links to all admin sections with icons
- [ ] Clicking outside dropdown closes the menu
- [ ] Button has blue accent color to distinguish from other buttons
- [ ] Menu items have hover effects and proper spacing

### Code Changes
```typescript
// Add to AdminPage.tsx imports
import { Settings, Package, FolderOpen, ShoppingCart, Image, BarChart3 } from 'lucide-react';

// Add state
const [showQuickMenu, setShowQuickMenu] = useState(false);

// Add click outside handler
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (showQuickMenu) {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setShowQuickMenu(false);
      }
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showQuickMenu]);
```

---

## Task 2: Banner Carousel PC Optimization

**Priority**: High  
**Estimated Effort**: 3 hours  
**Dependencies**: None

### Description
Optimize banner carousel for desktop with fixed sizing and proper image scaling.

### Implementation Steps
1. **Update banner container layout**
   - Implement CSS Grid with fixed column sizes
   - Set main banner to 600px width, sides to 300px
   - Set consistent height of 400px for all banners

2. **Optimize image rendering**
   - Add explicit width/height styles to images
   - Use object-fit: cover for proper scaling
   - Center images with object-position: center

3. **Remove banner title overlays**
   - Remove title and description overlays from banner images
   - Keep overlays only for admin preview purposes
   - Clean up related CSS classes

4. **Improve responsive behavior**
   - Ensure mobile layout remains unchanged
   - Add proper breakpoints for tablet sizes
   - Test on various screen sizes

### Acceptance Criteria
- [ ] Desktop banners have fixed sizes (600px main, 300px sides)
- [ ] All banners maintain 400px height consistently
- [ ] Images scale properly without distortion
- [ ] Banner titles are removed from public view
- [ ] Layout remains responsive on mobile devices
- [ ] Images are centered and properly cropped

### Code Changes
```typescript
// Update renderBannerImage function
const renderBannerImage = (banner: Banner, className: string = "", isMain: boolean = false) => {
  return (
    <div className={`relative h-full overflow-hidden rounded-xl ${className}`}>
      <img
        src={banner.image}
        alt={banner.title}
        className="h-full w-full object-cover"
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          width: '100%',
          height: '100%'
        }}
        loading={isMain ? "eager" : "lazy"}
      />
      {/* Remove title overlays */}
    </div>
  );
};
```

---

## Task 3: Bundle Builder Stock Validation

**Priority**: High  
**Estimated Effort**: 2 hours  
**Dependencies**: None

### Description
Implement comprehensive stock validation to prevent adding out-of-stock products to bundles.

### Implementation Steps
1. **Update ProductCard component**
   - Add stock status checking in add-to-bundle handlers
   - Show "Недоступно" message for out-of-stock products
   - Disable add-to-bundle buttons for unavailable items

2. **Enhance visual indicators**
   - Add red background for unavailable product indicators
   - Update button styling based on availability
   - Show clear status messages

3. **Update ProductDetailPage**
   - Disable bundle addition in product detail view
   - Show appropriate error messages
   - Maintain consistent styling with product cards

4. **Add toast notifications**
   - Show error toast when trying to add unavailable products
   - Provide clear feedback to users
   - Use consistent error messaging

### Acceptance Criteria
- [ ] Out-of-stock products cannot be added to bundles
- [ ] Clear visual indicators show product availability
- [ ] Error messages appear when attempting to add unavailable items
- [ ] Product detail page respects stock status
- [ ] Consistent styling across all components
- [ ] Toast notifications provide user feedback

### Code Changes
```typescript
// Update add to bundle handler
const handleAddToBundle = () => {
  if (product.status !== 'in_stock') {
    toast.error('Товар недоступен для добавления в набор');
    return;
  }
  // Existing add to bundle logic
};

// Update button rendering
{showAddToBundle && product.type === 'product' && product.status === 'in_stock' && (
  <Button>В набор</Button>
)}

{showAddToBundle && product.type === 'product' && product.status !== 'in_stock' && (
  <div className="bg-red-100 border border-red-200 text-red-600">
    Недоступно
  </div>
)}
```

---

## Task 4: Swipe Back Gesture Enhancement

**Priority**: Medium  
**Estimated Effort**: 1.5 hours  
**Dependencies**: None

### Description
Improve swipe back gesture sensitivity and responsiveness for better mobile navigation.

### Implementation Steps
1. **Update useSwipeBack hook parameters**
   - Reduce threshold from 40px to 25px
   - Lower velocity requirement from 0.15 to 0.1
   - Increase detection zone from 80px to 120px

2. **Optimize response timing**
   - Reduce navigation delay from current to 50ms
   - Improve gesture detection accuracy
   - Enhance touch event handling

3. **Test gesture reliability**
   - Verify first-attempt success rate
   - Test on various mobile devices
   - Ensure no conflicts with scrolling

### Acceptance Criteria
- [ ] Swipe back works on first attempt consistently
- [ ] Lower threshold (25px) for faster response
- [ ] Expanded detection zone (120px from left edge)
- [ ] Reduced velocity requirement (0.1 px/ms)
- [ ] 50ms response delay for smooth navigation
- [ ] No interference with vertical scrolling

### Code Changes
```typescript
// Update useSwipeBack hook
const {
  enabled = true,
  threshold = 25,    // Reduced from 40
  velocity = 0.1,    // Reduced from 0.15
} = options;

// Update detection zone
if (touch.clientX < 120) { // Increased from 80
  // Initialize swipe tracking
}

// Update navigation timing
setTimeout(() => {
  navigate(-1);
}, 50); // Reduced delay
```

---

## Task 5: Color Scheme Diversification

**Priority**: Medium  
**Estimated Effort**: 2.5 hours  
**Dependencies**: None

### Description
Introduce color variety to reduce visual monotony while maintaining brand consistency.

### Implementation Steps
1. **Update ProductCard button colors**
   - Change mobile "В набор" buttons to purple
   - Change desktop "В набор" buttons to orange
   - Maintain lime green for primary actions

2. **Update ProductDetailPage colors**
   - Use purple for main action buttons
   - Use orange for secondary actions
   - Keep consistent color semantics

3. **Enhance AdminPage dashboard**
   - Add colorful cards (red, blue, orange, purple)
   - Use semantic colors for different data types
   - Maintain readability and accessibility

4. **Update admin management button**
   - Use blue accent for management button
   - Ensure proper contrast ratios
   - Test color combinations

### Acceptance Criteria
- [ ] Purple accents for premium/bundle features
- [ ] Orange accents for secondary actions
- [ ] Blue accents for admin/information elements
- [ ] Lime green preserved for primary branding
- [ ] Colorful admin dashboard cards
- [ ] WCAG AA color contrast compliance
- [ ] Consistent color semantics across components

### Code Changes
```typescript
// ProductCard mobile buttons
className="bg-purple-500 hover:bg-purple-600 text-white"

// ProductCard desktop buttons  
className="bg-orange-500/20 border-orange-300 hover:bg-orange-500"

// ProductDetailPage buttons
className="bg-purple-500 hover:bg-purple-600 text-white"

// Admin management button
className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"

// Admin dashboard cards
<Card className="border-l-4 border-l-blue-400 bg-blue-50/50">
<Card className="border-l-4 border-l-orange-400 bg-orange-50/50">
<Card className="border-l-4 border-l-purple-400 bg-purple-50/50">
```

---

## Task 6: Testing and Quality Assurance

**Priority**: Medium  
**Estimated Effort**: 2 hours  
**Dependencies**: Tasks 1-5

### Description
Comprehensive testing of all implemented features to ensure quality and reliability.

### Implementation Steps
1. **Component testing**
   - Test admin dropdown functionality
   - Verify banner carousel responsiveness
   - Check stock validation across components

2. **Mobile testing**
   - Test swipe gestures on various devices
   - Verify touch responsiveness
   - Check mobile layout integrity

3. **Cross-browser testing**
   - Test on Chrome, Firefox, Safari, Edge
   - Verify color rendering consistency
   - Check responsive behavior

4. **Accessibility testing**
   - Verify color contrast ratios
   - Test keyboard navigation
   - Check screen reader compatibility

### Acceptance Criteria
- [ ] All features work across target browsers
- [ ] Mobile gestures function reliably
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works properly
- [ ] No console errors or warnings
- [ ] Performance remains optimal

---

## Task 7: Documentation and Deployment

**Priority**: Low  
**Estimated Effort**: 1 hour  
**Dependencies**: Task 6

### Description
Update documentation and prepare for deployment.

### Implementation Steps
1. **Update component documentation**
   - Document new props and behaviors
   - Add usage examples
   - Update type definitions

2. **Create deployment checklist**
   - Verify build process
   - Check asset optimization
   - Prepare rollback plan

3. **Performance monitoring setup**
   - Add metrics for new features
   - Monitor gesture performance
   - Track user interactions

### Acceptance Criteria
- [ ] Component documentation updated
- [ ] Deployment checklist completed
- [ ] Performance monitoring configured
- [ ] Build process verified
- [ ] Rollback plan prepared

---

## Implementation Timeline

### Week 1
- **Day 1-2**: Tasks 1 & 2 (Admin button + Banner optimization)
- **Day 3**: Task 3 (Stock validation)
- **Day 4**: Task 4 (Swipe improvements)
- **Day 5**: Task 5 (Color diversification)

### Week 2
- **Day 1**: Task 6 (Testing)
- **Day 2**: Task 7 (Documentation & Deployment)
- **Day 3-5**: Buffer for fixes and refinements

## Risk Mitigation

### Technical Risks
- **Touch event conflicts**: Thorough testing on various devices
- **Color accessibility**: Use contrast checking tools
- **Performance impact**: Monitor bundle size and runtime performance

### User Experience Risks
- **Gesture sensitivity**: A/B test different threshold values
- **Color confusion**: Maintain semantic consistency
- **Admin workflow disruption**: Gradual rollout with feedback collection

## Success Metrics

### Quantitative
- Swipe back success rate > 95% on first attempt
- Color contrast ratio > 4.5:1 for all combinations
- Page load time impact < 50ms
- Zero accessibility violations

### Qualitative
- Improved admin workflow efficiency
- Better visual hierarchy and engagement
- Enhanced mobile navigation experience
- Consistent brand presentation across features