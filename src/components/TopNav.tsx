import React from 'react';
import { Globe, Layers, Menu, MessageCircle, Moon, Sun, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { APP_BRAND_ASSETS } from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import { PWAInstallButton } from './PWAInstallButton';
import type { AppMode, PortalTab, UserProfile } from '../types/medical';

interface TopNavProps {
  appMode: AppMode;
  onSelectAppMode: (mode: AppMode) => void;
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenNotificationSettings: () => void;
  authBusy: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  appMode,
  onSelectAppMode,
  activeTab,
  onSelectTab,
  firebaseUser,
  userProfile,
  isAdmin,
  darkMode,
  onToggleDarkMode,
  onSignIn,
  onSignOut,
  onOpenNotificationSettings,
  authBusy,
}) => {
  const { toggleLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems: { id: PortalTab; label: string }[] = React.useMemo(() => {
    if (appMode === 'provider') {
      return [
        { id: 'doctor', label: t.nav.doctor },
        { id: 'clinic', label: t.nav.clinic },
      ];
    }
    if (appMode === 'patient') {
      return [
        { id: 'directory', label: t.apps.patient.openBookingBtn },
        { id: 'patient', label: t.nav.patient },
      ];
    }
    return [
      { id: 'directory', label: t.nav.directory },
      ...(isAdmin || userProfile?.role === 'central_admin'
        ? [{ id: 'admin' as PortalTab, label: t.nav.admin }]
        : []),
    ];
  }, [appMode, isAdmin, userProfile?.role, t]);

  const activeBrandIcon =
    appMode === 'patient'
      ? APP_BRAND_ASSETS.patientAppIcon
      : appMode === 'provider'
        ? APP_BRAND_ASSETS.providerAppIcon
        : APP_BRAND_ASSETS.mainAppIcon;

  const activeBrandTitle =
    appMode === 'main'
      ? t.common.platformName
      : appMode === 'provider'
        ? t.apps.provider.title
        : t.apps.patient.title;

  const handleNavClick = (id: PortalTab) => {
    onSelectTab(id);
    setMobileOpen(false);
  };

  const handleAppSwitch = (mode: AppMode) => {
    onSelectAppMode(mode);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Active App Emblem + Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() =>
            handleNavClick(
              appMode === 'provider'
                ? 'doctor'
                : appMode === 'patient'
                  ? 'patient'
                  : 'directory'
            )
          }
          className="flex items-center gap-2.5 min-w-0 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 rounded cursor-pointer shrink-0"
        >
          <img
            src={activeBrandIcon}
            alt={activeBrandTitle}
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
          />
          <span className="font-display text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap truncate max-w-[180px] sm:max-w-[260px] lg:max-w-none">
            {activeBrandTitle}
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Text Navigation Links scoped to active App */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
                  active
                    ? 'border-teal-700 dark:border-teal-400 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 3-App Switcher, Theme, Language & Account Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
            <select
              value={appMode}
              onChange={(e) => handleAppSwitch(e.target.value as AppMode)}
              aria-label={t.apps.switchAppLabel}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer whitespace-nowrap"
            >
              <option value="main" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {t.apps.main.shortName}
              </option>
              <option value="provider" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {t.apps.provider.shortName}
              </option>
              <option value="patient" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {t.apps.patient.shortName}
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={t.nav.darkModeToggleTitle}
            title={darkMode ? t.nav.darkModeOn : t.nav.darkModeOff}
            className="inline-flex items-center justify-center p-2 text-xs font-semibold text-slate-700 dark:text-amber-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={toggleLang}
            aria-label={t.nav.switchLangAria}
            title={t.nav.switchLangAria}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
            <span>{t.nav.switchLangLabel}</span>
          </button>

          <div className="hidden sm:inline-flex">
            <PWAInstallButton compact />
          </div>

          {firebaseUser && userProfile && (
            <button
              type="button"
              onClick={onOpenNotificationSettings}
              title={t.nav.whatsappSettingsTitle}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                userProfile.whatsappNotificationsEnabled && userProfile.phone
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {userProfile.whatsappNotificationsEnabled && userProfile.phone
                  ? t.nav.whatsappActive
                  : t.nav.linkWhatsapp}
              </span>
            </button>
          )}

          {firebaseUser ? (
            <button
              type="button"
              onClick={onSignOut}
              disabled={authBusy}
              className="hidden md:inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {userProfile?.displayName
                ? `${userProfile.displayName.split(' ')[0]} · ${t.nav.signOutShort}`
                : t.common.signOut}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              disabled={authBusy}
              className="hidden md:inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {authBusy ? t.common.signingIn : t.common.signIn}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t.nav.navMenuAria}
            className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-3">
          {/* Mobile 3-App Switcher */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {t.apps.switchAppLabel}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'main' as AppMode, label: t.apps.main.shortName },
                  { id: 'provider' as AppMode, label: t.apps.provider.shortName },
                  { id: 'patient' as AppMode, label: t.apps.patient.shortName },
                ] as const
              ).map((appItem) => (
                <button
                  key={appItem.id}
                  type="button"
                  onClick={() => handleAppSwitch(appItem.id)}
                  className={`px-2 py-2 text-xs font-semibold rounded-lg border text-center whitespace-nowrap truncate ${
                    appMode === appItem.id
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {appItem.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`text-start px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] ${
                  activeTab === item.id
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <PWAInstallButton />
            {firebaseUser && userProfile && (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenNotificationSettings();
                }}
                className="w-full py-2.5 px-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg min-h-[44px] inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {userProfile.whatsappNotificationsEnabled && userProfile.phone
                    ? `${t.nav.whatsappActiveLong} (${userProfile.phone})`
                    : t.nav.linkWhatsappLong}
                </span>
              </button>
            )}
            {firebaseUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onSignOut();
                }}
                className="w-full py-2.5 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-lg min-h-[44px]"
              >
                {t.common.signOut} ({userProfile?.displayName || firebaseUser.email})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onSignIn();
                }}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 rounded-lg min-h-[44px]"
              >
                {t.common.signInWithGoogle}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};


