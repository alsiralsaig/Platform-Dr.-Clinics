import React from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useOnlineStatus, usePWAInstall } from '../lib/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useI18n();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = React.useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          compact ? 'px-2.5 py-2 text-xs' : 'w-full py-2.5 px-4 text-sm min-h-[44px]'
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{t.pwa.installAppBtn}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            compact ? 'px-2.5 py-2 text-xs' : 'w-full py-2.5 px-4 text-sm min-h-[44px]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
          <span>{t.pwa.installOnIosBtn}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.pwa.iosModalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label={t.common.close}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <p>{t.pwa.iosStep1}</p>
                <p>{t.pwa.iosStep2}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const { t } = useI18n();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 start-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{t.pwa.offlineBanner}</span>
    </div>
  );
};
