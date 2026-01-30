import os
import json
import re
import time
import random
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError

load_dotenv()

class MarketplaceParserInterface(ABC):
    def __init__(self, url: str):
        self.url = url
        self.timeout = 30000  # 30 секунд таймаут по умолчанию

    @abstractmethod
    def parse(self) -> Dict[str, Any]:
        """
        Должен возвращать объект:
        {
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
        """
        pass

    def _get_browser_page(self) -> Tuple[Any, Browser, Page]:
        """Создает браузер и страницу через Playwright. Возвращает (playwright, browser, page)"""
        playwright = sync_playwright().start()
        # headless можно отключить через переменную окружения для отладки
        # По умолчанию headless=True для продакшена, но можно включить headful для обхода защиты
        headless_mode = os.environ.get('PLAYWRIGHT_HEADLESS', 'true').lower() == 'true'
        browser = playwright.chromium.launch(
            headless=headless_mode,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',  # Скрываем автоматизацию
            ]
        )
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            locale='ru-RU',
            timezone_id='Europe/Moscow',
            # Добавляем дополнительные заголовки для обхода капчи
            extra_http_headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0',
            }
        )
        # Скрываем автоматизацию - расширенная версия
        page = context.new_page()
        page.add_init_script("""
            // Скрываем webdriver
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            
            // Добавляем реалистичные свойства navigator
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            
            Object.defineProperty(navigator, 'languages', {
                get: () => ['ru-RU', 'ru', 'en-US', 'en']
            });
            
            // Скрываем автоматизацию в window
            window.navigator.chrome = {
                runtime: {}
            };
            
            // Добавляем реалистичные свойства
            Object.defineProperty(navigator, 'permissions', {
                get: () => ({
                    query: () => Promise.resolve({ state: 'granted' })
                })
            });
            
            // Переопределяем toString для скрытия автоматизации
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        """)
        return playwright, browser, page

    def _wait_for_page_load(self, page: Page, timeout: int = None) -> None:
        """Ожидает полной загрузки страницы и выполнения JS"""
        timeout = timeout or self.timeout
        try:
            # Ждем загрузки DOM
            page.wait_for_load_state('domcontentloaded', timeout=timeout)
            # Случайная задержка 3-5 секунд для обхода защиты
            time.sleep(random.uniform(3, 5))
            # Ждем загрузки всех ресурсов (networkidle)
            try:
                page.wait_for_load_state('networkidle', timeout=15000)
            except PlaywrightTimeoutError:
                # Если не удалось дождаться networkidle, продолжаем
                pass
            # Дополнительная задержка для полной загрузки JS
            time.sleep(random.uniform(1, 2))
        except PlaywrightTimeoutError:
            # Если не удалось дождаться, продолжаем с domcontentloaded
            pass

    def _extract_from_window_object(self, page: Page, object_path: str) -> Any:
        """Извлекает данные из window объекта на странице"""
        try:
            return page.evaluate(f"window.{object_path}")
        except Exception:
            return None

    def _safe_evaluate(self, page: Page, script: str, default: Any = None) -> Any:
        """Безопасное выполнение JavaScript на странице"""
        try:
            return page.evaluate(script)
        except Exception:
            return default
