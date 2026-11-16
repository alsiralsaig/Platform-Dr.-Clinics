import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'patient' | 'doctor' | 'clinic_admin' | 'central_admin';
export type AccountStatus = 'active' | 'suspended';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type DoctorAvailabilityStatus = 'available' | 'busy';
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'arrived'
  | 'completed'
  | 'no_show'
  | 'cancelled';
export type VisitType = 'in_person' | 'follow_up' | 'nutrition_consult';
export type CenterType = 'clinic' | 'medical_center' | 'hospital';
export type StaffRole = 'manager' | 'receptionist' | 'nurse' | 'doctor';
export type EhrRecordType =
  | 'consultation'
  | 'diagnosis'
  | 'prescription'
  | 'measurement'
  | 'nutrition_plan';
export type ComplaintStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';
export type MedicationStatus = 'active' | 'paused' | 'stopped';

export type PortalTab =
  | 'directory'
  | 'patient'
  | 'doctor'
  | 'clinic'
  | 'admin';

export type AppMode = 'main' | 'provider' | 'patient';
export type ProviderTrack = 'doctor' | 'clinic';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  whatsappNotificationsEnabled?: boolean;
  darkMode?: boolean;
  favoriteDoctorUids?: string[];
  favoriteClinicIds?: string[];
  role: UserRole;
  state?: string;
  locality?: string;
  area?: string;
  accountStatus: AccountStatus;
  suspensionReason?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PatientMedicalProfile {
  uid: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
  heightCm?: number;
  weightKg?: number;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact?: string;
  authorizedDoctorUids: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DoctorProfile {
  uid: string;
  ownerUid: string;
  fullName: string;
  gender: 'male' | 'female';
  specialty: string;
  qualifications: string;
  experienceYears: number;
  licenseNumber: string;
  state: string;
  locality: string;
  area?: string;
  workplaceName: string;
  clinicId?: string;
  consultationFeeSdg: number;
  services: string[];
  workingDays: string[];
  workingHours: string;
  bio?: string;
  photoKey?: string;
  availabilityStatus?: DoctorAvailabilityStatus;
  approvalStatus: ApprovalStatus;
  reviewReason?: string;
  reviewedByUid?: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ClinicCenter {
  id: string;
  ownerUid: string;
  name: string;
  centerType: CenterType;
  licenseNumber: string;
  state: string;
  locality: string;
  area?: string;
  address?: string;
  phone?: string;
  services: string[];
  workingHours: string;
  photoKey?: string;
  approvalStatus: ApprovalStatus;
  reviewReason?: string;
  reviewedByUid?: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ClinicStaffMember {
  uid: string;
  clinicId: string;
  fullName: string;
  staffRole: StaffRole;
  doctorId?: string;
  permissions: string[];
  status: 'active' | 'revoked';
  addedByUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Appointment {
  id: string;
  patientUid: string;
  patientName: string;
  doctorUid: string;
  doctorName: string;
  doctorSpecialty: string;
  clinicId?: string;
  clinicName?: string;
  clinicOwnerUid?: string;
  state: string;
  locality: string;
  appointmentDate: string;
  timeSlot: string;
  visitType: VisitType;
  reason?: string;
  feeSdg: number;
  status: AppointmentStatus;
  checkedInAt?: Timestamp;
  cancellationReason?: string;
  reviewed: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface EhrVitals {
  systolic?: number;
  diastolic?: number;
  bloodGlucose?: number;
  heartRate?: number;
  weightKg?: number;
  bmi?: number;
}

export interface EhrNutritionPlan {
  dailyCalories?: number;
  goal?: string;
  mealGuidelines?: string;
  activityPlan?: string;
}

export interface EhrRecord {
  id: string;
  patientUid: string;
  patientName: string;
  doctorUid: string;
  doctorName: string;
  clinicId?: string;
  clinicName?: string;
  appointmentId?: string;
  recordType: EhrRecordType;
  title: string;
  chiefComplaint?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  medications: string[];
  vitals?: EhrVitals;
  nutritionPlan?: EhrNutritionPlan;
  sharedWithDoctorUids: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ServiceReview {
  id: string;
  appointmentId: string;
  patientUid: string;
  patientName: string;
  doctorUid: string;
  clinicId?: string;
  rating: number;
  comment?: string;
  clinicRating?: number;
  clinicComment?: string;
  status: 'published' | 'hidden';
  createdAt?: Timestamp;
}

export interface Complaint {
  id: string;
  reporterUid: string;
  reporterName: string;
  reporterRole: UserRole;
  targetType: 'doctor' | 'clinic' | 'platform';
  targetId?: string;
  targetName?: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  adminResolution?: string;
  resolvedByUid?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetCollection: string;
  targetId: string;
  details: string;
  createdAt?: Timestamp;
}

export interface Conversation {
  id: string;
  patientUid: string;
  patientName: string;
  doctorUid: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentId?: string;
  appointmentDate?: string;
  lastMessageText: string;
  lastSenderUid: string;
  lastMessageAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  patientUid: string;
  doctorUid: string;
  senderUid: string;
  senderName: string;
  senderRole: 'patient' | 'doctor';
  text: string;
  appointmentRef?: string;
  createdAt?: Timestamp;
}

export interface PatientMedication {
  id: string;
  patientUid: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduleTimes: string[];
  status: MedicationStatus;
  prescribedBy?: string;
  sourceRecordId?: string;
  notes?: string;
  reminderEnabled: boolean;
  lastTakenKey?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BookedSlot {
  id: string;
  doctorUid: string;
  appointmentDate: string;
  timeSlot: string;
  appointmentId: string;
  updatedAt?: Timestamp;
}


