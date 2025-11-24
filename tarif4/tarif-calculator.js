// DIGI Tariff Calculator - Fixed version
(function() {
    'use strict';

    console.log('🚀 DIGI Calculator Loading...');

    const state = {
        fiber: null,
        homeline: null,
        tv: [],
        mobile: []
    };

    function init() {
        console.log('✅ Initializing...');
        
        setupFiberListeners();
        setupHomelineListeners();
        setupTVListeners();
        setupMobileListeners();
        
        setDefaults();
        updateTotal();
        
        console.log('✅ Ready!');
    }

    function setDefaults() {
        // Default: 500 Mbps SMART (package 1583) для tarif4
        const fiber500Mb = document.querySelector('[data-package="1583"][data-product-type="fiber"]');
        if (fiber500Mb) {
            selectFiber(fiber500Mb);
        }
        
        // Default: IlimiTODO x2 (uuid 1311) для tarif4 - итоговая цена 22 €
        const mobileIlimitodo = document.querySelector('[data-uuid="1311"]');
        if (mobileIlimitodo) {
            const valueSpan = mobileIlimitodo.querySelector('.value');
            if (valueSpan) {
                valueSpan.textContent = '2';
            }
        }
        
        updateMobileState();
    }

    // =====================
    // FIBER
    // =====================
    function setupFiberListeners() {
        const fibers = document.querySelectorAll('[data-product-type="fiber"]');
        console.log(`Found ${fibers.length} fiber options`);
        
        fibers.forEach((fiber, index) => {
            const checkbox = fiber.querySelector('input[type="checkbox"]');
            const title = fiber.dataset.resumeTitle;
            console.log(`  [${index}] ${title}`);
            
            // Click on card
            fiber.addEventListener('click', function(e) {
                if (e.target.type !== 'checkbox') {
                    console.log('Card clicked:', title);
                    selectFiber(this);
                }
            });
            
            // Checkbox change
            if (checkbox) {
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        console.log('Checkbox checked:', title);
                        selectFiber(fiber);
                    }
                });
            }
        });
    }

    function selectFiber(element) {
        // FIRST: Uncheck all and remove ALL active-related classes
        document.querySelectorAll('[data-product-type="fiber"]').forEach(f => {
            const cb = f.querySelector('input[type="checkbox"]');
            if (cb) cb.checked = false;
            
            // Remove all possible active classes
            f.classList.remove('active', 'selected');
            const card = f.querySelector('.card');
            const cardBody = f.querySelector('.card-body');
            if (card) card.classList.remove('active', 'selected');
            if (cardBody) cardBody.classList.remove('active', 'selected');
        });
        
        // SECOND: Check selected and add active class
        const checkbox = element.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = true;
        element.classList.add('active');
        
        // Get price - use displayed price from .amount element (includes tax)
        let displayPrice = 0;
        const amountElement = element.querySelector('.amount');
        if (amountElement) {
            displayPrice = parseFloat(amountElement.textContent.trim()) || 0;
        }
        
        // Fallback to data-price if amount not found
        if (displayPrice === 0) {
            displayPrice = parseFloat(element.dataset.price) || 0;
        }
        
        // Save state
        state.fiber = {
            package: element.dataset.package,
            price: displayPrice,
            title: element.dataset.resumeTitle
        };
        
        console.log('✓ Fiber selected:', state.fiber.title);
        console.log('  - Package:', state.fiber.package);
        console.log('  - Price:', state.fiber.price.toFixed(2) + '€');
        console.log('  - Element has .active class:', element.classList.contains('active'));
        updateTotal();
    }

    // =====================
    // HOMELINE
    // =====================
    function setupHomelineListeners() {
        const radioNo = document.querySelector('input[value="no"]');
        const radioSi = document.querySelector('input[value="si"]');
        const checkboxes = document.querySelectorAll('input[name="tel"]');
        
        console.log(`Found ${checkboxes.length} homeline options`);
        
        if (radioNo) {
            radioNo.addEventListener('change', function() {
                if (this.checked) {
                    state.homeline = null;
                    checkboxes.forEach(cb => {
                        cb.checked = false;
                        const parent = cb.closest('[data-package]');
                        if (parent) parent.classList.remove('selected');
                    });
                    console.log('✓ Homeline: None');
                    updateTotal();
                }
            });
        }
        
        if (radioSi) {
            radioSi.addEventListener('change', function() {
                if (this.checked) {
                    console.log('Si radio checked - please select a phone option');
                    // User needs to select which option after clicking Si
                }
            });
        }
        
        checkboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                const parent = this.closest('[data-package]');
                
                if (this.checked) {
                    if (radioSi) radioSi.checked = true;
                    
                    // Uncheck other homeline options
                    checkboxes.forEach(other => {
                        if (other !== this) {
                            other.checked = false;
                            const otherParent = other.closest('[data-package]');
                            if (otherParent) otherParent.classList.remove('selected');
                        }
                    });
                    
                    if (parent) {
                        // Visual highlight
                        parent.classList.add('selected');
                        
                        // Get displayed price (with tax) from .amount element
                        let displayPrice = 0;
                        const amountElement = parent.querySelector('.amount');
                        if (amountElement) {
                            displayPrice = parseFloat(amountElement.textContent.trim()) || 0;
                        }
                        
                        // Fallback to data-price if amount not found
                        if (displayPrice === 0) {
                            displayPrice = parseFloat(parent.dataset.price) || 0;
                        }
                        
                        if (!isNaN(displayPrice) && displayPrice > 0) {
                            state.homeline = {
                                package: parent.dataset.package,
                                price: displayPrice,
                                title: parent.dataset.resumeTitle
                            };
                            console.log('✓ Homeline:', state.homeline.title, '=', state.homeline.price.toFixed(2) + '€ (displayed price)');
                        }
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

    // =====================
    // TV
    // =====================
    function setupTVListeners() {
        // Find TV products by data-category="tv" and data-package
        const tvProducts = document.querySelectorAll('[data-category="tv"][data-package]');
        console.log(`Found ${tvProducts.length} TV options`);
        
        tvProducts.forEach(tvProduct => {
            const checkbox = tvProduct.querySelector('input[type="checkbox"]');
            if (!checkbox) return;
            
            console.log(`  TV option: ${tvProduct.dataset.resumeTitle}`);
            
            checkbox.addEventListener('change', function() {
                const pkg = tvProduct.dataset.package;
                
                if (this.checked) {
                    // Visual highlight
                    tvProduct.classList.add('selected');
                    
                    // Get displayed price (with tax) from .amount element
                    let displayPrice = 0;
                    const amountElement = tvProduct.querySelector('.amount');
                    if (amountElement) {
                        displayPrice = parseFloat(amountElement.textContent.trim()) || 0;
                    }
                    
                    // Fallback to data-price if amount not found
                    if (displayPrice === 0) {
                        displayPrice = parseFloat(tvProduct.dataset.price) || 0;
                    }
                    
                    if (!isNaN(displayPrice) && displayPrice > 0) {
                        state.tv.push({
                            package: pkg,
                            price: displayPrice,
                            title: tvProduct.dataset.resumeTitle
                        });
                        console.log('✓ TV added:', tvProduct.dataset.resumeTitle, '=', displayPrice.toFixed(2) + '€ (displayed price)');
                    } else {
                        console.error('Invalid TV price:', tvProduct.dataset.price);
                    }
                } else {
                    // Remove highlight
                    tvProduct.classList.remove('selected');
                    state.tv = state.tv.filter(tv => tv.package !== pkg);
                    console.log('✓ TV removed:', tvProduct.dataset.resumeTitle);
                }
                
                updateTotal();
            });
        });
    }

    // =====================
    // MOBILE
    // =====================
    function setupMobileListeners() {
        const rows = document.querySelectorAll('.product_row[data-uuid]');
        console.log(`Found ${rows.length} mobile options`);
        
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
                        console.log(`Mobile decreased: ${row.dataset.resumeTitle} → ${current - 1}`);
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
                        console.log(`Mobile increased: ${row.dataset.resumeTitle} → ${current + 1}`);
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
            
            // Visual highlight for selected rows
            if (count > 0) {
                row.classList.add('selected');
                
                // Get displayed price (with tax) from .price span element
                // ВАЖНО: берем цену из span, который НЕ находится в .original (это цена со скидкой)
                let displayPrice = 0;
                const priceDiv = row.querySelector('.price > div');
                if (priceDiv) {
                    // Ищем span, который НЕ внутри .original
                    const allSpans = priceDiv.querySelectorAll('span:not(small)');
                    allSpans.forEach(function(span) {
                        // Проверяем, что span не находится внутри .original
                        if (!span.closest('.original')) {
                            const price = parseFloat(span.textContent.trim()) || 0;
                            if (price > 0 && price > displayPrice) {
                                displayPrice = price;
                            }
                        }
                    });
                }
                
                // Fallback to data-price if span not found
                if (displayPrice === 0) {
                    displayPrice = parseFloat(row.dataset.price) || 0;
                }
                
                if (!isNaN(displayPrice) && displayPrice > 0) {
                    state.mobile.push({
                        uuid: row.dataset.uuid,
                        package: row.dataset.package,
                        price: displayPrice,
                        title: row.dataset.resumeTitle,
                        count: count
                    });
                    console.log(`  Mobile: ${row.dataset.resumeTitle} x${count} @ ${displayPrice}€ = ${displayPrice * count}€`);
                }
            } else {
                row.classList.remove('selected');
            }
        });
    }

    // =====================
    // CALCULATE TOTAL
    // =====================
    function updateTotal() {
        let total = 0;
        let breakdown = [];

        // Fiber
        if (state.fiber) {
            total += state.fiber.price;
            breakdown.push(`Fibra: ${state.fiber.price.toFixed(2)}€`);
        }

        // Homeline
        if (state.homeline) {
            total += state.homeline.price;
            breakdown.push(`Teléfono: ${state.homeline.price.toFixed(2)}€`);
        }

        // TV
        state.tv.forEach(tv => {
            total += tv.price;
            breakdown.push(`${tv.title}: ${tv.price.toFixed(2)}€`);
        });

        // Mobile
        let mobileTotal = 0;
        state.mobile.forEach(m => {
            const lineTotal = m.price * m.count;
            mobileTotal += lineTotal;
            breakdown.push(`${m.title} x${m.count}: ${lineTotal.toFixed(2)}€`);
        });
        total += mobileTotal;

        console.log('💰 CALCULATION:');
        breakdown.forEach(item => console.log('  ' + item));
        console.log('  ──────────────');
        console.log('  TOTAL: ' + total.toFixed(2) + '€');
        
        updateDisplay(total);
        updateSidebar();
    }

    function updateDisplay(total) {
        const totalRounded = Math.round(total);
        
        // Update main price display - ONLY update data attribute, CSS handles the rest
        const priceContainer = document.querySelector('.price-container');
        if (priceContainer) {
            priceContainer.setAttribute('data-price', totalRounded);
            
            const money = priceContainer.querySelector('.money');
            if (money) {
                // Only update CSS variable, don't touch textContent
                money.style.setProperty('--number', totalRounded);
                // Clear any text content - CSS counter will display the number
                money.textContent = '';
            }
        }
        
        console.log('✓ Price display updated:', totalRounded + '€');
    }

    function updateSidebar() {
        // Update Fiber in sidebar
        if (state.fiber) {
            const fiberSection = document.querySelector('.productFiber');
            if (fiberSection) {
                fiberSection.style.display = '';
                const dt = fiberSection.querySelector('dt');
                const dd = fiberSection.querySelector('dd');
                if (dt) dt.textContent = state.fiber.title;
                if (dd) dd.textContent = Math.round(state.fiber.price) + ' €';
            }
        }

        // Update Homeline in sidebar
        const homelineSection = document.querySelector('.productLandline');
        if (homelineSection) {
            if (state.homeline) {
                homelineSection.style.display = '';
                const dt = homelineSection.querySelector('dt');
                const dd = homelineSection.querySelector('dd');
                if (dt) dt.textContent = state.homeline.title;
                if (dd) dd.textContent = Math.round(state.homeline.price) + ' €';
            } else {
                homelineSection.style.display = 'none';
            }
        }

        // Update TV in sidebar
        const tvSection = document.querySelector('.productTV');
        if (tvSection) {
            if (state.tv.length > 0) {
                tvSection.style.display = '';
                const dl = tvSection.querySelector('dl');
                if (dl) {
                    dl.innerHTML = '';
                    state.tv.forEach(tv => {
                        dl.innerHTML += `<dt>${tv.title}</dt><dd>${Math.round(tv.price)} €</dd>`;
                    });
                }
            } else {
                tvSection.style.display = 'none';
            }
        }

        // Update Mobile in sidebar
        if (state.mobile.length > 0) {
            const mobileSection = document.querySelector('.productMobileLines');
            if (mobileSection) {
                mobileSection.style.display = '';
                const dl = mobileSection.querySelector('dl');
                if (dl) {
                    dl.innerHTML = '';
                    state.mobile.forEach(m => {
                        const total = Math.round(m.price * m.count);
                        const title = m.count > 1 ? `${m.title} (x${m.count})` : m.title;
                        dl.innerHTML += `<dt>${title}</dt><dd>${total} €</dd>`;
                    });
                }
            }
        }
        
        console.log('✓ Sidebar updated');
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

    // Debug
    window.DigiCalculator = {
        state: state,
        update: updateTotal,
        getState: () => state
    };

})();

console.log('📦 tarif-calculator.js loaded');
