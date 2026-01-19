import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartState, CartItem, Product } from '@/types';

interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);

      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        
        const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        return {
          items: updatedItems,
          total: newTotal,
          itemCount: newItemCount,
        };
      }

      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images[0],
        type: product.type,
      };

      const newItems = [...state.items, newItem];
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    }

    case 'REMOVE_ITEM': {
      const filteredItems = state.items.filter(item => item.id !== action.payload.productId);
      const newTotal = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newItemCount = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: filteredItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId } });
      }

      const updatedItems = state.items.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );

      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: updatedItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    }

    case 'CLEAR_CART':
      return {
        items: [],
        total: 0,
        itemCount: 0,
      };

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
}

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Синхронизация между вкладками
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'surpriset-cart' && e.newValue) {
        try {
          const newCart = JSON.parse(e.newValue)
          dispatch({ type: 'LOAD_CART', payload: newCart })
        } catch (error) {
          console.error('Failed to sync cart from storage:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('surpriset-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Валидируем структуру данных
        if (parsedCart && typeof parsedCart === 'object' && Array.isArray(parsedCart.items)) {
          dispatch({ type: 'LOAD_CART', payload: parsedCart });
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
        // Очищаем поврежденные данные
        localStorage.removeItem('surpriset-cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes (с debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('surpriset-cart', JSON.stringify(state));
        
        // Уведомляем другие вкладки об изменении
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'surpriset-cart',
          newValue: JSON.stringify(state),
          storageArea: localStorage
        }));
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    }, 100); // Debounce на 100ms

    return () => clearTimeout(timeoutId);
  }, [state]);

  const addItem = (product: Product, quantity = 1) => {
    // КРИТИЧНО: В корзину можно добавлять только наборы (type='bundle')
    if (product.type !== 'bundle') {
      throw new Error('В корзину можно добавлять только наборы. Отдельные товары добавляйте в набор.');
    }
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}