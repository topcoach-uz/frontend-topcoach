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

type EventKind = 'track' | 'trackCustom';

function fire(kind: EventKind, event: string, params?: Record<string, unknown>): void {
  if (typeof window.fbq !== 'function') return;
  try {
    window.fbq(kind, event, params);
  } catch {
    // Never let a tracking failure surface to the user mid-action.
  }
}

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
  fire('track', 'Lead', { content_name: source ?? window.location.pathname });
}

/**
 * `CompleteRegistration` — a new account was created. Meta standard event, so
 * campaigns can optimise delivery toward sign-ups.
 *
 * Fires when the register call returns 200. The user has NOT verified their
 * email at that point; the account exists, which is what "registered" means
 * here and matches what the backend has stored.
 *
 * @param method Which sign-up path produced the account: `student`, `mentor`.
 */
export function trackCompleteRegistration(method: string): void {
  fire('track', 'CompleteRegistration', { content_name: method, status: true });
}

/**
 * `Login` — a returning user signed in. Meta has NO standard login event, so
 * this is a custom one: it will show up in Events Manager as a custom event and
 * can be used for audiences, but it is not a conversion you should optimise
 * campaigns against (these people already converted).
 *
 * @param method How they signed in: `email`, `google`.
 */
export function trackLogin(method: string): void {
  fire('trackCustom', 'Login', { method });
}
