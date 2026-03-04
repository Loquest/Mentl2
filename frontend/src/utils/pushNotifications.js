// Push Notification Utility for Mentl App

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Check if push notifications are supported
 */
export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Register service worker
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[Push] Service Worker registered:', registration);

    // Wait for the service worker to be active
    if (registration.installing) {
      await new Promise((resolve) => {
        registration.installing.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            resolve();
          }
        });
      });
    }

    return registration;
  } catch (error) {
    console.error('[Push] Service Worker registration failed:', error);
    throw error;
  }
};

/**
 * Get the current service worker registration
 */
export const getServiceWorkerRegistration = async () => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  return await navigator.serviceWorker.ready;
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPush = async (token) => {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  try {
    // Get service worker registration
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      throw new Error('No service worker registration');
    }

    // Get VAPID public key from backend
    const response = await fetch(`${API_URL}/api/push/vapid-public-key`);
    const { publicKey } = await response.json();

    if (!publicKey) {
      console.warn('[Push] VAPID public key not configured');
      // Return a mock subscription for development
      return { endpoint: 'mock', keys: {} };
    }

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    console.log('[Push] Push subscription created:', subscription);

    // Send subscription to backend
    await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      })
    });

    return subscription;
  } catch (error) {
    console.error('[Push] Failed to subscribe:', error);
    throw error;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPush = async (token) => {
  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push] Unsubscribed from push notifications');

      // Notify backend
      await fetch(`${API_URL}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    console.error('[Push] Failed to unsubscribe:', error);
    throw error;
  }
};

/**
 * Check if user is currently subscribed to push
 */
export const isSubscribedToPush = async () => {
  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('[Push] Error checking subscription:', error);
    return false;
  }
};

/**
 * Show a local notification (for testing)
 */
export const showLocalNotification = async (title, options = {}) => {
  if (getNotificationPermission() !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    throw new Error('No service worker registration');
  }

  await registration.showNotification(title, {
    icon: '/logo192.png',
    badge: '/logo192.png',
    ...options
  });
};

/**
 * Initialize push notifications
 */
export const initializePushNotifications = async (token) => {
  if (!isPushSupported()) {
    console.log('[Push] Push notifications not supported');
    return { supported: false };
  }

  const permission = getNotificationPermission();
  
  if (permission === 'denied') {
    console.log('[Push] Notification permission denied');
    return { supported: true, permission: 'denied' };
  }

  try {
    // Register service worker
    await registerServiceWorker();

    if (permission === 'granted') {
      // Auto-subscribe if permission already granted
      await subscribeToPush(token);
      return { supported: true, permission: 'granted', subscribed: true };
    }

    return { supported: true, permission: 'default', subscribed: false };
  } catch (error) {
    console.error('[Push] Initialization error:', error);
    return { supported: true, error: error.message };
  }
};

/**
 * Convert URL-safe base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
  showLocalNotification,
  initializePushNotifications
};
