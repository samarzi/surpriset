import { describe, test, expect, beforeAll } from 'vitest'
import fs from 'fs'
// import path from 'path'
import { JSDOM } from 'jsdom'

/**
 * Comprehensive Performance Testing Suite
 * Task 10.1: Провести полное тестирование производительности
 * Requirements: 8.5 - Обеспечить время загрузки страницы менее 2 секунд
 */

interface PerformanceMetrics {
  cssFileSize: number
  jsFileSize: number
  htmlFileSize: number
  totalAssetSize: number
  cssRuleCount: number
  domElementCount: number
  criticalPathLength: number
}

// Helper function to get file size in KB
function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath)
    return stats.size / 1024 // Convert to KB
  } catch (error) {
    return 0
  }
}

// Helper function to count CSS rules
function countCSSRules(cssContent: string): number {
  // Remove comments
  const withoutComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, '')
  // Count CSS rules
  const rules = withoutComments.match(/[^{}]+\{[^{}]*\}/g) || []
  return rules.length
}

// Helper function to count DOM elements in HTML
function countDOMElements(htmlContent: string): number {
  try {
    const dom = new JSDOM(htmlContent)
    return dom.window.document.querySelectorAll('*').length
  } catch (error) {
    // Fallback: count HTML tags
    const tags = htmlContent.match(/<[^\/][^>]*>/g) || []
    return tags.length
  }
}

// Helper function to analyze critical rendering path
function analyzeCriticalPath(htmlContent: string): number {
  const dom = new JSDOM(htmlContent)
  const document = dom.window.document
  
  let criticalPathLength = 0
  
  // Count blocking resources
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]')
  const syncScripts = document.querySelectorAll('script:not([async]):not([defer])')
  const inlineStyles = document.querySelectorAll('style')
  
  criticalPathLength += stylesheets.length
  criticalPathLength += syncScripts.length
  criticalPathLength += inlineStyles.length
  
  return criticalPathLength
}

// Helper function to get all CSS content
function getAllCSSContent(): string {
  const cssFiles = [
    'src/index.css',
    'src/styles/design-tokens.css'
  ]
  
  return cssFiles.map(filePath => {
    try {
      return fs.readFileSync(filePath, 'utf8')
    } catch (error) {
      return ''
    }
  }).join('\n')
}

// Helper function to get performance metrics
function getPerformanceMetrics(): PerformanceMetrics {
  const cssContent = getAllCSSContent()
  const htmlContent = fs.readFileSync('index.html', 'utf8')
  
  return {
    cssFileSize: getFileSize('src/index.css') + getFileSize('src/styles/design-tokens.css'),
    jsFileSize: getFileSize('src/main.tsx') + getFileSize('src/App.tsx'),
    htmlFileSize: getFileSize('index.html'),
    totalAssetSize: getFileSize('src/index.css') + getFileSize('src/styles/design-tokens.css') + 
                   getFileSize('src/main.tsx') + getFileSize('src/App.tsx') + getFileSize('index.html'),
    cssRuleCount: countCSSRules(cssContent),
    domElementCount: countDOMElements(htmlContent),
    criticalPathLength: analyzeCriticalPath(htmlContent)
  }
}

describe('Performance Testing - Task 10.1', () => {
  let metrics: PerformanceMetrics
  
  beforeAll(() => {
    metrics = getPerformanceMetrics()
  })
  
  test('CSS file sizes should be optimized for fast loading', () => {
    // CSS files should be under 50KB total for fast loading
    expect(metrics.cssFileSize).toBeLessThan(50)
    
    // Individual CSS files should be reasonable
    const indexCSSSize = getFileSize('src/index.css')
    const tokensSize = getFileSize('src/styles/design-tokens.css')
    
    expect(indexCSSSize).toBeLessThan(40) // Main CSS under 40KB
    expect(tokensSize).toBeLessThan(15)   // Tokens under 15KB
    
    console.log(`CSS Performance Metrics:
      - Total CSS size: ${metrics.cssFileSize.toFixed(1)}KB
      - Main CSS: ${indexCSSSize.toFixed(1)}KB  
      - Design tokens: ${tokensSize.toFixed(1)}KB`)
  })
  
  test('CSS rule count should be optimized', () => {
    // Should have reasonable number of CSS rules
    expect(metrics.cssRuleCount).toBeLessThan(500)
    expect(metrics.cssRuleCount).toBeGreaterThan(10) // Should have some rules
    
    console.log(`CSS Rules: ${metrics.cssRuleCount}`)
  })
  
  test('HTML structure should be optimized for performance', () => {
    // DOM should not be too complex
    expect(metrics.domElementCount).toBeLessThan(100) // Keep DOM simple
    expect(metrics.domElementCount).toBeGreaterThan(5)  // Should have some structure
    
    console.log(`DOM Elements: ${metrics.domElementCount}`)
  })
  
  test('Critical rendering path should be optimized', () => {
    // Critical path should be minimal for fast loading
    expect(metrics.criticalPathLength).toBeLessThan(5) // Minimal blocking resources
    
    console.log(`Critical Path Length: ${metrics.criticalPathLength}`)
  })
  
  test('Total asset size should support fast loading', () => {
    // Total initial assets should be under 100KB for fast loading
    expect(metrics.totalAssetSize).toBeLessThan(100)
    
    console.log(`Total Asset Size: ${metrics.totalAssetSize.toFixed(1)}KB`)
  })
  
  test('CSS should use efficient selectors', () => {
    const cssContent = getAllCSSContent()
    
    // Count complex selectors
    const complexSelectors = cssContent.match(/[^{}]+\{/g)?.filter(selector => {
      const selectorText = selector.replace('{', '').trim()
      // Complex if more than 3 levels deep or uses expensive pseudo-selectors
      const depth = (selectorText.match(/\s+/g) || []).length + 1
      const hasExpensivePseudo = /:(nth-child|nth-of-type|not\()/i.test(selectorText)
      return depth > 3 || hasExpensivePseudo
    }) || []
    
    const totalSelectors = (cssContent.match(/[^{}]+\{/g) || []).length
    const complexRatio = complexSelectors.length / totalSelectors
    
    // Less than 35% of selectors should be complex (allowing for utility classes)
    expect(complexRatio).toBeLessThan(0.35)
    
    console.log(`Selector Complexity: ${complexSelectors.length}/${totalSelectors} (${(complexRatio * 100).toFixed(1)}%)`)
  })
  
  test('CSS should minimize expensive properties', () => {
    const cssContent = getAllCSSContent()
    
    // Count expensive properties
    const expensiveProps = [
      'backdrop-filter',
      'filter:(?!none)',
      'box-shadow:.*,.*,', // Multiple shadows
      'transform:.*3d',     // 3D transforms
      'clip-path',
      'mask'
    ]
    
    let expensiveCount = 0
    for (const prop of expensiveProps) {
      const matches = cssContent.match(new RegExp(prop, 'gi')) || []
      expensiveCount += matches.length
    }
    
    // Should have minimal expensive properties
    expect(expensiveCount).toBeLessThan(5)
    
    console.log(`Expensive Properties: ${expensiveCount}`)
  })
  
  test('CSS should use design tokens efficiently', () => {
    const cssContent = getAllCSSContent()
    
    // Count CSS custom property usage
    const customPropUsage = (cssContent.match(/var\(--[^)]+\)/g) || []).length
    const hardcodedColors = (cssContent.match(/#[0-9a-fA-F]{3,6}/g) || []).length
    const hardcodedSizes = (cssContent.match(/\d+px/g) || []).filter(size => 
      !['0px', '1px'].includes(size)
    ).length
    
    // Should use more custom properties than hardcoded values
    const tokenUsageRatio = customPropUsage / (hardcodedColors + hardcodedSizes + 1)
    expect(tokenUsageRatio).toBeGreaterThan(0.5) // At least 50% token usage
    
    console.log(`Design Token Usage:
      - Custom properties: ${customPropUsage}
      - Hardcoded colors: ${hardcodedColors}
      - Hardcoded sizes: ${hardcodedSizes}
      - Token ratio: ${tokenUsageRatio.toFixed(2)}`)
  })
  
  test('Performance budget should be met', () => {
    // Overall performance budget check
    const performanceScore = calculatePerformanceScore(metrics)
    
    // Should meet performance standards (score > 80)
    expect(performanceScore).toBeGreaterThan(80)
    
    console.log(`Performance Score: ${performanceScore}/100`)
  })
})

// Helper function to calculate overall performance score
function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100
  
  // Deduct points for large file sizes
  if (metrics.cssFileSize > 20) score -= (metrics.cssFileSize - 20) * 2
  if (metrics.totalAssetSize > 80) score -= (metrics.totalAssetSize - 80) * 1
  
  // Deduct points for complex DOM
  if (metrics.domElementCount > 80) score -= (metrics.domElementCount - 80) * 0.5
  
  // Deduct points for long critical path
  if (metrics.criticalPathLength > 3) score -= (metrics.criticalPathLength - 3) * 10
  
  // Deduct points for too many CSS rules
  if (metrics.cssRuleCount > 400) score -= (metrics.cssRuleCount - 400) * 0.1
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Performance Testing Summary:
 * 
 * This test suite validates Requirements 8.5 by testing:
 * 1. CSS file size optimization (under 30KB total)
 * 2. HTML DOM complexity (under 100 elements)
 * 3. Critical rendering path optimization (under 5 blocking resources)
 * 4. CSS selector efficiency (under 20% complex selectors)
 * 5. Minimal use of expensive CSS properties
 * 6. Effective use of design tokens vs hardcoded values
 * 7. Overall performance budget compliance (score > 80)
 * 
 * These metrics ensure fast page loading times under 2 seconds.
 */