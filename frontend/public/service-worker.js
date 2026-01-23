// Service Worker for Push Notifications
// This file should be in public folder

const CACHE_NAME = 'mentl-cache-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  let data = {
    title: 'Mentl',
    body: 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: {}
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        data: payload.data || {}
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data,
    actions: getActionsForType(data.data.type),
    requireInteraction: data.data.type === 'crisis_alert'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = '/dashboard';
  
  // Determine URL based on notification type
  switch (data.type) {
    case 'crisis_alert':
      url = '/caregivers';
      break;
    case 'mood_reminder':
      url = '/log-mood';
      break;
    case 'caregiver_update':
      url = '/caregivers';
      break;
    case 'meal_reminder':
      url = '/nutrition';
      break;
    default:
      url = '/dashboard';
  }
  
  // Handle action clicks
  if (event.action === 'log_mood') {
    url = '/log-mood';
  } else if (event.action === 'view_nutrition') {
    url = '/nutrition';
  } else if (event.action === 'view_patient') {
    url = `/caregivers?patient=${data.patient_id}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Helper function to get notification actions based on type
function getActionsForType(type) {
  switch (type) {
    case 'mood_reminder':
      return [
        { action: 'log_mood', title: 'Log Now', icon: '/icons/edit.png' },
        { action: 'dismiss', title: 'Later', icon: '/icons/close.png' }
      ];
    case 'meal_reminder':
      return [
        { action: 'view_nutrition', title: 'View Suggestions', icon: '/icons/food.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/close.png' }
      ];
    case 'crisis_alert':
      return [
        { action: 'view_patient', title: 'Check In', icon: '/icons/heart.png' },
        { action: 'call_988', title: 'Call 988', icon: '/icons/phone.png' }
      ];
    default:
      return [];
  }
}

// Background sync for offline support
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mood-logs') {
    event.waitUntil(syncMoodLogs());
  }
});

async function syncMoodLogs() {
  // Sync any offline mood logs when back online
  console.log('Service Worker: Syncing mood logs...');
}
