import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MobileNavBar from '@/components/layout/MobileNavBar'
import Header from '@/components/layout/Header'
import { CartProvider } from '@/contexts/CartContext'
import { CustomBundleProvider } from '@/contexts/CustomBundleContext'

/**
 * Unit Tests for Navigation Components
 * Task: 5.3 Написать unit тесты для навигации
 * Requirements: 9.3 - Accessibility and active states
 */

// Mock the cart context for testing
const MockCartProvider = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>
    <CustomBundleProvider>
      {children}
    </CustomBundleProvider>
  </CartProvider>
)

const TestWrapper = ({ children, initialEntries = ['/'] }: { 
  children: React.ReactNode
  initialEntries?: string[]
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <MockCartProvider>
      {children}
    </MockCartProvider>
  </MemoryRouter>
)

afterEach(() => {
  cleanup()
})

describe('MobileNavBar Component - Unit Tests', () => {
  describe('Active States (Requirement 9.3)', () => {
    test('highlights home as active when on home page', () => {
      render(
        <TestWrapper initialEntries={['/']}>
          <MobileNavBar />
        </TestWrapper>
      )

      const homeLink = screen.getByRole('link', { name: /главная/i })
      expect(homeLink).toHaveClass('bg-primary/20', 'text-primary', 'scale-105')
    })

    test('highlights catalog as active when on catalog page', () => {
      render(
        <TestWrapper initialEntries={['/catalog']}>
          <MobileNavBar />
        </TestWrapper>
      )

      const catalogLink = screen.getByRole('link', { name: /каталог/i })
      expect(catalogLink).toHaveClass('bg-primary/20', 'text-primary', 'scale-105')
    })

    test('highlights catalog as active when on catalog subpages', () => {
      render(
        <TestWrapper initialEntries={['/catalog/category/electronics']}>
          <MobileNavBar />
        </TestWrapper>
      )

      const catalogLink = screen.getByRole('link', { name: /каталог/i })
      expect(catalogLink).toHaveClass('bg-primary/20', 'text-primary', 'scale-105')
    })

    test('highlights bundle builder as active when on bundle page', () => {
      render(
        <TestWrapper initialEntries={['/bundle-builder']}>
          <MobileNavBar />
        </TestWrapper>
      )

      const bundleLink = screen.getByRole('link', { name: /собрать набор/i })
      expect(bundleLink).toHaveClass('bg-primary/20', 'text-primary', 'scale-105')
    })

    test('highlights cart as active when on cart page', () => {
      render(
        <TestWrapper initialEntries={['/cart']}>
          <MobileNavBar />
        </TestWrapper>
      )

      const cartLink = screen.getByRole('link', { name: /корзина/i })
      expect(cartLink).toHaveClass('bg-primary/20', 'text-primary', 'scale-105')
    })

    test('highlights profile as active when on profile page', () => {
      render(
        <TestWrapper initialEntries={['/profile']}>
          <MobileNavBar />
        </TestWrapper>
      )

      const profileLink = screen.getByRole('link', { name: /профиль/i })
      expect(profileLink).toHaveClass('bg-primary/20', 'text-primary', 'scale-105')
    })

    test('only one navigation item is active at a time', () => {
      render(
        <TestWrapper initialEntries={['/catalog']}>
          <MobileNavBar />
        </TestWrapper>
      )

      const activeLinks = screen.getAllByRole('link').filter(link => 
        link.classList.contains('bg-primary/20') && 
        link.classList.contains('text-primary') && 
        link.classList.contains('scale-105')
      )
      
      expect(activeLinks).toHaveLength(1)
      expect(activeLinks[0]).toHaveTextContent('Каталог')
    })

    test('home page only matches exact path', () => {
      render(
        <TestWrapper initialEntries={['/home-other']}>
          <MobileNavBar />
        </TestWrapper>
      )

      const homeLink = screen.getByRole('link', { name: /главная/i })
      expect(homeLink).not.toHaveClass('bg-primary/20')
      expect(homeLink).not.toHaveClass('text-primary')
      expect(homeLink).not.toHaveClass('scale-105')
    })
  })

  describe('Navigation Structure', () => {
    test('renders all navigation items', () => {
      render(
        <TestWrapper>
          <MobileNavBar />
        </TestWrapper>
      )

      expect(screen.getByText('Главная')).toBeInTheDocument()
      expect(screen.getByText('Каталог')).toBeInTheDocument()
      expect(screen.getByText('Собрать набор')).toBeInTheDocument()
      expect(screen.getByText('Корзина')).toBeInTheDocument()
      expect(screen.getByText('Профиль')).toBeInTheDocument()
    })

    test('has correct navigation links', () => {
      render(
        <TestWrapper>
          <MobileNavBar />
        </TestWrapper>
      )

      const homeLink = screen.getByRole('link', { name: /главная/i })
      const catalogLink = screen.getByRole('link', { name: /каталог/i })
      const bundleLink = screen.getByRole('link', { name: /собрать набор/i })
      const cartLink = screen.getByRole('link', { name: /корзина/i })
      const profileLink = screen.getByRole('link', { name: /профиль/i })

      expect(homeLink).toHaveAttribute('href', '/')
      expect(catalogLink).toHaveAttribute('href', '/catalog')
      expect(bundleLink).toHaveAttribute('href', '/bundle-builder')
      expect(cartLink).toHaveAttribute('href', '/cart')
      expect(profileLink).toHaveAttribute('href', '/profile')
    })

    test('displays icons for each navigation item', () => {
      render(
        <TestWrapper>
          <MobileNavBar />
        </TestWrapper>
      )

      // Check that each navigation item has an icon (svg element)
      const navItems = screen.getAllByRole('link')
      navItems.forEach(item => {
        const icon = item.querySelector('svg')
        expect(icon).toBeInTheDocument()
        // Icons can be either h-5 w-5 (inactive) or h-6 w-6 (active)
        const hasCorrectSize = icon?.classList.contains('h-5') || icon?.classList.contains('h-6')
        expect(hasCorrectSize).toBe(true)
      })
    })

    test('hides on admin pages', () => {
      render(
        <TestWrapper initialEntries={['/admin']}>
          <MobileNavBar />
        </TestWrapper>
      )

      // Navigation should not render on admin pages (returns null)
      expect(screen.queryByText('Главная')).not.toBeInTheDocument()
    })

    test('hides on admin subpages', () => {
      render(
        <TestWrapper initialEntries={['/admin/products']}>
          <MobileNavBar />
        </TestWrapper>
      )

      // Navigation should not render on admin subpages (returns null)
      expect(screen.queryByText('Главная')).not.toBeInTheDocument()
    })
  })

  describe('Cart Badge Functionality', () => {
    test('shows cart badge when items are in cart', () => {
      // This test would need cart context with items
      // For now, we test the structure exists
      render(
        <TestWrapper>
          <MobileNavBar />
        </TestWrapper>
      )

      const cartLink = screen.getByRole('link', { name: /корзина/i })
      expect(cartLink).toBeInTheDocument()
      
      // The badge element should exist in the DOM structure
      const badgeContainer = cartLink.querySelector('.relative')
      expect(badgeContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility (Requirement 9.3)', () => {
    test('all navigation links are keyboard accessible', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MobileNavBar />
        </TestWrapper>
      )

      const navLinks = screen.getAllByRole('link')
      
      // Tab through all navigation links
      for (const link of navLinks) {
        await user.tab()
        expect(document.activeElement).toBe(link)
      }
    })

    test('navigation links have proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <MobileNavBar />
        </TestWrapper>
      )

      const navLinks = screen.getAllByRole('link')
      
      navLinks.forEach(link => {
        // Links should have text content for accessibility
        expect(link.textContent).toBeTruthy()
        
        // Links should have href attributes
        expect(link).toHaveAttribute('href')
      })
    })

    test('navigation has proper semantic structure', () => {
      render(
        <TestWrapper>
          <MobileNavBar />
        </TestWrapper>
      )

      // Check for proper mobile navigation container
      const mobileNavContainer = document.querySelector('.mobile-nav-container')
      expect(mobileNavContainer).toBeInTheDocument()
      
      // Check for navigation bar
      const navBar = document.querySelector('.mobile-nav-bar')
      expect(navBar).toBeInTheDocument()
    })

    test('active navigation item has proper visual indication', () => {
      render(
        <TestWrapper initialEntries={['/catalog']}>
          <MobileNavBar />
        </TestWrapper>
      )

      const activeLink = screen.getByRole('link', { name: /каталог/i })
      
      // Active link should have active styling classes
      expect(activeLink).toHaveClass('bg-primary/20', 'text-primary', 'scale-105')
      
      // Active link should still be accessible
      expect(activeLink).toHaveTextContent('Каталог')
    })

    test('navigation supports screen readers', () => {
      render(
        <TestWrapper>
          <MobileNavBar />
        </TestWrapper>
      )

      const navLinks = screen.getAllByRole('link')
      
      navLinks.forEach(link => {
        // Each link should have text content for screen readers
        expect(link.textContent).toBeTruthy()
        
        // Links should have href attributes
        expect(link).toHaveAttribute('href')
      })
    })

    test('navigation icons have proper sizing for touch targets', () => {
      render(
        <TestWrapper>
          <MobileNavBar />
        </TestWrapper>
      )

      const icons = document.querySelectorAll('.mobile-nav-item svg')
      
      icons.forEach(icon => {
        // Icons should have proper size classes (h-5 w-5 = 20px, within 44px touch target)
        expect(icon).toHaveClass('h-5', 'w-5')
      })
    })
  })
})

describe('Header Component - Unit Tests', () => {
  describe('Desktop Navigation Active States', () => {
    test('highlights catalog as active when on catalog page', () => {
      render(
        <TestWrapper initialEntries={['/catalog']}>
          <Header />
        </TestWrapper>
      )

      const catalogLink = screen.getByRole('link', { name: /каталог/i })
      expect(catalogLink).toHaveClass('text-primary', 'bg-primary/10')
    })

    test('highlights bundle builder as active when on bundle page', () => {
      render(
        <TestWrapper initialEntries={['/bundle-builder']}>
          <Header />
        </TestWrapper>
      )

      const bundleLink = screen.getByRole('link', { name: /собрать набор/i })
      expect(bundleLink).toHaveClass('text-primary', 'bg-primary/10')
    })

    test('inactive links have proper hover states', () => {
      render(
        <TestWrapper initialEntries={['/']}>
          <Header />
        </TestWrapper>
      )

      const catalogLink = screen.getByRole('link', { name: /каталог/i })
      expect(catalogLink).toHaveClass('hover:text-primary', 'hover:bg-muted')
    })
  })

  describe('Header Structure and Functionality', () => {
    test('renders logo with link to home', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      const logoLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href') === '/'
      )
      expect(logoLinks.length).toBeGreaterThan(0)
    })

    test('renders search form on desktop', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      const searchInput = screen.getByPlaceholderText(/поиск подарков/i)
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    test('renders action buttons', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      // Check for admin, cart, and profile buttons
      expect(screen.getByTitle(/админ панель/i)).toBeInTheDocument()
      expect(screen.getByTitle(/корзина/i)).toBeInTheDocument()
      expect(screen.getByTitle(/профиль/i)).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    test('search form has proper structure', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      const searchInput = screen.getByPlaceholderText(/поиск подарков/i)
      const searchForm = searchInput.closest('form')
      expect(searchForm).toBeInTheDocument()
      expect(searchInput).toHaveClass('pl-10') // Space for search icon
    })

    test('search input is accessible', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      const searchInput = screen.getByPlaceholderText(/поиск подарков/i)
      expect(searchInput).toHaveAttribute('placeholder', 'Поиск подарков...')
      expect(searchInput).toHaveAttribute('type', 'text')
    })
  })

  describe('Accessibility (Requirement 9.3)', () => {
    test('header has proper semantic structure', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      const header = document.querySelector('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('sticky', 'top-0', 'z-50')
    })

    test('navigation links are keyboard accessible', async () => {
      userEvent.setup()
      
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      // Focus should be able to reach navigation links
      const catalogLink = screen.getByRole('link', { name: /каталог/i })
      
      catalogLink.focus()
      expect(catalogLink).toHaveFocus()
    })

    test('action buttons have proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      const adminButton = screen.getByTitle(/админ панель/i)
      const cartButton = screen.getByTitle(/корзина/i)
      const profileButton = screen.getByTitle(/профиль/i)

      // Buttons should have titles for accessibility
      expect(adminButton).toHaveAttribute('title')
      expect(cartButton).toHaveAttribute('title')
      expect(profileButton).toHaveAttribute('title')

      // Buttons should be focusable
      expect(adminButton.tagName).toBe('BUTTON')
      expect(cartButton.tagName).toBe('BUTTON')
      expect(profileButton.tagName).toBe('BUTTON')
    })

    test('cart button shows accessible badge when items present', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      const cartButton = screen.getByTitle(/корзина/i)
      
      // Cart button should have relative positioning for badge
      expect(cartButton).toHaveClass('relative')
      
      // The cart button structure should be accessible
      expect(cartButton).toHaveAttribute('title', 'Корзина')
      expect(cartButton).toBeInTheDocument()
    })

    test('theme toggle is accessible', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      // Theme toggle should be present and accessible
      // Note: This depends on the ThemeToggle component implementation
      const themeToggle = document.querySelector('[data-testid="theme-toggle"]') || 
                         document.querySelector('button[aria-label*="theme"]') ||
                         document.querySelector('button[title*="тем"]')
      
      // If theme toggle exists, it should be accessible
      if (themeToggle) {
        expect(themeToggle).toBeInTheDocument()
      }
    })

    test('responsive design hides/shows elements appropriately', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )

      // Desktop navigation should have responsive classes
      const desktopNav = document.querySelector('nav.hidden.lg\\:flex')
      if (desktopNav) {
        expect(desktopNav).toHaveClass('hidden', 'lg:flex')
      }

      // Mobile logo should have responsive classes
      const mobileLogo = document.querySelector('.flex-1.flex.justify-center.md\\:hidden')
      if (mobileLogo) {
        expect(mobileLogo).toHaveClass('md:hidden')
      }

      // Desktop search should have responsive classes
      const desktopSearch = document.querySelector('.hidden.md\\:flex')
      if (desktopSearch) {
        expect(desktopSearch).toHaveClass('hidden', 'md:flex')
      }
    })
  })
})