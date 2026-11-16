import React from 'react';
import { Bell, CheckCircle2, MessageCircle, Moon, Phone, Sun, X } from 'lucide-react';
import { normalizeSudanWhatsappDigits } from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import { updateUserNotificationPreferences } from '../lib/firestoreService';
import type { UserProfile } from '../types/medical';

interface WhatsappSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  userProfile: UserProfile;
  remindersEnabled: boolean;
  darkMode: boolean;
  onToggleDarkMode: (darkMode: boolean) => Promise<void> | void;
  onToggleReminders: (enabled: boolean) => void;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const WhatsappSettingsModal: React.FC<WhatsappSettingsModalProps> = ({
  isOpen,
  onClose,
  uid,
  userProfile,
  remindersEnabled,
  darkMode,
  onToggleDarkMode,
  onToggleReminders,
  onProfileUpdated,
}) => {
  const { t } = useI18n();
  const [phoneInput, setPhoneInput] = React.useState(userProfile.phone || '');
  const [whatsappEnabled, setWhatsappEnabled] = React.useState(
    Boolean(userProfile.whatsappNotificationsEnabled)
  );
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [savedOk, setSavedOk] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPhoneInput(userProfile.phone || '');
      setWhatsappEnabled(Boolean(userProfile.whatsappNotificationsEnabled));
      setErrorMsg(null);
      setSavedOk(false);
    }
  }, [isOpen, userProfile.phone, userProfile.whatsappNotificationsEnabled]);

  if (!isOpen) return null;

  const normalizedPreview = normalizeSudanWhatsappDigits(phoneInput);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedOk(false);

    if (whatsappEnabled && !normalizedPreview) {
      setErrorMsg(t.whatsapp.invalidPhoneError);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateUserNotificationPreferences(
        uid,
        userProfile.displayName,
        userProfile.role,
        {
          phone: phoneInput.trim(),
          whatsappNotificationsEnabled: whatsappEnabled,
        }
      );
      onProfileUpdated(updated);
      setSavedOk(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.whatsapp.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md w-full p-6 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <MessageCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {t.whatsapp.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.whatsapp.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        {savedOk && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t.whatsapp.savedSuccess}</span>
          </div>
        )}

        {/* Dark Mode Toggle persisted in Firebase */}
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70">
          <div className="text-xs space-y-0.5 min-w-0">
            <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              {darkMode ? (
                <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}
              <span>{t.whatsapp.darkModeTitle}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-300">{t.whatsapp.darkModeDesc}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            onClick={() => onToggleDarkMode(!darkMode)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              darkMode
                ? 'bg-teal-700 text-white border-teal-600 hover:bg-teal-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {darkMode ? t.whatsapp.darkModeOn : t.whatsapp.darkModeOff}
          </button>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="modal-user-phone"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {t.whatsapp.phoneLabel}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              id="modal-user-phone"
              type="tel"
              dir="ltr"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+249 91 234 5678"
              className="w-full ps-9 pe-3 py-2.5 text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700 text-left"
            />
          </div>
          {phoneInput.trim() && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {normalizedPreview
                ? `${t.whatsapp.validPreviewPrefix} +${normalizedPreview}`
                : t.whatsapp.invalidPreview}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-emerald-700 cursor-pointer"
            />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                {t.whatsapp.enableWaTitle}
              </p>
              <p className="text-slate-600 dark:text-slate-300">{t.whatsapp.enableWaDesc}</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 cursor-pointer">
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(e) => onToggleReminders(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-teal-700 cursor-pointer"
            />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                {t.whatsapp.enableToastTitle}
              </p>
              <p className="text-slate-600 dark:text-slate-300">{t.whatsapp.enableToastDesc}</p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer"
          >
            {t.common.close}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? t.common.saving : t.whatsapp.saveBtn}
          </button>
        </div>
      </form>
    </div>
  );
};

