import type { PropsWithChildren } from 'react';
import { App, ConfigProvider } from 'antd';
import { studentTheme } from './studentTheme';

/**
 * Brand antd theme for the student-facing app. A nested ConfigProvider: it
 * inherits the global one (locale, etc.) and overrides tokens only for what it
 * wraps, so the mentor, counselor and public areas are unaffected (decision D1).
 *
 * The nested <App> makes `App.useApp()` messages, modals and notifications
 * rendered from student pages pick up the student theme.
 */
export default function StudentThemeProvider({ children }: PropsWithChildren) {
  return (
    <ConfigProvider theme={studentTheme}>
      <App component={false}>{children}</App>
    </ConfigProvider>
  );
}
