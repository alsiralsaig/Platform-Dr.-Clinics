import React from 'react';
import {
  Ban,
  BarChart3,
  Building2,
  CheckCircle2,
  FileSearch,
  History,
  MessageSquareWarning,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { User } from 'firebase/auth';
import {
  formatSdg,
  getApprovalLabel,
  getCenterTypeLabel,
  getRoleLabel,
  translateLocality,
  translateSpecialty,
  translateState,
} from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import {
  adminResolveComplaint,
  adminReviewClinic,
  adminReviewDoctor,
  adminToggleReviewVisibility,
  adminUpdateUserStatus,
  fetchAdminDashboardData,
  subscribeAdminDashboardData,
} from '../lib/firestoreService';
import { useIsDarkMode } from '../lib/useIsDarkMode';
import type {
  Appointment,
  ApprovalStatus,
  AuditLog,
  ClinicCenter,
  Complaint,
  ComplaintStatus,
  DoctorProfile,
  ServiceReview,
  UserProfile,
} from '../types/medical';

interface AdminPortalProps {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  onRefreshGlobal: () => Promise<void>;
}

type AdminSubTab = 'overview' | 'approvals' | 'users' | 'complaints_reviews' | 'audit';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  firebaseUser,
  userProfile,
  isAdmin,
  onRefreshGlobal,
}) => {
  const { lang, dir, t } = useI18n();
  const isDark = useIsDarkMode();
  const [subTab, setSubTab] = React.useState<AdminSubTab>('overview');
  const [doctors, setDoctors] = React.useState<DoctorProfile[]>([]);
  const [clinics, setClinics] = React.useState<ClinicCenter[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [reviews, setReviews] = React.useState<ServiceReview[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Reason Modal for Reject / Suspend / Resolve
  const [reasonModal, setReasonModal] = React.useState<{
    kind: 'doctor' | 'clinic' | 'user' | 'complaint';
    targetId: string;
    title: string;
    decision: string;
    requireReason: boolean;
  } | null>(null);
  const [reasonText, setReasonText] = React.useState('');
  const [submittingDecision, setSubmittingDecision] = React.useState(false);

  const loadAdminData = React.useCallback(async () => {
    if (!firebaseUser || !isAdmin) return;
    setLoading(true);
    try {
      const data = await fetchAdminDashboardData();
      setDoctors(data.doctors);
      setClinics(data.clinics);
      setUsers(data.users);
      setAppointments(data.appointments);
      setComplaints(data.complaints);
      setReviews(data.reviews);
      setAuditLogs(data.auditLogs);
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Failed to load central admin data.'
            : 'تعذر تحميل بيانات الإدارة المركزية.',
      });
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, isAdmin, lang]);

  React.useEffect(() => {
    if (!firebaseUser || !isAdmin) return;
    setLoading(true);
    let initialLoaded = false;
    const markReady = () => {
      if (!initialLoaded) {
        initialLoaded = true;
        setLoading(false);
      }
    };
    const unsubscribe = subscribeAdminDashboardData({
      onDoctors: (data) => {
        setDoctors(data);
        markReady();
      },
      onClinics: (data) => {
        setClinics(data);
        markReady();
      },
      onUsers: (data) => {
        setUsers(data);
        markReady();
      },
      onAppointments: (data) => {
        setAppointments(data);
        markReady();
      },
      onComplaints: (data) => {
        setComplaints(data);
        markReady();
      },
      onReviews: (data) => {
        setReviews(data);
        markReady();
      },
      onAuditLogs: (data) => {
        setAuditLogs(data);
        markReady();
      },
    });
    return () => unsubscribe();
  }, [firebaseUser, isAdmin]);

  if (!firebaseUser || !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.admin.restrictedTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t.admin.restrictedDesc}</p>
        </div>
      </div>
    );
  }

  const adminName =
    userProfile?.displayName ||
    firebaseUser.displayName ||
    (lang === 'en' ? 'Platform Admin' : 'مدير المنصة');

  const handleApproveDoctorDirect = async (docItem: DoctorProfile) => {
    try {
      await adminReviewDoctor(
        firebaseUser.uid,
        adminName,
        docItem,
        'approved',
        'تم التحقق من التراخيص والمستندات المهنية'
      );
      await loadAdminData();
      await onRefreshGlobal();
      setFeedback({
        type: 'ok',
        text:
          lang === 'en'
            ? `Doctor ${docItem.fullName} approved and published in directory.`
            : `تم اعتماد الطبيب ${docItem.fullName} ونشر ملفه في البحث.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Approval failed.'
            : 'فشل الاعتماد.',
      });
    }
  };

  const handleApproveClinicDirect = async (clinicItem: ClinicCenter) => {
    try {
      await adminReviewClinic(
        firebaseUser.uid,
        adminName,
        clinicItem,
        'approved',
        'تم التحقق من الترخيص الصحي للمنشأة'
      );
      await loadAdminData();
      await onRefreshGlobal();
      setFeedback({
        type: 'ok',
        text:
          lang === 'en'
            ? `${clinicItem.name} approved and published in directory.`
            : `تم اعتماد ${clinicItem.name} ونشره في الدليل.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Approval failed.'
            : 'فشل الاعتماد.',
      });
    }
  };

  const handleSubmitReasonDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonModal) return;
    setSubmittingDecision(true);
    try {
      if (reasonModal.kind === 'doctor') {
        const target = doctors.find((d) => d.uid === reasonModal.targetId);
        if (target) {
          await adminReviewDoctor(
            firebaseUser.uid,
            adminName,
            target,
            reasonModal.decision as ApprovalStatus,
            reasonText
          );
        }
      } else if (reasonModal.kind === 'clinic') {
        const target = clinics.find((c) => c.id === reasonModal.targetId);
        if (target) {
          await adminReviewClinic(
            firebaseUser.uid,
            adminName,
            target,
            reasonModal.decision as ApprovalStatus,
            reasonText
          );
        }
      } else if (reasonModal.kind === 'user') {
        const target = users.find((u) => u.uid === reasonModal.targetId);
        if (target) {
          await adminUpdateUserStatus(
            firebaseUser.uid,
            adminName,
            target,
            reasonModal.decision as 'active' | 'suspended',
            reasonText
          );
        }
      } else if (reasonModal.kind === 'complaint') {
        await adminResolveComplaint(
          firebaseUser.uid,
          adminName,
          reasonModal.targetId,
          reasonModal.decision as ComplaintStatus,
          reasonText
        );
      }
      setReasonModal(null);
      setReasonText('');
      await loadAdminData();
      await onRefreshGlobal();
      setFeedback({
        type: 'ok',
        text:
          lang === 'en'
            ? 'Administrative decision executed and logged in audit trail.'
            : 'تم تنفيذ الإجراء الإداري وتوثيقه في سجل التدقيق.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not execute administrative decision.'
            : 'تعذر تنفيذ القرار الإداري.',
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  const pendingDoctorsCount = doctors.filter((d) => d.approvalStatus === 'pending').length;
  const approvedDoctorsCount = doctors.filter((d) => d.approvalStatus === 'approved').length;
  const pendingClinicsCount = clinics.filter((c) => c.approvalStatus === 'pending').length;
  const approvedClinicsCount = clinics.filter((c) => c.approvalStatus === 'approved').length;
  const activePatientsCount = users.filter(
    (u) => u.role === 'patient' && u.accountStatus === 'active'
  ).length;
  const openComplaintsCount = complaints.filter(
    (c) => c.status === 'open' || c.status === 'investigating'
  ).length;

  const stateChartData = React.useMemo(() => {
    const countsMap = new Map<
      string,
      { rawState: string; state: string; doctors: number; clinics: number; appointments: number }
    >();
    const ensure = (st: string) => {
      const key = st || t.common.notSpecified;
      if (!countsMap.has(key)) {
        countsMap.set(key, {
          rawState: key,
          state: translateState(key, lang),
          doctors: 0,
          clinics: 0,
          appointments: 0,
        });
      }
      return countsMap.get(key)!;
    };
    doctors.forEach((d) => {
      ensure(d.state).doctors += 1;
    });
    clinics.forEach((c) => {
      ensure(c.state).clinics += 1;
    });
    appointments.forEach((a) => {
      ensure(a.state).appointments += 1;
    });
    return Array.from(countsMap.values()).sort(
      (a, b) => b.doctors + b.clinics + b.appointments - (a.doctors + a.clinics + a.appointments)
    );
  }, [doctors, clinics, appointments, lang, t.common.notSpecified]);

  const approvalPieData = React.useMemo(() => {
    const approved = approvedDoctorsCount + approvedClinicsCount;
    const pending = pendingDoctorsCount + pendingClinicsCount;
    const rejectedOrSuspended =
      doctors.filter((d) => d.approvalStatus === 'rejected' || d.approvalStatus === 'suspended')
        .length +
      clinics.filter((c) => c.approvalStatus === 'rejected' || c.approvalStatus === 'suspended')
        .length;

    return [
      { name: t.admin.pieApproved, value: approved, color: '#16A34A' },
      { name: t.admin.piePending, value: pending, color: '#D97706' },
      { name: t.admin.pieRejectedSuspended, value: rejectedOrSuspended, color: '#DC2626' },
    ].filter((item) => item.value > 0);
  }, [
    doctors,
    clinics,
    approvedDoctorsCount,
    approvedClinicsCount,
    pendingDoctorsCount,
    pendingClinicsCount,
    t.admin.pieApproved,
    t.admin.piePending,
    t.admin.pieRejectedSuspended,
  ]);

  const platformCompositionData = React.useMemo(
    () => [
      { category: t.admin.compPatients, count: activePatientsCount },
      { category: t.admin.compDoctors, count: doctors.length },
      { category: t.admin.compClinics, count: clinics.length },
      { category: t.admin.compBookings, count: appointments.length },
    ],
    [
      activePatientsCount,
      doctors.length,
      clinics.length,
      appointments.length,
      t.admin.compPatients,
      t.admin.compDoctors,
      t.admin.compClinics,
      t.admin.compBookings,
    ]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t.admin.dashboardTitle}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t.admin.dashboardDesc}
          </p>
        </div>
      </div>

      {/* Live Summary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.kpiDoctors}</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {doctors.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            {approvedDoctorsCount} {t.admin.approvedWord} · {pendingDoctorsCount}{' '}
            {t.admin.pendingWord}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.kpiClinics}</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {clinics.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            {approvedClinicsCount} {t.admin.approvedWord} · {pendingClinicsCount}{' '}
            {t.admin.pendingWord}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.kpiActivePatients}</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-teal-800 dark:text-teal-300 mt-1">
            {activePatientsCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            {users.length} {t.admin.totalAccountsSuffix}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.kpiTotalBookings}</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {appointments.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {t.admin.acrossAllStates}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.admin.kpiOpenComplaints}</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-red-700 dark:text-red-400 mt-1">
            {openComplaintsCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            {pendingDoctorsCount + pendingClinicsCount} {t.admin.pendingApprovalsSuffix}
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center justify-between gap-3 ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setSubTab('overview')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md cursor-pointer ${
            subTab === 'overview'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{t.admin.tabOverview}</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('approvals')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md cursor-pointer ${
            subTab === 'approvals'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <FileSearch className="w-3.5 h-3.5" />
          <span>
            {t.admin.tabApprovals} ({pendingDoctorsCount + pendingClinicsCount} {t.admin.pendingWord})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('users')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md cursor-pointer ${
            subTab === 'users'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>
            {t.admin.tabUsers} ({users.length})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('complaints_reviews')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md cursor-pointer ${
            subTab === 'complaints_reviews'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <MessageSquareWarning className="w-3.5 h-3.5" />
          <span>
            {t.admin.tabComplaintsReviews} ({complaints.length})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('audit')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md cursor-pointer ${
            subTab === 'audit'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>
            {t.admin.tabAudit} ({auditLogs.length})
          </span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-sm text-slate-500 dark:text-slate-400">
          {t.admin.loadingData}
        </div>
      ) : (
        <>
          {subTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Chart 1: Doctors & Clinics & Appointments by Sudan State */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                        {t.admin.stateChartTitle}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.admin.stateChartDesc}
                      </p>
                    </div>
                  </div>
                  {stateChartData.length === 0 ? (
                    <div className="h-72 flex flex-col items-center justify-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg px-4 text-center">
                      <p>{t.admin.noStateChartData}</p>
                    </div>
                  ) : (
                    <div className="h-72 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stateChartData}
                          margin={{ top: 10, right: 16, left: 0, bottom: 10 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? '#334155' : '#E2E8F0'}
                          />
                          <XAxis
                            dataKey="state"
                            tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                              borderColor: isDark ? '#334155' : '#E2E8F0',
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              borderRadius: '8px',
                              fontSize: '12px',
                              textAlign: dir === 'rtl' ? 'right' : 'left',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar
                            dataKey="doctors"
                            name={t.admin.chartDoctors}
                            fill="#0F766E"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="clinics"
                            name={t.admin.chartClinics}
                            fill="#0284C7"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="appointments"
                            name={t.admin.chartBookings}
                            fill="#D97706"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Chart 2: Approval Status PieChart */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      {t.admin.approvalPieTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.admin.approvalPieDesc}
                    </p>
                  </div>
                  {approvalPieData.length === 0 ? (
                    <div className="h-72 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                      {t.admin.noApprovalPieData}
                    </div>
                  ) : (
                    <div className="h-72 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={approvalPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="46%"
                            innerRadius={52}
                            outerRadius={86}
                            paddingAngle={3}
                          >
                            {approvalPieData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                              borderColor: isDark ? '#334155' : '#E2E8F0',
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              borderRadius: '8px',
                              fontSize: '12px',
                              textAlign: dir === 'rtl' ? 'right' : 'left',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Chart 3 + Tabular State Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      {t.admin.compositionTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.admin.compositionDesc}
                    </p>
                  </div>
                  <div className="h-64 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={platformCompositionData}
                        margin={{ top: 10, right: 16, left: 0, bottom: 10 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={isDark ? '#334155' : '#E2E8F0'}
                        />
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                            borderColor: isDark ? '#334155' : '#E2E8F0',
                            color: isDark ? '#F1F5F9' : '#0F172A',
                            borderRadius: '8px',
                            fontSize: '12px',
                            textAlign: dir === 'rtl' ? 'right' : 'left',
                          }}
                        />
                        <Bar
                          dataKey="count"
                          name={t.admin.chartCount}
                          fill="#0F766E"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t.admin.stateTableTitle}
                    </h3>
                  </div>
                  {stateChartData.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      {t.admin.noDataAvailable}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="py-2.5 px-4 font-semibold text-start">{t.admin.colState}</th>
                            <th className="py-2.5 px-4 font-semibold text-start">{t.admin.colDoctors}</th>
                            <th className="py-2.5 px-4 font-semibold text-start">{t.admin.colClinics}</th>
                            <th className="py-2.5 px-4 font-semibold text-start">{t.admin.colBookings}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                          {stateChartData.map((row) => (
                            <tr key={row.rawState} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 dark:text-slate-100">
                                {row.state}
                              </td>
                              <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                                {row.doctors}
                              </td>
                              <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                                {row.clinics}
                              </td>
                              <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                                {row.appointments}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {subTab === 'approvals' && (
            <div className="space-y-8">
              {/* Doctors Queue */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {t.admin.doctorsQueueTitle} ({doctors.length})
                  </h3>
                </div>
                {doctors.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t.admin.noDoctorsRegistered}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-start">{t.admin.colDoctorSpecialty}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.admin.colLicenseQual}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.admin.colStateFee}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.admin.colStatus}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.admin.colDecision}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {doctors.map((d) => (
                          <tr key={d.uid}>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900 dark:text-slate-100">{d.fullName}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {translateSpecialty(d.specialty, lang)}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                              <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {d.licenseNumber}
                              </p>
                              <p className="truncate">{d.qualifications}</p>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                              <p>
                                {translateState(d.state, lang)} ·{' '}
                                {translateLocality(d.locality, lang)}
                              </p>
                              <p className="font-mono tabular-nums">
                                {formatSdg(d.consultationFeeSdg, lang)}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold">
                              <span
                                className={
                                  d.approvalStatus === 'approved'
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : d.approvalStatus === 'pending'
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-red-700 dark:text-red-400'
                                }
                              >
                                {getApprovalLabel(d.approvalStatus, lang)}
                              </span>
                              {d.reviewReason && (
                                <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 max-w-[180px] truncate">
                                  {d.reviewReason}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {d.approvalStatus !== 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveDoctorDirect(d)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{t.admin.approveBtn}</span>
                                  </button>
                                )}
                                {d.approvalStatus === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReasonModal({
                                        kind: 'doctor',
                                        targetId: d.uid,
                                        title:
                                          lang === 'en'
                                            ? `Reject application: ${d.fullName}`
                                            : `رفض طلب د. ${d.fullName}`,
                                        decision: 'rejected',
                                        requireReason: true,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-md cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>{t.admin.rejectBtn}</span>
                                  </button>
                                )}
                                {d.approvalStatus === 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReasonModal({
                                        kind: 'doctor',
                                        targetId: d.uid,
                                        title:
                                          lang === 'en'
                                            ? `Suspend doctor: ${d.fullName}`
                                            : `تعليق حساب د. ${d.fullName}`,
                                        decision: 'suspended',
                                        requireReason: true,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-md cursor-pointer"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>{t.admin.suspendBtn}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Clinics Queue */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    {t.admin.clinicsQueueTitle} ({clinics.length})
                  </h3>
                </div>
                {clinics.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t.admin.noClinicsRegistered}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-start">{t.admin.colCenterType}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.admin.colHealthLicense}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.admin.colStateLocality}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.admin.colStatus}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.admin.colDecision}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {clinics.map((c) => (
                          <tr key={c.id}>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900 dark:text-slate-100">{c.name}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {getCenterTypeLabel(c.centerType, lang)}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-800 dark:text-slate-200">
                              {c.licenseNumber}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                              {translateState(c.state, lang)} · {translateLocality(c.locality, lang)}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold">
                              <span
                                className={
                                  c.approvalStatus === 'approved'
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : c.approvalStatus === 'pending'
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-red-700 dark:text-red-400'
                                }
                              >
                                {getApprovalLabel(c.approvalStatus, lang)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {c.approvalStatus !== 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveClinicDirect(c)}
                                    className="px-2.5 py-1.5 bg-emerald-700 text-white rounded-md cursor-pointer"
                                  >
                                    {t.admin.approveBtn}
                                  </button>
                                )}
                                {c.approvalStatus === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReasonModal({
                                        kind: 'clinic',
                                        targetId: c.id,
                                        title:
                                          lang === 'en'
                                            ? `Reject registration: ${c.name}`
                                            : `رفض تسجيل ${c.name}`,
                                        decision: 'rejected',
                                        requireReason: true,
                                      })
                                    }
                                    className="px-2.5 py-1.5 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md cursor-pointer"
                                  >
                                    {t.admin.rejectBtn}
                                  </button>
                                )}
                                {c.approvalStatus === 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReasonModal({
                                        kind: 'clinic',
                                        targetId: c.id,
                                        title:
                                          lang === 'en'
                                            ? `Suspend center: ${c.name}`
                                            : `تعليق مركز ${c.name}`,
                                        decision: 'suspended',
                                        requireReason: true,
                                      })
                                    }
                                    className="px-2.5 py-1.5 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md cursor-pointer"
                                  >
                                    {t.admin.suspendBtn}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {subTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.admin.usersTitle} ({users.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-start">{t.admin.colUser}</th>
                      <th className="py-3 px-4 font-semibold text-start">{t.admin.colEmail}</th>
                      <th className="py-3 px-4 font-semibold text-start">{t.admin.colRole}</th>
                      <th className="py-3 px-4 font-semibold text-start">{t.admin.colStatus}</th>
                      <th className="py-3 px-4 font-semibold text-start">{t.admin.colAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.uid}>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {u.displayName}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                          {u.email}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                          {getRoleLabel(u.role, lang)}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold">
                          <span
                            className={
                              u.accountStatus === 'active'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-700 dark:text-red-400'
                            }
                          >
                            {u.accountStatus === 'active'
                              ? t.admin.activeUser
                              : t.admin.suspendedUser}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {u.uid !== firebaseUser.uid && (
                            <button
                              type="button"
                              onClick={() =>
                                setReasonModal({
                                  kind: 'user',
                                  targetId: u.uid,
                                  title:
                                    u.accountStatus === 'active'
                                      ? lang === 'en'
                                        ? `Suspend account: ${u.displayName}`
                                        : `تعليق حساب ${u.displayName}`
                                      : lang === 'en'
                                      ? `Reactivate account: ${u.displayName}`
                                      : `إعادة تفعيل حساب ${u.displayName}`,
                                  decision: u.accountStatus === 'active' ? 'suspended' : 'active',
                                  requireReason: u.accountStatus === 'active',
                                })
                              }
                              className="px-3 py-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                            >
                              {u.accountStatus === 'active'
                                ? t.admin.suspendAccountBtn
                                : t.admin.reactivateAccountBtn}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {subTab === 'complaints_reviews' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {t.admin.complaintsTitle} ({complaints.length})
                  </h3>
                </div>
                {complaints.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t.admin.noComplaints}
                  </div>
                ) : (
                  complaints.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {c.subject} ·{' '}
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                            {c.reporterName}
                          </span>
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{c.description}</p>
                        <p className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                          {t.admin.statusPrefix} {c.status}
                          {c.adminResolution
                            ? ` — ${t.admin.resolutionPrefix} ${c.adminResolution}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.status !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() =>
                              setReasonModal({
                                kind: 'complaint',
                                targetId: c.id,
                                title:
                                  lang === 'en'
                                    ? `Resolve complaint: ${c.subject}`
                                    : `معالجة شكوى: ${c.subject}`,
                                decision: 'resolved',
                                requireReason: true,
                              })
                            }
                            className="px-3 py-1.5 bg-teal-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            {t.admin.resolveComplaintBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {t.admin.reviewsTitle} ({reviews.length})
                  </h3>
                </div>
                {reviews.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t.admin.noReviews}
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {rev.patientName} · <span className="font-mono">{rev.rating}/5</span>
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                          {rev.comment || t.admin.noComment}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await adminToggleReviewVisibility(
                            firebaseUser.uid,
                            adminName,
                            rev.id,
                            rev.status === 'published' ? 'hidden' : 'published'
                          );
                          await loadAdminData();
                          await onRefreshGlobal();
                        }}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        {rev.status === 'published'
                          ? t.admin.hideReviewBtn
                          : t.admin.republishReviewBtn}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {subTab === 'audit' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.admin.auditTitle}
                </h3>
              </div>
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t.admin.noAuditLogs}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-start">{t.admin.colActorRole}</th>
                        <th className="py-3 px-4 font-semibold text-start">{t.admin.colOperation}</th>
                        <th className="py-3 px-4 font-semibold text-start">{t.admin.colTarget}</th>
                        <th className="py-3 px-4 font-semibold text-start">{t.admin.colDetails}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {log.actorName}{' '}
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                              ({getRoleLabel(log.actorRole, lang)})
                            </span>
                          </td>
                          <td className="py-3 px-4 text-teal-800 dark:text-teal-300 font-semibold">
                            {log.action}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {log.targetCollection}/{log.targetId}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Decision Reason Modal */}
      {reasonModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSubmitReasonDecision}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {reasonModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                className="p-1 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.admin.reasonLabel}
              </label>
              <textarea
                rows={3}
                required={reasonModal.requireReason}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder={t.admin.reasonPlaceholder}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={submittingDecision}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-teal-700 text-white rounded-lg cursor-pointer disabled:opacity-50"
              >
                {submittingDecision ? t.common.submitting : t.admin.confirmDecisionBtn}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
