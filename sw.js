// Service Worker for MicroLearn PWA

const CACHE_NAME = 'microlearn-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
    console.log('Push received:', event);
    
    let notificationData = {
        title: 'MicroLearn',
        body: 'You have a new micro-lesson!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'microlearn-lesson',
        data: {
            url: '/',
            type: 'lesson'
        }
    };

    // Parse push data if available
    if (event.data) {
        try {
            const pushData = event.data.json();
            notificationData = {
                ...notificationData,
                ...pushData
            };
        } catch (error) {
            console.error('Error parsing push data:', error);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            data: notificationData.data,
            actions: notificationData.actions || [],
            requireInteraction: notificationData.requireInteraction || false
        })
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    // Handle different notification types
    const notificationData = event.notification.data;
    
    if (event.action) {
        // Handle action button clicks
        handleNotificationAction(event.action, notificationData);
    } else {
        // Handle notification body click
        event.waitUntil(
            clients.openWindow('/')
        }
    }
});

// Handle notification actions
function handleNotificationAction(action, data) {
    switch (action) {
        case 'learn_more':
            // Open app with specific lesson
            clients.openWindow('/?lesson=' + encodeURIComponent(data.lessonId || ''));
            break;
            
        case 'got_it':
            // Mark as learned and continue
            clients.openWindow('/?action=learned&topic=' + encodeURIComponent(data.topic || '') + '&concept=' + encodeURIComponent(data.concept || ''));
            break;
            
        case 'too_easy':
            // Handle "too easy" feedback - escalate difficulty
            clients.openWindow('/?action=too_easy&topic=' + encodeURIComponent(data.topic || '') + '&concept=' + encodeURIComponent(data.concept || '') + '&difficulty=' + encodeURIComponent(data.difficulty || 1));
            break;
            
        case 'quiz':
            // Open app with quiz
            clients.openWindow('/?quiz=' + encodeURIComponent(data.quizId || ''));
            break;
            
        case 'skip':
            // Skip this lesson, maybe show next one
            clients.openWindow('/?action=skip');
            break;
            
        case 'answer':
            // Handle quiz answer
            if (data.quizId) {
                clients.openWindow('/?quiz=' + encodeURIComponent(data.quizId) + '&action=answer');
            }
            break;
            
        case 'submit':
            // Handle text input submission
            clients.openWindow('/?action=submit&topic=' + encodeURIComponent(data.topic || '') + '&concept=' + encodeURIComponent(data.concept || ''));
            break;
            
        default:
            // Default action - just open the app
            clients.openWindow('/');
    }
}

// Background sync for offline learning data
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Sync learning progress, quiz answers, etc.
    console.log('Performing background sync...');
    
    // This would sync with the server when connection is restored
    try {
        // Simulate sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Background sync completed');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Message handling from main app
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Notification close event
self.addEventListener('notificationclose', event => {
    console.log('Notification closed:', event);
    
    // Track that user dismissed notification (for analytics)
    const notificationData = event.notification.data;
    if (notificationData && notificationData.trackDismiss) {
        // Send analytics data about dismissed notifications
        console.log('User dismissed notification:', notificationData);
    }
});

// Periodic background sync for learning content
self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-sync') {
        event.waitUntil(syncLearningContent());
    }
});

async function syncLearningContent() {
    console.log('Syncing learning content...');
    
    try {
        // This would fetch new learning content from server
        // For MVP, we'll just log it
        console.log('Learning content sync completed');
    } catch (error) {
        console.error('Content sync failed:', error);
    }
}
