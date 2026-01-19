import '@testing-library/jest-dom'

// Mock window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock CSS variables for testing
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => {
      // Mock CSS custom properties
      const mockValues: Record<string, string> = {
        '--color-primary': '#10b981',
        '--color-background': '#ffffff',
        '--color-foreground': '#1f2937',
        '--color-muted': '#6b7280',
        '--color-border': '#e5e7eb',
        '--color-error': '#ef4444',
        '--size-1': '4px',
        '--size-2': '8px',
        '--size-3': '12px',
        '--size-4': '16px',
        '--size-6': '24px',
        '--size-8': '32px',
        '--size-10': '40px',
        '--size-12': '48px',
        '--button-height-sm': '32px',
        '--button-height-md': '40px',
        '--button-height-lg': '48px',
        '--touch-target-min': '44px',
        '--radius-sm': '4px',
        '--radius-md': '8px',
        '--radius-lg': '12px',
        '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        '--font-size-sm': '14px',
        '--font-size-md': '16px',
        '--font-size-lg': '20px',
        '--font-weight-normal': '400',
        '--font-weight-semibold': '600',
        '--line-height': '1.5',
      }
      return mockValues[prop] || ''
    },
  }),
})