export type EventProperties = Record<string, string | number | boolean | null | undefined>;
type EventEntry = { name: string; properties?: EventProperties };
type WebsiteAnalytics = {
  entrySource?: string;
  trackEvent: (name: string, properties?: EventProperties) => boolean;
  trackBusiness: (name: string, properties?: Record<string, string | null | undefined>) => boolean;
  optOut: (disabled?: boolean) => void;
  status: () => { enabled: boolean; allowed: boolean; ready: boolean; queued: number; site_id: string; environment: string; path: string };
};
declare global {
  interface Window {
    websiteAnalytics?: WebsiteAnalytics;
    __siteFoundationEvents?: EventEntry[];
  }
}
// Business components call this provider-neutral adapter; SDK loading stays outside their bundles.
export function trackEvent(name: string, properties?: EventProperties) {
  if (typeof window === 'undefined') return false;
  if (window.websiteAnalytics) return window.websiteAnalytics.trackEvent(name, properties);
  const queue = window.__siteFoundationEvents ||= [];
  if (queue.length >= 100) return false;
  queue.push({ name, properties });
  return true;
}
export const trackContentOpen = (properties?: EventProperties) => trackEvent('content_opened', properties);
export const trackContentComplete = (properties?: EventProperties) => trackEvent('content_completed', properties);
export const trackShare = (properties?: EventProperties) => trackEvent('share_clicked', properties);
export const trackOutboundClick = (properties?: EventProperties) => trackEvent('outbound_clicked', properties);
export const trackAffiliate = (properties?: EventProperties) => trackEvent('affiliate_clicked', properties);
export const trackCTA = (properties?: EventProperties) => trackEvent('cta_clicked', properties);
export const trackSignupStarted = (properties?: EventProperties) => trackEvent('signup_started', properties);
export const trackSignupCompleted = (properties?: EventProperties) => trackEvent('signup_completed', properties);
export const trackCheckoutStarted = (properties?: EventProperties) => trackEvent('checkout_started', properties);
// purchase_completed belongs to a verified server webhook; no browser API is provided.
