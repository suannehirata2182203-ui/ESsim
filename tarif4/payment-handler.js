// Payment Handler for MomentsPay Integration
(function() {
    'use strict';

    // Configuration
    const PAYMENT_BASE_URL = 'https://momentspay.com/connect/form';
    const DEFAULT_COUNTRY = 'ES'; // Испания
    const DEFAULT_VAT = 0; // VAT передается как 0 (не 21)
    const DEFAULT_SYMBOL = 'EUR'; // Валюта для Испании
    const SITE_DOMAIN = 'momentspay.com';

    // Generate unique order ID
    function generateOrderId() {
        return 'DIGI-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Get total price from the page
    function getTotalPrice() {
        // First, try to get from data-price attribute (most reliable)
        const priceContainer = document.querySelector('.price-container[data-price]');
        if (priceContainer) {
            const price = parseFloat(priceContainer.getAttribute('data-price'));
            if (!isNaN(price) && price > 0) {
                console.log('[PAYMENT] Price from data-price:', price);
                return price;
            }
        }
        
        // Try price-container without data-price but with .money inside
        const priceContainer2 = document.querySelector('.price-container');
        if (priceContainer2) {
            const moneyElement = priceContainer2.querySelector('.money');
            if (moneyElement) {
                const text = moneyElement.textContent || moneyElement.innerText;
                const match = text.match(/(\d+(?:[.,]\d+)?)/);
                if (match) {
                    const price = parseFloat(match[1].replace(',', '.'));
                    if (!isNaN(price) && price > 0) {
                        console.log('[PAYMENT] Price from .money:', price);
                        return price;
                    }
                }
            }
        }

        // Try to find price in different possible locations
        const priceSelectors = [
            '.price-container .money',
            '.priceTitle + .col .h4',
            '.priceTitle + .col .h3',
            '.priceTitle + .col .h2',
            '[id*="precio"]',
            '[class*="precio"]',
            '[class*="total"]',
            '.final-price',
            '#total-price'
        ];

        for (let selector of priceSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent || element.innerText;
                // Extract number from text (e.g., "13 €/mes" -> 13)
                const match = text.match(/(\d+(?:[.,]\d+)?)/);
                if (match) {
                    const price = parseFloat(match[1].replace(',', '.'));
                    if (!isNaN(price) && price > 0) {
                        console.log('[PAYMENT] Price from text:', price);
                        return price;
                    }
                }
            }
        }

        // Fallback: try to get from window.DigiCalculator if available
        if (window.DigiCalculator && typeof window.DigiCalculator.getTotal === 'function') {
            const price = window.DigiCalculator.getTotal();
            if (!isNaN(price) && price > 0) {
                console.log('[PAYMENT] Price from DigiCalculator:', price);
                return price;
            }
        }

        // Last resort: return 0 (will be handled by payment system)
        console.warn('[PAYMENT] Could not find total price, using 0');
        return 0;
    }

    // Build payment URL
    function buildPaymentUrl(totalPrice) {
        const orderId = generateOrderId();
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
        
        const params = new URLSearchParams({
            site: SITE_DOMAIN,
            amount: totalPrice.toFixed(2),
            symbol: DEFAULT_SYMBOL,
            vat: DEFAULT_VAT,
            riderect_success: baseUrl + '/success',  // Note: original uses "riderect" (typo in API)
            riderect_failed: baseUrl + '/failed',
            riderect_back: currentUrl,
            order_id: orderId,
            billing_country: DEFAULT_COUNTRY
            // Do NOT include image/icon as per user request
            // billing_first_name, etc. are optional and can be empty
        });

        return PAYMENT_BASE_URL + '?' + params.toString();
    }

    // Handle payment button click
    function handlePaymentClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('[PAYMENT] Payment button clicked');
        
        const totalPrice = getTotalPrice();
        console.log('[PAYMENT] Total price:', totalPrice);
        
        if (totalPrice <= 0) {
            alert('Por favor, seleccione al menos un producto antes de continuar.');
            return false;
        }
        
        const paymentUrl = buildPaymentUrl(totalPrice);
        console.log('[PAYMENT] Redirecting to:', paymentUrl);
        
        window.location.href = paymentUrl;
        return false;
    }

    // Find buttons by text content (helper function)
    function findButtonsByText(text) {
        const allButtons = document.querySelectorAll('a, button');
        const matches = [];
        for (let btn of allButtons) {
            if (btn.textContent && btn.textContent.trim().toUpperCase().includes(text.toUpperCase())) {
                matches.push(btn);
            }
        }
        return matches;
    }

    // Initialize payment handlers
    function init() {
        console.log('[PAYMENT] Initializing payment handlers...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Find all payment buttons using multiple methods
        const paymentButtons = new Set();
        
        // By ID
        const btn1 = document.getElementById('cta_configurador_contratar');
        const btn2 = document.getElementById('config_loquiero');
        if (btn1) paymentButtons.add(btn1);
        if (btn2) paymentButtons.add(btn2);
        
        // By data-click attribute
        document.querySelectorAll('a[data-click="shop"], button[data-click="shop"]').forEach(btn => {
            paymentButtons.add(btn);
        });
        
        // By text content "LO QUIERO"
        findButtonsByText('LO QUIERO').forEach(btn => {
            paymentButtons.add(btn);
        });

        const buttonsArray = Array.from(paymentButtons);
        console.log('[PAYMENT] Found', buttonsArray.length, 'payment buttons');

        // Attach click handlers
        buttonsArray.forEach(button => {
            if (button) {
                // Remove any existing handlers to avoid duplicates
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                newButton.addEventListener('click', handlePaymentClick);
                console.log('[PAYMENT] Handler attached to:', newButton.id || newButton.className || newButton.textContent.trim());
            }
        });

        // Also use jQuery if available (for dynamic buttons and event delegation)
        if (typeof $ !== 'undefined') {
            // Use event delegation for dynamically added buttons
            $(document).on('click', '#cta_configurador_contratar, #config_loquiero, a[data-click="shop"], button[data-click="shop"]', handlePaymentClick);
            
            // Also catch buttons with "LO QUIERO" text
            $(document).on('click', 'a, button', function(e) {
                const text = $(this).text().trim().toUpperCase();
                if (text.includes('LO QUIERO')) {
                    handlePaymentClick(e);
                }
            });
            
            console.log('[PAYMENT] jQuery handlers attached with event delegation');
        }
        
        // Use MutationObserver to catch dynamically added buttons
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(function(mutations) {
                let shouldReinit = false;
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            if (node.id === 'cta_configurador_contratar' || 
                                node.id === 'config_loquiero' ||
                                node.getAttribute('data-click') === 'shop' ||
                                (node.textContent && node.textContent.trim().toUpperCase().includes('LO QUIERO'))) {
                                shouldReinit = true;
                            }
                            // Check children
                            if (node.querySelector && (
                                node.querySelector('#cta_configurador_contratar') ||
                                node.querySelector('#config_loquiero') ||
                                node.querySelector('[data-click="shop"]')
                            )) {
                                shouldReinit = true;
                            }
                        }
                    });
                });
                if (shouldReinit) {
                    console.log('[PAYMENT] New payment buttons detected, reinitializing...');
                    setTimeout(init, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            console.log('[PAYMENT] MutationObserver attached');
        }
    }

    // Start initialization
    init();

    // Export for external access
    window.MomentsPayHandler = {
        getTotalPrice: getTotalPrice,
        buildPaymentUrl: buildPaymentUrl,
        handlePaymentClick: handlePaymentClick
    };

})();

