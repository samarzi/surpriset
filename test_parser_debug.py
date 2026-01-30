#!/usr/bin/env python3
"""
Скрипт для отладки парсеров
Показывает что именно доступно на странице маркетплейса
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from parsers.base import MarketplaceParserInterface
from playwright.sync_api import sync_playwright
import json

def debug_page(url: str):
    """Отлаживает страницу и показывает доступные данные"""
    playwright = sync_playwright().start()
    browser = playwright.chromium.launch(headless=False)  # headful для визуальной отладки
    context = browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale='ru-RU',
        timezone_id='Europe/Moscow',
    )
    page = context.new_page()
    
    # Убираем параметры из URL
    clean_url = url.split('?')[0]
    
    print(f"🔍 Открываем страницу: {clean_url}")
    page.goto(clean_url, wait_until='networkidle', timeout=30000)
    
    # Ждем загрузки
    import time
    time.sleep(5)
    
    print("\n" + "="*80)
    print("📋 ДИАГНОСТИКА СТРАНИЦЫ")
    print("="*80)
    
    # 1. Проверяем window объекты
    print("\n1️⃣ Window объекты:")
    window_objects = page.evaluate("""
        () => {
            const objects = {};
            for (let key in window) {
                if (key.includes('INITIAL') || key.includes('DATA') || key.includes('STATE') || 
                    key.includes('APP') || key.includes('WB') || key.includes('OZON')) {
                    try {
                        const obj = window[key];
                        if (obj && typeof obj === 'object') {
                            objects[key] = {
                                type: typeof obj,
                                hasProduct: !!(obj.product || (obj.data && obj.data.product)),
                                keys: Object.keys(obj).slice(0, 10)
                            };
                        }
                    } catch (e) {
                        objects[key] = { error: str(e) };
                    }
                }
            }
            return objects;
        }
    """)
    print(json.dumps(window_objects, indent=2, ensure_ascii=False))
    
    # 2. Проверяем название
    print("\n2️⃣ Название товара:")
    title_info = page.evaluate("""
        () => {
            const selectors = ['h1', '.product-page__title', '[data-product-name]', '[class*="title"]'];
            const results = {};
            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) {
                    results[selector] = el.textContent.trim().substring(0, 100);
                }
            }
            return results;
        }
    """)
    print(json.dumps(title_info, indent=2, ensure_ascii=False))
    
    # 3. Проверяем цену
    print("\n3️⃣ Цена товара:")
    price_info = page.evaluate("""
        () => {
            const selectors = ['.price', '[class*="price"]', '[data-product-price]', '[itemprop="price"]'];
            const results = {};
            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) {
                    results[selector] = el.textContent.trim();
                }
            }
            return results;
        }
    """)
    print(json.dumps(price_info, indent=2, ensure_ascii=False))
    
    # 4. Проверяем изображения
    print("\n4️⃣ Изображения:")
    images_info = page.evaluate("""
        () => {
            const imgEls = document.querySelectorAll('img');
            const images = [];
            Array.from(imgEls).slice(0, 5).forEach(img => {
                images.push({
                    src: img.src.substring(0, 100),
                    dataSrc: img.getAttribute('data-src') ? img.getAttribute('data-src').substring(0, 100) : null,
                    alt: img.alt ? img.alt.substring(0, 50) : null
                });
            });
            return images;
        }
    """)
    print(json.dumps(images_info, indent=2, ensure_ascii=False))
    
    # 5. Проверяем описание
    print("\n5️⃣ Описание:")
    desc_info = page.evaluate("""
        () => {
            const selectors = ['.product-page__description', '[class*="description"]', '[itemprop="description"]'];
            const results = {};
            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) {
                    results[selector] = el.textContent.trim().substring(0, 200);
                }
            }
            return results;
        }
    """)
    print(json.dumps(desc_info, indent=2, ensure_ascii=False))
    
    print("\n" + "="*80)
    print("✅ Диагностика завершена. Браузер останется открытым для визуального осмотра.")
    print("Нажмите Enter для закрытия...")
    input()
    
    browser.close()
    playwright.stop()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование: python test_parser_debug.py <URL>")
        print("Пример: python test_parser_debug.py 'https://www.wildberries.ru/catalog/315215210/detail.aspx'")
        sys.exit(1)
    
    url = sys.argv[1]
    debug_page(url)
