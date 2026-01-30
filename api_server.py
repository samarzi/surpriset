from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import logging
import time as time_module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from parsers import get_parser

app = Flask(__name__)
CORS(app)  # Разрешаем CORS запросы от SurpriSet

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/api_server.log'),
        logging.StreamHandler()
    ]
)

@app.route('/api/parse', methods=['GET'])
def parse_product():
    """API endpoint для парсинга товаров"""
    start_time = time_module.time()
    url = request.args.get('url')
    
    try:
        # Логируем запрос для отладки
        logging.info(f"📥 Received parse request: url={url}")
        
        if not url:
            logging.error("❌ Error: URL parameter is missing")
            return jsonify({
                "success": False,
                "error": "URL parameter is required. Please provide a valid marketplace URL."
            }), 400
        
        if not url.strip():
            logging.error("❌ Error: URL parameter is empty")
            return jsonify({
                "success": False,
                "error": "URL parameter cannot be empty. Please provide a valid marketplace URL."
            }), 400

        # Декодируем URL для корректной обработки
        try:
            from urllib.parse import unquote
            url = unquote(url)
        except Exception:
            pass

        # Проверка на капчу в URL
        if 'captcha' in url.lower() or 'challenge' in url.lower():
            logging.warning(f"⚠️ Captcha detected in URL: {url}")
            return jsonify({
                "success": False,
                "error": "Обнаружена капча в URL. Попробуйте использовать чистую ссылку на товар."
            }), 400

        # Определяем и запускаем соответствующий парсер
        logging.info(f"🔍 Parsing URL: {url}")
        try:
            parser = get_parser(url)
        except ValueError as ve:
            logging.error(f"❌ Parser selection error: {str(ve)}")
            return jsonify({
                "success": False,
                "error": str(ve)
            }), 400
        
        # Таймаут: если парсинг > 60 секунд → ошибка
        product_data = parser.parse()
        
        elapsed_time = time_module.time() - start_time
        logging.info(f"✅ Successfully parsed product: {product_data.get('title', 'Unknown')} (took {elapsed_time:.2f}s)")
        
        if elapsed_time > 15:
            logging.warning(f"⚠️ Parsing took {elapsed_time:.2f}s (more than 15s)")
        
        return jsonify({
            "success": True,
            "data": product_data
        })

    except ValueError as e:
        # Ошибки парсинга (неподдерживаемый маркетплейс, не удалось извлечь данные)
        elapsed_time = time_module.time() - start_time
        logging.error(f"❌ Parse error after {elapsed_time:.2f}s: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as e:
        # Другие ошибки
        elapsed_time = time_module.time() - start_time
        logging.error(f"❌ Unexpected error after {elapsed_time:.2f}s: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Проверка здоровья API"""
    return jsonify({"ok": True})

@app.route('/', methods=['GET'])
def root():
    """Корневой маршрут для проверки работы сервера"""
    return jsonify({
        "status": "ok",
        "message": "Marketplace Parser API is running",
        "endpoints": {
            "/api/parse": "GET - Parse product from marketplace URL",
            "/api/health": "GET - Health check"
        }
    })

if __name__ == '__main__':
    # Используем порт 5001 по умолчанию, так как 5000 часто занят AirPlay на macOS
    port = int(os.environ.get('FLASK_PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Starting Flask API server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
