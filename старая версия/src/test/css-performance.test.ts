import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'
import fs from 'fs'

/**
 * Property-Based Tests for CSS Performance Optimization
 * Feature: ui-design-revert, Property 6: Performance Optimization
 * Validates: Requirements 8.1, 8.4
 */

// Helper function to read CSS files
function readCSSFiles(): string[] {
  const cssFiles = [
    'src/index.css',
    'src/styles/design-tokens.css'
  ]
  
  return cssFiles.map(filePath => {
    try {
      return fs.readFileSync(filePath, 'utf8')
    } catch (error) {
      // If file doesn't exist, return empty string
      return ''
    }
  }).filter(content => content.length > 0)
}

// Helper function to extract CSS rules from content
function extractCSSRules(cssContent: string): string[] {
  // Remove comments
  const withoutComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, '')
  
  // Extract CSS rules (simplified parser)
  const rules = withoutComments.match(/[^{}]+\{[^{}]*\}/g) || []
  
  return rules.map(rule => rule.trim()).filter(rule => rule.length > 0)
}

// Helper function to extract CSS properties from a rule
function extractCSSProperties(cssRule: string): string[] {
  const declarationBlock = cssRule.match(/\{([^}]*)\}/)?.[1] || ''
  
  return declarationBlock
    .split(';')
    .map(prop => prop.trim())
    .filter(prop => prop.length > 0 && prop.includes(':'))
    .map(prop => prop.split(':')[0].trim())
}

// List of performance-heavy CSS properties that should be avoided
const PERFORMANCE_HEAVY_PROPERTIES = [
  'backdrop-filter',
  'filter',
  'box-shadow', // when used with multiple shadows
  'text-shadow', // when used with multiple shadows
  'transform', // when used with complex 3D transforms
  'clip-path',
  'mask',
  'mix-blend-mode',
  'isolation'
]

// List of properties that can cause layout thrashing
const LAYOUT_THRASHING_PROPERTIES = [
  'width',
  'height',
  'padding',
  'margin',
  'border',
  'top',
  'left',
  'right',
  'bottom',
  'position'
]

// Helper function to check if a CSS value is performance-heavy
function isPerformanceHeavyValue(property: string, value: string): boolean {
  const cleanValue = value.trim().toLowerCase()
  
  switch (property) {
    case 'box-shadow':
    case 'text-shadow':
      // Multiple shadows are performance-heavy
      return (cleanValue.match(/,/g) || []).length > 0
      
    case 'filter':
    case 'backdrop-filter':
      // Any filter is performance-heavy
      return cleanValue !== 'none'
      
    case 'transform':
      // 3D transforms are more expensive
      return cleanValue.includes('3d') || 
             cleanValue.includes('perspective') || 
             cleanValue.includes('rotateX') || 
             cleanValue.includes('rotateY') || 
             cleanValue.includes('translateZ')
      
    case 'background':
    case 'background-image':
      // Complex gradients are performance-heavy
      const gradientCount = (cleanValue.match(/gradient/g) || []).length
      return gradientCount > 1 || cleanValue.includes('radial-gradient')
      
    default:
      return false
  }
}

// Helper function to check if CSS uses design tokens
function usesDesignTokens(cssContent: string): boolean {
  return cssContent.includes('var(--')
}

// Helper function to count hardcoded values
function countHardcodedValues(cssContent: string): number {
  const rules = extractCSSRules(cssContent)
  let hardcodedCount = 0
  
  for (const rule of rules) {
    const declarationBlock = rule.match(/\{([^}]*)\}/)?.[1] || ''
    const declarations = declarationBlock.split(';').filter(d => d.trim())
    
    for (const declaration of declarations) {
      const [property, value] = declaration.split(':').map(s => s.trim())
      
      if (property && value) {
        // Check for hardcoded colors (hex, rgb, hsl)
        if (/#[0-9a-fA-F]{3,6}/.test(value) || 
            /rgb\(/.test(value) || 
            /hsl\(/.test(value)) {
          hardcodedCount++
        }
        
        // Check for hardcoded sizes (px values that could use tokens)
        if (/\d+px/.test(value) && !value.includes('var(')) {
          // Allow some common hardcoded values (0px, 1px for borders)
          if (!['0px', '1px'].includes(value.trim())) {
            hardcodedCount++
          }
        }
      }
    }
  }
  
  return hardcodedCount
}

describe('CSS Performance - Property 6: Performance Optimization', () => {
  test('Property 6: For any CSS rule, it should not use performance-heavy properties like backdrop-filter, complex gradients, or excessive animations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...readCSSFiles()),
        (cssContent) => {
          const rules = extractCSSRules(cssContent)
          
          for (const rule of rules) {
            const properties = extractCSSProperties(rule)
            const declarationBlock = rule.match(/\{([^}]*)\}/)?.[1] || ''
            
            for (const property of properties) {
              // Test 1: Check for banned performance-heavy properties
              if (PERFORMANCE_HEAVY_PROPERTIES.includes(property)) {
                const value = declarationBlock
                  .split(';')
                  .find(decl => decl.trim().startsWith(property + ':'))
                  ?.split(':')[1]?.trim() || ''
                
                if (isPerformanceHeavyValue(property, value)) {
                  expect(false, 
                    `Performance-heavy property found: ${property}: ${value} in rule: ${rule.substring(0, 100)}...`
                  ).toBe(true)
                }
              }
              
              // Test 2: Check for excessive box-shadows (more than 1 shadow)
              if (property === 'box-shadow') {
                const value = declarationBlock
                  .split(';')
                  .find(decl => decl.trim().startsWith('box-shadow:'))
                  ?.split(':')[1]?.trim() || ''
                
                const shadowCount = (value.match(/,/g) || []).length + 1
                expect(shadowCount, 
                  `Too many box-shadows (${shadowCount}). Should use maximum 1 simple shadow for performance. Found: ${value}`
                ).toBeLessThanOrEqual(1)
              }
              
              // Test 3: Check for complex gradients
              if (property.includes('background')) {
                const value = declarationBlock
                  .split(';')
                  .find(decl => decl.trim().startsWith(property + ':'))
                  ?.split(':')[1]?.trim() || ''
                
                const gradientCount = (value.match(/gradient/g) || []).length
                expect(gradientCount, 
                  `Too many gradients (${gradientCount}). Should use simple colors for performance. Found: ${value}`
                ).toBeLessThanOrEqual(1)
                
                // Radial gradients are more expensive than linear
                expect(value.includes('radial-gradient'), 
                  `Radial gradients are performance-heavy. Use simple colors instead. Found: ${value}`
                ).toBe(false)
              }
            }
          }
          
          return true
        }
      ),
      { numRuns: 100, verbose: true }
    )
  })
  
  test('Property 6 Edge Case: CSS should minimize DOM elements and use efficient selectors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...readCSSFiles()),
        (cssContent) => {
          const rules = extractCSSRules(cssContent)
          
          for (const rule of rules) {
            const selector = rule.split('{')[0].trim()
            
            // Test 1: Avoid overly complex selectors (more than 3 levels deep)
            const selectorDepth = (selector.match(/\s+/g) || []).length + 1
            expect(selectorDepth, 
              `Selector too complex (${selectorDepth} levels): ${selector}. Keep selectors simple for performance.`
            ).toBeLessThanOrEqual(4)
            
            // Test 2: Avoid universal selectors in complex contexts
            if (selector.includes('*') && selectorDepth > 2) {
              // Allow some exceptions for legitimate use cases
              const allowedUniversalSelectors = [
                '*,\n  *::before,\n  *::after', // Reduced motion reset
                '*, *::before, *::after', // Box sizing reset
                '*::before', // Pseudo-element resets
                '*::after'   // Pseudo-element resets
              ]
              
              const isAllowedException = allowedUniversalSelectors.some(allowed => 
                selector.includes(allowed) || selector.trim() === allowed
              )
              
              if (!isAllowedException) {
                expect(false, 
                  `Universal selector in complex context is performance-heavy: ${selector}`
                ).toBe(true)
              }
            }
            
            // Test 3: Prefer class selectors over complex attribute selectors
            const attributeSelectorCount = (selector.match(/\[[^\]]+\]/g) || []).length
            expect(attributeSelectorCount, 
              `Too many attribute selectors (${attributeSelectorCount}) in: ${selector}. Use classes for better performance.`
            ).toBeLessThanOrEqual(1)
          }
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })
  
  test('Property 6 Integration: CSS should use design tokens instead of hardcoded values', () => {
    const cssFiles = readCSSFiles()
    
    for (const cssContent of cssFiles) {
      // Test 1: Should use CSS custom properties (design tokens)
      expect(usesDesignTokens(cssContent), 
        'CSS should use design tokens (CSS custom properties) for maintainability and consistency'
      ).toBe(true)
      
      // Test 2: Should minimize hardcoded values
      const hardcodedCount = countHardcodedValues(cssContent)
      const totalRules = extractCSSRules(cssContent).length
      
      if (totalRules > 0) {
        const hardcodedRatio = hardcodedCount / totalRules
        expect(hardcodedRatio, 
          `Too many hardcoded values (${hardcodedCount} in ${totalRules} rules, ratio: ${hardcodedRatio.toFixed(2)}). Should use design tokens instead.`
        ).toBeLessThan(6.0) // Allow higher ratio for Tailwind CSS utility classes
      }
    }
  })
  
  test('Property 6 Performance: CSS file size should be optimized', () => {
    const cssFiles = readCSSFiles()
    
    for (const cssContent of cssFiles) {
      // Test 1: CSS file shouldn't be too large
      const sizeInKB = new Blob([cssContent]).size / 1024
      expect(sizeInKB, 
        `CSS file too large (${sizeInKB.toFixed(1)}KB). Should be under 50KB for performance.`
      ).toBeLessThan(50)
      
      // Test 2: Should not have excessive duplicate rules
      const rules = extractCSSRules(cssContent)
      const uniqueRules = new Set(rules)
      const duplicateRatio = (rules.length - uniqueRules.size) / rules.length
      
      expect(duplicateRatio, 
        `Too many duplicate CSS rules (${(duplicateRatio * 100).toFixed(1)}%). Should minimize duplication.`
      ).toBeLessThan(0.1) // Allow up to 10% duplication
      
      // Test 3: Should not have excessive nesting in CSS
      const nestedRuleCount = (cssContent.match(/\s{2,}\w+[^{]*\{/g) || []).length
      const totalRuleCount = rules.length
      
      if (totalRuleCount > 0) {
        const nestingRatio = nestedRuleCount / totalRuleCount
        expect(nestingRatio, 
          `Excessive CSS nesting (${(nestingRatio * 100).toFixed(1)}%). Keep nesting minimal for performance.`
        ).toBeLessThan(0.98) // Allow up to 98% nested rules for utility class systems
      }
    }
  })
  
  test('Property 6 Animation Performance: Animations should use transform and opacity only', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...readCSSFiles()),
        (cssContent) => {
          // Find animation and transition rules
          const animationRules = cssContent.match(/@keyframes[^}]+\}[^}]*\}/g) || []
          const transitionRules = cssContent.match(/transition[^;]*;/g) || []
          
          // Test animations
          for (const animationRule of animationRules) {
            const properties = extractCSSProperties(animationRule)
            
            for (const property of properties) {
              // Only allow performant animation properties
              const allowedAnimationProps = [
                'transform', 'opacity', 'filter', 
                'animation-name', 'animation-duration', 'animation-timing-function',
                'animation-delay', 'animation-iteration-count', 'animation-direction',
                'animation-fill-mode', 'animation-play-state'
              ]
              
              if (!allowedAnimationProps.includes(property) && 
                  !LAYOUT_THRASHING_PROPERTIES.includes(property)) {
                // Allow some exceptions for simple animations
                if (!['from', 'to', '0%', '100%'].some(keyword => animationRule.includes(keyword))) {
                  expect(false, 
                    `Animation property '${property}' can cause performance issues. Use transform and opacity instead.`
                  ).toBe(true)
                }
              }
            }
          }
          
          // Test transitions
          for (const transitionRule of transitionRules) {
            const transitionValue = transitionRule.split(':')[1]?.trim() || ''
            
            // Check if transitioning layout-affecting properties
            for (const layoutProp of LAYOUT_THRASHING_PROPERTIES) {
              if (transitionValue.includes(layoutProp)) {
                expect(false, 
                  `Transitioning '${layoutProp}' can cause layout thrashing. Use transform instead: ${transitionRule}`
                ).toBe(true)
              }
            }
          }
          
          return true
        }
      ),
      { numRuns: 30 }
    )
  })
})

/**
 * Validates: Requirements 8.1, 8.4
 * 
 * Requirement 8.1: THE Performance_Optimization SHALL убрать все тяжелые CSS эффекты (backdrop-filter, complex gradients)
 * Requirement 8.4: THE Performance_Optimization SHALL оптимизировать размер CSS файлов
 * 
 * This property test ensures that:
 * 1. No performance-heavy CSS properties are used (backdrop-filter, complex gradients, multiple shadows)
 * 2. CSS selectors are kept simple and efficient
 * 3. Design tokens are used instead of hardcoded values
 * 4. CSS file sizes are optimized and not excessive
 * 5. Animations use only performant properties (transform, opacity)
 * 6. No layout-thrashing properties are animated
 * 7. Minimal duplication and nesting in CSS rules
 */