FROM python:3.11-slim

WORKDIR /app

# Копируем все файлы проекта
COPY . .

# Expose порт (Railway автоматически установит переменную PORT)
EXPOSE 8000

# Запускаем простой HTTP сервер
CMD python -m http.server ${PORT:-8000}

