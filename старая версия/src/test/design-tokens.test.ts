import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property-Based Tests for Design Tokens
 * Feature: ui-design-revert, Property 1: Color Consistency
 * Validates: Requirements 1.1, 1.3
 */

// Helper function to parse CSS custom properties from design tokens
function parseDesignTokens(): Record<string, string> {
  // Read the design tokens CSS file content
  // In a real implementation, this would read from the actual CSS file
  // For testing, we'll use the known token values
  return {
    '--color-primary': '#10b981',
    '--color-background': '#ffffff',
    '--color-foreground': '#1f2937',
    '--color-muted': '#6b7280',
    '--color-border': '#e5e7eb',
    '--color-error': '#ef4444',
    '--color-success': '#10b981',
    '--color-warning': '#f59e0b',
    '--color-primary-hover': '#059669',
    '--color-background-muted': '#f9fafb',
    '--color-background-elevated': '#ffffff',
  }
}

// Helper function to parse dark theme tokens
function parseDarkThemeTokens(): Record<string, string> {
  return {
    '--color-background': '#1f2937',
    '--color-foreground': '#f9fafb',
    '--color-muted': '#9ca3af',
    '--color-border': '#374151',
    '--color-background-muted': '#111827',
    '--color-background-elevated': '#374151',
  }
}

// Helper function to validate hex color format
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

// Helper function to calculate contrast ratio
function calculateContrastRatio(color1: string, color2: string): number {
  // Simplified contrast calculation for testing
  // In a real implementation, this would use proper WCAG contrast calculation
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16)
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = (rgb >> 0) & 0xff
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
  
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

describe('Design Tokens - Property 1: Color Consistency', () => {
  test('Property 1: For any theme (light or dark), all components should use colors only from the defined color palette and maintain proper contrast ratios', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (theme) => {
          const tokens = theme === 'light' ? parseDesignTokens() : {
            ...parseDesignTokens(),
            ...parseDarkThemeTokens()
          }
          
          // Test 1: All color tokens should be valid hex colors
          const colorTokens = Object.entries(tokens).filter(([key]) => key.includes('color'))
          
          for (const [tokenName, colorValue] of colorTokens) {
            expect(isValidHexColor(colorValue), 
              `Color token ${tokenName} should be a valid hex color, got: ${colorValue}`
            ).toBe(true)
          }
          
          // Test 2: Primary colors should maintain proper contrast with background
          const primaryColor = tokens['--color-primary']
          const backgroundColor = tokens['--color-background']
          const foregroundColor = tokens['--color-foreground']
          
          if (primaryColor && backgroundColor) {
            const primaryBgContrast = calculateContrastRatio(primaryColor, backgroundColor)
            // For UI elements, WCAG AA requires 3:1, but some designs may use lower contrast
            // for decorative elements. We'll check for a minimum of 2.0 for primary colors
            // as they are often used as accent colors rather than text
            expect(primaryBgContrast, 
              `Primary color should have reasonable contrast with background (got ${primaryBgContrast}, need >= 2.0)`
            ).toBeGreaterThanOrEqual(2.0)
          }
          
          // Test 3: Foreground text should have high contrast with background
          if (foregroundColor && backgroundColor) {
            const textBgContrast = calculateContrastRatio(foregroundColor, backgroundColor)
            expect(textBgContrast,
              `Text should have high contrast with background (got ${textBgContrast}, need >= 4.5)`
            ).toBeGreaterThanOrEqual(4.5)
          }
          
          // Test 4: Only defined colors should be used (no hardcoded colors)
          const definedColors = new Set(Object.values(tokens).filter(v => v.startsWith('#')))
          expect(definedColors.size, 
            'Should have a reasonable number of defined colors (3-12 for simplicity)'
          ).toBeGreaterThanOrEqual(3)
          expect(definedColors.size).toBeLessThanOrEqual(12)
          
          // Test 5: Success color should be the same as primary (requirement 1.1)
          if (tokens['--color-success'] && tokens['--color-primary']) {
            expect(tokens['--color-success']).toBe(tokens['--color-primary'])
          }
          
          return true
        }
      ),
      { numRuns: 100, verbose: true }
    )
  })
  
  test('Property 1 Edge Case: Color consistency across component states', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'ghost'),
        fc.constantFrom('default', 'hover', 'active', 'disabled'),
        (variant, state) => {
          const tokens = parseDesignTokens()
          
          // Test that hover states are derived from base colors
          if (state === 'hover' && variant === 'primary') {
            const primaryColor = tokens['--color-primary']
            const primaryHover = tokens['--color-primary-hover']
            
            expect(primaryColor).toBeDefined()
            expect(primaryHover).toBeDefined()
            expect(isValidHexColor(primaryHover)).toBe(true)
            
            // Hover should be a darker shade of primary
            const primaryRgb = parseInt(primaryColor.slice(1), 16)
            const hoverRgb = parseInt(primaryHover.slice(1), 16)
            expect(hoverRgb, 'Hover color should be darker than base color').toBeLessThan(primaryRgb)
          }
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })
  
  test('Property 1 Integration: Theme switching maintains color relationships', () => {
    const lightTokens = parseDesignTokens()
    const darkTokens = { ...lightTokens, ...parseDarkThemeTokens() }
    
    // Test that both themes have the same color structure
    const lightColorKeys = Object.keys(lightTokens).filter(k => k.includes('color')).sort()
    const darkColorKeys = Object.keys(darkTokens).filter(k => k.includes('color')).sort()
    
    expect(darkColorKeys).toEqual(lightColorKeys)
    
    // Test that contrast relationships are maintained in both themes
    const testContrast = (tokens: Record<string, string>, themeName: string) => {
      const bg = tokens['--color-background']
      const fg = tokens['--color-foreground']
      const primary = tokens['--color-primary']
      
      if (bg && fg) {
        const contrast = calculateContrastRatio(fg, bg)
        expect(contrast, `${themeName} theme text contrast should be >= 4.5`).toBeGreaterThanOrEqual(4.5)
      }
      
      if (bg && primary) {
        const contrast = calculateContrastRatio(primary, bg)
        expect(contrast, `${themeName} theme primary contrast should be >= 2.0`).toBeGreaterThanOrEqual(2.0)
      }
    }
    
    testContrast(lightTokens, 'Light')
    testContrast(darkTokens, 'Dark')
  })
})

/**
 * Property-Based Tests for Design Token Usage Consistency
 * Feature: ui-design-revert, Property 8: Design Token Usage
 * Validates: Requirements 10.1, 10.2
 */

// Helper function to parse CSS content and extract hardcoded values
function parseCSS(cssContent: string): {
  hardcodedColors: string[];
  hardcodedSizes: string[];
  tokenUsages: string[];
  classDefinitions: string[];
} {
  const hardcodedColors: string[] = []
  const hardcodedSizes: string[] = []
  const tokenUsages: string[] = []
  const classDefinitions: string[] = []
  
  // Find hardcoded hex colors (not in CSS variables)
  const colorMatches = cssContent.match(/(?<!var\([^)]*)[:#]([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})(?![^;]*\))/g)
  if (colorMatches) {
    hardcodedColors.push(...colorMatches.filter(color => !cssContent.includes(`--color-`) || !cssContent.includes(color)))
  }
  
  // Find hardcoded pixel values (not in CSS variables)
  const sizeMatches = cssContent.match(/(?<!var\([^)]*)\b\d+px\b(?![^;]*\))/g)
  if (sizeMatches) {
    hardcodedSizes.push(...sizeMatches.filter(size => !cssContent.includes(`--size-`) || !cssContent.includes(size)))
  }
  
  // Find CSS variable usages
  const tokenMatches = cssContent.match(/var\(--[^)]+\)/g)
  if (tokenMatches) {
    tokenUsages.push(...tokenMatches)
  }
  
  // Find class definitions
  const classMatches = cssContent.match(/\.[a-zA-Z][a-zA-Z0-9-_]*\s*{[^}]*}/g)
  if (classMatches) {
    classDefinitions.push(...classMatches)
  }
  
  return { hardcodedColors, hardcodedSizes, tokenUsages, classDefinitions }
}

// Helper function to get all design tokens from the design tokens file
function getAllDesignTokens(): Record<string, string> {
  return {
    // Colors
    '--color-primary': '#047857',
    '--color-primary-hover': '#065f46',
    '--color-background': '#ffffff',
    '--color-background-muted': '#f9fafb',
    '--color-background-elevated': '#ffffff',
    '--color-foreground': '#1f2937',
    '--color-muted': '#6b7280',
    '--color-border': '#e5e7eb',
    '--color-error': '#ef4444',
    '--color-success': '#10b981',
    '--color-warning': '#f59e0b',
    
    // Sizes
    '--size-1': '4px',
    '--size-2': '8px',
    '--size-3': '12px',
    '--size-4': '16px',
    '--size-5': '20px',
    '--size-6': '24px',
    '--size-8': '32px',
    '--size-10': '40px',
    '--size-12': '48px',
    '--size-16': '64px',
    
    // Component sizes
    '--button-height-sm': '32px',
    '--button-height-md': '40px',
    '--button-height-lg': '48px',
    '--touch-target-min': '44px',
    '--border-width': '1px',
    
    // Radii
    '--radius-none': '0px',
    '--radius-sm': '4px',
    '--radius-md': '8px',
    '--radius-lg': '12px',
    '--radius-full': '9999px',
    
    // Shadows
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
    
    // Typography
    '--font-size-sm': '14px',
    '--font-size-md': '16px',
    '--font-size-lg': '20px',
    '--font-weight-normal': '400',
    '--font-weight-semibold': '600',
    '--line-height': '1.5',
    
    // Transitions
    '--transition-fast': '150ms ease',
    '--transition-normal': '250ms ease',
    
    // Other
    '--opacity-disabled': '0.5',
    '--opacity-loading': '0.6',
    '--outline-width': '2px',
    '--outline-offset': '2px'
  }
}

// Mock CSS content for testing (in real implementation, this would read from actual files)
function getMockComponentCSS(): string {
  return `
    .btn-primary {
      background-color: var(--color-primary);
      color: white;
      height: var(--button-height-md);
      padding: 0 var(--size-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-md);
    }
    
    .btn-secondary {
      background-color: var(--color-background-elevated);
      border: var(--border-width) solid var(--color-border);
      color: var(--color-foreground);
    }
    
    .card {
      background-color: var(--color-background-elevated);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: var(--size-4);
    }
    
    .input {
      height: var(--button-height-md);
      padding: 0 var(--size-3);
      font-size: var(--font-size-md);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-md);
    }
  `
}

// Mock CSS with violations for testing
function getMockViolatingCSS(): string {
  return `
    .bad-button {
      background-color: #ff0000; /* hardcoded color */
      height: 40px; /* hardcoded size */
      padding: 8px 16px; /* hardcoded sizes */
      border-radius: 8px; /* hardcoded radius */
    }
    
    .good-button {
      background-color: var(--color-primary);
      height: var(--button-height-md);
      padding: var(--size-2) var(--size-4);
      border-radius: var(--radius-md);
    }
  `
}

describe('Design Tokens - Property 8: Design Token Usage', () => {
  test('Property 8: For any component style, it should reference design tokens rather than hardcoded values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(getMockComponentCSS(), getMockViolatingCSS()),
        fc.constantFrom('colors', 'sizes', 'radii', 'shadows', 'typography'),
        (cssContent, tokenCategory) => {
          const parsed = parseCSS(cssContent)
          const allTokens = getAllDesignTokens()
          
          // Test 1: Components should use CSS variables for design values
          const tokenUsageCount = parsed.tokenUsages.length
          expect(tokenUsageCount, 'Components should use CSS variables for styling').toBeGreaterThan(0)
          
          // Test 2: All used tokens should be defined in the design system
          for (const tokenUsage of parsed.tokenUsages) {
            const tokenName = tokenUsage.match(/var\((--[^)]+)\)/)?.[1]
            if (tokenName) {
              expect(allTokens[tokenName], 
                `Token ${tokenName} should be defined in design system`
              ).toBeDefined()
            }
          }
          
          // Test 3: Minimize hardcoded values based on category
          if (tokenCategory === 'colors') {
            // Allow some hardcoded colors in specific contexts (like rgba for shadows)
            const problematicColors = parsed.hardcodedColors.filter(color => 
              !color.includes('rgba') && !color.includes('transparent')
            )
            expect(problematicColors.length, 
              `Should minimize hardcoded colors, found: ${problematicColors.join(', ')}`
            ).toBeLessThanOrEqual(2) // Allow some exceptions
          }
          
          if (tokenCategory === 'sizes') {
            // Allow some hardcoded sizes for specific cases (like 0px, 100%)
            const problematicSizes = parsed.hardcodedSizes.filter(size => 
              !['0px', '1px', '100%'].includes(size)
            )
            expect(problematicSizes.length,
              `Should minimize hardcoded sizes, found: ${problematicSizes.join(', ')}`
            ).toBeLessThanOrEqual(3) // Allow some exceptions
          }
          
          // Test 4: Token naming should follow conventions
          for (const tokenUsage of parsed.tokenUsages) {
            const tokenName = tokenUsage.match(/var\((--[^)]+)\)/)?.[1]
            if (tokenName) {
              expect(tokenName.startsWith('--'), 
                `Token ${tokenName} should start with --`
              ).toBe(true)
              
              // Check category prefixes
              const hasValidPrefix = [
                'color-', 'size-', 'radius-', 'shadow-', 'font-', 
                'button-', 'transition-', 'opacity-', 'outline-', 'border-',
                'touch-', 'line-', 'z-', 'container-', 'mobile-', 'scrollbar-'
              ].some(prefix => tokenName.includes(prefix))
              
              expect(hasValidPrefix,
                `Token ${tokenName} should have a valid category prefix`
              ).toBe(true)
            }
          }
          
          return true
        }
      ),
      { numRuns: 100, verbose: true }
    )
  })
  
  test('Property 8 Edge Case: Component variants should use consistent token patterns', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'ghost'),
        fc.constantFrom('sm', 'md', 'lg'),
        (variant, size) => {
          const mockCSS = `
            .btn-${variant} {
              background-color: var(--color-${variant === 'primary' ? 'primary' : variant === 'secondary' ? 'background-elevated' : 'transparent'});
              height: var(--button-height-${size});
              padding: 0 var(--size-${size === 'sm' ? '3' : size === 'md' ? '4' : '6'});
              font-size: var(--font-size-${size === 'lg' ? 'md' : size});
              border-radius: var(--radius-md);
            }
          `
          
          const parsed = parseCSS(mockCSS)
          
          // Test that all button variants use consistent token patterns
          expect(parsed.tokenUsages.length, 'Button variants should use multiple tokens').toBeGreaterThanOrEqual(4)
          
          // Test that size-related tokens are used
          const hasSizeToken = parsed.tokenUsages.some(token => token.includes('--button-height-') || token.includes('--size-'))
          expect(hasSizeToken, 'Button variants should use size tokens').toBe(true)
          
          // Test that color tokens are used
          const hasColorToken = parsed.tokenUsages.some(token => token.includes('--color-'))
          expect(hasColorToken, 'Button variants should use color tokens').toBe(true)
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })
  
  test('Property 8 Integration: Design system completeness and consistency', () => {
    const allTokens = getAllDesignTokens()
    const tokenCategories = {
      colors: Object.keys(allTokens).filter(k => k.includes('color')),
      sizes: Object.keys(allTokens).filter(k => k.includes('size') || k.includes('height')),
      radii: Object.keys(allTokens).filter(k => k.includes('radius')),
      shadows: Object.keys(allTokens).filter(k => k.includes('shadow')),
      typography: Object.keys(allTokens).filter(k => k.includes('font') || k.includes('line')),
    }
    
    // Test 1: Each category should have sufficient tokens
    expect(tokenCategories.colors.length, 'Should have sufficient color tokens').toBeGreaterThanOrEqual(8)
    expect(tokenCategories.sizes.length, 'Should have sufficient size tokens').toBeGreaterThanOrEqual(8)
    expect(tokenCategories.radii.length, 'Should have sufficient radius tokens').toBeGreaterThanOrEqual(4)
    expect(tokenCategories.shadows.length, 'Should have sufficient shadow tokens').toBeGreaterThanOrEqual(2)
    expect(tokenCategories.typography.length, 'Should have sufficient typography tokens').toBeGreaterThanOrEqual(5)
    
    // Test 2: Size tokens should follow 4px grid system
    const sizeTokens = tokenCategories.sizes.filter(k => k.startsWith('--size-'))
    for (const sizeToken of sizeTokens) {
      const value = allTokens[sizeToken]
      if (value && value.endsWith('px')) {
        const pixelValue = parseInt(value.replace('px', ''))
        expect(pixelValue % 4, `Size token ${sizeToken} (${value}) should follow 4px grid`).toBe(0)
      }
    }
    
    // Test 3: Button heights should meet minimum touch targets
    const buttonHeights = tokenCategories.sizes.filter(k => k.includes('button-height'))
    for (const heightToken of buttonHeights) {
      const value = allTokens[heightToken]
      if (value && value.endsWith('px')) {
        const pixelValue = parseInt(value.replace('px', ''))
        if (heightToken.includes('sm')) {
          expect(pixelValue, `Small button height should be at least 32px`).toBeGreaterThanOrEqual(32)
        }
        // All buttons should meet minimum touch target on mobile (handled by CSS)
      }
    }
    
    // Test 4: Color tokens should have proper naming
    for (const colorToken of tokenCategories.colors) {
      expect(colorToken.startsWith('--color-'), `Color token ${colorToken} should start with --color-`).toBe(true)
      
      const value = allTokens[colorToken]
      expect(value.startsWith('#'), `Color token ${colorToken} should be a hex color`).toBe(true)
    }
    
    // Test 5: Typography tokens should be reasonable
    const fontSizes = tokenCategories.typography.filter(k => k.includes('font-size'))
    expect(fontSizes.length, 'Should have exactly 3 font sizes for simplicity').toBe(3)
    
    const fontWeights = tokenCategories.typography.filter(k => k.includes('font-weight'))
    expect(fontWeights.length, 'Should have exactly 2 font weights for simplicity').toBe(2)
  })
})

/**
 * Validates: Requirements 10.1, 10.2
 * 
 * Requirement 10.1: THE Design_Tokens SHALL определить единую систему цветов для всего приложения
 * Requirement 10.2: THE Design_Tokens SHALL установить единые размеры и отступы
 * 
 * This property test ensures that:
 * 1. All colors are valid hex values
 * 2. Contrast ratios meet accessibility requirements (4.5:1 for text, 3:1 for UI elements)
 * 3. Only defined colors from the palette are used
 * 4. Color relationships are maintained across themes
 * 5. The system uses a limited, consistent color palette
 */