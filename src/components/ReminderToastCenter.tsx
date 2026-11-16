import React from 'react';
import {
  Bell,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  Pill,
  X,
} from 'lucide-react';
import {
  buildWhatsappDispatchUrl,
  buildWhatsappReminderMessage,
  formatMedicationCountdown,
  formatRemainingTime,
  getAppointmentStatusLabel,
  translateSpecialty,
  translateTimeSlot,
} from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import type { Appointment, PatientMedication } from '../types/medical';

export interface ReminderToastItem {
  id: string;
  appointment: Appointment;
  msRemaining: number;
  isPreview?: boolean;
  isWithin30Min?: boolean;
}

export interface MedicationToastItem {
  id: string;
  medication: PatientMedication;
  doseTime: string;
  doseKey: string;
  diffMinutes: number;
  isPreview?: boolean;
}

interface ReminderToastCenterProps {
  toasts: ReminderToastItem[];
  medicationToasts?: MedicationToastItem[];
  whatsappPhone?: string;
  whatsappEnabled?: boolean;
  onDismiss: (id: string) => void;
  onDismissMedication?: (id: string) => void;
  onMarkMedicationTaken?: (med: PatientMedication, doseKey: string) => Promise<void>;
  onOpenPatientAppointments: () => void;
  onOpenPatientMedications?: () => void;
}

export const ReminderToastCenter: React.FC<ReminderToastCenterProps> = ({
  toasts,
  medicationToasts = [],
  whatsappPhone,
  whatsappEnabled,
  onDismiss,
  onDismissMedication,
  onMarkMedicationTaken,
  onOpenPatientAppointments,
  onOpenPatientMedications,
}) => {
  const { lang, dir, t } = useI18n();
  const [busyMedId, setBusyMedId] = React.useState<string | null>(null);

  if (toasts.length === 0 && medicationToasts.length === 0) return null;

  const DirectionalChevron = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div
      aria-live="polite"
      aria-label={t.reminders.ariaLabel}
      className={`no-print fixed bottom-4 ${
        dir === 'rtl' ? 'left-4' : 'right-4'
      } z-50 flex flex-col gap-3 max-w-sm w-[calc(100vw-2rem)] pointer-events-none`}
    >
      {medicationToasts.slice(0, 2).map((medToast) => {
        const { medication, doseTime, doseKey, diffMinutes, isPreview } = medToast;
        const isBusy = busyMedId === medication.id;
        const isPreDose15Min = diffMinutes > 0 && diffMinutes <= 15;
        return (
          <div
            key={medToast.id}
            role="status"
            className={`pointer-events-auto bg-white dark:bg-slate-900 shadow-lg rounded-xl p-4 space-y-2.5 transition-transform duration-200 border ${
              isPreDose15Min
                ? 'border-amber-400 dark:border-amber-500'
                : 'border-teal-400 dark:border-teal-500'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex items-center gap-2 ${
                  isPreDose15Min
                    ? 'text-amber-800 dark:text-amber-300'
                    : 'text-teal-800 dark:text-teal-300'
                }`}
              >
                <Pill className="w-4 h-4 shrink-0" />
                <span className="font-display text-xs font-bold">
                  {isPreview
                    ? t.reminders.medPreviewTitle
                    : isPreDose15Min
                    ? t.reminders.medPreDose15Title
                    : t.reminders.medAutoTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDismissMedication?.(medToast.id)}
                aria-label={t.reminders.closeAria}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {medication.name}
                {medication.dosage ? ` · ${medication.dosage}` : ''}
              </p>
              <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Clock
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isPreDose15Min
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-teal-700 dark:text-teal-400'
                  }`}
                />
                <span>{t.reminders.medDoseTimeLabel}</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {doseTime}
                </span>
                <span>·</span>
                <span
                  className={`font-semibold ${
                    isPreDose15Min
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-teal-800 dark:text-teal-300'
                  }`}
                >
                  {isPreDose15Min
                    ? `${diffMinutes} ${t.reminders.medDueInMinsSuffix}`
                    : formatMedicationCountdown(diffMinutes, false, lang)}
                </span>
              </p>
              {medication.notes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{medication.notes}</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {onMarkMedicationTaken && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={async () => {
                      setBusyMedId(medication.id);
                      try {
                        await onMarkMedicationTaken(medication, doseKey);
                        onDismissMedication?.(medToast.id);
                      } finally {
                        setBusyMedId(null);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-md cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />
                    <span>{t.reminders.medMarkTakenBtn}</span>
                  </button>
                )}
                {onOpenPatientMedications && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPatientMedications();
                      onDismissMedication?.(medToast.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-200 cursor-pointer"
                  >
                    <span>{t.reminders.medOpenMedsBtn}</span>
                    <DirectionalChevron className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismissMedication?.(medToast.id)}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md cursor-pointer"
              >
                {t.reminders.dismissBtn}
              </button>
            </div>
          </div>
        );
      })}

      {toasts.slice(0, 3).map((toast) => {
        const { appointment, msRemaining, isPreview, isWithin30Min } = toast;
        const waMsg = buildWhatsappReminderMessage({
          doctorName: appointment.doctorName,
          clinicName: appointment.clinicName,
          appointmentDate: appointment.appointmentDate,
          timeSlot: appointment.timeSlot,
          msRemaining,
          lang,
        });
        const waUrl = whatsappEnabled ? buildWhatsappDispatchUrl(whatsappPhone, waMsg) : null;
        const isUrgent30 = Boolean(isWithin30Min);

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto bg-white dark:bg-slate-900 border shadow-lg rounded-xl p-4 space-y-2.5 transition-transform duration-200 ${
              isUrgent30
                ? 'border-rose-400 dark:border-rose-500'
                : 'border-amber-300 dark:border-amber-600'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex items-center gap-2 ${
                  isUrgent30
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-amber-800 dark:text-amber-300'
                }`}
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span className="font-display text-xs font-bold">
                  {isPreview
                    ? isUrgent30
                      ? t.reminders.urgent30MinTitle
                      : t.reminders.previewTitle
                    : isUrgent30
                    ? t.reminders.urgent30MinTitle
                    : t.reminders.autoTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label={t.reminders.closeAria}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {appointment.doctorName} · {translateSpecialty(appointment.doctorSpecialty, lang)}
              </p>
              <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CalendarClock className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                <span className="font-mono tabular-nums">{appointment.appointmentDate}</span>
                <span>·</span>
                <span>{translateTimeSlot(appointment.timeSlot, lang)}</span>
              </p>
              <p className="text-amber-800 dark:text-amber-300 font-semibold font-mono tabular-nums">
                {formatRemainingTime(msRemaining, lang)} ·{' '}
                <span className="font-sans">
                  {getAppointmentStatusLabel(appointment.status, lang)}
                </span>
              </p>
              {whatsappEnabled && whatsappPhone && (
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1 pt-0.5">
                  <MessageCircle className="w-3 h-3 shrink-0" />
                  <span>
                    {t.reminders.whatsappEnabledNote} ({whatsappPhone})
                  </span>
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenPatientAppointments();
                    onDismiss(toast.id);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-200 cursor-pointer"
                >
                  <span>{t.reminders.detailsBtn}</span>
                  <DirectionalChevron className="w-3.5 h-3.5" />
                </button>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-md"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>{t.reminders.whatsappBtn}</span>
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md cursor-pointer"
              >
                {t.reminders.dismissBtn}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

