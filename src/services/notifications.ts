import { Order } from '../types/restaurant.ts';
import { playCustomerStatusChime } from '../utils/audio.ts';

let originalDocumentTitle: string = typeof document !== 'undefined' ? document.title : 'Aura Dining Club';
let titleBlinkInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Checks if the Web Notification API is supported in this browser/environment.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission status ('granted', 'denied', 'default', or 'unsupported').
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests browser permission for HTML5 Desktop/Push Notifications.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Starts flashing the document/browser tab title to get user's attention
 * when they are on another tab or window.
 */
export function startDocumentTitleAlert(alertText: string) {
  if (typeof document === 'undefined') return;

  // Save current title if not already saved
  if (!titleBlinkInterval) {
    originalDocumentTitle = document.title;
  } else {
    clearInterval(titleBlinkInterval);
  }

  let toggle = false;
  titleBlinkInterval = setInterval(() => {
    document.title = toggle ? alertText : originalDocumentTitle;
    toggle = !toggle;
  }, 1000);

  // Automatically clear title blink once the user focuses the tab
  const handleFocus = () => {
    stopDocumentTitleAlert();
    window.removeEventListener('focus', handleFocus);
  };
  window.addEventListener('focus', handleFocus);
}

/**
 * Stops document title blinking and restores original title.
 */
export function stopDocumentTitleAlert() {
  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
    titleBlinkInterval = null;
  }
  if (typeof document !== 'undefined') {
    document.title = originalDocumentTitle;
  }
}

/**
 * Triggers a native browser notification when order status becomes 'ready'.
 * Also plays audio chime and starts tab title flashing if the window is hidden.
 */
export function notifyOrderReady(
  order: Order,
  onClick?: () => void
): Notification | null {
  // Always trigger sound alert
  try {
    playCustomerStatusChime();
  } catch (e) {
    console.debug('Could not play audio', e);
  }

  // If document is currently hidden (user is on another tab/window), flash tab title
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    startDocumentTitleAlert(`🔔 Order #${order.orderNumber} READY!`);
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const title = `🍽️ Order #${order.orderNumber} is Ready!`;
    const destination =
      order.orderType === 'dine_in'
        ? `Table ${order.tableNumber}`
        : `Takeaway for ${order.customerName}`;

    const itemsSummary = order.items
      .slice(0, 2)
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(', ');
    const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

    const body = `${destination}: Your ${itemsSummary}${moreItems} is hot & freshly plated. Click to view order.`;

    // Modern notification options
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `order-ready-${order.id}`, // Prevents duplicate spamming for same order
      badge: '/favicon.ico',
      requireInteraction: true, // Keep notification visible until dismissed
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch (err) {
        console.debug('Window focus blocked by browser', err);
      }
      stopDocumentTitleAlert();
      if (onClick) {
        onClick();
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('Native notification dispatch failed:', err);
    return null;
  }
}

/**
 * Sends a test notification to verify browser permissions and appearance.
 */
export async function triggerTestNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') return false;

  try {
    const testNotif = new Notification('🔔 Notification Test Successful!', {
      body: 'You will receive alerts here when your order is prepared & ready.',
      icon: '/favicon.ico',
      tag: 'test-notification',
    });
    testNotif.onclick = () => {
      window.focus();
      testNotif.close();
    };
    playCustomerStatusChime();
    return true;
  } catch (e) {
    console.warn('Test notification error:', e);
    return false;
  }
}
