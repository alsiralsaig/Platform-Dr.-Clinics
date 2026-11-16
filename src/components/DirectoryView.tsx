import React from 'react';
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Mic,
  MicOff,
  Navigation,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Stethoscope,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { ClinicDirectoryMap } from './ClinicDirectoryMap';
import {
  MEDICAL_SPECIALTIES,
  PLATFORM_IMAGES,
  SUDAN_REGIONS,
  SUDAN_STATES,
  TIME_SLOTS,
  WORKING_DAYS,
  formatSdg,
  getCenterTypeLabel,
  getClinicCoordinates,
  getDoctorOpenSlotsNext24h,
  getDoctorPhoto,
  getRegionByState,
  getStatesForRegion,
  translateDay,
  translateLocality,
  translateRegion,
  translateSpecialty,
  translateState,
  translateTimeSlot,
  type SudanRegionKey,
} from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import { createAppointment } from '../lib/firestoreService';
import type {
  BookedSlot,
  ClinicCenter,
  DoctorProfile,
  PortalTab,
  ServiceReview,
  UserProfile,
  VisitType,
} from '../types/medical';

interface BrowserSpeechRecognitionAlternative {
  transcript: string;
}

interface BrowserSpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  0: BrowserSpeechRecognitionAlternative;
}

interface BrowserSpeechRecognitionEvent extends Event {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

interface DirectoryViewProps {
  doctors: DoctorProfile[];
  clinics: ClinicCenter[];
  reviews: ServiceReview[];
  bookedSlots: BookedSlot[];
  favoriteDoctorUids: string[];
  favoriteClinicIds: string[];
  loading: boolean;
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  onSignIn: () => void;
  onNavigatePortal: (tab: PortalTab) => void;
  onAppointmentCreated: () => Promise<void>;
  onToggleFavoriteDoctor: (doctorUid: string) => void | Promise<void>;
  onToggleFavoriteClinic: (clinicId: string) => void | Promise<void>;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  doctors,
  clinics,
  reviews,
  bookedSlots,
  favoriteDoctorUids,
  favoriteClinicIds,
  loading,
  firebaseUser,
  userProfile,
  onSignIn,
  onNavigatePortal,
  onAppointmentCreated,
  onToggleFavoriteDoctor,
  onToggleFavoriteClinic,
}) => {
  const { lang, dir, t } = useI18n();
  const [directoryMode, setDirectoryMode] = React.useState<'doctors' | 'clinics'>('doctors');
  const [selectedRegion, setSelectedRegion] = React.useState<'' | SudanRegionKey>('');
  const [selectedState, setSelectedState] = React.useState<string>('');
  const [selectedLocality, setSelectedLocality] = React.useState<string>('');
  const [selectedArea, setSelectedArea] = React.useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [maxFeeSdg, setMaxFeeSdg] = React.useState<string>('');
  const [selectedGender, setSelectedGender] = React.useState<'' | 'male' | 'female'>('');
  const [selectedWorkingDay, setSelectedWorkingDay] = React.useState<string>('');
  const [availableNowOnly, setAvailableNowOnly] = React.useState<boolean>(false);
  const [sortBy, setSortBy] = React.useState<'rating' | 'fee_asc' | 'experience'>('rating');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState<boolean>(true);

  const [selectedDoctor, setSelectedDoctor] = React.useState<DoctorProfile | null>(null);
  const [selectedClinic, setSelectedClinic] = React.useState<ClinicCenter | null>(null);

  const [bookingDate, setBookingDate] = React.useState<string>(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = React.useState<string>(TIME_SLOTS[0]);
  const [visitType, setVisitType] = React.useState<VisitType>('in_person');
  const [visitReason, setVisitReason] = React.useState<string>('');
  const [bookingSubmitting, setBookingSubmitting] = React.useState(false);
  const [bookingError, setBookingError] = React.useState<string>('');
  const [bookingSuccess, setBookingSuccess] = React.useState<string>('');

  const [heroImgFailed, setHeroImgFailed] = React.useState(false);

  // Voice Search (Web Speech API)
  const [isListening, setIsListening] = React.useState(false);
  const [voiceError, setVoiceError] = React.useState('');
  const recognitionRef = React.useRef<BrowserSpeechRecognition | null>(null);

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore unmount cleanup errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleToggleVoiceSearch = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        setIsListening(false);
      }
      return;
    }

    setVoiceError('');
    const win = window as unknown as {
      SpeechRecognition?: BrowserSpeechRecognitionCtor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
    };
    const SpeechRecCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecCtor) {
      setVoiceError(t.directory.voiceSearchUnsupported);
      return;
    }

    try {
      const recognition = new SpeechRecCtor();
      recognition.lang = lang === 'en' ? 'en-US' : 'ar-SD';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError('');
      };

      recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i += 1) {
          combined += event.results[i][0]?.transcript || '';
        }
        const cleaned = combined.trim().replace(/[،.؟!?.,]+$/g, '').trim();
        if (cleaned) {
          setSearchQuery(cleaned);
        }
      };

      recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError(t.directory.voiceSearchDenied);
        } else if (event.error === 'no-speech') {
          setVoiceError(t.directory.voiceSearchNoSpeech);
        } else if (event.error !== 'aborted') {
          setVoiceError(t.directory.voiceSearchError);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError(t.directory.voiceSearchError);
    }
  };

  const statesInSelectedRegion = React.useMemo(
    () => getStatesForRegion(selectedRegion),
    [selectedRegion]
  );

  const selectedRegionStateNames = React.useMemo(() => {
    if (!selectedRegion) return null;
    const found = SUDAN_REGIONS.find((r) => r.id === selectedRegion);
    return found ? new Set(found.states) : null;
  }, [selectedRegion]);

  const availableLocalities = React.useMemo(() => {
    const found = SUDAN_STATES.find((s) => s.name === selectedState);
    return found ? found.localities : [];
  }, [selectedState]);

  const regionEntityCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    const list = directoryMode === 'doctors' ? doctors : clinics;
    list.forEach((item) => {
      if (item.approvalStatus === 'approved') {
        total += 1;
        if (item.state) {
          const region = getRegionByState(item.state);
          if (region) {
            counts[region.id] = (counts[region.id] || 0) + 1;
          }
        }
      }
    });
    return { counts, total };
  }, [directoryMode, doctors, clinics]);

  const stateEntityCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const list = directoryMode === 'doctors' ? doctors : clinics;
    list.forEach((item) => {
      if (item.approvalStatus === 'approved' && item.state) {
        counts[item.state] = (counts[item.state] || 0) + 1;
      }
    });
    return counts;
  }, [directoryMode, doctors, clinics]);

  const localityEntityCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (!selectedState) return counts;
    const list = directoryMode === 'doctors' ? doctors : clinics;
    list.forEach((item) => {
      if (item.approvalStatus === 'approved' && item.state === selectedState && item.locality) {
        counts[item.locality] = (counts[item.locality] || 0) + 1;
      }
    });
    return counts;
  }, [directoryMode, doctors, clinics, selectedState]);

  const handleSelectRegion = (regionId: '' | SudanRegionKey) => {
    setSelectedRegion(regionId);
    if (regionId && selectedState) {
      const regionInfo = SUDAN_REGIONS.find((r) => r.id === regionId);
      if (regionInfo && !regionInfo.states.includes(selectedState)) {
        setSelectedState('');
        setSelectedLocality('');
      }
    } else if (!regionId) {
      // Keep state if user only widened region, or clear locality when switching freely
    }
  };

  const bookedSlotKeys = React.useMemo(() => {
    const set = new Set<string>();
    bookedSlots.forEach((slot) => {
      if (slot.doctorUid && slot.appointmentDate && slot.timeSlot) {
        set.add(`${slot.doctorUid}|${slot.appointmentDate}|${slot.timeSlot}`);
      }
    });
    return set;
  }, [bookedSlots]);

  const availableDoctors24hMap = React.useMemo(() => {
    const now = new Date();
    const map = new Map<string, ReturnType<typeof getDoctorOpenSlotsNext24h>>();
    doctors.forEach((d) => {
      if (d.approvalStatus === 'approved') {
        map.set(d.uid, getDoctorOpenSlotsNext24h(d, bookedSlotKeys, now));
      }
    });
    return map;
  }, [doctors, bookedSlotKeys]);

  const availableNowCount = React.useMemo(() => {
    let count = 0;
    availableDoctors24hMap.forEach((slots) => {
      if (slots.length > 0) count += 1;
    });
    return count;
  }, [availableDoctors24hMap]);

  React.useEffect(() => {
    if (!selectedDoctor) return;
    const isBooked = bookedSlotKeys.has(`${selectedDoctor.uid}|${bookingDate}|${timeSlot}`);
    if (isBooked) {
      const nextOpen = TIME_SLOTS.find(
        (slot) => !bookedSlotKeys.has(`${selectedDoctor.uid}|${bookingDate}|${slot}`)
      );
      if (nextOpen) setTimeSlot(nextOpen);
    }
  }, [selectedDoctor, bookingDate, timeSlot, bookedSlotKeys]);

  const hasActiveFilters = Boolean(
    selectedRegion ||
      selectedState ||
      selectedLocality ||
      selectedArea ||
      selectedSpecialty ||
      searchQuery ||
      maxFeeSdg ||
      selectedGender ||
      selectedWorkingDay ||
      availableNowOnly
  );

  const resetAllFilters = () => {
    setSelectedRegion('');
    setSelectedState('');
    setSelectedLocality('');
    setSelectedArea('');
    setSelectedSpecialty('');
    setSearchQuery('');
    setMaxFeeSdg('');
    setSelectedGender('');
    setSelectedWorkingDay('');
    setAvailableNowOnly(false);
    setSortBy('rating');
  };

  const getDoctorRatingSummary = React.useCallback(
    (doctor: DoctorProfile) => {
      const docReviews = reviews.filter(
        (r) => r.doctorUid === doctor.uid && r.status === 'published'
      );
      if (docReviews.length === 0) {
        return {
          avg: doctor.ratingAvg || 0,
          count: doctor.ratingCount || 0,
          list: [] as ServiceReview[],
        };
      }
      const sum = docReviews.reduce((acc, r) => acc + r.rating, 0);
      const totalCount = (doctor.ratingCount || 0) + docReviews.length;
      const weightedAvg =
        doctor.ratingCount > 0
          ? (doctor.ratingAvg * doctor.ratingCount + sum) / totalCount
          : sum / docReviews.length;
      return {
        avg: Number(weightedAvg.toFixed(1)),
        count: totalCount,
        list: docReviews,
      };
    },
    [reviews]
  );

  const getClinicRatingSummary = React.useCallback(
    (clinic: ClinicCenter) => {
      const clinicReviews = reviews.filter(
        (r) =>
          r.clinicId === clinic.id &&
          r.status === 'published' &&
          (typeof r.clinicRating === 'number' || r.rating > 0)
      );
      if (clinicReviews.length === 0) {
        return {
          avg: clinic.ratingAvg || 0,
          count: clinic.ratingCount || 0,
          list: [] as {
            id: string;
            patientName: string;
            rating: number;
            comment?: string;
            createdAt?: ServiceReview['createdAt'];
          }[],
        };
      }
      const mapped = clinicReviews.map((r) => ({
        id: r.id,
        patientName: r.patientName,
        rating: typeof r.clinicRating === 'number' ? r.clinicRating : r.rating,
        comment: r.clinicComment || r.comment,
        createdAt: r.createdAt,
      }));
      const sum = mapped.reduce((acc, r) => acc + r.rating, 0);
      const totalCount = (clinic.ratingCount || 0) + mapped.length;
      const weightedAvg =
        clinic.ratingCount > 0
          ? (clinic.ratingAvg * clinic.ratingCount + sum) / totalCount
          : sum / mapped.length;
      return {
        avg: Number(weightedAvg.toFixed(1)),
        count: totalCount,
        list: mapped,
      };
    },
    [reviews]
  );

  const filteredDoctors = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const areaQ = selectedArea.trim().toLowerCase();
    const maxFeeNum = maxFeeSdg ? Number(maxFeeSdg) : null;

    const matched = doctors.filter((d) => {
      if (d.approvalStatus !== 'approved') return false;
      if (availableNowOnly && (availableDoctors24hMap.get(d.uid)?.length || 0) === 0) return false;
      if (selectedRegionStateNames && !selectedRegionStateNames.has(d.state)) return false;
      if (selectedState && d.state !== selectedState) return false;
      if (selectedLocality && d.locality !== selectedLocality) return false;
      if (selectedSpecialty && d.specialty !== selectedSpecialty) return false;
      if (selectedGender && d.gender !== selectedGender) return false;
      if (selectedWorkingDay && !d.workingDays.includes(selectedWorkingDay)) return false;
      if (maxFeeNum !== null && d.consultationFeeSdg > maxFeeNum) return false;
      if (areaQ && !(d.area || '').toLowerCase().includes(areaQ)) return false;
      if (q) {
        const reg = getRegionByState(d.state);
        const hay = `${d.fullName} ${d.specialty} ${translateSpecialty(d.specialty, 'en')} ${d.qualifications} ${d.workplaceName} ${d.services.join(' ')} ${d.area || ''} ${d.locality} ${translateLocality(d.locality, 'en')} ${d.state} ${translateState(d.state, 'en')} ${reg ? `${reg.labelAr} ${reg.labelEn}` : ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'fee_asc') return a.consultationFeeSdg - b.consultationFeeSdg;
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      return getDoctorRatingSummary(b).avg - getDoctorRatingSummary(a).avg;
    });
  }, [
    doctors,
    availableNowOnly,
    availableDoctors24hMap,
    selectedRegionStateNames,
    selectedState,
    selectedLocality,
    selectedArea,
    selectedSpecialty,
    selectedGender,
    selectedWorkingDay,
    maxFeeSdg,
    searchQuery,
    sortBy,
    getDoctorRatingSummary,
  ]);

  const filteredClinics = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const areaQ = selectedArea.trim().toLowerCase();
    return clinics.filter((c) => {
      if (c.approvalStatus !== 'approved') return false;
      if (selectedRegionStateNames && !selectedRegionStateNames.has(c.state)) return false;
      if (selectedState && c.state !== selectedState) return false;
      if (selectedLocality && c.locality !== selectedLocality) return false;
      if (areaQ && !(c.area || '').toLowerCase().includes(areaQ)) return false;
      if (q) {
        const reg = getRegionByState(c.state);
        const hay = `${c.name} ${c.area || ''} ${c.locality} ${translateLocality(c.locality, 'en')} ${c.state} ${translateState(c.state, 'en')} ${reg ? `${reg.labelAr} ${reg.labelEn}` : ''} ${c.services.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [clinics, selectedRegionStateNames, selectedState, selectedLocality, selectedArea, searchQuery]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !firebaseUser || !userProfile) return;
    setBookingError('');
    setBookingSuccess('');
    setBookingSubmitting(true);
    try {
      const linkedClinic = clinics.find((c) => c.id === selectedDoctor.clinicId);
      await createAppointment(
        firebaseUser.uid,
        userProfile.displayName,
        selectedDoctor,
        linkedClinic?.ownerUid || selectedDoctor.ownerUid,
        {
          appointmentDate: bookingDate,
          timeSlot,
          visitType,
          reason: visitReason,
        }
      );
      setBookingSuccess(t.directory.bookingSuccessMsg);
      setVisitReason('');
      await onAppointmentCreated();
    } catch (err) {
      setBookingError(
        err instanceof Error ? err.message : t.directory.bookingErrorMsg
      );
    } finally {
      setBookingSubmitting(false);
    }
  };

  const scrollToSearch = () => {
    document.getElementById('medical-search-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const statesCoveredCount = React.useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => d.state && set.add(d.state));
    clinics.forEach((c) => c.state && set.add(c.state));
    return Math.max(set.size, SUDAN_STATES.length);
  }, [doctors, clinics]);

  const DirectionalChevron = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section (Split 12-col stretch) */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-teal-800 dark:text-teal-400 tracking-wide">
                  {t.directory.heroEyebrow}
                </p>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 dark:text-slate-100 leading-tight text-balance max-w-2xl">
                  {t.directory.heroTitle}
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  {t.directory.heroDesc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={scrollToSearch}
                  className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.directory.heroFindDoctorBtn}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigatePortal('doctor')}
                  className="px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.directory.heroJoinBtn}
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-64 sm:h-80 lg:h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative">
                {!heroImgFailed ? (
                  <img
                    src={PLATFORM_IMAGES.hero}
                    alt={t.directory.heroImgAlt}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 text-center">
                    <Stethoscope className="w-12 h-12 text-teal-700 dark:text-teal-400 mb-3" />
                    <p className="font-display font-semibold text-slate-800 dark:text-slate-100">
                      {t.common.platformName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-column summary strip below hero split */}
          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statesCoveredCount} {t.directory.statStatesSuffix}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.directory.statStatesDesc}</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
                {doctors.length} {t.directory.statDoctorsSuffix}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.directory.statDoctorsDesc}</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
                {clinics.length} {t.directory.statClinicsSuffix}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.directory.statClinicsDesc}</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                {t.directory.statEhrTitle}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.directory.statEhrDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Geographic Filter Section */}
      <section
        id="medical-search-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t.directory.sectionTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.directory.sectionDesc}</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 self-start">
            <button
              type="button"
              onClick={() => setDirectoryMode('doctors')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                directoryMode === 'doctors'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {t.directory.tabDoctors} ({filteredDoctors.length})
            </button>
            <button
              type="button"
              onClick={() => setDirectoryMode('clinics')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                directoryMode === 'clinics'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {t.directory.tabClinics} ({filteredClinics.length})
            </button>
          </div>
        </div>

        {/* Quick Specialty & Available-Now Filter Bar */}
        {directoryMode === 'doctors' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAvailableNowOnly((prev) => !prev)}
              aria-pressed={availableNowOnly}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                availableNowOnly
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t.directory.availableNowBtn}</span>
              <span className="font-mono tabular-nums opacity-90">
                ({availableNowCount} {t.directory.availableNowCountSuffix})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSpecialty('')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                selectedSpecialty === ''
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.directory.allSpecialties}
            </button>
            {MEDICAL_SPECIALTIES.slice(0, 6).map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setSelectedSpecialty(selectedSpecialty === sp ? '' : sp)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  selectedSpecialty === sp
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {translateSpecialty(sp, lang)}
              </button>
            ))}
          </div>
        )}

        {/* Primary & Advanced Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          {/* Quick Geographic Region Filter Strip */}
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span>{t.directory.geoFilterTitle}</span>
              </span>
              {(selectedRegion || selectedState || selectedLocality) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRegion('');
                    setSelectedState('');
                    setSelectedLocality('');
                  }}
                  className="text-[11px] font-semibold text-teal-800 dark:text-teal-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.directory.allRegionsOption}
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRegion('');
                  setSelectedState('');
                  setSelectedLocality('');
                }}
                aria-pressed={selectedRegion === '' && selectedState === ''}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedRegion === '' && selectedState === ''
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {t.directory.allRegionsOption}{' '}
                <span className="font-mono tabular-nums opacity-85">
                  ({regionEntityCounts.total})
                </span>
              </button>
              {SUDAN_REGIONS.map((region) => {
                const count = regionEntityCounts.counts[region.id] || 0;
                const isActive = selectedRegion === region.id;
                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => handleSelectRegion(isActive ? '' : region.id)}
                    aria-pressed={isActive}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {lang === 'en' ? region.labelEn : region.labelAr}{' '}
                    <span className="font-mono tabular-nums opacity-85">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.directory.liveSearchLabel}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.directory.liveSearchPlaceholder}
                  className={`w-full ps-9 ${
                    searchQuery ? 'pe-20' : 'pe-11'
                  } py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-900 ${
                    isListening ? 'border-teal-600 ring-2 ring-teal-200 dark:ring-teal-800 bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                <div className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label={t.directory.clearSearchAria}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleVoiceSearch}
                    aria-label={
                      isListening
                        ? t.directory.voiceSearchStopAria
                        : t.directory.voiceSearchStartAria
                    }
                    title={
                      isListening
                        ? t.directory.voiceSearchStopAria
                        : t.directory.voiceSearchStartAria
                    }
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse hover:bg-red-700'
                        : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-3.5 h-3.5" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              {isListening && (
                <p className="mt-1.5 text-[11px] font-medium text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                  <span>{t.directory.voiceSearchListening}</span>
                </p>
              )}
              {voiceError && (
                <p className="mt-1.5 text-[11px] font-medium text-red-700 dark:text-red-400">{voiceError}</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.directory.specialtyLabel}
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                disabled={directoryMode === 'clinics'}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-900 disabled:opacity-60"
              >
                <option value="">{t.directory.allSpecialties}</option>
                {MEDICAL_SPECIALTIES.map((sp) => (
                  <option key={sp} value={sp}>
                    {translateSpecialty(sp, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.directory.regionLabel}
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => handleSelectRegion(e.target.value as '' | SudanRegionKey)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-900"
              >
                <option value="">{t.directory.allRegionsOption}</option>
                {SUDAN_REGIONS.map((r) => {
                  const count = regionEntityCounts.counts[r.id] || 0;
                  return (
                    <option key={r.id} value={r.id}>
                      {translateRegion(r.id, lang)}
                      {count > 0 ? ` (${count})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.directory.stateLabel}
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  const nextState = e.target.value;
                  setSelectedState(nextState);
                  setSelectedLocality('');
                  if (nextState && selectedRegion) {
                    const stRegion = getRegionByState(nextState);
                    if (stRegion && stRegion.id !== selectedRegion) {
                      setSelectedRegion(stRegion.id);
                    }
                  }
                }}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-900"
              >
                <option value="">
                  {selectedRegion ? t.directory.allRegionStatesOption : t.directory.allStatesOption}
                </option>
                {statesInSelectedRegion.map((s) => {
                  const count = stateEntityCounts[s.name] || 0;
                  return (
                    <option key={s.name} value={s.name}>
                      {translateState(s.name, lang)}
                      {count > 0 ? ` (${count})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.directory.localityLabel}
              </label>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                disabled={!selectedState}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-900 disabled:opacity-60"
              >
                <option value="">{t.directory.allLocalitiesOption}</option>
                {availableLocalities.map((loc) => {
                  const count = localityEntityCounts[loc] || 0;
                  return (
                    <option key={loc} value={loc}>
                      {translateLocality(loc, lang)}
                      {count > 0 ? ` (${count})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                {showAdvancedFilters
                  ? t.directory.hideAdvancedFilters
                  : t.directory.showAdvancedFilters}
              </span>
            </button>

            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-mono tabular-nums">
                {t.directory.liveResultsPrefix}{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  {directoryMode === 'doctors' ? filteredDoctors.length : filteredClinics.length}
                </strong>{' '}
                {t.directory.liveResultsOf}{' '}
                {directoryMode === 'doctors' ? doctors.length : clinics.length}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-red-700 dark:text-red-400 hover:underline font-semibold cursor-pointer"
                >
                  {t.directory.clearFilters}
                </button>
              )}
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.directory.areaLabel}
                </label>
                <input
                  type="text"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  placeholder={t.directory.areaPlaceholder}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {directoryMode === 'doctors' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.directory.maxFeeLabel}
                    </label>
                    <select
                      value={maxFeeSdg}
                      onChange={(e) => setMaxFeeSdg(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-900"
                    >
                      <option value="">{t.directory.anyFee}</option>
                      <option value="15000">
                        {t.directory.upToFee} {formatSdg(15000, lang)}
                      </option>
                      <option value="20000">
                        {t.directory.upToFee} {formatSdg(20000, lang)}
                      </option>
                      <option value="30000">
                        {t.directory.upToFee} {formatSdg(30000, lang)}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.directory.genderFilterLabel}
                    </label>
                    <select
                      value={selectedGender}
                      onChange={(e) => setSelectedGender(e.target.value as '' | 'male' | 'female')}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-900"
                    >
                      <option value="">{t.common.all}</option>
                      <option value="male">{t.directory.maleDoctor}</option>
                      <option value="female">{t.directory.femaleDoctor}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.directory.workingDayLabel}
                    </label>
                    <select
                      value={selectedWorkingDay}
                      onChange={(e) => setSelectedWorkingDay(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-900"
                    >
                      <option value="">{t.directory.allDays}</option>
                      {WORKING_DAYS.map((day) => (
                        <option key={day} value={day}>
                          {translateDay(day, lang)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.directory.sortByLabel}
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as 'rating' | 'fee_asc' | 'experience')
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-900"
                    >
                      <option value="rating">{t.directory.sortHighestRated}</option>
                      <option value="fee_asc">{t.directory.sortLowestFee}</option>
                      <option value="experience">{t.directory.sortMostExperienced}</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Interactive Sudan Clinics & Medical Centers Map */}
        <ClinicDirectoryMap
          clinics={filteredClinics}
          doctors={doctors}
          selectedState={selectedState}
          selectedRegion={selectedRegion}
          onSelectClinic={(clinic) => setSelectedClinic(clinic)}
          onResetStateFilter={() => {
            setSelectedRegion('');
            setSelectedState('');
            setSelectedLocality('');
          }}
        />

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : directoryMode === 'doctors' ? (
          filteredDoctors.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
              <Stethoscope className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                {t.directory.noDoctorsTitle}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {t.directory.noDoctorsDesc}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="px-4 py-2 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg cursor-pointer"
                  >
                    {t.directory.showAllStatesBtn}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => {
                const rating = getDoctorRatingSummary(doctor);
                const isFav = favoriteDoctorUids.includes(doctor.uid);
                const openSlots24h = availableDoctors24hMap.get(doctor.uid) || [];
                return (
                  <article
                    key={doctor.uid}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-700/50 dark:hover:border-teal-500/60 rounded-xl p-6 flex flex-col justify-between transition-colors"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={getDoctorPhoto(doctor.photoKey, doctor.gender)}
                          alt={doctor.fullName}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                              {doctor.fullName}
                            </h3>
                            <button
                              type="button"
                              onClick={() =>
                                firebaseUser ? onToggleFavoriteDoctor(doctor.uid) : onSignIn()
                              }
                              aria-label={isFav ? t.directory.favoriteRemove : t.directory.favoriteAdd}
                              title={
                                firebaseUser
                                  ? isFav
                                    ? t.directory.favoriteRemove
                                    : t.directory.favoriteAdd
                                  : t.directory.favoriteSignInPrompt
                              }
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                                isFav
                                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          <p className="text-sm font-medium text-teal-800 dark:text-teal-400 mt-0.5 truncate">
                            {translateSpecialty(doctor.specialty, lang)}
                          </p>
                          {/* Zero-Pill Metadata */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                            <span>
                              {t.directory.experiencePrefix} {doctor.experienceYears}{' '}
                              {t.common.yearsSuffix}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              {rating.avg > 0 ? rating.avg : t.common.newLabel}
                              {rating.count > 0 ? ` (${rating.count})` : ''}
                            </span>
                            <span aria-hidden="true">·</span>
                            {(() => {
                              const isAvail =
                                (doctor.availabilityStatus ?? 'available') === 'available';
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 font-semibold ${
                                    isAvail
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-rose-700 dark:text-rose-400'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isAvail ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                                  />
                                  {isAvail
                                    ? t.directory.statusAvailableBadge
                                    : t.directory.statusBusyBadge}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{doctor.workplaceName}</span>
                        </p>
                        <p className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {translateState(doctor.state, lang)} ·{' '}
                            {translateLocality(doctor.locality, lang)}
                            {doctor.area ? ` · ${doctor.area}` : ''}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{doctor.workingHours}</span>
                        </p>
                      </div>

                      {openSlots24h.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{t.directory.urgentOpenSlotPrefix}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {openSlots24h.slice(0, 2).map((slot) => (
                              <button
                                key={`${slot.dateStr}_${slot.timeSlot}`}
                                type="button"
                                onClick={() => {
                                  setSelectedDoctor(doctor);
                                  setBookingDate(slot.dateStr);
                                  setTimeSlot(slot.timeSlot);
                                  setBookingError('');
                                  setBookingSuccess('');
                                }}
                                className="px-2 py-1 text-[11px] font-mono tabular-nums bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md cursor-pointer transition-colors"
                              >
                                {slot.dateStr.slice(5)} · {translateTimeSlot(slot.timeSlot, lang)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          {t.directory.consultationFee}
                        </span>
                        <span className="font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatSdg(doctor.consultationFeeSdg, lang)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setBookingError('');
                          setBookingSuccess('');
                        }}
                        className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {t.directory.viewAndBookBtn}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : filteredClinics.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-2">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.directory.noClinicsTitle}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t.directory.noClinicsDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClinics.map((clinic) => {
              const clinicRating = getClinicRatingSummary(clinic);
              const isClinicFav = favoriteClinicIds.includes(clinic.id);
              return (
                <article
                  key={clinic.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-700/50 dark:hover:border-teal-500/60 rounded-xl overflow-hidden flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="h-44 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 overflow-hidden relative">
                      <img
                        src={PLATFORM_IMAGES.clinicSuite}
                        alt={clinic.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          firebaseUser ? onToggleFavoriteClinic(clinic.id) : onSignIn()
                        }
                        aria-label={isClinicFav ? t.directory.favoriteRemove : t.directory.favoriteAdd}
                        title={
                          firebaseUser
                            ? isClinicFav
                              ? t.directory.favoriteRemove
                              : t.directory.favoriteAdd
                            : t.directory.favoriteSignInPrompt
                        }
                        className={`absolute top-3 end-3 p-2 rounded-lg border backdrop-blur-xs transition-colors cursor-pointer ${
                          isClinicFav
                            ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                            : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isClinicFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="p-6 space-y-3">
                      <div>
                        <p className="text-xs text-teal-800 dark:text-teal-400 font-medium">
                          {getCenterTypeLabel(clinic.centerType, lang)} · {t.directory.licenseLabel}{' '}
                          {clinic.licenseNumber}
                        </p>
                        <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {clinic.name}
                        </h3>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {translateState(clinic.state, lang)} ·{' '}
                            {translateLocality(clinic.locality, lang)}
                            {clinic.area ? ` · ${clinic.area}` : ''}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{clinic.workingHours}</span>
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {t.directory.servicesPrefix} {clinic.services.join(' · ')}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 font-mono tabular-nums">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {clinicRating.avg > 0 ? clinicRating.avg : t.common.newLabel}
                      {clinicRating.count > 0 ? ` (${clinicRating.count})` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedClinic(clinic)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 cursor-pointer"
                    >
                      <span>{t.directory.centerDetailsAndDoctors}</span>
                      <DirectionalChevron className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Doctor Profile & Appointment Booking Modal */}
      {selectedDoctor && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-start gap-4">
                <img
                  src={getDoctorPhoto(selectedDoctor.photoKey, selectedDoctor.gender)}
                  alt={selectedDoctor.fullName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedDoctor.fullName}
                  </h3>
                  <p className="text-sm font-medium text-teal-800 dark:text-teal-400">
                    {translateSpecialty(selectedDoctor.specialty, lang)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedDoctor.qualifications} · {t.directory.licenseLabel}{' '}
                    {selectedDoctor.licenseNumber}
                  </p>
                  {(() => {
                    const liveDoctor =
                      doctors.find((d) => d.uid === selectedDoctor.uid) || selectedDoctor;
                    const headerRating = getDoctorRatingSummary(liveDoctor);
                    const isAvail =
                      (liveDoctor.availabilityStatus ?? 'available') === 'available';
                    return (
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-3.5 h-3.5 ${
                                headerRating.avg >= n - 0.3
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                          {headerRating.avg > 0 ? `${headerRating.avg} / 5` : t.common.newLabel}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          ({headerRating.count} {t.common.reviewsCountSuffix})
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`inline-flex items-center gap-1.5 font-bold ${
                            isAvail
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAvail ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {isAvail
                            ? t.directory.statusAvailableBadge
                            : t.directory.statusBusyBadge}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {(() => {
                  const isModalFav = favoriteDoctorUids.includes(selectedDoctor.uid);
                  return (
                    <button
                      type="button"
                      onClick={() =>
                        firebaseUser ? onToggleFavoriteDoctor(selectedDoctor.uid) : onSignIn()
                      }
                      aria-label={isModalFav ? t.directory.favoriteRemove : t.directory.favoriteAdd}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        isModalFav
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isModalFav ? 'fill-current' : ''}`} />
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  aria-label={t.common.close}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{t.directory.workplaceAndState}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {selectedDoctor.workplaceName} — {translateState(selectedDoctor.state, lang)} (
                  {translateLocality(selectedDoctor.locality, lang)})
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{t.directory.consultationFee}</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                  {formatSdg(selectedDoctor.consultationFeeSdg, lang)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{t.directory.daysAndHours}</span>
                <span>
                  {selectedDoctor.workingDays.map((d) => translateDay(d, lang)).join(' · ')} ·{' '}
                  {selectedDoctor.workingHours}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {t.directory.centralApprovalLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  {t.directory.approvedVerified}
                </span>
              </div>
            </div>

            {selectedDoctor.bio && (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedDoctor.bio}</p>
            )}

            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-100">{t.directory.providedServices} </span>
              {selectedDoctor.services.join(' · ')}
            </div>

            {/* Live Patient Reviews & Average Rating Breakdown */}
            {(() => {
              const summary = getDoctorRatingSummary(selectedDoctor);
              return (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t.directory.reviewsAndAvgTitle}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-4 h-4 ${
                              summary.avg >= n - 0.3
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100">
                        {summary.avg > 0 ? summary.avg.toFixed(1) : '—'} / 5
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        ({summary.count} {t.common.reviewsCountSuffix})
                      </span>
                    </div>
                  </div>

                  {summary.list.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const cnt = summary.list.filter((r) => Math.round(r.rating) === stars).length;
                        const pct = Math.round((cnt / summary.list.length) * 100);
                        return (
                          <div key={stars} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="w-12 font-mono tabular-nums shrink-0">
                              {stars} {t.common.starsSuffix}
                            </span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-end font-mono tabular-nums shrink-0">{cnt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {summary.list.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.directory.noRecentTextReviews}{' '}
                      <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-100">
                        {summary.avg > 0 ? `${summary.avg} / 5` : t.common.newLabel}
                      </strong>
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {summary.list.map((rev) => (
                        <div
                          key={rev.id}
                          className="text-xs bg-slate-50 dark:bg-slate-800/70 p-3 rounded-lg border border-slate-100 dark:border-slate-700 space-y-1"
                        >
                          <div className="flex items-center justify-between text-slate-800 dark:text-slate-100 font-semibold">
                            <span>{rev.patientName}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Star
                                    key={n}
                                    className={`w-3 h-3 ${
                                      rev.rating >= n
                                        ? 'text-amber-500 fill-amber-500'
                                        : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-mono tabular-nums">{rev.rating} / 5</span>
                            </div>
                          </div>
                          {rev.comment && <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{rev.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Booking Form */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                {t.directory.bookAppointmentTitle}
              </h4>

              {!firebaseUser ? (
                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{t.directory.signInToBookPrompt}</p>
                  <button
                    type="button"
                    onClick={onSignIn}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.directory.signInNowBtn}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookAppointment} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.directory.appointmentDateLabel}
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.directory.timeSlotLabel}
                      </label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                      >
                        {TIME_SLOTS.map((slot) => {
                          const isBooked = bookedSlotKeys.has(
                            `${selectedDoctor.uid}|${bookingDate}|${slot}`
                          );
                          return (
                            <option key={slot} value={slot} disabled={isBooked}>
                              {translateTimeSlot(slot, lang)}
                              {isBooked ? ` (${t.directory.bookedSlotDisabled})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.directory.visitTypeLabel}
                      </label>
                      <select
                        value={visitType}
                        onChange={(e) => setVisitType(e.target.value as VisitType)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                      >
                        <option value="in_person">
                          {lang === 'en' ? 'In-Person Visit' : 'كشف حضوري'}
                        </option>
                        <option value="follow_up">
                          {lang === 'en' ? 'Medical Follow-Up' : 'متابعة طبية'}
                        </option>
                        <option value="nutrition_consult">
                          {lang === 'en' ? 'Clinical Nutrition Consult' : 'استشارة تغذية علاجية'}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.directory.visitReasonLabel}
                    </label>
                    <textarea
                      rows={2}
                      maxLength={400}
                      value={visitReason}
                      onChange={(e) => setVisitReason(e.target.value)}
                      placeholder={t.directory.visitReasonPlaceholder}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  {bookingError && (
                    <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg p-2.5">
                      {bookingError}
                    </p>
                  )}
                  {bookingSuccess && (
                    <div className="text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center justify-between gap-3">
                      <span>{bookingSuccess}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoctor(null);
                          onNavigatePortal('patient');
                        }}
                        className="font-semibold underline whitespace-nowrap cursor-pointer"
                      >
                        {t.directory.viewMyBookings}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDoctor(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        bookingSubmitting ||
                        bookedSlotKeys.has(`${selectedDoctor.uid}|${bookingDate}|${timeSlot}`)
                      }
                      className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      {bookingSubmitting ? t.directory.sendingBooking : t.directory.confirmBookingBtn}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clinic Details Modal */}
      {selectedClinic &&
        (() => {
          const clinicSummary = getClinicRatingSummary(selectedClinic);
          const clinicDoctors = doctors.filter((d) => d.clinicId === selectedClinic.id);
          const clinicCoords = getClinicCoordinates(selectedClinic, 0);
          const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            `${clinicCoords.lat},${clinicCoords.lng}`
          )}`;
          const isModalClinicFav = favoriteClinicIds.includes(selectedClinic.id);

          return (
            <div
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <p className="text-xs text-teal-800 dark:text-teal-400 font-semibold">
                      {getCenterTypeLabel(selectedClinic.centerType, lang)} ·{' '}
                      {t.directory.licenseLabel} {selectedClinic.licenseNumber}
                    </p>
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {selectedClinic.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${
                              clinicSummary.avg >= n - 0.3
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                        {clinicSummary.avg > 0 ? `${clinicSummary.avg} / 5` : t.common.newLabel}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        ({clinicSummary.count} {t.common.reviewsCountSuffix})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        firebaseUser ? onToggleFavoriteClinic(selectedClinic.id) : onSignIn()
                      }
                      aria-label={isModalClinicFav ? t.directory.favoriteRemove : t.directory.favoriteAdd}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        isModalClinicFav
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isModalClinicFav ? 'fill-current' : ''}`} />
                    </button>
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{t.map.getDirections}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setSelectedClinic(null)}
                      aria-label={t.common.close}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {t.directory.geoLocationLabel}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {translateState(selectedClinic.state, lang)} ·{' '}
                      {translateLocality(selectedClinic.locality, lang)}
                      {selectedClinic.area ? ` · ${selectedClinic.area}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {t.directory.hoursAndPhoneLabel}
                    </span>
                    <span>
                      {selectedClinic.workingHours}
                      {selectedClinic.phone ? ` · ${selectedClinic.phone}` : ''}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {t.directory.availableMedicalServices}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedClinic.services.join(' · ')}</p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t.directory.clinicPatientReviews} ({clinicSummary.count})
                    </h4>
                    <span className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {t.directory.averagePrefix}{' '}
                      {clinicSummary.avg > 0 ? `${clinicSummary.avg} / 5` : t.common.newLabel}
                    </span>
                  </div>
                  {clinicSummary.list.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.directory.noRecentClinicReviews}</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {clinicSummary.list.map((rev) => (
                        <div
                          key={rev.id}
                          className="text-xs bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-100">
                            <span>{rev.patientName}</span>
                            <span className="font-mono tabular-nums">{rev.rating} / 5</span>
                          </div>
                          {rev.comment && <p className="text-slate-600 dark:text-slate-300 mt-1">{rev.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    {t.directory.linkedApprovedDoctors}
                  </h4>
                  {clinicDoctors.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.directory.noLinkedDoctors}</p>
                  ) : (
                    <div className="space-y-2.5">
                      {clinicDoctors.map((d) => (
                        <div
                          key={d.uid}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{d.fullName}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {translateSpecialty(d.specialty, lang)} ·{' '}
                              {formatSdg(d.consultationFeeSdg, lang)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClinic(null);
                              setSelectedDoctor(d);
                            }}
                            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            {t.directory.bookAppointmentBtn}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};
