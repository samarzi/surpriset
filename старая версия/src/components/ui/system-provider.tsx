import React, { createContext, useContext, useEffect, useState } from 'react';
import { designTokens } from '@/lib/design-tokens';

interface SystemContextType {
  // Текущая тема
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Информация об устройстве
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Viewport информация
  viewportWidth: number;
  viewportHeight: number;
  
  // Safe area информация
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Дизайн токены
  tokens: typeof designTokens;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

interface SystemProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
}

export function SystemProvider({ children, defaultTheme = 'system' }: SystemProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(defaultTheme);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  // Определяем тип устройства на основе ширины экрана
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const isDesktop = viewportWidth >= 1024;

  // Обновляем размеры viewport
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Обновляем safe area insets
  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeAreaInsets({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('orientationchange', updateSafeArea);
    return () => window.removeEventListener('orientationchange', updateSafeArea);
  }, []);

  // Применяем тему к документу
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Слушаем изменения системной темы
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Устанавливаем CSS переменные для safe area
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--safe-area-inset-top', `${safeAreaInsets.top}px`);
    root.style.setProperty('--safe-area-inset-right', `${safeAreaInsets.right}px`);
    root.style.setProperty('--safe-area-inset-bottom', `${safeAreaInsets.bottom}px`);
    root.style.setProperty('--safe-area-inset-left', `${safeAreaInsets.left}px`);
  }, [safeAreaInsets]);

  const value: SystemContextType = {
    theme,
    setTheme,
    isMobile,
    isTablet,
    isDesktop,
    viewportWidth,
    viewportHeight,
    safeAreaInsets,
    tokens: designTokens,
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}