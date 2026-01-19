/**
 * Централизованная система дизайн-токенов
 * Обеспечивает консистентность всех UI элементов
 */

export const designTokens = {
  // Система отступов (базовая единица 4px)
  spacing: {
    0: '0px',
    1: '4px',    // 0.25rem
    2: '8px',    // 0.5rem
    3: '12px',   // 0.75rem
    4: '16px',   // 1rem
    5: '20px',   // 1.25rem
    6: '24px',   // 1.5rem
    8: '32px',   // 2rem
    10: '40px',  // 2.5rem
    12: '48px',  // 3rem
    16: '64px',  // 4rem
    20: '80px',  // 5rem
    24: '96px',  // 6rem
  },

  // Система скругления углов
  radius: {
    none: '0px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },

  // Типографическая система
  typography: {
    xs: { 
      size: '12px', 
      lineHeight: '16px', 
      weight: 400,
      mobile: { size: '11px', lineHeight: '15px' }
    },
    sm: { 
      size: '14px', 
      lineHeight: '20px', 
      weight: 400,
      mobile: { size: '13px', lineHeight: '18px' }
    },
    base: { 
      size: '16px', 
      lineHeight: '24px', 
      weight: 400,
      mobile: { size: '15px', lineHeight: '22px' }
    },
    lg: { 
      size: '18px', 
      lineHeight: '28px', 
      weight: 500,
      mobile: { size: '17px', lineHeight: '26px' }
    },
    xl: { 
      size: '20px', 
      lineHeight: '28px', 
      weight: 600,
      mobile: { size: '19px', lineHeight: '27px' }
    },
    '2xl': { 
      size: '24px', 
      lineHeight: '32px', 
      weight: 700,
      mobile: { size: '22px', lineHeight: '30px' }
    },
    '3xl': { 
      size: '30px', 
      lineHeight: '36px', 
      weight: 700,
      mobile: { size: '26px', lineHeight: '32px' }
    },
    '4xl': { 
      size: '36px', 
      lineHeight: '40px', 
      weight: 700,
      mobile: { size: '30px', lineHeight: '36px' }
    },
    '5xl': { 
      size: '48px', 
      lineHeight: '52px', 
      weight: 800,
      mobile: { size: '36px', lineHeight: '40px' }
    },
  },

  // Система теней (5 уровней глубины)
  shadows: {
    none: 'none',
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    // Темная тема
    dark: {
      xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
      sm: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.4), 0 10px 10px rgba(0, 0, 0, 0.2)',
      '2xl': '0 25px 50px rgba(0, 0, 0, 0.5)',
    }
  },

  // Минимальные размеры для touch targets (44x44px минимум)
  touchTarget: {
    min: '44px',        // Минимальный размер для мобильных
    comfortable: '48px', // Комфортный размер
    spacious: '56px',   // Просторный размер
  },

  // Система z-index для правильного наслоения
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1020,
    banner: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    skipLink: 1070,
    toast: 1080,
    tooltip: 1090,
  },

  // Breakpoints для адаптивности
  breakpoints: {
    xs: '320px',   // Маленькие мобильные
    sm: '640px',   // Мобильные
    md: '768px',   // Планшеты
    lg: '1024px',  // Маленькие десктопы
    xl: '1280px',  // Десктопы
    '2xl': '1536px', // Большие экраны
  },

  // Максимальные ширины контейнеров
  maxWidth: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1728px',
    '4xl': '1920px',
    full: '100%',
    screen: '100vw',
  },

  // Система анимаций
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

// Типы для TypeScript
export type SpacingKey = keyof typeof designTokens.spacing;
export type RadiusKey = keyof typeof designTokens.radius;
export type TypographyKey = keyof typeof designTokens.typography;
export type ShadowKey = keyof typeof designTokens.shadows;
export type ZIndexKey = keyof typeof designTokens.zIndex;
export type BreakpointKey = keyof typeof designTokens.breakpoints;

// Утилиты для работы с токенами
export const getSpacing = (key: SpacingKey) => designTokens.spacing[key];
export const getRadius = (key: RadiusKey) => designTokens.radius[key];
export const getShadow = (key: ShadowKey) => designTokens.shadows[key];
export const getZIndex = (key: ZIndexKey) => designTokens.zIndex[key];

// Утилита для создания адаптивных значений
export const responsive = {
  mobile: (value: string) => `${value}`,
  tablet: (value: string) => `md:${value}`,
  desktop: (value: string) => `lg:${value}`,
  wide: (value: string) => `xl:${value}`,
};