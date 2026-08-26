// Meta Pixel (Facebook) type definitions.
//
// `window.fbq` is defined by the inline snippet in index.html. It is declared
// optional on purpose: ad blockers strip connect.facebook.net for a sizeable
// share of real visitors, so callers must handle it being absent.
interface Window {
  fbq?: (...args: any[]) => void;
}
