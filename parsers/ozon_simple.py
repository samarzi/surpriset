"""
Упрощенная версия парсера Ozon
Сочетает простоту с надежностью
"""
import time
import random
import re
from typing import Dict, Any
from .base import MarketplaceParserInterface
from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError


class OzonParserSimple(MarketplaceParserInterface):
    """Упрощенный парсер Ozon с улучшенной надежностью"""
    
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
            page_title = page.title().lower()
            if 'captcha' in page_url or 'challenge' in page_url or ('бот' in page_title and 'подтвердите' in page_title):
                raise ValueError("Обнаружена капча на Ozon. Попробуйте позже.")
            
            # Извлекаем данные
            result = self._extract_data(page)
            
            if not result.get("title") or len(result["title"]) < 3:
                raise ValueError("Не удалось извлечь название товара с Ozon")
            
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
                if (window.__APP_STATE__ && window.__APP_STATE__.product) {
                    return window.__APP_STATE__.product;
                }
                if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.product) {
                    return window.__INITIAL_STATE__.product;
                }
                return null;
            }
        """)
        
        if js_data:
            result["title"] = js_data.get("name") or js_data.get("title") or ""
            result["description"] = js_data.get("description") or ""
            result["category"] = js_data.get("category") or ""
            
            # Цена - улучшенная обработка
            price = js_data.get("price", 0)
            print(f"🔍 Ozon price raw data: {price}, type: {type(price)}")
            
            if isinstance(price, dict):
                # Пробуем разные ключи
                price = price.get("value", 0) or price.get("price", 0) or price.get("amount", 0)
                print(f"🔍 Ozon price from dict: {price}")
            
            if isinstance(price, str):
                # Если цена в виде строки, извлекаем числа
                price_match = re.search(r'(\d+(?:\s?\d+)*)', price.replace(',', '').replace(' ', ''))
                if price_match:
                    price = int(price_match.group(1))
                    print(f"🔍 Ozon price from string: {price}")
            
            if isinstance(price, (int, float)) and price > 0:
                # НЕ конвертируем из копеек - Ozon возвращает цену в рублях
                # Старая логика была неправильной: if price > 1000 then price / 100
                # Это превращало 1329₽ в 13.29₽
                result["price"] = float(price)
            
            print(f"✅ Ozon final price: {result['price']}")
            
            # Старая цена - аналогично
            old_price = js_data.get("oldPrice", 0) or js_data.get("originalPrice", 0) or js_data.get("priceWithoutDiscount", 0)
            print(f"🔍 Ozon old_price raw data: {old_price}, type: {type(old_price)}")
            
            if isinstance(old_price, dict):
                old_price = old_price.get("value", 0) or old_price.get("price", 0) or old_price.get("amount", 0)
                print(f"🔍 Ozon old_price from dict: {old_price}")
            
            if isinstance(old_price, str):
                price_match = re.search(r'(\d+(?:\s?\d+)*)', old_price.replace(',', '').replace(' ', ''))
                if price_match:
                    old_price = int(price_match.group(1))
                    print(f"🔍 Ozon old_price from string: {old_price}")
            
            if isinstance(old_price, (int, float)) and old_price > 0:
                # НЕ конвертируем из копеек
                if old_price != result["price"]:
                    result["old_price"] = float(old_price)
            
            print(f"✅ Ozon final old_price: {result['old_price']}")
            
            # Изображения - извлекаем минимум 5 фото
            images = js_data.get("images", [])
            print(f"🔍 Ozon images count from JS: {len(images)}")
            
            for img in images:
                if isinstance(img, dict):
                    url = img.get("url") or img.get("original") or img.get("src") or img.get("link")
                    if url:
                        # Улучшаем качество изображений
                        if 'cdn' in url or 'ozon' in url:
                            url = url.split('?')[0]
                            # Заменяем размеры на максимальные
                            url = url.replace('/w200/', '/w2000/').replace('/h200/', '/h2000/')
                            url = url.replace('/w300/', '/w2000/').replace('/h300/', '/h2000/')
                            url = url.replace('/w400/', '/w2000/').replace('/h400/', '/h2000/')
                            url = url.replace('/w500/', '/w2000/').replace('/h500/', '/h2000/')
                        if url not in result["images"]:
                            result["images"].append(url)
                elif isinstance(img, str) and img:
                    if 'cdn' in img or 'ozon' in img:
                        img = img.split('?')[0]
                        img = img.replace('/w200/', '/w2000/').replace('/h200/', '/h2000/')
                        img = img.replace('/w300/', '/w2000/').replace('/h300/', '/h2000/')
                        img = img.replace('/w400/', '/w2000/').replace('/h400/', '/h2000/')
                        img = img.replace('/w500/', '/w2000/').replace('/h500/', '/h2000/')
                    if img not in result["images"]:
                        result["images"].append(img)
            
            print(f"✅ Ozon images extracted from JS: {len(result['images'])}")
            
            # Характеристики
            specs = js_data.get("specifications", []) or js_data.get("characteristics", [])
            for spec in specs:
                if isinstance(spec, dict):
                    name = spec.get("name") or spec.get("key", "")
                    value = spec.get("value") or ""
                    if name and value:
                        result["characteristics"][name] = str(value)
            
            # Наличие
            result["in_stock"] = js_data.get("isAvailable", js_data.get("available", True))
        
        # Способ 2: Fallback на DOM если JS данные неполные
        if not result["title"] or result["price"] == 0 or len(result["images"]) < 5:
            dom_data = page.evaluate("""
                () => {
                    const data = {};
                    
                    // Название
                    const titleEl = document.querySelector('h1, [data-widget="webProductHeading"]');
                    if (titleEl) data.title = titleEl.textContent.trim();
                    
                    // Цена - пробуем разные селекторы
                    let priceEl = document.querySelector('[data-widget="webPrice"]');
                    if (!priceEl) priceEl = document.querySelector('.product-page__price');
                    if (!priceEl) priceEl = document.querySelector('[class*="Price"]');
                    
                    if (priceEl) {
                        const priceText = priceEl.textContent.replace(/[^\\d]/g, '');
                        if (priceText) {
                            data.price = parseInt(priceText);
                            console.log('DOM price extracted:', data.price);
                        }
                    }
                    
                    // Описание
                    const descEl = document.querySelector('[data-widget="webProductDescription"]');
                    if (descEl) data.description = descEl.textContent.trim();
                    
                    // Изображения - улучшенная логика для извлечения всех изображений галереи
                    const imageUrls = new Set();
                    
                    // Способ 1: Галерея товара
                    const galleryImgs = document.querySelectorAll('[data-widget="webGallery"] img, .product-page__gallery img, [class*="Gallery"] img');
                    galleryImgs.forEach(img => {
                        let src = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('src') || img.currentSrc;
                        if (src && (src.includes('cdn') || src.includes('ozon'))) {
                            // Очищаем URL и улучшаем качество
                            src = src.split('?')[0];
                            src = src.replace(/\\/w\\d+\\//, '/w2000/').replace(/\\/h\\d+\\//, '/h2000/');
                            imageUrls.add(src);
                        }
                    });
                    
                    // Способ 2: Миниатюры галереи
                    const thumbnails = document.querySelectorAll('[data-widget="webGallery"] button img, .product-gallery__thumbnail img');
                    thumbnails.forEach(img => {
                        let src = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('src') || img.currentSrc;
                        if (src && (src.includes('cdn') || src.includes('ozon'))) {
                            src = src.split('?')[0];
                            src = src.replace(/\\/w\\d+\\//, '/w2000/').replace(/\\/h\\d+\\//, '/h2000/');
                            imageUrls.add(src);
                        }
                    });
                    
                    // Способ 3: Все изображения с CDN Ozon на странице
                    const allImgs = document.querySelectorAll('img[src*="cdn"], img[src*="ozon"]');
                    allImgs.forEach(img => {
                        let src = img.src || img.getAttribute('src');
                        if (src && (src.includes('cdn') || src.includes('ozon')) && !src.includes('logo') && !src.includes('icon')) {
                            src = src.split('?')[0];
                            src = src.replace(/\\/w\\d+\\//, '/w2000/').replace(/\\/h\\d+\\//, '/h2000/');
                            // Фильтруем только изображения товара (обычно содержат /wc в пути)
                            if (src.includes('/wc') || src.includes('/product')) {
                                imageUrls.add(src);
                            }
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
                    print(f"🔍 Ozon DOM price: {result['price']}")
                # Объединяем изображения из JS и DOM, удаляя дубликаты
                if dom_data.get("images"):
                    for img in dom_data["images"]:
                        if img not in result["images"]:
                            result["images"].append(img)
                    print(f"✅ Ozon total images after DOM merge: {len(result['images'])}")
                if not result["description"] and dom_data.get("description"):
                    result["description"] = dom_data["description"]
        
        # Извлекаем состав из характеристик
        composition_keys = ["Состав", "Материал", "Composition", "Material"]
        for key in composition_keys:
            if key in result["characteristics"]:
                result["composition"] = result["characteristics"][key]
                break
        
        return result
