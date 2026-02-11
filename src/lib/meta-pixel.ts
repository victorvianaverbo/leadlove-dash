// Meta Pixel helper functions
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

// Initialize Meta Pixel - call once on app load
export function initMetaPixel(pixelId: string) {
  if (typeof window === 'undefined' || window.fbq) return;

  const n = (window.fbq = function (...args: unknown[]) {
    // @ts-ignore
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  } as any);
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [] as unknown[];

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

export function trackEvent(eventName: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    if (eventId) {
      window.fbq('track', eventName, params || {}, { eventID: eventId });
    } else {
      window.fbq('track', eventName, params);
    }
  }
}

export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
