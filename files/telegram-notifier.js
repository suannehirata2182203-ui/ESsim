// Telegram Notifier - Client-side utility
(function() {
    'use strict';

    // Configuration
    const NOTIFY_API_URL = '/api/telegram/notify';
    const CLIENT_ID_KEY = 'telegram_client_id';
    const CLIENT_COUNTER_KEY = 'telegram_client_counter';

    // Generate or retrieve unique client ID
    function getClientId() {
        let clientId = localStorage.getItem(CLIENT_ID_KEY);
        if (!clientId) {
            // Get or create counter
            let counter = parseInt(localStorage.getItem(CLIENT_COUNTER_KEY) || '0', 10);
            counter += 1;
            localStorage.setItem(CLIENT_COUNTER_KEY, counter.toString());
            clientId = `client_${counter}`;
            localStorage.setItem(CLIENT_ID_KEY, clientId);
        }
        return clientId;
    }

    // Detect device type
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(ua)) {
            return 'Планшет';
        }
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
            return 'Мобильное устройство';
        }
        return 'Десктоп';
    }

    // Detect country (using timezone as fallback)
    function getCountry() {
        try {
            // Try to get from Intl API
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Simple mapping (can be extended)
            const timezoneToCountry = {
                'Europe/Madrid': 'Испания',
                'Europe/Moscow': 'Россия',
                'America/New_York': 'США',
                'Europe/London': 'Великобритания',
                'Europe/Paris': 'Франция',
                'Europe/Berlin': 'Германия',
                'Asia/Dubai': 'ОАЭ',
                'Asia/Tokyo': 'Япония',
                'Asia/Shanghai': 'Китай'
            };
            return timezoneToCountry[timezone] || timezone || 'Неизвестно';
        } catch (e) {
            return 'Неизвестно';
        }
    }

    // Send notification to server
    async function sendNotification(eventType, additionalData = {}) {
        try {
            const clientId = getClientId();
            const country = getCountry();
            const device = getDeviceType();

            const payload = {
                event_type: eventType,
                client_id: clientId,
                country: country,
                device: device,
                ...additionalData
            };

            const response = await fetch(NOTIFY_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.warn('[TELEGRAM] Notification failed:', response.status);
                return false;
            }

            const result = await response.json();
            if (result.status === 'duplicate') {
                console.log('[TELEGRAM] Duplicate notification prevented');
            } else if (result.status === 'success') {
                console.log('[TELEGRAM] Notification sent successfully');
            }
            return result.status === 'success';
        } catch (error) {
            console.error('[TELEGRAM] Error sending notification:', error);
            return false;
        }
    }

    // Export API
    window.TelegramNotifier = {
        getClientId: getClientId,
        sendNotification: sendNotification,
        getCountry: getCountry,
        getDeviceType: getDeviceType
    };

})();

