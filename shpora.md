# Шпаргалка: Как сделать функциональные кнопки на странице конфигуратора

## Основная проблема
HTML содержит `data-price` **БЕЗ налогов**, а пользователь видит цену **С налогами**.

❌ Неправильно: `parseFloat(element.dataset.price)` → берет цену без налога
✅ Правильно: Брать из отображаемого элемента `.amount`

---

## Структура решения

### 1. JavaScript (tarif-calculator.js)

```javascript
// State для хранения выбранных продуктов
const state = {
    fiber: null,        // Один выбор
    homeline: null,     // Один выбор
    tv: [],            // Массив (можно несколько)
    mobile: []         // Массив с счетчиками
};
```

### 2. Как получить ПРАВИЛЬНУЮ цену (с налогами)

```javascript
// ✅ ПРАВИЛЬНО - берем из отображаемого элемента
let displayPrice = 0;
const amountElement = element.querySelector('.amount');
if (amountElement) {
    displayPrice = parseFloat(amountElement.textContent.trim()) || 0;
}

// Fallback на data-price если .amount не найден
if (displayPrice === 0) {
    displayPrice = parseFloat(element.dataset.price) || 0;
}
```

### 3. Fiber (выбор тарифа) - ОДИН выбор

```javascript
function setupFiberListeners() {
    const fibers = document.querySelectorAll('[data-product-type="fiber"]');
    
    fibers.forEach(fiber => {
        // Клик на карточку
        fiber.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                selectFiber(this);
            }
        });
        
        // Изменение checkbox
        const checkbox = fiber.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    selectFiber(fiber);
                }
            });
        }
    });
}

function selectFiber(element) {
    // 1. СНАЧАЛА убрать ВСЕ выделения
    document.querySelectorAll('[data-product-type="fiber"]').forEach(f => {
        const cb = f.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = false;
        f.classList.remove('active', 'selected');
        const card = f.querySelector('.card');
        if (card) card.classList.remove('active', 'selected');
    });
    
    // 2. ПОТОМ выделить выбранный
    const checkbox = element.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = true;
    element.classList.add('active');
    
    // 3. Получить ПРАВИЛЬНУЮ цену
    let displayPrice = 0;
    const amountElement = element.querySelector('.amount');
    if (amountElement) {
        displayPrice = parseFloat(amountElement.textContent.trim()) || 0;
    }
    
    // 4. Сохранить в state
    state.fiber = {
        package: element.dataset.package,
        price: displayPrice,
        title: element.dataset.resumeTitle
    };
    
    // 5. Пересчитать итог
    updateTotal();
}
```

### 4. Homeline (телефон) - ОДИН выбор, с radio кнопками

```javascript
function setupHomelineListeners() {
    const radioNo = document.querySelector('input[value="no"]');
    const radioSi = document.querySelector('input[value="si"]');
    const checkboxes = document.querySelectorAll('input[name="tel"]');
    
    // Radio "No"
    if (radioNo) {
        radioNo.addEventListener('change', function() {
            if (this.checked) {
                state.homeline = null;
                checkboxes.forEach(cb => {
                    cb.checked = false;
                    const parent = cb.closest('[data-package]');
                    if (parent) parent.classList.remove('selected');
                });
                updateTotal();
            }
        });
    }
    
    // Checkboxes для опций
    checkboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const parent = this.closest('[data-package]');
            
            if (this.checked) {
                // Включить radio "Si"
                if (radioSi) radioSi.checked = true;
                
                // Снять другие checkboxes
                checkboxes.forEach(other => {
                    if (other !== this) {
                        other.checked = false;
                        const otherParent = other.closest('[data-package]');
                        if (otherParent) otherParent.classList.remove('selected');
                    }
                });
                
                // Выделить выбранный
                if (parent) {
                    parent.classList.add('selected');
                    
                    // Получить правильную цену
                    let displayPrice = 0;
                    const amountElement = parent.querySelector('.amount');
                    if (amountElement) {
                        displayPrice = parseFloat(amountElement.textContent.trim()) || 0;
                    }
                    
                    state.homeline = {
                        package: parent.dataset.package,
                        price: displayPrice,
                        title: parent.dataset.resumeTitle
                    };
                }
            } else {
                if (radioNo) radioNo.checked = true;
                if (parent) parent.classList.remove('selected');
                state.homeline = null;
            }
            updateTotal();
        });
    });
}
```

### 5. TV (чекбоксы) - НЕСКОЛЬКО выборов

```javascript
function setupTVListeners() {
    const tvProducts = document.querySelectorAll('[data-category="tv"][data-package]');
    
    tvProducts.forEach(tvProduct => {
        const checkbox = tvProduct.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        
        checkbox.addEventListener('change', function() {
            const pkg = tvProduct.dataset.package;
            
            if (this.checked) {
                // Выделить
                tvProduct.classList.add('selected');
                
                // Получить правильную цену
                let displayPrice = 0;
                const amountElement = tvProduct.querySelector('.amount');
                if (amountElement) {
                    displayPrice = parseFloat(amountElement.textContent.trim()) || 0;
                }
                
                // Добавить в массив
                state.tv.push({
                    package: pkg,
                    price: displayPrice,
                    title: tvProduct.dataset.resumeTitle
                });
            } else {
                // Убрать выделение
                tvProduct.classList.remove('selected');
                // Удалить из массива
                state.tv = state.tv.filter(tv => tv.package !== pkg);
            }
            updateTotal();
        });
    });
}
```

### 6. Mobile (счетчики +/-) - НЕСКОЛЬКО с количеством

```javascript
function setupMobileListeners() {
    const rows = document.querySelectorAll('.product_row[data-uuid]');
    
    rows.forEach(row => {
        const minus = row.querySelector('.minus');
        const plus = row.querySelector('.plus');
        const value = row.querySelector('.value');
        
        if (!value) return;
        
        if (minus) {
            minus.addEventListener('click', function() {
                let current = parseInt(value.textContent) || 0;
                if (current > 0) {
                    value.textContent = current - 1;
                    updateMobileState();
                    updateTotal();
                }
            });
        }
        
        if (plus) {
            plus.addEventListener('click', function() {
                let current = parseInt(value.textContent) || 0;
                if (current < 6) {
                    value.textContent = current + 1;
                    updateMobileState();
                    updateTotal();
                }
            });
        }
    });
}

function updateMobileState() {
    state.mobile = [];
    
    document.querySelectorAll('.product_row[data-uuid]').forEach(row => {
        const value = row.querySelector('.value');
        const count = parseInt(value?.textContent) || 0;
        
        if (count > 0) {
            // Выделить визуально
            row.classList.add('selected');
            
            // Получить правильную цену
            let displayPrice = 0;
            const priceSpan = row.querySelector('.price > div > span:not(.currency):not(small)');
            if (priceSpan) {
                displayPrice = parseFloat(priceSpan.textContent.trim()) || 0;
            }
            
            // Добавить в массив
            state.mobile.push({
                uuid: row.dataset.uuid,
                package: row.dataset.package,
                price: displayPrice,
                title: row.dataset.resumeTitle,
                count: count
            });
        } else {
            row.classList.remove('selected');
        }
    });
}
```

### 7. Подсчет итоговой цены

```javascript
function updateTotal() {
    let total = 0;
    
    // Fiber
    if (state.fiber) {
        total += state.fiber.price;
    }
    
    // Homeline
    if (state.homeline) {
        total += state.homeline.price;
    }
    
    // TV (массив)
    state.tv.forEach(tv => {
        total += tv.price;
    });
    
    // Mobile (массив с количеством)
    state.mobile.forEach(m => {
        total += m.price * m.count;
    });
    
    // Обновить отображение
    updateDisplay(total);
    updateSidebar();
}
```

### 8. Обновление отображения цены

```javascript
function updateDisplay(total) {
    const totalRounded = Math.round(total);
    
    // Найти контейнер цены
    const priceContainer = document.querySelector('.price-container');
    if (priceContainer) {
        priceContainer.setAttribute('data-price', totalRounded);
        
        const money = priceContainer.querySelector('.money');
        if (money) {
            // ВАЖНО: только CSS переменная, НЕ textContent!
            money.style.setProperty('--number', totalRounded);
            money.textContent = ''; // Очистить - CSS покажет через counter
        }
    }
}
```

---

## CSS для визуального выделения

### custom-styles.css

```css
/* Fiber - активная карточка */
[data-product-type="fiber"] > .card {
    border: 2px solid #e0e0e0 !important;
    background-color: white !important;
    cursor: pointer;
    transition: all 0.3s ease;
}

[data-product-type="fiber"].active > .card {
    border: 3px solid #002BFF !important;
    background-color: #e6f0ff !important;
    box-shadow: 0 0 15px rgba(0, 43, 255, 0.3) !important;
}

/* Homeline - активная карточка */
[data-category="fijo"] .card {
    border: 2px solid #e0e0e0;
    cursor: pointer;
    transition: all 0.3s ease;
}

[data-category="fijo"].selected .card {
    border: 2px solid #002BFF !important;
    background-color: #f0f4ff !important;
}

/* TV - активная карточка */
[data-category="tv"].selected .card {
    border: 2px solid #002BFF !important;
    background-color: #f0f4ff !important;
}

/* Mobile - активная строка */
.product_row {
    border: 2px solid transparent;
    transition: all 0.3s ease;
    border-radius: 8px;
    padding: 8px;
}

.product_row.selected {
    border: 2px solid #002BFF;
    background-color: #f0f4ff;
}
```

---

## Подключение к HTML

В конце `</body>` перед закрывающим тегом:

```html
<!-- Custom Tariff Calculator -->
<link rel="stylesheet" href="./custom-styles.css">
<script src="./tarif-calculator.js"></script>
```

---

## Checklist для новой страницы

1. ✅ Скопировать `tarif-calculator.js` и `custom-styles.css`
2. ✅ Подключить их в HTML
3. ✅ Найти все селекторы:
   - `[data-product-type="..."]` для типов продуктов
   - `[data-package="..."]` для конкретных продуктов
   - `.amount` для цен с налогами
4. ✅ Настроить слушатели для каждого типа (fiber/homeline/tv/mobile)
5. ✅ Всегда брать цену из `.amount`, НЕ из `data-price`
6. ✅ Добавить классы `.selected` или `.active` для визуального выделения
7. ✅ При выборе СНАЧАЛА убрать все выделения, ПОТОМ добавить новое
8. ✅ Обновлять `state` и вызывать `updateTotal()`
9. ✅ Проверить в консоли (F12) логи

---

## Типичные ошибки

❌ `data-price` - цена БЕЗ налога (неправильно для пользователя)
✅ `.amount` - цена С налогом (то что видит пользователь)

❌ `money.textContent = total` - не работает с CSS анимацией
✅ `money.style.setProperty('--number', total)` - работает

❌ Забыть убрать класс `.active` с предыдущего выбора
✅ Сначала убрать все, потом добавить новый

❌ Не проверять `isNaN(price)` после `parseFloat()`
✅ Всегда проверять: `if (!isNaN(price) && price > 0)`



