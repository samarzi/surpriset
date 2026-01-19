import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CustomBundleState, Product, BundleItem } from '@/types';

interface CustomBundleContextType {
  state: CustomBundleState;
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearBundle: () => void;
  setStep: (step: CustomBundleState['step']) => void;
  canAddMore: boolean;
  isValidBundle: boolean;
}

type CustomBundleAction =
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'REMOVE_PRODUCT'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_BUNDLE' }
  | { type: 'SET_STEP'; payload: CustomBundleState['step'] }
  | { type: 'LOAD_BUNDLE'; payload: CustomBundleState };

const CustomBundleContext = createContext<CustomBundleContextType | undefined>(undefined);

const MIN_ITEMS = 5;
const MAX_ITEMS = 20;

function getTotalQuantity(items: BundleItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function recalcState(state: CustomBundleState, items: BundleItem[]): CustomBundleState {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalQuantity = getTotalQuantity(items);
  const isValid = totalQuantity >= MIN_ITEMS && totalQuantity <= MAX_ITEMS;

  return {
    ...state,
    items,
    total,
    isValid,
  };
}

function customBundleReducer(state: CustomBundleState, action: CustomBundleAction): CustomBundleState {
  switch (action.type) {
    case 'ADD_PRODUCT': {
      const product = action.payload;
      
      // Проверяем, что это продукт, а не готовый набор
      if (product.type !== 'product') {
        return state;
      }

      // Проверяем общий лимит в 20 единиц товара
      const currentTotalQuantity = getTotalQuantity(state.items);
      if (currentTotalQuantity >= MAX_ITEMS) {
        return state;
      }

      const existingIndex = state.items.findIndex(item => item.product.id === product.id);
      let newItems: BundleItem[];

      if (existingIndex !== -1) {
        newItems = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [
          ...state.items,
          { product, quantity: 1 },
        ];
      }

      return recalcState(state, newItems);
    }

    case 'REMOVE_PRODUCT': {
      const filteredItems = state.items.filter(item => item.product.id !== action.payload);
      return recalcState(state, filteredItems);
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;

      // Если количество стало 0 или меньше — просто удаляем товар из набора
      if (quantity <= 0) {
        const filteredItems = state.items.filter(item => item.product.id !== productId);
        return recalcState(state, filteredItems);
      }

      const existingItem = state.items.find(item => item.product.id === productId);
      if (!existingItem) {
        return state;
      }

      const currentTotalQuantity = getTotalQuantity(state.items);
      const diff = quantity - existingItem.quantity;

      // Не даём превысить общий лимит
      if (diff > 0 && currentTotalQuantity + diff > MAX_ITEMS) {
        return state;
      }

      const updatedItems = state.items.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      );

      return recalcState(state, updatedItems);
    }

    case 'CLEAR_BUNDLE':
      return {
        items: [],
        total: 0,
        isValid: false,
        step: 'selection',
      };

    case 'SET_STEP':
      return {
        ...state,
        step: action.payload,
      };

    case 'LOAD_BUNDLE': {
      const loaded = action.payload as any;

      const rawItems: any[] = Array.isArray(loaded.items) ? loaded.items : [];
      const itemMap = new Map<string, BundleItem>();

      // Поддерживаем как новый формат ({ product, quantity }), так и старый (массив Product)
      for (const entry of rawItems) {
        if (!entry) continue;

        const product: Product = entry.product ?? entry;
        if (!product || !product.id) continue;

        const quantityFromEntry = typeof entry.quantity === 'number' && entry.quantity > 0
          ? entry.quantity
          : 1;

        const existing = itemMap.get(product.id);
        if (existing) {
          existing.quantity += quantityFromEntry;
        } else {
          itemMap.set(product.id, { product, quantity: quantityFromEntry });
        }
      }

      const items = Array.from(itemMap.values());
      const baseState: CustomBundleState = {
        ...state,
        items,
        step: loaded.step ?? 'selection',
      };

      return recalcState(baseState, items);
    }

    default:
      return state;
  }
}

const initialState: CustomBundleState = {
  items: [],
  total: 0,
  isValid: false,
  step: 'selection',
};

export function CustomBundleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(customBundleReducer, initialState);

  // Load bundle from localStorage on mount
  useEffect(() => {
    const savedBundle = localStorage.getItem('surpriset-custom-bundle');
    if (savedBundle) {
      try {
        const parsedBundle = JSON.parse(savedBundle);
        dispatch({ type: 'LOAD_BUNDLE', payload: parsedBundle });
      } catch (error) {
        console.error('Failed to load custom bundle from localStorage:', error);
      }
    }
  }, []);

  // Save bundle to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('surpriset-custom-bundle', JSON.stringify(state));
  }, [state]);

  const addProduct = (product: Product) => {
    dispatch({ type: 'ADD_PRODUCT', payload: product });
  };

  const removeProduct = (productId: string) => {
    dispatch({ type: 'REMOVE_PRODUCT', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearBundle = () => {
    dispatch({ type: 'CLEAR_BUNDLE' });
  };

  const setStep = (step: CustomBundleState['step']) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const canAddMore = totalQuantity < MAX_ITEMS;
  const isValidBundle = totalQuantity >= MIN_ITEMS && totalQuantity <= MAX_ITEMS;

  return (
    <CustomBundleContext.Provider
      value={{
        state,
        addProduct,
        removeProduct,
        updateQuantity,
        clearBundle,
        setStep,
        canAddMore,
        isValidBundle,
      }}
    >
      {children}
    </CustomBundleContext.Provider>
  );
}

export function useCustomBundle() {
  const context = useContext(CustomBundleContext);
  if (context === undefined) {
    throw new Error('useCustomBundle must be used within a CustomBundleProvider');
  }
  return context;
}