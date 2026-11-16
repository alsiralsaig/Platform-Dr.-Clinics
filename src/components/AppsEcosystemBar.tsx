import React from 'react';
import {
  Building2,
  Check,
  Copy,
  ExternalLink,
  HeartPulse,
  LayoutGrid,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { APP_BRAND_ASSETS } from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import type { AppMode, PortalTab, ProviderTrack, UserProfile } from '../types/medical';

function getShareableAppUrl(mode: AppMode, registerTrack?: ProviderTrack): string {
  const origin = window.location.origin.replace('://ais-dev-', '://ais-pre-');
  const pathname = window.location.pathname === '/' ? '' : window.location.pathname;
  const params = new URLSearchParams();
  params.set('app', mode);
  if (mode === 'provider' && registerTrack) {
    params.set('register', registerTrack);
  }
  return `${origin}${pathname}?${params.toString()}`;
}

async function copyTextSafely(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to execCommand fallback inside restricted iframes
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

interface ShareLinkBoxProps {
  url: string;
  copied: boolean;
  onCopy: () => void;
  openLabel: string;
  copyLabel: string;
  copiedLabel: string;
}

const ShareLinkBox: React.FC<ShareLinkBoxProps> = ({
  url,
  copied,
  onCopy,
  openLabel,
  copyLabel,
  copiedLabel,
}) => (
  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5">
    <input
      type="text"
      readOnly
      dir="ltr"
      value={url}
      onFocus={(e) => e.currentTarget.select()}
      onClick={(e) => e.currentTarget.select()}
      className="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-slate-700 dark:text-slate-200 px-1.5 py-0.5 focus:outline-none"
    />
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-600" />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>{copyLabel}</span>
        </>
      )}
    </button>
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded bg-teal-700 hover:bg-teal-800 text-white shrink-0"
    >
      <ExternalLink className="w-3 h-3" />
      <span>{openLabel}</span>
    </a>
  </div>
);

interface ThreeAppsHubProps {
  appMode: AppMode;
  isAdmin: boolean;
  onSelectApp: (mode: AppMode, targetTab?: PortalTab) => void;
  onStartProviderRegistration: (track: ProviderTrack) => void;
}

export const ThreeAppsHub: React.FC<ThreeAppsHubProps> = ({
  appMode,
  isAdmin,
  onSelectApp,
  onStartProviderRegistration,
}) => {
  const { t } = useI18n();
  const [bannerFailed, setBannerFailed] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [visibleLinkKey, setVisibleLinkKey] = React.useState<string | null>(null);

  const mainUrl = React.useMemo(() => getShareableAppUrl('main'), []);
  const doctorUrl = React.useMemo(() => getShareableAppUrl('provider', 'doctor'), []);
  const clinicUrl = React.useMemo(() => getShareableAppUrl('provider', 'clinic'), []);
  const patientUrl = React.useMemo(() => getShareableAppUrl('patient'), []);

  const handleCopyLink = async (key: string, url: string) => {
    setVisibleLinkKey(key);
    const ok = await copyTextSafely(url);
    if (ok) {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2200);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Official User-Uploaded Platform Banner */}
      {!bannerFailed ? (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#052946] shadow-xs">
          <img
            src={APP_BRAND_ASSETS.banner}
            alt={t.apps.bannerAlt}
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="w-full h-auto max-h-[340px] object-contain mx-auto block"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-l from-sky-950 via-teal-900 to-sky-900 text-white p-6 text-center">
          <h2 className="font-display text-2xl font-bold">{t.common.platformName}</h2>
          <p className="text-sm text-sky-100 mt-1">{t.common.platformTagline}</p>
        </div>
      )}

      {/* 3-App Ecosystem Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-teal-800 dark:text-teal-400">
              {t.apps.hubEyebrow}
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {t.apps.hubTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              {t.apps.hubDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* App 1: Main Platform */}
          <article
            className={`bg-white dark:bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition-colors ${
              appMode === 'main'
                ? 'border-teal-700 dark:border-teal-500 ring-1 ring-teal-700/20 dark:ring-teal-500/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={APP_BRAND_ASSETS.mainAppIcon}
                    alt={t.apps.main.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-teal-800 dark:text-teal-400">
                      01 · {t.apps.main.subtitle}
                    </span>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t.apps.main.title}
                    </h3>
                  </div>
                </div>
                {appMode === 'main' && (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                    {t.apps.activeAppBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.apps.main.desc}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectApp('main', 'directory')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{t.apps.main.openDirBtn}</span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onSelectApp('main', 'admin')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t.apps.main.openAdminBtn}</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleCopyLink('main', mainUrl)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copiedKey === 'main' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.apps.linkCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.apps.copyAppLinkBtn} (?app=main)</span>
                  </>
                )}
              </button>
              {visibleLinkKey === 'main' && (
                <ShareLinkBox
                  url={mainUrl}
                  copied={copiedKey === 'main'}
                  onCopy={() => handleCopyLink('main', mainUrl)}
                  openLabel={t.apps.openLinkBtn}
                  copyLabel={t.apps.copyBtn}
                  copiedLabel={t.apps.linkCopied}
                />
              )}
            </div>
          </article>

          {/* App 2: Doctor & Clinic (with separated registration) */}
          <article
            className={`bg-white dark:bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition-colors ${
              appMode === 'provider'
                ? 'border-teal-700 dark:border-teal-500 ring-1 ring-teal-700/20 dark:ring-teal-500/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={APP_BRAND_ASSETS.providerAppIcon}
                    alt={t.apps.provider.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-teal-800 dark:text-teal-400">
                      02 · {t.apps.provider.subtitle}
                    </span>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t.apps.provider.title}
                    </h3>
                  </div>
                </div>
                {appMode === 'provider' && (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                    {t.apps.activeAppBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.apps.provider.desc}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onStartProviderRegistration('doctor')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.apps.provider.registerDoctorBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStartProviderRegistration('clinic')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.apps.provider.registerClinicBtn}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink('provider_doctor', doctorUrl)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedKey === 'provider_doctor' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{t.apps.linkCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t.apps.copyDoctorLinkBtn}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink('provider_clinic', clinicUrl)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedKey === 'provider_clinic' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{t.apps.linkCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t.apps.copyClinicLinkBtn}</span>
                    </>
                  )}
                </button>
              </div>
              {visibleLinkKey === 'provider_doctor' && (
                <ShareLinkBox
                  url={doctorUrl}
                  copied={copiedKey === 'provider_doctor'}
                  onCopy={() => handleCopyLink('provider_doctor', doctorUrl)}
                  openLabel={t.apps.openLinkBtn}
                  copyLabel={t.apps.copyBtn}
                  copiedLabel={t.apps.linkCopied}
                />
              )}
              {visibleLinkKey === 'provider_clinic' && (
                <ShareLinkBox
                  url={clinicUrl}
                  copied={copiedKey === 'provider_clinic'}
                  onCopy={() => handleCopyLink('provider_clinic', clinicUrl)}
                  openLabel={t.apps.openLinkBtn}
                  copyLabel={t.apps.copyBtn}
                  copiedLabel={t.apps.linkCopied}
                />
              )}
            </div>
          </article>

          {/* App 3: Patients App */}
          <article
            className={`bg-white dark:bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition-colors ${
              appMode === 'patient'
                ? 'border-teal-700 dark:border-teal-500 ring-1 ring-teal-700/20 dark:ring-teal-500/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={APP_BRAND_ASSETS.patientAppIcon}
                    alt={t.apps.patient.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-teal-800 dark:text-teal-400">
                      03 · {t.apps.patient.subtitle}
                    </span>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t.apps.patient.title}
                    </h3>
                  </div>
                </div>
                {appMode === 'patient' && (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                    {t.apps.activeAppBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.apps.patient.desc}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSelectApp('patient', 'patient')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.apps.patient.openPortalBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectApp('patient', 'directory')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.apps.patient.openBookingBtn}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleCopyLink('patient', patientUrl)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copiedKey === 'patient' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.apps.linkCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.apps.copyAppLinkBtn} (?app=patient)</span>
                  </>
                )}
              </button>
              {visibleLinkKey === 'patient' && (
                <ShareLinkBox
                  url={patientUrl}
                  copied={copiedKey === 'patient'}
                  onCopy={() => handleCopyLink('patient', patientUrl)}
                  openLabel={t.apps.openLinkBtn}
                  copyLabel={t.apps.copyBtn}
                  copiedLabel={t.apps.linkCopied}
                />
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

interface ProviderSeparationBarProps {
  activeTrack: ProviderTrack;
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  onSelectTrack: (track: ProviderTrack) => void;
  onActivateTrackRole: (track: ProviderTrack) => void | Promise<void>;
  onBackToMain: () => void;
}

export const ProviderSeparationBar: React.FC<ProviderSeparationBarProps> = ({
  activeTrack,
  firebaseUser,
  userProfile,
  onSelectTrack,
  onActivateTrackRole,
  onBackToMain,
}) => {
  const { t } = useI18n();
  const isDoctorRole = userProfile?.role === 'doctor';
  const isClinicRole = userProfile?.role === 'clinic_admin';
  const [copiedTrack, setCopiedTrack] = React.useState<ProviderTrack | null>(null);
  const [visibleTrackLink, setVisibleTrackLink] = React.useState<ProviderTrack | null>(null);

  const doctorUrl = React.useMemo(() => getShareableAppUrl('provider', 'doctor'), []);
  const clinicUrl = React.useMemo(() => getShareableAppUrl('provider', 'clinic'), []);

  const handleCopyTrackLink = async (track: ProviderTrack) => {
    setVisibleTrackLink(track);
    const url = track === 'doctor' ? doctorUrl : clinicUrl;
    const ok = await copyTextSafely(url);
    if (ok) {
      setCopiedTrack(track);
      window.setTimeout(() => setCopiedTrack((prev) => (prev === track ? null : prev)), 2000);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={APP_BRAND_ASSETS.providerAppIcon}
              alt={t.apps.provider.title}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {t.apps.provider.separationTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t.apps.provider.separationDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToMain}
            className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.apps.backToMainBtn}
          </button>
        </div>

        {/* Separated Registration Tracks: Doctor vs Clinic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Track 1: Doctor Registration & Portal */}
          <div
            className={`rounded-xl border p-4 flex flex-col justify-between transition-colors ${
              activeTrack === 'doctor'
                ? 'border-teal-700 dark:border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                  <span>{t.apps.provider.doctorTrackTitle}</span>
                </h3>
                {activeTrack === 'doctor' && (
                  <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                    {t.apps.provider.doctorTrackActiveBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.apps.provider.doctorTrackDesc}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectTrack('doctor')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTrack === 'doctor'
                      ? 'bg-teal-700 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.apps.provider.doctorTrackOpenBtn}
                </button>
                {!firebaseUser ? (
                  <button
                    type="button"
                    onClick={() => onActivateTrackRole('doctor')}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white cursor-pointer whitespace-nowrap"
                  >
                    {t.apps.provider.doctorTrackCtaSignedOut}
                  </button>
                ) : (
                  !isDoctorRole &&
                  userProfile?.role !== 'central_admin' && (
                    <button
                      type="button"
                      onClick={() => onActivateTrackRole('doctor')}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer whitespace-nowrap"
                    >
                      {t.apps.provider.doctorTrackCtaSwitch}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => handleCopyTrackLink('doctor')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  {copiedTrack === 'doctor' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{t.apps.linkCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{t.apps.copyDoctorLinkBtn}</span>
                    </>
                  )}
                </button>
              </div>
              {visibleTrackLink === 'doctor' && (
                <ShareLinkBox
                  url={doctorUrl}
                  copied={copiedTrack === 'doctor'}
                  onCopy={() => handleCopyTrackLink('doctor')}
                  openLabel={t.apps.openLinkBtn}
                  copyLabel={t.apps.copyBtn}
                  copiedLabel={t.apps.linkCopied}
                />
              )}
            </div>
          </div>

          {/* Track 2: Clinic / Medical Center Registration & Portal */}
          <div
            className={`rounded-xl border p-4 flex flex-col justify-between transition-colors ${
              activeTrack === 'clinic'
                ? 'border-teal-700 dark:border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                  <span>{t.apps.provider.clinicTrackTitle}</span>
                </h3>
                {activeTrack === 'clinic' && (
                  <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                    {t.apps.provider.clinicTrackActiveBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.apps.provider.clinicTrackDesc}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectTrack('clinic')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTrack === 'clinic'
                      ? 'bg-teal-700 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.apps.provider.clinicTrackOpenBtn}
                </button>
                {!firebaseUser ? (
                  <button
                    type="button"
                    onClick={() => onActivateTrackRole('clinic')}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white cursor-pointer whitespace-nowrap"
                  >
                    {t.apps.provider.clinicTrackCtaSignedOut}
                  </button>
                ) : (
                  !isClinicRole &&
                  userProfile?.role !== 'central_admin' && (
                    <button
                      type="button"
                      onClick={() => onActivateTrackRole('clinic')}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer whitespace-nowrap"
                    >
                      {t.apps.provider.clinicTrackCtaSwitch}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => handleCopyTrackLink('clinic')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  {copiedTrack === 'clinic' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{t.apps.linkCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{t.apps.copyClinicLinkBtn}</span>
                    </>
                  )}
                </button>
              </div>
              {visibleTrackLink === 'clinic' && (
                <ShareLinkBox
                  url={clinicUrl}
                  copied={copiedTrack === 'clinic'}
                  onCopy={() => handleCopyTrackLink('clinic')}
                  openLabel={t.apps.openLinkBtn}
                  copyLabel={t.apps.copyBtn}
                  copiedLabel={t.apps.linkCopied}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
