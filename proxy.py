#!/usr/bin/env python3
"""
CORS proxy for loading DIGI combinations API with external proxy support
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen, build_opener, ProxyHandler as UrllibProxyHandler, HTTPBasicAuthHandler, HTTPPasswordMgrWithDefaultRealm
from urllib.error import URLError
import json

# Настройки внешнего прокси
PROXY_HOST = '109.104.153.193'
PROXY_PORT = 11709
PROXY_USER = 'H7TQ9s1USVBPyjuj'
PROXY_PASS = 'H7TQ9s1USVBPyjuj'
PROXY_URL = f'http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}'

class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/proxy/'):
            # Извлекаем URL из пути
            api_path = self.path.replace('/api/proxy/', '')
            target_url = f'https://www.digimobil.es/api/v1/{api_path}'
            
            try:
                # Настраиваем прокси с аутентификацией
                # Формат: http://user:pass@host:port
                proxy_handler = UrllibProxyHandler({
                    'http': f'http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}',
                    'https': f'http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}'
                })
                
                # Настраиваем базовую аутентификацию для прокси
                password_mgr = HTTPPasswordMgrWithDefaultRealm()
                password_mgr.add_password(None, f'http://{PROXY_HOST}:{PROXY_PORT}', PROXY_USER, PROXY_PASS)
                password_mgr.add_password(None, f'https://{PROXY_HOST}:{PROXY_PORT}', PROXY_USER, PROXY_PASS)
                
                auth_handler = HTTPBasicAuthHandler(password_mgr)
                
                # Создаем opener с прокси и аутентификацией
                opener = build_opener(proxy_handler, auth_handler)
                
                # Создаем запрос
                req = Request(target_url)
                req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
                req.add_header('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
                req.add_header('Accept-Language', 'es-ES,es;q=0.9')
                
                # Выполняем запрос через прокси
                response = opener.open(req, timeout=20)
                content = response.read()
                content_type = response.headers.get('Content-Type', 'text/html; charset=utf-8')
                
                # Отправляем ответ клиенту
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(content)
                
            except Exception as e:
                print(f"Error: {str(e)}")  # Логируем ошибку для отладки
                self.send_response(500)
                self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                error_msg = f'Error: {str(e)}'
                self.wfile.write(error_msg.encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Not found')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        # Логируем только ошибки
        if '404' in format or '500' in format:
            print(f"{self.address_string()} - {format % args}")

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8001), ProxyHandler)
    print('Proxy server running on http://localhost:8001')
    server.serve_forever()

