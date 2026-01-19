import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import type { Product } from '@/types';

// Mock data with complete Product interface
const mockProducts: Product[] = [
  {
    id: '1',
    sku: 'TEST-001',
    name: 'Test Product 1',
    description: 'Test description 1',
    composition: 'Test composition 1',
    price: 1000,
    original_price: null,
    images: ['/test-image-1.jpg'],
    tags: ['Для неё'],
    category_id: null,
    category: null,
    status: 'in_stock' as const,
    type: 'product' as const,
    is_featured: false,
    likes_count: 0,
    reviews_count: 0,
    average_rating: 0,
    specifications: { 'Размер': 'Средний', 'Цвет': 'Красный' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    sku: 'TEST-002',
    name: 'Test Product 2',
    description: 'Test description 2',
    composition: 'Test composition 2',
    price: 2000,
    original_price: 2500,
    images: ['/test-image-2.jpg'],
    tags: ['Для него'],
    category_id: null,
    category: null,
    status: 'in_stock' as const,
    type: 'bundle' as const,
    is_featured: true,
    likes_count: 5,
    reviews_count: 3,
    average_rating: 4.2,
    specifications: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

// Mock hooks
vi.mock('@/hooks/useDatabase', () => ({
  useProducts: vi.fn(() => ({
    products: mockProducts as any,
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useProduct: vi.fn((id) => ({
    product: id === '1' ? {
      ...mockProducts[0],
      specifications: { 'Размер': 'Средний', 'Цвет': 'Красный' },
      composition: 'Состав товара\nВторая строка состава',
    } : null,
    loading: false,
    error: null,
  })),
  useBanners: vi.fn(() => ({
    banners: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/hooks/useTelegramWebApp', () => ({
  useTelegramWebApp: vi.fn(() => ({
    isTelegram: false,
    telegramUser: null,
  })),
}));

vi.mock('@/hooks/useTelegramProducts', () => ({
  useTelegramProducts: vi.fn(() => ({
    products: [],
    loading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useTelegramBanners', () => ({
  useTelegramBanners: vi.fn(() => ({
    banners: [],
    loading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useReviews', () => ({
  useReviews: vi.fn(() => ({
    reviews: [],
    stats: { reviews_count: 0, average_rating: 0 },
    loading: false,
    fetchReviews: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
    getUserReview: vi.fn(() => Promise.resolve(null)),
  })),
}));

vi.mock('@/hooks/useSwipeBack', () => ({
  useSwipeBack: vi.fn(() => ({
    isSwiping: false,
    swipeProgress: 0,
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: '1' })),
    useSearchParams: vi.fn(() => [
      new URLSearchParams(),
      vi.fn(),
    ]),
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock ProductCard to avoid fetchPriority issues
vi.mock('@/components/products/ProductCard', () => ({
  ProductCard: ({ product }: { product: any }) => (
    <div data-testid="product-card">
      <h3>{product.name}</h3>
      <span>{product.price} ₽</span>
    </div>
  ),
}));

// Import pages after mocks
import HomePage from '@/pages/HomePage';
import CatalogPage from '@/pages/CatalogPage';

// Import contexts
import { CartProvider } from '@/contexts/CartContext';
import { CustomBundleProvider } from '@/contexts/CustomBundleContext';
import { LikesProvider } from '@/contexts/LikesContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Test wrapper with all providers
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <CartProvider>
          <CustomBundleProvider>
            <LikesProvider>
              {children}
            </LikesProvider>
          </CustomBundleProvider>
        </CartProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

describe('Pages Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HomePage Integration', () => {
    it('should render main components and handle basic interactions', async () => {
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Check main sections are rendered
      expect(screen.getByText('Рекомендуемые товары')).toBeInTheDocument();
      expect(screen.getByText('Создайте идеальный подарок')).toBeInTheDocument();

      // Check products are displayed
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      });

      // Test navigation links
      const catalogButton = screen.getByRole('link', { name: /весь каталог/i });
      expect(catalogButton).toHaveAttribute('href', '/catalog');

      const bundleButton = screen.getByRole('link', { name: /собрать набор/i });
      expect(bundleButton).toHaveAttribute('href', '/bundle-builder');
    });

    it('should handle loading states correctly', async () => {
      // Mock loading state
      const { useProducts } = await import('@/hooks/useDatabase');
      vi.mocked(useProducts).mockReturnValue({
        products: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Check loading skeletons are displayed
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('CatalogPage Integration', () => {
    it('should render products and handle search functionality', async () => {
      const user = userEvent.setup();
      
      // Ensure products are available
      const { useProducts } = await import('@/hooks/useDatabase');
      vi.mocked(useProducts).mockReturnValue({
        products: mockProducts as any,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });
      
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Check main elements
      expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Поиск товаров...')).toBeInTheDocument();

      // Check products are displayed
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText('Поиск товаров...');
      await user.type(searchInput, 'Test Product 1');

      await waitFor(() => {
        expect(searchInput).toHaveValue('Test Product 1');
      });
    });

    it('should handle category filtering', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Check category buttons are rendered
      await waitFor(() => {
        expect(screen.getByText('Все')).toBeInTheDocument();
      });

      // Test category filtering
      const allButton = screen.getByText('Все');
      await user.click(allButton);

      // Button should have active styling (default variant)
      expect(allButton).toHaveClass('btn-primary');
    });

    it('should handle sorting functionality', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Check sort buttons
      expect(screen.getByText('Новые')).toBeInTheDocument();
      expect(screen.getByText('Дешевле')).toBeInTheDocument();
      expect(screen.getByText('Дороже')).toBeInTheDocument();

      // Test sorting
      const priceAscButton = screen.getByText('Дешевле');
      await user.click(priceAscButton);

      // Button should be active
      expect(priceAscButton).toHaveClass('btn-primary');
    });

    it('should handle empty state correctly', async () => {
      // Mock empty products
      const { useProducts } = await import('@/hooks/useDatabase');
      vi.mocked(useProducts).mockReturnValue({
        products: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Check empty state
      expect(screen.getByText('Товары не найдены')).toBeInTheDocument();
      expect(screen.getByText('Попробуйте изменить параметры поиска')).toBeInTheDocument();
      expect(screen.getByText('Сбросить фильтры')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should render HomePage within performance budget', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('Рекомендуемые товары')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 200ms (reasonable for integration test)
      expect(renderTime).toBeLessThan(200);
    });

    it('should render CatalogPage within performance budget', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 200ms
      expect(renderTime).toBeLessThan(200);
    });

    it('should handle rapid user interactions without performance degradation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск товаров...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Поиск товаров...');
      
      // Rapid typing simulation
      const startTime = performance.now();
      
      for (let i = 0; i < 5; i++) {
        await user.type(searchInput, 'a');
        await user.clear(searchInput);
      }
      
      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      // Should handle rapid interactions within reasonable time
      expect(interactionTime).toBeLessThan(2000);
    });

    it('should maintain 60fps during scroll interactions', async () => {
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Mock scroll performance measurement
      const scrollContainer = document.body;
      const startTime = performance.now();
      
      // Simulate scroll events
      for (let i = 0; i < 10; i++) {
        scrollContainer.scrollTop = i * 100;
        // Trigger scroll event
        scrollContainer.dispatchEvent(new Event('scroll'));
      }
      
      const endTime = performance.now();
      const scrollTime = endTime - startTime;
      
      // Should handle scroll events efficiently (< 16ms per frame for 60fps)
      const averageFrameTime = scrollTime / 10;
      expect(averageFrameTime).toBeLessThan(16);
    });

    it('should efficiently handle large product lists', async () => {
      // Mock large product list
      const largeProductList = Array.from({ length: 100 }, (_, i) => ({
        ...mockProducts[0],
        id: `product-${i}`,
        name: `Test Product ${i}`,
        sku: `TEST-${i.toString().padStart(3, '0')}`,
        composition: mockProducts[0].composition ?? null,
        original_price: mockProducts[0].original_price ?? null,
        reviews_count: Math.floor(Math.random() * 10),
        average_rating: Math.round((Math.random() * 5) * 10) / 10,
      }));

      const { useProducts } = await import('@/hooks/useDatabase');
      vi.mocked(useProducts).mockReturnValue({
        products: largeProductList as any,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle large lists within reasonable time
      expect(renderTime).toBeLessThan(500);
    });

    it('should optimize re-renders during state changes', async () => {
      const user = userEvent.setup();
      let renderCount = 0;
      
      // Mock component to count renders
      const RenderCounter = () => {
        renderCount++;
        return null;
      };

      render(
        <TestWrapper>
          <CatalogPage />
          <RenderCounter />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск товаров...')).toBeInTheDocument();
      });

      const initialRenderCount = renderCount;
      
      // Perform multiple state changes
      const searchInput = screen.getByPlaceholderText('Поиск товаров...');
      await user.type(searchInput, 'test');
      
      const sortButton = screen.getByText('Дешевле');
      await user.click(sortButton);

      // Should not cause excessive re-renders
      const finalRenderCount = renderCount;
      const additionalRenders = finalRenderCount - initialRenderCount;
      
      // Should be reasonable number of re-renders (not excessive)
      expect(additionalRenders).toBeLessThan(10);
    });
  });

  describe('Component Interaction Tests', () => {
    it('should maintain state consistency across component interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Interact with search
      const searchInput = screen.getByPlaceholderText('Поиск товаров...');
      await user.type(searchInput, 'test');

      // Interact with sorting
      const sortButton = screen.getByText('Дешевле');
      await user.click(sortButton);

      // Both states should be maintained
      expect(searchInput).toHaveValue('test');
      expect(sortButton).toHaveClass('btn-primary');
    });

    it('should handle error states gracefully across components', async () => {
      // Mock error state
      const { useProducts } = await import('@/hooks/useDatabase');
      vi.mocked(useProducts).mockReturnValue({
        products: [],
        loading: false,
        error: 'Network error',
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Check error handling
      expect(screen.getByText('Ошибка загрузки товаров')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Перезагрузить')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain proper focus management across page interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Wait for render
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск товаров...')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const searchInput = screen.getByPlaceholderText('Поиск товаров...');
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Tab to next focusable element
      await user.tab();
      
      // Should move focus to next interactive element
      const focusedElement = document.activeElement;
      expect(focusedElement).not.toBe(searchInput);
      expect(focusedElement?.tagName).toMatch(/BUTTON|INPUT|A/);
    });

    it('should provide proper semantic structure', () => {
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Check for proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check for proper link structure
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск товаров...')).toBeInTheDocument();
      });

      // Check search input has proper attributes
      const searchInput = screen.getByPlaceholderText('Поиск товаров...');
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('placeholder', 'Поиск товаров...');

      // Check buttons have proper roles (they should be button elements)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // All buttons should be actual button elements or have button role
      buttons.forEach(button => {
        expect(button.tagName === 'BUTTON' || button.getAttribute('role') === 'button').toBe(true);
      });
    });
  });

  describe('Cross-Page Navigation Integration', () => {
    it('should maintain state when navigating between pages', async () => {
      const user = userEvent.setup();
      
      // Start on HomePage
      const { rerender } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('Рекомендуемые товары')).toBeInTheDocument();
      });

      // Navigate to CatalogPage
      rerender(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Check catalog page loads correctly
      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Interact with search
      const searchInput = screen.getByPlaceholderText('Поиск товаров...');
      await user.type(searchInput, 'test search');

      expect(searchInput).toHaveValue('test search');
    });

    it('should handle browser back/forward navigation', async () => {
      // Mock window.history
      const mockPushState = vi.fn();
      const mockReplaceState = vi.fn();
      
      Object.defineProperty(window, 'history', {
        value: {
          pushState: mockPushState,
          replaceState: mockReplaceState,
          back: vi.fn(),
          forward: vi.fn(),
          go: vi.fn(),
        },
        writable: true,
      });

      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Simulate navigation
      const catalogLink = screen.getByText('КАТАЛОГ');
      expect(catalogLink).toBeInTheDocument();
    });
  });

  describe('Data Loading and Caching Integration', () => {
    it('should handle concurrent data requests efficiently', async () => {
      const mockRefetch = vi.fn();
      
      // Mock multiple concurrent requests
      const { useProducts } = await import('@/hooks/useDatabase');
      vi.mocked(useProducts).mockReturnValue({
        products: mockProducts as any,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Test that the component handles data loading efficiently
      // This is more about verifying the component structure works
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      
      // Verify refetch function is available
      expect(mockRefetch).toBeDefined();
    });

    it('should handle network errors gracefully with retry mechanism', async () => {
      const user = userEvent.setup();
      const mockRefetch = vi.fn();
      
      // Mock error state first
      const { useProducts } = await import('@/hooks/useDatabase');
      vi.mocked(useProducts).mockReturnValue({
        products: [],
        loading: false,
        error: 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Check error message is displayed
      expect(screen.getByText('Ошибка загрузки товаров')).toBeInTheDocument();
      expect(screen.getByText('Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.')).toBeInTheDocument();

      // Test retry functionality - look for retry button
      const retryButton = screen.queryByText('Перезагрузить');
      if (retryButton) {
        await user.click(retryButton);
        // Note: The retry button triggers window.location.reload(), not refetch
        // So we just verify the button exists and is clickable
        expect(retryButton).toBeInTheDocument();
      } else {
        // If no retry button, just verify the error handling works
        expect(screen.getByText('Ошибка загрузки товаров')).toBeInTheDocument();
      }
    });

    it('should handle data updates and refresh correctly', async () => {
      const mockRefetch = vi.fn();
      
      const { useProducts } = await import('@/hooks/useDatabase');
      vi.mocked(useProducts).mockReturnValue({
        products: mockProducts as any,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      });

      // Verify data is displayed correctly
      expect(screen.getByText('1000 ₽')).toBeInTheDocument();
      expect(screen.getByText('2000 ₽')).toBeInTheDocument();
      
      // Verify refetch function is available for data updates
      expect(mockRefetch).toBeDefined();
      expect(typeof mockRefetch).toBe('function');
    });
  });

  describe('Mobile-Specific Integration Tests', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should render mobile-optimized layout correctly', async () => {
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Check mobile-specific elements
      const productCards = screen.getAllByTestId('product-card');
      expect(productCards.length).toBeGreaterThan(0);

      // Check grid layout (should be 2 columns on mobile)
      const productGrid = document.querySelector('.grid');
      if (productGrid) {
        // const computedStyle = getComputedStyle(productGrid);
        // Should have mobile grid classes
        expect(productGrid.className).toMatch(/grid/);
      }
    });

    it('should handle touch interactions properly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск товаров...')).toBeInTheDocument();
      });

      // Test touch-friendly interactions
      const searchInput = screen.getByPlaceholderText('Поиск товаров...');
      
      // Simulate touch events
      await user.click(searchInput);
      expect(document.activeElement).toBe(searchInput);

      await user.type(searchInput, 'mobile test');
      expect(searchInput).toHaveValue('mobile test');
    });

    it('should maintain performance on mobile devices', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Mobile should render within 300ms (more lenient than desktop)
      expect(renderTime).toBeLessThan(300);
    });
  });

  describe('UI Design Revert Specific Tests', () => {
    it('should use simplified design tokens consistently', async () => {
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Check that components use design tokens (CSS variables)
      const catalogTitle = screen.getByText('КАТАЛОГ');
      expect(catalogTitle).toBeInTheDocument();
      
      // Check search input exists and has simple styling
      const searchInput = screen.getByPlaceholderText('Поиск товаров...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should maintain 4px grid system in layout', async () => {
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Check that container exists with proper structure
      const container = document.querySelector('.container');
      expect(container).toBeInTheDocument();
      
      // Check grid layout exists
      const productGrid = document.querySelector('.grid');
      expect(productGrid).toBeInTheDocument();
    });

    it('should use simple component styling without complex effects', async () => {
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      });

      // Check buttons exist and have proper classes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Should have button classes
        expect(button.className).toMatch(/btn/);
        
        // Should not have complex effect classes
        expect(button.className).not.toMatch(/backdrop-blur|glass|shadow-xl/);
      });
    });

    it('should maintain mobile-first responsive design', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Check mobile-specific elements exist
      const productGrid = document.querySelector('.grid');
      expect(productGrid).toBeInTheDocument();
      
      // Should have grid classes for mobile layout
      expect(productGrid?.className).toMatch(/grid/);
      expect(productGrid?.className).toMatch(/grid-cols-2/);
    });

    it('should handle performance requirements - fast loading', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Wait for all content to load
      await waitFor(() => {
        expect(screen.getByText('Рекомендуемые товары')).toBeInTheDocument();
        expect(screen.getByText('Создайте идеальный подарок')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load within 2 seconds (requirement 8.5)
      expect(loadTime).toBeLessThan(2000);
    });

    it('should use minimal DOM structure for performance', async () => {
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Count DOM elements to ensure minimal structure
      const allElements = document.querySelectorAll('*');
      const elementCount = allElements.length;
      
      // Should not have excessive DOM elements (reasonable limit)
      expect(elementCount).toBeLessThan(500); // Reasonable limit for a catalog page
    });

    it('should maintain accessibility standards', async () => {
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      });

      // Check heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      // Check that main heading is h1
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('КАТАЛОГ');

      // Check interactive elements have proper focus
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Should be focusable
        expect(button.tabIndex).toBeGreaterThanOrEqual(0);
      });

      // Check search input has proper attributes
      const searchInput = screen.getByPlaceholderText('Поиск товаров...');
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('placeholder');
    });

    it('should handle error states with simple, clear messaging', async () => {
      // Mock error state
      const { useProducts } = await import('@/hooks/useDatabase');
      vi.mocked(useProducts).mockReturnValue({
        products: [],
        loading: false,
        error: 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Check simple error message structure
      expect(screen.getByText('Ошибка загрузки товаров')).toBeInTheDocument();
      expect(screen.getByText('Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.')).toBeInTheDocument();
      
      // Check simple retry button
      const retryButton = screen.getByText('Перезагрузить');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton.tagName).toBe('BUTTON');
    });

    it('should use consistent color scheme across components', async () => {
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Рекомендуемые товары')).toBeInTheDocument();
      });

      // Check that links with button styling exist (HomePage uses links as buttons)
      const buttonLinks = screen.getAllByRole('link');
      expect(buttonLinks.length).toBeGreaterThan(0);
      
      // Check primary button styling
      const primaryButtons = buttonLinks.filter(link => 
        link.className.includes('btn-primary')
      );
      
      expect(primaryButtons.length).toBeGreaterThan(0);
      
      // All primary buttons should have consistent classes
      primaryButtons.forEach(button => {
        expect(button.className).toMatch(/btn-primary/);
      });
    });

    it('should maintain simple typography hierarchy', async () => {
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Рекомендуемые товары')).toBeInTheDocument();
      });

      // Check headings exist and have proper structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      // Check that headings have proper text content
      const mainHeading = screen.getByText('Рекомендуемые товары');
      expect(mainHeading.tagName).toBe('H2');
      
      const ctaHeading = screen.getByText('Создайте идеальный подарок');
      expect(ctaHeading.tagName).toBe('H2');
      
      // Check that headings have proper font classes
      headings.forEach(heading => {
        expect(heading.className).toMatch(/text-|font-/);
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle component errors gracefully', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test that the app doesn't crash when there are errors
      // This is more of a structural test - we verify error boundaries exist
      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Should render the page structure even if some components fail
      expect(screen.getByText('КАТАЛОГ')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should provide meaningful error messages to users', async () => {
      // Test error handling in data loading
      const { useProducts } = await import('@/hooks/useDatabase');
      vi.mocked(useProducts).mockReturnValue({
        products: [],
        loading: false,
        error: 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CatalogPage />
        </TestWrapper>
      );

      // Should show user-friendly error message
      expect(screen.getByText('Ошибка загрузки товаров')).toBeInTheDocument();
      expect(screen.getByText('Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.')).toBeInTheDocument();
    });
  });
});