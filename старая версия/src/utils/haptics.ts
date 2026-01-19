/**
 * Утилиты для тактильной обратной связи (вибрация)
 */

// Проверяем поддержку вибрации
const supportsVibration = 'vibrate' in navigator;

// Проверяем, работаем ли в Telegram WebApp
const isTelegramWebApp = () => {
  return typeof window !== 'undefined' && 
         (window as any).Telegram && 
         (window as any).Telegram.WebApp;
};

/**
 * Легкая вибрация для обычных кликов
 */
export const lightHaptic = () => {
  if (isTelegramWebApp()) {
    try {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } catch {
      // Fallback на обычную вибрацию
      if (supportsVibration) {
        navigator.vibrate(10);
      }
    }
  } else if (supportsVibration) {
    navigator.vibrate(10);
  }
};

/**
 * Средняя вибрация для важных действий
 */
export const mediumHaptic = () => {
  if (isTelegramWebApp()) {
    try {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    } catch {
      // Fallback на обычную вибрацию
      if (supportsVibration) {
        navigator.vibrate(25);
      }
    }
  } else if (supportsVibration) {
    navigator.vibrate(25);
  }
};

/**
 * Сильная вибрация для критических действий
 */
export const heavyHaptic = () => {
  if (isTelegramWebApp()) {
    try {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    } catch {
      // Fallback на обычную вибрацию
      if (supportsVibration) {
        navigator.vibrate(50);
      }
    }
  } else if (supportsVibration) {
    navigator.vibrate(50);
  }
};

/**
 * Вибрация успеха
 */
export const successHaptic = () => {
  if (isTelegramWebApp()) {
    try {
      (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch {
      // Fallback на обычную вибрацию
      if (supportsVibration) {
        navigator.vibrate([10, 50, 10]);
      }
    }
  } else if (supportsVibration) {
    navigator.vibrate([10, 50, 10]);
  }
};

/**
 * Вибрация ошибки
 */
export const errorHaptic = () => {
  if (isTelegramWebApp()) {
    try {
      (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    } catch {
      // Fallback на обычную вибрацию
      if (supportsVibration) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  } else if (supportsVibration) {
    navigator.vibrate([100, 50, 100]);
  }
};