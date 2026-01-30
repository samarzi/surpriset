import json
import re
import time
import random
from typing import Dict, Any
from .base import MarketplaceParserInterface
from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError


class WildberriesParser(MarketplaceParserInterface):
    def parse(self) -> Dict[str, Any]:
        playwright = None
        browser = None
        try:
            playwright, browser, page = self._get_browser_page()
            
            # Для Wildberries параметры могут быть важны для вариантов товара
            clean_url = self.url
            
            # Открываем страницу товара с ожиданием networkidle
            page.goto(clean_url, wait_until='networkidle', timeout=self.timeout)
            self._wait_for_page_load(page)
            
            # ОТЛАДКА: Проверяем что на странице
            page_content = page.content()
            print(f"🔍 WB: URL после загрузки: {page.url}")
            print(f"🔍 WB: Размер страницы: {len(page_content)} символов")
            
            # Проверяем наличие ключевых элементов
            has_h1 = page.evaluate("() => !!document.querySelector('h1')")
            has_wb_data = page.evaluate("() => !!window.__WBLB_INITIAL_DATA__")
            has_product = page.evaluate("() => !!document.querySelector('[data-product-id]')")
            print(f"🔍 WB: Есть h1: {has_h1}, Есть __WBLB_INITIAL_DATA__: {has_wb_data}, Есть data-product-id: {has_product}")
            
            # Проверяем на капчу или блокировку
            page_url = page.url.lower()
            
            # Проверяем только URL - не содержимое страницы (может быть ложное срабатывание)
            if 'captcha' in page_url or 'challenge' in page_url:
                raise ValueError("Обнаружена капча на Wildberries. Попробуйте позже.")
            
            # Дополнительная задержка для загрузки JS
            time.sleep(random.uniform(3, 5))
            
            # Извлекаем данные из window.__WBLB_INITIAL_DATA__ или других JS объектов
            product_data = self._extract_product_data(page)
            
            # Проверяем наличие данных - Wildberries может использовать imt_name вместо name
            def has_valid_product_data(data):
                if not data:
                    return False
                # Проверяем все возможные поля для названия
                return bool(
                    data.get("name") or 
                    data.get("title") or 
                    data.get("imt_name") or
                    data.get("productName")
                )
            
            # Если JS данные не найдены, пробуем еще раз с перезагрузкой
            if not has_valid_product_data(product_data):
                print("⚠️ Wildberries: JS данные не найдены, пробуем перезагрузку...")
                time.sleep(3)
                page.reload(wait_until='networkidle', timeout=self.timeout)
                self._wait_for_page_load(page)
                product_data = self._extract_product_data(page)
            
            # Если JS данные все еще не найдены, используем DOM fallback
            if not has_valid_product_data(product_data):
                print("⚠️ Wildberries: JS данные не найдены после перезагрузки, используем DOM fallback")
                # Пробуем стандартный DOM fallback
                dom_data = self._extract_from_dom_only(page)
                if has_valid_product_data(dom_data):
                    print("✅ Wildberries: Данные извлечены из DOM")
                    product_data = dom_data
                else:
                    # Пробуем агрессивный поиск
                    print("⚠️ Wildberries: Стандартный DOM fallback не сработал, пробуем агрессивный поиск")
                    aggressive_dom = self._extract_from_dom_aggressive(page)
                    if has_valid_product_data(aggressive_dom):
                        print("✅ Wildberries: Данные извлечены агрессивным поиском в DOM")
                        product_data = aggressive_dom
                    else:
                        # Последняя попытка - извлечь хотя бы базовые данные из DOM
                        print("⚠️ Wildberries: Последняя попытка извлечения базовых данных...")
                        fallback_data = page.evaluate("""
                            () => {
                                const data = {};

                                // Название
                                const h1 = document.querySelector('h1');
                                if (h1) data.name = h1.textContent.trim();

                                // Цена
                                const priceEl = document.querySelector('[class*="price"]');
                                if (priceEl) {
                                    const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                                    if (priceText) data.salePriceU = parseInt(priceText) * 100;
                                }

                                // Изображения
                                const imgEls = document.querySelectorAll('img');
                                const images = [];
                                for (const img of imgEls) {
                                    const src = img.src || img.getAttribute('data-src');
                                    if (src && src.startsWith('http') && !src.includes('data:image') && src.includes('wb') && images.length < 3) {
                                        images.push(src);
                                    }
                                }
                                data.photos = images.map(src => ({fullSize: src.replace('https://', '')}));

                                return data;
                            }
                        """)
                        if fallback_data and (fallback_data.get('name') or fallback_data.get('salePriceU')):
                            print("✅ Wildberries: Базовые данные извлечены из fallback")
                            product_data = fallback_data
                        else:
                            raise ValueError("Не удалось извлечь данные товара с Wildberries. Возможно, товар недоступен или страница изменилась.")
            
            # Формируем результат
            # Название может быть в разных полях - imt_name основное для WB
            title = (product_data.get("imt_name") or 
                     product_data.get("name") or 
                     product_data.get("title") or 
                     product_data.get("productName") or 
                     "")
            
            print(f"🔍 Wildberries: Извлеченное название: '{title}'")
            
            # Проверяем валидность названия
            if not title or len(title) < 3:
                print(f"⚠️ Wildberries: Название '{title}' невалидно, ищем в DOM...")
                # Пробуем извлечь из DOM
                dom_title = page.evaluate("""
                    () => {
                        const selectors = [
                            'h1',
                            '.product-page__title',
                            '[data-product-name]',
                            '.product-card__title',
                            'h1[itemprop="name"]'
                        ];
                        
                        for (const selector of selectors) {
                            const el = document.querySelector(selector);
                            if (el) {
                                const text = el.textContent.trim();
                                if (text && text.length > 3) {
                                    return text;
                                }
                            }
                        }
                        return null;
                    }
                """)
                if dom_title:
                    print(f"✅ Wildberries: Название извлечено из DOM: '{dom_title}'")
                    title = dom_title
                else:
                    # Пробуем еще раз через extract_product_data
                    print("⚠️ Wildberries: Повторная попытка извлечения...")
                    product_data = self._extract_product_data(page)
                    if product_data:
                        title = product_data.get("imt_name") or product_data.get("name") or ""
            
            # Извлекаем цену
            price = 0
            # Пробуем разные форматы цен WB (в копейках)
            if product_data.get("salePriceU"):
                price = product_data.get("salePriceU", 0) / 100
                print(f"✅ Wildberries: Цена из salePriceU: {price}")
            elif product_data.get("priceU"):
                price = product_data.get("priceU", 0) / 100
                print(f"✅ Wildberries: Цена из priceU: {price}")
            elif product_data.get("price"):
                price = float(product_data.get("price", 0))
                print(f"✅ Wildberries: Цена из price: {price}")
            
            # Если цена не найдена или невалидна, пробуем из DOM
            if price == 0 or price > 1000000:
                print(f"⚠️ Wildberries: Цена {price} невалидна, пробуем DOM...")
                dom_price = page.evaluate("""
                    () => {
                        const priceEl = document.querySelector('.price-block__final-price') ||
                                       document.querySelector('[class*="price-block"] span') ||
                                       document.querySelector('.product-page__price') ||
                                       document.querySelector('[data-auto="price"]');
                        if (priceEl) {
                            const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                            if (priceText && priceText.length > 0) {
                                const priceValue = parseInt(priceText);
                                if (priceValue > 0 && priceValue < 1000000) {
                                    return priceValue;
                                }
                            }
                        }
                        return 0;
                    }
                """)
                if dom_price and dom_price > 0:
                    print(f"✅ Wildberries: Цена извлечена из DOM: {dom_price}")
                    price = dom_price
                else:
                    print(f"⚠️ Wildberries: Цена не найдена")
            
            # Извлекаем описание
            description = product_data.get("description", "") or product_data.get("text", "")
            if not description or len(description) < 10:
                print("⚠️ Wildberries: Описание не найдено в JS данных, пробуем DOM...")
                dom_desc = page.evaluate("""
                    () => {
                        const descEl = document.querySelector('.product-page__description') ||
                                      document.querySelector('[class*="description"]') ||
                                      document.querySelector('.j-description');
                        if (descEl) {
                            const text = descEl.textContent.trim();
                            if (text && text.length > 10) {
                                return text;
                            }
                        }
                        return null;
                    }
                """)
                if dom_desc:
                    description = dom_desc
                    print(f"✅ Wildberries: Описание найдено ({len(description)} символов)")
                else:
                    print("⚠️ Wildberries: Описание не найдено")
                
                # Извлекаем изображения
            images = self._extract_images(product_data, page)
            
            if not images or len(images) == 0:
                print("⚠️ Wildberries: Изображения не найдены в данных продукта, пробуем DOM...")
                dom_images = page.evaluate("""
                    () => {
                        const imgSelectors = [
                            '.product-page__gallery img',
                            '.product-page__slider img',
                            '[class*="gallery"] img',
                            '.swiper-slide img'
                        ];
                        const images = [];
                        for (const selector of imgSelectors) {
                            const imgEls = document.querySelectorAll(selector);
                            for (const img of imgEls) {
                                let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.getAttribute('data-original');
                                if (src && src.startsWith('http') && !src.includes('data:image') && !images.includes(src)) {
                                    images.push(src);
                                }
                            }
                            if (images.length > 0) break;
                        }
                        return images.slice(0, 10);
                    }
                """)
                if dom_images and len(dom_images) > 0:
                    images = dom_images
                    print(f"✅ Wildberries: Найдено {len(images)} изображений из DOM")
                else:
                    print("⚠️ Wildberries: Изображения не найдены")

            result = {
                "title": title if title and len(title) > 3 else "",
                "price": price,
                "old_price": product_data.get("priceU", 0) / 100 if product_data.get("priceU") and product_data.get("priceU") != product_data.get("salePriceU") else 0,
                "description": description,
                "category": product_data.get("subjectName", "") or product_data.get("category", ""),
                "characteristics": self._extract_characteristics(product_data),
                "composition": self._extract_composition(product_data),
                    "images": images,
                "in_stock": product_data.get("stocks", [{}])[0].get("inStock", False) if product_data.get("stocks") else True
            }
            
            print(f"📦 Wildberries: Результат - название: '{result['title']}', цена: {result['price']}, изображений: {len(result['images'])}, описание: {len(result['description'])} символов")
            
            return result

        except PlaywrightTimeoutError:
            raise ValueError("Превышено время ожидания загрузки страницы Wildberries")
        except Exception as e:
            raise ValueError(f"Ошибка при парсинге Wildberries: {str(e)}")
        finally:
            if browser:
                browser.close()
            if playwright:
                playwright.stop()

    def _extract_product_data(self, page: Page) -> Dict[str, Any]:
        """Извлекает данные товара из JS объектов на странице - улучшенная версия для Wildberries"""
        
        # Способ 1: JSON-LD данные (наиболее надежный способ)
        try:
            json_ld = page.evaluate("""
                () => {
                    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                    for (const script of scripts) {
                        try {
                            const data = JSON.parse(script.textContent);
                            if (data['@type'] === 'Product' || data['@type'] === 'http://schema.org/Product') {
                                return data;
                            }
                        } catch (e) {}
                    }
                    return null;
                }
            """)
            
            if json_ld:
                print("✅ Wildberries: Найдены JSON-LD данные")
                product_data = {}
                if json_ld.get('name'):
                    product_data['name'] = json_ld['name']
                if json_ld.get('offers') and isinstance(json_ld['offers'], dict):
                    if json_ld['offers'].get('price'):
                        price = float(json_ld['offers']['price'])
                        product_data['salePriceU'] = int(price * 100)
                if json_ld.get('description'):
                    product_data['description'] = json_ld['description']
                if json_ld.get('image'):
                    images = json_ld['image']
                    if isinstance(images, list):
                        product_data['photos'] = [{'fullSize': img.replace('https://', '')} for img in images if img]
                    elif isinstance(images, str):
                        product_data['photos'] = [{'fullSize': images.replace('https://', '')}]
                if product_data.get('name'):
                    return product_data
        except Exception as e:
            print(f"⚠️ Wildberries: Ошибка извлечения JSON-LD: {e}")
            pass
        
        # Способ 2: window.__WBLB_INITIAL_DATA__ (основной формат Wildberries)
        try:
            wblb_data = page.evaluate("""
                () => {
                    if (window.__WBLB_INITIAL_DATA__) {
                        const data = window.__WBLB_INITIAL_DATA__;
                        // Проверяем разные варианты структуры
                        if (data.product) return data.product;
                        if (data.data && data.data.product) return data.data.product;
                        if (data.state && data.state.product) return data.state.product;
                        if (data.cards && data.cards[0]) return data.cards[0];
                        // Если сам объект содержит данные товара
                        if (data.imt_name || data.name || data.salePriceU || data.priceU) return data;
                        return data;
                    }
                    return null;
                }
            """)
            
            if wblb_data:
                if isinstance(wblb_data, dict):
                    # Wildberries использует imt_name для названия товара
                    if 'product' in wblb_data:
                        print("✅ Wildberries: Найден product в __WBLB_INITIAL_DATA__")
                        return wblb_data['product']
                    if 'imt_name' in wblb_data or 'name' in wblb_data or 'salePriceU' in wblb_data:
                        print("✅ Wildberries: __WBLB_INITIAL_DATA__ содержит данные товара")
                        return wblb_data
                return wblb_data
        except Exception as e:
            print(f"⚠️ Wildberries: Ошибка извлечения __WBLB_INITIAL_DATA__: {e}")
            pass
        
        # Способ 3: window.__WB_INITIAL_DATA__ (старый формат)
        try:
            wb_data = page.evaluate("""
                () => {
                    if (window.__WB_INITIAL_DATA__) {
                        const data = window.__WB_INITIAL_DATA__;
                        if (data.product) return data.product;
                        if (data.data && data.data.product) return data.data.product;
                        if (data.cards && data.cards[0]) return data.cards[0];
                        if (data.imt_name || data.name || data.salePriceU || data.priceU) return data;
                        return data;
                    }
                    return null;
                }
            """)
            
            if wb_data:
                if isinstance(wb_data, dict):
                    if 'product' in wb_data:
                        print("✅ Wildberries: Найден product в __WB_INITIAL_DATA__")
                        return wb_data['product']
                    if 'imt_name' in wb_data or 'name' in wb_data or 'salePriceU' in wb_data:
                        print("✅ Wildberries: __WB_INITIAL_DATA__ содержит данные товара")
                        return wb_data
                return wb_data
        except Exception as e:
            print(f"⚠️ Wildberries: Ошибка извлечения __WB_INITIAL_DATA__: {e}")
            pass
        
        # Способ 4: Ищем данные в __WBL1_DATA__ (альтернативный формат)
        try:
            wbl1_data = page.evaluate("""
                () => {
                    if (window.__WBL1_DATA__) return window.__WBL1_DATA__;
                    if (window.__WBL__) return window.__WBL__;
                    return null;
                }
            """)
            
            if wbl1_data:
                if isinstance(wbl1_data, dict):
                    if wbl1_data.get('imt_name') or wbl1_data.get('name'):
                        print("✅ Wildberries: Данные найдены в __WBL1_DATA__")
                        return wbl1_data
        except Exception as e:
            print(f"⚠️ Wildberries: Ошибка поиска __WBL1_DATA__: {e}")
            pass
        
        # Способ 5: Глобальный поиск в window
        try:
            any_product = page.evaluate("""
                () => {
                    const keys = Object.keys(window).filter(k => 
                        k.includes('WBL') || k.includes('WB_') || k.includes('INITIAL') || 
                        k.includes('DATA') || k.includes('STATE') || k.includes('PRODUCT')
                    );
                    
                    for (const key of keys) {
                        try {
                            const obj = window[key];
                            if (obj && typeof obj === 'object' && obj !== null) {
                                if (obj.product) return obj.product;
                                if (obj.cards && obj.cards[0]) return obj.cards[0];
                                if (obj.data && obj.data.product) return obj.data.product;
                                if (obj.state && obj.state.product) return obj.state.product;
                                // Проверяем imt_name - основное поле для названия в WB
                                if (obj.imt_name || obj.name || obj.salePriceU || obj.priceU) {
                                    return obj;
                                }
                            }
                        } catch (e) {}
                    }
                    return null;
                }
            """)
            
            if any_product:
                print("✅ Wildberries: Найдены данные товара в window объектах")
                return any_product
        except Exception as e:
            print(f"⚠️ Wildberries: Ошибка поиска в window: {e}")
            pass
        
        # Способ 6: Поиск в скриптах с данными
        try:
            script_data = page.evaluate("""
                () => {
                    const scripts = document.querySelectorAll('script');
                    for (const script of scripts) {
                        if (script.textContent) {
                            const patterns = [
                                /window\\.__WBLB_INITIAL_DATA__\\s*=\\s*({.+?});/s,
                                /window\\.__WB_INITIAL_DATA__\\s*=\\s*({.+?});/s,
                                /"imt_name"\\s*:\\s*"([^"]+)"/,
                                /"salePriceU"\\s*:\\s*\\d+/
                            ];
                            
                            for (const pattern of patterns) {
                                const match = script.textContent.match(pattern);
                                if (match) {
                                    try {
                                        if (pattern.toString().includes('window')) {
                                            const parsed = JSON.parse(match[1]);
                                            if (parsed.product) return parsed.product;
                                            if (parsed.imt_name || parsed.salePriceU) return parsed;
                                        }
                                    } catch (e) {}
                                }
                            }
                        }
                    }
                    return null;
                }
            """)
            
            if script_data:
                if isinstance(script_data, dict):
                    if 'product' in script_data:
                        return script_data['product']
                    if 'imt_name' in script_data or 'salePriceU' in script_data:
                        return script_data
        except Exception as e:
            print(f"⚠️ Wildberries: Ошибка поиска в скриптах: {e}")
            pass
        
        print("⚠️ Wildberries: Не удалось найти данные в JS объектах")
        
        # Прямой fallback: извлекаем из DOM напрямую
        print("🔄 Wildberries: Пробуем прямой DOM fallback...")
        dom_data = page.evaluate("""
            () => {
                const data = {};
                
                // Название
                const h1 = document.querySelector('h1');
                if (h1) data.name = h1.textContent.trim();
                
                // Цена
                const priceEl = document.querySelector('[class*="price"]');
                if (priceEl) {
                    const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                    if (priceText) data.salePriceU = parseInt(priceText) * 100;
                }
                
                // Описание
                const descEl = document.querySelector('[class*="description"]');
                if (descEl) data.description = descEl.textContent.trim();
                
                return data;
            }
        """)
        if dom_data and dom_data.get('name'):
            print(f"✅ Wildberries: Данные из DOM: name={dom_data.get('name')}")
            return dom_data
        
        return None

    def _extract_from_dom_only(self, page: Page) -> Dict[str, Any]:
        """Извлекает данные только из DOM, если JS объекты недоступны"""
        try:
            dom_data = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Название - пробуем больше селекторов
                    const titleSelectors = [
                        'h1',
                        '.product-page__title',
                        '.product-card__title',
                        '[data-product-name]',
                        '.product-title',
                        'h1[itemprop="name"]'
                    ];
                    for (const selector of titleSelectors) {
                        const titleEl = document.querySelector(selector);
                        if (titleEl && titleEl.textContent.trim()) {
                            const text = titleEl.textContent.trim();
                            data.name = text;
                            break;
                        }
                    }
                    
                    // Цена
                    const priceEl = document.querySelector('.price-block__final-price') ||
                                   document.querySelector('.product-page__price') ||
                                   document.querySelector('[class*="price"]:not([class*="old"])');
                    if (priceEl) {
                        const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                        if (priceText && parseInt(priceText) > 0) {
                            data.salePriceU = parseInt(priceText) * 100;
                        }
                    }
                    
                    // Описание
                    const descEl = document.querySelector('.product-page__description') ||
                                  document.querySelector('[class*="description"]');
                    if (descEl) data.description = descEl.textContent.trim();
                    
                    // Изображения
                    const imgEls = document.querySelectorAll('.product-page__gallery img, .product-page__slider img, [class*="gallery"] img');
                    data.images = Array.from(imgEls)
                        .map(img => img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy'))
                        .filter(Boolean)
                        .slice(0, 10);
                    
                    // Наличие
                    const stockEl = document.querySelector('[class*="stock"]') ||
                                   document.querySelector('[class*="available"]');
                    data.inStock = !stockEl || !stockEl.textContent.toLowerCase().includes('нет в наличии');
                    
                    return data;
                }
            """)
            # Проверяем наличие любого названия
            if dom_data and (dom_data.get('name') or dom_data.get('title')):
                return dom_data
            return None
        except Exception:
            return None

    def _extract_from_dom_aggressive(self, page: Page) -> Dict[str, Any]:
        """Агрессивный поиск данных в DOM - последняя попытка для Wildberries"""
        try:
            dom_data = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Название - ищем первый h1
                    const allH1 = document.querySelectorAll('h1');
                    for (const h1 of allH1) {
                        const text = h1.textContent.trim();
                        if (text && text.length > 5) {
                            data.name = text;
                            break;
                        }
                    }
                    
                    // Цена - ищем элементы с ценой, но фильтруем явно невалидные
                    const priceElements = document.querySelectorAll('[class*="price-block"], [class*="price"], [data-qa="price"]');
                    for (const el of priceElements) {
                        const text = el.textContent.replace(/[^\\d]/g, '');
                        if (text && text.length > 0) {
                            const price = parseInt(text);
                            // Фильтруем: цена должна быть от 1 до 1_000_000
                            if (price >= 1 && price <= 1000000) {
                                data.salePriceU = price * 100;
                                break;
                            }
                        }
                    }
                    
                    // Изображения - ищем изображения товаров
                    const allImages = document.querySelectorAll('img');
                    const images = [];
                    for (const img of allImages) {
                        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy');
                        if (src && src.startsWith('http') && 
                            !src.includes('data:image') && 
                            !src.includes('logo') &&
                            !src.includes('icon') &&
                            (src.includes('basket') || src.includes('wb') || images.length < 5)) {
                            if (!images.includes(src)) {
                                images.push(src);
                            }
                        }
                    }
                    data.images = images.slice(0, 10);
                    
                    // Описание - ищем текст описания товара
                    const descContainer = document.querySelector('.product-page__description-wrap, [class*="description"], .j-description');
                    if (descContainer) {
                        const text = descContainer.textContent.trim();
                        if (text && text.length > 20 && text.length < 10000) {
                            data.description = text.substring(0, 5000);
                        }
                    }
                    
                    return data;
                }
            """)
            
            # Проверяем наличие названия или цены
            if dom_data and (dom_data.get('name') or (dom_data.get('salePriceU') and dom_data.get('salePriceU') > 0)):
                return dom_data
        except Exception as e:
            print(f"⚠️ Wildberries: Ошибка агрессивного поиска в DOM: {e}")
            pass
        
        # Последний fallback - просто берём h1 и любую цену
        try:
            last_fallback = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Первый h1 на странице
                    const h1 = document.querySelector('h1');
                    if (h1) {
                        data.name = h1.textContent.trim();
                    }
                    
                    // Любой элемент с ценой
                    const priceEl = document.querySelector('[class*="price"]');
                    if (priceEl) {
                        const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                        if (priceText && parseInt(priceText) > 0) {
                            data.salePriceU = parseInt(priceText) * 100;
                        }
                    }
                    
                    // Картинки товара
                    const imgEls = document.querySelectorAll('img');
                    const images = [];
                    for (const img of imgEls) {
                        const src = img.src || img.getAttribute('data-src');
                        if (src && src.includes('basket') && !images.includes(src)) {
                            images.push(src);
                        }
                    }
                    data.images = images.slice(0, 3);
                    
                    return data;
                }
            """)
            if last_fallback and (last_fallback.get('name') or last_fallback.get('salePriceU')):
                print(f"✅ Wildberries: Last fallback - name={last_fallback.get('name')}")
                return last_fallback
        except Exception as e:
            print(f"⚠️ Wildberries: Ошибка last fallback: {e}")
        
        return None

    def _extract_characteristics(self, product_data: Dict[str, Any]) -> Dict[str, str]:
        """Извлекает характеристики товара"""
        characteristics = {}
        
        if product_data.get("characteristics"):
            for char in product_data["characteristics"]:
                if isinstance(char, dict):
                    name = char.get("name", "")
                    value = char.get("value", "")
                    if name and value:
                        characteristics[name] = str(value)
        
        return characteristics

    def _extract_composition(self, product_data: Dict[str, Any]) -> str:
        """Извлекает состав из характеристик"""
        characteristics = self._extract_characteristics(product_data)
        composition_keys = ["Состав", "Материал", "Composition", "Material", "Материалы"]
        
        for key in composition_keys:
            if key in characteristics:
                return str(characteristics[key])
        
        return ""

    def _extract_images(self, product_data: Dict[str, Any], page: Page) -> list[str]:
        """Извлекает изображения товара"""
        images = []
        
        # Способ 1: Из данных продукта
        if product_data.get("photos"):
            for photo in product_data["photos"]:
                if isinstance(photo, dict):
                    if photo.get("fullSize"):
                        images.append(f"https://{photo['fullSize']}")
                    elif photo.get("url"):
                        images.append(photo["url"])
        
        # Способ 2: Из DOM
        if not images:
            try:
                dom_images = page.evaluate("""
                    () => {
                        const imgEls = document.querySelectorAll('[data-product-image] img, .product-page__gallery img, .product-page__slider img');
                        return Array.from(imgEls)
                            .map(img => img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy'))
                            .filter(Boolean)
                            .slice(0, 10);
                    }
                """)
                images.extend(dom_images)
            except Exception:
                pass
        
        # Способ 3: Генерируем URL по ID товара (если есть)
        if not images and product_data.get("id"):
            product_id = str(product_data["id"])
            vol = int(product_id) // 100000
            part = int(product_id) // 1000
            for i in range(1, 6):
                images.append(f"https://basket-{vol:02d}.wbbasket.ru/vol{vol}/part{part}/{product_id}/images/big/{i}.webp")
        
        return images[:10]  # Максимум 10 изображений
