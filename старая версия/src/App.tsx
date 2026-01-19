import { Suspense, lazy, useState, useEffect } from 'react'
import { Loader } from '@/components/ui/loader'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CartProvider } from '@/contexts/CartContext'
import { CustomBundleProvider } from '@/contexts/CustomBundleContext'
import { LikesProvider } from '@/contexts/LikesContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'

// Pages
const HomePage = lazy(() => import('@/pages/HomePage'))
const CatalogPage = lazy(() => import('@/pages/CatalogPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'))
const BundleBuilderPage = lazy(() => import('@/pages/BundleBuilderPage'))
const LikesPage = lazy(() => import('@/pages/LikesPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const MyOrdersPage = lazy(() => import('@/pages/MyOrdersPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// Layout
import Layout from '@/components/layout/Layout'
import MobileNavBar from '@/components/layout/MobileNavBar'

// Scroll to top on route change and maintain fullscreen
function ScrollToTop() {
  const { pathname } = useLocation();
  const { isTelegram, forceFullscreen } = useTelegramWebApp();

  useEffect(() => {
    // Используем requestAnimationFrame для плавности
    requestAnimationFrame(() => {
      // Скроллим контейнер, а не window
      const scrollableContainer = document.querySelector('.scrollable');
      if (scrollableContainer) {
        scrollableContainer.scrollTop = 0;
      } else {
        // Fallback для обычного режима
        window.scrollTo(0, 0);
      }
    });

    // КРИТИЧНО: Поддерживаем полноэкранный режим при каждом переходе
    if (isTelegram) {
      // Немедленно
      forceFullscreen();
      
      // И через небольшую задержку для надежности
      setTimeout(() => {
        forceFullscreen();
      }, 100);
      
      setTimeout(() => {
        forceFullscreen();
      }, 300);
    }
  }, [pathname, isTelegram, forceFullscreen]);

  return null;
}

function App() {
  const { isTelegram, isFullscreen, forceFullscreen } = useTelegramWebApp()
  const [isLoading, setIsLoading] = useState(true) // Показываем загрузку всегда
  const [telegramReady, setTelegramReady] = useState(false)

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  // Принудительно включаем полноэкранный режим при загрузке
  useEffect(() => {
    if (isTelegram && !isFullscreen) {
      console.log('Forcing fullscreen mode...')
      forceFullscreen()
    }
  }, [isTelegram, isFullscreen, forceFullscreen])

  // Обработка загрузки для Telegram
  useEffect(() => {
    if (isTelegram) {
      // Даем время Telegram WebApp инициализироваться
      const timer = setTimeout(() => {
        setTelegramReady(true)
        setIsLoading(false)
        console.log('Telegram WebApp ready, showing app')
      }, 2000) // 2 секунды для инициализации

      return () => clearTimeout(timer)
    } else {
      // Для обычного браузера показываем загрузку короче
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isTelegram])

  // Показываем загрузку в Telegram до готовности
  if (isTelegram && !telegramReady) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-muted-foreground">Загрузка приложения...</p>
        <p className="text-xs text-muted-foreground mt-2">Инициализация Telegram WebApp</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="surpriset-ui-theme">
        <LikesProvider>
          <CartProvider>
            <CustomBundleProvider>
              {isLoading && !isTelegram && (
                <LoadingScreen 
                  onLoadingComplete={handleLoadingComplete} 
                  isTelegram={isTelegram}
                />
              )}
              <Router>
                <ScrollToTop />
                <div 
                  id="telegram-app-container"
                  className={`
                    ${isTelegram ? 'telegram-app fixed inset-0 overflow-hidden' : 'min-h-screen'} 
                    ${isLoading && !isTelegram ? 'opacity-0' : 'opacity-100'} 
                    transition-opacity duration-500
                  `}
                >
                  <div className={`${isTelegram ? 'h-full overflow-y-auto overflow-x-hidden' : ''} scrollable route-transition`} data-scrollable="true">
                    <Layout>
                      <Suspense
                        fallback={
                          <div className="min-h-screen bg-background flex items-center justify-center">
                            <Loader className="h-12 w-12" />
                          </div>
                        }
                      >
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/catalog" element={<CatalogPage />} />
                          <Route path="/product/:id" element={<ProductDetailPage />} />
                          <Route path="/cart" element={<CartPage />} />
                          <Route path="/checkout" element={<CheckoutPage />} />
                          <Route path="/order-success" element={<OrderSuccessPage />} />
                          <Route path="/bundle-builder" element={<BundleBuilderPage />} />
                          <Route path="/likes" element={<LikesPage />} />
                          <Route path="/profile" element={<ProfilePage />} />
                          <Route path="/my-orders" element={<MyOrdersPage />} />
                          <Route path="/admin/*" element={<AdminPage />} />
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </div>
                </div>
                {/* Mobile Navigation - ALWAYS VISIBLE, NOT AFFECTED BY LOADING */}
                <MobileNavBar />
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                      border: '1px solid hsl(var(--border))',
                    },
                  }}
                />
              </Router>
            </CustomBundleProvider>
          </CartProvider>
        </LikesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App