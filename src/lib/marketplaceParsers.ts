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
 ): Promise<MarketplaceProduct> {
   const { timeoutMs = 15000, ...fetchInit } = init;

   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
   try {
     // Определяем URL API сервера
     // Приоритет: переменная окружения > автоматическое определение через Express прокси
     let apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
     if (!apiBaseUrl) {
       // Автоматическое определение - используем Express прокси на том же домене
       const hostname = window.location.hostname;
       const protocol = window.location.protocol;
       const port = window.location.port ? `:${window.location.port}` : '';
       
       if (hostname === 'localhost' || hostname === '127.0.0.1') {
         // Локальная разработка - напрямую к Python API
         apiBaseUrl = 'http://localhost:5001';
       } else {
         // Продакшен - используем Express прокси на том же домене
         // Express сервер проксирует запросы к Python API
         apiBaseUrl = `${protocol}//${hostname}${port}`;
       }
     }
     
     if (!targetUrl || !targetUrl.trim()) {
       console.error('❌ fetchViaBackendProxy: targetUrl is empty', { targetUrl });
       throw new Error('URL товара не указан');
     }
     
     const requestUrl = `${apiBaseUrl}/api/parse?url=${encodeURIComponent(targetUrl)}`;
     console.log('📤 Sending request to:', requestUrl);
     console.log('📤 Target URL:', targetUrl);
     
     const response = await fetch(requestUrl, {
       ...fetchInit,
       signal: controller.signal
     });
     
     clearTimeout(timeoutId);
     
     if (!response.ok) {
       const errorData = await response.json().catch(() => ({}));
       throw new Error(errorData.error || `HTTP ${response.status}`);
     }
     
     const data = await response.json();
     
     // Если Python API вернул ошибку
     if (data.success === false) {
       throw new Error(data.error || 'Ошибка Python API');
     }
     
     // Возвращаем данные напрямую
     if (data.data) {
       return data.data as MarketplaceProduct;
     }
     
     throw new Error('Неожиданный формат ответа от API');
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

      // Используем Python API через Playwright
      try {
        // fetchViaBackendProxy теперь возвращает данные напрямую
        const productData = await fetchViaBackendProxy(url, {
          headers: {
            'Accept': 'application/json'
          },
          timeoutMs: 60000  // Увеличиваем таймаут для Playwright (может быть долго)
        });
        
        return productData;
        
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

      // Используем Python API через Playwright
      try {
        // fetchViaBackendProxy теперь возвращает данные напрямую
        const productData = await fetchViaBackendProxy(url, {
          headers: {
            'Accept': 'application/json'
          },
          timeoutMs: 60000  // Увеличиваем таймаут для Playwright
        });
        
        return productData;
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
    // Примеры: https://market.yandex.ru/card/товар-со-слешами/123456789?param=value
    // Сначала убираем параметры запроса
    const urlWithoutParams = url.split('?')[0];
    const match = urlWithoutParams.match(/\/card\/(.+?)\/(\d+)/);
    return match ? match[2] : null;
  }

  async parse(url: string): Promise<MarketplaceProduct> {
    try {
      const productId = this.extractProductId(url);
      
      if (!productId) {
        throw new Error('Не удалось извлечь ID товара из ссылки Яндекс Маркет');
      }

      // Используем Python API через Playwright
      try {
        // fetchViaBackendProxy теперь возвращает данные напрямую
        const productData = await fetchViaBackendProxy(url, {
          headers: {
            'Accept': 'application/json'
          },
          timeoutMs: 60000  // Увеличиваем таймаут для Playwright
        });
        
        return productData;
      } catch (fetchError: any) {
        console.error('Yandex Market fetch error:', fetchError);
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
    console.log('🔍 MarketplaceParserFactory.parseProduct called with URL:', url);
    
    if (!url || !url.trim()) {
      console.error('❌ parseProduct: URL is empty', { url });
      throw new Error('URL товара не указан');
    }
    
    const trimmedUrl = url.trim();
    console.log('🔍 Trimmed URL:', trimmedUrl);
    
    const parser = this.getParser(trimmedUrl);
    
    if (!parser) {
      console.error('❌ parseProduct: No parser found for URL:', trimmedUrl);
      throw new Error('Неподдерживаемый маркетплейс. Поддерживаются: Wildberries, Ozon, Яндекс Маркет');
    }
    
    console.log('✅ Using parser:', parser.constructor.name);
    return await parser.parse(trimmedUrl);
  }
}

// Экспортируем единственный экземпляр
export const marketplaceParser = new MarketplaceParserFactory();
