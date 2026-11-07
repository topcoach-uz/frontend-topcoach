import { useEffect } from 'react';

export const adminPanelUrl = import.meta.env.VITE_ADMIN_PANEL_URL ??
  (import.meta.env.DEV ? 'http://127.0.0.1:8096/panel' : '/panel');

/** Keep old bookmarks working while Filament owns the admin interface. */
export default function AdminPanelRedirect() {
  useEffect(() => { window.location.replace(adminPanelUrl); }, []);
  return <p>Opening <a href={adminPanelUrl}>TopCoach Admin</a>…</p>;
}
