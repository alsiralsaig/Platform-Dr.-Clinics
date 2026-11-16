import React from 'react';
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquareText,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  formatCheckInTime,
  formatSdg,
  getAppointmentStatusLabel,
  getVisitTypeLabel,
  translateLocality,
  translateState,
  translateTimeSlot,
} from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import type { Appointment } from '../types/medical';

interface TodayTasksSectionProps {
  mode: 'doctor' | 'clinic';
  appointments: Appointment[];
  loading: boolean;
  onUpdateStatus: (
    apt: Appointment,
    nextStatus: 'confirmed' | 'completed' | 'no_show' | 'cancelled'
  ) => Promise<void>;
  onOpenChatWithPatient?: (apt: Appointment) => void;
  onOpenEhrForAppointment?: (apt: Appointment) => void;
}

function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const TodayTasksSection: React.FC<TodayTasksSectionProps> = ({
  mode,
  appointments,
  loading,
  onUpdateStatus,
  onOpenChatWithPatient,
  onOpenEhrForAppointment,
}) => {
  const { lang, t } = useI18n();
  const todayIso = React.useMemo(() => getLocalTodayIso(), []);
  const [scope, setScope] = React.useState<'upcoming_and_today' | 'today_only' | 'all_today_done'>(
    'upcoming_and_today'
  );
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const todayAppointments = React.useMemo(
    () =>
      appointments
        .filter((a) => a.appointmentDate === todayIso && a.status !== 'cancelled')
        .sort((a, b) => {
          if (a.status === 'arrived' && b.status !== 'arrived') return -1;
          if (b.status === 'arrived' && a.status !== 'arrived') return 1;
          return a.timeSlot.localeCompare(b.timeSlot);
        }),
    [appointments, todayIso]
  );

  const upcomingActiveAppointments = React.useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            (a.status === 'pending' || a.status === 'confirmed' || a.status === 'arrived') &&
            a.appointmentDate >= todayIso
        )
        .sort((a, b) => {
          if (a.status === 'arrived' && b.status !== 'arrived') return -1;
          if (b.status === 'arrived' && a.status !== 'arrived') return 1;
          return a.appointmentDate === b.appointmentDate
            ? a.timeSlot.localeCompare(b.timeSlot)
            : a.appointmentDate.localeCompare(b.appointmentDate);
        }),
    [appointments, todayIso]
  );

  const overdueOrRecentActive = React.useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            (a.status === 'pending' || a.status === 'confirmed' || a.status === 'arrived') &&
            a.appointmentDate < todayIso
        )
        .sort((a, b) => {
          if (a.status === 'arrived' && b.status !== 'arrived') return -1;
          if (b.status === 'arrived' && a.status !== 'arrived') return 1;
          return b.appointmentDate.localeCompare(a.appointmentDate);
        }),
    [appointments, todayIso]
  );

  const displayedCards = React.useMemo(() => {
    if (scope === 'today_only') return todayAppointments;
    if (scope === 'all_today_done') {
      return [...appointments]
        .filter((a) => a.status !== 'cancelled')
        .sort((a, b) => {
          if (a.status === 'arrived' && b.status !== 'arrived') return -1;
          if (b.status === 'arrived' && a.status !== 'arrived') return 1;
          return b.appointmentDate.localeCompare(a.appointmentDate);
        });
    }
    const activeAll = [...upcomingActiveAppointments, ...overdueOrRecentActive].sort((a, b) => {
      if (a.status === 'arrived' && b.status !== 'arrived') return -1;
      if (b.status === 'arrived' && a.status !== 'arrived') return 1;
      return 0;
    });
    const completedToday = todayAppointments.filter(
      (a) => a.status === 'completed' || a.status === 'no_show'
    );
    return [...activeAll, ...completedToday];
  }, [
    scope,
    todayAppointments,
    upcomingActiveAppointments,
    overdueOrRecentActive,
    appointments,
  ]);

  const stats = React.useMemo(() => {
    const activeToday = todayAppointments.filter(
      (a) => a.status === 'pending' || a.status === 'confirmed' || a.status === 'arrived'
    ).length;
    const arrivedWaiting = appointments.filter((a) => a.status === 'arrived').length;
    const attended = appointments.filter((a) => a.status === 'completed').length;
    const noShow = appointments.filter((a) => a.status === 'no_show').length;
    return {
      todayTotal: todayAppointments.length,
      activeToday,
      arrivedWaiting,
      upcomingActive: upcomingActiveAppointments.length,
      attended,
      noShow,
    };
  }, [todayAppointments, upcomingActiveAppointments.length, appointments]);

  const handleAction = async (
    apt: Appointment,
    nextStatus: 'confirmed' | 'completed' | 'no_show' | 'cancelled'
  ) => {
    setBusyId(apt.id);
    try {
      await onUpdateStatus(apt, nextStatus);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            {t.tasks.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {mode === 'doctor' ? t.tasks.doctorDesc : t.tasks.clinicDesc}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setScope('upcoming_and_today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
              scope === 'upcoming_and_today'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t.tasks.scopeUpcomingToday} ({stats.upcomingActive})
          </button>
          <button
            type="button"
            onClick={() => setScope('today_only')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
              scope === 'today_only'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t.tasks.scopeTodayOnly} ({stats.todayTotal})
          </button>
          <button
            type="button"
            onClick={() => setScope('all_today_done')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
              scope === 'all_today_done'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t.tasks.scopeAllDone} ({appointments.filter((a) => a.status !== 'cancelled').length})
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          className={`border rounded-xl p-4 ${
            stats.arrivedWaiting > 0
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <p className="text-xs text-sky-800 dark:text-sky-300 font-semibold flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tasks.kpiArrivedWaiting}</span>
          </p>
          <p className="font-mono tabular-nums text-2xl font-bold text-sky-800 dark:text-sky-300 mt-1">
            {stats.arrivedWaiting}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.tasks.kpiToday} ({todayIso})
          </p>
          <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {stats.todayTotal}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.tasks.kpiUpcoming}</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
            {stats.upcomingActive}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.tasks.kpiAttended}</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {stats.attended}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.tasks.kpiNoShow}</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-red-700 dark:text-red-400 mt-1">
            {stats.noShow}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {t.tasks.loading}
        </div>
      ) : displayedCards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-2">
          <CalendarCheck className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="font-display text-base font-bold text-slate-800 dark:text-slate-200">
            {t.tasks.emptyTitle}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.tasks.emptyDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedCards.map((apt) => {
            const isToday = apt.appointmentDate === todayIso;
            const isArrived = apt.status === 'arrived';
            const isActionable =
              apt.status === 'pending' || apt.status === 'confirmed' || isArrived;
            const isBusy = busyId === apt.id;
            const arrivedTime = formatCheckInTime(apt.checkedInAt, lang);

            const statusAccent =
              apt.status === 'completed'
                ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                : apt.status === 'no_show'
                ? 'text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
                : isArrived
                ? 'text-sky-900 dark:text-sky-200 bg-sky-100 dark:bg-sky-950/70 border-sky-300 dark:border-sky-700'
                : apt.status === 'confirmed'
                ? 'text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800'
                : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';

            return (
              <article
                key={apt.id}
                className={`border rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors ${
                  isArrived
                    ? 'bg-sky-50/40 dark:bg-sky-950/25 border-sky-300 dark:border-sky-700 ring-1 ring-sky-200 dark:ring-sky-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700'
                }`}
              >
                <div className="space-y-3">
                  {isArrived && (
                    <div className="bg-sky-100/90 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs text-sky-950 dark:text-sky-200">
                      <span className="font-bold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
                        <span>{t.tasks.arrivedBannerBadge}</span>
                      </span>
                      {arrivedTime && (
                        <span className="font-mono tabular-nums font-semibold text-sky-800 dark:text-sky-300">
                          {t.tasks.arrivedAtPrefix} {arrivedTime}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                          {apt.patientName}
                        </h3>
                        {isToday && (
                          <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                            {t.tasks.todayBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                        <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                          {apt.appointmentDate}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {translateTimeSlot(apt.timeSlot, lang)}
                        </span>
                        <span>·</span>
                        <span>{getVisitTypeLabel(apt.visitType, lang)}</span>
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 ${statusAccent}`}
                    >
                      {getAppointmentStatusLabel(apt.status, lang)}
                    </span>
                  </div>

                  {isArrived && (
                    <p className="text-xs text-sky-900 dark:text-sky-300 font-medium">
                      {t.tasks.arrivedNote}
                    </p>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 rounded-lg p-3 text-xs space-y-1">
                    <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>
                        {mode === 'clinic' ? `${apt.doctorName} · ` : ''}
                        {apt.clinicName || t.common.privateClinic} ({translateState(apt.state, lang)}{' '}
                        · {translateLocality(apt.locality, lang)})
                      </span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-800 dark:text-slate-200">
                        {t.tasks.visitReasonPrefix}{' '}
                      </strong>
                      {apt.reason || t.tasks.generalConsult}
                    </p>
                    <p className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {t.tasks.feePrefix}{' '}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {formatSdg(apt.feeSdg, lang)}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {isActionable ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {apt.status === 'pending' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAction(apt, 'confirmed')}
                          className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.tasks.confirmBtn}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(apt, 'completed')}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{t.tasks.attendedBtn}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(apt, 'no_show')}
                        className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>{t.tasks.noShowBtn}</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {apt.status === 'completed' ? t.tasks.completedNote : t.tasks.noShowNote}
                    </span>
                  )}

                  {mode === 'doctor' && (
                    <div className="flex items-center gap-1.5">
                      {onOpenEhrForAppointment && (
                        <button
                          type="button"
                          onClick={() => onOpenEhrForAppointment(apt)}
                          className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          {t.tasks.ehrBtn}
                        </button>
                      )}
                      {onOpenChatWithPatient && (
                        <button
                          type="button"
                          onClick={() => onOpenChatWithPatient(apt)}
                          className="px-2.5 py-1.5 text-xs font-semibold border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg cursor-pointer inline-flex items-center gap-1"
                        >
                          <MessageSquareText className="w-3.5 h-3.5" />
                          <span>{t.tasks.messageBtn}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
