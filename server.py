#!/usr/bin/env python3
"""
HTTP server for Railway deployment with integrated CORS proxy
"""
import os
import http.server
import socketserver
from pathlib import Path
from urllib.request import Request, build_opener, ProxyHandler as UrllibProxyHandler, HTTPBasicAuthHandler, HTTPPasswordMgrWithDefaultRealm

# Получаем порт из переменной окружения или используем 8000 по умолчанию
PORT = int(os.environ.get('PORT', 8000))

# Устанавливаем директорию для сервера
DIRECTORY = Path(__file__).parent

# Настройки внешнего прокси (опционально, можно использовать без прокси)
PROXY_HOST = '109.104.153.193'
PROXY_PORT = 11709
PROXY_USER = 'H7TQ9s1USVBPyjuj'
PROXY_PASS = 'H7TQ9s1USVBPyjuj'
USE_PROXY = False  # Можно включить если нужен внешний прокси

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
    
    def do_OPTIONS(self):
        # Обработка CORS preflight запросов
        if self.path.startswith('/api/proxy/'):
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
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
    
    def log_message(self, format, *args):
        # Логируем только важные сообщения
        if '404' in format or '500' in format or '/api/proxy' in format:
            print(f"{self.address_string()} - {format % args}")

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server starting on port {PORT}")
        print(f"Serving directory: {DIRECTORY}")
        print(f"Proxy enabled: {USE_PROXY}")
        httpd.serve_forever()

