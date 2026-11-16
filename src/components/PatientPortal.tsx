import React from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  BellOff,
  Building2,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Download,
  FileHeart,
  FileJson,
  FileText,
  Heart,
  HeartPulse,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquareText,
  MessageSquareWarning,
  Moon,
  Phone,
  Pill,
  Plus,
  Printer,
  QrCode,
  Star,
  Sun,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { ChatWorkspace, type ChatContactOption } from './ChatWorkspace';
import { MedicalPdfExportModal } from './MedicalPdfExportModal';
import {
  QRCodeDisplayModal,
  buildAppointmentQrPayload,
  buildEhrQrPayload,
} from './QRCodeModals';
import type { WebNotificationPermissionState } from '../lib/webNotifications';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { User } from 'firebase/auth';
import {
  BLOOD_TYPES,
  buildWhatsappDispatchUrl,
  buildWhatsappReminderMessage,
  formatCheckInTime,
  formatMedicationCountdown,
  formatRemainingTime,
  formatSdg,
  getAppointmentStatusLabel,
  getCenterTypeLabel,
  getEarliestNextDose,
  getMedicationDoseAlert,
  getMedicationStatusLabel,
  getRecordTypeLabel,
  getVisitTypeLabel,
  normalizeScheduleTimes,
  normalizeSudanWhatsappDigits,
  parseAppointmentDateTime,
  translateLocality,
  translateSpecialty,
  translateState,
  translateTimeSlot,
} from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import { useIsDarkMode } from '../lib/useIsDarkMode';
import {
  addPatientMedication,
  checkInPatientAppointment,
  createEhrRecord,
  deletePatientMedication,
  fetchMyComplaints,
  fetchPatientEhrRecords,
  fetchPatientReviews,
  getPatientProfile,
  savePatientProfile,
  submitAppointmentReview,
  submitComplaint,
  updateAppointmentStatus,
  updatePatientDoctorConsent,
  updatePatientMedicationStatus,
  updateUserNotificationPreferences,
} from '../lib/firestoreService';
import type {
  Appointment,
  ClinicCenter,
  Complaint,
  DoctorProfile,
  EhrRecord,
  MedicationStatus,
  PatientMedicalProfile,
  PatientMedication,
  PortalTab,
  ServiceReview,
  UserProfile,
} from '../types/medical';

interface PatientPortalProps {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  approvedDoctors: DoctorProfile[];
  approvedClinics: ClinicCenter[];
  appointments: Appointment[];
  medications: PatientMedication[];
  remindersEnabled: boolean;
  webPushEnabled: boolean;
  webPushPermission: WebNotificationPermissionState;
  darkMode: boolean;
  openMedsSignal?: number;
  onToggleReminders: (enabled: boolean) => void;
  onToggleWebPush: (enable: boolean) => void | Promise<void>;
  onSendTestWebNotification: () => void | Promise<void>;
  onToggleDarkMode: (darkMode: boolean) => void | Promise<void>;
  onToggleFavoriteDoctor: (doctorUid: string) => void | Promise<void>;
  onToggleFavoriteClinic: (clinicId: string) => void | Promise<void>;
  onPreviewReminderToast: (appointment: Appointment, msRemaining: number) => void;
  onPreviewMedicationToast: (med: PatientMedication) => void;
  onMarkMedicationTaken: (med: PatientMedication, doseKey: string) => Promise<void>;
  onSignIn: () => void;
  onRefreshData: () => Promise<void>;
  onNavigatePortal: (tab: PortalTab) => void;
  onProfileUpdated: (updated: UserProfile) => void;
}

type PatientSubTab =
  | 'appointments'
  | 'reminders'
  | 'favorites'
  | 'ehr'
  | 'messages'
  | 'consent'
  | 'complaints';
type EhrSectionFilter = 'all' | 'visits' | 'reports' | 'medications' | 'vitals' | 'profile';

const POINT_TIER_THRESHOLDS = [0, 100, 250, 500, 1000];

function toDateObj(ts: unknown): Date | null {
  if (!ts) return null;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
    return new Date(Number((ts as { seconds: number }).seconds) * 1000);
  }
  if (ts instanceof Date) return ts;
  return null;
}

function formatIsoDate(dateVal: Date | string | null | undefined, fallback: string): string {
  if (!dateVal) return fallback;
  const d = typeof dateVal === 'string' ? new Date(`${dateVal}T00:00:00`) : dateVal;
  if (Number.isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : fallback;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function classifyBloodPressure(
  sys?: number,
  dia?: number,
  labels?: { bpNormal: string; bpHigh: string; bpElevated: string; bpLow: string }
): { tone: 'normal' | 'high' | 'warn' | 'none'; label: string } {
  if (!sys || !dia) return { tone: 'none', label: '—' };
  if (sys >= 140 || dia >= 90) return { tone: 'high', label: labels?.bpHigh || 'High' };
  if (sys >= 130 || dia >= 80) return { tone: 'warn', label: labels?.bpElevated || 'Elevated' };
  if (sys < 90 || dia < 60) return { tone: 'warn', label: labels?.bpLow || 'Low' };
  return { tone: 'normal', label: labels?.bpNormal || 'Normal' };
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  firebaseUser,
  userProfile,
  approvedDoctors,
  approvedClinics,
  appointments,
  medications,
  remindersEnabled,
  webPushEnabled,
  webPushPermission,
  darkMode,
  openMedsSignal = 0,
  onToggleReminders,
  onToggleWebPush,
  onSendTestWebNotification,
  onToggleDarkMode,
  onToggleFavoriteDoctor,
  onToggleFavoriteClinic,
  onPreviewReminderToast,
  onPreviewMedicationToast,
  onMarkMedicationTaken,
  onSignIn,
  onRefreshData,
  onNavigatePortal,
  onProfileUpdated,
}) => {
  const { lang, dir, t } = useI18n();
  const isDark = useIsDarkMode();
  const [subTab, setSubTab] = React.useState<PatientSubTab>('appointments');
  const [ehrSection, setEhrSection] = React.useState<EhrSectionFilter>('all');
  const [selectedVisitYear, setSelectedVisitYear] = React.useState<number>(() =>
    new Date().getFullYear()
  );
  const [patientProfile, setPatientProfile] = React.useState<PatientMedicalProfile | null>(null);
  const [ehrRecords, setEhrRecords] = React.useState<EhrRecord[]>([]);
  const [myReviews, setMyReviews] = React.useState<ServiceReview[]>([]);
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showPdfModal, setShowPdfModal] = React.useState(false);
  const [chatInitialDoctorUid, setChatInitialDoctorUid] = React.useState<string | null>(null);
  const [chatInitialAptRef, setChatInitialAptRef] = React.useState<string>('');
  const [waPhoneInput, setWaPhoneInput] = React.useState(userProfile?.phone || '');
  const [waEnabled, setWaEnabled] = React.useState(Boolean(userProfile?.whatsappNotificationsEnabled));
  const [savingWa, setSavingWa] = React.useState(false);
  const [copiedAptId, setCopiedAptId] = React.useState<string | null>(null);
  const [checkingInId, setCheckingInId] = React.useState<string | null>(null);
  const [qrModalData, setQrModalData] = React.useState<{
    title: string;
    subtitle: string;
    badgeText: string;
    payloadString: string;
    summaryRows: Array<{ label: string; value: string }>;
    filenamePrefix: string;
  } | null>(null);

  // Current Medications State
  const [showAddMedForm, setShowAddMedForm] = React.useState(false);
  const [medName, setMedName] = React.useState('');
  const [medDosage, setMedDosage] = React.useState('');
  const [medFrequency, setMedFrequency] = React.useState('');
  const [medTimesText, setMedTimesText] = React.useState('08:00, 20:00');
  const [medStatus, setMedStatus] = React.useState<MedicationStatus>('active');
  const [medNotes, setMedNotes] = React.useState('');
  const [medReminderEnabled, setMedReminderEnabled] = React.useState(true);
  const [savingMed, setSavingMed] = React.useState(false);
  const [busyMedId, setBusyMedId] = React.useState<string | null>(null);

  // Baseline Medical Profile Form
  const [fullName, setFullName] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female'>('male');
  const [bloodType, setBloodType] = React.useState<PatientMedicalProfile['bloodType']>('unknown');
  const [heightCm, setHeightCm] = React.useState<string>('');
  const [weightKg, setWeightKg] = React.useState<string>('');
  const [allergiesText, setAllergiesText] = React.useState('');
  const [chronicText, setChronicText] = React.useState('');
  const [emergencyContact, setEmergencyContact] = React.useState('');
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Self Measurement Form
  const [measTitle, setMeasTitle] = React.useState(() =>
    lang === 'en' ? 'Routine Home Measurement' : 'قياس دوري بالمنزل'
  );
  const [systolic, setSystolic] = React.useState('');
  const [diastolic, setDiastolic] = React.useState('');
  const [bloodGlucose, setBloodGlucose] = React.useState('');
  const [heartRate, setHeartRate] = React.useState('');
  const [measWeight, setMeasWeight] = React.useState('');
  const [savingMeas, setSavingMeas] = React.useState(false);

  // Review Modal (Doctor + Clinic)
  const [reviewTarget, setReviewTarget] = React.useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState('');
  const [clinicRating, setClinicRating] = React.useState(5);
  const [clinicComment, setClinicComment] = React.useState('');
  const [submittingReview, setSubmittingReview] = React.useState(false);

  // Complaint Form
  const [cmpTargetType, setCmpTargetType] = React.useState<'doctor' | 'clinic' | 'platform'>('doctor');
  const [cmpTargetName, setCmpTargetName] = React.useState('');
  const [cmpSubject, setCmpSubject] = React.useState('');
  const [cmpDescription, setCmpDescription] = React.useState('');
  const [submittingCmp, setSubmittingCmp] = React.useState(false);

  React.useEffect(() => {
    if (openMedsSignal > 0) {
      setSubTab('ehr');
      setEhrSection('medications');
    }
  }, [openMedsSignal]);

  const loadPatientData = React.useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const [pProf, recs, cmps, revs] = await Promise.all([
        getPatientProfile(firebaseUser.uid),
        fetchPatientEhrRecords(firebaseUser.uid),
        fetchMyComplaints(firebaseUser.uid),
        fetchPatientReviews(firebaseUser.uid),
      ]);
      setPatientProfile(pProf);
      setEhrRecords(recs);
      setComplaints(cmps);
      setMyReviews(revs);

      if (pProf) {
        setFullName(pProf.fullName);
        setDateOfBirth(pProf.dateOfBirth || '');
        setGender(pProf.gender || 'male');
        setBloodType(pProf.bloodType);
        setHeightCm(pProf.heightCm ? String(pProf.heightCm) : '');
        setWeightKg(pProf.weightKg ? String(pProf.weightKg) : '');
        setAllergiesText(pProf.allergies.join('، '));
        setChronicText(pProf.chronicConditions.join('، '));
        setEmergencyContact(pProf.emergencyContact || '');
      } else if (userProfile) {
        setFullName(userProfile.displayName);
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not load medical profile data.'
            : 'تعذر تحميل بيانات الملف الطبي.',
      });
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, userProfile, lang]);

  React.useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  React.useEffect(() => {
    setWaPhoneInput(userProfile?.phone || '');
    setWaEnabled(Boolean(userProfile?.whatsappNotificationsEnabled));
  }, [userProfile?.phone, userProfile?.whatsappNotificationsEnabled]);

  const bmiValue = React.useMemo(() => {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (h > 30 && w > 2) {
      return (w / Math.pow(h / 100, 2)).toFixed(1);
    }
    return null;
  }, [heightCm, weightKg]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSavingProfile(true);
    setFeedbackMsg(null);
    try {
      await savePatientProfile(
        firebaseUser.uid,
        userProfile?.displayName || fullName,
        userProfile?.role || 'patient',
        {
          fullName,
          dateOfBirth,
          gender,
          bloodType,
          heightCm: heightCm ? Number(heightCm) : undefined,
          weightKg: weightKg ? Number(weightKg) : undefined,
          allergies: allergiesText
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter(Boolean),
          chronicConditions: chronicText
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter(Boolean),
          emergencyContact,
          authorizedDoctorUids: patientProfile?.authorizedDoctorUids || [],
        }
      );
      await loadPatientData();
      setFeedbackMsg({
        type: 'ok',
        text:
          lang === 'en'
            ? 'Baseline medical profile saved successfully.'
            : 'تم حفظ البيانات الطبية الأساسية بنجاح.',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Failed to save profile data.'
            : 'فشل حفظ البيانات.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSavingMeas(true);
    setFeedbackMsg(null);
    try {
      const vitals: Record<string, number> = {};
      if (systolic) vitals.systolic = Number(systolic);
      if (diastolic) vitals.diastolic = Number(diastolic);
      if (bloodGlucose) vitals.bloodGlucose = Number(bloodGlucose);
      if (heartRate) vitals.heartRate = Number(heartRate);
      if (measWeight) vitals.weightKg = Number(measWeight);

      await createEhrRecord(
        firebaseUser.uid,
        userProfile?.displayName || fullName || (lang === 'en' ? 'Patient' : 'مريض'),
        'patient',
        {
          patientUid: firebaseUser.uid,
          patientName:
            patientProfile?.fullName ||
            userProfile?.displayName ||
            (lang === 'en' ? 'Patient' : 'مريض'),
          doctorUid: firebaseUser.uid,
          doctorName: lang === 'en' ? 'Patient Self-Log' : 'تسجيل ذاتي من المريض',
          recordType: 'measurement',
          title: measTitle || (lang === 'en' ? 'Routine Health Measurements' : 'قياسات صحية دورية'),
          clinicalNotes:
            lang === 'en'
              ? 'Vital signs logged directly via Patient Portal.'
              : 'تم تسجيل القياسات الحيوية ذاتياً عبر بوابة المريض.',
          medications: [],
          vitals,
        }
      );
      setSystolic('');
      setDiastolic('');
      setBloodGlucose('');
      setHeartRate('');
      setMeasWeight('');
      await loadPatientData();
      setFeedbackMsg({
        type: 'ok',
        text:
          lang === 'en'
            ? 'Vital measurements added to your EHR.'
            : 'تمت إضافة القياسات الصحية إلى ملفك الطبي.',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not log measurement.'
            : 'تعذر تسجيل القياس.',
      });
    } finally {
      setSavingMeas(false);
    }
  };

  const handleToggleDoctorConsent = async (doctorUid: string) => {
    if (!firebaseUser) return;
    const current = patientProfile?.authorizedDoctorUids || [];
    const exists = current.includes(doctorUid);
    const updated = exists
      ? current.filter((id) => id !== doctorUid)
      : [...current, doctorUid];
    setFeedbackMsg(null);
    try {
      await updatePatientDoctorConsent(
        firebaseUser.uid,
        patientProfile?.fullName || userProfile?.displayName || (lang === 'en' ? 'Patient' : 'مريض'),
        updated,
        ehrRecords
      );
      await loadPatientData();
      setFeedbackMsg({
        type: 'ok',
        text: exists
          ? lang === 'en'
            ? 'Doctor access permission revoked.'
            : 'تم سحب صلاحية اطلاع الطبيب على ملفك الطبي.'
          : lang === 'en'
          ? 'Doctor granted access to your medical record.'
          : 'تم منح الطبيب صلاحية الاطلاع على ملفك الطبي وسجلاتك.',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not update access permissions.'
            : 'تعذر تحديث الصلاحيات.',
      });
    }
  };

  const handleCancelAppointment = async (apt: Appointment) => {
    if (!firebaseUser) return;
    try {
      await updateAppointmentStatus(
        apt.id,
        firebaseUser.uid,
        userProfile?.displayName || (lang === 'en' ? 'Patient' : 'مريض'),
        'patient',
        'cancelled',
        lang === 'en' ? 'Cancelled by patient' : 'إلغاء من قبل المريض'
      );
      await onRefreshData();
      setFeedbackMsg({
        type: 'ok',
        text: lang === 'en' ? 'Appointment cancelled.' : 'تم إلغاء الموعد بنجاح.',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not cancel appointment.'
            : 'تعذر إلغاء الموعد.',
      });
    }
  };

  const handleCheckInAppointment = async (apt: Appointment) => {
    if (!firebaseUser) return;
    setCheckingInId(apt.id);
    setFeedbackMsg(null);
    try {
      await checkInPatientAppointment(
        apt.id,
        firebaseUser.uid,
        patientProfile?.fullName || userProfile?.displayName || (lang === 'en' ? 'Patient' : 'مريض')
      );
      await onRefreshData();
      setFeedbackMsg({
        type: 'ok',
        text: t.patient.checkInSuccessMsg,
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not confirm arrival.'
            : 'تعذر تأكيد الوصول للعيادة.',
      });
    } finally {
      setCheckingInId(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !reviewTarget) return;
    setSubmittingReview(true);
    try {
      await submitAppointmentReview(
        reviewTarget,
        firebaseUser.uid,
        userProfile?.displayName || (lang === 'en' ? 'Patient' : 'مريض'),
        reviewRating,
        reviewComment,
        reviewTarget.clinicId || reviewTarget.clinicName ? clinicRating : undefined,
        reviewTarget.clinicId || reviewTarget.clinicName ? clinicComment : undefined
      );
      setReviewTarget(null);
      setReviewRating(5);
      setReviewComment('');
      setClinicRating(5);
      setClinicComment('');
      await Promise.all([onRefreshData(), loadPatientData()]);
      setFeedbackMsg({
        type: 'ok',
        text:
          lang === 'en'
            ? 'Thank you! Your review has been published to the Medical Directory.'
            : 'شكراً لك، تم نشر تقييمك للطبيب والعيادة في الدليل الطبي.',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not submit review.'
            : 'تعذر إرسال التقييم.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSubmittingCmp(true);
    setFeedbackMsg(null);
    try {
      await submitComplaint(
        firebaseUser.uid,
        userProfile?.displayName || (lang === 'en' ? 'Patient' : 'مريض'),
        userProfile?.role || 'patient',
        {
          targetType: cmpTargetType,
          targetName: cmpTargetName,
          subject: cmpSubject,
          description: cmpDescription,
        }
      );
      setCmpTargetName('');
      setCmpSubject('');
      setCmpDescription('');
      await loadPatientData();
      setFeedbackMsg({
        type: 'ok',
        text:
          lang === 'en'
            ? 'Complaint submitted to Central Administration for review.'
            : 'تم رفع الشكوى إلى الإدارة المركزية للمراجعة.',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not submit complaint.'
            : 'تعذر إرسال الشكوى.',
      });
    } finally {
      setSubmittingCmp(false);
    }
  };

  const handleSaveWhatsappPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setFeedbackMsg(null);
    const normalized = normalizeSudanWhatsappDigits(waPhoneInput);
    if (waEnabled && !normalized) {
      setFeedbackMsg({
        type: 'err',
        text: t.whatsapp.invalidPhoneError,
      });
      return;
    }

    setSavingWa(true);
    try {
      const updated = await updateUserNotificationPreferences(
        firebaseUser.uid,
        userProfile?.displayName || fullName || (lang === 'en' ? 'Patient' : 'مريض'),
        userProfile?.role || 'patient',
        {
          phone: waPhoneInput.trim(),
          whatsappNotificationsEnabled: waEnabled,
        }
      );
      onProfileUpdated(updated);
      setFeedbackMsg({
        type: 'ok',
        text: t.whatsapp.savedSuccess,
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text: err instanceof Error ? err.message : t.whatsapp.saveError,
      });
    } finally {
      setSavingWa(false);
    }
  };

  const handleCopyReminderMessage = async (appointment: Appointment, msRemaining: number) => {
    const msg = buildWhatsappReminderMessage({
      doctorName: appointment.doctorName,
      clinicName: appointment.clinicName,
      appointmentDate: appointment.appointmentDate,
      timeSlot: appointment.timeSlot,
      msRemaining,
      lang,
    });
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedAptId(appointment.id);
      window.setTimeout(() => {
        setCopiedAptId((curr) => (curr === appointment.id ? null : curr));
      }, 2500);
    } catch {
      setFeedbackMsg({
        type: 'err',
        text:
          lang === 'en'
            ? 'Could not copy reminder text; use the WhatsApp button instead.'
            : 'تعذر نسخ نص التذكير، يمكنك استخدام رابط واتساب المباشر.',
      });
    }
  };

  const handleOpenAppointmentQr = (apt: Appointment) => {
    setQrModalData({
      title: t.patient.qrAppointmentTitle,
      subtitle: `${apt.doctorName} · ${apt.appointmentDate} (${translateTimeSlot(apt.timeSlot, lang)})`,
      badgeText: t.patient.qrAppointmentBadge,
      payloadString: buildAppointmentQrPayload(apt),
      filenamePrefix: `appointment_qr_${apt.id}`,
      summaryRows: [
        { label: t.qr.patientLabel, value: apt.patientName },
        { label: t.qr.doctorLabel, value: apt.doctorName },
        { label: t.qr.clinicLabel, value: apt.clinicName || t.common.privateClinic },
        {
          label: t.qr.dateTimeLabel,
          value: `${apt.appointmentDate} · ${translateTimeSlot(apt.timeSlot, lang)}`,
        },
        { label: t.qr.feeLabel, value: formatSdg(apt.feeSdg, lang) },
        { label: t.patient.colStatus, value: getAppointmentStatusLabel(apt.status, lang) },
      ],
    });
  };

  const handleOpenEhrQr = () => {
    if (!firebaseUser) return;
    const displayName =
      patientProfile?.fullName ||
      fullName ||
      userProfile?.displayName ||
      firebaseUser.displayName ||
      (lang === 'en' ? 'Patient' : 'مريض');
    const allergies = allergiesText
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const chronic = chronicText
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const activeMeds = medications
      .filter((m) => m.status === 'active')
      .map((m) => (m.dosage ? `${m.name} (${m.dosage})` : m.name));

    setQrModalData({
      title: t.patient.qrEhrTitle,
      subtitle: displayName,
      badgeText: t.patient.qrEhrBadge,
      payloadString: buildEhrQrPayload({
        pUid: firebaseUser.uid,
        name: displayName,
        dob: dateOfBirth || '—',
        blood: bloodType === 'unknown' ? '—' : bloodType,
        phone: userProfile?.phone || waPhoneInput || '',
        allergies,
        chronic,
        meds: activeMeds,
        emergency: emergencyContact || '',
        reportsCount: ehrRecords.length,
      }),
      filenamePrefix: `ehr_qr_${firebaseUser.uid.slice(0, 8)}`,
      summaryRows: [
        { label: t.patient.fullNameLabel, value: displayName },
        {
          label: t.patient.bloodTypeLabel,
          value: bloodType === 'unknown' ? t.common.notSpecified : bloodType,
        },
        {
          label: t.pdf.allergiesLabel,
          value: allergies.length > 0 ? allergies.join(', ') : t.pdf.noAllergies,
        },
        {
          label: t.pdf.chronicLabel,
          value: chronic.length > 0 ? chronic.join(', ') : t.pdf.noChronic,
        },
      ],
    });
  };

  const handleToggleTimePreset = (presetTime: string) => {
    const current = normalizeScheduleTimes(medTimesText);
    const updated = current.includes(presetTime)
      ? current.filter((item) => item !== presetTime)
      : [...current, presetTime].sort().slice(0, 6);
    setMedTimesText(updated.join(', '));
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !medName.trim()) return;
    setSavingMed(true);
    setFeedbackMsg(null);
    try {
      const scheduleTimes = normalizeScheduleTimes(medTimesText);
      await addPatientMedication(
        firebaseUser.uid,
        userProfile?.displayName || fullName || (lang === 'en' ? 'Patient' : 'مريض'),
        {
          name: medName.trim(),
          dosage: medDosage.trim(),
          frequency: medFrequency.trim(),
          scheduleTimes,
          status: medStatus,
          notes: medNotes.trim(),
          reminderEnabled: medReminderEnabled,
        }
      );
      setMedName('');
      setMedDosage('');
      setMedFrequency('');
      setMedNotes('');
      setMedStatus('active');
      setShowAddMedForm(false);
      setFeedbackMsg({
        type: 'ok',
        text:
          lang === 'en'
            ? 'Medication saved to your Current Medications list.'
            : 'تمت إضافة الدواء إلى قائمة الأدوية الحالية بنجاح.',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not save medication.'
            : 'تعذر حفظ الدواء.',
      });
    } finally {
      setSavingMed(false);
    }
  };

  const handleImportPrescribedMedication = async (item: {
    name: string;
    doctorName: string;
    recordId: string;
  }) => {
    if (!firebaseUser) return;
    setBusyMedId(`import_${item.recordId}_${item.name}`);
    setFeedbackMsg(null);
    try {
      await addPatientMedication(
        firebaseUser.uid,
        userProfile?.displayName || fullName || (lang === 'en' ? 'Patient' : 'مريض'),
        {
          name: item.name,
          dosage: '',
          frequency: lang === 'en' ? 'As prescribed by doctor' : 'حسب وصفة الطبيب',
          scheduleTimes: ['08:00', '20:00'],
          status: 'active',
          prescribedBy: item.doctorName,
          sourceRecordId: item.recordId,
          notes: '',
          reminderEnabled: true,
        }
      );
      setFeedbackMsg({
        type: 'ok',
        text: t.patient.medicationsImportedMsg,
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Failed to import prescribed medication.'
            : 'تعذر استيراد الدواء من الوصفة.',
      });
    } finally {
      setBusyMedId(null);
    }
  };

  const handleMedicationStatusChange = async (
    med: PatientMedication,
    newStatus: MedicationStatus
  ) => {
    if (!firebaseUser || med.status === newStatus) return;
    setBusyMedId(med.id);
    setFeedbackMsg(null);
    try {
      await updatePatientMedicationStatus(
        med.id,
        firebaseUser.uid,
        userProfile?.displayName || fullName || (lang === 'en' ? 'Patient' : 'مريض'),
        { status: newStatus }
      );
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Failed to update medication status.'
            : 'تعذر تحديث حالة الدواء.',
      });
    } finally {
      setBusyMedId(null);
    }
  };

  const handleToggleMedicationReminder = async (med: PatientMedication) => {
    if (!firebaseUser) return;
    setBusyMedId(med.id);
    setFeedbackMsg(null);
    try {
      await updatePatientMedicationStatus(
        med.id,
        firebaseUser.uid,
        userProfile?.displayName || fullName || (lang === 'en' ? 'Patient' : 'مريض'),
        { reminderEnabled: !med.reminderEnabled }
      );
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Failed to update reminder preference.'
            : 'تعذر تحديث حالة التنبيه.',
      });
    } finally {
      setBusyMedId(null);
    }
  };

  const handleDeleteMedication = async (med: PatientMedication) => {
    if (!firebaseUser) return;
    setBusyMedId(med.id);
    setFeedbackMsg(null);
    try {
      await deletePatientMedication(
        med.id,
        firebaseUser.uid,
        userProfile?.displayName || fullName || (lang === 'en' ? 'Patient' : 'مريض')
      );
    } catch (err) {
      setFeedbackMsg({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not delete medication.'
            : 'تعذر حذف الدواء.',
      });
    } finally {
      setBusyMedId(null);
    }
  };

  const upcoming24hList = React.useMemo(() => {
    const nowMs = Date.now();
    const limitMs = 24 * 60 * 60 * 1000;
    return appointments
      .filter((apt) => apt.status === 'pending' || apt.status === 'confirmed')
      .map((apt) => {
        const dt = parseAppointmentDateTime(apt.appointmentDate, apt.timeSlot);
        const msRemaining = dt ? dt.getTime() - nowMs : -1;
        return { appointment: apt, msRemaining };
      })
      .filter((item) => item.msRemaining > 0 && item.msRemaining <= limitMs)
      .sort((a, b) => a.msRemaining - b.msRemaining);
  }, [appointments]);

  const upcomingFutureList = React.useMemo(() => {
    const nowMs = Date.now();
    return appointments
      .filter((apt) => apt.status === 'pending' || apt.status === 'confirmed')
      .map((apt) => {
        const dt = parseAppointmentDateTime(apt.appointmentDate, apt.timeSlot);
        const msRemaining = dt ? dt.getTime() - nowMs : -1;
        return { appointment: apt, msRemaining };
      })
      .filter((item) => item.msRemaining > 0)
      .sort((a, b) => a.msRemaining - b.msRemaining);
  }, [appointments]);

  const todayCheckInAppointments = React.useMemo(() => {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    return appointments
      .filter(
        (apt) =>
          apt.appointmentDate === todayIso &&
          (apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'arrived')
      )
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [appointments]);

  const availableVisitYears = React.useMemo(() => {
    const years = new Set<number>([new Date().getFullYear(), selectedVisitYear]);
    appointments.forEach((a) => {
      const yr = Number(a.appointmentDate?.slice(0, 4));
      if (!Number.isNaN(yr) && yr >= 2020) years.add(yr);
    });
    ehrRecords.forEach((r) => {
      const dt = toDateObj(r.createdAt);
      if (dt) years.add(dt.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [appointments, ehrRecords, selectedVisitYear]);

  const monthlyVisitsChartData = React.useMemo(() => {
    const completedAptIds = new Set(
      appointments.filter((a) => a.status === 'completed').map((a) => a.id)
    );
    const months = t.patient.months.map((label) => ({
      month: label,
      completed: 0,
      scheduled: 0,
      total: 0,
    }));

    appointments.forEach((apt) => {
      if (!apt.appointmentDate || apt.status === 'cancelled') return;
      const parts = apt.appointmentDate.split('-').map(Number);
      if (parts.length < 2 || parts[0] !== selectedVisitYear) return;
      const monthIdx = parts[1] - 1;
      if (monthIdx < 0 || monthIdx > 11) return;
      if (apt.status === 'completed') {
        months[monthIdx].completed += 1;
      } else if (
        apt.status === 'confirmed' ||
        apt.status === 'pending' ||
        apt.status === 'arrived'
      ) {
        months[monthIdx].scheduled += 1;
      }
    });

    // Include doctor-authored clinical visit records that weren't already tied to a completed appointment
    ehrRecords.forEach((rec) => {
      if (rec.recordType === 'measurement' || rec.doctorUid === firebaseUser?.uid) return;
      if (rec.appointmentId && completedAptIds.has(rec.appointmentId)) return;
      const dt = toDateObj(rec.createdAt);
      if (!dt || dt.getFullYear() !== selectedVisitYear) return;
      months[dt.getMonth()].completed += 1;
    });

    months.forEach((m) => {
      m.total = m.completed + m.scheduled;
    });

    return months;
  }, [appointments, ehrRecords, selectedVisitYear, firebaseUser?.uid, t.patient.months]);

  const yearlyActivitySummary = React.useMemo(() => {
    const completed = monthlyVisitsChartData.reduce((s, m) => s + m.completed, 0);
    const scheduled = monthlyVisitsChartData.reduce((s, m) => s + m.scheduled, 0);
    const total = completed + scheduled;
    const peak = [...monthlyVisitsChartData].sort((a, b) => b.total - a.total)[0];
    return {
      completed,
      scheduled,
      total,
      peakMonth:
        peak && peak.total > 0
          ? `${peak.month} (${peak.total})`
          : lang === 'en'
          ? 'None'
          : 'لا يوجد',
    };
  }, [monthlyVisitsChartData, lang]);

  const unreviewedCompletedAppointments = React.useMemo(
    () => appointments.filter((a) => a.status === 'completed' && !a.reviewed),
    [appointments]
  );

  const pastVisitsTimeline = React.useMemo(() => {
    const completedApts = appointments
      .filter((a) => a.status === 'completed')
      .map((a) => ({
        id: `apt_${a.id}`,
        dateStr: a.appointmentDate,
        timeLabel: translateTimeSlot(a.timeSlot, lang),
        doctorName: a.doctorName,
        specialty: translateSpecialty(a.doctorSpecialty, lang),
        clinicName: a.clinicName || t.common.privateClinic,
        location: `${translateState(a.state, lang)} · ${translateLocality(a.locality, lang)}`,
        visitTypeLabel: getVisitTypeLabel(a.visitType, lang),
        reasonOrTitle: a.reason || (lang === 'en' ? 'Medical Consultation' : 'استشارة طبية'),
        hasLinkedReport: ehrRecords.some((r) => r.appointmentId === a.id),
      }));

    const standaloneDoctorVisits = ehrRecords
      .filter(
        (r) =>
          (r.recordType === 'consultation' || r.recordType === 'nutrition_plan') &&
          r.doctorUid !== firebaseUser?.uid &&
          (!r.appointmentId || !appointments.some((a) => a.id === r.appointmentId && a.status === 'completed'))
      )
      .map((r) => {
        const dt = toDateObj(r.createdAt);
        return {
          id: `ehr_${r.id}`,
          dateStr: formatIsoDate(dt, t.common.notSpecified),
          timeLabel: dt
            ? dt.toLocaleTimeString(lang === 'en' ? 'en-US' : 'ar-SD', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : lang === 'en'
            ? 'Verified Visit'
            : 'زيارة موثقة',
          doctorName: r.doctorName,
          specialty: getRecordTypeLabel(r.recordType, lang),
          clinicName: r.clinicName || t.common.privateClinic,
          location: t.patient.tabEhr,
          visitTypeLabel: getRecordTypeLabel(r.recordType, lang),
          reasonOrTitle: r.title,
          hasLinkedReport: true,
        };
      });

    return [...completedApts, ...standaloneDoctorVisits].sort((a, b) =>
      b.dateStr.localeCompare(a.dateStr)
    );
  }, [appointments, ehrRecords, firebaseUser?.uid, lang, t.common.privateClinic, t.common.notSpecified, t.patient.tabEhr]);

  const diagnosticReports = React.useMemo(() => {
    return [...ehrRecords]
      .filter((r) => r.recordType !== 'measurement' || Boolean(r.diagnosis))
      .sort((a, b) => {
        const da = toDateObj(a.createdAt)?.getTime() || 0;
        const db = toDateObj(b.createdAt)?.getTime() || 0;
        return db - da;
      });
  }, [ehrRecords]);

  const prescribedMedSuggestions = React.useMemo(() => {
    const trackedNames = new Set(medications.map((m) => m.name.trim().toLowerCase()));
    const suggestions: { name: string; doctorName: string; recordId: string }[] = [];
    const seen = new Set<string>();
    diagnosticReports.forEach((rec) => {
      (rec.medications || []).forEach((rawName) => {
        const trimmed = rawName.trim();
        const key = trimmed.toLowerCase();
        if (!trimmed || trackedNames.has(key) || seen.has(key)) return;
        seen.add(key);
        suggestions.push({
          name: trimmed,
          doctorName: rec.doctorName,
          recordId: rec.id,
        });
      });
    });
    return suggestions;
  }, [diagnosticReports, medications]);

  const dueMedicationsList = React.useMemo(() => {
    const now = new Date();
    return medications
      .map((med) => ({ med, alert: getMedicationDoseAlert(med, now) }))
      .filter((entry) => entry.alert.state === 'due_now');
  }, [medications]);

  const earliestNextDose = React.useMemo(
    () => getEarliestNextDose(medications, new Date()),
    [medications]
  );

  const activeMedsCount = React.useMemo(
    () => medications.filter((m) => m.status === 'active').length,
    [medications]
  );

  const favoriteDoctors = React.useMemo(() => {
    const ids = new Set(userProfile?.favoriteDoctorUids || []);
    return approvedDoctors.filter((d) => ids.has(d.uid));
  }, [approvedDoctors, userProfile?.favoriteDoctorUids]);

  const favoriteClinics = React.useMemo(() => {
    const ids = new Set(userProfile?.favoriteClinicIds || []);
    return approvedClinics.filter((c) => ids.has(c.id));
  }, [approvedClinics, userProfile?.favoriteClinicIds]);

  const vitalsTimelineAsc = React.useMemo(() => {
    const entries = ehrRecords
      .filter((r) => r.vitals && Object.keys(r.vitals).length > 0)
      .map((r) => {
        const dt = toDateObj(r.createdAt);
        const dateStr = dt
          ? formatIsoDate(dt, t.common.notSpecified)
          : lang === 'en'
          ? 'Recording'
          : 'قيد التسجيل';
        return {
          id: r.id,
          timestampMs: dt ? dt.getTime() : 0,
          dateStr,
          shortLabel: dt
            ? `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`
            : t.common.newLabel,
          source:
            r.doctorUid === firebaseUser?.uid
              ? lang === 'en'
                ? 'Self-logged'
                : 'تسجيل ذاتي'
              : r.doctorName,
          title: r.title,
          systolic: r.vitals?.systolic,
          diastolic: r.vitals?.diastolic,
          weightKg: r.vitals?.weightKg,
          bloodGlucose: r.vitals?.bloodGlucose,
          heartRate: r.vitals?.heartRate,
        };
      })
      .sort((a, b) => a.timestampMs - b.timestampMs);

    return entries.map((item, idx) => {
      let weightDelta: number | null = null;
      if (typeof item.weightKg === 'number') {
        for (let i = idx - 1; i >= 0; i -= 1) {
          const prevW = entries[i].weightKg;
          if (typeof prevW === 'number') {
            weightDelta = Number((item.weightKg - prevW).toFixed(1));
            break;
          }
        }
      }
      return { ...item, weightDelta };
    });
  }, [ehrRecords, firebaseUser?.uid, lang, t.common.notSpecified, t.common.newLabel]);

  const vitalsTimelineDesc = React.useMemo(
    () => [...vitalsTimelineAsc].reverse(),
    [vitalsTimelineAsc]
  );

  const pointsSummary = React.useMemo(() => {
    const visitPoints = pastVisitsTimeline.length * 50;
    const reviewPoints = myReviews.length * 25;
    const totalPoints = visitPoints + reviewPoints;

    let currentTierIndex = 0;
    for (let i = 0; i < POINT_TIER_THRESHOLDS.length; i += 1) {
      if (totalPoints >= POINT_TIER_THRESHOLDS[i]) {
        currentTierIndex = i;
      }
    }

    const currentTier = {
      name: t.patient.tiers[currentTierIndex] || t.patient.tiers[0],
      minPoints: POINT_TIER_THRESHOLDS[currentTierIndex],
    };
    const nextTier =
      currentTierIndex < POINT_TIER_THRESHOLDS.length - 1
        ? {
            name: t.patient.tiers[currentTierIndex + 1],
            minPoints: POINT_TIER_THRESHOLDS[currentTierIndex + 1],
          }
        : null;

    let progressPercent = 100;
    let pointsRemaining = 0;
    if (nextTier) {
      const span = nextTier.minPoints - currentTier.minPoints;
      const gainedInTier = totalPoints - currentTier.minPoints;
      progressPercent = Math.max(0, Math.min(100, Math.round((gainedInTier / span) * 100)));
      pointsRemaining = Math.max(0, nextTier.minPoints - totalPoints);
    }

    return {
      visitCount: pastVisitsTimeline.length,
      reviewCount: myReviews.length,
      visitPoints,
      reviewPoints,
      totalPoints,
      levelNumber: currentTierIndex + 1,
      currentTier,
      nextTier,
      progressPercent,
      pointsRemaining,
    };
  }, [pastVisitsTimeline.length, myReviews.length, t.patient.tiers]);

  const patientChatContacts = React.useMemo<ChatContactOption[]>(() => {
    const map = new Map<string, ChatContactOption>();
    appointments.forEach((apt) => {
      if (!map.has(apt.doctorUid)) {
        map.set(apt.doctorUid, {
          uid: apt.doctorUid,
          name: apt.doctorName,
          subtitle: `${translateSpecialty(apt.doctorSpecialty, lang)} · ${
            apt.clinicName || t.common.privateClinic
          }`,
          appointmentId: apt.id,
          appointmentDate: apt.appointmentDate,
        });
      }
    });
    approvedDoctors.forEach((docItem) => {
      if (!map.has(docItem.uid)) {
        map.set(docItem.uid, {
          uid: docItem.uid,
          name: docItem.fullName,
          subtitle: `${translateSpecialty(docItem.specialty, lang)} · ${translateState(
            docItem.state,
            lang
          )}`,
        });
      }
    });
    return Array.from(map.values());
  }, [appointments, approvedDoctors, lang, t.common.privateClinic]);

  const handleDownloadJson = (scope: 'all' | 'appointments' | 'ehr') => {
    if (!firebaseUser) return;
    const serializeValue = (val: unknown): unknown => {
      if (val === null || val === undefined) return val;
      if (
        typeof val === 'object' &&
        'toDate' in val &&
        typeof (val as { toDate: () => Date }).toDate === 'function'
      ) {
        return (val as { toDate: () => Date }).toDate().toISOString();
      }
      if (
        typeof val === 'object' &&
        'seconds' in val &&
        typeof (val as { seconds: number }).seconds === 'number'
      ) {
        return new Date((val as { seconds: number }).seconds * 1000).toISOString();
      }
      if (Array.isArray(val)) return val.map(serializeValue);
      if (typeof val === 'object') {
        const out: Record<string, unknown> = {};
        Object.entries(val as Record<string, unknown>).forEach(([k, v]) => {
          out[k] = serializeValue(v);
        });
        return out;
      }
      return val;
    };

    const todayIso = new Date().toISOString().slice(0, 10);
    const patientDisplayName =
      patientProfile?.fullName ||
      userProfile?.displayName ||
      firebaseUser.displayName ||
      'Patient';

    const payload: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      platform: 'Sudanese Smart Medical Platform',
      scope,
      patient: {
        uid: firebaseUser.uid,
        name: patientDisplayName,
        email: firebaseUser.email || userProfile?.email || '',
        bloodType: patientProfile?.bloodType || 'unknown',
        dateOfBirth: patientProfile?.dateOfBirth || null,
      },
    };

    if (scope === 'all' || scope === 'appointments') {
      payload.appointments = serializeValue(appointments);
    }

    if (scope === 'all' || scope === 'ehr') {
      payload.medicalProfile = serializeValue(patientProfile);
      payload.medications = serializeValue(medications);
      payload.ehrRecords = serializeValue(ehrRecords);
      payload.pastVisits = serializeValue(pastVisitsTimeline);
      payload.vitalsTimeline = serializeValue(vitalsTimelineDesc);
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slugName = patientDisplayName.replace(/\s+/g, '_').slice(0, 28) || 'Patient';
    const scopeLabel =
      scope === 'appointments'
        ? 'Appointments'
        : scope === 'ehr'
          ? 'Health_Records'
          : 'Medical_Data';
    link.href = url;
    link.download = `${scopeLabel}_${slugName}_${todayIso}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedbackMsg({ type: 'ok', text: t.patient.jsonExportSuccess });
  };

  if (!firebaseUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 space-y-4">
          <FileHeart className="w-10 h-10 text-teal-700 dark:text-teal-400 mx-auto" />
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t.patient.gateTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {t.patient.gateDesc}
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            {t.common.signInWithGoogle}
          </button>
        </div>
      </div>
    );
  }

  const statusColorClass = (status: string) => {
    if (status === 'completed' || status === 'confirmed' || status === 'resolved') {
      return 'text-emerald-700 dark:text-emerald-400';
    }
    if (status === 'arrived') {
      return 'text-sky-700 dark:text-sky-400';
    }
    if (status === 'pending' || status === 'open' || status === 'investigating') {
      return 'text-amber-700 dark:text-amber-400';
    }
    return 'text-red-700 dark:text-red-400';
  };

  const totalFavoritesCount = favoriteDoctors.length + favoriteClinics.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Workspace Navigation (240px–260px) */}
        <aside className="lg:w-64 shrink-0 space-y-2 no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-1">
              {t.patient.portalLabel}
            </p>
            <button
              type="button"
              onClick={() => setSubTab('appointments')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-start ${
                subTab === 'appointments'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{t.patient.tabAppointments}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('favorites')}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-start ${
                subTab === 'favorites'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 shrink-0" />
                <span>{t.patient.tabFavorites}</span>
              </span>
              {totalFavoritesCount > 0 && (
                <span className="font-mono tabular-nums text-xs font-bold text-rose-700 dark:text-rose-400">
                  {totalFavoritesCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSubTab('reminders')}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-start ${
                subTab === 'reminders'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 shrink-0" />
                <span>{t.patient.tabReminders}</span>
              </span>
              {upcoming24hList.length > 0 && (
                <span className="font-mono tabular-nums text-xs font-bold text-amber-700 dark:text-amber-400">
                  {upcoming24hList.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSubTab('ehr')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-start ${
                subTab === 'ehr'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FileHeart className="w-4 h-4 shrink-0" />
              <span>{t.patient.tabEhr}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('messages')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-start ${
                subTab === 'messages'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquareText className="w-4 h-4 shrink-0" />
              <span>{t.patient.tabMessages}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('consent')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-start ${
                subTab === 'consent'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>{t.patient.tabConsent}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('complaints')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-start ${
                subTab === 'complaints'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquareWarning className="w-4 h-4 shrink-0" />
              <span>{t.patient.tabComplaints}</span>
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 space-y-6">
          {feedbackMsg && (
            <div
              className={`p-3.5 rounded-xl border text-sm flex items-center justify-between gap-3 ${
                feedbackMsg.type === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}
            >
              <span>{feedbackMsg.text}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                className="p-1 hover:opacity-70 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {subTab === 'favorites' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t.patient.favoritesTitle}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t.patient.favoritesDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigatePortal('directory')}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.patient.browseDirectory}
                </button>
              </div>

              {favoriteDoctors.length === 0 && favoriteClinics.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
                  <Heart className="w-10 h-10 text-rose-400 mx-auto" />
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {t.patient.noFavoritesTitle}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {t.patient.noFavoritesDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigatePortal('directory')}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    {t.patient.browseDirectory}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {favoriteDoctors.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                        {t.patient.favoriteDoctorsTitle} ({favoriteDoctors.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favoriteDoctors.map((doc) => (
                          <div
                            key={doc.uid}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {doc.fullName}
                                </h4>
                                <p className="text-xs font-semibold text-teal-800 dark:text-teal-400">
                                  {translateSpecialty(doc.specialty, lang)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => onToggleFavoriteDoctor(doc.uid)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold cursor-pointer shrink-0"
                              >
                                <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400" />
                                <span>{t.patient.removeFavoriteBtn}</span>
                              </button>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                              <p className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                                <span className="truncate">
                                  {doc.workplaceName} · {translateState(doc.state, lang)} ·{' '}
                                  {translateLocality(doc.locality, lang)}
                                </span>
                              </p>
                            </div>
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                              <span className="font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100">
                                {formatSdg(doc.consultationFeeSdg, lang)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onNavigatePortal('directory')}
                                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                              >
                                {t.directory.bookAppointmentBtn}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {favoriteClinics.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                        {t.patient.favoriteClinicsTitle} ({favoriteClinics.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favoriteClinics.map((clinic) => (
                          <div
                            key={clinic.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {clinic.name}
                                </h4>
                                <p className="text-xs font-semibold text-teal-800 dark:text-teal-400 flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>{getCenterTypeLabel(clinic.centerType, lang)}</span>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => onToggleFavoriteClinic(clinic.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold cursor-pointer shrink-0"
                              >
                                <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400" />
                                <span>{t.patient.removeFavoriteBtn}</span>
                              </button>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                              <span className="truncate">
                                {translateState(clinic.state, lang)} ·{' '}
                                {translateLocality(clinic.locality, lang)}
                              </span>
                            </p>
                            {clinic.services.length > 0 && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                {t.directory.servicesPrefix}{' '}
                                {clinic.services.slice(0, 3).join(lang === 'ar' ? '، ' : ', ')}
                              </p>
                            )}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                {clinic.ratingAvg.toFixed(1)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onNavigatePortal('directory')}
                                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                              >
                                {t.patient.browseDirectory}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {subTab === 'reminders' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t.patient.remindersTitle}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.patient.remindersDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleReminders(!remindersEnabled)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                    remindersEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {remindersEnabled ? t.patient.toastOnBtn : t.patient.toastOffBtn}
                </button>
              </div>

              {/* Dark Mode Theme Preference Card (persisted to Firebase) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-teal-700 dark:text-amber-400">
                    {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      {t.patient.darkModeSectionTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.patient.darkModeSectionDesc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={darkMode}
                  onClick={() => onToggleDarkMode(!darkMode)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                    darkMode
                      ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span>{darkMode ? t.patient.darkModeOnLabel : t.patient.darkModeOffLabel}</span>
                </button>
              </div>

              {/* 30-Minute Web Push Notification Settings Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0 text-rose-700 dark:text-rose-300">
                    {webPushEnabled && webPushPermission === 'granted' ? (
                      <Bell className="w-5 h-5" />
                    ) : (
                      <BellOff className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                        {t.patient.push30MinTitle}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                          webPushPermission === 'unsupported'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            : webPushPermission === 'denied'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : webPushEnabled && webPushPermission === 'granted'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {webPushPermission === 'unsupported'
                          ? t.patient.pushUnsupportedBadge
                          : webPushPermission === 'denied'
                          ? t.patient.pushBlockedBadge
                          : webPushEnabled && webPushPermission === 'granted'
                          ? t.patient.pushEnabledBadge
                          : t.patient.pushEnableBtn}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.patient.push30MinDesc}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleWebPush(!(webPushEnabled && webPushPermission === 'granted'))}
                    disabled={webPushPermission === 'unsupported'}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border cursor-pointer disabled:opacity-50 ${
                      webPushEnabled && webPushPermission === 'granted'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-teal-700 hover:bg-teal-800 text-white border-teal-700'
                    }`}
                  >
                    {webPushEnabled && webPushPermission === 'granted'
                      ? t.patient.pushEnabledBadge
                      : t.patient.pushEnableBtn}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onSendTestWebNotification();
                      setFeedbackMsg({ type: 'ok', text: t.patient.pushTestSentMsg });
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    {t.patient.pushTestBtn}
                  </button>
                </div>
              </div>

              {/* Linked Phone & WhatsApp Notification Settings Card */}
              <form
                onSubmit={handleSaveWhatsappPrefs}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                        {t.patient.waCardTitle}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.patient.waCardDesc}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border self-start sm:self-auto ${
                      userProfile?.whatsappNotificationsEnabled &&
                      normalizeSudanWhatsappDigits(userProfile?.phone)
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {userProfile?.whatsappNotificationsEnabled &&
                    normalizeSudanWhatsappDigits(userProfile?.phone)
                      ? t.patient.waLinkedBadge
                      : t.patient.waNotLinkedBadge}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="patient-wa-phone"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t.patient.waPhoneLabel}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="patient-wa-phone"
                        type="tel"
                        dir="ltr"
                        value={waPhoneInput}
                        onChange={(e) => setWaPhoneInput(e.target.value)}
                        placeholder="+249 91 234 5678"
                        className="w-full ps-9 pe-3 py-2.5 text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700 text-left"
                      />
                    </div>
                    {waPhoneInput.trim() && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {normalizeSudanWhatsappDigits(waPhoneInput)
                          ? `${t.patient.waPhoneValidPrefix} +${normalizeSudanWhatsappDigits(
                              waPhoneInput
                            )}`
                          : t.patient.waPhoneInvalid}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waEnabled}
                        onChange={(e) => setWaEnabled(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-emerald-700 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="block text-slate-900 dark:text-slate-100">{t.patient.waCheckboxTitle}</strong>
                        {t.patient.waCheckboxDesc}
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remindersEnabled}
                        onChange={(e) => onToggleReminders(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-teal-700 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="block text-slate-900 dark:text-slate-100">
                          {t.patient.toastCheckboxTitle}
                        </strong>
                        {t.patient.toastCheckboxDesc}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingWa}
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {savingWa ? t.common.saving : t.patient.savePhoneAndPrefs}
                  </button>
                </div>
              </form>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t.patient.upcoming24hHeader} {upcoming24hList.length}
                  </h3>
                </div>
                {upcoming24hList.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-600 dark:text-slate-400 space-y-3">
                    <Bell className="w-8 h-8 text-slate-400 mx-auto" />
                    <p>{t.patient.noUpcoming24h}</p>
                    {upcomingFutureList.length > 0 && (() => {
                      const nextItem = upcomingFutureList[0];
                      const nextMsg = buildWhatsappReminderMessage({
                        doctorName: nextItem.appointment.doctorName,
                        clinicName: nextItem.appointment.clinicName,
                        appointmentDate: nextItem.appointment.appointmentDate,
                        timeSlot: nextItem.appointment.timeSlot,
                        msRemaining: nextItem.msRemaining,
                        lang,
                      });
                      const nextWaUrl = buildWhatsappDispatchUrl(
                        userProfile?.phone || waPhoneInput,
                        nextMsg
                      );
                      return (
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onPreviewReminderToast(
                                nextItem.appointment,
                                nextItem.msRemaining
                              )
                            }
                            className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            {t.patient.previewNearestToast}
                          </button>
                          {nextWaUrl && (
                            <a
                              href={nextWaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{t.patient.sendViaWhatsapp}</span>
                            </a>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  upcoming24hList.map(({ appointment, msRemaining }) => {
                    const msg = buildWhatsappReminderMessage({
                      doctorName: appointment.doctorName,
                      clinicName: appointment.clinicName,
                      appointmentDate: appointment.appointmentDate,
                      timeSlot: appointment.timeSlot,
                      msRemaining,
                      lang,
                    });
                    const waUrl = buildWhatsappDispatchUrl(
                      userProfile?.phone || waPhoneInput,
                      msg
                    );
                    const isCopied = copiedAptId === appointment.id;

                    return (
                      <div
                        key={appointment.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                            {appointment.doctorName} ·{' '}
                            {translateSpecialty(appointment.doctorSpecialty, lang)}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2">
                            <CalendarClock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                            <span className="font-mono tabular-nums">
                              {appointment.appointmentDate}
                            </span>
                            <span>·</span>
                            <span>{translateTimeSlot(appointment.timeSlot, lang)}</span>
                            <span>·</span>
                            <span className="font-semibold text-amber-800 dark:text-amber-300">
                              {formatRemainingTime(msRemaining, lang)}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onPreviewReminderToast(appointment, msRemaining)}
                            className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap"
                          >
                            {t.patient.showAppToast}
                          </button>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{t.patient.sendViaWhatsapp}</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopyReminderMessage(appointment, msRemaining)}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                                <span>{t.patient.copied}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{t.patient.copyReminderText}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {subTab === 'appointments' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t.patient.appointmentsTitle}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t.patient.appointmentsDesc}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadJson('appointments')}
                    className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <FileJson className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span>{t.patient.downloadAppointmentsJsonBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPdfModal(true)}
                    className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Download className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span>{t.patient.downloadAppointmentsPdfBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigatePortal('directory')}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {t.patient.bookNewAppointment}
                  </button>
                </div>
              </div>

              {upcoming24hList.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                      <p className="font-bold text-sm">
                        {t.patient.upcoming24hAlertTitle}{' '}
                        <span className="font-mono tabular-nums">
                          ({upcoming24hList.length})
                        </span>
                      </p>
                      <p>
                        {t.patient.nearestAppointmentLabel}{' '}
                        {upcoming24hList[0].appointment.doctorName} (
                        {translateTimeSlot(upcoming24hList[0].appointment.timeSlot, lang)}) —{' '}
                        {formatRemainingTime(upcoming24hList[0].msRemaining, lang)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!(webPushEnabled && webPushPermission === 'granted') &&
                      webPushPermission !== 'unsupported' && (
                        <button
                          type="button"
                          onClick={() => onToggleWebPush(true)}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap"
                        >
                          {t.patient.pushEnableBtn}
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() =>
                        onPreviewReminderToast(
                          upcoming24hList[0].appointment,
                          upcoming24hList[0].msRemaining
                        )
                      }
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      {t.patient.showVisualAlert}
                    </button>
                  </div>
                </div>
              )}

              {/* Today's Digital Arrival Check-In Quick Panel */}
              {todayCheckInAppointments.length > 0 && (
                <div className="bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/60 border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t.patient.todayCheckInCardTitle}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {t.patient.todayCheckInCardDesc}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {todayCheckInAppointments.map((apt) => {
                      const arrivedTime = formatCheckInTime(apt.checkedInAt, lang);
                      const isCheckingIn = checkingInId === apt.id;
                      return (
                        <div
                          key={apt.id}
                          className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {apt.doctorName}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                              {apt.clinicName || t.common.privateClinic} ·{' '}
                              {translateTimeSlot(apt.timeSlot, lang)}
                            </p>
                            {apt.status === 'arrived' && (
                              <p className="text-[11px] font-semibold text-sky-800 dark:text-sky-300 flex items-center gap-1 pt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {t.patient.waitingDoctorNotice}
                                  {arrivedTime ? ` (${arrivedTime})` : ''}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleOpenAppointmentQr(apt)}
                              className="px-2.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>{t.patient.appointmentQrBtn}</span>
                            </button>
                            {apt.status === 'arrived' ? (
                              <span className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-bold rounded-lg whitespace-nowrap inline-flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{t.patient.checkedInBadge}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isCheckingIn}
                                onClick={() => handleCheckInAppointment(apt)}
                                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50 whitespace-nowrap inline-flex items-center gap-1.5"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                <span>
                                  {isCheckingIn ? t.patient.checkingInBtn : t.patient.checkInBtn}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Patient Loyalty Points & Tier Progress Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-teal-800 dark:text-teal-400">
                        {t.patient.loyaltyHeader} {pointsSummary.levelNumber} /{' '}
                        {POINT_TIER_THRESHOLDS.length}
                      </p>
                      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                        {pointsSummary.currentTier.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 self-start sm:self-auto">
                    <span className="font-mono tabular-nums text-2xl font-bold text-teal-800 dark:text-teal-400">
                      {pointsSummary.totalPoints}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t.patient.loyaltyUnit}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>
                      {pointsSummary.nextTier
                        ? `${t.patient.progressTowards} "${pointsSummary.nextTier.name}" (${pointsSummary.nextTier.minPoints})`
                        : t.patient.maxTierReached}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                      {pointsSummary.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-700 dark:bg-teal-500 transition-all duration-300 rounded-full"
                      style={{ width: `${pointsSummary.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {pointsSummary.visitCount} {t.patient.visitsPointsSummary} (+
                      {pointsSummary.visitPoints}) · {pointsSummary.reviewCount}{' '}
                      {t.patient.reviewsPointsSummary} (+{pointsSummary.reviewPoints})
                    </span>
                    {pointsSummary.nextTier && (
                      <span className="font-semibold text-teal-800 dark:text-teal-400 font-mono tabular-nums">
                        {t.patient.pointsRemainingPrefix
                          ? `${t.patient.pointsRemainingPrefix} `
                          : ''}
                        {pointsSummary.pointsRemaining} {t.patient.pointsRemainingSuffix}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Annual Monthly Medical Visits Recharts Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      {t.patient.annualActivityTitle} {selectedVisitYear}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.patient.annualActivityDesc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <label
                      htmlFor="patient-visit-year"
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap"
                    >
                      {t.patient.yearLabel}
                    </label>
                    <select
                      id="patient-visit-year"
                      value={selectedVisitYear}
                      onChange={(e) => setSelectedVisitYear(Number(e.target.value))}
                      className="px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      {availableVisitYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.patient.totalYearVisits} ({selectedVisitYear})
                    </p>
                    <p className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {yearlyActivitySummary.total}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.patient.completedVisits}
                    </p>
                    <p className="font-mono tabular-nums text-xl font-bold text-teal-800 dark:text-teal-400 mt-1">
                      {yearlyActivitySummary.completed}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.patient.scheduledVisits}
                    </p>
                    <p className="font-mono tabular-nums text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                      {yearlyActivitySummary.scheduled}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.patient.peakMonth}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1.5 font-mono tabular-nums">
                      {yearlyActivitySummary.peakMonth}
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyVisitsChartData}
                      margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? '#334155' : '#E2E8F0'}
                      />
                      <XAxis
                        dataKey="month"
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
                        dataKey="completed"
                        name={t.patient.chartCompleted}
                        stackId="visits"
                        fill="#0F766E"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="scheduled"
                        name={t.patient.chartScheduled}
                        stackId="visits"
                        fill="#D97706"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {yearlyActivitySummary.total === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    {t.patient.noYearVisits}
                  </p>
                )}
              </div>

              {/* Completed Appointments Pending Review */}
              {unreviewedCompletedAppointments.length > 0 && (
                <div className="bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-bold text-teal-950 dark:text-teal-200 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {t.patient.pendingReviewsTitle} ({unreviewedCompletedAppointments.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unreviewedCompletedAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-lg p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {apt.doctorName}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {apt.clinicName || t.common.privateClinic} ·{' '}
                            <span className="font-mono tabular-nums">{apt.appointmentDate}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewTarget(apt);
                            setReviewRating(5);
                            setClinicRating(5);
                            setReviewComment('');
                            setClinicComment('');
                          }}
                          className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {t.patient.rateDoctorAndClinic}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {appointments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
                  <Calendar className="w-9 h-9 text-slate-400 mx-auto" />
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {t.patient.noAppointmentsTitle}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t.patient.noAppointmentsDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigatePortal('directory')}
                    className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    {t.patient.browseDirectory}
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-start">
                            {t.patient.colDoctorSpecialty}
                          </th>
                          <th className="py-3 px-4 font-semibold text-start">
                            {t.patient.colCenterState}
                          </th>
                          <th className="py-3 px-4 font-semibold text-start">
                            {t.patient.colDateTime}
                          </th>
                          <th className="py-3 px-4 font-semibold text-start">
                            {t.patient.colTypeFee}
                          </th>
                          <th className="py-3 px-4 font-semibold text-start">
                            {t.patient.colStatus}
                          </th>
                          <th className="py-3 px-4 font-semibold text-start">
                            {t.patient.colActions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {appointments.map((apt) => {
                          const arrivedTime = formatCheckInTime(apt.checkedInAt, lang);
                          const isCheckingIn = checkingInId === apt.id;
                          return (
                            <tr
                              key={apt.id}
                              className={
                                apt.status === 'arrived'
                                  ? 'bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-50/80 dark:hover:bg-sky-950/50'
                                  : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                              }
                            >
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {apt.doctorName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {translateSpecialty(apt.doctorSpecialty, lang)}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                                <p>{apt.clinicName || t.common.privateClinic}</p>
                                <p>
                                  {translateState(apt.state, lang)} ·{' '}
                                  {translateLocality(apt.locality, lang)}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                <p>{apt.appointmentDate}</p>
                                <p className="font-sans text-slate-500 dark:text-slate-400">
                                  {translateTimeSlot(apt.timeSlot, lang)}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 text-xs">
                                <p className="text-slate-700 dark:text-slate-300">
                                  {getVisitTypeLabel(apt.visitType, lang)}
                                </p>
                                <p className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                                  {formatSdg(apt.feeSdg, lang)}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 text-xs font-semibold">
                                <span className={statusColorClass(apt.status)}>
                                  {getAppointmentStatusLabel(apt.status, lang)}
                                </span>
                                {apt.status === 'arrived' && arrivedTime && (
                                  <p className="text-[11px] font-normal text-sky-700 dark:text-sky-400 mt-0.5 font-mono tabular-nums">
                                    {t.patient.checkedInAtPrefix} {arrivedTime}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                    <button
                                      type="button"
                                      disabled={isCheckingIn}
                                      onClick={() => handleCheckInAppointment(apt)}
                                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50 whitespace-nowrap inline-flex items-center gap-1"
                                    >
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span>
                                        {isCheckingIn
                                          ? t.patient.checkingInBtn
                                          : t.patient.checkInBtn}
                                      </span>
                                    </button>
                                  )}
                                  {apt.status === 'arrived' && (
                                    <span className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-semibold rounded-lg whitespace-nowrap inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>{t.patient.checkedInBadge}</span>
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAppointmentQr(apt)}
                                    className="px-2.5 py-1.5 text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg cursor-pointer whitespace-nowrap inline-flex items-center gap-1 font-semibold"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>{t.patient.appointmentQrBtn}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChatInitialDoctorUid(apt.doctorUid);
                                      setChatInitialAptRef(
                                        lang === 'en'
                                          ? `Inquiry about ${apt.appointmentDate} (${translateTimeSlot(apt.timeSlot, 'en')})`
                                          : `استفسار حول موعد ${apt.appointmentDate} (${apt.timeSlot})`
                                      );
                                      setSubTab('messages');
                                    }}
                                    className="px-3 py-1.5 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                                  >
                                    <MessageSquareText className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                                    <span>{t.patient.messageDoctorBtn}</span>
                                  </button>
                                  {(apt.status === 'pending' ||
                                    apt.status === 'confirmed' ||
                                    apt.status === 'arrived') && (
                                    <button
                                      type="button"
                                      onClick={() => handleCancelAppointment(apt)}
                                      className="px-3 py-1.5 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg cursor-pointer whitespace-nowrap"
                                    >
                                      {t.common.cancel}
                                    </button>
                                  )}
                                  {apt.status === 'completed' && !apt.reviewed && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReviewTarget(apt);
                                        setReviewRating(5);
                                        setClinicRating(5);
                                        setReviewComment('');
                                        setClinicComment('');
                                      }}
                                      className="px-3 py-1.5 text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-lg cursor-pointer whitespace-nowrap"
                                    >
                                      {t.patient.rateDoctorAndClinic}
                                    </button>
                                  )}
                                  {apt.reviewed && (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-medium whitespace-nowrap">
                                      {t.patient.reviewedLabel}
                                    </span>
                                  )}
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

              {/* My Submitted Reviews List */}
              {myReviews.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {t.patient.myReviewsTitle} ({myReviews.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {myReviews.map((rev) => {
                      const matchedApt = appointments.find((a) => a.id === rev.appointmentId);
                      return (
                        <div
                          key={rev.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 bg-slate-50/70 dark:bg-slate-800/60 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {matchedApt?.doctorName || (lang === 'en' ? 'Approved Doctor' : 'طبيب معتمد')}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              {rev.rating} / 5
                            </span>
                          </div>
                          {rev.comment && (
                            <p className="text-slate-600 dark:text-slate-400">{rev.comment}</p>
                          )}
                          {typeof rev.clinicRating === 'number' && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span>
                                  {t.patient.clinicRatingLabel} (
                                  {matchedApt?.clinicName || t.common.privateClinic})
                                </span>
                                <span className="font-mono tabular-nums font-semibold">
                                  {rev.clinicRating} / 5
                                </span>
                              </div>
                              {rev.clinicComment && (
                                <p className="text-slate-600 dark:text-slate-400">
                                  {rev.clinicComment}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {subTab === 'ehr' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t.patient.ehrTitle}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.patient.ehrDesc}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleOpenEhrQr}
                    className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{t.patient.ehrQrBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Printer className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span>{t.patient.printEhrBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadJson('ehr')}
                    className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <FileJson className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span>{t.patient.exportJsonBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPdfModal(true)}
                    className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.patient.exportPdfBtn}</span>
                  </button>
                </div>
              </div>

              <div id="patient-ehr-printable" className="space-y-6">
                {/* Print-only patient medical summary banner */}
                <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-teal-800">
                        {t.patient.printReportHeader}
                      </p>
                      <h1 className="font-display text-xl font-bold text-slate-900 mt-1">
                        {patientProfile?.fullName ||
                          userProfile?.displayName ||
                          firebaseUser.displayName}
                      </h1>
                    </div>
                    <div className="text-xs text-slate-600 text-end font-mono tabular-nums">
                      <p>
                        {t.patient.printGeneratedLabel}{' '}
                        {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SD')}
                      </p>
                      <p>
                        {t.patient.bloodTypeLabel}:{' '}
                        {bloodType === 'unknown' ? t.common.notSpecified : bloodType}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs text-slate-700 pt-2 border-t border-slate-200">
                    <p>
                      <strong>{t.patient.dobLabel}:</strong>{' '}
                      {dateOfBirth || t.common.notSpecified}
                    </p>
                    <p>
                      <strong>{t.patient.allergiesLabel}:</strong>{' '}
                      {allergiesText || t.pdf.noAllergies}
                    </p>
                    <p>
                      <strong>{t.patient.chronicLabel}:</strong>{' '}
                      {chronicText || t.pdf.noChronic}
                    </p>
                  </div>
                </div>

                {/* EHR Section Filter Bar */}
                <div className="no-print flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg w-fit">
                  {[
                    { id: 'all', label: t.patient.ehrFilterAll },
                    {
                      id: 'medications',
                      label: `${t.patient.ehrFilterMedications} (${medications.length})`,
                    },
                    {
                      id: 'visits',
                      label: `${t.patient.ehrFilterVisits} (${pastVisitsTimeline.length})`,
                    },
                    {
                      id: 'reports',
                      label: `${t.patient.ehrFilterReports} (${diagnosticReports.length})`,
                    },
                    {
                      id: 'vitals',
                      label: `${t.patient.ehrFilterVitals} (${vitalsTimelineAsc.length})`,
                    },
                    { id: 'profile', label: t.patient.ehrFilterProfile },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEhrSection(item.id as EhrSectionFilter)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        ehrSection === item.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* 0. Current Medications & Dose Alerts Section */}
                {(ehrSection === 'all' || ehrSection === 'medications') && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Pill className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                          {t.patient.medicationsSectionTitle} ({medications.length})
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t.patient.medicationsSectionDesc}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddMedForm((prev) => !prev)}
                        className="no-print px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.patient.medicationsAddToggleBtn}</span>
                      </button>
                    </div>

                    {/* Prominent Next Active Dose Card */}
                    <div
                      className={`rounded-xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        earliestNextDose?.alert.isPreDose15Min ||
                        earliestNextDose?.alert.state === 'due_now'
                          ? 'bg-amber-50 dark:bg-amber-950/35 border-amber-300 dark:border-amber-700'
                          : 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-200">
                            <Clock className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                            <span>{t.patient.nextDoseCardTitle}</span>
                          </span>
                          {earliestNextDose?.alert.isPreDose15Min && (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-600 text-white rounded-md">
                              {t.patient.nextDosePre15Badge}
                            </span>
                          )}
                          <span className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-300">
                            ({t.patient.nextDoseTakenTodayCount} {activeMedsCount})
                          </span>
                        </div>

                        {earliestNextDose ? (
                          <div className="space-y-1">
                            <p className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                              {earliestNextDose.medication.name}
                              {earliestNextDose.medication.dosage && (
                                <span className="text-xs font-sans font-medium text-slate-600 dark:text-slate-300 ms-2">
                                  ({earliestNextDose.medication.dosage})
                                </span>
                              )}
                            </p>
                            <p className="text-xs font-semibold text-teal-800 dark:text-teal-300 flex flex-wrap items-center gap-2">
                              <span className="font-mono tabular-nums px-2 py-0.5 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-700 rounded">
                                {earliestNextDose.alert.nextTime}
                              </span>
                              <span>
                                {formatMedicationCountdown(
                                  earliestNextDose.alert.diffMinutes ?? 0,
                                  Boolean(earliestNextDose.alert.tomorrow),
                                  lang
                                )}
                              </span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {t.patient.nextDoseNone}
                          </p>
                        )}
                      </div>

                      {earliestNextDose && (
                        <div className="no-print flex flex-wrap items-center gap-2 shrink-0">
                          {earliestNextDose.alert.doseKey &&
                            (earliestNextDose.alert.state === 'due_now' ||
                              earliestNextDose.alert.isPreDose15Min) && (
                              <button
                                type="button"
                                disabled={busyMedId === earliestNextDose.medication.id}
                                onClick={() =>
                                  onMarkMedicationTaken(
                                    earliestNextDose.medication,
                                    earliestNextDose.alert.doseKey!
                                  )
                                }
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{t.patient.medicationsMarkTakenBtn}</span>
                              </button>
                            )}
                          <button
                            type="button"
                            onClick={() => onPreviewMedicationToast(earliestNextDose.medication)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>{t.patient.medicationsPreviewAlertBtn}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Urgent Due Dose Alert Banner */}
                    {dueMedicationsList.length > 0 && (
                      <div className="no-print bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                          <Bell className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                          <span>{t.patient.medicationsActiveAlertBanner}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dueMedicationsList.map(({ med, alert }) => (
                            <div
                              key={`due_${med.id}`}
                              className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs"
                            >
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {med.name}
                              </span>
                              {alert.nextTime && (
                                <span className="font-mono tabular-nums text-amber-800 dark:text-amber-300 font-semibold">
                                  ({alert.nextTime})
                                </span>
                              )}
                              {alert.doseKey && (
                                <button
                                  type="button"
                                  disabled={busyMedId === med.id}
                                  onClick={() => onMarkMedicationTaken(med, alert.doseKey!)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold rounded cursor-pointer disabled:opacity-50"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>{t.patient.medicationsMarkTakenBtn}</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Medication Form */}
                    {showAddMedForm && (
                      <form
                        onSubmit={handleAddMedication}
                        className="no-print bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              {t.patient.medicationsNameLabel}
                            </label>
                            <input
                              type="text"
                              required
                              value={medName}
                              onChange={(e) => setMedName(e.target.value)}
                              placeholder={t.patient.medicationsNamePlaceholder}
                              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              {t.patient.medicationsDosageLabel}
                            </label>
                            <input
                              type="text"
                              value={medDosage}
                              onChange={(e) => setMedDosage(e.target.value)}
                              placeholder={t.patient.medicationsDosagePlaceholder}
                              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              {t.patient.medicationsFrequencyLabel}
                            </label>
                            <input
                              type="text"
                              value={medFrequency}
                              onChange={(e) => setMedFrequency(e.target.value)}
                              placeholder={t.patient.medicationsFrequencyPlaceholder}
                              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              {t.patient.medicationsStatusLabel}
                            </label>
                            <select
                              value={medStatus}
                              onChange={(e) => setMedStatus(e.target.value as MedicationStatus)}
                              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                            >
                              <option value="active">{t.patient.medicationsStatusActive}</option>
                              <option value="paused">{t.patient.medicationsStatusPaused}</option>
                              <option value="stopped">{t.patient.medicationsStatusStopped}</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              {t.patient.medicationsTimesLabel}
                            </label>
                            <input
                              type="text"
                              value={medTimesText}
                              onChange={(e) => setMedTimesText(e.target.value)}
                              placeholder="08:00, 14:00, 20:00"
                              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-700"
                            />
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {['06:00', '08:00', '14:00', '20:00', '22:00'].map((preset) => {
                                const selected = normalizeScheduleTimes(medTimesText).includes(preset);
                                return (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handleToggleTimePreset(preset)}
                                    className={`px-2 py-1 text-[11px] font-mono rounded border cursor-pointer ${
                                      selected
                                        ? 'bg-teal-700 text-white border-teal-700'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    {preset}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              {t.patient.medicationsTimesHint}
                            </p>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {t.patient.medicationsNotesLabel}
                              </label>
                              <input
                                type="text"
                                value={medNotes}
                                onChange={(e) => setMedNotes(e.target.value)}
                                placeholder={t.patient.medicationsNotesPlaceholder}
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                              />
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={medReminderEnabled}
                                onChange={(e) => setMedReminderEnabled(e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600 text-teal-700 focus:ring-teal-700"
                              />
                              <span className="font-medium">{t.patient.medicationsReminderCheck}</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddMedForm(false)}
                            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {t.common.cancel}
                          </button>
                          <button
                            type="submit"
                            disabled={savingMed}
                            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                          >
                            {savingMed ? t.common.saving : t.patient.medicationsSaveBtn}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Untracked Medications from Doctor Reports */}
                    {prescribedMedSuggestions.length > 0 && (
                      <div className="no-print bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800 rounded-xl p-4 space-y-2.5">
                        <div>
                          <p className="text-xs font-bold text-teal-950 dark:text-teal-200">
                            {t.patient.medicationsFromReportsTitle}
                          </p>
                          <p className="text-[11px] text-teal-800 dark:text-teal-300">
                            {t.patient.medicationsFromReportsDesc}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {prescribedMedSuggestions.map((sugg) => {
                            const key = `import_${sugg.recordId}_${sugg.name}`;
                            return (
                              <button
                                key={key}
                                type="button"
                                disabled={busyMedId === key}
                                onClick={() => handleImportPrescribedMedication(sugg)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-slate-800 border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                              >
                                <Plus className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                                <span>{sugg.name}</span>
                                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                  ({t.patient.medicationsImportBtn})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Tracked Medications List */}
                    {medications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        {t.patient.medicationsEmpty}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {medications.map((med) => {
                          const doseAlert = getMedicationDoseAlert(med, new Date());
                          const isBusy = busyMedId === med.id;
                          const statusBadgeClass =
                            med.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : med.status === 'paused'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';

                          return (
                            <div
                              key={med.id}
                              className={`border rounded-xl p-4 space-y-3 transition-colors ${
                                doseAlert.state === 'due_now'
                                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20'
                                  : med.status === 'stopped'
                                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 opacity-85'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-0.5">
                                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {med.name}
                                  </h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {[med.dosage, med.frequency].filter(Boolean).join(' · ') ||
                                      t.common.notSpecified}
                                  </p>
                                  {med.prescribedBy && (
                                    <p className="text-[11px] text-teal-800 dark:text-teal-400">
                                      {t.patient.medicationsPrescribedByLabel} {med.prescribedBy}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border whitespace-nowrap ${statusBadgeClass}`}
                                >
                                  {getMedicationStatusLabel(med.status, lang)}
                                </span>
                              </div>

                              {/* Dose Schedule & Live Alert Status */}
                              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-lg p-2.5 space-y-1.5 text-xs">
                                <div className="flex flex-wrap items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                  <Clock className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                                  {med.scheduleTimes && med.scheduleTimes.length > 0 ? (
                                    med.scheduleTimes.map((timeStr) => (
                                      <span
                                        key={timeStr}
                                        className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono tabular-nums text-[11px] text-slate-800 dark:text-slate-200"
                                      >
                                        {timeStr}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-500 dark:text-slate-400">
                                      {t.patient.medicationsNoSchedule}
                                    </span>
                                  )}
                                </div>

                                {med.status === 'active' && doseAlert.nextTime && (
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                    <span
                                      className={`font-semibold ${
                                        doseAlert.state === 'due_now'
                                          ? 'text-amber-800 dark:text-amber-300'
                                          : doseAlert.state === 'taken_today'
                                          ? 'text-emerald-700 dark:text-emerald-400'
                                          : 'text-teal-800 dark:text-teal-300'
                                      }`}
                                    >
                                      {doseAlert.state === 'due_now'
                                        ? `${t.patient.medicationsDueNowBadge} (${doseAlert.nextTime})`
                                        : doseAlert.state === 'taken_today'
                                        ? `${t.patient.medicationsTakenTodayBadge} · ${t.patient.medicationsNextDosePrefix} ${doseAlert.nextTime}`
                                        : `${t.patient.medicationsNextDosePrefix} ${doseAlert.nextTime} (${formatMedicationCountdown(
                                            doseAlert.diffMinutes ?? 0,
                                            Boolean(doseAlert.tomorrow),
                                            lang
                                          )})`}
                                    </span>
                                    {doseAlert.doseKey && doseAlert.state === 'due_now' && (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() =>
                                          onMarkMedicationTaken(med, doseAlert.doseKey!)
                                        }
                                        className="no-print inline-flex items-center gap-1 px-2 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold rounded cursor-pointer disabled:opacity-50"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>{t.patient.medicationsMarkTakenBtn}</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {med.notes && (
                                <p className="text-xs text-slate-600 dark:text-slate-400">{med.notes}</p>
                              )}

                              {/* Controls: Status Updater, Reminder Toggle, Preview, Delete */}
                              <div className="no-print pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                                <select
                                  value={med.status}
                                  disabled={isBusy}
                                  aria-label={t.patient.medicationsStatusLabel}
                                  onChange={(e) =>
                                    handleMedicationStatusChange(
                                      med,
                                      e.target.value as MedicationStatus
                                    )
                                  }
                                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
                                >
                                  <option value="active">{t.patient.medicationsStatusActive}</option>
                                  <option value="paused">{t.patient.medicationsStatusPaused}</option>
                                  <option value="stopped">{t.patient.medicationsStatusStopped}</option>
                                </select>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleToggleMedicationReminder(med)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-md border cursor-pointer disabled:opacity-50 ${
                                      med.reminderEnabled
                                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {med.reminderEnabled ? (
                                      <Bell className="w-3 h-3" />
                                    ) : (
                                      <BellOff className="w-3 h-3" />
                                    )}
                                    <span>
                                      {med.reminderEnabled
                                        ? t.patient.medicationsReminderOn
                                        : t.patient.medicationsReminderOff}
                                    </span>
                                  </button>

                                  {med.status === 'active' && (
                                    <button
                                      type="button"
                                      onClick={() => onPreviewMedicationToast(med)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-md cursor-pointer"
                                    >
                                      <Bell className="w-3 h-3" />
                                      <span>{t.patient.medicationsPreviewAlertBtn}</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleDeleteMedication(med)}
                                    aria-label={t.patient.medicationsDeleteBtn}
                                    title={t.patient.medicationsDeleteBtn}
                                    className="p-1.5 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-md cursor-pointer disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              {/* 1. Past Visits Timeline Table */}
              {(ehrSection === 'all' || ehrSection === 'visits') && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                        {t.patient.pastVisitsTitle}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.patient.pastVisitsDesc}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {pastVisitsTimeline.length} {t.patient.visitsUnit}
                    </span>
                  </div>
                  {pastVisitsTimeline.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
                      {t.patient.noPastVisits}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-start">
                              {t.patient.colVisitDate}
                            </th>
                            <th className="py-3 px-4 font-semibold text-start">
                              {t.patient.colDoctorSpecialty}
                            </th>
                            <th className="py-3 px-4 font-semibold text-start">
                              {t.patient.colClinicLocation}
                            </th>
                            <th className="py-3 px-4 font-semibold text-start">
                              {t.patient.colTypeReason}
                            </th>
                            <th className="py-3 px-4 font-semibold text-start">
                              {t.patient.colReport}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pastVisitsTimeline.map((visit) => (
                            <tr key={visit.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {visit.dateStr}
                                </p>
                                <p className="font-sans text-slate-500 dark:text-slate-400">
                                  {visit.timeLabel}
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {visit.doctorName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {visit.specialty}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                                <p>{visit.clinicName}</p>
                                <p className="text-slate-500 dark:text-slate-400">{visit.location}</p>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                                <p className="font-medium">{visit.visitTypeLabel}</p>
                                <p className="text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                                  {visit.reasonOrTitle}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {visit.hasLinkedReport ? (
                                  <button
                                    type="button"
                                    onClick={() => setEhrSection('reports')}
                                    className="text-teal-800 dark:text-teal-400 hover:underline font-semibold cursor-pointer whitespace-nowrap"
                                  >
                                    {t.patient.viewReportBtn}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500">
                                    {t.patient.completedWord}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Doctor Diagnostic Reports Section */}
              {(ehrSection === 'all' || ehrSection === 'reports') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                        {t.patient.diagnosticReportsTitle} ({diagnosticReports.length})
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.patient.diagnosticReportsDesc}
                      </p>
                    </div>
                  </div>
                  {loading ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-sm text-slate-500 dark:text-slate-400">
                      {t.common.loading}
                    </div>
                  ) : diagnosticReports.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-sm text-slate-600 dark:text-slate-400">
                      {t.patient.noDiagnosticReports}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {diagnosticReports.map((rec) => {
                        const recDate = formatIsoDate(toDateObj(rec.createdAt), t.common.notSpecified);
                        return (
                          <article
                            key={rec.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                              <div>
                                <p className="text-xs font-semibold text-teal-800 dark:text-teal-400">
                                  {getRecordTypeLabel(rec.recordType, lang)} ·{' '}
                                  <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                    {recDate}
                                  </span>
                                </p>
                                <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                  {rec.title}
                                </h4>
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 text-end">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {rec.doctorName}
                                </p>
                                {rec.clinicName && <p>{rec.clinicName}</p>}
                              </div>
                            </div>

                            {rec.chiefComplaint && (
                              <p className="text-xs text-slate-700 dark:text-slate-300">
                                <strong className="font-semibold text-slate-900 dark:text-slate-100">
                                  {t.patient.chiefComplaintLabel}{' '}
                                </strong>
                                {rec.chiefComplaint}
                              </p>
                            )}

                            {rec.diagnosis && (
                              <div className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                <strong className="font-semibold text-teal-900 dark:text-teal-300">
                                  {t.patient.diagnosisLabel}{' '}
                                </strong>
                                {rec.diagnosis}
                              </div>
                            )}

                            {rec.clinicalNotes && (
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {rec.clinicalNotes}
                              </p>
                            )}

                            {rec.medications && rec.medications.length > 0 && (
                              <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 rounded-lg p-3">
                                <strong className="block mb-1 text-slate-900 dark:text-slate-100">
                                  {t.patient.medicationsLabel}
                                </strong>
                                {rec.medications.join(' · ')}
                              </div>
                            )}

                            {rec.vitals && Object.keys(rec.vitals).length > 0 && (
                              <div className="flex flex-wrap gap-4 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 rounded-lg p-3">
                                {rec.vitals.systolic && rec.vitals.diastolic && (
                                  <span>
                                    {t.patient.colBp}: {rec.vitals.systolic}/{rec.vitals.diastolic}
                                  </span>
                                )}
                                {rec.vitals.bloodGlucose && (
                                  <span>
                                    {t.patient.colGlucose}: {rec.vitals.bloodGlucose}
                                  </span>
                                )}
                                {rec.vitals.heartRate && (
                                  <span>
                                    {t.patient.colHeartRate}: {rec.vitals.heartRate}
                                  </span>
                                )}
                                {rec.vitals.weightKg && (
                                  <span>
                                    {t.patient.weightLabel}: {rec.vitals.weightKg} {t.pdf.kgUnit}
                                  </span>
                                )}
                              </div>
                            )}

                            {rec.nutritionPlan &&
                              (rec.nutritionPlan.goal || rec.nutritionPlan.mealGuidelines) && (
                                <div className="text-xs text-slate-700 dark:text-slate-300 bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800 rounded-lg p-3 space-y-1">
                                  <p className="font-semibold text-teal-900 dark:text-teal-300">
                                    {t.pdf.nutritionPrefix}
                                    {rec.nutritionPlan.dailyCalories
                                      ? ` · ${rec.nutritionPlan.dailyCalories} ${
                                          lang === 'en' ? 'kcal/day' : 'سعرة يومياً'
                                        }`
                                      : ''}
                                  </p>
                                  {rec.nutritionPlan.goal && (
                                    <p>
                                      {t.doctor.nutritionGoalLabel}: {rec.nutritionPlan.goal}
                                    </p>
                                  )}
                                  {rec.nutritionPlan.mealGuidelines && (
                                    <p>
                                      {t.doctor.mealGuidelinesLabel}:{' '}
                                      {rec.nutritionPlan.mealGuidelines}
                                    </p>
                                  )}
                                  {rec.nutritionPlan.activityPlan && (
                                    <p>
                                      {t.doctor.activityPlanLabel}:{' '}
                                      {rec.nutritionPlan.activityPlan}
                                    </p>
                                  )}
                                </div>
                              )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Health Vitals Timeline (Blood Pressure & Weight Charts + Chronological Table) */}
              {(ehrSection === 'all' || ehrSection === 'vitals') && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <HeartPulse className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                        {t.patient.vitalsTitle}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.patient.vitalsDesc}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {vitalsTimelineAsc.length} {t.patient.readingsCountSuffix}
                    </span>
                  </div>

                  {vitalsTimelineAsc.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                      <p>{t.patient.noVitalsYet}</p>
                      <button
                        type="button"
                        onClick={() => setEhrSection('profile')}
                        className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        {t.patient.addFirstVitalsBtn}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2">
                          <h4 className="font-display text-xs font-bold text-slate-800 dark:text-slate-200">
                            {t.patient.bpChartTitle}
                          </h4>
                          <div className="h-52 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={vitalsTimelineAsc.filter((v) => v.systolic || v.diastolic)}
                                margin={{ top: 8, right: 10, left: 0, bottom: 4 }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke={isDark ? '#334155' : '#E2E8F0'}
                                />
                                <XAxis
                                  dataKey="shortLabel"
                                  tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                                />
                                <YAxis
                                  domain={['auto', 'auto']}
                                  tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                                    borderRadius: '0.5rem',
                                    borderColor: isDark ? '#334155' : '#CBD5E1',
                                    color: isDark ? '#F1F5F9' : '#0F172A',
                                    fontSize: '12px',
                                    direction: dir,
                                    textAlign: dir === 'rtl' ? 'right' : 'left',
                                  }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Line
                                  type="monotone"
                                  dataKey="systolic"
                                  name={t.patient.bpSystolic}
                                  stroke="#DC2626"
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="diastolic"
                                  name={t.patient.bpDiastolic}
                                  stroke="#0284C7"
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2">
                          <h4 className="font-display text-xs font-bold text-slate-800 dark:text-slate-200">
                            {t.patient.weightChartTitle}
                          </h4>
                          <div className="h-52 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={vitalsTimelineAsc.filter((v) => typeof v.weightKg === 'number')}
                                margin={{ top: 8, right: 10, left: 0, bottom: 4 }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke={isDark ? '#334155' : '#E2E8F0'}
                                />
                                <XAxis
                                  dataKey="shortLabel"
                                  tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                                />
                                <YAxis
                                  domain={['auto', 'auto']}
                                  tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#475569' }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                                    borderRadius: '0.5rem',
                                    borderColor: isDark ? '#334155' : '#CBD5E1',
                                    color: isDark ? '#F1F5F9' : '#0F172A',
                                    fontSize: '12px',
                                    direction: dir,
                                    textAlign: dir === 'rtl' ? 'right' : 'left',
                                  }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Line
                                  type="monotone"
                                  dataKey="weightKg"
                                  name={t.patient.weightLabel}
                                  stroke="#0F766E"
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Chronological Vitals Table */}
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-start text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                              <tr>
                                <th className="py-3 px-4 font-semibold text-start">
                                  {t.patient.colDate}
                                </th>
                                <th className="py-3 px-4 font-semibold text-start">
                                  {t.patient.colSourceDesc}
                                </th>
                                <th className="py-3 px-4 font-semibold text-start">
                                  {t.patient.colBp}
                                </th>
                                <th className="py-3 px-4 font-semibold text-start">
                                  {t.patient.colBpStatus}
                                </th>
                                <th className="py-3 px-4 font-semibold text-start">
                                  {t.patient.colWeight}
                                </th>
                                <th className="py-3 px-4 font-semibold text-start">
                                  {t.patient.colDelta}
                                </th>
                                <th className="py-3 px-4 font-semibold text-start">
                                  {t.patient.colGlucose}
                                </th>
                                <th className="py-3 px-4 font-semibold text-start">
                                  {t.patient.colHeartRate}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {vitalsTimelineDesc.map((entry) => {
                                const bpInfo = classifyBloodPressure(
                                  entry.systolic,
                                  entry.diastolic,
                                  t.patient
                                );
                                return (
                                  <tr
                                    key={entry.id}
                                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                  >
                                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                      {entry.dateStr}
                                    </td>
                                    <td className="py-3 px-4 text-xs">
                                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                                        {entry.title}
                                      </p>
                                      <p className="text-slate-500 dark:text-slate-400">
                                        {entry.source}
                                      </p>
                                    </td>
                                    <td className="py-3 px-4 text-xs font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                                      {entry.systolic && entry.diastolic
                                        ? `${entry.systolic}/${entry.diastolic}`
                                        : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-xs font-semibold">
                                      <span
                                        className={
                                          bpInfo.tone === 'normal'
                                            ? 'text-emerald-700 dark:text-emerald-400'
                                            : bpInfo.tone === 'high'
                                            ? 'text-red-700 dark:text-red-400'
                                            : bpInfo.tone === 'warn'
                                            ? 'text-amber-700 dark:text-amber-400'
                                            : 'text-slate-400 dark:text-slate-500'
                                        }
                                      >
                                        {bpInfo.label}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                                      {typeof entry.weightKg === 'number' ? entry.weightKg : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                                      {entry.weightDelta !== null
                                        ? `${entry.weightDelta > 0 ? '+' : ''}${entry.weightDelta} ${t.pdf.kgUnit}`
                                        : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                      {entry.bloodGlucose || '—'}
                                    </td>
                                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                      {entry.heartRate || '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 4. Baseline Medical Data & Self Measurement Forms */}
              {(ehrSection === 'all' || ehrSection === 'profile') && (
                <div className="no-print space-y-6">
                  <form
                    onSubmit={handleSaveProfile}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                        {t.patient.baselineTitle}
                      </h3>
                      {bmiValue && (
                        <span className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {t.patient.bmiLabel} <strong>{bmiValue}</strong>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.patient.fullNameLabel}
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.patient.dobLabel}
                        </label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.patient.bloodTypeLabel}
                        </label>
                        <select
                          value={bloodType}
                          onChange={(e) =>
                            setBloodType(e.target.value as PatientMedicalProfile['bloodType'])
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                        >
                          {BLOOD_TYPES.map((bt) => (
                            <option key={bt} value={bt}>
                              {bt === 'unknown' ? t.common.notSpecified : bt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.patient.genderLabel}
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                        >
                          <option value="male">{t.patient.male}</option>
                          <option value="female">{t.patient.female}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.patient.heightLabel}
                        </label>
                        <input
                          type="number"
                          min={30}
                          max={250}
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.patient.weightInputLabel}
                        </label>
                        <input
                          type="number"
                          min={2}
                          max={400}
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.patient.allergiesLabel}
                        </label>
                        <input
                          type="text"
                          value={allergiesText}
                          onChange={(e) => setAllergiesText(e.target.value)}
                          placeholder={lang === 'en' ? 'e.g. Penicillin, Peanuts' : 'مثال: البنسلين، الفول السوداني'}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.patient.chronicLabel}
                        </label>
                        <input
                          type="text"
                          value={chronicText}
                          onChange={(e) => setChronicText(e.target.value)}
                          placeholder={
                            lang === 'en'
                              ? 'e.g. Type 2 Diabetes, Hypertension'
                              : 'مثال: السكري النوع الثاني، ارتفاع الضغط'
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {t.patient.emergencyLabel}
                        </label>
                        <input
                          type="text"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder={lang === 'en' ? 'Name & phone number' : 'الاسم ورقم الهاتف'}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        {savingProfile ? t.common.saving : t.patient.saveBaselineBtn}
                      </button>
                    </div>
                  </form>

                  {/* Self Measurement Logger */}
                  <form
                    onSubmit={handleSaveMeasurement}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
                  >
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      {t.patient.selfMeasTitle}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {t.patient.measDescLabel}
                        </label>
                        <input
                          type="text"
                          required
                          value={measTitle}
                          onChange={(e) => setMeasTitle(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {t.patient.measSystolicLabel}
                        </label>
                        <input
                          type="number"
                          placeholder="120"
                          value={systolic}
                          onChange={(e) => setSystolic(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {t.patient.measDiastolicLabel}
                        </label>
                        <input
                          type="number"
                          placeholder="80"
                          value={diastolic}
                          onChange={(e) => setDiastolic(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {t.patient.measGlucoseLabel}
                        </label>
                        <input
                          type="number"
                          placeholder="105"
                          value={bloodGlucose}
                          onChange={(e) => setBloodGlucose(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {t.patient.measHrLabel}
                        </label>
                        <input
                          type="number"
                          placeholder="72"
                          value={heartRate}
                          onChange={(e) => setHeartRate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {t.patient.measWeightLabel}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="74"
                          value={measWeight}
                          onChange={(e) => setMeasWeight(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingMeas}
                        className="px-4 py-2 bg-slate-900 dark:bg-teal-700 hover:bg-slate-800 dark:hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        {savingMeas ? t.common.saving : t.patient.addMeasBtn}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              </div>
            </section>
          )}

          {subTab === 'messages' && (
            <ChatWorkspace
              mode="patient"
              currentUserUid={firebaseUser.uid}
              currentUserName={
                patientProfile?.fullName ||
                userProfile?.displayName ||
                firebaseUser.displayName ||
                (lang === 'en' ? 'Patient' : 'مريض')
              }
              contacts={patientChatContacts}
              initialSelectedContactUid={chatInitialDoctorUid}
              initialAppointmentRef={chatInitialAptRef}
              onClearInitialContact={() => {
                setChatInitialDoctorUid(null);
                setChatInitialAptRef('');
              }}
            />
          )}

          {subTab === 'consent' && (
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.patient.consentTitle}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t.patient.consentDesc}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {approvedDoctors.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
                    {t.patient.noConsentDoctors}
                  </div>
                ) : (
                  approvedDoctors.map((docItem) => {
                    const authorized = (patientProfile?.authorizedDoctorUids || []).includes(
                      docItem.uid
                    );
                    return (
                      <div
                        key={docItem.uid}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                            {docItem.fullName}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {translateSpecialty(docItem.specialty, lang)} · {docItem.workplaceName}{' '}
                            · {translateState(docItem.state, lang)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleDoctorConsent(docItem.uid)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                            authorized
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>
                            {authorized ? t.patient.consentAuthorized : t.patient.consentGrant}
                          </span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {subTab === 'complaints' && (
            <section className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.patient.complaintsTitle}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.patient.complaintsDesc}
                </p>
              </div>

              <form
                onSubmit={handleSubmitComplaint}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.patient.complaintTargetLabel}
                    </label>
                    <select
                      value={cmpTargetType}
                      onChange={(e) =>
                        setCmpTargetType(e.target.value as 'doctor' | 'clinic' | 'platform')
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="doctor">{t.patient.complaintTargetDoctor}</option>
                      <option value="clinic">{t.patient.complaintTargetClinic}</option>
                      <option value="platform">{t.patient.complaintTargetPlatform}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.patient.complaintTargetNameLabel}
                    </label>
                    <input
                      type="text"
                      value={cmpTargetName}
                      onChange={(e) => setCmpTargetName(e.target.value)}
                      placeholder={lang === 'en' ? 'Optional' : 'اختياري'}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.patient.complaintSubjectLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={cmpSubject}
                    onChange={(e) => setCmpSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.patient.complaintDetailsLabel}
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={5}
                    value={cmpDescription}
                    onChange={(e) => setCmpDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingCmp}
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {submittingCmp ? t.common.submitting : t.patient.submitComplaintBtn}
                  </button>
                </div>
              </form>

              {complaints.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {complaints.map((c) => (
                    <div key={c.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                          {c.subject}
                        </h4>
                        <span className={`text-xs font-semibold ${statusColorClass(c.status)}`}>
                          {getAppointmentStatusLabel(c.status, lang)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{c.description}</p>
                      {c.adminResolution && (
                        <p className="text-xs text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-2 rounded-lg mt-1">
                          {t.patient.adminReplyLabel} {c.adminResolution}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Review Modal (Doctor & Clinic Rating) */}
      {reviewTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSubmitReview}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t.patient.reviewModalTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.patient.reviewModalDatePrefix}{' '}
                  <span className="font-mono tabular-nums">{reviewTarget.appointmentDate}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                aria-label={t.common.close}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor Rating Section */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t.patient.rateDoctorTitle} {reviewTarget.doctorName}
                </p>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                  {reviewRating} / 5 · {t.patient.ratingLabels[reviewRating]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    aria-label={`${t.patient.rateDoctorTitle} ${num} ${t.common.starsSuffix}`}
                    onClick={() => setReviewRating(num)}
                    className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                      reviewRating >= num
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.patient.doctorCommentLabel}
                </label>
                <textarea
                  rows={2}
                  maxLength={600}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={t.patient.doctorCommentPlaceholder}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Clinic Rating Section */}
            {(reviewTarget.clinicId || reviewTarget.clinicName) && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t.patient.rateClinicTitle}{' '}
                    {reviewTarget.clinicName || t.common.privateClinic}
                  </p>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                    {clinicRating} / 5 · {t.patient.ratingLabels[clinicRating]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      aria-label={`${t.patient.rateClinicTitle} ${num} ${t.common.starsSuffix}`}
                      onClick={() => setClinicRating(num)}
                      className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                        clinicRating >= num
                          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.patient.clinicCommentLabel}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={600}
                    value={clinicComment}
                    onChange={(e) => setClinicComment(e.target.value)}
                    placeholder={t.patient.clinicCommentPlaceholder}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-lg cursor-pointer disabled:opacity-50"
              >
                {submittingReview ? t.patient.publishingReview : t.patient.publishReviewBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      <MedicalPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        patientName={
          patientProfile?.fullName ||
          userProfile?.displayName ||
          firebaseUser.displayName ||
          (lang === 'en' ? 'Patient' : 'مريض')
        }
        patientEmail={firebaseUser.email || userProfile?.email || ''}
        patientProfile={patientProfile}
        bmiValue={bmiValue}
        pastVisits={pastVisitsTimeline}
        diagnosticReports={diagnosticReports}
        vitalsTimeline={vitalsTimelineDesc}
        onDownloadJson={() => handleDownloadJson('all')}
      />

      {qrModalData && (
        <QRCodeDisplayModal
          isOpen={Boolean(qrModalData)}
          onClose={() => setQrModalData(null)}
          title={qrModalData.title}
          subtitle={qrModalData.subtitle}
          badgeText={qrModalData.badgeText}
          payloadString={qrModalData.payloadString}
          summaryRows={qrModalData.summaryRows}
          filenamePrefix={qrModalData.filenamePrefix}
        />
      )}
    </div>
  );
};
