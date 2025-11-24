FROM python:3.11-slim

WORKDIR /app

# Копируем все файлы проекта
COPY . .

# Expose порт (Railway автоматически установит переменную PORT)
EXPOSE 8000

# Запускаем сервер через наш скрипт
CMD python server.py

