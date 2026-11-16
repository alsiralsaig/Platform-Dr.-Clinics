import type {
  Appointment,
  ClinicCenter,
  DoctorProfile,
  MedicationStatus,
  PatientMedication,
} from '../types/medical';

export type AppLang = 'ar' | 'en';

export interface SudanStateGeo {
  name: string;
  localities: string[];
}

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export const SUDAN_CENTER: LatLngPoint = { lat: 15.5007, lng: 32.5599 };

export const SUDAN_STATE_COORDS: Record<string, LatLngPoint> = {
  'الخرطوم': { lat: 15.5007, lng: 32.5599 },
  'الجزيرة': { lat: 14.4012, lng: 33.5199 },
  'البحر الأحمر': { lat: 19.6158, lng: 37.2164 },
  'كسلا': { lat: 15.451, lng: 36.3996 },
  'القضارف': { lat: 14.0349, lng: 35.3834 },
  'نهر النيل': { lat: 17.7022, lng: 33.9864 },
  'الشمالية': { lat: 19.1698, lng: 30.4749 },
  'سنار': { lat: 13.5691, lng: 33.5672 },
  'النيل الأبيض': { lat: 13.1629, lng: 32.6635 },
  'النيل الأزرق': { lat: 11.7669, lng: 34.3496 },
  'شمال كردفان': { lat: 13.1842, lng: 30.2167 },
  'جنوب كردفان': { lat: 11.0111, lng: 29.7183 },
  'غرب كردفان': { lat: 11.717, lng: 28.34 },
  'شمال دارفور': { lat: 13.6279, lng: 25.3494 },
  'جنوب دارفور': { lat: 12.0489, lng: 24.8807 },
  'شرق دارفور': { lat: 11.4608, lng: 26.1283 },
  'وسط دارفور': { lat: 12.9045, lng: 23.4742 },
  'غرب دارفور': { lat: 13.4526, lng: 22.4472 },
};

export const SUDAN_LOCALITY_COORDS: Record<string, LatLngPoint> = {
  'الخرطوم': { lat: 15.588, lng: 32.5342 },
  'أم درمان': { lat: 15.6445, lng: 32.4777 },
  'بحري': { lat: 15.6415, lng: 32.548 },
  'شرق النيل': { lat: 15.614, lng: 32.625 },
  'جبل أولياء': { lat: 15.236, lng: 32.495 },
  'كرري': { lat: 15.724, lng: 32.463 },
  'أم بدة': { lat: 15.648, lng: 32.412 },
  'ود مدني الكبرى': { lat: 14.4012, lng: 33.5199 },
  'المناقل': { lat: 14.245, lng: 32.989 },
  'الحصاحيصا': { lat: 14.736, lng: 33.302 },
  'بورتسودان': { lat: 19.6158, lng: 37.2164 },
  'سواكن': { lat: 19.1059, lng: 37.3321 },
  'كسلا': { lat: 15.451, lng: 36.3996 },
  'حلفا الجديدة': { lat: 15.328, lng: 35.596 },
  'بلدية القضارف': { lat: 14.0349, lng: 35.3834 },
  'عطبرة': { lat: 17.7022, lng: 33.9864 },
  'الدامر': { lat: 17.592, lng: 33.959 },
  'شندي': { lat: 16.6915, lng: 33.4341 },
  'دنقلا': { lat: 19.1698, lng: 30.4749 },
  'مروي': { lat: 18.47, lng: 31.82 },
  'حلفا': { lat: 21.8, lng: 31.33 },
  'سنجة': { lat: 13.15, lng: 33.93 },
  'سنار': { lat: 13.5691, lng: 33.5672 },
  'كوستي': { lat: 13.1629, lng: 32.6635 },
  'ربك': { lat: 13.1809, lng: 32.74 },
  'الدمازين': { lat: 11.7669, lng: 34.3496 },
  'شيكان (الأبيض)': { lat: 13.1842, lng: 30.2167 },
  'كادقلي': { lat: 11.0111, lng: 29.7183 },
  'الفولة': { lat: 11.717, lng: 28.34 },
  'الفاشر': { lat: 13.6279, lng: 25.3494 },
  'نيالا': { lat: 12.0489, lng: 24.8807 },
  'الضعين': { lat: 11.4608, lng: 26.1283 },
  'زالنجي': { lat: 12.9045, lng: 23.4742 },
  'الجنينة': { lat: 13.4526, lng: 22.4472 },
};

export function getClinicCoordinates(
  clinic: Pick<ClinicCenter, 'id' | 'state' | 'locality'>,
  indexInCluster = 0
): LatLngPoint {
  const base =
    SUDAN_LOCALITY_COORDS[clinic.locality] ||
    SUDAN_STATE_COORDS[clinic.state] ||
    SUDAN_CENTER;

  if (indexInCluster <= 0) {
    return base;
  }

  // Deterministic spiral offset (~1.2km - 3km) so co-located pins stay distinct and clickable
  const angle = indexInCluster * 2.39996;
  const radius = 0.012 * Math.sqrt(indexInCluster);
  return {
    lat: Number((base.lat + Math.sin(angle) * radius).toFixed(5)),
    lng: Number((base.lng + Math.cos(angle) * radius).toFixed(5)),
  };
}

export const SUDAN_STATES: SudanStateGeo[] = [
  {
    name: 'الخرطوم',
    localities: ['الخرطوم', 'أم درمان', 'بحري', 'شرق النيل', 'جبل أولياء', 'كرري', 'أم بدة'],
  },
  {
    name: 'الجزيرة',
    localities: ['ود مدني الكبرى', 'المناقل', 'الحصاحيصا', 'الكاملين', 'شرق الجزيرة', 'جنوب الجزيرة', 'أم القرى'],
  },
  {
    name: 'البحر الأحمر',
    localities: ['بورتسودان', 'سواكن', 'طوكر', 'سنكات', 'هيا', 'حلايب'],
  },
  {
    name: 'كسلا',
    localities: ['كسلا', 'حلفا الجديدة', 'نهر عطبرة', 'خشم القربة', 'ريفي كسلا', 'همشكوريب'],
  },
  {
    name: 'القضارف',
    localities: ['بلدية القضارف', 'الفاو', 'الفشقة', 'قلع النحل', 'الرهد', 'القريشة'],
  },
  {
    name: 'نهر النيل',
    localities: ['عطبرة', 'الدامر', 'شندي', 'بربر', 'أبو حمد', 'المتمة'],
  },
  {
    name: 'الشمالية',
    localities: ['دنقلا', 'مروي', 'حلفا', 'الدبة', 'القولد', 'دلقو'],
  },
  {
    name: 'سنار',
    localities: ['سنجة', 'سنار', 'الدندر', 'السوكي', 'شرق سنار', 'أبو حجار'],
  },
  {
    name: 'النيل الأبيض',
    localities: ['كوستي', 'ربك', 'الدويم', 'القطينة', 'تندلتي', 'الجبلين'],
  },
  {
    name: 'النيل الأزرق',
    localities: ['الدمازين', 'الروصيرص', 'باو', 'الكرمك', 'التضامن'],
  },
  {
    name: 'شمال كردفان',
    localities: ['شيكان (الأبيض)', 'أم روابة', 'الرهد', 'بارا', 'سودري', 'جبرة الشيخ'],
  },
  {
    name: 'جنوب كردفان',
    localities: ['كادقلي', 'الدلنج', 'أبو جبيهة', 'تلودي', 'رشاد'],
  },
  {
    name: 'غرب كردفان',
    localities: ['الفولة', 'النهود', 'بابنوسة', 'المجلد', 'أبو زبد'],
  },
  {
    name: 'شمال دارفور',
    localities: ['الفاشر', 'كتم', 'كبكابية', 'مليط', 'أم كدادة', 'طويلة'],
  },
  {
    name: 'جنوب دارفور',
    localities: ['نيالا', 'برام', 'كاس', 'عد الفرسان', 'تلس', 'رهيد البردي'],
  },
  {
    name: 'شرق دارفور',
    localities: ['الضعين', 'أبو كارنكا', 'بحر العرب', 'عديلة', 'شعيرية'],
  },
  {
    name: 'وسط دارفور',
    localities: ['زالنجي', 'نيرتتي', 'وادي صالح', 'روكيرو', 'أم دخن'],
  },
  {
    name: 'غرب دارفور',
    localities: ['الجنينة', 'فوربرنقا', 'بيضة', 'سربا', 'كلبس'],
  },
];

export type SudanRegionKey =
  | 'khartoum'
  | 'central'
  | 'eastern'
  | 'northern'
  | 'kordofan'
  | 'darfur';

export interface SudanRegionInfo {
  id: SudanRegionKey;
  labelAr: string;
  labelEn: string;
  states: string[];
  center: LatLngPoint;
  zoom: number;
}

export const SUDAN_REGIONS: SudanRegionInfo[] = [
  {
    id: 'khartoum',
    labelAr: 'إقليم الخرطوم',
    labelEn: 'Khartoum Region',
    states: ['الخرطوم'],
    center: { lat: 15.588, lng: 32.5342 },
    zoom: 10,
  },
  {
    id: 'central',
    labelAr: 'الأقاليم الوسطى',
    labelEn: 'Central Region',
    states: ['الجزيرة', 'سنار', 'النيل الأبيض', 'النيل الأزرق'],
    center: { lat: 13.55, lng: 33.4 },
    zoom: 7,
  },
  {
    id: 'eastern',
    labelAr: 'الإقليم الشرقي',
    labelEn: 'Eastern Region',
    states: ['البحر الأحمر', 'كسلا', 'القضارف'],
    center: { lat: 16.5, lng: 36.2 },
    zoom: 7,
  },
  {
    id: 'northern',
    labelAr: 'الإقليم الشمالي',
    labelEn: 'Northern Region',
    states: ['نهر النيل', 'الشمالية'],
    center: { lat: 18.6, lng: 31.8 },
    zoom: 7,
  },
  {
    id: 'kordofan',
    labelAr: 'إقليم كردفان',
    labelEn: 'Kordofan Region',
    states: ['شمال كردفان', 'جنوب كردفان', 'غرب كردفان'],
    center: { lat: 12.1, lng: 29.4 },
    zoom: 7,
  },
  {
    id: 'darfur',
    labelAr: 'إقليم دارفور',
    labelEn: 'Darfur Region',
    states: ['شمال دارفور', 'جنوب دارفور', 'شرق دارفور', 'وسط دارفور', 'غرب دارفور'],
    center: { lat: 12.7, lng: 24.3 },
    zoom: 7,
  },
];

export function getRegionByState(stateName: string): SudanRegionInfo | undefined {
  return SUDAN_REGIONS.find((region) => region.states.includes(stateName));
}

export function translateRegion(regionId: SudanRegionKey | '', lang: AppLang = 'ar'): string {
  if (!regionId) return lang === 'en' ? 'All Sudan Regions' : 'كل مناطق السودان';
  const found = SUDAN_REGIONS.find((r) => r.id === regionId);
  if (!found) return regionId;
  return lang === 'en' ? found.labelEn : found.labelAr;
}

export function getStatesForRegion(regionId: SudanRegionKey | ''): SudanStateGeo[] {
  if (!regionId) return SUDAN_STATES;
  const found = SUDAN_REGIONS.find((r) => r.id === regionId);
  if (!found) return SUDAN_STATES;
  return SUDAN_STATES.filter((s) => found.states.includes(s.name));
}

export const STATE_EN_MAP: Record<string, string> = {
  'الخرطوم': 'Khartoum',
  'الجزيرة': 'Al Jazirah',
  'البحر الأحمر': 'Red Sea',
  'كسلا': 'Kassala',
  'القضارف': 'Al Qadarif',
  'نهر النيل': 'River Nile',
  'الشمالية': 'Northern',
  'سنار': 'Sennar',
  'النيل الأبيض': 'White Nile',
  'النيل الأزرق': 'Blue Nile',
  'شمال كردفان': 'North Kordofan',
  'جنوب كردفان': 'South Kordofan',
  'غرب كردفان': 'West Kordofan',
  'شمال دارفور': 'North Darfur',
  'جنوب دارفور': 'South Darfur',
  'شرق دارفور': 'East Darfur',
  'وسط دارفور': 'Central Darfur',
  'غرب دارفور': 'West Darfur',
};

export const LOCALITY_EN_MAP: Record<string, string> = {
  'الخرطوم': 'Khartoum',
  'أم درمان': 'Omdurman',
  'بحري': 'Khartoum North (Bahri)',
  'شرق النيل': 'East Nile',
  'جبل أولياء': 'Jabal Awliya',
  'كرري': 'Karari',
  'أم بدة': 'Umbadda',
  'ود مدني الكبرى': 'Wad Madani',
  'المناقل': 'Al Managil',
  'الحصاحيصا': 'Al Hasahisa',
  'الكاملين': 'Al Kamlin',
  'شرق الجزيرة': 'East Al Jazirah',
  'جنوب الجزيرة': 'South Al Jazirah',
  'أم القرى': 'Um Al Qura',
  'بورتسودان': 'Port Sudan',
  'سواكن': 'Suakin',
  'طوكر': 'Tokar',
  'سنكات': 'Sinkat',
  'هيا': 'Haya',
  'حلايب': 'Halayeb',
  'كسلا': 'Kassala',
  'حلفا الجديدة': 'New Halfa',
  'نهر عطبرة': 'Atbara River',
  'خشم القربة': 'Khashm el Girba',
  'ريفي كسلا': 'Rural Kassala',
  'همشكوريب': 'Hameshkoreib',
  'بلدية القضارف': 'Al Qadarif City',
  'الفاو': 'Al Faw',
  'الفشقة': 'Al Fashaga',
  'قلع النحل': 'Qala an Nahl',
  'الرهد': 'Ar Rahad',
  'القريشة': 'Al Quraisha',
  'عطبرة': 'Atbara',
  'الدامر': 'Ed Damer',
  'شندي': 'Shendi',
  'بربر': 'Berber',
  'أبو حمد': 'Abu Hamad',
  'المتمة': 'Al Matammah',
  'دنقلا': 'Dongola',
  'مروي': 'Merowe',
  'حلفا': 'Wadi Halfa',
  'الدبة': 'Ed Debba',
  'القولد': 'Al Goled',
  'دلقو': 'Delgo',
  'سنجة': 'Singa',
  'سنار': 'Sennar',
  'الدندر': 'Ad Dinder',
  'السوكي': 'As Suki',
  'شرق سنار': 'East Sennar',
  'أبو حجار': 'Abu Hujar',
  'كوستي': 'Kosti',
  'ربك': 'Rabak',
  'الدويم': 'Ed Dueim',
  'القطينة': 'Al Qutaynah',
  'تندلتي': 'Tendelti',
  'الجبلين': 'Al Jabalayn',
  'الدمازين': 'Ad Damazin',
  'الروصيرص': 'Ar Roseires',
  'باو': 'Baw',
  'الكرمك': 'Al Kurmuk',
  'التضامن': 'At Tadamon',
  'شيكان (الأبيض)': 'Sheikan (El Obeid)',
  'أم روابة': 'Umm Ruwaba',
  'بارا': 'Bara',
  'سودري': 'Sodari',
  'جبرة الشيخ': 'Jabrat al Sheikh',
  'كادقلي': 'Kadugli',
  'الدلنج': 'Dilling',
  'أبو جبيهة': 'Abu Jubayhah',
  'تلودي': 'Talodi',
  'رشاد': 'Rashad',
  'الفولة': 'Al Fulah',
  'النهود': 'En Nahud',
  'بابنوسة': 'Babanusa',
  'المجلد': 'Al Muglad',
  'أبو زبد': 'Abu Zabad',
  'الفاشر': 'El Fasher',
  'كتم': 'Kutum',
  'كبكابية': 'Kabkabiya',
  'مليط': 'Mellit',
  'أم كدادة': 'Umm Kadada',
  'طويلة': 'Tawila',
  'نيالا': 'Nyala',
  'برام': 'Buram',
  'كاس': 'Kas',
  'عد الفرسان': 'Idd al Fursan',
  'تلس': 'Tulus',
  'رهيد البردي': 'Rehid al Birdi',
  'الضعين': 'Ed Daein',
  'أبو كارنكا': 'Abu Karinka',
  'بحر العرب': 'Bahr al Arab',
  'عديلة': 'Adila',
  'شعيرية': 'Shearia',
  'زالنجي': 'Zalingei',
  'نيرتتي': 'Nertiti',
  'وادي صالح': 'Wadi Salih',
  'روكيرو': 'Rokero',
  'أم دخن': 'Um Dukhun',
  'الجنينة': 'El Geneina',
  'فوربرنقا': 'Foro Baranga',
  'بيضة': 'Beida',
  'سربا': 'Sirba',
  'كلبس': 'Kulbus',
};

export const MEDICAL_SPECIALTIES: string[] = [
  'الطب الباطني',
  'أمراض القلب والأوعية الدموية',
  'التغذية العلاجية والسكري',
  'طب الأطفال وحديثي الولادة',
  'أمراض النساء والتوليد',
  'الجراحة العامة',
  'جراحة العظام والمفاصل',
  'طب وجراحة العيون',
  'الأنف والأذن والحنجرة',
  'الأمراض الجلدية والتناسلية',
  'الطب النفسي والصحة السلوكية',
  'طب الأسرة والمجتمع',
];

export const SPECIALTY_EN_MAP: Record<string, string> = {
  'الطب الباطني': 'Internal Medicine',
  'أمراض القلب والأوعية الدموية': 'Cardiology & Vascular Care',
  'التغذية العلاجية والسكري': 'Clinical Nutrition & Diabetes',
  'طب الأطفال وحديثي الولادة': 'Pediatrics & Neonatology',
  'أمراض النساء والتوليد': 'Obstetrics & Gynecology',
  'الجراحة العامة': 'General Surgery',
  'جراحة العظام والمفاصل': 'Orthopedics & Joint Surgery',
  'طب وجراحة العيون': 'Ophthalmology',
  'الأنف والأذن والحنجرة': 'ENT (Ear, Nose & Throat)',
  'الأمراض الجلدية والتناسلية': 'Dermatology',
  'الطب النفسي والصحة السلوكية': 'Psychiatry & Behavioral Health',
  'طب الأسرة والمجتمع': 'Family & Community Medicine',
};

export const WORKING_DAYS: string[] = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];

export const DAY_EN_MAP: Record<string, string> = {
  'السبت': 'Saturday',
  'الأحد': 'Sunday',
  'الاثنين': 'Monday',
  'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday',
  'الخميس': 'Thursday',
  'الجمعة': 'Friday',
};

export const TIME_SLOTS: string[] = [
  '09:00 صباحاً',
  '10:00 صباحاً',
  '11:00 صباحاً',
  '12:30 ظهراً',
  '04:00 عصراً',
  '05:30 مساءً',
  '07:00 مساءً',
];

export const TIME_SLOT_EN_MAP: Record<string, string> = {
  '09:00 صباحاً': '09:00 AM',
  '10:00 صباحاً': '10:00 AM',
  '11:00 صباحاً': '11:00 AM',
  '12:30 ظهراً': '12:30 PM',
  '04:00 عصراً': '04:00 PM',
  '05:30 مساءً': '05:30 PM',
  '07:00 مساءً': '07:00 PM',
};

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const;

export const PLATFORM_IMAGES = {
  hero: '/src/assets/images/hero_sudan_medical_1794761656401.jpg',
  doctorFemale: '/src/assets/images/doc_portrait_female_1794761655889.jpg',
  doctorMale: '/src/assets/images/doc_portrait_male_1794761656791.jpg',
  clinicSuite: '/src/assets/images/clinic_facility_suite_1794761657140.jpg',
} as const;

export const APP_BRAND_ASSETS = {
  banner: '/assets/aistudio/_______________________________a6c51bd3.png',
  mainAppIcon: '/assets/aistudio/file_00000000546c81f68f94443ed6e59baf_08a3d4e8.png',
  providerAppIcon: '/assets/aistudio/file_00000000546c81f68f94443ed6e59baf_08a3d4e8.png',
  patientAppIcon: '/assets/aistudio/file_00000000dda8822fbec93f9773f6758b_f857e931.png',
} as const;

export function translateState(state: string, lang: AppLang = 'ar'): string {
  if (lang === 'ar') return state;
  return STATE_EN_MAP[state] || state;
}

export function translateLocality(locality: string, lang: AppLang = 'ar'): string {
  if (lang === 'ar') return locality;
  return LOCALITY_EN_MAP[locality] || locality;
}

export function translateSpecialty(specialty: string, lang: AppLang = 'ar'): string {
  if (lang === 'ar') return specialty;
  return SPECIALTY_EN_MAP[specialty] || specialty;
}

export function translateDay(day: string, lang: AppLang = 'ar'): string {
  if (lang === 'ar') return day;
  return DAY_EN_MAP[day] || day;
}

export function translateTimeSlot(slot: string, lang: AppLang = 'ar'): string {
  if (lang === 'ar') return slot;
  return TIME_SLOT_EN_MAP[slot] || slot;
}

export function getDoctorPhoto(photoKey?: string, gender?: 'male' | 'female'): string {
  if (photoKey === 'female') return PLATFORM_IMAGES.doctorFemale;
  if (photoKey === 'male') return PLATFORM_IMAGES.doctorMale;
  return gender === 'female' ? PLATFORM_IMAGES.doctorFemale : PLATFORM_IMAGES.doctorMale;
}

export function getApprovalLabel(status: string, lang: AppLang = 'ar'): string {
  if (lang === 'en') {
    switch (status) {
      case 'approved':
        return 'Approved & Published';
      case 'pending':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      case 'suspended':
        return 'Suspended';
      default:
        return status;
    }
  }
  switch (status) {
    case 'approved':
      return 'معتمد ومنشور';
    case 'pending':
      return 'قيد المراجعة';
    case 'rejected':
      return 'مرفوض';
    case 'suspended':
      return 'حساب معلق';
    default:
      return status;
  }
}

export function getAppointmentStatusLabel(status: string, lang: AppLang = 'ar'): string {
  if (lang === 'en') {
    switch (status) {
      case 'pending':
        return 'Awaiting Confirmation';
      case 'confirmed':
        return 'Confirmed';
      case 'arrived':
        return 'Arrived at Clinic';
      case 'completed':
        return 'Attended';
      case 'no_show':
        return 'No Show';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }
  switch (status) {
    case 'pending':
      return 'بانتظار التأكيد';
    case 'confirmed':
      return 'مؤكد';
    case 'arrived':
      return 'حضر بالعيادة';
    case 'completed':
      return 'تم الحضور';
    case 'no_show':
      return 'غائب';
    case 'cancelled':
      return 'ملغي';
    default:
      return status;
  }
}

export function formatCheckInTime(ts: unknown, lang: AppLang = 'ar'): string {
  if (!ts) return '';
  let dateObj: Date | null = null;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    dateObj = (ts as { toDate: () => Date }).toDate();
  } else if (ts instanceof Date) {
    dateObj = ts;
  }
  if (!dateObj || Number.isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleTimeString(lang === 'en' ? 'en-US' : 'ar-SD', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRoleLabel(role: string, lang: AppLang = 'ar'): string {
  if (lang === 'en') {
    switch (role) {
      case 'patient':
        return 'Patient';
      case 'doctor':
        return 'Doctor';
      case 'clinic_admin':
        return 'Clinic / Center Admin';
      case 'central_admin':
        return 'Central Administration';
      default:
        return role;
    }
  }
  switch (role) {
    case 'patient':
      return 'مريض';
    case 'doctor':
      return 'طبيب';
    case 'clinic_admin':
      return 'مدير عيادة / مركز';
    case 'central_admin':
      return 'الإدارة المركزية';
    default:
      return role;
  }
}

export function getCenterTypeLabel(type: string, lang: AppLang = 'ar'): string {
  if (lang === 'en') {
    switch (type) {
      case 'clinic':
        return 'Specialized Clinic';
      case 'medical_center':
        return 'Integrated Medical Center';
      case 'hospital':
        return 'Hospital';
      default:
        return type;
    }
  }
  switch (type) {
    case 'clinic':
      return 'عيادة تخصصية';
    case 'medical_center':
      return 'مركز طبي متكامل';
    case 'hospital':
      return 'مستشفى';
    default:
      return type;
  }
}

export function getRecordTypeLabel(type: string, lang: AppLang = 'ar'): string {
  if (lang === 'en') {
    switch (type) {
      case 'consultation':
        return 'Consultation & Visit';
      case 'diagnosis':
        return 'Diagnosis & Report';
      case 'prescription':
        return 'Prescription';
      case 'measurement':
        return 'Health Measurements';
      case 'nutrition_plan':
        return 'Nutrition & Exercise Plan';
      default:
        return type;
    }
  }
  switch (type) {
    case 'consultation':
      return 'استشارة وزيارة';
    case 'diagnosis':
      return 'تشخيص وتقرير';
    case 'prescription':
      return 'وصفة دوائية';
    case 'measurement':
      return 'قياسات صحية';
    case 'nutrition_plan':
      return 'خطة غذائية ورياضية';
    default:
      return type;
  }
}

export function getVisitTypeLabel(type: string, lang: AppLang = 'ar'): string {
  if (lang === 'en') {
    switch (type) {
      case 'in_person':
        return 'In-Person Visit';
      case 'follow_up':
        return 'Medical Follow-Up';
      case 'nutrition_consult':
        return 'Clinical Nutrition Consult';
      default:
        return type;
    }
  }
  switch (type) {
    case 'in_person':
      return 'كشف حضوري';
    case 'follow_up':
      return 'متابعة طبية';
    case 'nutrition_consult':
      return 'استشارة تغذية علاجية';
    default:
      return type;
  }
}

export function formatSdg(amount: number, lang: AppLang = 'ar'): string {
  if (lang === 'en') {
    return `${new Intl.NumberFormat('en-US').format(amount)} SDG`;
  }
  return `${new Intl.NumberFormat('ar-SD').format(amount)} ج.س`;
}

export function parseAppointmentDateTime(dateStr: string, timeSlot: string): Date | null {
  const dateParts = dateStr.split('-').map((n) => Number(n));
  if (dateParts.length !== 3 || dateParts.some((n) => Number.isNaN(n))) {
    return null;
  }
  const [year, month, day] = dateParts;
  const match = timeSlot.match(/(\d{1,2}):(\d{2})/);
  let hour = match ? Number(match[1]) : 9;
  const minute = match ? Number(match[2]) : 0;

  if (
    (timeSlot.includes('ظهراً') ||
      timeSlot.includes('عصراً') ||
      timeSlot.includes('مساءً') ||
      /\bPM\b/i.test(timeSlot)) &&
    hour < 12
  ) {
    hour += 12;
  } else if ((timeSlot.includes('صباحاً') || /\bAM\b/i.test(timeSlot)) && hour === 12) {
    hour = 0;
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function formatRemainingTime(ms: number, lang: AppLang = 'ar'): string {
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (lang === 'en') {
    if (hours === 0) return `in ${mins} min`;
    if (mins === 0) return `in ${hours} hr`;
    return `in ${hours} hr ${mins} min`;
  }
  if (hours === 0) {
    return `بعد ${mins} دقيقة`;
  }
  if (mins === 0) {
    return `بعد ${hours} ساعة`;
  }
  return `بعد ${hours} ساعة و${mins} دقيقة`;
}

export function formatRemainingTimeArabic(ms: number): string {
  return formatRemainingTime(ms, 'ar');
}

export function normalizeSudanWhatsappDigits(rawPhone?: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length >= 9) {
    digits = `249${digits.slice(1)}`;
  }
  if (!digits.startsWith('249') && digits.length === 9) {
    digits = `249${digits}`;
  }
  return digits.length >= 10 && digits.length <= 15 ? digits : '';
}

export function buildWhatsappReminderMessage(params: {
  doctorName: string;
  clinicName?: string;
  appointmentDate: string;
  timeSlot: string;
  msRemaining?: number;
  lang?: AppLang;
}): string {
  const lang = params.lang || 'ar';
  const remainingNote =
    typeof params.msRemaining === 'number' && params.msRemaining > 0
      ? ` (${formatRemainingTime(params.msRemaining, lang)})`
      : '';
  if (lang === 'en') {
    return [
      'Medical Appointment Reminder - Sudanese Smart Medical Platform',
      `Doctor: ${params.doctorName}`,
      params.clinicName ? `Clinic: ${params.clinicName}` : '',
      `Date: ${params.appointmentDate} | Time: ${translateTimeSlot(params.timeSlot, 'en')}${remainingNote}`,
      'Please arrive 15 minutes before your appointment.',
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    'تذكير بموعد طبي - المنصة الطبية السودانية الذكية',
    `الطبيب: ${params.doctorName}`,
    params.clinicName ? `العيادة: ${params.clinicName}` : '',
    `التاريخ: ${params.appointmentDate} | الوقت: ${params.timeSlot}${remainingNote}`,
    'يرجى الحضور قبل الموعد بـ 15 دقيقة.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildWhatsappDispatchUrl(rawPhone: string | undefined, message: string): string | null {
  const digits = normalizeSudanWhatsappDigits(rawPhone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function getMedicationStatusLabel(
  status: MedicationStatus,
  lang: AppLang = 'ar'
): string {
  if (lang === 'en') {
    const map: Record<MedicationStatus, string> = {
      active: 'Active / Taking',
      paused: 'Paused Temporarily',
      stopped: 'Stopped',
    };
    return map[status];
  }
  const map: Record<MedicationStatus, string> = {
    active: 'جاري الاستخدام',
    paused: 'موقوف مؤقتاً',
    stopped: 'تم الإيقاف',
  };
  return map[status];
}

export function normalizeScheduleTimes(raw: string | string[]): string[] {
  const items = Array.isArray(raw)
    ? raw
    : raw
        .split(/[,،\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  const valid = new Set<string>();
  for (const item of items) {
    const m = item.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) continue;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      valid.add(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }
  }
  return Array.from(valid).sort().slice(0, 6);
}

function formatLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface MedicationDoseAlert {
  state: 'due_now' | 'upcoming' | 'taken_today' | 'inactive' | 'no_schedule';
  nextTime?: string;
  doseKey?: string;
  diffMinutes?: number;
  tomorrow?: boolean;
  isPreDose15Min?: boolean;
}

export function getMedicationDoseAlert(
  med: PatientMedication,
  now: Date = new Date()
): MedicationDoseAlert {
  if (med.status !== 'active') {
    return { state: 'inactive' };
  }

  const times = normalizeScheduleTimes(med.scheduleTimes || []);
  if (times.length === 0) {
    return { state: 'no_schedule' };
  }

  const todayKey = formatLocalDateKey(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowKey = formatLocalDateKey(tomorrowDate);

  const slots = times.map((timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const slotDt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    const diffMinutes = Math.round((slotDt.getTime() - now.getTime()) / 60000);
    const doseKey = `${todayKey}_${timeStr}`;
    return { timeStr, diffMinutes, doseKey };
  });

  // 1. Check for a dose due within 15 minutes before or 30 minutes after scheduled time
  const dueSlot = slots.find(
    (s) => s.diffMinutes >= -30 && s.diffMinutes <= 15 && med.lastTakenKey !== s.doseKey
  );
  if (dueSlot) {
    return {
      state: 'due_now',
      nextTime: dueSlot.timeStr,
      doseKey: dueSlot.doseKey,
      diffMinutes: dueSlot.diffMinutes,
      tomorrow: false,
      isPreDose15Min: dueSlot.diffMinutes > 0 && dueSlot.diffMinutes <= 15,
    };
  }

  // 2. Next upcoming untaken dose later today
  const upcomingToday = slots.find(
    (s) => s.diffMinutes > 0 && med.lastTakenKey !== s.doseKey
  );
  if (upcomingToday) {
    return {
      state: 'upcoming',
      nextTime: upcomingToday.timeStr,
      doseKey: upcomingToday.doseKey,
      diffMinutes: upcomingToday.diffMinutes,
      tomorrow: false,
      isPreDose15Min: false,
    };
  }

  // 3. No remaining untaken slots today -> roll over to tomorrow's first dose
  const firstTime = times[0];
  const [fh, fm] = firstTime.split(':').map(Number);
  const tomorrowSlot = new Date(
    tomorrowDate.getFullYear(),
    tomorrowDate.getMonth(),
    tomorrowDate.getDate(),
    fh,
    fm,
    0,
    0
  );
  const tomorrowDiff = Math.max(
    1,
    Math.round((tomorrowSlot.getTime() - now.getTime()) / 60000)
  );
  const takenToday = Boolean(med.lastTakenKey && med.lastTakenKey.startsWith(`${todayKey}_`));

  return {
    state: takenToday ? 'taken_today' : 'upcoming',
    nextTime: firstTime,
    doseKey: `${tomorrowKey}_${firstTime}`,
    diffMinutes: tomorrowDiff,
    tomorrow: true,
    isPreDose15Min: false,
  };
}

export interface EarliestNextDose {
  medication: PatientMedication;
  alert: MedicationDoseAlert;
}

export function getEarliestNextDose(
  medications: PatientMedication[],
  now: Date = new Date()
): EarliestNextDose | null {
  const candidates = medications
    .filter((med) => med.status === 'active')
    .map((medication) => ({ medication, alert: getMedicationDoseAlert(medication, now) }))
    .filter(
      (item) =>
        (item.alert.state === 'due_now' ||
          item.alert.state === 'upcoming' ||
          item.alert.state === 'taken_today') &&
        Boolean(item.alert.nextTime)
    );

  if (candidates.length === 0) return null;

  const rank = (state: MedicationDoseAlert['state']) =>
    state === 'due_now' ? 0 : state === 'upcoming' ? 1 : 2;

  candidates.sort((a, b) => {
    const rDiff = rank(a.alert.state) - rank(b.alert.state);
    if (rDiff !== 0) return rDiff;
    return (a.alert.diffMinutes ?? 999999) - (b.alert.diffMinutes ?? 999999);
  });

  return candidates[0];
}

export function formatMedicationCountdown(
  diffMinutes: number,
  tomorrow: boolean,
  lang: AppLang = 'ar'
): string {
  if (diffMinutes <= 0 && diffMinutes >= -30) {
    return lang === 'en' ? 'Due now' : 'حان موعد الجرعة الآن';
  }
  const absMins = Math.abs(diffMinutes);
  const hrs = Math.floor(absMins / 60);
  const mins = absMins % 60;
  if (lang === 'en') {
    const prefix = tomorrow ? 'Tomorrow · ' : '';
    if (hrs === 0) return `${prefix}in ${mins} min`;
    if (mins === 0) return `${prefix}in ${hrs} hr`;
    return `${prefix}in ${hrs} hr ${mins} min`;
  }
  const prefix = tomorrow ? 'غداً · ' : '';
  if (hrs === 0) return `${prefix}بعد ${mins} دقيقة`;
  if (mins === 0) return `${prefix}بعد ${hrs} ساعة`;
  return `${prefix}بعد ${hrs} ساعة و${mins} دقيقة`;
}

const JS_DAY_TO_AR: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

function parseMinutesFromTimeToken(token: string): number | null {
  const m = token.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  if (
    (token.includes('ظهراً') ||
      token.includes('عصراً') ||
      token.includes('مساءً') ||
      /\bPM\b/i.test(token)) &&
    hour < 12
  ) {
    hour += 12;
  } else if ((token.includes('صباحاً') || /\bAM\b/i.test(token)) && hour === 12) {
    hour = 0;
  }
  return hour * 60 + minute;
}

function parseWorkingHoursRange(workingHours?: string): { startMins: number; endMins: number } | null {
  if (!workingHours) return null;
  if (workingHours.includes('24')) return null;
  const parts = workingHours.split(/\s*[-–—]|إلى|\bto\b/i);
  if (parts.length < 2) return null;
  const startMins = parseMinutesFromTimeToken(parts[0]);
  const endMins = parseMinutesFromTimeToken(parts[1]);
  if (startMins === null || endMins === null || endMins < startMins) return null;
  return { startMins, endMins };
}

export interface DoctorOpenSlot24h {
  dateStr: string;
  timeSlot: string;
  timestampMs: number;
}

export function getDoctorOpenSlotsNext24h(
  doctor: Pick<DoctorProfile, 'uid' | 'workingDays' | 'workingHours'>,
  bookedSlotKeys: Set<string>,
  now: Date = new Date()
): DoctorOpenSlot24h[] {
  const nowMs = now.getTime();
  const limitMs = nowMs + 24 * 60 * 60 * 1000;
  const workingDays = Array.isArray(doctor.workingDays) ? doctor.workingDays : [];
  const hoursRange = parseWorkingHoursRange(doctor.workingHours);

  const daysToCheck = [0, 1].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 0, 0, 0, 0);
    return {
      dateStr: formatLocalDateKey(d),
      arDay: JS_DAY_TO_AR[d.getDay()],
    };
  });

  const openSlots: DoctorOpenSlot24h[] = [];

  for (const dayInfo of daysToCheck) {
    if (workingDays.length > 0 && !workingDays.includes(dayInfo.arDay)) {
      continue;
    }
    for (const slot of TIME_SLOTS) {
      if (hoursRange) {
        const slotMins = parseMinutesFromTimeToken(slot);
        if (slotMins !== null && (slotMins < hoursRange.startMins || slotMins > hoursRange.endMins)) {
          continue;
        }
      }
      const slotDt = parseAppointmentDateTime(dayInfo.dateStr, slot);
      if (!slotDt) continue;
      const ts = slotDt.getTime();
      if (ts <= nowMs || ts > limitMs) continue;
      const key = `${doctor.uid}|${dayInfo.dateStr}|${slot}`;
      if (bookedSlotKeys.has(key)) continue;
      openSlots.push({
        dateStr: dayInfo.dateStr,
        timeSlot: slot,
        timestampMs: ts,
      });
    }
  }

  return openSlots.sort((a, b) => a.timestampMs - b.timestampMs);
}

export interface WeeklyAppointmentPoint {
  weekKey: string;
  weekLabel: string;
  total: number;
  attended: number;
  upcoming: number;
}

export interface MonthlyAppointmentPoint {
  month: string;
  total: number;
  attended: number;
  upcoming: number;
}

export interface AppointmentPeriodChartsResult {
  availableYears: number[];
  weeklyData: WeeklyAppointmentPoint[];
  monthlyData: MonthlyAppointmentPoint[];
  yearTotal: number;
  yearAttended: number;
  yearUpcoming: number;
  busiestWeek: WeeklyAppointmentPoint | null;
  busiestMonth: MonthlyAppointmentPoint | null;
}

function getSaturdayWeekStart(d: Date): Date {
  const daysSinceSaturday = (d.getDay() + 1) % 7;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceSaturday, 0, 0, 0, 0);
  return start;
}

export function buildAppointmentPeriodCharts(
  appointments: Appointment[],
  selectedYear: number,
  monthLabels: string[]
): AppointmentPeriodChartsResult {
  const currentYear = new Date().getFullYear();
  const yearsSet = new Set<number>([currentYear, selectedYear]);
  appointments.forEach((apt) => {
    const yr = Number(apt.appointmentDate?.slice(0, 4));
    if (!Number.isNaN(yr) && yr >= 2020 && yr <= 2100) {
      yearsSet.add(yr);
    }
  });
  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

  const monthlyData: MonthlyAppointmentPoint[] = monthLabels.map((label) => ({
    month: label,
    total: 0,
    attended: 0,
    upcoming: 0,
  }));

  const weekMap = new Map<string, WeeklyAppointmentPoint>();

  // Pre-seed recent & upcoming 8 weeks when viewing current year so the weekly chart always has rhythm
  if (selectedYear === currentYear) {
    const todaySat = getSaturdayWeekStart(new Date());
    for (let offset = -5; offset <= 2; offset += 1) {
      const ws = new Date(todaySat.getFullYear(), todaySat.getMonth(), todaySat.getDate() + offset * 7);
      const wkKey = formatLocalDateKey(ws);
      weekMap.set(wkKey, {
        weekKey: wkKey,
        weekLabel: `${wkKey.slice(5, 7)}/${wkKey.slice(8, 10)}`,
        total: 0,
        attended: 0,
        upcoming: 0,
      });
    }
  }

  let yearTotal = 0;
  let yearAttended = 0;
  let yearUpcoming = 0;

  appointments.forEach((apt) => {
    if (!apt.appointmentDate || apt.status === 'cancelled') return;
    const parts = apt.appointmentDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return;
    const [yr, mo, dy] = parts;
    if (yr !== selectedYear) return;

    const isAttended = apt.status === 'completed';
    const isUpcoming =
      apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'arrived';

    yearTotal += 1;
    if (isAttended) yearAttended += 1;
    if (isUpcoming) yearUpcoming += 1;

    const monthIdx = mo - 1;
    if (monthIdx >= 0 && monthIdx < monthlyData.length) {
      monthlyData[monthIdx].total += 1;
      if (isAttended) monthlyData[monthIdx].attended += 1;
      if (isUpcoming) monthlyData[monthIdx].upcoming += 1;
    }

    const dt = new Date(yr, mo - 1, dy);
    const satStart = getSaturdayWeekStart(dt);
    const wkKey = formatLocalDateKey(satStart);
    const existing = weekMap.get(wkKey) || {
      weekKey: wkKey,
      weekLabel: `${wkKey.slice(5, 7)}/${wkKey.slice(8, 10)}`,
      total: 0,
      attended: 0,
      upcoming: 0,
    };
    existing.total += 1;
    if (isAttended) existing.attended += 1;
    if (isUpcoming) existing.upcoming += 1;
    weekMap.set(wkKey, existing);
  });

  const allWeeks = Array.from(weekMap.values()).sort((a, b) =>
    a.weekKey.localeCompare(b.weekKey)
  );
  const weeklyData = allWeeks.length > 12 ? allWeeks.slice(-12) : allWeeks;

  const busiestWeek =
    [...weeklyData].filter((w) => w.total > 0).sort((a, b) => b.total - a.total)[0] || null;
  const busiestMonth =
    [...monthlyData].filter((m) => m.total > 0).sort((a, b) => b.total - a.total)[0] || null;

  return {
    availableYears,
    weeklyData,
    monthlyData,
    yearTotal,
    yearAttended,
    yearUpcoming,
    busiestWeek,
    busiestMonth,
  };
}


