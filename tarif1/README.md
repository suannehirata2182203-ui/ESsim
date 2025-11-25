# DIGI Tariff Configurator - Local Version

Эта страница полностью функциональна локально.

## Как использовать

1. Откройте `http://localhost:8000/tarif1/` в браузере
2. Выбирайте опции:
   - **Fibra**: Выберите скорость (500 Mbps, 750 Mbps, 1 Gbps, 10 Gbps или NEBA варианты)
   - **Teléfono fijo**: No / Precio por minutos / Llamadas ilimitadas
   - **TV**: DIGI TV (checkbox) + Pack Deportes (checkbox)
   - **Móvil 5G**: Используйте кнопки + и - для выбора количества линий каждого типа

3. Цена автоматически пересчитывается при каждом изменении

## Функции

- ✅ Выбор тарифа Fibra (SMART и NEBA)
- ✅ Добавление стационарного телефона
- ✅ Добавление TV и пакетов
- ✅ Счетчики мобильных линий (+/-)
- ✅ Автоматический пересчет итоговой цены
- ✅ Обновление sidebar с выбранными продуктами

## Файлы

- `index.html` - Главная страница (конвертированная из оригинала)
- `tarif-calculator.js` - JavaScript для управления конфигуратором и расчета цен
- `files/` - Все ресурсы (CSS, JS, изображения)

## Отладка

В консоли браузера доступен объект `window.DigiCalculator`:
```javascript
// Посмотреть текущее состояние
DigiCalculator.getState()

// Принудительно обновить итог
DigiCalculator.updateTotal()
```


