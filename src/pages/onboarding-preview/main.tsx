import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ReduxProvider from 'src/lib/redux';
import OnboardingPreview from './OnboardingPreview';

// Separate Vite HTML entry: no auth bootstrap, analytics, profile writes,
// account mutations, or changes to the platform's existing onboarding route.
createRoot(document.getElementById('root')!).render(
  <ReduxProvider>
    <ConfigProvider theme={{ token: {
      colorPrimary: '#7b1f2f', colorText: '#1c1a17', colorTextPlaceholder: '#8a8378',
      colorBorder: '#e5e3da', fontFamily: '"DM Sans", sans-serif', fontSize: 15,
      borderRadius: 8, controlHeight: 44,
    }, components: { Select: { optionSelectedBg: '#f4e9e9', optionSelectedColor: '#7b1f2f' } } }}>
      <OnboardingPreview />
    </ConfigProvider>
  </ReduxProvider>,
);
