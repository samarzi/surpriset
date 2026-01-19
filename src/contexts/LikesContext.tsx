import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { LikesState } from '@/types';
import { likesService } from '@/lib/database';
import { eventBus, EVENTS } from '@/lib/eventBus';

interface LikesContextType {
  state: LikesState;
  toggleLike: (productId: string) => Promise<void>;
  isLiked: (productId: string) => boolean;
  getLikedProducts: () => string[];
  refreshProductLikes: () => void;
}

const LikesContext = createContext<LikesContextType | undefined>(undefined);

type LikesAction = 
  | { type: 'TOGGLE_LIKE'; productId: string }
  | { type: 'SET_LIKES'; likes: Set<string> }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'REFRESH_PRODUCTS' };

function likesReducer(state: LikesState, action: LikesAction): LikesState {
  switch (action.type) {
    case 'TOGGLE_LIKE': {
      const newLikedProducts = new Set(state.likedProducts);
      if (newLikedProducts.has(action.productId)) {
        newLikedProducts.delete(action.productId);
      } else {
        newLikedProducts.add(action.productId);
      }
      return {
        ...state,
        likedProducts: newLikedProducts,
      };
    }
    case 'SET_LIKES':
      return {
        ...state,
        likedProducts: action.likes,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
      };
    case 'REFRESH_PRODUCTS':
      // Trigger refresh events using eventBus
      eventBus.emit(EVENTS.PRODUCTS_REFRESH);
      eventBus.emit(EVENTS.LIKES_UPDATED);
      console.log('💖 Likes refresh events emitted');
      return state;
    default:
      return state;
  }
}

const LIKES_STORAGE_KEY = 'surpriset-likes';

// Generate or get user session ID
function getUserSession(): string {
  let sessionId = localStorage.getItem('surpriset-session-id');
  if (!sessionId) {
    sessionId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('surpriset-session-id', sessionId);
  }
  return sessionId;
}

export function LikesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(likesReducer, {
    likedProducts: new Set<string>(),
    isLoading: false,
  });

  // Load likes from localStorage and Supabase on mount
  useEffect(() => {
    const initLikes = async () => {
      try {
        // Local likes from previous sessions in this browser/webview
        let localLikes: string[] = [];
        const savedLikes = localStorage.getItem(LIKES_STORAGE_KEY);
        if (savedLikes) {
          try {
            localLikes = JSON.parse(savedLikes) as string[];
          } catch (err) {
            console.error('Error parsing likes from localStorage:', err);
          }
        }

        // Remote likes stored in Supabase for this user session
        let remoteLikes: string[] = [];
        try {
          const sessionId = getUserSession();
          remoteLikes = await likesService.getUserLikes(sessionId);
        } catch (err) {
          console.error('Error loading likes from Supabase:', err);
        }

        // Merge and deduplicate
        const mergedLikes = new Set<string>([...localLikes, ...remoteLikes]);
        dispatch({ type: 'SET_LIKES', likes: mergedLikes });
      } catch (error) {
        console.error('Error initializing likes state:', error);
      }
    };

    void initLikes();
  }, []);

  // Save likes to localStorage whenever they change
  useEffect(() => {
    try {
      const likesArray = Array.from(state.likedProducts);
      localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likesArray));
    } catch (error) {
      console.error('Error saving likes to localStorage:', error);
    }
  }, [state.likedProducts]);

  const toggleLike = async (productId: string) => {
    const userSession = getUserSession();
    const wasLiked = state.likedProducts.has(productId);
    
    // Оптимистично обновляем UI и ЛОКАЛЬНО сохраняем лайк,
    // даже если Supabase недоступен. Так пользователь видит, что лайк сработал.
    dispatch({ type: 'TOGGLE_LIKE', productId });
    
    try {
      if (wasLiked) {
        await likesService.removeLike(productId, userSession);
      } else {
        await likesService.addLike(productId, userSession);
      }
      
      // Попросим продукты перезагрузиться, чтобы likes_count подтянулся, если бэкенд обновился
      dispatch({ type: 'REFRESH_PRODUCTS' });
    } catch (error) {
      // Не откатываем лайк, просто логируем ошибку, чтобы UI оставался отзывчивым
      console.error('Error toggling like (keeping local state):', error);
    }
  };

  const isLiked = (productId: string) => {
    return state.likedProducts.has(productId);
  };

  const getLikedProducts = () => {
    return Array.from(state.likedProducts);
  };

  const refreshProductLikes = () => {
    dispatch({ type: 'REFRESH_PRODUCTS' });
  };

  const value: LikesContextType = {
    state,
    toggleLike,
    isLiked,
    getLikedProducts,
    refreshProductLikes,
  };

  return (
    <LikesContext.Provider value={value}>
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);
  if (context === undefined) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
}