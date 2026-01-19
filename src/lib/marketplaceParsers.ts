// Типы для импорта товаров с маркетплейсов
export interface MarketplaceProduct {
  title: string;
  price: number;
  old_price?: number;
  description: string;
  category?: string;
  characteristics: Record<string, string>;
  composition?: string;
  images: string[];
  in_stock: boolean;
}

export interface MarketplaceParser {
  canParse(url: string): boolean;
  parse(url: string): Promise<MarketplaceProduct>;
}

 async function fetchViaBackendProxy(
   targetUrl: string,
   init: RequestInit & { timeoutMs?: number } = {}
 ): Promise<Response> {
   const { timeoutMs = 15000, ...fetchInit } = init;

   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
   try {
     const response = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`, {
       ...fetchInit,
       signal: controller.signal
     });
     clearTimeout(timeoutId);
     return response;
   } catch (e) {
     clearTimeout(timeoutId);
     throw e;
   }
 }

 function buildProxyUrls(targetUrl: string): string[] {
   const encoded = encodeURIComponent(targetUrl);
   return [
     `https://corsproxy.io/?${encoded}`,
     `https://api.allorigins.win/raw?url=${encoded}`,
     `https://r.jina.ai/http://${targetUrl.replace(/^https?:\/\//, '')}`
   ];
 }

 async function fetchWithProxyFallback(
   targetUrl: string,
   init: RequestInit & { timeoutMs?: number } = {}
 ): Promise<Response> {
   const { timeoutMs = 15000, ...fetchInit } = init;

   const errors: string[] = [];
   const proxyUrls = buildProxyUrls(targetUrl);

   for (const requestUrl of proxyUrls) {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
     try {
       const response = await fetch(requestUrl, {
         ...fetchInit,
         signal: controller.signal
       });
       clearTimeout(timeoutId);

       if (response.ok) {
         return response;
       }

       errors.push(`${new URL(requestUrl).hostname}: HTTP ${response.status}`);
     } catch (e: any) {
       clearTimeout(timeoutId);
       if (e?.name === 'AbortError') {
         errors.push(`${new URL(requestUrl).hostname}: timeout`);
       } else {
         errors.push(`${new URL(requestUrl).hostname}: ${e?.message || 'fetch failed'}`);
       }
     }
   }

   throw new Error(`Не удалось загрузить данные из-за ограничений CORS/прокси. Попробуйте позже. (${errors.join('; ')})`);
 }

// Определение маркетплейса по URL
export function detectMarketplace(url: string): 'wildberries' | 'ozon' | 'yandex' | null {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('wildberries.ru') || urlLower.includes('wb.ru')) {
    return 'wildberries';
  }
  if (urlLower.includes('ozon.ru')) {
    return 'ozon';
  }
  if (urlLower.includes('market.yandex.ru')) {
    return 'yandex';
  }
  
  return null;
}

// Парсер для Wildberries
class WildberriesParser implements MarketplaceParser {
  canParse(url: string): boolean {
    return detectMarketplace(url) === 'wildberries';
  }

  private extractProductId(url: string): string | null {
    // Извлекаем ID товара из URL
    // Примеры: https://www.wildberries.ru/catalog/315215210/detail.aspx
    const match = url.match(/\/catalog\/(\d+)/);
    return match ? match[1] : null;
  }

  async parse(url: string): Promise<MarketplaceProduct> {
    try {
      const productId = this.extractProductId(url);
      
      if (!productId) {
        throw new Error('Не удалось извлечь ID товара из ссылки Wildberries');
      }

      // Используем публичное API Wildberries для получения данных о товаре
      const apiUrl = `https://card.wb.ru/cards/v1/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm=${productId}`;

      try {
        let response = await fetchViaBackendProxy(apiUrl, {
          headers: {
            'Accept': 'application/json'
          },
          timeoutMs: 15000
        });

        if (!response.ok) {
          response = await fetchWithProxyFallback(apiUrl, {
            headers: {
              'Accept': 'application/json'
            },
            timeoutMs: 15000
          });
        }
        
        const data = await response.json();
        
        if (!data.data?.products || data.data.products.length === 0) {
          throw new Error('Товар не найден на Wildberries');
        }
        
        const product = data.data.products[0];
        
        // Извлекаем данные
        const title = product.name || 'Товар с Wildberries';
        
        // Цена в копейках, конвертируем в рубли
        const price = product.salePriceU ? product.salePriceU / 100 : 0;
        const old_price = product.priceU && product.priceU !== product.salePriceU 
          ? product.priceU / 100 
          : undefined;
        
        // Описание
        const description = product.description || title;
        
        // Изображения - формируем URL из данных API
        const images: string[] = [];
        if (product.mediaFiles && product.mediaFiles.length > 0) {
          // Формат URL изображений WB
          const vol = Math.floor(parseInt(productId) / 100000);
          const part = Math.floor(parseInt(productId) / 1000);
          
          // Добавляем несколько изображений
          for (let i = 1; i <= Math.min(product.mediaFiles.length, 5); i++) {
            const imgUrl = `https://basket-${vol < 10 ? '0' + vol : vol}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/big/${i}.webp`;
            images.push(imgUrl);
          }
        }
        
        // Если нет изображений из mediaFiles, используем стандартный формат
        if (images.length === 0) {
          const vol = Math.floor(parseInt(productId) / 100000);
          const part = Math.floor(parseInt(productId) / 1000);
          for (let i = 1; i <= 5; i++) {
            images.push(`https://basket-${vol < 10 ? '0' + vol : vol}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/big/${i}.webp`);
          }
        }
        
        // Характеристики
        const characteristics: Record<string, string> = {};
        if (product.options && Array.isArray(product.options)) {
          product.options.forEach((option: any) => {
            if (option.name && option.value) {
              characteristics[option.name] = option.value;
            }
          });
        }
        
        // Состав
        const composition = product.composition || undefined;
        
        // Наличие
        const in_stock = product.totalQuantity > 0;
        
        return {
          title,
          price,
          old_price,
          description,
          characteristics,
          composition,
          images: images.slice(0, 10),
          in_stock
        };
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Превышено время ожидания ответа от Wildberries. Попробуйте позже.');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Wildberries parsing error:', error);
      if (error.message.includes('время ожидания') || error.message.includes('не найден') || error.message.includes('извлечь ID')) {
        throw error;
      }
      if (error.message.includes('CORS/прокси')) {
        throw error;
      }
      throw new Error('Не удалось загрузить данные с Wildberries. Проверьте ссылку.');
    }
  }
}

// Парсер для Ozon
class OzonParser implements MarketplaceParser {
  canParse(url: string): boolean {
    return detectMarketplace(url) === 'ozon';
  }

  private extractProductId(url: string): string | null {
    // Извлекаем ID товара из URL Ozon
    // Примеры: https://www.ozon.ru/product/название-123456789/
    const match = url.match(/\/product\/[^\/]+-(\d+)/);
    return match ? match[1] : null;
  }

  async parse(url: string): Promise<MarketplaceProduct> {
    try {
      const productId = this.extractProductId(url);
      
      if (!productId) {
        throw new Error('Не удалось извлечь ID товара из ссылки Ozon');
      }

      // Используем публичное API Ozon
      const apiUrl = `https://www.ozon.ru/api/composer-api.bx/page/json/v2?url=/product/-${productId}/`;

      try {
        const response = await fetchWithProxyFallback(apiUrl, {
          headers: {
            'Accept': 'application/json'
          },
          timeoutMs: 15000
        });
        
        const data = await response.json();
        
        // Ищем данные о товаре в ответе API
        const productData = data.widgetStates?.['webProductHeading-1']?.data || 
                           data.widgetStates?.['webPrice-1']?.data;
        
        if (!productData) {
          throw new Error('Товар не найден на Ozon');
        }
        
        const title = productData.name || 'Товар с Ozon';
        
        // Цена
        const price = productData.price?.price || productData.finalPrice || 0;
        const old_price = productData.price?.originalPrice || productData.originalPrice || undefined;
        
        const description = productData.description || title;
        
        // Изображения
        const images: string[] = [];
        if (productData.images && Array.isArray(productData.images)) {
          productData.images.forEach((img: any) => {
            if (img.url) {
              images.push(img.url);
            }
          });
        }
        
        // Характеристики
        const characteristics: Record<string, string> = {};
        if (productData.characteristics && Array.isArray(productData.characteristics)) {
          productData.characteristics.forEach((char: any) => {
            if (char.key && char.value) {
              characteristics[char.key] = char.value;
            }
          });
        }
        
        const in_stock = productData.inStock !== false;
        
        return {
          title,
          price,
          old_price,
          description,
          characteristics,
          images: images.slice(0, 10),
          in_stock
        };
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Превышено время ожидания ответа от Ozon. Попробуйте позже.');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Ozon parsing error:', error);
      if (error.message.includes('время ожидания') || error.message.includes('не найден') || error.message.includes('извлечь ID')) {
        throw error;
      }
      throw new Error('Не удалось загрузить данные с Ozon. Проверьте ссылку.');
    }
  }
}

// Парсер для Яндекс Маркет
class YandexMarketParser implements MarketplaceParser {
  canParse(url: string): boolean {
    return detectMarketplace(url) === 'yandex';
  }

  private extractProductId(url: string): string | null {
    // Извлекаем ID товара из URL Яндекс Маркет
    // Примеры: https://market.yandex.ru/product--название/123456789
    const match = url.match(/\/product--[^\/]+\/(\d+)/);
    return match ? match[1] : null;
  }

  async parse(url: string): Promise<MarketplaceProduct> {
    try {
      const productId = this.extractProductId(url);
      
      if (!productId) {
        throw new Error('Не удалось извлечь ID товара из ссылки Яндекс Маркет');
      }

      // Используем публичное API Яндекс Маркет
      const apiUrl = `https://market.yandex.ru/api/resolve/?r=productCard&productId=${productId}`;

      try {
        const response = await fetchWithProxyFallback(apiUrl, {
          headers: {
            'Accept': 'application/json'
          },
          timeoutMs: 15000
        });
        
        const data = await response.json();
        
        const productData = data.product || data.data?.product;
        
        if (!productData) {
          throw new Error('Товар не найден на Яндекс Маркет');
        }
        
        const title = productData.name || productData.title || 'Товар с Яндекс Маркет';
        
        // Цена
        const price = productData.price?.value || productData.offers?.[0]?.price?.value || 0;
        const old_price = productData.oldPrice?.value || undefined;
        
        const description = productData.description || title;
        
        // Изображения
        const images: string[] = [];
        if (productData.pictures && Array.isArray(productData.pictures)) {
          productData.pictures.forEach((pic: any) => {
            if (pic.url) {
              images.push(pic.url);
            } else if (pic.original) {
              images.push(pic.original);
            }
          });
        }
        
        // Характеристики
        const characteristics: Record<string, string> = {};
        if (productData.specs && Array.isArray(productData.specs)) {
          productData.specs.forEach((spec: any) => {
            if (spec.name && spec.value) {
              characteristics[spec.name] = spec.value;
            }
          });
        }
        
        const in_stock = productData.isAvailable !== false;
        
        return {
          title,
          price,
          old_price,
          description,
          characteristics,
          images: images.slice(0, 10),
          in_stock
        };
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Превышено время ожидания ответа от Яндекс Маркет. Попробуйте позже.');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Yandex Market parsing error:', error);
      if (error.message.includes('время ожидания') || error.message.includes('не найден') || error.message.includes('извлечь ID')) {
        throw error;
      }
      throw new Error('Не удалось загрузить данные с Яндекс Маркет. Проверьте ссылку.');
    }
  }
}

// Фабрика парсеров
export class MarketplaceParserFactory {
  private parsers: MarketplaceParser[] = [
    new WildberriesParser(),
    new OzonParser(),
    new YandexMarketParser()
  ];

  getParser(url: string): MarketplaceParser | null {
    return this.parsers.find(parser => parser.canParse(url)) || null;
  }

  async parseProduct(url: string): Promise<MarketplaceProduct> {
    const parser = this.getParser(url);
    
    if (!parser) {
      throw new Error('Неподдерживаемый маркетплейс. Поддерживаются: Wildberries, Ozon, Яндекс Маркет');
    }
    
    return await parser.parse(url);
  }
}

// Экспортируем единственный экземпляр
export const marketplaceParser = new MarketplaceParserFactory();
