# Design Document: UI Design Revert

## Overview

Этот документ описывает возврат к простому, элегантному и высокопроизводительному дизайну приложения. Основная цель - убрать сложность, улучшить производительность и создать интуитивно понятный интерфейс.

## Architecture

### Design System Architecture

```
Design System
├── Tokens (цвета, размеры, отступы)
├── Components (кнопки, карточки, формы)
├── Layouts (сетки, контейнеры)
├── Typography (шрифты, размеры)
└── Themes (светлая/темная)
```

### Component Hierarchy

```
App
├── Layout Components
│   ├── Header (простой, без эффектов)
│   ├── Navigation (стандартная нижняя навигация)
│   └── Footer (минималистичный)
├── UI Components
│   ├── Button (3 размера, простые состояния)
│   ├── Card (прямоугольная, простая тень)
│   ├── Input (стандартная форма)
│   └── Modal (простое наложение)
└── Feature Components
    ├── ProductCard (компактная, только основное)
    ├── ProductGrid (2 колонки на мобильных)
    └── SearchBar (простая форма поиска)
```

## Components and Interfaces

### Design Tokens

```css
/* Цветовая система - ПРОСТАЯ */
:root {
  /* Основные цвета */
  --color-primary: #10b981;      /* Зеленый акцент */
  --color-background: #ffffff;    /* Белый фон */
  --color-foreground: #1f2937;   /* Темный текст */
  
  /* Дополнительные цвета */
  --color-muted: #6b7280;        /* Приглушенный текст */
  --color-border: #e5e7eb;       /* Границы */
  --color-error: #ef4444;        /* Ошибки */
  
  /* Размеры */
  --size-xs: 4px;
  --size-sm: 8px;
  --size-md: 16px;
  --size-lg: 24px;
  --size-xl: 32px;
  
  /* Радиусы */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Тени */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  /* Шрифты */
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 20px;
  
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
}

/* Темная тема */
.dark {
  --color-background: #1f2937;
  --color-foreground: #f9fafb;
  --color-border: #374151;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
}
```

### Button Component

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

// Простые стили кнопок
const buttonStyles = {
  base: 'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
  
  variants: {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'text-gray-700 hover:bg-gray-100'
  },
  
  sizes: {
    sm: 'h-8 px-3 text-sm rounded-md',
    md: 'h-10 px-4 text-md rounded-md', 
    lg: 'h-12 px-6 text-lg rounded-lg'
  }
};
```

### Card Component

```typescript
interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

// Простые стили карточек
const cardStyles = {
  base: 'bg-white border border-gray-200 rounded-lg',
  shadow: 'shadow-md',
  
  padding: {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
};
```

### ProductCard Component

```typescript
interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

// Упрощенная карточка товара
const ProductCard = ({ product, compact = false }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
    {/* Изображение */}
    <div className="aspect-square bg-gray-100">
      <img 
        src={product.image} 
        alt={product.name}
        className="w-full h-full object-cover"
      />
    </div>
    
    {/* Контент */}
    <div className="p-3">
      <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
        {product.name}
      </h3>
      <p className="text-lg font-semibold text-gray-900 mt-2">
        {product.price} ₽
      </p>
      
      {!compact && (
        <button className="w-full mt-3 bg-primary text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors">
          В корзину
        </button>
      )}
    </div>
  </div>
);
```

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  colors: {
    primary: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    error: string;
  };
  
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  typography: {
    sizes: {
      sm: string;
      md: string;
      lg: string;
    };
    weights: {
      normal: number;
      semibold: number;
    };
  };
  
  shadows: {
    sm: string;
    md: string;
  };
  
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
}
```

### Component Variants

```typescript
interface ComponentVariants {
  button: {
    variants: ['primary', 'secondary', 'ghost'];
    sizes: ['sm', 'md', 'lg'];
  };
  
  card: {
    padding: ['sm', 'md', 'lg'];
    shadow: boolean;
  };
  
  input: {
    sizes: ['sm', 'md', 'lg'];
    states: ['default', 'error', 'disabled'];
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Color Consistency
*For any* theme (light or dark), all components should use colors only from the defined color palette and maintain proper contrast ratios
**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Size Standardization  
*For any* component size variant, the dimensions should follow the 4px grid system and meet minimum touch target requirements
**Validates: Requirements 2.1, 2.2, 2.5**

### Property 3: Component Simplicity
*For any* UI component, it should use only basic CSS properties without complex effects like backdrop-filter or multiple box-shadows
**Validates: Requirements 3.2, 3.3, 3.4**

### Property 4: Typography Consistency
*For any* text element, it should use only the three defined font sizes and two font weights
**Validates: Requirements 4.1, 4.2**

### Property 5: Mobile Optimization
*For any* interactive element on mobile, it should have a minimum touch target of 44px and proper spacing
**Validates: Requirements 5.1, 5.3**

### Property 6: Performance Optimization
*For any* CSS rule, it should not use performance-heavy properties like backdrop-filter, complex gradients, or excessive animations
**Validates: Requirements 8.1, 8.4**

### Property 7: Accessibility Compliance
*For any* interactive element, it should have proper focus indicators and meet WCAG contrast requirements
**Validates: Requirements 9.1, 9.2**

### Property 8: Design Token Usage
*For any* component style, it should reference design tokens rather than hardcoded values
**Validates: Requirements 10.1, 10.2**

## Error Handling

### CSS Fallbacks

```css
/* Системные шрифты с fallback */
body {
  font-family: 
    -apple-system, 
    BlinkMacSystemFont, 
    'Segoe UI', 
    Roboto, 
    sans-serif;
}

/* Цвета с fallback */
.button-primary {
  background-color: #10b981; /* fallback */
  background-color: var(--color-primary, #10b981);
}

/* Размеры с fallback */
.button-md {
  height: 40px; /* fallback */
  height: var(--button-height-md, 40px);
}
```

### Component Error States

```typescript
// Обработка ошибок в компонентах
const Button = ({ variant = 'primary', size = 'md', ...props }) => {
  // Валидация пропсов
  const validVariant = ['primary', 'secondary', 'ghost'].includes(variant) 
    ? variant 
    : 'primary';
    
  const validSize = ['sm', 'md', 'lg'].includes(size) 
    ? size 
    : 'md';
    
  return (
    <button 
      className={`button button-${validVariant} button-${validSize}`}
      {...props}
    />
  );
};
```

## Testing Strategy

### Visual Regression Testing

```typescript
// Тестирование компонентов
describe('Button Component', () => {
  test('should render with correct styles for each variant', () => {
    const variants = ['primary', 'secondary', 'ghost'];
    
    variants.forEach(variant => {
      render(<Button variant={variant}>Test</Button>);
      // Проверяем правильные CSS классы
      expect(screen.getByRole('button')).toHaveClass(`button-${variant}`);
    });
  });
  
  test('should meet minimum touch target size on mobile', () => {
    render(<Button size="sm">Test</Button>);
    const button = screen.getByRole('button');
    
    // Проверяем минимальный размер 44px
    expect(button).toHaveStyle('min-height: 44px');
  });
});
```

### Performance Testing

```typescript
// Тестирование производительности CSS
describe('CSS Performance', () => {
  test('should not use heavy CSS properties', () => {
    const cssContent = fs.readFileSync('src/index.css', 'utf8');
    
    // Проверяем отсутствие тяжелых свойств
    expect(cssContent).not.toMatch(/backdrop-filter/);
    expect(cssContent).not.toMatch(/filter: blur/);
    expect(cssContent).not.toMatch(/box-shadow:.*,.*,.*,/); // множественные тени
  });
  
  test('should use design tokens', () => {
    const cssContent = fs.readFileSync('src/index.css', 'utf8');
    
    // Проверяем использование CSS переменных
    expect(cssContent).toMatch(/var\(--color-/);
    expect(cssContent).toMatch(/var\(--size-/);
  });
});
```

### Accessibility Testing

```typescript
// Тестирование доступности
describe('Accessibility', () => {
  test('should have proper contrast ratios', async () => {
    render(<Button variant="primary">Test</Button>);
    
    const button = screen.getByRole('button');
    const styles = getComputedStyle(button);
    
    // Проверяем контрастность
    const contrastRatio = calculateContrastRatio(
      styles.backgroundColor,
      styles.color
    );
    
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });
  
  test('should have focus indicators', () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    
    button.focus();
    
    // Проверяем наличие focus ring
    expect(button).toHaveStyle('outline: 2px solid var(--color-primary)');
  });
});
```

### Integration Testing

```typescript
// Тестирование интеграции компонентов
describe('Component Integration', () => {
  test('should maintain consistent spacing in product grid', () => {
    const products = generateMockProducts(6);
    
    render(<ProductGrid products={products} />);
    
    const cards = screen.getAllByTestId('product-card');
    
    // Проверяем одинаковые размеры карточек
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      expect(rect.width).toBeCloseTo(cards[0].getBoundingClientRect().width, 1);
    });
  });
});
```

## Implementation Guidelines

### CSS Organization

```
src/styles/
├── tokens.css          # Design tokens
├── base.css           # Base styles, resets
├── components/        # Component styles
│   ├── button.css
│   ├── card.css
│   └── input.css
├── layouts/           # Layout styles
│   ├── grid.css
│   └── container.css
└── utilities.css      # Utility classes
```

### Component Development

1. **Start with design tokens** - всегда используйте CSS переменные
2. **Keep it simple** - избегайте сложных эффектов
3. **Mobile first** - начинайте с мобильной версии
4. **Test accessibility** - проверяйте контрастность и focus states
5. **Performance first** - избегайте тяжелых CSS свойств

### Migration Strategy

1. **Phase 1**: Обновить design tokens
2. **Phase 2**: Упростить базовые компоненты (Button, Card, Input)
3. **Phase 3**: Обновить layout компоненты
4. **Phase 4**: Упростить feature компоненты (ProductCard, Navigation)
5. **Phase 5**: Оптимизировать производительность и тестирование