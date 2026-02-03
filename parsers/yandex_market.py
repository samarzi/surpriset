import json
import re
import time
import random
from typing import Dict, Any
from .base import MarketplaceParserInterface
from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError


class YandexMarketParser(MarketplaceParserInterface):
    def parse(self) -> Dict[str, Any]:
        playwright = None
        browser = None
        try:
            playwright, browser, page = self._get_browser_page()
            
            # Убираем параметры из URL для избежания капчи
            clean_url = self.url.split('?')[0]
            
            # Открываем страницу товара с ожиданием networkidle
            page.goto(clean_url, wait_until='networkidle', timeout=self.timeout)
            
            # Проверяем на капчу
            if 'captcha' in page.url.lower() or 'smartcaptcha' in page.content().lower():
                raise ValueError("Обнаружена капча на Яндекс Маркет. Попробуйте позже.")
            
            self._wait_for_page_load(page)
            
            # Извлекаем данные из JS объектов
            product_data = self._extract_product_data(page)
            
            # Если JS данные не найдены или неполные, используем DOM fallback
            if not product_data or not product_data.get("title"):
                print("⚠️ Яндекс Маркет: JS данные не найдены, используем DOM fallback")
                dom_data = self._extract_from_dom_only(page)
                if dom_data and dom_data.get("title"):
                    print("✅ Яндекс Маркет: Данные извлечены из DOM")
                    product_data = dom_data
                else:
                    # Последняя попытка - агрессивный поиск
                    print("⚠️ Яндекс Маркет: Стандартный DOM fallback не сработал, пробуем агрессивный поиск")
                    aggressive_dom = self._extract_from_dom_aggressive(page)
                    if aggressive_dom and aggressive_dom.get("title"):
                        print("✅ Яндекс Маркет: Данные извлечены агрессивным поиском в DOM")
                        product_data = aggressive_dom
                    else:
                        raise ValueError("Не удалось извлечь данные товара с Яндекс Маркет")
            
            # Формируем результат
            title = product_data.get("title", product_data.get("name", ""))
            
            # Извлекаем цену
            price = self._extract_price(product_data)
            if price == 0:
                # Пробуем из DOM
                dom_price = page.evaluate("""
                    () => {
                        const priceSelectors = [
                            '[data-auto="price"]',
                            '[data-zone-name="price"]',
                            '[itemprop="price"]',
                            '.product-price'
                        ];
                        for (const selector of priceSelectors) {
                            const priceEl = document.querySelector(selector);
                            if (priceEl) {
                                const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                                if (priceText && priceText.length > 0) {
                                    const priceValue = parseInt(priceText);
                                    if (priceValue >= 10 && priceValue <= 10000000) {
                                        return priceValue;
                                    }
                                }
                            }
                        }
                        return 0;
                    }
                """)
                if dom_price and dom_price > 0:
                    price = dom_price
            
            # Извлекаем описание
            description = product_data.get("description", "")
            if not description or len(description) < 10:
                dom_desc = page.evaluate("""
                    () => {
                        const descSelectors = [
                            '[data-zone-name="productDescription"]',
                            '.product-description',
                            '[itemprop="description"]'
                        ];
                        for (const selector of descSelectors) {
                            const descEl = document.querySelector(selector);
                            if (descEl && descEl.textContent.trim().length > 10) {
                                return descEl.textContent.trim();
                            }
                        }
                        return null;
                    }
                """)
                if dom_desc:
                    description = dom_desc

            # Извлекаем изображения
            images = self._extract_images(product_data, page)
            # Убеждаемся, что images - это список
            if images is None:
                images = []
            if not images or len(images) == 0:
                print("⚠️ Яндекс Маркет: Изображения не найдены в данных, пробуем DOM...")
                # Пробуем из DOM с улучшенными селекторами
                dom_images = page.evaluate("""
                    () => {
                        const imgSelectors = [
                            '[data-zone-name="productGallery"] img',
                            '.product-gallery img',
                            '.product-slider img',
                            '[class*="gallery"] img',
                            '[class*="image"] img'
                        ];
                        const images = [];
                        for (const selector of imgSelectors) {
                            const imgEls = document.querySelectorAll(selector);
                            if (imgEls.length > 0) {
                                Array.from(imgEls).forEach(img => {
                                    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.getAttribute('data-original');
                                    if (src && !images.includes(src) && !src.includes('data:image') && src.startsWith('http')) {
                                        images.push(src);
                                    }
                                });
                                if (images.length > 0) break;
                            }
                        }
                        
                        // Если ничего не нашли, ищем любые картинки с market.yandex
                        if (images.length === 0) {
                            const allImages = document.querySelectorAll('img');
                            for (const img of allImages) {
                                const src = img.src || img.getAttribute('data-src');
                                if (src && (src.includes('market.yandex') || src.includes('mdata.yandex')) && !images.includes(src) && !src.includes('data:image')) {
                                    images.push(src);
                                }
                            }
                        }
                        
                        return images.slice(0, 20);
                    }
                """)
                if dom_images and isinstance(dom_images, list) and len(dom_images) > 0:
                    images = dom_images
                    print(f"✅ Яндекс Маркет: Найдено {len(images)} изображений из DOM")
                else:
                    print("⚠️ Яндекс Маркет: Изображения не найдены")
            
            # Ограничиваем до 10 изображений для Яндекс Маркета
            images = images[:10] if images else []

            # Извлекаем характеристики
            characteristics = self._extract_characteristics(product_data)
            if not characteristics or len(characteristics) == 0:
                # Пробуем из DOM
                dom_specs = page.evaluate("""
                    () => {
                        const specs = {};
                        const specContainer = document.querySelector('[data-zone-name="productSpecifications"]');
                        if (specContainer) {
                            const specItems = specContainer.querySelectorAll('dt, .spec-name, [class*="spec-name"]');
                            const specValues = specContainer.querySelectorAll('dd, .spec-value, [class*="spec-value"]');
                            for (let i = 0; i < Math.min(specItems.length, specValues.length); i++) {
                                const name = specItems[i].textContent.trim();
                                const value = specValues[i].textContent.trim();
                                if (name && value) {
                                    specs[name] = value;
                                }
                            }
                        }
                        return specs;
                    }
                """)
                if dom_specs and len(dom_specs) > 0:
                    characteristics = dom_specs

            # Убеждаемся, что все поля валидны
            if images is None:
                images = []
            if characteristics is None:
                characteristics = {}
            if description is None:
                description = ""
            
            result = {
                "title": title if title and len(title) > 3 else "",
                "price": price,
                "old_price": self._extract_old_price(product_data) if product_data else 0,
                "description": description,
                "category": product_data.get("category", "") if product_data else "",
                "characteristics": characteristics,
                "composition": self._extract_composition(product_data) if product_data else "",
                "images": images,
                "in_stock": product_data.get("available", product_data.get("isAvailable", True)) if product_data else True
            }
            
            print(f"📦 Яндекс Маркет: Результат - название: '{result['title']}', цена: {result['price']}, изображений: {len(result['images'])}, описание: {len(result['description'])} символов, характеристик: {len(result['characteristics'])}")
            
            return result

        except PlaywrightTimeoutError:
            raise ValueError("Превышено время ожидания загрузки страницы Яндекс Маркет")
        except Exception as e:
            raise ValueError(f"Ошибка при парсинге Яндекс Маркет: {str(e)}")
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
                print("✅ Яндекс Маркет: Найдены JSON-LD данные")
                # Конвертируем JSON-LD в наш формат
                product_data = {}
                if json_ld.get('name'):
                    product_data['title'] = json_ld['name']
                if json_ld.get('offers'):
                    offers = json_ld['offers']
                    if isinstance(offers, dict) and offers.get('price'):
                        price = float(offers['price'])
                        product_data['price'] = {'value': int(price)}
                    elif isinstance(offers, list) and len(offers) > 0:
                        if offers[0].get('price'):
                            price = float(offers[0]['price'])
                            product_data['price'] = {'value': int(price)}
                if json_ld.get('description'):
                    product_data['description'] = json_ld['description']
                if json_ld.get('image'):
                    images = json_ld['image']
                    if isinstance(images, list):
                        product_data['images'] = images
                    elif isinstance(images, str):
                        product_data['images'] = [images]
                if product_data.get('title'):
                    return product_data
        except Exception as e:
            print(f"⚠️ Яндекс Маркет: Ошибка извлечения JSON-LD: {e}")
            pass
        
        # Способ 2: window.__INITIAL_DATA__ (новый формат)
        try:
            initial_data = page.evaluate("""
                () => {
                    if (window.__INITIAL_DATA__) {
                        const data = window.__INITIAL_DATA__;
                        // Пробуем разные варианты структуры
                        if (data.product) return data.product;
                        if (data.data && data.data.product) return data.data.product;
                        if (data.catalog && data.catalog.product) return data.catalog.product;
                        // Если сам объект похож на product
                        if (data.name || data.title || data.price) return data;
                        return data;
                    }
                    return null;
                }
            """)
            
            if initial_data:
                if isinstance(initial_data, dict):
                    if 'product' in initial_data:
                        print("✅ Яндекс Маркет: Найден product в __INITIAL_DATA__")
                        return initial_data['product']
                    if 'name' in initial_data or 'title' in initial_data or 'price' in initial_data:
                        print("✅ Яндекс Маркет: __INITIAL_DATA__ является product объектом")
                        return initial_data
                return initial_data
        except Exception as e:
            print(f"⚠️ Яндекс Маркет: Ошибка извлечения __INITIAL_DATA__: {e}")
            pass
        
        # Способ 3: window.__INITIAL_STATE__
        try:
            initial_state = page.evaluate("""
                () => {
                    if (window.__INITIAL_STATE__) {
                        const state = window.__INITIAL_STATE__;
                        if (state.product) return state.product;
                        if (state.data && state.data.product) return state.data.product;
                        if (state.catalog && state.catalog.product) return state.catalog.product;
                        if (state.name || state.title || state.price) return state;
                        return state;
                    }
                    return null;
                }
            """)
            
            if initial_state:
                if isinstance(initial_state, dict):
                    if 'product' in initial_state:
                        print("✅ Яндекс Маркет: Найден product в __INITIAL_STATE__")
                        return initial_state['product']
                    if 'name' in initial_state or 'title' in initial_state or 'price' in initial_state:
                        print("✅ Яндекс Маркет: __INITIAL_STATE__ является product объектом")
                        return initial_state
                return initial_state
        except Exception as e:
            print(f"⚠️ Яндекс Маркет: Ошибка извлечения __INITIAL_STATE__: {e}")
            pass
        
        # Способ 4: Ищем в window любые объекты с product
        try:
            any_product = page.evaluate("""
                () => {
                    const keys = Object.keys(window).filter(k => 
                        k.includes('INITIAL') || k.includes('DATA') || k.includes('STATE') ||
                        k.includes('YANDEX') || k.includes('MARKET') || k.includes('PRODUCT')
                    );
                    
                    for (const key of keys) {
                        try {
                            const obj = window[key];
                            if (obj && typeof obj === 'object' && obj !== null) {
                                if (obj.product) {
                                    console.log('Found product in:', key);
                                    return obj.product;
                                }
                                if (obj.data && obj.data.product) {
                                    console.log('Found product in data:', key);
                                    return obj.data.product;
                                }
                                if (obj.catalog && obj.catalog.product) {
                                    console.log('Found product in catalog:', key);
                                    return obj.catalog.product;
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
                print(f"✅ Яндекс Маркет: Найден product в window объектах")
                return any_product
        except Exception as e:
            print(f"⚠️ Яндекс Маркет: Ошибка поиска product в window: {e}")
            pass
        
        print("⚠️ Яндекс Маркет: Не удалось найти данные в JS объектах, будет использован DOM fallback")
        return None
        
        # Способ 3: Ищем JSON-LD данные
        try:
            json_ld_data = page.evaluate("""
                () => {
                    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                    for (const script of scripts) {
                        try {
                            const data = JSON.parse(script.textContent);
                            if (data['@type'] === 'Product') {
                                return data;
                            }
                        } catch (e) {}
                    }
                    return null;
                }
            """)
            
            if json_ld_data:
                return json_ld_data
        except Exception:
            pass
        
        # Способ 4: Ищем данные в скриптах
        try:
            script_data = page.evaluate("""
                () => {
                    const scripts = document.querySelectorAll('script');
                    for (const script of scripts) {
                        if (script.textContent) {
                            // Ищем __INITIAL_DATA__
                            const match = script.textContent.match(/window\\.__INITIAL_DATA__\\s*=\\s*({.+?});/s);
                            if (match) {
                                try {
                                    return JSON.parse(match[1]);
                                } catch (e) {}
                            }
                        }
                    }
                    return null;
                }
            """)
            
            if script_data and 'product' in script_data:
                return script_data['product']
        except Exception:
            pass
        
        # Способ 5: Из DOM элементов (улучшенная версия)
        try:
            dom_data = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Название - пробуем разные селекторы
                    const titleSelectors = [
                        'h1',
                        '[data-auto="product-title"]',
                        '.product-title',
                        '[data-zone-name="productTitle"]',
                        'h1[itemprop="name"]'
                    ];
                    for (const selector of titleSelectors) {
                        const titleEl = document.querySelector(selector);
                        if (titleEl && titleEl.textContent.trim()) {
                            data.title = titleEl.textContent.trim();
                            break;
                        }
                    }
                    
                    // Цена - пробуем разные селекторы (более точные)
                    const priceSelectors = [
                        '[data-auto="price"]',
                        '[data-zone-name="price"]',
                        '[itemprop="price"]',
                        '.product-price',
                        '[data-test-id="price"]'
                    ];
                    for (const selector of priceSelectors) {
                        const priceEl = document.querySelector(selector);
                        if (priceEl) {
                            const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                            if (priceText && priceText.length > 0) {
                                const priceValue = parseInt(priceText);
                                // Валидация: цена должна быть разумной (от 10 до 10 миллионов рублей)
                                if (priceValue >= 10 && priceValue <= 10000000) {
                                    data.price = { value: priceValue };
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Старая цена
                    const oldPriceSelectors = [
                        '[data-auto="old-price"]',
                        '.product-price-old',
                        '[class*="old-price"]',
                        '[class*="price-old"]'
                    ];
                    for (const selector of oldPriceSelectors) {
                        const oldPriceEl = document.querySelector(selector);
                        if (oldPriceEl) {
                            const oldPriceText = oldPriceEl.textContent.replace(/[^\\d]/g, '');
                            if (oldPriceText) {
                                data.oldPrice = { value: parseInt(oldPriceText) };
                                break;
                            }
                        }
                    }
                    
                    // Описание
                    const descSelectors = [
                        '[data-zone-name="productDescription"]',
                        '.product-description',
                        '[itemprop="description"]',
                        '[class*="description"]'
                    ];
                    for (const selector of descSelectors) {
                        const descEl = document.querySelector(selector);
                        if (descEl && descEl.textContent.trim()) {
                            data.description = descEl.textContent.trim();
                            break;
                        }
                    }
                    
                    // Изображения - пробуем разные селекторы
                    const imgSelectors = [
                        '[data-zone-name="productGallery"] img',
                        '.product-gallery img',
                        '.product-slider img',
                        '[class*="gallery"] img',
                        '[class*="image"] img',
                        '[itemprop="image"]'
                    ];
                    const images = [];
                    for (const selector of imgSelectors) {
                        const imgEls = document.querySelectorAll(selector);
                        if (imgEls.length > 0) {
                            Array.from(imgEls).forEach(img => {
                                const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.getAttribute('data-original');
                                if (src && !images.includes(src) && !src.includes('data:image')) {
                                    images.push(src);
                                }
                            });
                            if (images.length > 0) break;
                        }
                    }
                    data.images = images.slice(0, 3);
                    
                    // Характеристики из DOM
                    const specs = {};
                    const specSelectors = [
                        '[data-zone-name="productSpecifications"]',
                        '.product-specifications',
                        '[class*="specification"]',
                        '[class*="characteristic"]'
                    ];
                    for (const selector of specSelectors) {
                        const specContainer = document.querySelector(selector);
                        if (specContainer) {
                            const specItems = specContainer.querySelectorAll('dt, .spec-name, [class*="spec-name"], [class*="char-name"]');
                            const specValues = specContainer.querySelectorAll('dd, .spec-value, [class*="spec-value"], [class*="char-value"]');
                            for (let i = 0; i < Math.min(specItems.length, specValues.length); i++) {
                                const name = specItems[i].textContent.trim();
                                const value = specValues[i].textContent.trim();
                                if (name && value) {
                                    specs[name] = value;
                                }
                            }
                            if (Object.keys(specs).length > 0) break;
                        }
                    }
                    data.specifications = specs;
                    
                    // Наличие
                    const stockSelectors = [
                        '[data-auto="stock-status"]',
                        '.product-stock',
                        '[class*="stock"]',
                        '[class*="available"]'
                    ];
                    for (const selector of stockSelectors) {
                        const stockEl = document.querySelector(selector);
                        if (stockEl) {
                            const stockText = stockEl.textContent.toLowerCase();
                            data.available = !stockText.includes('нет в наличии') && 
                                           !stockText.includes('недоступен') &&
                                           !stockText.includes('закончился');
                            break;
                        }
                    }
                    if (data.available === undefined) {
                        data.available = true;
                    }
                    
                    return data;
                }
            """)
            
            if dom_data and dom_data.get('title'):
                return dom_data
        except Exception as e:
            print(f"DOM extraction error: {e}")
            pass
        
        return None

    def _extract_from_dom_only(self, page: Page) -> Dict[str, Any]:
        """Извлекает данные только из DOM для Яндекс Маркет"""
        try:
            dom_data = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Название
                    const titleEl = document.querySelector('h1') || 
                                  document.querySelector('[data-auto="product-title"]') ||
                                  document.querySelector('.product-title');
                    if (titleEl) data.title = titleEl.textContent.trim();
                    
                    // Цена - более точные селекторы с валидацией
                    const priceSelectors = [
                        '[data-auto="price"]',
                        '[data-zone-name="price"]',
                        '[itemprop="price"]',
                        '.product-price',
                        '[data-test-id="price"]'
                    ];
                    for (const selector of priceSelectors) {
                        const priceEl = document.querySelector(selector);
                        if (priceEl) {
                            const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                            if (priceText && priceText.length > 0) {
                                const priceValue = parseInt(priceText);
                                // Валидация: цена должна быть разумной (от 10 до 10 миллионов рублей)
                                if (priceValue >= 10 && priceValue <= 10000000) {
                                    data.price = { value: priceValue };
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Старая цена
                    const oldPriceEl = document.querySelector('[data-auto="old-price"]') ||
                                      document.querySelector('.product-price-old');
                    if (oldPriceEl) {
                        const oldPriceText = oldPriceEl.textContent.replace(/[^\\d]/g, '');
                        if (oldPriceText) {
                            data.oldPrice = { value: parseInt(oldPriceText) };
                        }
                    }
                    
                    // Описание
                    const descEl = document.querySelector('[data-zone-name="productDescription"]') ||
                                  document.querySelector('.product-description');
                    if (descEl) data.description = descEl.textContent.trim();
                    
                    // Изображения
                    const imgEls = document.querySelectorAll('[data-zone-name="productGallery"] img, .product-gallery img');
                    data.images = Array.from(imgEls)
                        .map(img => img.src || img.getAttribute('data-src') || img.getAttribute('data-original'))
                        .filter(Boolean)
                        .slice(0, 20);
                    
                    // Характеристики
                    const specs = {};
                    const specContainer = document.querySelector('[data-zone-name="productSpecifications"]');
                    if (specContainer) {
                        const specItems = specContainer.querySelectorAll('dt, .spec-name');
                        const specValues = specContainer.querySelectorAll('dd, .spec-value');
                        for (let i = 0; i < Math.min(specItems.length, specValues.length); i++) {
                            const name = specItems[i].textContent.trim();
                            const value = specValues[i].textContent.trim();
                            if (name && value) {
                                specs[name] = value;
                            }
                        }
                    }
                    data.specifications = specs;
                    
                    // Наличие
                    const stockEl = document.querySelector('[data-auto="stock-status"]');
                    data.available = !stockEl || !stockEl.textContent.toLowerCase().includes('нет в наличии');
                    
                    return data;
                }
            """)
            return dom_data if dom_data and dom_data.get('title') else None
        except Exception:
            return None

    def _extract_price(self, product_data: Dict[str, Any]) -> float:
        """Извлекает цену товара с валидацией"""
        # Пробуем разные варианты
        if product_data.get("price"):
            price = product_data["price"]
            if isinstance(price, dict):
                price_value = float(price.get("value", 0))
            else:
                price_value = float(price)
            
            # Валидация: цена должна быть разумной (от 10 до 10 миллионов рублей)
            if 10 <= price_value <= 10000000:
                return price_value
            else:
                # Если цена невалидна, пробуем другие источники
                pass
        
        if product_data.get("offers") and isinstance(product_data["offers"], list):
            if len(product_data["offers"]) > 0:
                offer = product_data["offers"][0]
                if isinstance(offer, dict) and offer.get("price"):
                    price = offer["price"]
                    if isinstance(price, dict):
                        price_value = float(price.get("value", 0))
                    else:
                        price_value = float(price)
                    
                    # Валидация
                    if 10 <= price_value <= 10000000:
                        return price_value
        
        # Если цена не найдена или невалидна, возвращаем 0
        return 0

    def _extract_old_price(self, product_data: Dict[str, Any]) -> float:
        """Извлекает старую цену товара"""
        if product_data.get("oldPrice"):
            old_price = product_data["oldPrice"]
            if isinstance(old_price, dict):
                return float(old_price.get("value", 0))
            return float(old_price)
        
        return 0

    def _extract_characteristics(self, product_data: Dict[str, Any]) -> Dict[str, str]:
        """Извлекает характеристики товара"""
        characteristics = {}
        
        # Если характеристики уже извлечены из DOM
        if product_data.get("specifications") and isinstance(product_data["specifications"], dict):
            characteristics.update(product_data["specifications"])
        
        if product_data.get("specifications") and isinstance(product_data["specifications"], list):
            for spec in product_data["specifications"]:
                if isinstance(spec, dict):
                    name = spec.get("name", "")
                    value = spec.get("value", "")
                    if name and value:
                        characteristics[name] = str(value)
        
        if product_data.get("characteristics"):
            if isinstance(product_data["characteristics"], dict):
                characteristics.update(product_data["characteristics"])
            elif isinstance(product_data["characteristics"], list):
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
        
        def upgrade_image_quality(url: str) -> str:
            """Улучшает качество изображения, заменяя параметры размера на максимальные"""
            if not url or not isinstance(url, str):
                return url
            
            # Убираем query параметры
            url = url.split('?')[0]
            
            # Для Yandex Market заменяем размеры на максимальные
            if 'market.yandex' in url or 'mdata.yandex' in url or 'avatars.mds.yandex' in url:
                # Заменяем размеры на orig (оригинал) или большие размеры
                url = re.sub(r'/\d+x\d+/', '/orig/', url)
                url = re.sub(r'/w\d+/', '/w2000/', url)
                url = re.sub(r'/h\d+/', '/h2000/', url)
            
            return url
        
        # Способ 1: Из данных продукта
        if product_data.get("images"):
            for img in product_data["images"]:
                if isinstance(img, dict):
                    if img.get("url"):
                        images.append(upgrade_image_quality(img["url"]))
                    elif img.get("original"):
                        images.append(upgrade_image_quality(img["original"]))
                elif isinstance(img, str):
                    images.append(upgrade_image_quality(img))
        
        if product_data.get("pictures"):
            for pic in product_data["pictures"]:
                if isinstance(pic, dict):
                    if pic.get("url"):
                        images.append(upgrade_image_quality(pic["url"]))
                    elif pic.get("original"):
                        images.append(upgrade_image_quality(pic["original"]))
                elif isinstance(pic, str):
                    images.append(upgrade_image_quality(pic))
        
        # Способ 2: Из DOM - ВСЕГДА проверяем DOM для дополнительных изображений
        try:
            dom_images = page.evaluate("""
                () => {
                    const imgEls = document.querySelectorAll('[data-zone-name="productGallery"] img, .product-gallery img, .product-slider img');
                    return Array.from(imgEls)
                        .map(img => {
                            let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy');
                            // Улучшаем качество - заменяем размеры на максимальные
                            if (src && (src.includes('market.yandex') || src.includes('mdata.yandex') || src.includes('avatars.mds.yandex'))) {
                                src = src.split('?')[0];
                                src = src.replace(/\\/\\d+x\\d+\\//g, '/orig/');
                                src = src.replace(/\\/w\\d+\\//g, '/w2000/');
                                src = src.replace(/\\/h\\d+\\//g, '/h2000/');
                            }
                            return src;
                        })
                        .filter(Boolean)
                        .slice(0, 20);
                }
            """)
            if dom_images and isinstance(dom_images, list):
                # Добавляем DOM изображения, избегая дубликатов
                for dom_img in dom_images:
                    upgraded_img = upgrade_image_quality(dom_img)
                    if upgraded_img not in images:
                        images.append(upgraded_img)
                print(f"✅ Яндекс Маркет: Добавлено {len(dom_images)} изображений из DOM, всего: {len(images)}")
        except Exception as e:
            print(f"⚠️ Яндекс Маркет: DOM images extraction error: {e}")
            pass
        
        # Ограничиваем до 10 изображений для Яндекс Маркета
        return images[:10] if images else []
