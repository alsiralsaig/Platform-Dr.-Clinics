import type { Appointment } from '../types/medical';

const ENABLED_STORAGE_KEY = 'sd_med_web_push_enabled_v1';
const NOTIFIED_STORAGE_KEY = 'sd_med_notified_apts_v1';

export type WebNotificationPermissionState = NotificationPermission | 'unsupported';

export function isWebNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getWebNotificationPermission(): WebNotificationPermissionState {
  if (!isWebNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestWebNotificationPermission(): Promise<WebNotificationPermissionState> {
  if (!isWebNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

export function loadWebNotificationEnabled(): boolean {
  try {
    const raw = localStorage.getItem(ENABLED_STORAGE_KEY);
    if (raw === null) {
      return isWebNotificationSupported() && Notification.permission === 'granted';
    }
    return raw === 'true';
  } catch {
    return false;
  }
}

export function saveWebNotificationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ENABLED_STORAGE_KEY, String(enabled));
  } catch {
    // ignore storage quota / restricted iframe storage errors
  }
}

function readNotifiedMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, number>;
    }
    return {};
  } catch {
    return {};
  }
}

function buildAppointmentNotifyKey(apt: Pick<Appointment, 'id' | 'appointmentDate' | 'timeSlot'>): string {
  return `${apt.id}_${apt.appointmentDate}_${apt.timeSlot}`;
}

export function hasAppointmentBeenWebNotified(
  apt: Pick<Appointment, 'id' | 'appointmentDate' | 'timeSlot'>,
): boolean {
  const map = readNotifiedMap();
  return Boolean(map[buildAppointmentNotifyKey(apt)]);
}

export function markAppointmentWebNotified(
  apt: Pick<Appointment, 'id' | 'appointmentDate' | 'timeSlot'>,
): void {
  try {
    const map = readNotifiedMap();
    const now = Date.now();
    // Prune entries older than 7 days
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const cleaned: Record<string, number> = {};
    for (const [key, ts] of Object.entries(map)) {
      if (typeof ts === 'number' && now - ts < sevenDaysMs) {
        cleaned[key] = ts;
      }
    }
    cleaned[buildAppointmentNotifyKey(apt)] = now;
    localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // ignore storage errors
  }
}

export async function dispatchWebNotification(options: {
  title: string;
  body: string;
  tag?: string;
}): Promise<boolean> {
  if (!isWebNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    body: options.body,
    tag: options.tag,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    requireInteraction: true,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
      ]);
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(options.title, notificationOptions);
        return true;
      }
    }
  } catch {
    // fallback to standard Notification API
  }

  try {
    new Notification(options.title, notificationOptions);
    return true;
  } catch {
    return false;
  }
}

export async function dispatchAppointmentWebNotification(
  apt: Appointment,
  minutesRemaining: number,
  lang: 'ar' | 'en',
): Promise<boolean> {
  const safeMinutes = Math.max(1, Math.round(minutesRemaining));
  const title =
    lang === 'ar'
      ? `تذكير عاجل بموعد طبي خلال ${safeMinutes} دقيقة`
      : `Urgent Appointment Reminder (${safeMinutes} min left)`;
  const body =
    lang === 'ar'
      ? `موعدك مع ${apt.doctorName}${apt.clinicName ? ` (${apt.clinicName})` : ''} الساعة ${apt.timeSlot}. يرجى الاستعداد والحضور.`
      : `Your appointment with ${apt.doctorName}${apt.clinicName ? ` (${apt.clinicName})` : ''} is at ${apt.timeSlot}. Please get ready.`;

  return dispatchWebNotification({
    title,
    body,
    tag: `sd-med-apt-${apt.id}`,
  });
}
