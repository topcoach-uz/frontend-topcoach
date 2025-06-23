import { GoogleOAuthProvider } from '@react-oauth/google';
import AntdProvider from './lib/antd';
import AosProvider from './lib/aos';
import ReduxProvider from './lib/redux';
import RouterProvider from './lib/router';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';

function App() {
  return (
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
  );
}

export default App;
