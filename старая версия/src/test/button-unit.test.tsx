import { describe, test, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

/**
 * Unit Tests for Button Component
 * Task: 3.2 Написать unit тесты для Button компонента
 * Requirements: 9.2 - Accessibility (focus indicators)
 */

afterEach(() => {
  cleanup()
})

describe('Button Component - Unit Tests', () => {
  describe('Variant Rendering', () => {
    test('renders primary variant correctly', () => {
      render(<Button variant="primary">Primary Button</Button>)
      const button = screen.getByRole('button', { name: 'Primary Button' })
      
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn-primary')
      expect(button).toHaveClass('btn')
    })

    test('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary Button</Button>)
      const button = screen.getByRole('button', { name: 'Secondary Button' })
      
      expect(button).toHaveClass('btn-secondary')
      expect(button).toHaveClass('btn')
    })

    test('renders ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost Button</Button>)
      const button = screen.getByRole('button', { name: 'Ghost Button' })
      
      expect(button).toHaveClass('btn-ghost')
      expect(button).toHaveClass('btn')
    })

    test('renders outline variant (alias for secondary)', () => {
      render(<Button variant="outline">Outline Button</Button>)
      const button = screen.getByRole('button', { name: 'Outline Button' })
      
      expect(button).toHaveClass('btn-secondary')
    })

    test('renders destructive variant correctly', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button', { name: 'Delete' })
      
      expect(button).toHaveClass('bg-red-500')
      expect(button).toHaveClass('text-white')
    })

    test('renders link variant correctly', () => {
      render(<Button variant="link">Link Button</Button>)
      const button = screen.getByRole('button', { name: 'Link Button' })
      
      expect(button).toHaveClass('btn-ghost')
      expect(button).toHaveClass('underline')
    })

    test('uses primary as default variant', () => {
      render(<Button>Default Button</Button>)
      const button = screen.getByRole('button', { name: 'Default Button' })
      
      expect(button).toHaveClass('btn-primary')
    })
  })

  describe('Size Rendering', () => {
    test('renders small size correctly', () => {
      render(<Button size="sm">Small Button</Button>)
      const button = screen.getByRole('button', { name: 'Small Button' })
      
      expect(button).toHaveClass('btn-sm')
    })

    test('renders medium size correctly', () => {
      render(<Button size="md">Medium Button</Button>)
      const button = screen.getByRole('button', { name: 'Medium Button' })
      
      expect(button).toHaveClass('btn-md')
    })

    test('renders large size correctly', () => {
      render(<Button size="lg">Large Button</Button>)
      const button = screen.getByRole('button', { name: 'Large Button' })
      
      expect(button).toHaveClass('btn-lg')
    })

    test('renders icon size correctly', () => {
      render(<Button size="icon">⚙️</Button>)
      const button = screen.getByRole('button', { name: '⚙️' })
      
      expect(button).toHaveClass('btn-sm')
      expect(button).toHaveClass('w-8')
      expect(button).toHaveClass('h-8')
      expect(button).toHaveClass('p-0')
    })

    test('renders responsive size correctly', () => {
      render(<Button size="responsive">Responsive Button</Button>)
      const button = screen.getByRole('button', { name: 'Responsive Button' })
      
      expect(button).toHaveClass('btn-md')
      expect(button).toHaveClass('w-full')
    })

    test('uses medium as default size', () => {
      render(<Button>Default Size</Button>)
      const button = screen.getByRole('button', { name: 'Default Size' })
      
      expect(button).toHaveClass('btn-md')
    })
  })

  describe('States and Props', () => {
    test('handles disabled state correctly', () => {
      render(<Button disabled>Disabled Button</Button>)
      const button = screen.getByRole('button', { name: 'Disabled Button' })
      
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('disabled')
    })

    test('handles loading state correctly', () => {
      render(<Button loading>Loading Button</Button>)
      const button = screen.getByRole('button', { name: 'Загрузка...' })
      
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Загрузка...')
    })

    test('loading state overrides children content', () => {
      render(<Button loading>Original Text</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveTextContent('Загрузка...')
      expect(button).not.toHaveTextContent('Original Text')
    })

    test('loading state disables button', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toBeDisabled()
    })

    test('accepts custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>)
      const button = screen.getByRole('button', { name: 'Custom Button' })
      
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('btn-primary') // should still have default classes
    })

    test('forwards HTML button attributes', () => {
      const handleClick = vi.fn()
      render(
        <Button 
          onClick={handleClick}
          type="submit"
          data-testid="test-button"
          aria-label="Test button"
        >
          Test
        </Button>
      )
      
      const button = screen.getByTestId('test-button')
      
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('aria-label', 'Test button')
      
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility - Focus Indicators (Requirement 9.2)', () => {
    test('has proper focus-visible classes for keyboard navigation', () => {
      render(<Button>Focus Test</Button>)
      const button = screen.getByRole('button', { name: 'Focus Test' })
      
      // Check for focus-visible classes that provide focus indicators
      expect(button).toHaveClass('focus-visible:outline-none')
      expect(button).toHaveClass('focus-visible:ring-2')
      expect(button).toHaveClass('focus-visible:ring-primary')
      expect(button).toHaveClass('focus-visible:ring-offset-2')
    })

    test('is focusable by default', () => {
      render(<Button>Focusable Button</Button>)
      const button = screen.getByRole('button', { name: 'Focusable Button' })
      
      expect(button).not.toHaveAttribute('tabindex', '-1')
      
      // Button should be focusable
      button.focus()
      expect(button).toHaveFocus()
    })

    test('disabled button is not focusable', () => {
      render(<Button disabled>Disabled Button</Button>)
      const button = screen.getByRole('button', { name: 'Disabled Button' })
      
      // Disabled buttons should not be focusable
      button.focus()
      expect(button).not.toHaveFocus()
    })

    test('loading button is not focusable', () => {
      render(<Button loading>Loading Button</Button>)
      const button = screen.getByRole('button')
      
      // Loading buttons should not be focusable (they're disabled)
      button.focus()
      expect(button).not.toHaveFocus()
    })

    test('supports keyboard interaction', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      
      render(<Button onClick={handleClick}>Keyboard Test</Button>)
      const button = screen.getByRole('button', { name: 'Keyboard Test' })
      
      // Focus the button
      await user.tab()
      expect(button).toHaveFocus()
      
      // Press Enter to activate
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      // Press Space to activate
      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    test('has proper ARIA attributes', () => {
      render(<Button>ARIA Test</Button>)
      const button = screen.getByRole('button', { name: 'ARIA Test' })
      
      // Button should be accessible by screen readers (implicit role)
      expect(button.tagName).toBe('BUTTON')
      
      // Button elements have implicit role="button", no need to set explicitly
      expect(button).not.toHaveAttribute('role')
    })

    test('maintains accessibility with custom props', () => {
      render(
        <Button 
          aria-describedby="help-text"
          aria-pressed="false"
        >
          Accessible Button
        </Button>
      )
      const button = screen.getByRole('button', { name: 'Accessible Button' })
      
      expect(button).toHaveAttribute('aria-describedby', 'help-text')
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Component Composition', () => {
    test('renders as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link', { name: 'Link Button' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
      expect(link).toHaveClass('btn-primary') // Should still have button classes
    })

    test('renders as button by default', () => {
      render(<Button>Regular Button</Button>)
      const button = screen.getByRole('button', { name: 'Regular Button' })
      
      expect(button.tagName).toBe('BUTTON')
    })
  })

  describe('Variant and Size Combinations', () => {
    test('all variant and size combinations work correctly', () => {
      const variants = ['primary', 'secondary', 'ghost'] as const
      const sizes = ['sm', 'md', 'lg'] as const
      
      variants.forEach(variant => {
        sizes.forEach(size => {
          cleanup()
          
          render(
            <Button 
              variant={variant} 
              size={size}
              data-testid={`${variant}-${size}`}
            >
              {variant} {size}
            </Button>
          )
          
          const button = screen.getByTestId(`${variant}-${size}`)
          
          expect(button).toHaveClass(`btn-${variant}`)
          expect(button).toHaveClass(`btn-${size}`)
          expect(button).toHaveClass('btn')
        })
      })
    })
  })

  describe('Error Handling', () => {
    test('handles invalid variant gracefully', () => {
      // TypeScript would prevent this, but test runtime behavior
      render(<Button variant={'invalid' as any}>Invalid Variant</Button>)
      const button = screen.getByRole('button', { name: 'Invalid Variant' })
      
      // Should still render and have base classes
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn')
    })

    test('handles invalid size gracefully', () => {
      // TypeScript would prevent this, but test runtime behavior  
      render(<Button size={'invalid' as any}>Invalid Size</Button>)
      const button = screen.getByRole('button', { name: 'Invalid Size' })
      
      // Should still render and have base classes
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn')
    })
  })
})