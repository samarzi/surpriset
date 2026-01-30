"""
Упрощенная версия парсера Wildberries
Сочетает простоту с надежностью
"""
import time
import random
from typing import Dict, Any
from .base import MarketplaceParserInterface
from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError


class WildberriesParserSimple(MarketplaceParserInterface):
    """Упрощенный парсер Wildberries с улучшенной надежностью"""
    
    def parse(self) -> Dict[str, Any]:
        playwright = None
        browser = None
        try:
            playwright, browser, page = self._get_browser_page()
            
            # Убираем параметры из URL
            clean_url = self.url.split('?')[0]
            
            # Открываем страницу
            page.goto(clean_url, wait_until='networkidle', timeout=self.timeout)
            self._wait_for_page_load(page)
            
            # Проверка на капчу
            page_url = page.url.lower()
            if 'captcha' in page_url or 'challenge' in page_url:
                raise ValueError("Обнаружена капча на Wildberries. Попробуйте позже.")
            
            # Извлекаем данные
            result = self._extract_data(page)
            
            if not result.get("title") or len(result["title"]) < 3:
                raise ValueError("Не удалось извлечь название товара с Wildberries")
            
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
                if (window.__WBLB_INITIAL_DATA__ && window.__WBLB_INITIAL_DATA__.product) {
                    return window.__WBLB_INITIAL_DATA__.product;
                }
                if (window.__WB_INITIAL_DATA__ && window.__WB_INITIAL_DATA__.product) {
                    return window.__WB_INITIAL_DATA__.product;
                }
                return null;
            }
        """)
        
        if js_data:
            # Название
            result["title"] = (js_data.get("name") or 
                              js_data.get("title") or 
                              js_data.get("productName") or 
                              js_data.get("imt_name") or "")
            
            # Цена (в копейках, делим на 100)
            sale_price = js_data.get("salePriceU", 0)
            if sale_price:
                result["price"] = sale_price / 100
            
            # Старая цена
            old_price = js_data.get("priceU", 0)
            if old_price and old_price != sale_price:
                result["old_price"] = old_price / 100
            
            # Описание
            result["description"] = js_data.get("description") or js_data.get("text", "")
            
            # Категория
            result["category"] = js_data.get("subjectName") or js_data.get("category", "")
            
            # Изображения - извлекаем минимум 5 фото
            photos = js_data.get("photos", [])
            print(f"🔍 Wildberries images count from JS: {len(photos)}")
            
            for photo in photos:
                if isinstance(photo, dict):
                    # Пробуем разные поля для URL
                    full_size = photo.get("fullSize") or photo.get("big") or photo.get("c516x688")
                    if full_size:
                        url = f"https://{full_size}" if not full_size.startswith('http') else full_size
                        if url not in result["images"]:
                            result["images"].append(url)
                    elif photo.get("url"):
                        url = photo["url"]
                        if not url.startswith('http'):
                            url = f"https:{url}" if url.startswith('//') else f"https://{url}"
                        if url not in result["images"]:
                            result["images"].append(url)
                elif isinstance(photo, str) and photo:
                    url = f"https://{photo}" if not photo.startswith('http') else photo
                    if url not in result["images"]:
                        result["images"].append(url)
            
            print(f"✅ Wildberries images extracted from JS: {len(result['images'])}")
            
            # Характеристики
            specs = js_data.get("specs", []) or js_data.get("characteristics", [])
            for spec in specs:
                if isinstance(spec, dict):
                    name = spec.get("name") or ""
                    value = spec.get("value") or ""
                    if name and value:
                        result["characteristics"][name] = str(value)
            
            # Наличие
            stocks = js_data.get("stocks", [])
            if stocks:
                result["in_stock"] = stocks[0].get("inStock", False) if isinstance(stocks[0], dict) else False
            else:
                result["in_stock"] = js_data.get("quantity", 1) > 0
        
        # Способ 2: Fallback на DOM если JS данные неполные
        if not result["title"] or result["price"] == 0 or len(result["images"]) < 5:
            dom_data = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Название
                    const titleEl = document.querySelector('h1, .product-page__title');
                    if (titleEl) data.title = titleEl.textContent.trim();
                    
                    // Цена
                    const priceEl = document.querySelector('.price-block__final-price, .product-page__price');
                    if (priceEl) {
                        const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                        if (priceText) data.price = parseInt(priceText);
                    }
                    
                    // Описание
                    const descEl = document.querySelector('.product-page__description');
                    if (descEl) data.description = descEl.textContent.trim();
                    
                    // Изображения - улучшенная логика
                    const imageUrls = new Set();
                    
                    // Способ 1: Галерея товара
                    const galleryImgs = document.querySelectorAll('.product-page__gallery img, .product-page__slider img, [class*="Gallery"] img');
                    galleryImgs.forEach(img => {
                        let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
                        if (src && src.startsWith('http')) {
                            imageUrls.add(src);
                        }
                    });
                    
                    // Способ 2: Миниатюры
                    const thumbnails = document.querySelectorAll('.product-page__thumbs img, [class*="thumb"] img');
                    thumbnails.forEach(img => {
                        let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
                        if (src && src.startsWith('http')) {
                            // Заменяем миниатюры на полноразмерные
                            src = src.replace('/tm/', '/big/').replace('/c246x328/', '/c516x688/');
                            imageUrls.add(src);
                        }
                    });
                    
                    // Способ 3: Все изображения с CDN Wildberries
                    const allImgs = document.querySelectorAll('img[src*="basket"]');
                    allImgs.forEach(img => {
                        let src = img.src || img.getAttribute('src');
                        if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
                            src = src.replace('/tm/', '/big/').replace('/c246x328/', '/c516x688/');
                            imageUrls.add(src);
                        }
                    });
                    
                    data.images = Array.from(imageUrls).slice(0, 10);
                    console.log('DOM images extracted:', data.images.length);
                    
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
                    print(f"✅ Wildberries total images after DOM merge: {len(result['images'])}")
                if not result["description"] and dom_data.get("description"):
                    result["description"] = dom_data["description"]
        
        # Извлекаем состав из характеристик
        composition_keys = ["Состав", "Материал", "Composition", "Material"]
        for key in composition_keys:
            if key in result["characteristics"]:
                result["composition"] = result["characteristics"][key]
                break
        
        return result
