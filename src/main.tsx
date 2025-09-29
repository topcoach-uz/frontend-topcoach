import { createRoot } from 'react-dom/client';
import App from './App.tsx';

import './styles/global.scss';
import './lib/fontawesome';

window.addEventListener('vite:preloadError', (event) => {
  window.location.reload(); // for example, refresh the page
});

createRoot(document.getElementById('root')!).render(<App />);
