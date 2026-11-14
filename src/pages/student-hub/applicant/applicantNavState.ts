/** Remembers whether the workspace section panel is collapsed. */
const PANEL_COLLAPSED_KEY = 'topcoach.applicantNavCollapsed';
export const readPanelCollapsed = () => {
  try {
    return window.localStorage.getItem(PANEL_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};
export const writePanelCollapsed = (value: boolean) => {
  try {
    window.localStorage.setItem(PANEL_COLLAPSED_KEY, value ? '1' : '0');
  } catch {
    /* storage unavailable: keep the in-memory state only */
  }
};
