/**
 * Meta Pixel (Facebook Ads) event helpers.
 *
 * The pixel is bootstrapped by the inline snippet in `index.html`, which defines
 * `window.fbq`. Everything here degrades to a no-op when that snippet did not
 * run — ad blockers remove it for a large minority of real visitors — so no
 * call site ever has to guard the call itself.
 *
 * Analytics must never break a user action, hence the swallowed catch.
 */

/**
 * `Lead` — someone submitted a contact/lead form.
 *
 * This is the event Meta's delivery algorithm optimises campaigns against, so
 * it must fire only on a CONFIRMED submit (a 200 from the API), never on the
 * click that opened the form or on a failed request.
 *
 * @param source Where the lead came from. Defaults to the current path, which
 *   is what distinguishes a `/contact-form` programs lead from a landing-page
 *   popup — the backend payload alone cannot tell those apart.
 */
export function trackLead(source?: string): void {
  if (typeof window.fbq !== 'function') return;
  try {
    window.fbq('track', 'Lead', {
      content_name: source ?? window.location.pathname,
    });
  } catch {
    // Never let a tracking failure surface to the user mid-submit.
  }
}
