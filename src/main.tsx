import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { I18nProvider } from './i18n/I18nContext';
import './index.css';

// Register PWA Service Worker with auto-update
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// Google Maps Case A Quota & Auth Failure Defense
(window as unknown as Record<string, unknown>).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);
