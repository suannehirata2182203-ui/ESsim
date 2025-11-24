#!/usr/bin/env python3
"""
Simple HTTP server for Railway deployment
"""
import os
import http.server
import socketserver
from pathlib import Path

# Получаем порт из переменной окружения или используем 8000 по умолчанию
PORT = int(os.environ.get('PORT', 8000))

# Устанавливаем директорию для сервера
DIRECTORY = Path(__file__).parent

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server starting on port {PORT}")
        print(f"Serving directory: {DIRECTORY}")
        httpd.serve_forever()

