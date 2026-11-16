import React from 'react';
import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  QrCode,
  ShieldAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { QRScannerModal } from './QRCodeModals';
import { TodayTasksSection } from './TodayTasksSection';
import type { User } from 'firebase/auth';
import {
  SUDAN_STATES,
  formatCheckInTime,
  formatSdg,
  getApprovalLabel,
  getAppointmentStatusLabel,
  getCenterTypeLabel,
  translateLocality,
  translateSpecialty,
  translateState,
  translateTimeSlot,
} from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import {
  addClinicStaffMember,
  checkInAppointmentByProvider,
  fetchAppointmentsByClinicOwner,
  fetchClinicStaff,
  fetchMyClinics,
  saveClinicCenter,
  subscribeClinicOwnerAppointments,
  toggleClinicStaffStatus,
  updateAppointmentStatus,
} from '../lib/firestoreService';
import { useIsDarkMode } from '../lib/useIsDarkMode';
import type {
  Appointment,
  AppointmentStatus,
  BookedSlot,
  CenterType,
  ClinicCenter,
  ClinicStaffMember,
  DoctorProfile,
  StaffRole,
  UserProfile,
} from '../types/medical';

interface ClinicPortalProps {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  approvedDoctors: DoctorProfile[];
  bookedSlots: BookedSlot[];
  isAdmin: boolean;
  onSignIn: () => void;
  onRefreshGlobal: () => Promise<void>;
}

type ClinicSubTab = 'center' | 'today_tasks' | 'staff' | 'appointments';

const STAFF_PERMISSION_IDS = [
  'appointments_manage',
  'reception',
  'services_edit',
  'reports_view',
] as const;

export const ClinicPortal: React.FC<ClinicPortalProps> = ({
  firebaseUser,
  userProfile,
  approvedDoctors,
  bookedSlots,
  isAdmin,
  onSignIn,
  onRefreshGlobal,
}) => {
  const { lang, dir, t } = useI18n();
  const isDark = useIsDarkMode();
  const [subTab, setSubTab] = React.useState<ClinicSubTab>('center');
  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = React.useState<number>(() =>
    new Date().getFullYear()
  );
  const [myClinics, setMyClinics] = React.useState<ClinicCenter[]>([]);
  const [selectedClinicId, setSelectedClinicId] = React.useState<string>('');
  const [staffList, setStaffList] = React.useState<ClinicStaffMember[]>([]);
  const [clinicAppointments, setClinicAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showQrScanner, setShowQrScanner] = React.useState(false);

  // Clinic Registration/Edit Form
  const [creatingNew, setCreatingNew] = React.useState(false);
  const [name, setName] = React.useState('');
  const [centerType, setCenterType] = React.useState<CenterType>('clinic');
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [state, setState] = React.useState(SUDAN_STATES[0].name);
  const [locality, setLocality] = React.useState(SUDAN_STATES[0].localities[0]);
  const [area, setArea] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [servicesText, setServicesText] = React.useState('الكشف الطبي العام، التحاليل المعملية');
  const [workingHours, setWorkingHours] = React.useState('08:30 صباحاً - 09:00 مساءً');
  const [savingClinic, setSavingClinic] = React.useState(false);

  // Staff / Doctor Addition Form
  const [staffRole, setStaffRole] = React.useState<StaffRole>('doctor');
  const [staffFullName, setStaffFullName] = React.useState('');
  const [selectedApprovedDocId, setSelectedApprovedDocId] = React.useState('');
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([
    'appointments_manage',
  ]);
  const [addingStaff, setAddingStaff] = React.useState(false);

  const activeClinic = React.useMemo(
    () => myClinics.find((c) => c.id === selectedClinicId) || null,
    [myClinics, selectedClinicId]
  );

  const availableLocalities = React.useMemo(
    () => SUDAN_STATES.find((s) => s.name === state)?.localities || [],
    [state]
  );

  const getStaffRoleLabel = (role: StaffRole): string => {
    switch (role) {
      case 'doctor':
        return t.clinic.roleDoctor;
      case 'manager':
        return t.clinic.roleManager;
      case 'receptionist':
        return t.clinic.roleReceptionist;
      case 'nurse':
        return t.clinic.roleNurse;
      default:
        return role;
    }
  };

  const populateClinicForm = (clinic: ClinicCenter | null) => {
    if (!clinic) {
      setName('');
      setCenterType('clinic');
      setLicenseNumber('');
      setState(SUDAN_STATES[0].name);
      setLocality(SUDAN_STATES[0].localities[0]);
      setArea('');
      setAddress('');
      setPhone('');
      setServicesText('الكشف الطبي العام، التحاليل المعملية');
      setWorkingHours('08:30 صباحاً - 09:00 مساءً');
      return;
    }
    setName(clinic.name);
    setCenterType(clinic.centerType);
    setLicenseNumber(clinic.licenseNumber);
    setState(clinic.state);
    setLocality(clinic.locality);
    setArea(clinic.area || '');
    setAddress(clinic.address || '');
    setPhone(clinic.phone || '');
    setServicesText(clinic.services.join('، '));
    setWorkingHours(clinic.workingHours);
  };

  const loadClinicData = React.useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const [clinics, apts] = await Promise.all([
        fetchMyClinics(firebaseUser.uid),
        fetchAppointmentsByClinicOwner(firebaseUser.uid),
      ]);
      setMyClinics(clinics);
      setClinicAppointments(apts);
      if (clinics.length > 0) {
        const targetId =
          selectedClinicId && clinics.some((c) => c.id === selectedClinicId)
            ? selectedClinicId
            : clinics[0].id;
        setSelectedClinicId(targetId);
        const targetClinic = clinics.find((c) => c.id === targetId) || clinics[0];
        if (!creatingNew) populateClinicForm(targetClinic);
        const staff = await fetchClinicStaff(targetId, firebaseUser.uid, isAdmin);
        setStaffList(staff);
      } else {
        setSelectedClinicId('');
        setStaffList([]);
      }
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not load clinic data.'
            : 'تعذر تحميل بيانات العيادة.',
      });
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, selectedClinicId, creatingNew, isAdmin, lang]);

  React.useEffect(() => {
    loadClinicData();
  }, [loadClinicData]);

  React.useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeClinicOwnerAppointments(firebaseUser.uid, (apts) => {
      setClinicAppointments(apts);
    });
    return () => unsub();
  }, [firebaseUser]);

  const isolatedAppointments = React.useMemo(() => {
    if (!activeClinic) return clinicAppointments;
    return clinicAppointments.filter(
      (a) => !a.clinicId || a.clinicId === activeClinic.id
    );
  }, [clinicAppointments, activeClinic]);

  const arrivedPatients = React.useMemo(
    () => isolatedAppointments.filter((a) => a.status === 'arrived'),
    [isolatedAppointments]
  );

  const activeTasksCount = React.useMemo(
    () =>
      isolatedAppointments.filter(
        (a) => a.status === 'pending' || a.status === 'confirmed' || a.status === 'arrived'
      ).length,
    [isolatedAppointments]
  );

  const clinicBookedSlots = React.useMemo(() => {
    const clinicDoctorUids = new Set<string>();
    if (activeClinic) {
      approvedDoctors.forEach((doc) => {
        if (doc.clinicId === activeClinic.id) {
          clinicDoctorUids.add(doc.uid);
        }
      });
    }
    staffList.forEach((member) => {
      if (member.staffRole === 'doctor' && member.doctorId) {
        clinicDoctorUids.add(member.doctorId);
      }
    });
    const clinicAppointmentIds = new Set(isolatedAppointments.map((apt) => apt.id));
    return bookedSlots.filter(
      (slot) =>
        (slot.appointmentId && clinicAppointmentIds.has(slot.appointmentId)) ||
        clinicDoctorUids.has(slot.doctorUid)
    );
  }, [bookedSlots, approvedDoctors, activeClinic, staffList, isolatedAppointments]);

  const availableAnalyticsYears = React.useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    isolatedAppointments.forEach((apt) => {
      if (!apt.appointmentDate) return;
      const y = Number(apt.appointmentDate.slice(0, 4));
      if (!Number.isNaN(y) && y >= 2020) years.add(y);
    });
    clinicBookedSlots.forEach((slot) => {
      if (!slot.appointmentDate) return;
      const y = Number(slot.appointmentDate.slice(0, 4));
      if (!Number.isNaN(y) && y >= 2020) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [isolatedAppointments, clinicBookedSlots]);

  React.useEffect(() => {
    if (!availableAnalyticsYears.includes(selectedAnalyticsYear) && availableAnalyticsYears.length > 0) {
      setSelectedAnalyticsYear(availableAnalyticsYears[0]);
    }
  }, [availableAnalyticsYears, selectedAnalyticsYear]);

  const weeklyBookingsData = React.useMemo(() => {
    interface WeekBucket {
      weekStart: string;
      weekLabel: string;
      booked: number;
      attended: number;
      upcoming: number;
    }
    const buckets = new Map<string, WeekBucket>();

    isolatedAppointments.forEach((apt) => {
      if (apt.status === 'cancelled' || !apt.appointmentDate) return;
      const parts = apt.appointmentDate.split('-').map(Number);
      if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return;
      if (parts[0] !== selectedAnalyticsYear) return;
      const dt = new Date(parts[0], parts[1] - 1, parts[2]);
      if (Number.isNaN(dt.getTime())) return;

      const daysSinceSaturday = (dt.getDay() + 1) % 7;
      const weekStartDate = new Date(dt);
      weekStartDate.setDate(dt.getDate() - daysSinceSaturday);
      const y = weekStartDate.getFullYear();
      const m = String(weekStartDate.getMonth() + 1).padStart(2, '0');
      const d = String(weekStartDate.getDate()).padStart(2, '0');
      const weekKey = `${y}-${m}-${d}`;

      if (!buckets.has(weekKey)) {
        buckets.set(weekKey, {
          weekStart: weekKey,
          weekLabel: `${m}/${d}`,
          booked: 0,
          attended: 0,
          upcoming: 0,
        });
      }
      const row = buckets.get(weekKey)!;
      row.booked += 1;
      if (apt.status === 'completed') {
        row.attended += 1;
      } else if (apt.status !== 'no_show') {
        row.upcoming += 1;
      }
    });

    return Array.from(buckets.values())
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .slice(-12);
  }, [isolatedAppointments, selectedAnalyticsYear]);

  const monthlyBookingsData = React.useMemo(() => {
    const months = t.patient.months.map((label, idx) => ({
      monthIndex: idx,
      month: label,
      booked: 0,
      attended: 0,
      upcoming: 0,
    }));

    isolatedAppointments.forEach((apt) => {
      if (apt.status === 'cancelled' || !apt.appointmentDate) return;
      const parts = apt.appointmentDate.split('-').map(Number);
      if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return;
      if (parts[0] !== selectedAnalyticsYear) return;
      const monthIdx = parts[1] - 1;
      if (monthIdx < 0 || monthIdx > 11) return;

      const row = months[monthIdx];
      row.booked += 1;
      if (apt.status === 'completed') {
        row.attended += 1;
      } else if (apt.status !== 'no_show') {
        row.upcoming += 1;
      }
    });

    return months;
  }, [isolatedAppointments, selectedAnalyticsYear, t.patient.months]);

  const analyticsYearTotalBooked = React.useMemo(
    () => monthlyBookingsData.reduce((sum, m) => sum + m.booked, 0),
    [monthlyBookingsData]
  );

  const busiestWeek = React.useMemo(() => {
    if (weeklyBookingsData.length === 0) return null;
    return weeklyBookingsData.reduce((best, cur) => (cur.booked > best.booked ? cur : best));
  }, [weeklyBookingsData]);

  const busiestMonth = React.useMemo(() => {
    const nonZero = monthlyBookingsData.filter((m) => m.booked > 0);
    if (nonZero.length === 0) return null;
    return nonZero.reduce((best, cur) => (cur.booked > best.booked ? cur : best));
  }, [monthlyBookingsData]);

  const dailyBookedSlotsData = React.useMemo(() => {
    const counts = new Map<string, number>();
    const yearPrefix = `${selectedAnalyticsYear}-`;
    clinicBookedSlots.forEach((slot) => {
      if (!slot.appointmentDate || !slot.appointmentDate.startsWith(yearPrefix)) return;
      counts.set(slot.appointmentDate, (counts.get(slot.appointmentDate) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        dateLabel: date.slice(5),
        count,
      }));
  }, [clinicBookedSlots, selectedAnalyticsYear]);

  const dailySlotsTotal = React.useMemo(
    () => dailyBookedSlotsData.reduce((sum, item) => sum + item.count, 0),
    [dailyBookedSlotsData]
  );

  const peakBookedDay = React.useMemo(() => {
    if (dailyBookedSlotsData.length === 0) return null;
    return dailyBookedSlotsData.reduce((best, cur) => (cur.count > best.count ? cur : best));
  }, [dailyBookedSlotsData]);

  if (!firebaseUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 space-y-4">
          <Building2 className="w-10 h-10 text-teal-700 dark:text-teal-400 mx-auto" />
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t.apps.provider.clinicTrackTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {t.apps.provider.clinicTrackDesc}
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            {t.apps.provider.clinicTrackCtaSignedOut}
          </button>
        </div>
      </div>
    );
  }

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClinic(true);
    setFeedback(null);
    try {
      const savedId = await saveClinicCenter(
        firebaseUser.uid,
        userProfile?.displayName || name,
        userProfile?.role || 'clinic_admin',
        creatingNew ? null : activeClinic?.id || null,
        {
          name,
          centerType,
          licenseNumber,
          state,
          locality,
          area,
          address,
          phone,
          services: servicesText
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter(Boolean),
          workingHours,
        }
      );
      setCreatingNew(false);
      setSelectedClinicId(savedId);
      await loadClinicData();
      await onRefreshGlobal();
      setFeedback({
        type: 'ok',
        text:
          lang === 'en'
            ? 'Medical center details saved. Directory listing activates upon Central Admin approval.'
            : 'تم حفظ بيانات المركز الطبي بنجاح. يتاح النشر في البحث فور اعتماد الإدارة المركزية.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Failed to save center details.'
            : 'تعذر حفظ بيانات المركز.',
      });
    } finally {
      setSavingClinic(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClinic) return;
    setAddingStaff(true);
    setFeedback(null);
    try {
      let resolvedName = staffFullName;
      if (staffRole === 'doctor') {
        const docMatch = approvedDoctors.find((d) => d.uid === selectedApprovedDocId);
        if (!docMatch || docMatch.approvalStatus !== 'approved') {
          setFeedback({
            type: 'err',
            text:
              lang === 'en'
                ? 'A doctor can only be added after Central Administration approval.'
                : 'لا يمكن إضافة طبيب للعيادة إلا بعد التحقق من اعتماده من الإدارة المركزية.',
          });
          setAddingStaff(false);
          return;
        }
        resolvedName = docMatch.fullName;
      }

      await addClinicStaffMember(
        activeClinic.id,
        firebaseUser.uid,
        userProfile?.displayName || (lang === 'en' ? 'Clinic Manager' : 'مدير العيادة'),
        userProfile?.role || 'clinic_admin',
        {
          fullName: resolvedName,
          staffRole,
          doctorId: staffRole === 'doctor' ? selectedApprovedDocId : undefined,
          permissions: selectedPermissions,
        }
      );
      setStaffFullName('');
      setSelectedApprovedDocId('');
      await loadClinicData();
      setFeedback({
        type: 'ok',
        text:
          lang === 'en'
            ? `Added ${resolvedName} to ${activeClinic.name} roster.`
            : `تمت إضافة ${resolvedName} إلى كادر ${activeClinic.name}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not add staff member.'
            : 'تعذر إضافة العضو لكادر العيادة.',
      });
    } finally {
      setAddingStaff(false);
    }
  };

  const handleToggleStaff = async (member: ClinicStaffMember) => {
    if (!activeClinic) return;
    try {
      await toggleClinicStaffStatus(
        activeClinic.id,
        member.uid,
        member.status === 'active' ? 'revoked' : 'active'
      );
      await loadClinicData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not update staff status.'
            : 'تعذر تحديث حالة الموظف.',
      });
    }
  };

  const handleAppointmentUpdate = async (
    apt: Appointment,
    nextStatus: 'confirmed' | 'completed' | 'no_show' | 'cancelled'
  ) => {
    setFeedback(null);
    try {
      await updateAppointmentStatus(
        apt.id,
        firebaseUser.uid,
        activeClinic?.name || (lang === 'en' ? 'Clinic Admin' : 'إدارة العيادة'),
        'clinic_admin',
        nextStatus
      );
      await loadClinicData();
      setFeedback({
        type: 'ok',
        text:
          lang === 'en'
            ? `Appointment status updated to: ${getAppointmentStatusLabel(nextStatus, 'en')}`
            : `تم تحديث حالة الموعد إلى: ${getAppointmentStatusLabel(nextStatus, 'ar')}`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not update appointment status.'
            : 'تعذر تحديث حالة الحجز.',
      });
    }
  };

  const handleQrUpdateStatus = async (appointmentId: string, nextStatus: AppointmentStatus) => {
    if (!firebaseUser) return;
    await updateAppointmentStatus(
      appointmentId,
      firebaseUser.uid,
      userProfile?.displayName || activeClinic?.name || (lang === 'en' ? 'Clinic Admin' : 'إدارة المركز'),
      userProfile?.role || 'clinic_admin',
      nextStatus
    );
    await loadClinicData();
  };

  const handleQrCheckIn = async (appointmentId: string) => {
    if (!firebaseUser) return;
    await checkInAppointmentByProvider(
      appointmentId,
      firebaseUser.uid,
      userProfile?.displayName || activeClinic?.name || (lang === 'en' ? 'Clinic Staff' : 'استقبال المركز'),
      userProfile?.role || 'clinic_admin'
    );
    await loadClinicData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
              {t.clinic.activeCenterLabel}
            </p>
            {myClinics.length > 0 && (
              <select
                value={selectedClinicId}
                onChange={(e) => {
                  const id = e.target.value;
                  setCreatingNew(false);
                  setSelectedClinicId(id);
                  const found = myClinics.find((c) => c.id === id) || null;
                  populateClinicForm(found);
                }}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {myClinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => {
                setCreatingNew(true);
                populateClinicForm(null);
                setSubTab('center');
              }}
              className="w-full py-2 px-3 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg cursor-pointer"
            >
              {t.clinic.registerNewClinicBtn}
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <button
                type="button"
                onClick={() => setSubTab('center')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-start ${
                  subTab === 'center'
                    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{t.clinic.tabCenter}</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('today_tasks')}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-start ${
                  subTab === 'today_tasks'
                    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  <span>{t.clinic.tabTodayTasks}</span>
                </span>
                {activeTasksCount > 0 && (
                  <span className="font-mono tabular-nums text-xs font-bold text-teal-800 dark:text-teal-300">
                    {activeTasksCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSubTab('staff')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-start ${
                  subTab === 'staff'
                    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>
                  {t.clinic.tabStaff} ({staffList.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('appointments')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-start ${
                  subTab === 'appointments'
                    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>
                  {t.clinic.tabAppointments} ({isolatedAppointments.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowQrScanner(true)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>{t.clinic.scanQrBtn}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 space-y-6">
          {activeClinic && !creatingNew && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                activeClinic.approvalStatus === 'approved'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : activeClinic.approvalStatus === 'pending'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
              }`}
            >
              {activeClinic.approvalStatus === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : activeClinic.approvalStatus === 'pending' ? (
                <Clock className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {activeClinic.name} — {getApprovalLabel(activeClinic.approvalStatus, lang)}
                </p>
                <p className="text-xs mt-0.5">
                  {t.clinic.isolationNotice}
                  {activeClinic.reviewReason ? ` (${activeClinic.reviewReason})` : ''}
                </p>
              </div>
            </div>
          )}

          {arrivedPatients.length > 0 && (
            <div className="bg-sky-50 dark:bg-sky-950/50 border border-sky-300 dark:border-sky-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/70 border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-sky-950 dark:text-sky-100">
                    {t.clinic.liveArrivalsAlertTitle}{' '}
                    <span className="font-mono tabular-nums">({arrivedPatients.length})</span>
                  </p>
                  <p className="text-xs text-sky-900 dark:text-sky-200">
                    {t.clinic.liveArrivalsAlertDesc}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {arrivedPatients.map((apt) => {
                      const arrivedTime = formatCheckInTime(apt.checkedInAt, lang);
                      return (
                        <span
                          key={apt.id}
                          className="text-xs font-semibold bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 px-2.5 py-1 rounded-md"
                        >
                          {apt.patientName} · {apt.doctorName}
                          {arrivedTime ? ` · ${t.clinic.arrivedAtPrefix} ${arrivedTime}` : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              {subTab !== 'today_tasks' && (
                <button
                  type="button"
                  onClick={() => setSubTab('today_tasks')}
                  className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-center"
                >
                  {t.clinic.openTodayTasksBtn}
                </button>
              )}
            </div>
          )}

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

          {subTab === 'center' && (
            <form
              onSubmit={handleSaveClinic}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
            >
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  {creatingNew || !activeClinic
                    ? t.clinic.newCenterTitle
                    : t.clinic.editCenterTitle}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {t.clinic.centerFormDesc}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clinic.centerNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clinic.centerTypeLabel}
                  </label>
                  <select
                    value={centerType}
                    onChange={(e) => setCenterType(e.target.value as CenterType)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="clinic">{getCenterTypeLabel('clinic', lang)}</option>
                    <option value="medical_center">
                      {getCenterTypeLabel('medical_center', lang)}
                    </option>
                    <option value="hospital">{getCenterTypeLabel('hospital', lang)}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clinic.licenseLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="SD-KRT-MC-..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clinic.phoneLabel}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+249..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clinic.workingHoursLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clinic.stateLabel}
                  </label>
                  <select
                    value={state}
                    onChange={(e) => {
                      const next = e.target.value;
                      setState(next);
                      const locs = SUDAN_STATES.find((s) => s.name === next)?.localities || [];
                      setLocality(locs[0] || '');
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {SUDAN_STATES.map((s) => (
                      <option key={s.name} value={s.name}>
                        {translateState(s.name, lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clinic.localityLabel}
                  </label>
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {availableLocalities.map((loc) => (
                      <option key={loc} value={loc}>
                        {translateLocality(loc, lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clinic.areaLabel}
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.clinic.addressLabel}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.clinic.servicesLabel}
                </label>
                <input
                  type="text"
                  required
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3">
                {creatingNew && myClinics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCreatingNew(false);
                      populateClinicForm(activeClinic);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingClinic}
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {savingClinic
                    ? t.common.saving
                    : creatingNew || !activeClinic
                    ? t.clinic.submitCenterBtn
                    : t.clinic.saveCenterBtn}
                </button>
              </div>
            </form>
          )}

          {subTab === 'staff' && (
            <section className="space-y-6">
              {!activeClinic ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-sm text-slate-600 dark:text-slate-300">
                  {t.clinic.registerClinicFirst}
                </div>
              ) : (
                <>
                  <form
                    onSubmit={handleAddStaff}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
                  >
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      {t.clinic.addStaffTitle} {activeClinic.name}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.clinic.staffRoleLabel}
                        </label>
                        <select
                          value={staffRole}
                          onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="doctor">{t.clinic.roleDoctor}</option>
                          <option value="manager">{t.clinic.roleManager}</option>
                          <option value="receptionist">{t.clinic.roleReceptionist}</option>
                          <option value="nurse">{t.clinic.roleNurse}</option>
                        </select>
                      </div>

                      {staffRole === 'doctor' ? (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {t.clinic.selectApprovedDocLabel}
                          </label>
                          <select
                            required
                            value={selectedApprovedDocId}
                            onChange={(e) => setSelectedApprovedDocId(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          >
                            <option value="">{t.clinic.selectApprovedDocOption}</option>
                            {approvedDoctors.map((d) => (
                              <option key={d.uid} value={d.uid}>
                                {d.fullName} — {translateSpecialty(d.specialty, lang)} (
                                {translateState(d.state, lang)})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {t.clinic.staffNameLabel}
                          </label>
                          <input
                            type="text"
                            required
                            value={staffFullName}
                            onChange={(e) => setStaffFullName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {t.clinic.permissionsLabel}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {STAFF_PERMISSION_IDS.map((permId) => {
                          const checked = selectedPermissions.includes(permId);
                          return (
                            <button
                              key={permId}
                              type="button"
                              onClick={() =>
                                setSelectedPermissions((prev) =>
                                  checked
                                    ? prev.filter((p) => p !== permId)
                                    : [...prev, permId]
                                )
                              }
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                                checked
                                  ? 'bg-teal-700 text-white border-teal-700'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {t.clinic.permissions[permId] || permId}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addingStaff}
                        className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        {addingStaff ? t.clinic.addingStaff : t.clinic.addStaffBtn}
                      </button>
                    </div>
                  </form>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t.clinic.staffListTitle} ({staffList.length})
                      </h4>
                    </div>
                    {staffList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        {t.clinic.noStaffYet}
                      </div>
                    ) : (
                      staffList.map((member) => (
                        <div
                          key={member.uid}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {member.fullName}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {t.clinic.rolePrefix} {getStaffRoleLabel(member.staffRole)} ·{' '}
                              {t.clinic.permissionsPrefix}{' '}
                              {member.permissions
                                .map((p) => t.clinic.permissions[p] || p)
                                .join(lang === 'ar' ? '، ' : ', ')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleStaff(member)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                              member.status === 'active'
                                ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                                : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800'
                            }`}
                          >
                            {member.status === 'active'
                              ? t.clinic.activeRevokeBtn
                              : t.clinic.revokedRestoreBtn}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {subTab === 'today_tasks' && (
            <TodayTasksSection
              mode="clinic"
              appointments={isolatedAppointments}
              loading={loading}
              onUpdateStatus={handleAppointmentUpdate}
            />
          )}

          {subTab === 'appointments' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t.clinic.appointmentsTitle}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t.clinic.appointmentsDescPrefix}{' '}
                    {activeClinic?.name || t.common.privateClinic} (
                    {getCenterTypeLabel(activeClinic?.centerType || 'clinic', lang)}).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowQrScanner(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{t.clinic.scanQrBtn}</span>
                  </button>
                  <label
                    htmlFor="clinic-analytics-year"
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {t.clinic.yearLabel}
                  </label>
                  <select
                    id="clinic-analytics-year"
                    value={selectedAnalyticsYear}
                    onChange={(e) => setSelectedAnalyticsYear(Number(e.target.value))}
                    className="px-3 py-1.5 text-xs font-mono font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {availableAnalyticsYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clinic Weekly & Monthly Booking Analytics */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    {t.clinic.analyticsTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.clinic.analyticsDesc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.clinic.totalBookedWord} ({selectedAnalyticsYear})
                    </p>
                    <p className="font-mono tabular-nums text-2xl font-bold text-teal-800 dark:text-teal-300 mt-1">
                      {analyticsYearTotalBooked}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.clinic.busiestWeekLabel}
                    </p>
                    <p className="font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {busiestWeek ? `${busiestWeek.weekStart} (${busiestWeek.booked})` : '—'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.clinic.busiestMonthLabel}
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {busiestMonth ? (
                        <>
                          {busiestMonth.month}{' '}
                          <span className="font-mono tabular-nums text-teal-700 dark:text-teal-300">
                            ({busiestMonth.booked})
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {/* Weekly Clinic Bookings Chart */}
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div>
                      <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t.clinic.weeklyChartTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.clinic.weeklyChartDesc}
                      </p>
                    </div>
                    {weeklyBookingsData.length === 0 ? (
                      <div className="h-60 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 text-center">
                        {t.clinic.noAppointments}
                      </div>
                    ) : (
                      <div className="h-60 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={weeklyBookingsData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 4 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={isDark ? '#334155' : '#E2E8F0'}
                            />
                            <XAxis
                              dataKey="weekLabel"
                              tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                                borderColor: isDark ? '#334155' : '#CBD5E1',
                                color: isDark ? '#F1F5F9' : '#0F172A',
                                borderRadius: '0.5rem',
                                fontSize: '12px',
                                direction: dir,
                                textAlign: dir === 'rtl' ? 'right' : 'left',
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar
                              dataKey="booked"
                              name={t.clinic.chartBooked}
                              fill="#0F766E"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="attended"
                              name={t.clinic.chartAttended}
                              fill="#10B981"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="upcoming"
                              name={t.clinic.chartUpcoming}
                              fill="#D97706"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Monthly Clinic Bookings Chart */}
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div>
                      <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t.clinic.monthlyChartTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.clinic.monthlyChartDesc}
                      </p>
                    </div>
                    <div className="h-60 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyBookingsData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 4 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? '#334155' : '#E2E8F0'}
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#475569' }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                              borderColor: isDark ? '#334155' : '#CBD5E1',
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              borderRadius: '0.5rem',
                              fontSize: '12px',
                              direction: dir,
                              textAlign: dir === 'rtl' ? 'right' : 'left',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar
                            dataKey="booked"
                            name={t.clinic.chartBooked}
                            fill="#0284C7"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="attended"
                            name={t.clinic.chartAttended}
                            fill="#0F766E"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="upcoming"
                            name={t.clinic.chartUpcoming}
                            fill="#D97706"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Daily Clinic Appointments Chart (from bookedSlots) */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                        {t.clinic.dailySlotsChartTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.clinic.dailySlotsChartDesc}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 font-semibold">
                        {t.clinic.dailySlotsTotalLabel}{' '}
                        <span className="font-mono tabular-nums">{dailySlotsTotal}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                        {t.clinic.dailySlotsPeakLabel}{' '}
                        <span className="font-mono tabular-nums">
                          {peakBookedDay ? `${peakBookedDay.date} (${peakBookedDay.count})` : '—'}
                        </span>
                      </span>
                    </div>
                  </div>
                  {dailyBookedSlotsData.length === 0 ? (
                    <div className="h-56 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 text-center">
                      {t.clinic.noDailySlotsData}
                    </div>
                  ) : (
                    <div className="h-60 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dailyBookedSlotsData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 4 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? '#334155' : '#E2E8F0'}
                          />
                          <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                          />
                          <Tooltip
                            labelFormatter={(_label, payload) => {
                              const fullDate = payload?.[0]?.payload?.date;
                              return fullDate || String(_label);
                            }}
                            contentStyle={{
                              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                              borderColor: isDark ? '#334155' : '#CBD5E1',
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              borderRadius: '0.5rem',
                              fontSize: '12px',
                              direction: dir,
                              textAlign: dir === 'rtl' ? 'right' : 'left',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar
                            dataKey="count"
                            name={t.clinic.dailySlotsCountLabel}
                            fill="#0D9488"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-sm text-slate-500 dark:text-slate-400">
                  {t.common.loading}
                </div>
              ) : isolatedAppointments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-slate-600 dark:text-slate-300">
                  {t.clinic.noAppointments}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-start">{t.clinic.colPatient}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.clinic.colDoctor}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.clinic.colAppointment}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.clinic.colFee}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.clinic.colStatus}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.clinic.colAction}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {isolatedAppointments.map((apt) => {
                          const arrivedTime = formatCheckInTime(apt.checkedInAt, lang);
                          return (
                            <tr
                              key={apt.id}
                              className={
                                apt.status === 'arrived'
                                  ? 'bg-sky-50/50 dark:bg-sky-950/30'
                                  : undefined
                              }
                            >
                              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                                {apt.patientName}
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                                {apt.doctorName} · {translateSpecialty(apt.doctorSpecialty, lang)}
                              </td>
                              <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                {apt.appointmentDate} ·{' '}
                                <span className="font-sans">
                                  {translateTimeSlot(apt.timeSlot, lang)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                {formatSdg(apt.feeSdg, lang)}
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                <span
                                  className={
                                    apt.status === 'arrived'
                                      ? 'text-sky-700 dark:text-sky-300 font-bold'
                                      : undefined
                                  }
                                >
                                  {getAppointmentStatusLabel(apt.status, lang)}
                                </span>
                                {apt.status === 'arrived' && arrivedTime && (
                                  <p className="text-[11px] font-normal text-sky-700 dark:text-sky-300 mt-0.5 font-mono tabular-nums">
                                    {t.clinic.arrivedAtPrefix} {arrivedTime}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {(apt.status === 'pending' ||
                                  apt.status === 'confirmed' ||
                                  apt.status === 'arrived') && (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {apt.status === 'pending' && (
                                      <button
                                        type="button"
                                        onClick={() => handleAppointmentUpdate(apt, 'confirmed')}
                                        className="px-2.5 py-1 bg-teal-700 text-white rounded-md cursor-pointer"
                                      >
                                        {t.doctor.confirmBtn}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleAppointmentUpdate(apt, 'completed')}
                                      className="px-2.5 py-1 bg-emerald-700 text-white rounded-md cursor-pointer"
                                    >
                                      {t.doctor.attendedBtn}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAppointmentUpdate(apt, 'no_show')}
                                      className="px-2.5 py-1 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md cursor-pointer"
                                    >
                                      {t.doctor.noShowBtn}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <QRScannerModal
        isOpen={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        appointments={isolatedAppointments}
        onUpdateStatus={handleQrUpdateStatus}
        onCheckInByProvider={handleQrCheckIn}
      />
    </div>
  );
};
