import React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { AdminPortal } from './components/AdminPortal';
import { ProviderSeparationBar, ThreeAppsHub } from './components/AppsEcosystemBar';
import { ClinicPortal } from './components/ClinicPortal';
import { DirectoryView } from './components/DirectoryView';
import { DoctorPortal } from './components/DoctorPortal';
import { PatientPortal } from './components/PatientPortal';
import { OfflineIndicator } from './components/PWAInstallButton';
import {
  ReminderToastCenter,
  type MedicationToastItem,
  type ReminderToastItem,
} from './components/ReminderToastCenter';
import { TopNav } from './components/TopNav';
import { WhatsappSettingsModal } from './components/WhatsappSettingsModal';
import { getMedicationDoseAlert, parseAppointmentDateTime } from './data/sudanGeo';
import { useI18n } from './i18n/I18nContext';
import {
  CENTRAL_ADMIN_EMAIL,
  auth,
  signInWithGoogle,
  signOutAccount,
} from './lib/firebase';
import {
  ensureUserAccount,
  fetchAppointmentsByPatient,
  fetchApprovedClinics,
  fetchApprovedDoctors,
  fetchPatientMedications,
  fetchPublishedReviews,
  subscribeApprovedDirectory,
  subscribeBookedSlots,
  subscribePatientAppointments,
  subscribePatientMedications,
  switchMyWorkspaceRole,
  updatePatientMedicationStatus,
  updateUserDarkModePreference,
  updateUserFavorites,
} from './lib/firestoreService';
import {
  dispatchAppointmentWebNotification,
  dispatchWebNotification,
  getWebNotificationPermission,
  hasAppointmentBeenWebNotified,
  loadWebNotificationEnabled,
  markAppointmentWebNotified,
  requestWebNotificationPermission,
  saveWebNotificationEnabled,
  type WebNotificationPermissionState,
} from './lib/webNotifications';
import type {
  AppMode,
  Appointment,
  BookedSlot,
  ClinicCenter,
  DoctorProfile,
  PatientMedication,
  PortalTab,
  ProviderTrack,
  ServiceReview,
  UserProfile,
} from './types/medical';

function readInitialAppState(): { initialMode: AppMode; initialTab: PortalTab } {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlApp = params.get('app');
    const urlRegister = params.get('register');

    if (urlRegister === 'doctor') {
      return { initialMode: 'provider', initialTab: 'doctor' };
    }
    if (urlRegister === 'clinic') {
      return { initialMode: 'provider', initialTab: 'clinic' };
    }

    const stored = window.localStorage.getItem('sd_med_app_mode');
    const storedTrack = window.localStorage.getItem('sd_med_provider_track');
    const mode: AppMode =
      urlApp === 'main' || urlApp === 'provider' || urlApp === 'patient'
        ? urlApp
        : stored === 'main' || stored === 'provider' || stored === 'patient'
          ? stored
          : 'main';

    if (mode === 'provider') {
      return {
        initialMode: 'provider',
        initialTab: storedTrack === 'clinic' ? 'clinic' : 'doctor',
      };
    }
    if (mode === 'patient') return { initialMode: 'patient', initialTab: 'patient' };
    return { initialMode: 'main', initialTab: 'directory' };
  } catch {
    return { initialMode: 'main', initialTab: 'directory' };
  }
}

export default function App() {
  const { lang, dir, t } = useI18n();
  const initialRef = React.useRef(readInitialAppState());
  const [appMode, setAppMode] = React.useState<AppMode>(initialRef.current.initialMode);
  const [activeTab, setActiveTab] = React.useState<PortalTab>(initialRef.current.initialTab);
  const pendingPreferredRoleRef = React.useRef<'patient' | 'doctor' | 'clinic_admin' | undefined>(
    undefined
  );
  const [firebaseUser, setFirebaseUser] = React.useState<User | null>(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [authBusy, setAuthBusy] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [authError, setAuthError] = React.useState<string>('');
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = React.useState(false);

  const [approvedDoctors, setApprovedDoctors] = React.useState<DoctorProfile[]>([]);
  const [approvedClinics, setApprovedClinics] = React.useState<ClinicCenter[]>([]);
  const [publishedReviews, setPublishedReviews] = React.useState<ServiceReview[]>([]);
  const [bookedSlots, setBookedSlots] = React.useState<BookedSlot[]>([]);
  const [patientAppointments, setPatientAppointments] = React.useState<Appointment[]>([]);
  const [patientMedications, setPatientMedications] = React.useState<PatientMedication[]>([]);
  const [directoryLoading, setDirectoryLoading] = React.useState(true);
  const [remindersEnabled, setRemindersEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState<boolean>(() => {
    try {
      return window.localStorage.getItem('sd_med_dark_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [showWhatsappModal, setShowWhatsappModal] = React.useState(false);
  const [dismissedToastIds, setDismissedToastIds] = React.useState<string[]>([]);
  const [dismissedMedToastIds, setDismissedMedToastIds] = React.useState<string[]>([]);
  const [previewToasts, setPreviewToasts] = React.useState<ReminderToastItem[]>([]);
  const [previewMedToasts, setPreviewMedToasts] = React.useState<MedicationToastItem[]>([]);
  const [openPatientMedsSignal, setOpenPatientMedsSignal] = React.useState(0);
  const [clockTick, setClockTick] = React.useState(() => Date.now());
  const [webPushEnabled, setWebPushEnabled] = React.useState<boolean>(() =>
    loadWebNotificationEnabled()
  );
  const [webPushPermission, setWebPushPermission] =
    React.useState<WebNotificationPermissionState>(() => getWebNotificationPermission());

  const isAdmin = React.useMemo(() => {
    if (!firebaseUser) return false;
    const isBootEmail =
      firebaseUser.email?.toLowerCase() === CENTRAL_ADMIN_EMAIL.toLowerCase() &&
      firebaseUser.emailVerified;
    return isBootEmail || userProfile?.role === 'central_admin';
  }, [firebaseUser, userProfile]);

  React.useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const loadPublicDirectory = React.useCallback(async () => {
    setDirectoryLoading(true);
    try {
      const [docs, clins, revs] = await Promise.all([
        fetchApprovedDoctors(),
        fetchApprovedClinics(),
        fetchPublishedReviews(),
      ]);
      setApprovedDoctors(docs);
      setApprovedClinics(clins);
      setPublishedReviews(revs);
    } catch (err) {
      console.error('Directory fetch failed:', err);
    } finally {
      setDirectoryLoading(false);
    }
  }, []);

  const loadPatientAppointments = React.useCallback(async (uid: string) => {
    try {
      const [apts, meds] = await Promise.all([
        fetchAppointmentsByPatient(uid),
        fetchPatientMedications(uid),
      ]);
      setPatientAppointments(apts);
      setPatientMedications(meds);
    } catch (err) {
      console.error('Patient data fetch failed:', err);
    }
  }, []);

  React.useEffect(() => {
    setDirectoryLoading(true);
    let readyCount = 0;
    const markReady = () => {
      readyCount += 1;
      if (readyCount >= 2) setDirectoryLoading(false);
    };
    const unsubscribe = subscribeApprovedDirectory({
      onDoctors: (docs) => {
        setApprovedDoctors(docs);
        markReady();
      },
      onClinics: (clins) => {
        setApprovedClinics(clins);
        markReady();
      },
      onReviews: (revs) => {
        setPublishedReviews(revs);
      },
    });
    const unsubSlots = subscribeBookedSlots((slots) => {
      setBookedSlots(slots);
    });
    return () => {
      unsubscribe();
      unsubSlots();
    };
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      window.localStorage.setItem('sd_med_dark_mode', String(darkMode));
    } catch {
      // Ignore storage quota errors
    }
  }, [darkMode]);

  React.useEffect(() => {
    if (typeof userProfile?.darkMode === 'boolean') {
      setDarkMode(userProfile.darkMode);
    }
  }, [userProfile?.darkMode]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem('sd_med_app_mode', appMode);
      const url = new URL(window.location.href);
      url.searchParams.set('app', appMode);
      if (appMode === 'provider' && (activeTab === 'doctor' || activeTab === 'clinic')) {
        window.localStorage.setItem('sd_med_provider_track', activeTab);
        url.searchParams.set('register', activeTab);
      } else {
        url.searchParams.delete('register');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history/storage errors in restricted contexts
    }
  }, [appMode, activeTab]);

  React.useEffect(() => {
    let unsubAppointments: (() => void) | null = null;
    let unsubMedications: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubAppointments) {
        unsubAppointments();
        unsubAppointments = null;
      }
      if (unsubMedications) {
        unsubMedications();
        unsubMedications = null;
      }
      setFirebaseUser(user);
      setAuthError('');
      if (user) {
        try {
          const desiredRole = pendingPreferredRoleRef.current;
          pendingPreferredRoleRef.current = undefined;
          let profile = await ensureUserAccount(user, desiredRole);
          if (
            desiredRole &&
            profile.role !== 'central_admin' &&
            profile.role !== desiredRole
          ) {
            await switchMyWorkspaceRole(user.uid, desiredRole);
            profile = { ...profile, role: desiredRole };
          }
          setUserProfile(profile);
          unsubAppointments = subscribePatientAppointments(user.uid, (apts) => {
            setPatientAppointments(apts);
          });
          unsubMedications = subscribePatientMedications(user.uid, (meds) => {
            setPatientMedications(meds);
          });
        } catch (err) {
          setAuthError(
            err instanceof Error ? err.message : t.common.authInitError
          );
        }
      } else {
        setUserProfile(null);
        setPatientAppointments([]);
        setPatientMedications([]);
      }
      setAuthReady(true);
    });
    return () => {
      unsubAuth();
      if (unsubAppointments) unsubAppointments();
      if (unsubMedications) unsubMedications();
    };
  }, [t.common.authInitError]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTick(Date.now());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const autoReminderToasts = React.useMemo<ReminderToastItem[]>(() => {
    if (!firebaseUser || !remindersEnabled) return [];
    const limitMs = 24 * 60 * 60 * 1000;
    const thirtyMinMs = 30 * 60 * 1000;
    return patientAppointments
      .filter((apt) => apt.status === 'pending' || apt.status === 'confirmed')
      .map((apt) => {
        const dt = parseAppointmentDateTime(apt.appointmentDate, apt.timeSlot);
        const msRemaining = dt ? dt.getTime() - clockTick : -1;
        return {
          id: `auto_${apt.id}`,
          appointment: apt,
          msRemaining,
          isWithin30Min: msRemaining > 0 && msRemaining <= thirtyMinMs,
        };
      })
      .filter(
        (item) =>
          item.msRemaining > 0 &&
          item.msRemaining <= limitMs &&
          !dismissedToastIds.includes(item.id)
      )
      .sort((a, b) => a.msRemaining - b.msRemaining);
  }, [firebaseUser, remindersEnabled, patientAppointments, clockTick, dismissedToastIds]);

  React.useEffect(() => {
    if (!firebaseUser || !webPushEnabled) return;
    if (getWebNotificationPermission() !== 'granted') return;
    const thirtyMinMs = 30 * 60 * 1000;
    patientAppointments
      .filter((apt) => apt.status === 'pending' || apt.status === 'confirmed')
      .forEach((apt) => {
        const dt = parseAppointmentDateTime(apt.appointmentDate, apt.timeSlot);
        if (!dt) return;
        const msRemaining = dt.getTime() - clockTick;
        if (msRemaining > 0 && msRemaining <= thirtyMinMs && !hasAppointmentBeenWebNotified(apt)) {
          markAppointmentWebNotified(apt);
          dispatchAppointmentWebNotification(apt, Math.ceil(msRemaining / 60000), lang).catch(
            () => {}
          );
        }
      });
  }, [firebaseUser, webPushEnabled, patientAppointments, clockTick, lang]);

  const handleToggleWebPush = async (enable: boolean) => {
    if (!enable) {
      setWebPushEnabled(false);
      saveWebNotificationEnabled(false);
      return;
    }
    const perm = await requestWebNotificationPermission();
    setWebPushPermission(perm);
    if (perm === 'granted') {
      setWebPushEnabled(true);
      saveWebNotificationEnabled(true);
    } else {
      setWebPushEnabled(false);
      saveWebNotificationEnabled(false);
    }
  };

  const handleSendTestWebNotification = async () => {
    const perm = await requestWebNotificationPermission();
    setWebPushPermission(perm);
    if (perm === 'granted') {
      setWebPushEnabled(true);
      saveWebNotificationEnabled(true);
    }
    const nextUpcoming = patientAppointments
      .filter((apt) => apt.status === 'pending' || apt.status === 'confirmed')
      .map((apt) => {
        const dt = parseAppointmentDateTime(apt.appointmentDate, apt.timeSlot);
        return { apt, msRemaining: dt ? dt.getTime() - Date.now() : -1 };
      })
      .filter((x) => x.msRemaining > 0)
      .sort((a, b) => a.msRemaining - b.msRemaining)[0];

    if (nextUpcoming) {
      if (perm === 'granted') {
        await dispatchAppointmentWebNotification(nextUpcoming.apt, 30, lang);
      }
      setPreviewToasts((prev) => [
        {
          id: `preview_30m_${nextUpcoming.apt.id}_${Date.now()}`,
          appointment: nextUpcoming.apt,
          msRemaining: Math.min(nextUpcoming.msRemaining, 30 * 60 * 1000),
          isPreview: true,
          isWithin30Min: true,
        },
        ...prev.filter((p) => p.appointment.id !== nextUpcoming.apt.id),
      ]);
    } else if (perm === 'granted') {
      await dispatchWebNotification({
        title:
          lang === 'ar'
            ? 'تنبيه تجريبي: موعد طبي خلال 30 دقيقة'
            : 'Test Alert: Appointment in 30 Minutes',
        body:
          lang === 'ar'
            ? 'تعمل إشعارات الدفع الفورية بنجاح لتنبيهك قبل كل موعد بـ 30 دقيقة.'
            : 'Push notifications are active and will alert you 30 minutes before scheduled visits.',
        tag: 'sd-med-test-30m',
      });
    }
  };

  const activeToasts = React.useMemo(
    () => [...previewToasts, ...autoReminderToasts],
    [previewToasts, autoReminderToasts]
  );

  const handleDismissToast = (id: string) => {
    if (id.startsWith('preview_')) {
      setPreviewToasts((prev) => prev.filter((item) => item.id !== id));
    } else {
      setDismissedToastIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const handlePreviewReminderToast = (appointment: Appointment, msRemaining: number) => {
    const id = `preview_${appointment.id}_${Date.now()}`;
    setPreviewToasts((prev) => [
      {
        id,
        appointment,
        msRemaining,
        isPreview: true,
        isWithin30Min: msRemaining > 0 && msRemaining <= 30 * 60 * 1000,
      },
      ...prev.filter((p) => p.appointment.id !== appointment.id),
    ]);
  };

  const autoMedicationToasts = React.useMemo<MedicationToastItem[]>(() => {
    if (!firebaseUser || !remindersEnabled) return [];
    const now = new Date(clockTick);
    return patientMedications
      .filter((med) => med.status === 'active' && med.reminderEnabled)
      .map((med) => {
        const alert = getMedicationDoseAlert(med, now);
        return { med, alert };
      })
      .filter(
        (item) =>
          item.alert.state === 'due_now' &&
          item.alert.nextTime &&
          item.alert.doseKey &&
          !dismissedMedToastIds.includes(`med_auto_${item.med.id}_${item.alert.doseKey}`)
      )
      .map((item) => ({
        id: `med_auto_${item.med.id}_${item.alert.doseKey}`,
        medication: item.med,
        doseTime: item.alert.nextTime!,
        doseKey: item.alert.doseKey!,
        diffMinutes: item.alert.diffMinutes ?? 0,
      }));
  }, [firebaseUser, remindersEnabled, patientMedications, clockTick, dismissedMedToastIds]);

  const activeMedicationToasts = React.useMemo(
    () => [...previewMedToasts, ...autoMedicationToasts],
    [previewMedToasts, autoMedicationToasts]
  );

  const handleDismissMedicationToast = (id: string) => {
    if (id.startsWith('med_preview_')) {
      setPreviewMedToasts((prev) => prev.filter((item) => item.id !== id));
    } else {
      setDismissedMedToastIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const handlePreviewMedicationToast = (med: PatientMedication) => {
    const alert = getMedicationDoseAlert(med, new Date());
    const doseTime = alert.nextTime || med.scheduleTimes?.[0] || '08:00';
    const today = new Date();
    const fallbackKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(today.getDate()).padStart(2, '0')}_${doseTime}`;
    const doseKey = alert.doseKey || fallbackKey;
    const id = `med_preview_${med.id}_${Date.now()}`;
    setPreviewMedToasts((prev) => [
      {
        id,
        medication: med,
        doseTime,
        doseKey,
        diffMinutes: alert.diffMinutes ?? 0,
        isPreview: true,
      },
      ...prev.filter((p) => p.medication.id !== med.id),
    ]);
  };

  const handleMarkMedicationTaken = async (med: PatientMedication, doseKey: string) => {
    if (!firebaseUser) return;
    await updatePatientMedicationStatus(
      med.id,
      firebaseUser.uid,
      userProfile?.displayName || firebaseUser.displayName || 'مريض',
      { lastTakenKey: doseKey }
    );
    setPreviewMedToasts((prev) => prev.filter((p) => p.medication.id !== med.id));
  };

  const handleSignIn = async (preferredRole?: 'patient' | 'doctor' | 'clinic_admin') => {
    setAuthBusy(true);
    setAuthError('');
    if (preferredRole) {
      pendingPreferredRoleRef.current = preferredRole;
    } else if (appMode === 'provider') {
      pendingPreferredRoleRef.current = activeTab === 'clinic' ? 'clinic_admin' : 'doctor';
    } else if (appMode === 'patient') {
      pendingPreferredRoleRef.current = 'patient';
    }
    try {
      await signInWithGoogle();
    } catch (err) {
      pendingPreferredRoleRef.current = undefined;
      setAuthError(
        err instanceof Error ? err.message : t.common.authSignInError
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSelectAppMode = (mode: AppMode, explicitTab?: PortalTab) => {
    setAppMode(mode);
    if (explicitTab) {
      setActiveTab(explicitTab);
    } else if (mode === 'provider') {
      setActiveTab('doctor');
    } else if (mode === 'patient') {
      setActiveTab('patient');
    } else {
      setActiveTab('directory');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigatePortal = (tab: PortalTab) => {
    setActiveTab(tab);
    if (tab === 'doctor' || tab === 'clinic') {
      setAppMode('provider');
    } else if (tab === 'patient') {
      setAppMode('patient');
    } else if (tab === 'admin') {
      setAppMode('main');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartProviderRegistration = (track: ProviderTrack) => {
    setAppMode('provider');
    setActiveTab(track === 'clinic' ? 'clinic' : 'doctor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleActivateTrackRole = async (track: ProviderTrack) => {
    const targetRole = track === 'clinic' ? 'clinic_admin' : 'doctor';
    setAppMode('provider');
    setActiveTab(track);
    if (!firebaseUser) {
      await handleSignIn(targetRole);
      return;
    }
    if (userProfile && userProfile.role !== 'central_admin' && userProfile.role !== targetRole) {
      try {
        await switchMyWorkspaceRole(firebaseUser.uid, targetRole);
        setUserProfile((prev) => (prev ? { ...prev, role: targetRole } : prev));
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : t.common.authInitError);
      }
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOutAccount();
      setActiveTab(appMode === 'provider' ? 'doctor' : 'directory');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleToggleDarkMode = async (nextDark: boolean) => {
    setDarkMode(nextDark);
    if (!firebaseUser || !userProfile) return;
    setUserProfile((prev) => (prev ? { ...prev, darkMode: nextDark } : prev));
    try {
      const updated = await updateUserDarkModePreference(firebaseUser.uid, nextDark);
      setUserProfile(updated);
    } catch (err) {
      console.error('Failed to save dark mode preference:', err);
    }
  };

  const handleToggleFavoriteDoctor = async (doctorUid: string) => {
    if (!firebaseUser || !userProfile) {
      await handleSignIn();
      return;
    }
    const current = userProfile.favoriteDoctorUids || [];
    const next = current.includes(doctorUid)
      ? current.filter((id) => id !== doctorUid)
      : [...current, doctorUid];
    setUserProfile((prev) => (prev ? { ...prev, favoriteDoctorUids: next } : prev));
    try {
      const updated = await updateUserFavorites(
        firebaseUser.uid,
        userProfile.displayName,
        userProfile.role,
        { favoriteDoctorUids: next }
      );
      setUserProfile(updated);
    } catch (err) {
      console.error('Failed to update favorite doctors:', err);
    }
  };

  const handleToggleFavoriteClinic = async (clinicId: string) => {
    if (!firebaseUser || !userProfile) {
      await handleSignIn();
      return;
    }
    const current = userProfile.favoriteClinicIds || [];
    const next = current.includes(clinicId)
      ? current.filter((id) => id !== clinicId)
      : [...current, clinicId];
    setUserProfile((prev) => (prev ? { ...prev, favoriteClinicIds: next } : prev));
    try {
      const updated = await updateUserFavorites(
        firebaseUser.uid,
        userProfile.displayName,
        userProfile.role,
        { favoriteClinicIds: next }
      );
      setUserProfile(updated);
    } catch (err) {
      console.error('Failed to update favorite clinics:', err);
    }
  };

  const handleRefreshAll = async () => {
    await loadPublicDirectory();
    if (firebaseUser) {
      await loadPatientAppointments(firebaseUser.uid);
    }
  };

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {mapsQuotaExceeded && (
        <div className="sticky top-0 z-50 bg-amber-50 dark:bg-amber-950/90 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 px-4 py-2.5 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {t.quota.bannerText}{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-amber-950"
                >
                  {t.quota.learnMore}
                </a>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMapsQuotaExceeded(false)}
              aria-label={t.common.close}
              className="p-1 hover:bg-amber-100 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <TopNav
        appMode={appMode}
        onSelectAppMode={handleSelectAppMode}
        activeTab={activeTab}
        onSelectTab={handleNavigatePortal}
        firebaseUser={firebaseUser}
        userProfile={userProfile}
        isAdmin={isAdmin}
        darkMode={darkMode}
        onToggleDarkMode={() => handleToggleDarkMode(!darkMode)}
        onSignIn={() => handleSignIn()}
        onSignOut={handleSignOut}
        onOpenNotificationSettings={() => setShowWhatsappModal(true)}
        authBusy={authBusy}
      />

      {authError && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl p-3.5 text-sm">
            {authError}
          </div>
        </div>
      )}

      {userProfile?.accountStatus === 'suspended' ? (
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 w-full">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-red-700 dark:text-red-400 mx-auto" />
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              {t.common.suspendedTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {userProfile.suspensionReason
                ? `${t.common.suspendedReasonPrefix}${userProfile.suspensionReason}`
                : t.common.suspendedDefaultMsg}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-5 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              {t.common.signOut}
            </button>
          </div>
        </main>
      ) : (
        <main className="flex-1">
          {!authReady ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-slate-500 dark:text-slate-400">
              {t.common.initializing}
            </div>
          ) : (
            <>
              {appMode === 'provider' && (activeTab === 'doctor' || activeTab === 'clinic') && (
                <ProviderSeparationBar
                  activeTrack={activeTab === 'clinic' ? 'clinic' : 'doctor'}
                  firebaseUser={firebaseUser}
                  userProfile={userProfile}
                  onSelectTrack={(track) => setActiveTab(track)}
                  onActivateTrackRole={handleActivateTrackRole}
                  onBackToMain={() => handleSelectAppMode('main', 'directory')}
                />
              )}

              {activeTab === 'directory' && (
                <div className="space-y-6">
                  {appMode === 'main' && (
                    <ThreeAppsHub
                      appMode={appMode}
                      isAdmin={isAdmin}
                      onSelectApp={handleSelectAppMode}
                      onStartProviderRegistration={handleStartProviderRegistration}
                    />
                  )}
                  <DirectoryView
                    doctors={approvedDoctors}
                    clinics={approvedClinics}
                    reviews={publishedReviews}
                    bookedSlots={bookedSlots}
                    favoriteDoctorUids={userProfile?.favoriteDoctorUids || []}
                    favoriteClinicIds={userProfile?.favoriteClinicIds || []}
                    loading={directoryLoading}
                    firebaseUser={firebaseUser}
                    userProfile={userProfile}
                    onSignIn={() => handleSignIn()}
                    onNavigatePortal={handleNavigatePortal}
                    onAppointmentCreated={handleRefreshAll}
                    onToggleFavoriteDoctor={handleToggleFavoriteDoctor}
                    onToggleFavoriteClinic={handleToggleFavoriteClinic}
                  />
                </div>
              )}

              {activeTab === 'patient' && (
                <PatientPortal
                  firebaseUser={firebaseUser}
                  userProfile={userProfile}
                  approvedDoctors={approvedDoctors}
                  approvedClinics={approvedClinics}
                  appointments={patientAppointments}
                  medications={patientMedications}
                  remindersEnabled={remindersEnabled}
                  webPushEnabled={webPushEnabled}
                  webPushPermission={webPushPermission}
                  darkMode={darkMode}
                  openMedsSignal={openPatientMedsSignal}
                  onToggleReminders={setRemindersEnabled}
                  onToggleWebPush={handleToggleWebPush}
                  onSendTestWebNotification={handleSendTestWebNotification}
                  onToggleDarkMode={handleToggleDarkMode}
                  onToggleFavoriteDoctor={handleToggleFavoriteDoctor}
                  onToggleFavoriteClinic={handleToggleFavoriteClinic}
                  onPreviewReminderToast={handlePreviewReminderToast}
                  onPreviewMedicationToast={handlePreviewMedicationToast}
                  onMarkMedicationTaken={handleMarkMedicationTaken}
                  onProfileUpdated={setUserProfile}
                  onSignIn={() => handleSignIn('patient')}
                  onRefreshData={handleRefreshAll}
                  onNavigatePortal={handleNavigatePortal}
                />
              )}

              {activeTab === 'doctor' && (
                <DoctorPortal
                  firebaseUser={firebaseUser}
                  userProfile={userProfile}
                  approvedClinics={approvedClinics}
                  bookedSlots={bookedSlots}
                  onSignIn={() => handleSignIn('doctor')}
                  onRefreshGlobal={handleRefreshAll}
                />
              )}

              {activeTab === 'clinic' && (
                <ClinicPortal
                  firebaseUser={firebaseUser}
                  userProfile={userProfile}
                  approvedDoctors={approvedDoctors}
                  bookedSlots={bookedSlots}
                  isAdmin={isAdmin}
                  onSignIn={() => handleSignIn('clinic_admin')}
                  onRefreshGlobal={handleRefreshAll}
                />
              )}

              {activeTab === 'admin' && (
                <AdminPortal
                  firebaseUser={firebaseUser}
                  userProfile={userProfile}
                  isAdmin={isAdmin}
                  onRefreshGlobal={handleRefreshAll}
                />
              )}
            </>
          )}
        </main>
      )}

      <ReminderToastCenter
        toasts={activeToasts}
        medicationToasts={activeMedicationToasts}
        whatsappPhone={userProfile?.phone}
        whatsappEnabled={Boolean(userProfile?.whatsappNotificationsEnabled)}
        onDismiss={handleDismissToast}
        onDismissMedication={handleDismissMedicationToast}
        onMarkMedicationTaken={handleMarkMedicationTaken}
        onOpenPatientAppointments={() => handleSelectAppMode('patient', 'patient')}
        onOpenPatientMedications={() => {
          handleSelectAppMode('patient', 'patient');
          setOpenPatientMedsSignal((n) => n + 1);
        }}
      />

      <OfflineIndicator />

      {firebaseUser && userProfile && (
        <WhatsappSettingsModal
          isOpen={showWhatsappModal}
          onClose={() => setShowWhatsappModal(false)}
          uid={firebaseUser.uid}
          userProfile={userProfile}
          remindersEnabled={remindersEnabled}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onToggleReminders={setRemindersEnabled}
          onProfileUpdated={setUserProfile}
        />
      )}

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>{t.footer.copyright}</p>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => handleSelectAppMode('main', 'directory')}
              className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              {t.apps.main.shortName}
            </button>
            <button
              type="button"
              onClick={() => handleSelectAppMode('provider', 'doctor')}
              className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              {t.nav.doctor}
            </button>
            <button
              type="button"
              onClick={() => handleSelectAppMode('provider', 'clinic')}
              className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              {t.nav.clinic}
            </button>
            <button
              type="button"
              onClick={() => handleSelectAppMode('patient', 'patient')}
              className="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              {t.apps.patient.shortName}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
