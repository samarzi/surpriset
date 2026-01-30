import json
import re
import time
import random
from typing import Dict, Any
from .base import MarketplaceParserInterface
from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError


class OzonParser(MarketplaceParserInterface):
    def parse(self) -> Dict[str, Any]:
        playwright = None
        browser = None
        try:
            playwright, browser, page = self._get_browser_page()
            
            # Убираем параметры из URL для избежания капчи
            clean_url = self.url.split('?')[0]
            
            # Открываем страницу товара с ожиданием networkidle
            page.goto(clean_url, wait_until='networkidle', timeout=self.timeout)
            self._wait_for_page_load(page)
            
            # Проверяем на капчу или блокировку (только явные признаки)
            page_url = page.url.lower()
            page_title = page.title().lower()
            
            # Проверяем только URL - не заголовок и не содержимое (может быть ложное срабатывание)
            if 'captcha' in page_url or 'challenge' in page_url:
                print("⚠️ Ozon: Обнаружена капча в URL")
                raise ValueError("Обнаружена капча на Ozon. Попробуйте позже или используйте другой товар.")
            
            # Дополнительная задержка для загрузки JS
            time.sleep(random.uniform(2, 4))
            
            # Извлекаем данные из JS объектов
            product_data = self._extract_product_data(page)
            
            # Если JS данные не найдены, пробуем еще раз с перезагрузкой
            if not product_data or not product_data.get("title"):
                print("⚠️ Ozon: JS данные не найдены, пробуем перезагрузку...")
                time.sleep(2)
                page.reload(wait_until='networkidle', timeout=self.timeout)
                self._wait_for_page_load(page)
                product_data = self._extract_product_data(page)
            
            # Если JS данные все еще не найдены, используем DOM fallback
            if not product_data or not product_data.get("title"):
                print("⚠️ Ozon: JS данные не найдены после перезагрузки, используем DOM fallback")
                # Пробуем агрессивный поиск в DOM
                aggressive_dom = self._extract_from_dom_aggressive(page)
                if aggressive_dom and aggressive_dom.get("title"):
                    print("✅ Ozon: Данные извлечены агрессивным поиском в DOM")
                    product_data = aggressive_dom
                else:
                    raise ValueError("Не удалось извлечь данные товара с Ozon. Возможно, товар недоступен или страница изменилась.")
            
            # Формируем результат
            title = product_data.get("title", product_data.get("name", ""))
            
            # Проверяем описание - если пустое, пробуем из DOM
            description = product_data.get("description", "")
            if not description or len(description) < 10:
                dom_desc = page.evaluate("""
                    () => {
                        const descSelectors = [
                            '[data-widget="webProductDescription"]',
                            '.product-page__description',
                            '[data-test-id="productDescription"]',
                            '[class*="description"]'
                        ];
                        for (const selector of descSelectors) {
                            const descEl = document.querySelector(selector);
                            if (descEl) {
                                const descText = descEl.textContent.trim() || descEl.innerText.trim();
                                if (descText && descText.length > 10) {
                                    return descText;
                                }
                            }
                        }
                        return null;
                    }
                """)
                if dom_desc:
                    description = dom_desc

            # Извлекаем цену
            price = self._extract_price(product_data)
            if price == 0:
                # Пробуем из DOM - более агрессивный поиск
                dom_price = page.evaluate("""
                    () => {
                        const priceSelectors = [
                            '[data-widget="webPrice"]',
                            '.product-page__price',
                            '[data-test-id="price-current"]',
                            '[class*="price"]',
                            '[itemprop="price"]',
                            '.price',
                            '[class*="final-price"]',
                            '[class*="current-price"]'
                        ];
                        for (const selector of priceSelectors) {
                            const priceEl = document.querySelector(selector);
                            if (priceEl) {
                                const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                                if (priceText && priceText.length > 0) {
                                    const priceValue = parseInt(priceText);
                                    if (priceValue > 0 && priceValue < 10000000) {
                                        return priceValue;
                                    }
                                }
                            }
                        }
                        return 0;
                    }
                """)
                if dom_price and dom_price > 0:
                    print(f"✅ Ozon: Цена извлечена из DOM: {dom_price}")
                    price = dom_price
                else:
                    print(f"⚠️ Ozon: Цена не найдена в DOM")
            
            # Извлекаем изображения
            images = self._extract_images(product_data, page)
            if not images or len(images) == 0:
                print("⚠️ Ozon: Изображения не найдены в данных, пробуем DOM...")
                # Пробуем из DOM с улучшенными селекторами
                dom_images = page.evaluate("""
                    () => {
                        const imgSelectors = [
                            '[data-widget="webGallery"] img',
                            '.product-page__gallery img',
                            '.product-page__slider img',
                            '[class*="gallery"] img'
                        ];
                        const images = [];
                        for (const selector of imgSelectors) {
                            const imgEls = document.querySelectorAll(selector);
                            if (imgEls.length > 0) {
                                Array.from(imgEls).forEach(img => {
                                    let src = img.getAttribute('data-src') || 
                                             img.getAttribute('data-original') ||
                                             img.getAttribute('data-lazy') ||
                                             img.src;
                                    if (src && src.includes('cdn')) {
                                        src = src.split('?')[0];
                                        src = src.replace(/\\/w\\d+\\//, '/w2000/').replace(/\\/h\\d+\\//, '/h2000/');
                                    }
                                    if (src && !images.includes(src) && !src.includes('data:image') && src.startsWith('http')) {
                                        images.push(src);
                                    }
                                });
                                if (images.length > 0) break;
                            }
                        }
                        
                        // Если ничего не нашли, ищем любые картинки с ozon
                        if (images.length === 0) {
                            const allImages = document.querySelectorAll('img');
                            for (const img of allImages) {
                                let src = img.src || img.getAttribute('data-src');
                                if (src && src.includes('ozon') && !images.includes(src) && !src.includes('data:image')) {
                                    images.push(src);
                                }
                            }
                        }
                        
                        return images.slice(0, 20);
                    }
                """)
                if dom_images and len(dom_images) > 0:
                    images = dom_images
                    print(f"✅ Ozon: Найдено {len(images)} изображений из DOM")
                else:
                    print("⚠️ Ozon: Изображения не найдены")

            result = {
                "title": title if title and len(title) > 3 else "",
                "price": int(price) if price else 0,
                "old_price": int(self._extract_old_price(product_data)) if self._extract_old_price(product_data) else 0,
                "description": description,
                "category": product_data.get("category", ""),
                "characteristics": self._extract_characteristics(product_data),
                "composition": self._extract_composition(product_data),
                "images": images,
                "in_stock": product_data.get("isAvailable", product_data.get("available", True))
            }
            
            print(f"📦 Ozon: Результат - название: '{result['title']}', цена: {result['price']}, изображений: {len(result['images'])}, описание: {len(result['description'])} символов")
            
            return result

        except PlaywrightTimeoutError:
            raise ValueError("Превышено время ожидания загрузки страницы Ozon")
        except Exception as e:
            raise ValueError(f"Ошибка при парсинге Ozon: {str(e)}")
        finally:
            if browser:
                browser.close()
            if playwright:
                playwright.stop()

    def _extract_product_data(self, page: Page) -> Dict[str, Any]:
        """Извлекает данные товара из JS объектов на странице - улучшенная версия"""
        
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
                print("✅ Ozon: Найдены JSON-LD данные")
                # Конвертируем JSON-LD в наш формат
                product_data = {}
                if json_ld.get('name'):
                    product_data['title'] = json_ld['name']
                if json_ld.get('offers') and isinstance(json_ld['offers'], dict):
                    if json_ld['offers'].get('price'):
                        price = float(json_ld['offers']['price'])
                        # Нормализуем цену - если больше 10000, скорее всего в копейках
                        print(f"🔍 Ozon JSON-LD: Исходная цена = {price}")
                        if price > 10000:
                            price = price / 100
                            print(f"🔧 Ozon JSON-LD: Цена {json_ld['offers']['price']} выглядит как копейки, конвертируем в {price}₽")
                        product_data['price'] = int(price)
                        print(f"✅ Ozon JSON-LD: Финальная цена = {product_data['price']}₽")
                if json_ld.get('description'):
                    product_data['description'] = json_ld['description']
                if json_ld.get('image'):
                    images = json_ld['image']
                    if isinstance(images, list):
                        product_data['images'] = [{'url': img, 'original': img} for img in images if img]
                    elif isinstance(images, str):
                        product_data['images'] = [{'url': images, 'original': images}]
                if product_data.get('title'):
                    return product_data
        except Exception as e:
            print(f"⚠️ Ozon: Ошибка извлечения JSON-LD: {e}")
            pass
        
        # Способ 2: window.__INITIAL_STATE__ (Ozon изменил структуру!)
        try:
            initial_state = page.evaluate("""
                () => {
                    // Ozon теперь использует __INITIAL_STATE__ вместо __APP_STATE__
                    if (window.__INITIAL_STATE__) {
                        const state = window.__INITIAL_STATE__;
                        if (state.product) return state.product;
                        if (state.catalog && state.catalog.product) return state.catalog.product;
                        if (state.widgetStates) {
                            // Ищем product в widgetStates
                            for (let key in state.widgetStates) {
                                const widget = state.widgetStates[key];
                                if (widget && widget.product) return widget.product;
                                if (widget && (widget.name || widget.title || widget.price)) return widget;
                            }
                        }
                        // Если сам state похож на product
                        if (state.name || state.title || state.price) return state;
                        return state;
                    }
                    return null;
                }
            """)
            
            if initial_state:
                if isinstance(initial_state, dict):
                    if 'product' in initial_state:
                        print("✅ Ozon: Найден product в __INITIAL_STATE__")
                        return initial_state['product']
                    if 'name' in initial_state or 'title' in initial_state or 'price' in initial_state:
                        print("✅ Ozon: __INITIAL_STATE__ является product объектом")
                        return initial_state
                return initial_state
        except Exception as e:
            print(f"⚠️ Ozon: Ошибка извлечения __INITIAL_STATE__: {e}")
            pass
        
        # Способ 3: window.__APP_STATE__ (старый формат, на случай если еще используется)
        try:
            app_state = page.evaluate("""
                () => {
                    if (window.__APP_STATE__) {
                        const state = window.__APP_STATE__;
                        if (state.product) return state.product;
                        if (state.catalog && state.catalog.product) return state.catalog.product;
                        if (state.widgetStates) {
                            for (let key in state.widgetStates) {
                                const widget = state.widgetStates[key];
                                if (widget && widget.product) return widget.product;
                                if (widget && (widget.name || widget.price)) return widget;
                            }
                        }
                        if (state.name || state.title || state.price) return state;
                        return state;
                    }
                    return null;
                }
            """)
            
            if app_state:
                if isinstance(app_state, dict):
                    if 'product' in app_state:
                        print("✅ Ozon: Найден product в __APP_STATE__")
                        return app_state['product']
                    if 'name' in app_state or 'title' in app_state or 'price' in app_state:
                        print("✅ Ozon: __APP_STATE__ является product объектом")
                        return app_state
                return app_state
        except Exception as e:
            print(f"⚠️ Ozon: Ошибка извлечения __APP_STATE__: {e}")
            pass
        
        # Способ 4: Ищем в window любые объекты с product
        try:
            any_product = page.evaluate("""
                () => {
                    const keys = Object.keys(window).filter(k => 
                        k.includes('APP') || k.includes('STATE') || k.includes('INITIAL') || 
                        k.includes('DATA') || k.includes('OZON') || k.includes('PRODUCT')
                    );
                    
                    for (const key of keys) {
                        try {
                            const obj = window[key];
                            if (obj && typeof obj === 'object' && obj !== null) {
                                if (obj.product) {
                                    console.log('Found product in:', key);
                                    return obj.product;
                                }
                                if (obj.catalog && obj.catalog.product) {
                                    console.log('Found product in catalog:', key);
                                    return obj.catalog.product;
                                }
                                if (obj.widgetStates) {
                                    for (let wkey in obj.widgetStates) {
                                        const widget = obj.widgetStates[wkey];
                                        if (widget && widget.product) {
                                            console.log('Found product in widgetStates:', key, wkey);
                                            return widget.product;
                                        }
                                    }
                                }
                                if (obj.name || obj.title || obj.price) {
                                    console.log('Found product-like object in:', key);
                                    return obj;
                                }
                            }
                        } catch (e) {
                            console.error('Error checking', key, e);
                        }
                    }
                    return null;
                }
            """)
            
            if any_product:
                print(f"✅ Ozon: Найден product в window объектах")
                return any_product
        except Exception as e:
            print(f"⚠️ Ozon: Ошибка поиска product в window: {e}")
            pass
        
        # Способ 5: Ищем данные в скриптах с type="application/json"
        try:
            script_data = page.evaluate("""
                () => {
                    const scripts = document.querySelectorAll('script[type="application/json"]');
                    for (const script of scripts) {
                        try {
                            const data = JSON.parse(script.textContent);
                            if (data.product) return data.product;
                            if (data.widgetStates) {
                                for (let key in data.widgetStates) {
                                    const widget = data.widgetStates[key];
                                    if (widget && widget.product) return widget.product;
                                }
                            }
                            if (data.name || data.title || data.price) return data;
                        } catch (e) {}
                    }
                    return null;
                }
            """)
            
            if script_data:
                if isinstance(script_data, dict):
                    if 'product' in script_data:
                        print("✅ Ozon: Найден product в application/json скриптах")
                        return script_data['product']
                    if 'name' in script_data or 'title' in script_data or 'price' in script_data:
                        print("✅ Ozon: Найден product-подобный объект в скриптах")
                        return script_data
                return script_data
        except Exception as e:
            print(f"⚠️ Ozon: Ошибка поиска в скриптах: {e}")
            pass
        
        print("⚠️ Ozon: Не удалось найти данные в JS объектах, будет использован DOM fallback")
        return None
        
        # Способ 3: Ищем данные в скриптах
        try:
            script_data = page.evaluate("""
                () => {
                    const scripts = document.querySelectorAll('script[type="application/json"]');
                    for (const script of scripts) {
                        try {
                            const data = JSON.parse(script.textContent);
                            if (data.product || data.widgetStates) {
                                return data;
                            }
                        } catch (e) {}
                    }
                    return null;
                }
            """)
            
            if script_data:
                if 'product' in script_data:
                    return script_data['product']
                # Пробуем извлечь из widgetStates
                if 'widgetStates' in script_data:
                    for key, value in script_data['widgetStates'].items():
                        if isinstance(value, dict) and 'product' in value:
                            return value['product']
        except Exception:
            pass
        
        # Способ 4: Из DOM элементов
        try:
            dom_data = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Название - пробуем разные селекторы и проверяем на капчу
                    const titleSelectors = [
                        'h1',
                        '[data-widget="webProductHeading"]',
                        '.product-page__title',
                        '[data-test-id="productTitle"]',
                        'h1[itemprop="name"]',
                        '[class*="product-title"]',
                        '[class*="heading"]'
                    ];
                    for (const selector of titleSelectors) {
                        const titleEl = document.querySelector(selector);
                        if (titleEl) {
                            const titleText = titleEl.textContent.trim();
                            // Проверяем, что это не капча (более мягкая проверка)
                            if (titleText && 
                                titleText.length > 5 &&
                                !(titleText.toLowerCase().includes('подтвердите') && titleText.toLowerCase().includes('бот'))) {
                                data.title = titleText;
                                break;
                            }
                        }
                    }
                    
                    // Цена - пробуем разные селекторы
                    const priceSelectors = [
                        '[data-widget="webPrice"]',
                        '.product-page__price',
                        '[data-test-id="price-current"]',
                        '[class*="price"]',
                        '[itemprop="price"]',
                        '.price'
                    ];
                    for (const selector of priceSelectors) {
                        const priceEl = document.querySelector(selector);
                        if (priceEl) {
                            const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                            if (priceText && priceText.length > 0) {
                                data.price = parseInt(priceText);
                                break;
                            }
                        }
                    }
                    
                    // Старая цена
                    const oldPriceSelectors = [
                        '[data-test-id="price-old"]',
                        '.product-page__price-old',
                        '[class*="old-price"]',
                        '[class*="price-old"]'
                    ];
                    for (const selector of oldPriceSelectors) {
                        const oldPriceEl = document.querySelector(selector);
                        if (oldPriceEl) {
                            const oldPriceText = oldPriceEl.textContent.replace(/[^\\d]/g, '');
                            if (oldPriceText && oldPriceText.length > 0) {
                                data.oldPrice = parseInt(oldPriceText);
                                break;
                            }
                        }
                    }
                    
                    // Описание - пробуем разные селекторы
                    const descSelectors = [
                        '[data-widget="webProductDescription"]',
                        '.product-page__description',
                        '[data-test-id="productDescription"]',
                        '[class*="description"]',
                        '[itemprop="description"]',
                        '.product-description'
                    ];
                    for (const selector of descSelectors) {
                        const descEl = document.querySelector(selector);
                        if (descEl) {
                            const descText = descEl.textContent.trim() || descEl.innerText.trim();
                            if (descText && descText.length > 10) {
                                data.description = descText;
                                break;
                            }
                        }
                    }
                    
                    // Изображения - ищем оригинальные URL высокого качества
                    const imgSelectors = [
                        '[data-widget="webGallery"] img',
                        '.product-page__gallery img',
                        '.product-page__slider img',
                        '[class*="gallery"] img',
                        '[class*="slider"] img',
                        '[class*="image"] img'
                    ];
                    const images = [];
                    for (const selector of imgSelectors) {
                        const imgEls = document.querySelectorAll(selector);
                        if (imgEls.length > 0) {
                            Array.from(imgEls).forEach(img => {
                                // Пробуем разные атрибуты для получения оригинального URL
                                let src = img.getAttribute('data-src') || 
                                         img.getAttribute('data-original') ||
                                         img.getAttribute('data-lazy') ||
                                         img.src;
                                // Убираем параметры размера для получения оригинального изображения
                                if (src && src.includes('cdn')) {
                                    src = src.split('?')[0]; // Убираем параметры
                                    // Пробуем заменить размер на оригинальный
                                        src = src.replace(/\\/w\\d+\\//g, '/w2000/').replace(/\\/h\\d+\\//g, '/h2000/');
                                }
                                if (src && !images.includes(src) && !src.includes('data:image') && src.startsWith('http')) {
                                    images.push(src);
                                }
                            });
                            if (images.length > 0) break;
                        }
                    }
                    data.images = images.slice(0, 10);
                    
                    // Наличие
                    const stockEl = document.querySelector('[data-test-id="stock-status"]') ||
                                  document.querySelector('.product-page__stock');
                    data.isAvailable = stockEl && !stockEl.textContent.toLowerCase().includes('нет в наличии');
                    
                    return data;
                }
            """)
            
            if dom_data and dom_data.get('title'):
                return dom_data
        except Exception:
            pass
        
        return None

    def _extract_price(self, product_data: Dict[str, Any]) -> float:
        """Извлекает цену товара"""
        print(f"🔍 Ozon: Извлечение цены из данных: {product_data.keys() if isinstance(product_data, dict) else type(product_data)}")
        
        def normalize_price(price_val):
            """Нормализует цену - если она в копейках (> 10000), делим на 100"""
            if price_val <= 0:
                return 0
            # Если цена больше 10000, скорее всего она в копейках
            if price_val > 10000:
                normalized = int(price_val / 100)
                print(f"🔧 Ozon: Цена {price_val} выглядит как копейки, конвертируем в {normalized}₽")
                return normalized
            return int(price_val)
        
        # Пробуем разные варианты
        if product_data.get("price"):
            price = product_data["price"]
            print(f"🔍 Ozon: Найдено поле 'price': {price} (тип: {type(price)})")
            if isinstance(price, dict):
                price_val = price.get("value", 0) or price.get("finalPrice", 0) or price.get("price", 0)
                print(f"🔍 Ozon: Извлечено из словаря price: {price_val}")
                result = normalize_price(float(price_val))
                print(f"✅ Ozon: Итоговая цена (из price dict): {result}₽")
                return result
            result = normalize_price(float(price))
            print(f"✅ Ozon: Итоговая цена (из price): {result}₽")
            return result
        
        if product_data.get("finalPrice"):
            final_price = product_data["finalPrice"]
            print(f"🔍 Ozon: Найдено поле 'finalPrice': {final_price}")
            result = normalize_price(float(final_price))
            print(f"✅ Ozon: Итоговая цена (из finalPrice): {result}₽")
            return result
        
        if product_data.get("salePrice"):
            sale_price = product_data["salePrice"]
            print(f"🔍 Ozon: Найдено поле 'salePrice': {sale_price}")
            result = normalize_price(float(sale_price))
            print(f"✅ Ozon: Итоговая цена (из salePrice): {result}₽")
            return result
        
        # Если цена извлечена из DOM как число
        if isinstance(product_data.get("price"), (int, float)):
            price_val = product_data["price"]
            result = normalize_price(float(price_val))
            print(f"✅ Ozon: Итоговая цена (из price int/float): {result}₽")
            return result
        
        print(f"⚠️ Ozon: Цена не найдена в данных")
        return 0

    def _extract_old_price(self, product_data: Dict[str, Any]) -> float:
        """Извлекает старую цену товара"""
        print(f"🔍 Ozon: Извлечение старой цены из данных")
        
        def normalize_price(price_val):
            """Нормализует цену - если она в копейках (> 10000), делим на 100"""
            if price_val <= 0:
                return 0
            # Если цена больше 10000, скорее всего она в копейках
            if price_val > 10000:
                normalized = int(price_val / 100)
                print(f"🔧 Ozon: Старая цена {price_val} выглядит как копейки, конвертируем в {normalized}₽")
                return normalized
            return int(price_val)
        
        if product_data.get("oldPrice"):
            old_price = product_data["oldPrice"]
            print(f"🔍 Ozon: Найдено поле 'oldPrice': {old_price} (тип: {type(old_price)})")
            if isinstance(old_price, dict):
                old_price_val = old_price.get("value", 0)
                print(f"🔍 Ozon: Извлечено из словаря oldPrice: {old_price_val}")
                result = normalize_price(float(old_price_val))
                print(f"✅ Ozon: Итоговая старая цена (из oldPrice dict): {result}₽")
                return result
            result = normalize_price(float(old_price))
            print(f"✅ Ozon: Итоговая старая цена (из oldPrice): {result}₽")
            return result
        
        if product_data.get("originalPrice"):
            original_price = product_data["originalPrice"]
            print(f"🔍 Ozon: Найдено поле 'originalPrice': {original_price}")
            result = normalize_price(float(original_price))
            print(f"✅ Ozon: Итоговая старая цена (из originalPrice): {result}₽")
            return result
        
        print(f"⚠️ Ozon: Старая цена не найдена в данных")
        return 0

    def _extract_from_dom_aggressive(self, page: Page) -> Dict[str, Any]:
        """Агрессивный поиск данных в DOM - последняя попытка для Ozon"""
        try:
            dom_data = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Название - ищем ВСЕ h1
                    const allH1 = document.querySelectorAll('h1');
                    for (const h1 of allH1) {
                        const text = h1.textContent.trim();
                        if (text && text.length > 3 && 
                            !text.toLowerCase().includes('подтвердите') &&
                            !text.toLowerCase().includes('бот')) {
                            data.title = text;
                            break;
                        }
                    }
                    
                    // Цена - ищем ВСЕ элементы с ценой
                    const allPriceElements = document.querySelectorAll('[class*="price"], [class*="Price"], [data*="price"], [itemprop="price"]');
                    for (const el of allPriceElements) {
                        const text = el.textContent.replace(/[^\\d]/g, '');
                        if (text && text.length > 0) {
                            const price = parseInt(text);
                            if (price > 0 && price < 10000000) {
                                data.price = price;
                                break;
                            }
                        }
                    }
                    
                    // Изображения - ищем ВСЕ изображения
                    const allImages = document.querySelectorAll('img');
                    const images = [];
                    for (const img of allImages) {
                        let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
                        if (src && src.includes('cdn')) {
                            src = src.split('?')[0];
                            src = src.replace(/\\/w\\d+\\//g, '/w2000/').replace(/\\/h\\d+\\//g, '/h2000/');
                        }
                        if (src && src.startsWith('http') && 
                            !src.includes('data:image') && 
                            !src.includes('logo') &&
                            !src.includes('icon') &&
                            (src.includes('product') || src.includes('goods') || src.includes('ozon') || images.length < 5)) {
                            if (!images.includes(src)) {
                                images.push(src);
                            }
                        }
                    }
                    data.images = images.slice(0, 10);
                    
                    // Описание
                    const descContainers = document.querySelectorAll('[class*="description"], [class*="text"]');
                    for (const container of descContainers) {
                        const text = container.textContent.trim();
                        if (text && text.length > 50 && text.length < 5000) {
                            data.description = text;
                            break;
                        }
                    }
                    
                    return data;
                }
            """)
            
            if dom_data and dom_data.get('title'):
                return dom_data
        except Exception as e:
            print(f"⚠️ Ozon: Ошибка агрессивного поиска в DOM: {e}")
            pass
        
        return None

    def _extract_characteristics(self, product_data: Dict[str, Any]) -> Dict[str, str]:
        """Извлекает характеристики товара"""
        characteristics = {}
        
        if product_data.get("characteristics"):
            for char in product_data["characteristics"]:
                if isinstance(char, dict):
                    name = char.get("name", char.get("key", ""))
                    value = char.get("value", "")
                    if name and value:
                        characteristics[name] = str(value)
        
        if product_data.get("specifications"):
            for spec in product_data["specifications"]:
                if isinstance(spec, dict):
                    name = spec.get("name", spec.get("key", ""))
                    value = spec.get("value", "")
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
        if product_data.get("images"):
            for img in product_data["images"]:
                if isinstance(img, dict):
                    # Ищем оригинальные URL высокого качества
                    url = img.get("original") or img.get("url") or img.get("src")
                    if url:
                        # Убираем параметры размера для получения оригинала
                        if 'cdn' in url:
                            url = url.split('?')[0]
                            url = url.replace('/w200/', '/w2000/').replace('/h200/', '/h2000/')
                        images.append(url)
                elif isinstance(img, str):
                    if 'cdn' in img:
                        img = img.split('?')[0]
                        img = img.replace('/w200/', '/w2000/').replace('/h200/', '/h2000/')
                    images.append(img)
        
        # Способ 2: Из DOM (улучшенная версия)
        if not images or len(images) == 0:
            try:
                dom_images = page.evaluate("""
                    () => {
                        const imgSelectors = [
                            '[data-widget="webGallery"] img',
                            '.product-page__gallery img',
                            '.product-page__slider img',
                            '[class*="gallery"] img',
                            '[class*="slider"] img',
                            '[class*="image"] img'
                        ];
                        const images = [];
                        for (const selector of imgSelectors) {
                            const imgEls = document.querySelectorAll(selector);
                            if (imgEls.length > 0) {
                                Array.from(imgEls).forEach(img => {
                                    let src = img.getAttribute('data-src') || 
                                             img.getAttribute('data-original') ||
                                             img.getAttribute('data-lazy') ||
                                             img.src;
                                    // Убираем параметры размера для получения оригинала
                                    if (src && src.includes('cdn')) {
                                        src = src.split('?')[0];
                                        src = src.replace(/\\/w\\d+\\//, '/w2000/').replace(/\\/h\\d+\\//, '/h2000/');
                                    }
                                    if (src && !images.includes(src) && !src.includes('data:image') && src.startsWith('http')) {
                                        images.push(src);
                                    }
                                });
                                if (images.length > 0) break;
                            }
                        }
                        return images.slice(0, 20);
                    }
                """)
                if dom_images:
                    images.extend(dom_images)
            except Exception as e:
                print(f"DOM images extraction error: {e}")
                pass
        
        return images[:3]  # Максимум 3 изображения
