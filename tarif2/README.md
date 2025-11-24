# DIGI Tariff Configurator - tarif2 (500 Mbps + 50 GB)

Эта страница для конфигурации тарифа с параметрами:
- **Fibra**: 500 Mbps SMART (fibra=1583)
- **Móvil**: 50 GB + Ilimitadas (movil=1562)

## URL

`http://localhost:8000/tarif2/`

## Параметры по умолчанию

- Fiber: `data-package="1583"` (Fibra SMART 500Mb) - 10€
- Mobile: `data-uuid="1326"` (50 GB + Ilimitadas) x1 - 5€

## Функционал

- ✅ Выбор тарифа Fibra (SMART и NEBA)
- ✅ Добавление стационарного телефона
- ✅ Добавление TV и пакетов
- ✅ Счетчики мобильных линий (+/-)
- ✅ Автоматический пересчет итоговой цены
- ✅ Обновление sidebar с выбранными продуктами

## Файлы

- `index.html` - Главная страница (из оригинала с исправленными путями)
- `tarif-calculator.js` - JavaScript для управления конфигуратором
- `custom-styles.css` - Стили для визуального выделения
- `files/` - Все ресурсы (CSS, JS, изображения)

## Отладка

В консоли браузера доступен объект `window.DigiCalculator`:
```javascript
// Посмотреть текущее состояние
DigiCalculator.getState()

// Принудительно обновить итог
DigiCalculator.updateTotal()
```

