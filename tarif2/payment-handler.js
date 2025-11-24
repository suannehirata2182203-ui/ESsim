// Payment Handler for MomentsPay Integration
(function() {
    'use strict';

    // Configuration
    const PAYMENT_BASE_URL = 'https://momentspay.com/connect/form';
    const DEFAULT_COUNTRY = 'ES'; // Испания
    const DEFAULT_VAT = 21; // НДС для Испании
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
            redirect_success: baseUrl + '/success',
            redirect_failed: baseUrl + '/failed',
            redirect_back: currentUrl,
            order_id: orderId,
            billing_country: DEFAULT_COUNTRY,
            billing_first_name: '',
            billing_last_name: '',
            billing_address_1: '',
            billing_city: '',
            billing_state: '',
            billing_postcode: '',
            billing_email: '',
            billing_phone: ''
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

    // Initialize payment handlers
    function init() {
        console.log('[PAYMENT] Initializing payment handlers...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Find all payment buttons
        const paymentButtons = [
            document.getElementById('cta_configurador_contratar'),
            document.getElementById('config_loquiero'),
            ...document.querySelectorAll('a[data-click="shop"]'),
            ...document.querySelectorAll('a:contains("LO QUIERO")'),
            ...document.querySelectorAll('button:contains("LO QUIERO")')
        ].filter(btn => btn !== null);

        console.log('[PAYMENT] Found', paymentButtons.length, 'payment buttons');

        // Attach click handlers
        paymentButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', handlePaymentClick);
                console.log('[PAYMENT] Handler attached to:', button.id || button.className);
            }
        });

        // Also use jQuery if available (for dynamic buttons)
        if (typeof $ !== 'undefined') {
            $(document).on('click', '#cta_configurador_contratar, #config_loquiero, a[data-click="shop"]', handlePaymentClick);
            console.log('[PAYMENT] jQuery handlers attached');
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

