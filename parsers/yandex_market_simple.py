"""
Упрощенная версия парсера Яндекс Маркет
Сочетает простоту с надежностью
"""
import time
import random
from typing import Dict, Any
from .base import MarketplaceParserInterface
from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError


class YandexMarketParserSimple(MarketplaceParserInterface):
    """Упрощенный парсер Яндекс Маркет с улучшенной надежностью"""
    
    def parse(self) -> Dict[str, Any]:
        playwright = None
        browser = None
        try:
            playwright, browser, page = self._get_browser_page()
            
            # Убираем параметры из URL для избежания капчи
            clean_url = self.url.split('?')[0]
            
            # Открываем страницу
            page.goto(clean_url, wait_until='networkidle', timeout=self.timeout)
            
            # Проверка на капчу
            if 'captcha' in page.url.lower() or 'smartcaptcha' in page.content().lower():
                raise ValueError("Обнаружена капча на Яндекс Маркет. Попробуйте позже.")
            
            self._wait_for_page_load(page)
            
            # Извлекаем данные
            result = self._extract_data(page)
            
            if not result.get("title") or len(result["title"]) < 3:
                raise ValueError("Не удалось извлечь название товара с Яндекс Маркет")
            
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
    
    def _extract_data(self, page: Page) -> Dict[str, Any]:
        """Извлекает данные товара"""
        result = {
            "title": "",
            "price": 0,
            "old_price": 0,
            "description": "",
            "category": "",
            "characteristics": {},
            "composition": "",
            "images": [],
            "in_stock": True
        }
        
        # Способ 1: Из JS объектов
        js_data = page.evaluate("""
            () => {
                if (window.__INITIAL_DATA__ && window.__INITIAL_DATA__.product) {
                    return window.__INITIAL_DATA__.product;
                }
                if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.product) {
                    return window.__INITIAL_STATE__.product;
                }
                return null;
            }
        """)
        
        if js_data:
            result["title"] = js_data.get("name") or js_data.get("title") or ""
            
            # Описание - ищем реальное описание товара, а не шаблон
            description = js_data.get("description") or ""
            # Если описание слишком короткое или выглядит как шаблон, пробуем другие поля
            if not description or len(description) < 50:
                description = (
                    js_data.get("fullDescription") or 
                    js_data.get("detailedDescription") or 
                    js_data.get("longDescription") or 
                    description
                )
            result["description"] = description
            
            result["category"] = js_data.get("category") or ""
            
            # Цена
            price = js_data.get("price", 0)
            if isinstance(price, dict):
                price = price.get("value", 0)
            # Валидация цены
            if 10 <= price <= 10000000:
                result["price"] = float(price)
            
            # Старая цена
            old_price = js_data.get("oldPrice", 0)
            if isinstance(old_price, dict):
                old_price = old_price.get("value", 0)
            if 10 <= old_price <= 10000000 and old_price != price:
                result["old_price"] = float(old_price)
            
            # Изображения - извлекаем минимум 5 фото
            media = js_data.get("media", []) or js_data.get("images", []) or js_data.get("pictures", [])
            print(f"🔍 Yandex images count from JS: {len(media)}")
            
            for img in media:
                if isinstance(img, dict):
                    url = img.get("url") or img.get("original") or img.get("src") or img.get("link")
                    if url:
                        # Улучшаем качество изображений
                        if url.startswith('//'):
                            url = 'https:' + url
                        if url.startswith('http'):
                            # Заменяем размеры на максимальные для Яндекс
                            url = url.replace('/200x200/', '/900x1200/').replace('/300x300/', '/900x1200/')
                            url = url.replace('/400x400/', '/900x1200/').replace('/500x500/', '/900x1200/')
                            if url not in result["images"]:
                                result["images"].append(url)
                elif isinstance(img, str):
                    url = img
                    if url.startswith('//'):
                        url = 'https:' + url
                    if url.startswith('http') and url not in result["images"]:
                        url = url.replace('/200x200/', '/900x1200/').replace('/300x300/', '/900x1200/')
                        url = url.replace('/400x400/', '/900x1200/').replace('/500x500/', '/900x1200/')
                        result["images"].append(url)
            
            print(f"✅ Yandex images extracted from JS: {len(result['images'])}")
            
            # Характеристики
            specs = js_data.get("specs", {}) or js_data.get("specifications", {}) or js_data.get("characteristics", {})
            if isinstance(specs, dict):
                result["characteristics"] = {k: str(v) for k, v in specs.items() if v}
            elif isinstance(specs, list):
                for spec in specs:
                    if isinstance(spec, dict):
                        name = spec.get("name") or ""
                        value = spec.get("value") or ""
                        if name and value:
                            result["characteristics"][name] = str(value)
            
            # Наличие
            result["in_stock"] = js_data.get("available", js_data.get("isAvailable", True))
        
        # Способ 2: Fallback на DOM если JS данные неполные
        if not result["title"] or result["price"] == 0 or len(result["images"]) < 5:
            dom_data = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Название
                    const titleEl = document.querySelector('h1, [data-auto="product-title"]');
                    if (titleEl) data.title = titleEl.textContent.trim();
                    
                    // Цена
                    const priceEl = document.querySelector('[data-auto="price"], [data-zone-name="price"]');
                    if (priceEl) {
                        const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                        if (priceText) {
                            const priceValue = parseInt(priceText);
                            if (priceValue >= 10 && priceValue <= 10000000) {
                                data.price = priceValue;
                            }
                        }
                    }
                    
                    // Описание - ищем реальное описание товара
                    let descEl = document.querySelector('[data-zone-name="productDescription"]');
                    if (!descEl || descEl.textContent.trim().length < 50) {
                        // Пробуем другие селекторы для описания
                        descEl = document.querySelector('[data-auto="description"], .product-description, [itemprop="description"]');
                    }
                    if (descEl) {
                        const descText = descEl.textContent.trim();
                        // Фильтруем шаблонные описания
                        if (descText.length > 50 && !descText.includes('Характеристики товара')) {
                            data.description = descText;
                        }
                    }
                    
                    // Изображения - улучшенная логика для извлечения всех изображений галереи
                    const imageUrls = new Set();
                    
                    // Способ 1: Галерея товара
                    const galleryImgs = document.querySelectorAll('[data-zone-name="productGallery"] img, .product-gallery img, [class*="Gallery"] img');
                    galleryImgs.forEach(img => {
                        let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
                        if (src && src.startsWith('http')) {
                            // Улучшаем качество
                            src = src.replace('/200x200/', '/900x1200/').replace('/300x300/', '/900x1200/');
                            src = src.replace('/400x400/', '/900x1200/').replace('/500x500/', '/900x1200/');
                            imageUrls.add(src);
                        }
                    });
                    
                    // Способ 2: Миниатюры галереи
                    const thumbnails = document.querySelectorAll('[data-zone-name="productGallery"] button img, .product-gallery__thumbnail img');
                    thumbnails.forEach(img => {
                        let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
                        if (src && src.startsWith('http')) {
                            src = src.replace('/200x200/', '/900x1200/').replace('/300x300/', '/900x1200/');
                            src = src.replace('/400x400/', '/900x1200/').replace('/500x500/', '/900x1200/');
                            imageUrls.add(src);
                        }
                    });
                    
                    // Способ 3: Все изображения товара на странице
                    const allImgs = document.querySelectorAll('img[src*="avatars.mds.yandex.net"], img[src*="market-pics"]');
                    allImgs.forEach(img => {
                        let src = img.src || img.getAttribute('src');
                        if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
                            src = src.replace('/200x200/', '/900x1200/').replace('/300x300/', '/900x1200/');
                            src = src.replace('/400x400/', '/900x1200/').replace('/500x500/', '/900x1200/');
                            imageUrls.add(src);
                        }
                    });
                    
                    data.images = Array.from(imageUrls).slice(0, 10);
                    console.log('DOM images extracted:', data.images.length);
                    
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
                    data.characteristics = specs;
                    
                    return data;
                }
            """)
            
            if dom_data:
                if not result["title"] and dom_data.get("title"):
                    result["title"] = dom_data["title"]
                if result["price"] == 0 and dom_data.get("price"):
                    result["price"] = dom_data["price"]
                # Объединяем изображения из JS и DOM, удаляя дубликаты
                if dom_data.get("images"):
                    for img in dom_data["images"]:
                        if img not in result["images"]:
                            result["images"].append(img)
                    print(f"✅ Yandex total images after DOM merge: {len(result['images'])}")
                if not result["description"] and dom_data.get("description"):
                    result["description"] = dom_data["description"]
                if not result["characteristics"] and dom_data.get("characteristics"):
                    result["characteristics"] = dom_data["characteristics"]
        
        # Извлекаем состав из характеристик
        composition_keys = ["Состав", "Материал", "Composition", "Material"]
        for key in composition_keys:
            if key in result["characteristics"]:
                result["composition"] = result["characteristics"][key]
                break
        
        return result
