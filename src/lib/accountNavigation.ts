export const ACCOUNT_SETTINGS_PATH =
  '/student-hub?section=account&target=settings&tab=profile';
export const SCHOOL_SETTINGS_PATH =
  '/student-hub?section=account&target=settings&tab=school';
export const MEMBERSHIP_BILLING_PATH =
  '/student-hub?section=account&target=settings&tab=subscription';
export type SettingsSection =
  | 'profile'
  | 'subscription'
  | 'school'
  | 'referrals'
  | 'experience'
  | 'notifications';
export function settingsSection(tab: string | null): SettingsSection {
  return [
    'profile',
    'subscription',
    'school',
    'referrals',
    'experience',
    'notifications',
  ].includes(tab ?? '')
    ? (tab as SettingsSection)
    : 'profile';
}
