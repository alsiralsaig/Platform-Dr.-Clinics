import React from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  ClipboardPlus,
  Clock,
  FileText,
  MapPin,
  MessageSquareText,
  QrCode,
  ShieldAlert,
  Stethoscope,
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
import { ChatWorkspace, type ChatContactOption } from './ChatWorkspace';
import { QRScannerModal } from './QRCodeModals';
import { TodayTasksSection } from './TodayTasksSection';
import type { User } from 'firebase/auth';
import {
  MEDICAL_SPECIALTIES,
  SUDAN_STATES,
  TIME_SLOTS,
  WORKING_DAYS,
  formatCheckInTime,
  formatSdg,
  getApprovalLabel,
  getAppointmentStatusLabel,
  getRecordTypeLabel,
  translateDay,
  translateLocality,
  translateSpecialty,
  translateState,
  translateTimeSlot,
} from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import {
  checkInAppointmentByProvider,
  createEhrRecord,
  fetchAppointmentsByDoctor,
  fetchAuthorizedPatientsForDoctor,
  fetchDoctorEhrRecords,
  fetchMyDoctorProfile,
  saveDoctorProfile,
  subscribeDoctorAppointments,
  updateAppointmentStatus,
  updateDoctorAvailability,
} from '../lib/firestoreService';
import { useIsDarkMode } from '../lib/useIsDarkMode';
import type {
  Appointment,
  AppointmentStatus,
  BookedSlot,
  ClinicCenter,
  DoctorAvailabilityStatus,
  DoctorProfile,
  EhrRecord,
  EhrRecordType,
  PatientMedicalProfile,
  UserProfile,
} from '../types/medical';

interface DoctorPortalProps {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  approvedClinics: ClinicCenter[];
  bookedSlots: BookedSlot[];
  onSignIn: () => void;
  onRefreshGlobal: () => Promise<void>;
}

type DoctorSubTab = 'profile' | 'today_tasks' | 'bookings' | 'ehr_author' | 'messages';

const JS_DAY_TO_ARABIC = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  firebaseUser,
  userProfile,
  approvedClinics,
  bookedSlots,
  onSignIn,
  onRefreshGlobal,
}) => {
  const { lang, dir, t } = useI18n();
  const isDark = useIsDarkMode();
  const [subTab, setSubTab] = React.useState<DoctorSubTab>('profile');
  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = React.useState<number>(() =>
    new Date().getFullYear()
  );
  const [doctorProfile, setDoctorProfile] = React.useState<DoctorProfile | null>(null);
  const [bookings, setBookings] = React.useState<Appointment[]>([]);
  const [authorizedPatients, setAuthorizedPatients] = React.useState<PatientMedicalProfile[]>([]);
  const [ehrRecords, setEhrRecords] = React.useState<EhrRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [chatInitialPatientUid, setChatInitialPatientUid] = React.useState<string | null>(null);
  const [chatInitialAptRef, setChatInitialAptRef] = React.useState<string>('');
  const [showQrScanner, setShowQrScanner] = React.useState(false);
  const [updatingAvailability, setUpdatingAvailability] = React.useState(false);

  // Doctor Profile Form
  const [fullName, setFullName] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female'>('male');
  const [specialty, setSpecialty] = React.useState(MEDICAL_SPECIALTIES[0]);
  const [qualifications, setQualifications] = React.useState('');
  const [experienceYears, setExperienceYears] = React.useState('5');
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [state, setState] = React.useState(SUDAN_STATES[0].name);
  const [locality, setLocality] = React.useState(SUDAN_STATES[0].localities[0]);
  const [area, setArea] = React.useState('');
  const [workplaceName, setWorkplaceName] = React.useState('');
  const [clinicId, setClinicId] = React.useState('');
  const [feeSdg, setFeeSdg] = React.useState('15000');
  const [servicesText, setServicesText] = React.useState('استشارة طبية عامة، متابعة الحالات المزمنة');
  const [workingDays, setWorkingDays] = React.useState<string[]>(['السبت', 'الأحد', 'الثلاثاء']);
  const [workingHours, setWorkingHours] = React.useState('09:00 صباحاً - 03:00 عصراً');
  const [bio, setBio] = React.useState('');
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Clinical EHR Authoring Form (including NutriCare Nutrition Plan)
  const [selectedPatientUid, setSelectedPatientUid] = React.useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = React.useState('');
  const [recordType, setRecordType] = React.useState<EhrRecordType>('consultation');
  const [ehrTitle, setEhrTitle] = React.useState('');
  const [chiefComplaint, setChiefComplaint] = React.useState('');
  const [diagnosis, setDiagnosis] = React.useState('');
  const [clinicalNotes, setClinicalNotes] = React.useState('');
  const [medicationsText, setMedicationsText] = React.useState('');
  const [systolic, setSystolic] = React.useState('');
  const [diastolic, setDiastolic] = React.useState('');
  const [bloodGlucose, setBloodGlucose] = React.useState('');
  const [dailyCalories, setDailyCalories] = React.useState('');
  const [nutritionGoal, setNutritionGoal] = React.useState('');
  const [mealGuidelines, setMealGuidelines] = React.useState('');
  const [activityPlan, setActivityPlan] = React.useState('');
  const [savingEhr, setSavingEhr] = React.useState(false);

  const availableLocalities = React.useMemo(() => {
    return SUDAN_STATES.find((s) => s.name === state)?.localities || [];
  }, [state]);

  const loadDoctorWorkspace = React.useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const [prof, apts, pts, recs] = await Promise.all([
        fetchMyDoctorProfile(firebaseUser.uid),
        fetchAppointmentsByDoctor(firebaseUser.uid),
        fetchAuthorizedPatientsForDoctor(firebaseUser.uid),
        fetchDoctorEhrRecords(firebaseUser.uid),
      ]);
      setDoctorProfile(prof);
      setBookings(apts);
      setAuthorizedPatients(pts);
      setEhrRecords(recs);

      if (prof) {
        setFullName(prof.fullName);
        setGender(prof.gender);
        setSpecialty(prof.specialty);
        setQualifications(prof.qualifications);
        setExperienceYears(String(prof.experienceYears));
        setLicenseNumber(prof.licenseNumber);
        setState(prof.state);
        setLocality(prof.locality);
        setArea(prof.area || '');
        setWorkplaceName(prof.workplaceName);
        setClinicId(prof.clinicId || '');
        setFeeSdg(String(prof.consultationFeeSdg));
        setServicesText(prof.services.join('، '));
        setWorkingDays(prof.workingDays);
        setWorkingHours(prof.workingHours);
        setBio(prof.bio || '');
      } else if (userProfile) {
        setFullName(userProfile.displayName);
      }
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Failed to load Doctor Portal data.'
            : 'تعذر تحميل بيانات بوابة الطبيب.',
      });
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, userProfile, lang]);

  React.useEffect(() => {
    loadDoctorWorkspace();
  }, [loadDoctorWorkspace]);

  React.useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeDoctorAppointments(firebaseUser.uid, (apts) => {
      setBookings(apts);
    });
    return () => unsub();
  }, [firebaseUser]);

  // Unique patients derived from bookings + authorized patients (kept strictly above early return)
  const patientOptions = React.useMemo(() => {
    const map = new Map<string, { uid: string; name: string }>();
    bookings.forEach((b) => map.set(b.patientUid, { uid: b.patientUid, name: b.patientName }));
    authorizedPatients.forEach((p) => map.set(p.uid, { uid: p.uid, name: p.fullName }));
    return Array.from(map.values());
  }, [bookings, authorizedPatients]);

  const doctorChatContacts = React.useMemo<ChatContactOption[]>(() => {
    const map = new Map<string, ChatContactOption>();
    bookings.forEach((b) => {
      if (!map.has(b.patientUid)) {
        map.set(b.patientUid, {
          uid: b.patientUid,
          name: b.patientName,
          subtitle: `${lang === 'en' ? 'Appt' : 'موعد'} ${b.appointmentDate} · ${getAppointmentStatusLabel(
            b.status,
            lang
          )}`,
          appointmentId: b.id,
          appointmentDate: b.appointmentDate,
        });
      }
    });
    authorizedPatients.forEach((p) => {
      if (!map.has(p.uid)) {
        map.set(p.uid, {
          uid: p.uid,
          name: p.fullName,
          subtitle:
            lang === 'en' ? 'Authorized EHR access' : 'مريض مصرح لملفه الطبي',
        });
      }
    });
    return Array.from(map.values());
  }, [bookings, authorizedPatients, lang]);

  const arrivedPatients = React.useMemo(
    () => bookings.filter((b) => b.status === 'arrived'),
    [bookings]
  );

  const activeTasksCount = React.useMemo(
    () =>
      bookings.filter(
        (b) => b.status === 'pending' || b.status === 'confirmed' || b.status === 'arrived'
      ).length,
    [bookings]
  );

  const weekdayDistributionData = React.useMemo(() => {
    const counts = new Map<
      string,
      { dayKey: string; day: string; attended: number; upcoming: number; noShow: number; total: number }
    >();
    WORKING_DAYS.forEach((day) => {
      counts.set(day, {
        dayKey: day,
        day: translateDay(day, lang),
        attended: 0,
        upcoming: 0,
        noShow: 0,
        total: 0,
      });
    });

    bookings.forEach((apt) => {
      if (apt.status === 'cancelled' || !apt.appointmentDate) return;
      const parts = apt.appointmentDate.split('-').map(Number);
      if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return;
      const dt = new Date(parts[0], parts[1] - 1, parts[2]);
      if (Number.isNaN(dt.getTime())) return;
      const arabicDay = JS_DAY_TO_ARABIC[dt.getDay()];
      const row = counts.get(arabicDay);
      if (!row) return;
      if (apt.status === 'completed') {
        row.attended += 1;
      } else if (apt.status === 'no_show') {
        row.noShow += 1;
      } else {
        row.upcoming += 1;
      }
      row.total += 1;
    });

    return WORKING_DAYS.map((day) => counts.get(day)!);
  }, [bookings, lang]);

  const clinicOccupancyData = React.useMemo(() => {
    interface ClinicBucket {
      clinicName: string;
      dates: Set<string>;
      bookedCount: number;
      attendedCount: number;
      upcomingCount: number;
      noShowCount: number;
    }

    const buckets = new Map<string, ClinicBucket>();

    const ensureBucket = (name: string) => {
      const cleanName = name.trim() || t.common.privateClinic;
      if (!buckets.has(cleanName)) {
        buckets.set(cleanName, {
          clinicName: cleanName,
          dates: new Set<string>(),
          bookedCount: 0,
          attendedCount: 0,
          upcomingCount: 0,
          noShowCount: 0,
        });
      }
      return buckets.get(cleanName)!;
    };

    if (doctorProfile?.workplaceName) {
      ensureBucket(doctorProfile.workplaceName);
    }
    if (doctorProfile?.clinicId) {
      const linked = approvedClinics.find((c) => c.id === doctorProfile.clinicId);
      if (linked) ensureBucket(linked.name);
    }

    bookings.forEach((apt) => {
      if (apt.status === 'cancelled') return;
      const resolvedClinicName =
        apt.clinicName?.trim() || doctorProfile?.workplaceName?.trim() || t.common.privateClinic;
      const bucket = ensureBucket(resolvedClinicName);
      if (apt.appointmentDate) {
        bucket.dates.add(apt.appointmentDate);
      }
      bucket.bookedCount += 1;
      if (apt.status === 'completed') {
        bucket.attendedCount += 1;
      } else if (apt.status === 'no_show') {
        bucket.noShowCount += 1;
      } else {
        bucket.upcomingCount += 1;
      }
    });

    return Array.from(buckets.values()).map((bucket) => {
      const activeDaysCount = Math.max(1, bucket.dates.size);
      const capacity = activeDaysCount * TIME_SLOTS.length;
      const occupancyRate =
        bucket.bookedCount === 0
          ? 0
          : Math.min(100, Math.round((bucket.bookedCount / capacity) * 100));
      return {
        clinicName: bucket.clinicName,
        shortClinicName:
          bucket.clinicName.length > 18
            ? `${bucket.clinicName.slice(0, 17)}…`
            : bucket.clinicName,
        occupancyRate,
        bookedCount: bucket.bookedCount,
        attendedCount: bucket.attendedCount,
        upcomingCount: bucket.upcomingCount,
        noShowCount: bucket.noShowCount,
        capacity,
        activeDaysCount,
      };
    });
  }, [
    bookings,
    doctorProfile?.workplaceName,
    doctorProfile?.clinicId,
    approvedClinics,
    t.common.privateClinic,
  ]);

  const doctorBookedSlots = React.useMemo(() => {
    if (!firebaseUser) return [];
    return bookedSlots.filter((slot) => slot.doctorUid === firebaseUser.uid);
  }, [bookedSlots, firebaseUser]);

  const availableAnalyticsYears = React.useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    bookings.forEach((apt) => {
      if (!apt.appointmentDate) return;
      const y = Number(apt.appointmentDate.slice(0, 4));
      if (!Number.isNaN(y) && y >= 2020) years.add(y);
    });
    doctorBookedSlots.forEach((slot) => {
      if (!slot.appointmentDate) return;
      const y = Number(slot.appointmentDate.slice(0, 4));
      if (!Number.isNaN(y) && y >= 2020) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [bookings, doctorBookedSlots]);

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

    bookings.forEach((apt) => {
      if (apt.status === 'cancelled' || !apt.appointmentDate) return;
      const parts = apt.appointmentDate.split('-').map(Number);
      if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return;
      if (parts[0] !== selectedAnalyticsYear) return;
      const dt = new Date(parts[0], parts[1] - 1, parts[2]);
      if (Number.isNaN(dt.getTime())) return;

      // Sudan workweek starts Saturday (getDay(): 0=Sun..6=Sat)
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
  }, [bookings, selectedAnalyticsYear]);

  const monthlyBookingsData = React.useMemo(() => {
    const months = t.patient.months.map((label, idx) => ({
      monthIndex: idx,
      month: label,
      booked: 0,
      attended: 0,
      upcoming: 0,
    }));

    bookings.forEach((apt) => {
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
  }, [bookings, selectedAnalyticsYear, t.patient.months]);

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
    doctorBookedSlots.forEach((slot) => {
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
  }, [doctorBookedSlots, selectedAnalyticsYear]);

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
          <Stethoscope className="w-10 h-10 text-teal-700 dark:text-teal-400 mx-auto" />
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t.apps.provider.doctorTrackTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {t.apps.provider.doctorTrackDesc}
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            {t.apps.provider.doctorTrackCtaSignedOut}
          </button>
        </div>
      </div>
    );
  }

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveDoctorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback(null);
    try {
      await saveDoctorProfile(
        firebaseUser.uid,
        userProfile?.displayName || fullName,
        userProfile?.role || 'doctor',
        {
          fullName,
          gender,
          specialty,
          qualifications,
          experienceYears: Number(experienceYears) || 0,
          licenseNumber,
          state,
          locality,
          area,
          workplaceName,
          clinicId,
          consultationFeeSdg: Number(feeSdg) || 0,
          services: servicesText
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter(Boolean),
          workingDays: workingDays.length > 0 ? workingDays : ['السبت'],
          workingHours,
          bio,
        }
      );
      await loadDoctorWorkspace();
      await onRefreshGlobal();
      setFeedback({
        type: 'ok',
        text: doctorProfile
          ? lang === 'en'
            ? 'Professional profile updated successfully.'
            : 'تم تحديث ملفك المهني بنجاح.'
          : lang === 'en'
          ? 'Accreditation request submitted and pending review by Central Administration.'
          : 'تم تقديم طلب انضمامك بنجاح وهو الآن بانتظار المراجعة والاعتماد من الإدارة المركزية.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Failed to save professional profile.'
            : 'تعذر حفظ الملف المهني.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAppointmentAction = async (
    apt: Appointment,
    nextStatus: 'confirmed' | 'completed' | 'no_show' | 'cancelled'
  ) => {
    setFeedback(null);
    try {
      await updateAppointmentStatus(
        apt.id,
        firebaseUser.uid,
        doctorProfile?.fullName || userProfile?.displayName || (lang === 'en' ? 'Doctor' : 'طبيب'),
        'doctor',
        nextStatus
      );
      await loadDoctorWorkspace();
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
            ? 'Could not update appointment.'
            : 'تعذر تحديث الموعد.',
      });
    }
  };

  const currentAvailability: DoctorAvailabilityStatus =
    doctorProfile?.availabilityStatus ?? 'available';

  const handleToggleAvailability = async () => {
    if (!firebaseUser || !doctorProfile) return;
    const prevStatus = currentAvailability;
    const nextStatus: DoctorAvailabilityStatus =
      prevStatus === 'available' ? 'busy' : 'available';
    setUpdatingAvailability(true);
    setFeedback(null);
    setDoctorProfile((prev) => (prev ? { ...prev, availabilityStatus: nextStatus } : prev));
    try {
      await updateDoctorAvailability(
        firebaseUser.uid,
        doctorProfile.fullName || userProfile?.displayName || (lang === 'en' ? 'Doctor' : 'طبيب'),
        userProfile?.role || 'doctor',
        nextStatus
      );
      await onRefreshGlobal();
      setFeedback({
        type: 'ok',
        text:
          nextStatus === 'available'
            ? t.doctor.statusAvailable
            : t.doctor.statusBusy,
      });
    } catch (err) {
      setDoctorProfile((prev) => (prev ? { ...prev, availabilityStatus: prevStatus } : prev));
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not update availability status.'
            : 'تعذر تحديث حالة التوفر الفورية.',
      });
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleQrUpdateStatus = async (appointmentId: string, nextStatus: AppointmentStatus) => {
    if (!firebaseUser) return;
    await updateAppointmentStatus(
      appointmentId,
      firebaseUser.uid,
      doctorProfile?.fullName || userProfile?.displayName || (lang === 'en' ? 'Doctor' : 'طبيب'),
      'doctor',
      nextStatus
    );
    await loadDoctorWorkspace();
  };

  const handleQrCheckIn = async (appointmentId: string) => {
    if (!firebaseUser) return;
    await checkInAppointmentByProvider(
      appointmentId,
      firebaseUser.uid,
      doctorProfile?.fullName || userProfile?.displayName || (lang === 'en' ? 'Doctor' : 'طبيب'),
      'doctor'
    );
    await loadDoctorWorkspace();
  };

  const handleCreateEhrRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorProfile || doctorProfile.approvalStatus !== 'approved') {
      setFeedback({
        type: 'err',
        text:
          lang === 'en'
            ? 'Your doctor profile must be approved by Central Administration before authoring clinical records.'
            : 'يجب اعتماد ملف الطبيب من الإدارة المركزية قبل كتابة السجلات الطبية.',
      });
      return;
    }
    const targetPatient = patientOptions.find((p) => p.uid === selectedPatientUid);
    if (!targetPatient) {
      setFeedback({
        type: 'err',
        text: lang === 'en' ? 'Please select a patient first.' : 'يرجى اختيار المريض أولاً.',
      });
      return;
    }

    setSavingEhr(true);
    setFeedback(null);
    try {
      const vitals: Record<string, number> = {};
      if (systolic) vitals.systolic = Number(systolic);
      if (diastolic) vitals.diastolic = Number(diastolic);
      if (bloodGlucose) vitals.bloodGlucose = Number(bloodGlucose);

      const nutritionPlan =
        recordType === 'nutrition_plan' || mealGuidelines || nutritionGoal
          ? {
              ...(dailyCalories ? { dailyCalories: Number(dailyCalories) } : {}),
              goal: nutritionGoal,
              mealGuidelines,
              activityPlan,
            }
          : undefined;

      await createEhrRecord(
        firebaseUser.uid,
        doctorProfile.fullName,
        'doctor',
        {
          patientUid: targetPatient.uid,
          patientName: targetPatient.name,
          doctorUid: firebaseUser.uid,
          doctorName: doctorProfile.fullName,
          clinicId: doctorProfile.clinicId,
          clinicName: doctorProfile.workplaceName,
          appointmentId: selectedAppointmentId,
          recordType,
          title: ehrTitle,
          chiefComplaint,
          diagnosis,
          clinicalNotes,
          medications: medicationsText
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter(Boolean),
          vitals: Object.keys(vitals).length > 0 ? vitals : undefined,
          nutritionPlan,
        }
      );

      setEhrTitle('');
      setChiefComplaint('');
      setDiagnosis('');
      setClinicalNotes('');
      setMedicationsText('');
      setSystolic('');
      setDiastolic('');
      setBloodGlucose('');
      setDailyCalories('');
      setNutritionGoal('');
      setMealGuidelines('');
      setActivityPlan('');
      await loadDoctorWorkspace();
      setFeedback({
        type: 'ok',
        text:
          lang === 'en'
            ? 'Clinical record saved to patient EHR.'
            : 'تم حفظ السجل السريري في الملف الطبي للمريض.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not create EHR record.'
            : 'تعذر إنشاء السجل الطبي.',
      });
    } finally {
      setSavingEhr(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-1">
              {t.doctor.portalLabel}
            </p>
            <button
              type="button"
              onClick={() => setSubTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-start ${
                subTab === 'profile'
                  ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4 shrink-0" />
              <span>{t.doctor.tabProfile}</span>
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
                <span>{t.doctor.tabTodayTasks}</span>
              </span>
              {activeTasksCount > 0 && (
                <span className="font-mono tabular-nums text-xs font-bold text-teal-800 dark:text-teal-300">
                  {activeTasksCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSubTab('bookings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-start ${
                subTab === 'bookings'
                  ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span>
                {t.doctor.tabBookings} ({bookings.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('ehr_author')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-start ${
                subTab === 'ehr_author'
                  ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ClipboardPlus className="w-4 h-4 shrink-0" />
              <span>{t.doctor.tabEhrAuthor}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('messages')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-start ${
                subTab === 'messages'
                  ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquareText className="w-4 h-4 shrink-0" />
              <span>{t.doctor.tabMessages}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQrScanner(true)}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>{t.doctor.scanQrBtn}</span>
            </button>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Approval Gate Status Banner */}
          {doctorProfile && (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                doctorProfile.approvalStatus === 'approved'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : doctorProfile.approvalStatus === 'pending'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {doctorProfile.approvalStatus === 'approved' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : doctorProfile.approvalStatus === 'pending' ? (
                  <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-bold">
                    {t.doctor.approvalStatusPrefix}{' '}
                    {getApprovalLabel(doctorProfile.approvalStatus, lang)}
                  </p>
                  <p className="text-xs mt-0.5">
                    {doctorProfile.approvalStatus === 'approved'
                      ? t.doctor.approvedNotice
                      : doctorProfile.approvalStatus === 'pending'
                      ? t.doctor.pendingNotice
                      : `${t.doctor.rejectedPrefix} ${
                          doctorProfile.reviewReason || t.common.notSpecified
                        }`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Busy / Available Status Toggle */}
          {doctorProfile && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className={`w-3.5 h-3.5 rounded-full mt-1.5 shrink-0 ${
                    currentAvailability === 'available'
                      ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                      : 'bg-rose-500 ring-4 ring-rose-500/20'
                  }`}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t.doctor.availabilityTitle}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        currentAvailability === 'available'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {currentAvailability === 'available'
                        ? t.doctor.statusAvailable
                        : t.doctor.statusBusy}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.doctor.availabilityDesc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={currentAvailability === 'available'}
                disabled={updatingAvailability}
                onClick={handleToggleAvailability}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 ${
                  currentAvailability === 'available'
                    ? 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700'
                }`}
              >
                {currentAvailability === 'available'
                  ? t.doctor.toggleToBusyBtn
                  : t.doctor.toggleToAvailableBtn}
              </button>
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
                    {t.doctor.liveArrivalsAlertTitle}{' '}
                    <span className="font-mono tabular-nums">({arrivedPatients.length})</span>
                  </p>
                  <p className="text-xs text-sky-900 dark:text-sky-200">
                    {t.doctor.liveArrivalsAlertDesc}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {arrivedPatients.map((apt) => {
                      const arrivedTime = formatCheckInTime(apt.checkedInAt, lang);
                      return (
                        <span
                          key={apt.id}
                          className="text-xs font-semibold bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 px-2.5 py-1 rounded-md"
                        >
                          {apt.patientName}
                          {arrivedTime ? ` · ${t.doctor.arrivedAtPrefix} ${arrivedTime}` : ''}
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
                  {t.doctor.openTodayTasksBtn}
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

          {subTab === 'profile' && (
            <form
              onSubmit={handleSaveDoctorProfile}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
            >
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  {doctorProfile ? t.doctor.editProfileTitle : t.doctor.newProfileTitle}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {t.doctor.profileDesc}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.fullNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. ..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.genderLabel}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="male">{t.doctor.male}</option>
                    <option value="female">{t.doctor.female}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.specialtyLabel}
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {MEDICAL_SPECIALTIES.map((sp) => (
                      <option key={sp} value={sp}>
                        {translateSpecialty(sp, lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.licenseLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="SMC-18420"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.expYearsLabel}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={70}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.feeSdgLabel}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={feeSdg}
                    onChange={(e) => setFeeSdg(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.doctor.qualificationsLabel}
                </label>
                <input
                  type="text"
                  required
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.stateLabel}
                  </label>
                  <select
                    value={state}
                    onChange={(e) => {
                      const nextState = e.target.value;
                      setState(nextState);
                      const locs = SUDAN_STATES.find((s) => s.name === nextState)?.localities || [];
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
                    {t.doctor.localityLabel}
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
                    {t.doctor.areaLabel}
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.workplaceLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={workplaceName}
                    onChange={(e) => setWorkplaceName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.linkClinicLabel}
                  </label>
                  <select
                    value={clinicId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClinicId(val);
                      const matched = approvedClinics.find((c) => c.id === val);
                      if (matched) setWorkplaceName(matched.name);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">{t.doctor.independentClinicOption}</option>
                    {approvedClinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({translateState(c.state, lang)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.servicesLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={servicesText}
                    onChange={(e) => setServicesText(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.doctor.workingHoursLabel}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t.doctor.workingDaysLabel}
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORKING_DAYS.map((day) => {
                    const active = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                          active
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {translateDay(day, lang)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.doctor.bioLabel}
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {savingProfile
                    ? t.common.saving
                    : doctorProfile
                    ? t.doctor.saveProfileBtn
                    : t.doctor.submitProfileBtn}
                </button>
              </div>
            </form>
          )}

          {subTab === 'today_tasks' && (
            <TodayTasksSection
              mode="doctor"
              appointments={bookings}
              loading={loading}
              onUpdateStatus={handleAppointmentAction}
              onOpenChatWithPatient={(apt) => {
                setChatInitialPatientUid(apt.patientUid);
                setChatInitialAptRef(
                  lang === 'en'
                    ? `Regarding appointment ${apt.appointmentDate} (${translateTimeSlot(
                        apt.timeSlot,
                        'en'
                      )})`
                    : `بخصوص موعد ${apt.appointmentDate} (${apt.timeSlot})`
                );
                setSubTab('messages');
              }}
              onOpenEhrForAppointment={(apt) => {
                setSelectedPatientUid(apt.patientUid);
                setSelectedAppointmentId(apt.id);
                setSubTab('ehr_author');
              }}
            />
          )}

          {subTab === 'bookings' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t.doctor.bookingsAnalyticsTitle}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t.doctor.bookingsAnalyticsDesc}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label
                    htmlFor="doctor-analytics-year"
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {t.doctor.yearLabel}
                  </label>
                  <select
                    id="doctor-analytics-year"
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

              {/* Weekly & Monthly Booking Summary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.doctor.totalBookedWord} ({selectedAnalyticsYear})
                  </p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-teal-800 dark:text-teal-300 mt-1">
                    {analyticsYearTotalBooked}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.doctor.busiestWeekLabel}
                  </p>
                  <p className="font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {busiestWeek ? `${busiestWeek.weekStart} (${busiestWeek.booked})` : '—'}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.doctor.busiestMonthLabel}
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

              {/* Daily Appointments Chart (from bookedSlots) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      {t.doctor.dailySlotsChartTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.doctor.dailySlotsChartDesc}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 font-semibold">
                      {t.doctor.dailySlotsTotalLabel}{' '}
                      <span className="font-mono tabular-nums">{dailySlotsTotal}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                      {t.doctor.dailySlotsPeakLabel}{' '}
                      <span className="font-mono tabular-nums">
                        {peakBookedDay ? `${peakBookedDay.date} (${peakBookedDay.count})` : '—'}
                      </span>
                    </span>
                  </div>
                </div>
                {dailyBookedSlotsData.length === 0 ? (
                  <div className="h-60 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 text-center">
                    {t.doctor.noDailySlotsData}
                  </div>
                ) : (
                  <div className="h-64 w-full" dir="ltr">
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
                          name={t.doctor.dailySlotsCountLabel}
                          fill="#0D9488"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Weekly & Monthly Bookings Recharts Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Weekly Bookings Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      {t.doctor.weeklyChartTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.doctor.weeklyChartDesc}
                    </p>
                  </div>
                  {weeklyBookingsData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 text-center">
                      {t.doctor.noBookings}
                    </div>
                  ) : (
                    <div className="h-64 w-full" dir="ltr">
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
                            name={t.doctor.chartBooked}
                            fill="#0F766E"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="attended"
                            name={t.doctor.chartAttended}
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="upcoming"
                            name={t.doctor.chartUpcoming}
                            fill="#D97706"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Monthly Bookings Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      {t.doctor.monthlyChartTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.doctor.monthlyChartDesc}
                    </p>
                  </div>
                  <div className="h-64 w-full" dir="ltr">
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
                          name={t.doctor.chartBooked}
                          fill="#0284C7"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="attended"
                          name={t.doctor.chartAttended}
                          fill="#0F766E"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="upcoming"
                          name={t.doctor.chartUpcoming}
                          fill="#D97706"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Existing Recharts Analytics Grid for Weekday & Per-Clinic Occupancy */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Chart 1: Weekday Distribution */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      {t.doctor.weekdayChartTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.doctor.weekdayChartDesc}
                    </p>
                  </div>
                  <div className="h-64 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weekdayDistributionData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={isDark ? '#334155' : '#E2E8F0'}
                        />
                        <XAxis
                          dataKey="day"
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
                          dataKey="attended"
                          name={t.doctor.chartAttended}
                          stackId="a"
                          fill="#0F766E"
                        />
                        <Bar
                          dataKey="upcoming"
                          name={t.doctor.chartUpcoming}
                          stackId="a"
                          fill="#D97706"
                        />
                        <Bar
                          dataKey="noShow"
                          name={t.doctor.chartNoShow}
                          stackId="a"
                          fill="#DC2626"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Per-Clinic Occupancy Rate */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      {t.doctor.occupancyChartTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.doctor.occupancyChartDesc}
                    </p>
                  </div>

                  {clinicOccupancyData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 text-center">
                      {t.doctor.noOccupancyData}
                    </div>
                  ) : (
                    <>
                      <div className="h-52 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={clinicOccupancyData}
                            margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={isDark ? '#334155' : '#E2E8F0'}
                            />
                            <XAxis
                              dataKey="shortClinicName"
                              tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              unit="%"
                              tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                            />
                            <Tooltip
                              formatter={(value: unknown) => [
                                `${Number(value)}%`,
                                t.doctor.occupancyRateLabel,
                              ]}
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
                            <Bar
                              dataKey="occupancyRate"
                              name={`${t.doctor.occupancyRateLabel} %`}
                              fill="#0F766E"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={48}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        {clinicOccupancyData.map((clinic) => (
                          <div
                            key={clinic.clinicName}
                            className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 rounded-lg px-3 py-2"
                          >
                            <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {clinic.clinicName}
                            </span>
                            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {clinic.bookedCount} / {clinic.capacity} {t.doctor.slotsWord} ·{' '}
                              <strong className="text-teal-800 dark:text-teal-300">
                                {clinic.occupancyRate}%
                              </strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-sm text-slate-500 dark:text-slate-400">
                  {t.common.loading}
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-slate-600 dark:text-slate-300">
                  {t.doctor.noBookings}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-start">{t.doctor.colPatient}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.doctor.colDateTime}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.doctor.colReasonNote}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.doctor.colFee}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.doctor.colStatus}</th>
                          <th className="py-3 px-4 font-semibold text-start">{t.doctor.colAction}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {bookings.map((apt) => {
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
                              <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                {apt.appointmentDate} ·{' '}
                                <span className="font-sans">
                                  {translateTimeSlot(apt.timeSlot, lang)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                {apt.reason || '—'}
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
                                    {t.doctor.arrivedAtPrefix} {arrivedTime}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-4 text-xs">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {apt.status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => handleAppointmentAction(apt, 'confirmed')}
                                      className="px-2.5 py-1 bg-teal-700 text-white rounded-md cursor-pointer"
                                    >
                                      {t.doctor.confirmBtn}
                                    </button>
                                  )}
                                  {(apt.status === 'pending' ||
                                    apt.status === 'confirmed' ||
                                    apt.status === 'arrived') && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleAppointmentAction(apt, 'completed')}
                                        className="px-2.5 py-1 bg-emerald-700 text-white rounded-md cursor-pointer"
                                      >
                                        {t.doctor.attendedBtn}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAppointmentAction(apt, 'no_show')}
                                        className="px-2.5 py-1 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md cursor-pointer"
                                      >
                                        {t.doctor.noShowBtn}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAppointmentAction(apt, 'cancelled')}
                                        className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md cursor-pointer"
                                      >
                                        {t.doctor.cancelBtn}
                                      </button>
                                    </>
                                  )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPatientUid(apt.patientUid);
                                    setSelectedAppointmentId(apt.id);
                                    setSubTab('ehr_author');
                                  }}
                                  className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                                >
                                  {t.doctor.addEhrBtn}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChatInitialPatientUid(apt.patientUid);
                                    setChatInitialAptRef(
                                      lang === 'en'
                                        ? `Regarding appointment ${apt.appointmentDate} (${translateTimeSlot(
                                            apt.timeSlot,
                                            'en'
                                          )})`
                                        : `بخصوص موعد ${apt.appointmentDate} (${apt.timeSlot})`
                                    );
                                    setSubTab('messages');
                                  }}
                                  className="px-2.5 py-1 border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-md cursor-pointer inline-flex items-center gap-1"
                                >
                                  <MessageSquareText className="w-3.5 h-3.5" />
                                  <span>{t.doctor.messagePatientBtn}</span>
                                </button>
                              </div>
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

          {subTab === 'ehr_author' && (
            <section className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.doctor.ehrAuthorTitle}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t.doctor.ehrAuthorDesc}
                </p>
              </div>

              {/* Authorized Patients Baseline Summary */}
              {authorizedPatients.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t.doctor.authorizedPatientsTitle} ({authorizedPatients.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {authorizedPatients.map((pt) => (
                      <div
                        key={pt.uid}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs space-y-1"
                      >
                        <p className="font-bold text-slate-900 dark:text-slate-100">{pt.fullName}</p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {t.pdf.bloodTypeLabel}: <span className="font-mono">{pt.bloodType}</span>
                          {pt.weightKg ? ` · ${t.patient.weightInputLabel}: ${pt.weightKg}` : ''}
                          {pt.heightCm ? ` · ${t.patient.heightLabel}: ${pt.heightCm}` : ''}
                        </p>
                        {pt.allergies.length > 0 && (
                          <p className="text-red-700 dark:text-red-400">
                            {t.pdf.allergiesLabel}: {pt.allergies.join(lang === 'ar' ? '، ' : ', ')}
                          </p>
                        )}
                        {pt.chronicConditions.length > 0 && (
                          <p className="text-slate-700 dark:text-slate-300">
                            {t.pdf.chronicLabel}:{' '}
                            {pt.chronicConditions.join(lang === 'ar' ? '، ' : ', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Clinical Record Form */}
              <form
                onSubmit={handleCreateEhrRecord}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
              >
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  {t.doctor.newEhrFormTitle}
                </h3>

                {patientOptions.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{t.doctor.noAuthorizedPatients}</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.doctor.colPatient}
                        </label>
                        <select
                          required
                          value={selectedPatientUid}
                          onChange={(e) => {
                            const nextUid = e.target.value;
                            setSelectedPatientUid(nextUid);
                            const matchedApt = bookings.find((b) => b.patientUid === nextUid);
                            setSelectedAppointmentId(matchedApt?.id || '');
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="">{t.doctor.selectPatientOption}</option>
                          {patientOptions.map((pt) => (
                            <option key={pt.uid} value={pt.uid}>
                              {pt.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.doctor.recordTypeLabel}
                        </label>
                        <select
                          value={recordType}
                          onChange={(e) => setRecordType(e.target.value as EhrRecordType)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="consultation">
                            {getRecordTypeLabel('consultation', lang)}
                          </option>
                          <option value="diagnosis">{getRecordTypeLabel('diagnosis', lang)}</option>
                          <option value="prescription">
                            {getRecordTypeLabel('prescription', lang)}
                          </option>
                          <option value="measurement">
                            {getRecordTypeLabel('measurement', lang)}
                          </option>
                          <option value="nutrition_plan">
                            {getRecordTypeLabel('nutrition_plan', lang)}
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.doctor.recordTitleLabel}
                        </label>
                        <input
                          type="text"
                          required
                          value={ehrTitle}
                          onChange={(e) => setEhrTitle(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.doctor.chiefComplaintLabel}
                        </label>
                        <input
                          type="text"
                          value={chiefComplaint}
                          onChange={(e) => setChiefComplaint(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.doctor.diagnosisLabel}
                        </label>
                        <input
                          type="text"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.doctor.medicationsLabel}
                      </label>
                      <input
                        type="text"
                        value={medicationsText}
                        onChange={(e) => setMedicationsText(e.target.value)}
                        placeholder="Metformin 500mg BID, Vitamin D3 1000IU"
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.doctor.systolicLabel}
                        </label>
                        <input
                          type="number"
                          value={systolic}
                          onChange={(e) => setSystolic(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.doctor.diastolicLabel}
                        </label>
                        <input
                          type="number"
                          value={diastolic}
                          onChange={(e) => setDiastolic(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.doctor.glucoseLabel}
                        </label>
                        <input
                          type="number"
                          value={bloodGlucose}
                          onChange={(e) => setBloodGlucose(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                    </div>

                    {/* Nutrition & Exercise Plan section (NutriCare integration) */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                      <p className="text-xs font-bold text-teal-800 dark:text-teal-300">
                        {t.doctor.nutritionSectionTitle}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                            {t.doctor.caloriesLabel}
                          </label>
                          <input
                            type="number"
                            value={dailyCalories}
                            onChange={(e) => setDailyCalories(e.target.value)}
                            placeholder="1800"
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                            {t.doctor.nutritionGoalLabel}
                          </label>
                          <input
                            type="text"
                            value={nutritionGoal}
                            onChange={(e) => setNutritionGoal(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                            {t.doctor.mealGuidelinesLabel}
                          </label>
                          <textarea
                            rows={2}
                            value={mealGuidelines}
                            onChange={(e) => setMealGuidelines(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                            {t.doctor.activityPlanLabel}
                          </label>
                          <textarea
                            rows={2}
                            value={activityPlan}
                            onChange={(e) => setActivityPlan(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.doctor.doctorNotesLabel}
                      </label>
                      <textarea
                        rows={2}
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingEhr}
                        className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        {savingEhr ? t.common.saving : t.doctor.saveEhrBtn}
                      </button>
                    </div>
                  </>
                )}
              </form>

              {/* Recent EHR records authored or shared */}
              {ehrRecords.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t.doctor.recentEhrTitle} ({ehrRecords.length})
                    </h4>
                  </div>
                  {ehrRecords.map((rec) => (
                    <div key={rec.id} className="p-4 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {rec.title}
                        </span>
                        <span className="text-teal-800 dark:text-teal-300 font-semibold">
                          {getRecordTypeLabel(rec.recordType, lang)}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {t.doctor.patientPrefix} {rec.patientName} · {t.doctor.authoredByPrefix}{' '}
                        {rec.doctorName}
                      </p>
                      {rec.diagnosis && (
                        <p className="text-slate-800 dark:text-slate-200">
                          {t.patient.diagnosisLabel} {rec.diagnosis}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {subTab === 'messages' && (
            <ChatWorkspace
              mode="doctor"
              currentUserUid={firebaseUser.uid}
              currentUserName={
                doctorProfile?.fullName ||
                userProfile?.displayName ||
                firebaseUser.displayName ||
                (lang === 'en' ? 'Doctor' : 'طبيب')
              }
              contacts={doctorChatContacts}
              initialSelectedContactUid={chatInitialPatientUid}
              initialAppointmentRef={chatInitialAptRef}
              onClearInitialContact={() => {
                setChatInitialPatientUid(null);
                setChatInitialAptRef('');
              }}
            />
          )}
        </main>
      </div>

      <QRScannerModal
        isOpen={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        appointments={bookings}
        onUpdateStatus={handleQrUpdateStatus}
        onCheckInByProvider={handleQrCheckIn}
      />
    </div>
  );
};
