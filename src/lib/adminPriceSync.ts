import { priceUpdateService } from './priceUpdateService';

// Автоматическое обновление цен при входе в админку
export async function syncImportedPricesOnAdminLoad() {
  try {
    console.log('🔄 Checking for stale imported product prices...');
    
    // Обновляем только товары, которые не проверялись более 24 часов
    const results = await priceUpdateService.updateStaleImportedPrices(24);
    
    if (results.updated > 0) {
      console.log(`✅ Updated ${results.updated} product prices`);
    }
    
    if (results.failed > 0) {
      console.warn(`⚠️ Failed to update ${results.failed} products`);
      console.warn('Errors:', results.errors);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Failed to sync prices:', error);
    // Не бросаем ошибку, чтобы не блокировать загрузку админки
    return null;
  }
}

// Запуск синхронизации в фоне (не блокирует UI)
export function startBackgroundPriceSync() {
  // Запускаем синхронизацию через небольшую задержку, чтобы не замедлять загрузку
  setTimeout(() => {
    syncImportedPricesOnAdminLoad();
  }, 2000);
}
