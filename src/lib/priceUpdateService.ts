import { productService } from './database';
import { marketplaceParser } from './marketplaceParsers';
import { Product } from '@/types';

export class PriceUpdateService {
  // Проверка и обновление цен для всех импортированных товаров
  async updateAllImportedPrices(): Promise<{
    updated: number;
    failed: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    const results = {
      updated: 0,
      failed: 0,
      errors: [] as Array<{ productId: string; error: string }>
    };

    try {
      // Получаем все товары
      const allProducts = await productService.getAll();
      
      // Фильтруем только импортированные товары с source_url
      const importedProducts = allProducts.filter(
        (p: Product) => p.is_imported && p.source_url
      );

      console.log(`🔄 Checking prices for ${importedProducts.length} imported products...`);

      // Обновляем цены для каждого товара
      for (const product of importedProducts) {
        try {
          await this.updateProductPrice(product);
          results.updated++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            productId: product.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`✅ Price update complete: ${results.updated} updated, ${results.failed} failed`);
      
      return results;
    } catch (error) {
      console.error('❌ Failed to update prices:', error);
      throw error;
    }
  }

  // Обновление цены для конкретного товара
  async updateProductPrice(product: Product): Promise<void> {
    if (!product.source_url) {
      throw new Error('Product has no source URL');
    }

    try {
      console.log(`🔍 Checking price for: ${product.name}`);
      
      // Парсим актуальные данные с маркетплейса
      const marketplaceData = await marketplaceParser.parseProduct(product.source_url);
      
      // Используем индивидуальную наценку товара или 20% по умолчанию
      const marginPercent = product.margin_percent ?? 20;
      const marginMultiplier = 1 + (marginPercent / 100);
      
      // Применяем наценку
      const newPrice = Math.round(marketplaceData.price * marginMultiplier);
      const newOriginalPrice = marketplaceData.old_price 
        ? Math.round(marketplaceData.old_price * marginMultiplier) 
        : null;
      
      // Проверяем, изменилась ли цена
      const priceChanged = newPrice !== product.price || 
                          newOriginalPrice !== product.original_price;
      
      // Проверяем наличие
      const stockChanged = marketplaceData.in_stock !== (product.status === 'in_stock');
      
      if (priceChanged || stockChanged) {
        console.log(`💰 Price/stock changed for ${product.name}:`);
        if (priceChanged) {
          console.log(`   Old price: ${product.price}₽ → New price: ${newPrice}₽`);
        }
        if (stockChanged) {
          console.log(`   Stock: ${product.status} → ${marketplaceData.in_stock ? 'in_stock' : 'out_of_stock'}`);
        }
        
        // Обновляем товар (наценка не меняется, только цена)
        await productService.update(product.id, {
          price: newPrice,
          original_price: newOriginalPrice,
          status: marketplaceData.in_stock ? 'in_stock' : 'out_of_stock',
          margin_percent: marginPercent, // Сохраняем текущую наценку
          last_price_check_at: new Date().toISOString()
        } as any);
      } else {
        console.log(`✓ Price unchanged for ${product.name}`);
        
        // Обновляем только время проверки
        await productService.update(product.id, {
          last_price_check_at: new Date().toISOString()
        } as any);
      }
    } catch (error) {
      console.error(`❌ Failed to update price for ${product.name}:`, error);
      throw error;
    }
  }

  // Проверка, нужно ли обновлять цену (прошло ли достаточно времени)
  shouldUpdatePrice(product: Product, hoursThreshold: number = 24): boolean {
    if (!product.is_imported || !product.source_url) {
      return false;
    }

    if (!product.last_price_check_at) {
      return true; // Никогда не проверялось
    }

    const lastCheck = new Date(product.last_price_check_at);
    const now = new Date();
    const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastCheck >= hoursThreshold;
  }

  // Обновление цен только для товаров, которые давно не проверялись
  async updateStaleImportedPrices(hoursThreshold: number = 24): Promise<{
    updated: number;
    failed: number;
    skipped: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    const results = {
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ productId: string; error: string }>
    };

    try {
      const allProducts = await productService.getAll();
      const importedProducts = allProducts.filter(
        (p: Product) => p.is_imported && p.source_url
      );

      console.log(`🔄 Checking ${importedProducts.length} imported products for stale prices...`);

      for (const product of importedProducts) {
        if (this.shouldUpdatePrice(product, hoursThreshold)) {
          try {
            await this.updateProductPrice(product);
            results.updated++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              productId: product.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        } else {
          results.skipped++;
        }
      }

      console.log(`✅ Stale price update complete: ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`);
      
      return results;
    } catch (error) {
      console.error('❌ Failed to update stale prices:', error);
      throw error;
    }
  }
}

// Экспортируем единственный экземпляр
export const priceUpdateService = new PriceUpdateService();
