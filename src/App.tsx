import React, { useEffect, useState } from 'react';
import { waitForBackendHealth } from './utils/waitForBackendHealth';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AntdProvider from './lib/antd';
import AosProvider from './lib/aos';
import ReduxProvider from './lib/redux';
import RouterProvider from './lib/router';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

function App() {
  const [error, setError] = useState<string | null>(null);
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    // Wait for i18n to be ready
    if (i18n.isInitialized) {
      setIsI18nReady(true);
    } else {
      i18n.on('initialized', () => {
        setIsI18nReady(true);
      });
    }
  }, []);

  // useEffect(() => {
  //   waitForBackendHealth().catch(() =>
  //     setError('Server is starting, please try again in a moment.')
  //   );
  // }, []);

  if (!isI18nReady) {
    return <div>Loading translations...</div>;
  }

  return (
    <ErrorBoundary>
      {error && (
        <div style={{ background: 'red', color: 'white', padding: 8, textAlign: 'center' }}>
          {error}
        </div>
      )}
      <ReduxProvider>
        <AntdProvider>
          <AosProvider>
            <I18nextProvider i18n={i18n}>
              <GoogleOAuthProvider clientId="156785162293-2m5fggar8f9v60h99v2a9ip18lonu3mc.apps.googleusercontent.com">
                <RouterProvider />
              </GoogleOAuthProvider>
            </I18nextProvider>
          </AosProvider>
        </AntdProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}

export default App;