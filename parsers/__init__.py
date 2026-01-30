import os
from .wildberries import WildberriesParser
from .ozon import OzonParser
from .yandex_market import YandexMarketParser

# Упрощенные версии парсеров (опционально, можно переключиться)
try:
    from .wildberries_simple import WildberriesParserSimple
    from .ozon_simple import OzonParserSimple
    from .yandex_market_simple import YandexMarketParserSimple
    # Переключите на True для использования упрощенных версий
    # Можно также установить через переменную окружения: export USE_SIMPLE_PARSERS=true
    # Упрощенные парсеры могут работать лучше, если полные не справляются
    USE_SIMPLE_PARSERS = os.environ.get('USE_SIMPLE_PARSERS', 'false').lower() == 'true'
except ImportError:
    USE_SIMPLE_PARSERS = False

def get_marketplace(url: str) -> str:
    """Определяет маркетплейс по URL"""
    if "wildberries.ru" in url:
        return "wb"
    elif "ozon.ru" in url:
        return "ozon"
    elif "market.yandex.ru" in url:
        return "ym"
    else:
        return None

def get_parser(url: str):
    """Возвращает соответствующий парсер для URL"""
    marketplace = get_marketplace(url)
    
    if USE_SIMPLE_PARSERS:
        # Используем упрощенные версии
        if marketplace == "wb":
            return WildberriesParserSimple(url)
        elif marketplace == "ozon":
            return OzonParserSimple(url)
        elif marketplace == "ym":
            return YandexMarketParserSimple(url)
    else:
        # Используем полные версии с retry и fallback
        if marketplace == "wb":
            return WildberriesParser(url)
        elif marketplace == "ozon":
            return OzonParser(url)
        elif marketplace == "ym":
            return YandexMarketParser(url)
    
    raise ValueError(f"Неподдерживаемый маркетплейс: {url}")
