import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  CENTRAL_ADMIN_EMAIL,
  OperationType,
  db,
  handleFirestoreError,
} from './firebase';
import type {
  Appointment,
  AppointmentStatus,
  ApprovalStatus,
  AuditLog,
  BookedSlot,
  ChatMessage,
  ClinicCenter,
  ClinicStaffMember,
  Complaint,
  ComplaintStatus,
  Conversation,
  DoctorAvailabilityStatus,
  DoctorProfile,
  EhrNutritionPlan,
  EhrRecord,
  EhrRecordType,
  EhrVitals,
  MedicationStatus,
  PatientMedicalProfile,
  PatientMedication,
  ServiceReview,
  StaffRole,
  UserProfile,
  UserRole,
  VisitType,
} from '../types/medical';

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function clampStr(val: string | undefined, max: number): string {
  return (val ?? '').trim().slice(0, max);
}

function cleanStringList(items: string[] | undefined, maxItems: number, maxLen = 100): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((s) => s.trim().slice(0, maxLen))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
}

export async function writeAuditLog(params: {
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetCollection: string;
  targetId: string;
  details: string;
}): Promise<void> {
  const id = makeSafeId('log');
  const path = `auditLogs/${id}`;
  try {
    await setDoc(doc(db, 'auditLogs', id), {
      id,
      actorUid: params.actorUid,
      actorName: clampStr(params.actorName, 120) || 'مستخدم',
      actorRole: params.actorRole,
      action: clampStr(params.action, 120),
      targetCollection: clampStr(params.targetCollection, 60),
      targetId: clampStr(params.targetId, 128),
      details: clampStr(params.details, 600),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function ensureUserAccount(
  firebaseUser: User,
  preferredRole?: 'patient' | 'doctor' | 'clinic_admin'
): Promise<UserProfile> {
  const uid = firebaseUser.uid;
  const userRef = doc(db, 'users', uid);
  const isBootAdmin =
    firebaseUser.email?.toLowerCase() === CENTRAL_ADMIN_EMAIL.toLowerCase() &&
    firebaseUser.emailVerified;

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const existingData = snap.data() as UserProfile;
      if (isBootAdmin && existingData.role !== 'central_admin') {
        await updateDoc(userRef, {
          role: 'central_admin',
          updatedAt: serverTimestamp(),
        });
        await setDoc(
          doc(db, 'admins', uid),
          {
            uid,
            email: firebaseUser.email || CENTRAL_ADMIN_EMAIL,
            displayName: clampStr(firebaseUser.displayName || 'مدير المنصة', 120),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
        return { ...existingData, role: 'central_admin' };
      }
      return existingData;
    }

    const initialRole: UserRole = isBootAdmin
      ? 'central_admin'
      : preferredRole || 'patient';
    const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      uid,
      email: clampStr(firebaseUser.email || '', 200),
      displayName: clampStr(firebaseUser.displayName || 'مستخدم جديد', 120),
      phone: '',
      whatsappNotificationsEnabled: false,
      darkMode: false,
      favoriteDoctorUids: [],
      favoriteClinicIds: [],
      role: initialRole,
      state: 'الخرطوم',
      locality: 'الخرطوم',
      area: '',
      accountStatus: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, newProfile);

    if (isBootAdmin) {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        email: clampStr(firebaseUser.email || CENTRAL_ADMIN_EMAIL, 200),
        displayName: clampStr(firebaseUser.displayName || 'مدير المنصة', 120),
        createdAt: serverTimestamp(),
      });
    }

    await writeAuditLog({
      actorUid: uid,
      actorName: newProfile.displayName,
      actorRole: initialRole,
      action: 'إنشاء حساب مستخدم',
      targetCollection: 'users',
      targetId: uid,
      details: `تسجيل حساب جديد بدور ${initialRole}`,
    });

    const refreshed = await getDoc(userRef);
    return refreshed.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: {
    displayName: string;
    phone: string;
    role: 'patient' | 'doctor' | 'clinic_admin';
    state: string;
    locality: string;
    area: string;
  }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: clampStr(updates.displayName, 120),
      phone: clampStr(updates.phone, 40),
      role: updates.role,
      state: clampStr(updates.state, 80),
      locality: clampStr(updates.locality, 80),
      area: clampStr(updates.area, 100),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function switchMyWorkspaceRole(
  uid: string,
  role: 'patient' | 'doctor' | 'clinic_admin'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function updateUserNotificationPreferences(
  uid: string,
  actorName: string,
  actorRole: UserRole,
  input: {
    phone: string;
    whatsappNotificationsEnabled: boolean;
  }
): Promise<UserProfile> {
  const ref = doc(db, 'users', uid);
  const cleanPhone = clampStr(input.phone, 40);
  try {
    await updateDoc(ref, {
      phone: cleanPhone,
      whatsappNotificationsEnabled: input.whatsappNotificationsEnabled,
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: uid,
      actorName,
      actorRole,
      action: 'تحديث تفضيلات رقم الهاتف وإشعارات واتساب',
      targetCollection: 'users',
      targetId: uid,
      details: input.whatsappNotificationsEnabled
        ? `تفعيل إشعارات واتساب للرقم ${cleanPhone}`
        : 'إيقاف إشعارات واتساب',
    });

    const refreshed = await getDoc(ref);
    return refreshed.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function updateUserDarkModePreference(
  uid: string,
  darkMode: boolean
): Promise<UserProfile> {
  const ref = doc(db, 'users', uid);
  try {
    await updateDoc(ref, {
      darkMode: Boolean(darkMode),
      updatedAt: serverTimestamp(),
    });
    const refreshed = await getDoc(ref);
    return refreshed.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function updateUserFavorites(
  uid: string,
  actorName: string,
  actorRole: UserRole,
  updates: {
    favoriteDoctorUids?: string[];
    favoriteClinicIds?: string[];
  }
): Promise<UserProfile> {
  const ref = doc(db, 'users', uid);
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.favoriteDoctorUids !== undefined) {
    payload.favoriteDoctorUids = cleanStringList(updates.favoriteDoctorUids, 50, 128);
  }
  if (updates.favoriteClinicIds !== undefined) {
    payload.favoriteClinicIds = cleanStringList(updates.favoriteClinicIds, 50, 128);
  }

  try {
    await updateDoc(ref, payload);
    await writeAuditLog({
      actorUid: uid,
      actorName,
      actorRole,
      action: 'تحديث قائمة المفضلة',
      targetCollection: 'users',
      targetId: uid,
      details: `تحديث الأطباء والعيادات المفضلة`,
    });
    const refreshed = await getDoc(ref);
    return refreshed.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// ------------------------------------------------------------------
// Patient Baseline Profile & EHR Consent
// ------------------------------------------------------------------
export async function getPatientProfile(patientUid: string): Promise<PatientMedicalProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'patients', patientUid));
    return snap.exists() ? (snap.data() as PatientMedicalProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `patients/${patientUid}`);
  }
}

export async function savePatientProfile(
  patientUid: string,
  actorName: string,
  actorRole: UserRole,
  input: {
    fullName: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female';
    bloodType: PatientMedicalProfile['bloodType'];
    heightCm?: number;
    weightKg?: number;
    allergies: string[];
    chronicConditions: string[];
    emergencyContact?: string;
    authorizedDoctorUids: string[];
  }
): Promise<void> {
  const ref = doc(db, 'patients', patientUid);
  try {
    const snap = await getDoc(ref);
    const payload = {
      fullName: clampStr(input.fullName, 120),
      dateOfBirth: clampStr(input.dateOfBirth, 20),
      gender: input.gender || 'male',
      bloodType: input.bloodType,
      ...(input.heightCm && input.heightCm >= 30 && input.heightCm <= 250
        ? { heightCm: Number(input.heightCm) }
        : {}),
      ...(input.weightKg && input.weightKg >= 2 && input.weightKg <= 400
        ? { weightKg: Number(input.weightKg) }
        : {}),
      allergies: cleanStringList(input.allergies, 20, 80),
      chronicConditions: cleanStringList(input.chronicConditions, 20, 80),
      emergencyContact: clampStr(input.emergencyContact, 160),
      authorizedDoctorUids: cleanStringList(input.authorizedDoctorUids, 20, 128),
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: patientUid,
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, payload);
    }

    await writeAuditLog({
      actorUid: patientUid,
      actorName,
      actorRole,
      action: 'تحديث الملف الطبي الأساسي',
      targetCollection: 'patients',
      targetId: patientUid,
      details: `تحديث البيانات الصحية الأساسية وقائمة الأطباء المصرح لهم (${payload.authorizedDoctorUids.length})`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `patients/${patientUid}`);
  }
}

export async function updatePatientDoctorConsent(
  patientUid: string,
  patientName: string,
  authorizedDoctorUids: string[],
  existingRecords: EhrRecord[]
): Promise<void> {
  const cleanAuthorized = cleanStringList(authorizedDoctorUids, 20, 128);
  try {
    const batch = writeBatch(db);
    const patientRef = doc(db, 'patients', patientUid);
    const snap = await getDoc(patientRef);
    if (!snap.exists()) {
      batch.set(patientRef, {
        uid: patientUid,
        fullName: clampStr(patientName, 120),
        bloodType: 'unknown',
        allergies: [],
        chronicConditions: [],
        authorizedDoctorUids: cleanAuthorized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(patientRef, {
        authorizedDoctorUids: cleanAuthorized,
        updatedAt: serverTimestamp(),
      });
    }

    for (const rec of existingRecords) {
      if (rec.patientUid === patientUid) {
        const merged = Array.from(new Set([rec.doctorUid, ...cleanAuthorized])).slice(0, 20);
        batch.update(doc(db, 'ehrRecords', rec.id), {
          sharedWithDoctorUids: merged,
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();

    await writeAuditLog({
      actorUid: patientUid,
      actorName: patientName,
      actorRole: 'patient',
      action: 'تعديل صلاحيات الوصول للملف الطبي',
      targetCollection: 'patients',
      targetId: patientUid,
      details: `عدد الأطباء المصرح لهم حالياً: ${cleanAuthorized.length}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `patients/${patientUid}`);
  }
}

// ------------------------------------------------------------------
// Doctors Directory & Portal
// ------------------------------------------------------------------
export async function fetchApprovedDoctors(): Promise<DoctorProfile[]> {
  try {
    const q = query(
      collection(db, 'doctors'),
      where('approvalStatus', '==', 'approved')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as DoctorProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'doctors');
  }
}

export async function fetchMyDoctorProfile(uid: string): Promise<DoctorProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'doctors', uid));
    return snap.exists() ? (snap.data() as DoctorProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `doctors/${uid}`);
  }
}

export async function saveDoctorProfile(
  uid: string,
  actorName: string,
  actorRole: UserRole,
  input: {
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
  }
): Promise<void> {
  const ref = doc(db, 'doctors', uid);
  try {
    const snap = await getDoc(ref);
    const commonFields = {
      fullName: clampStr(input.fullName, 120),
      gender: input.gender,
      specialty: clampStr(input.specialty, 100),
      qualifications: clampStr(input.qualifications, 300),
      experienceYears: Math.max(0, Math.min(70, Number(input.experienceYears) || 0)),
      licenseNumber: clampStr(input.licenseNumber, 80),
      state: clampStr(input.state, 80),
      locality: clampStr(input.locality, 80),
      area: clampStr(input.area, 100),
      workplaceName: clampStr(input.workplaceName, 160),
      clinicId: clampStr(input.clinicId, 128),
      consultationFeeSdg: Math.max(0, Math.min(10000000, Number(input.consultationFeeSdg) || 0)),
      services: cleanStringList(input.services, 15, 80),
      workingDays: cleanStringList(input.workingDays, 7, 30),
      workingHours: clampStr(input.workingHours, 120),
      bio: clampStr(input.bio, 800),
      photoKey: input.gender,
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        ownerUid: uid,
        ...commonFields,
        approvalStatus: 'pending' as ApprovalStatus,
        availabilityStatus: 'available' as DoctorAvailabilityStatus,
        reviewReason: '',
        reviewedByUid: '',
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
      });
      await writeAuditLog({
        actorUid: uid,
        actorName,
        actorRole,
        action: 'تقديم طلب اعتماد طبيب',
        targetCollection: 'doctors',
        targetId: uid,
        details: `طلب انضمام طبيب (${commonFields.specialty} - ولاية ${commonFields.state}) بانتظار الاعتماد المركزي`,
      });
    } else {
      await updateDoc(ref, commonFields);
      await writeAuditLog({
        actorUid: uid,
        actorName,
        actorRole,
        action: 'تحديث الملف المهني للطبيب',
        targetCollection: 'doctors',
        targetId: uid,
        details: `تحديث بيانات الملف المهني للطبيب ${commonFields.fullName}`,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `doctors/${uid}`);
  }
}

export async function updateDoctorAvailability(
  doctorUid: string,
  actorName: string,
  actorRole: UserRole,
  availabilityStatus: DoctorAvailabilityStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'doctors', doctorUid), {
      availabilityStatus,
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      actorUid: doctorUid,
      actorName,
      actorRole,
      action: 'تحديث حالة التوفر الفورية للطبيب',
      targetCollection: 'doctors',
      targetId: doctorUid,
      details:
        availabilityStatus === 'available'
          ? 'تغيير حالة الطبيب الفورية إلى: متاح الآن'
          : 'تغيير حالة الطبيب الفورية إلى: مشغول حالياً',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `doctors/${doctorUid}`);
  }
}

// ------------------------------------------------------------------
// Clinics & Medical Centers + Staff Isolation
// ------------------------------------------------------------------
export async function fetchApprovedClinics(): Promise<ClinicCenter[]> {
  try {
    const q = query(
      collection(db, 'clinics'),
      where('approvalStatus', '==', 'approved')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ClinicCenter);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'clinics');
  }
}

export async function fetchMyClinics(ownerUid: string): Promise<ClinicCenter[]> {
  try {
    const q = query(collection(db, 'clinics'), where('ownerUid', '==', ownerUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ClinicCenter);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'clinics');
  }
}

export async function saveClinicCenter(
  ownerUid: string,
  actorName: string,
  actorRole: UserRole,
  existingClinicId: string | null,
  input: {
    name: string;
    centerType: ClinicCenter['centerType'];
    licenseNumber: string;
    state: string;
    locality: string;
    area?: string;
    address?: string;
    phone?: string;
    services: string[];
    workingHours: string;
  }
): Promise<string> {
  const clinicId = existingClinicId || makeSafeId('clinic');
  const ref = doc(db, 'clinics', clinicId);
  try {
    const commonFields = {
      name: clampStr(input.name, 160),
      centerType: input.centerType,
      licenseNumber: clampStr(input.licenseNumber, 80),
      state: clampStr(input.state, 80),
      locality: clampStr(input.locality, 80),
      area: clampStr(input.area, 100),
      address: clampStr(input.address, 250),
      phone: clampStr(input.phone, 40),
      services: cleanStringList(input.services, 25, 80),
      workingHours: clampStr(input.workingHours, 120),
      photoKey: 'clinic',
      updatedAt: serverTimestamp(),
    };

    if (!existingClinicId) {
      await setDoc(ref, {
        id: clinicId,
        ownerUid,
        ...commonFields,
        approvalStatus: 'pending' as ApprovalStatus,
        reviewReason: '',
        reviewedByUid: '',
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
      });
      await writeAuditLog({
        actorUid: ownerUid,
        actorName,
        actorRole,
        action: 'تقديم طلب تسجيل مركز طبي',
        targetCollection: 'clinics',
        targetId: clinicId,
        details: `طلب تسجيل (${commonFields.name} - ولاية ${commonFields.state}) بانتظار الاعتماد المركزي`,
      });
    } else {
      await updateDoc(ref, commonFields);
      await writeAuditLog({
        actorUid: ownerUid,
        actorName,
        actorRole,
        action: 'تحديث بيانات المركز الطبي',
        targetCollection: 'clinics',
        targetId: clinicId,
        details: `تحديث بيانات ${commonFields.name}`,
      });
    }
    return clinicId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `clinics/${clinicId}`);
  }
}

export async function fetchClinicStaff(
  clinicId: string,
  ownerUid: string,
  isAdminUser: boolean
): Promise<ClinicStaffMember[]> {
  try {
    const q = isAdminUser
      ? query(collection(db, 'clinics', clinicId, 'staff'))
      : query(
          collection(db, 'clinics', clinicId, 'staff'),
          where('addedByUid', '==', ownerUid)
        );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ClinicStaffMember);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `clinics/${clinicId}/staff`);
  }
}

export async function addClinicStaffMember(
  clinicId: string,
  addedByUid: string,
  actorName: string,
  actorRole: UserRole,
  input: {
    fullName: string;
    staffRole: StaffRole;
    doctorId?: string;
    permissions: string[];
  }
): Promise<void> {
  const staffId = makeSafeId('staff');
  try {
    await setDoc(doc(db, 'clinics', clinicId, 'staff', staffId), {
      uid: staffId,
      clinicId,
      fullName: clampStr(input.fullName, 120),
      staffRole: input.staffRole,
      ...(input.doctorId ? { doctorId: clampStr(input.doctorId, 128) } : {}),
      permissions: cleanStringList(input.permissions, 10, 60),
      status: 'active',
      addedByUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: addedByUid,
      actorName,
      actorRole,
      action: 'إضافة عضو كادر للعيادة',
      targetCollection: `clinics/${clinicId}/staff`,
      targetId: staffId,
      details: `إضافة ${input.fullName} بدور ${input.staffRole}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `clinics/${clinicId}/staff/${staffId}`);
  }
}

export async function toggleClinicStaffStatus(
  clinicId: string,
  staffId: string,
  newStatus: 'active' | 'revoked'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'clinics', clinicId, 'staff', staffId), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `clinics/${clinicId}/staff/${staffId}`);
  }
}

// ------------------------------------------------------------------
// Appointments
// ------------------------------------------------------------------
export async function createAppointment(
  patientUid: string,
  patientName: string,
  doctor: DoctorProfile,
  clinicOwnerUid: string,
  input: {
    appointmentDate: string;
    timeSlot: string;
    visitType: VisitType;
    reason?: string;
  }
): Promise<string> {
  const id = makeSafeId('apt');
  const cleanDate = clampStr(input.appointmentDate, 20);
  const cleanSlot = clampStr(input.timeSlot, 40);
  const slotId = `slot_${id}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'appointments', id), {
      id,
      patientUid,
      patientName: clampStr(patientName, 120),
      doctorUid: doctor.uid,
      doctorName: clampStr(doctor.fullName, 120),
      doctorSpecialty: clampStr(doctor.specialty, 100),
      clinicId: clampStr(doctor.clinicId, 128),
      clinicName: clampStr(doctor.workplaceName, 160),
      clinicOwnerUid: clampStr(clinicOwnerUid, 128),
      state: clampStr(doctor.state, 80),
      locality: clampStr(doctor.locality, 80),
      appointmentDate: cleanDate,
      timeSlot: cleanSlot,
      visitType: input.visitType,
      reason: clampStr(input.reason, 500),
      feeSdg: doctor.consultationFeeSdg,
      status: 'pending' as AppointmentStatus,
      cancellationReason: '',
      reviewed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'bookedSlots', slotId), {
      id: slotId,
      appointmentId: id,
      doctorUid: doctor.uid,
      appointmentDate: cleanDate,
      timeSlot: cleanSlot,
      createdAt: serverTimestamp(),
    });
    await batch.commit();

    await writeAuditLog({
      actorUid: patientUid,
      actorName: patientName,
      actorRole: 'patient',
      action: 'حجز موعد طبي جديد',
      targetCollection: 'appointments',
      targetId: id,
      details: `حجز موعد مع د. ${doctor.fullName} بتاريخ ${cleanDate} (${cleanSlot})`,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `appointments/${id}`);
  }
}

export function subscribeBookedSlots(
  onBookedSlots: (slots: BookedSlot[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'bookedSlots'),
    (snap) => {
      onBookedSlots(snap.docs.map((d) => d.data() as BookedSlot));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'bookedSlots')
  );
}

export async function fetchAppointmentsByPatient(patientUid: string): Promise<Appointment[]> {
  try {
    const q = query(collection(db, 'appointments'), where('patientUid', '==', patientUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Appointment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'appointments');
  }
}

export async function fetchAppointmentsByDoctor(doctorUid: string): Promise<Appointment[]> {
  try {
    const q = query(collection(db, 'appointments'), where('doctorUid', '==', doctorUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Appointment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'appointments');
  }
}

export async function fetchAppointmentsByClinicOwner(clinicOwnerUid: string): Promise<Appointment[]> {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('clinicOwnerUid', '==', clinicOwnerUid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Appointment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'appointments');
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  actorUid: string,
  actorName: string,
  actorRole: UserRole,
  status: AppointmentStatus,
  cancellationReason = ''
): Promise<void> {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      status,
      cancellationReason: clampStr(cancellationReason, 300),
      updatedAt: serverTimestamp(),
    });

    if (status === 'cancelled' || status === 'no_show') {
      try {
        await deleteDoc(doc(db, 'bookedSlots', `slot_${appointmentId}`));
      } catch {
        // Legacy appointments created prior to bookedSlots may not have a slot lock doc
      }
    }

    await writeAuditLog({
      actorUid,
      actorName,
      actorRole,
      action: `تحديث حالة الموعد إلى ${status}`,
      targetCollection: 'appointments',
      targetId: appointmentId,
      details: cancellationReason ? `السبب: ${cancellationReason}` : `تغيير الحالة إلى ${status}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `appointments/${appointmentId}`);
  }
}

export async function checkInPatientAppointment(
  appointmentId: string,
  patientUid: string,
  patientName: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      status: 'arrived' as AppointmentStatus,
      checkedInAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: patientUid,
      actorName: patientName,
      actorRole: 'patient',
      action: 'تأكيد وصول المريض رقمياً للعيادة',
      targetCollection: 'appointments',
      targetId: appointmentId,
      details: `سجّل المريض ${patientName} وصوله للعيادة رقمياً`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `appointments/${appointmentId}`);
  }
}

export async function fetchAppointmentById(appointmentId: string): Promise<Appointment | null> {
  const safeId = clampStr(appointmentId, 128);
  if (!safeId) return null;
  try {
    const snap = await getDoc(doc(db, 'appointments', safeId));
    return snap.exists() ? (snap.data() as Appointment) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `appointments/${safeId}`);
  }
}

export async function checkInAppointmentByProvider(
  appointmentId: string,
  actorUid: string,
  actorName: string,
  actorRole: UserRole
): Promise<void> {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      status: 'arrived' as AppointmentStatus,
      checkedInAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid,
      actorName,
      actorRole,
      action: 'تسجيل وصول المريض عبر مسح رمز QR بالاستقبال',
      targetCollection: 'appointments',
      targetId: appointmentId,
      details: `تم تأكيد وصول المريض وتسجيل دخوله عبر بوابة مقدم الخدمة`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `appointments/${appointmentId}`);
  }
}

// ------------------------------------------------------------------
// Electronic Health Records (EHR)
// ------------------------------------------------------------------
export async function fetchPatientEhrRecords(patientUid: string): Promise<EhrRecord[]> {
  try {
    const q = query(collection(db, 'ehrRecords'), where('patientUid', '==', patientUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as EhrRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'ehrRecords');
  }
}

export async function fetchDoctorEhrRecords(doctorUid: string): Promise<EhrRecord[]> {
  try {
    const [authoredSnap, sharedSnap] = await Promise.all([
      getDocs(query(collection(db, 'ehrRecords'), where('doctorUid', '==', doctorUid))),
      getDocs(
        query(
          collection(db, 'ehrRecords'),
          where('sharedWithDoctorUids', 'array-contains', doctorUid)
        )
      ),
    ]);
    const map = new Map<string, EhrRecord>();
    authoredSnap.docs.forEach((d) => map.set(d.id, d.data() as EhrRecord));
    sharedSnap.docs.forEach((d) => map.set(d.id, d.data() as EhrRecord));
    return Array.from(map.values());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'ehrRecords');
  }
}

export async function fetchAuthorizedPatientsForDoctor(
  doctorUid: string
): Promise<PatientMedicalProfile[]> {
  try {
    const q = query(
      collection(db, 'patients'),
      where('authorizedDoctorUids', 'array-contains', doctorUid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PatientMedicalProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'patients');
  }
}

export async function createEhrRecord(
  actorUid: string,
  actorName: string,
  actorRole: UserRole,
  input: {
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
  }
): Promise<string> {
  const id = makeSafeId('ehr');
  try {
    await setDoc(doc(db, 'ehrRecords', id), {
      id,
      patientUid: input.patientUid,
      patientName: clampStr(input.patientName, 120),
      doctorUid: input.doctorUid,
      doctorName: clampStr(input.doctorName, 120),
      clinicId: clampStr(input.clinicId, 128),
      clinicName: clampStr(input.clinicName, 160),
      appointmentId: clampStr(input.appointmentId, 128),
      recordType: input.recordType,
      title: clampStr(input.title, 160),
      chiefComplaint: clampStr(input.chiefComplaint, 500),
      diagnosis: clampStr(input.diagnosis, 600),
      clinicalNotes: clampStr(input.clinicalNotes, 2000),
      medications: cleanStringList(input.medications, 15, 120),
      ...(input.vitals ? { vitals: input.vitals } : {}),
      ...(input.nutritionPlan ? { nutritionPlan: input.nutritionPlan } : {}),
      sharedWithDoctorUids: [input.doctorUid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid,
      actorName,
      actorRole,
      action: 'إضافة سجل في الملف الطبي الإلكتروني',
      targetCollection: 'ehrRecords',
      targetId: id,
      details: `تسجيل (${input.recordType}): ${input.title} للمريض ${input.patientName}`,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `ehrRecords/${id}`);
  }
}

// ------------------------------------------------------------------
// Reviews & Complaints
// ------------------------------------------------------------------
export async function fetchPublishedReviews(): Promise<ServiceReview[]> {
  try {
    const q = query(collection(db, 'reviews'), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ServiceReview);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reviews');
  }
}

export async function fetchPatientReviews(patientUid: string): Promise<ServiceReview[]> {
  try {
    const q = query(collection(db, 'reviews'), where('patientUid', '==', patientUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ServiceReview);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reviews');
  }
}

export async function submitAppointmentReview(
  appointment: Appointment,
  patientUid: string,
  patientName: string,
  rating: number,
  comment: string,
  clinicRating?: number,
  clinicComment?: string
): Promise<void> {
  const id = makeSafeId('rev');
  try {
    const batch = writeBatch(db);
    const reviewPayload: Record<string, unknown> = {
      id,
      appointmentId: appointment.id,
      patientUid,
      patientName: clampStr(patientName, 120),
      doctorUid: appointment.doctorUid,
      clinicId: clampStr(appointment.clinicId, 128),
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      comment: clampStr(comment, 600),
      status: 'published',
      createdAt: serverTimestamp(),
    };
    if (typeof clinicRating === 'number' && clinicRating >= 1 && clinicRating <= 5) {
      reviewPayload.clinicRating = Math.max(1, Math.min(5, Math.round(clinicRating)));
    }
    if (clinicComment && clinicComment.trim()) {
      reviewPayload.clinicComment = clampStr(clinicComment, 600);
    }

    batch.set(doc(db, 'reviews', id), reviewPayload);
    batch.update(doc(db, 'appointments', appointment.id), {
      reviewed: true,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    await writeAuditLog({
      actorUid: patientUid,
      actorName: patientName,
      actorRole: 'patient',
      action: 'تقييم خدمة طبية بعد الزيارة',
      targetCollection: 'reviews',
      targetId: id,
      details: `تقييم ${rating}/5 للطبيب ${appointment.doctorName}${
        clinicRating ? ` و${clinicRating}/5 للعيادة` : ''
      }`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reviews/${id}`);
  }
}

export async function fetchMyComplaints(uid: string): Promise<Complaint[]> {
  try {
    const q = query(collection(db, 'complaints'), where('reporterUid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Complaint);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'complaints');
  }
}

export async function submitComplaint(
  reporterUid: string,
  reporterName: string,
  reporterRole: UserRole,
  input: {
    targetType: Complaint['targetType'];
    targetId?: string;
    targetName?: string;
    subject: string;
    description: string;
  }
): Promise<void> {
  const id = makeSafeId('cmp');
  try {
    await setDoc(doc(db, 'complaints', id), {
      id,
      reporterUid,
      reporterName: clampStr(reporterName, 120),
      reporterRole,
      targetType: input.targetType,
      targetId: clampStr(input.targetId, 128),
      targetName: clampStr(input.targetName, 160),
      subject: clampStr(input.subject, 160),
      description: clampStr(input.description, 1500),
      status: 'open' as ComplaintStatus,
      adminResolution: '',
      resolvedByUid: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: reporterUid,
      actorName: reporterName,
      actorRole: reporterRole,
      action: 'تقديم شكوى / بلاغ',
      targetCollection: 'complaints',
      targetId: id,
      details: `موضوع الشكوى: ${input.subject}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `complaints/${id}`);
  }
}

// ------------------------------------------------------------------
// Central Admin Operations
// ------------------------------------------------------------------
export async function fetchAdminDashboardData(): Promise<{
  doctors: DoctorProfile[];
  clinics: ClinicCenter[];
  users: UserProfile[];
  appointments: Appointment[];
  complaints: Complaint[];
  reviews: ServiceReview[];
  auditLogs: AuditLog[];
}> {
  try {
    const [docSnap, clinicSnap, userSnap, aptSnap, cmpSnap, revSnap, logSnap] =
      await Promise.all([
        getDocs(collection(db, 'doctors')),
        getDocs(collection(db, 'clinics')),
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'appointments'), limit(100))),
        getDocs(collection(db, 'complaints')),
        getDocs(collection(db, 'reviews')),
        getDocs(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(80))),
      ]);

    return {
      doctors: docSnap.docs.map((d) => d.data() as DoctorProfile),
      clinics: clinicSnap.docs.map((d) => d.data() as ClinicCenter),
      users: userSnap.docs.map((d) => d.data() as UserProfile),
      appointments: aptSnap.docs.map((d) => d.data() as Appointment),
      complaints: cmpSnap.docs.map((d) => d.data() as Complaint),
      reviews: revSnap.docs.map((d) => d.data() as ServiceReview),
      auditLogs: logSnap.docs.map((d) => d.data() as AuditLog),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_dashboard');
  }
}

export function subscribeApprovedDirectory(callbacks: {
  onDoctors: (doctors: DoctorProfile[]) => void;
  onClinics: (clinics: ClinicCenter[]) => void;
  onReviews: (reviews: ServiceReview[]) => void;
}): Unsubscribe {
  const unsubDocs = onSnapshot(
    query(collection(db, 'doctors'), where('approvalStatus', '==', 'approved')),
    (snap) => {
      callbacks.onDoctors(snap.docs.map((d) => d.data() as DoctorProfile));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'doctors')
  );

  const unsubClinics = onSnapshot(
    query(collection(db, 'clinics'), where('approvalStatus', '==', 'approved')),
    (snap) => {
      callbacks.onClinics(snap.docs.map((d) => d.data() as ClinicCenter));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'clinics')
  );

  const unsubReviews = onSnapshot(
    query(collection(db, 'reviews'), where('status', '==', 'published')),
    (snap) => {
      callbacks.onReviews(snap.docs.map((d) => d.data() as ServiceReview));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'reviews')
  );

  return () => {
    unsubDocs();
    unsubClinics();
    unsubReviews();
  };
}

export function subscribePatientAppointments(
  patientUid: string,
  onAppointments: (appointments: Appointment[]) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'appointments'), where('patientUid', '==', patientUid)),
    (snap) => {
      onAppointments(snap.docs.map((d) => d.data() as Appointment));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'appointments')
  );
}

export function subscribeDoctorAppointments(
  doctorUid: string,
  onAppointments: (appointments: Appointment[]) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'appointments'), where('doctorUid', '==', doctorUid)),
    (snap) => {
      onAppointments(snap.docs.map((d) => d.data() as Appointment));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'appointments')
  );
}

export function subscribeClinicOwnerAppointments(
  clinicOwnerUid: string,
  onAppointments: (appointments: Appointment[]) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'appointments'), where('clinicOwnerUid', '==', clinicOwnerUid)),
    (snap) => {
      onAppointments(snap.docs.map((d) => d.data() as Appointment));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'appointments')
  );
}

export function subscribeAdminDashboardData(callbacks: {
  onDoctors: (doctors: DoctorProfile[]) => void;
  onClinics: (clinics: ClinicCenter[]) => void;
  onUsers: (users: UserProfile[]) => void;
  onAppointments: (appointments: Appointment[]) => void;
  onComplaints: (complaints: Complaint[]) => void;
  onReviews: (reviews: ServiceReview[]) => void;
  onAuditLogs: (logs: AuditLog[]) => void;
}): Unsubscribe {
  const unsubs: Unsubscribe[] = [
    onSnapshot(
      collection(db, 'doctors'),
      (snap) => callbacks.onDoctors(snap.docs.map((d) => d.data() as DoctorProfile)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'doctors')
    ),
    onSnapshot(
      collection(db, 'clinics'),
      (snap) => callbacks.onClinics(snap.docs.map((d) => d.data() as ClinicCenter)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'clinics')
    ),
    onSnapshot(
      collection(db, 'users'),
      (snap) => callbacks.onUsers(snap.docs.map((d) => d.data() as UserProfile)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    ),
    onSnapshot(
      query(collection(db, 'appointments'), limit(200)),
      (snap) => callbacks.onAppointments(snap.docs.map((d) => d.data() as Appointment)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'appointments')
    ),
    onSnapshot(
      collection(db, 'complaints'),
      (snap) => callbacks.onComplaints(snap.docs.map((d) => d.data() as Complaint)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'complaints')
    ),
    onSnapshot(
      collection(db, 'reviews'),
      (snap) => callbacks.onReviews(snap.docs.map((d) => d.data() as ServiceReview)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'reviews')
    ),
    onSnapshot(
      query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(80)),
      (snap) => callbacks.onAuditLogs(snap.docs.map((d) => d.data() as AuditLog)),
      (error) => handleFirestoreError(error, OperationType.LIST, 'auditLogs')
    ),
  ];

  return () => {
    unsubs.forEach((fn) => fn());
  };
}

export async function adminReviewDoctor(
  adminUid: string,
  adminName: string,
  doctor: DoctorProfile,
  decision: ApprovalStatus,
  reason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'doctors', doctor.uid), {
      approvalStatus: decision,
      reviewReason: clampStr(reason, 500),
      reviewedByUid: adminUid,
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: adminUid,
      actorName: adminName,
      actorRole: 'central_admin',
      action: `قرار اعتماد طبيب: ${decision}`,
      targetCollection: 'doctors',
      targetId: doctor.uid,
      details: `د. ${doctor.fullName} — الحالة: ${decision}${reason ? ` — السبب: ${reason}` : ''}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `doctors/${doctor.uid}`);
  }
}

export async function adminReviewClinic(
  adminUid: string,
  adminName: string,
  clinic: ClinicCenter,
  decision: ApprovalStatus,
  reason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'clinics', clinic.id), {
      approvalStatus: decision,
      reviewReason: clampStr(reason, 500),
      reviewedByUid: adminUid,
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: adminUid,
      actorName: adminName,
      actorRole: 'central_admin',
      action: `قرار اعتماد مركز طبي: ${decision}`,
      targetCollection: 'clinics',
      targetId: clinic.id,
      details: `${clinic.name} — الحالة: ${decision}${reason ? ` — السبب: ${reason}` : ''}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `clinics/${clinic.id}`);
  }
}

export async function adminUpdateUserStatus(
  adminUid: string,
  adminName: string,
  targetUser: UserProfile,
  accountStatus: 'active' | 'suspended',
  suspensionReason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', targetUser.uid), {
      accountStatus,
      suspensionReason: clampStr(suspensionReason, 500),
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: adminUid,
      actorName: adminName,
      actorRole: 'central_admin',
      action: accountStatus === 'suspended' ? 'تعليق حساب مستخدم' : 'إعادة تفعيل حساب مستخدم',
      targetCollection: 'users',
      targetId: targetUser.uid,
      details: `${targetUser.displayName} (${targetUser.email})${suspensionReason ? ` — السبب: ${suspensionReason}` : ''}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUser.uid}`);
  }
}

export async function adminResolveComplaint(
  adminUid: string,
  adminName: string,
  complaintId: string,
  status: ComplaintStatus,
  adminResolution: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'complaints', complaintId), {
      status,
      adminResolution: clampStr(adminResolution, 600),
      resolvedByUid: adminUid,
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: adminUid,
      actorName: adminName,
      actorRole: 'central_admin',
      action: `تحديث حالة الشكوى إلى ${status}`,
      targetCollection: 'complaints',
      targetId: complaintId,
      details: adminResolution || `تحديث إلى ${status}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `complaints/${complaintId}`);
  }
}

export async function adminToggleReviewVisibility(
  adminUid: string,
  adminName: string,
  reviewId: string,
  status: 'published' | 'hidden'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'reviews', reviewId), { status });
    await writeAuditLog({
      actorUid: adminUid,
      actorName: adminName,
      actorRole: 'central_admin',
      action: status === 'hidden' ? 'إخفاء تقييم مخالف' : 'إعادة نشر تقييم',
      targetCollection: 'reviews',
      targetId: reviewId,
      details: `تغيير حالة التقييم إلى ${status}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
  }
}

export async function seedSudanPlatformData(adminUid: string, adminName: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    const clinicsSeed = [
      {
        id: 'clinic_khartoum_nutricare',
        ownerUid: adminUid,
        name: 'مركز النيل التخصصي للطب الباطني والتغذية العلاجية',
        centerType: 'medical_center',
        licenseNumber: 'SD-KRT-MC-1042',
        state: 'الخرطوم',
        locality: 'الخرطوم',
        area: 'العمارات شارع 15',
        address: 'العمارات، مربع 9، الخرطوم',
        phone: '+249 91 230 4411',
        services: ['استشارات الباطنية والسكري', 'برامج التغذية العلاجية', 'متابعة ضغط الدم', 'المعمل التشخيصي'],
        workingHours: '08:30 صباحاً - 09:00 مساءً',
        photoKey: 'clinic',
        approvalStatus: 'approved',
        reviewReason: 'مكتمل التراخيص الصحية بولاية الخرطوم',
        reviewedByUid: adminUid,
        ratingAvg: 4.9,
        ratingCount: 38,
      },
      {
        id: 'clinic_gezira_madani',
        ownerUid: adminUid,
        name: 'مجمع الجزيرة التخصصي لطب الأسرة والأطفال',
        centerType: 'medical_center',
        licenseNumber: 'SD-GZ-MC-2018',
        state: 'الجزيرة',
        locality: 'ود مدني الكبرى',
        area: 'حي المطار',
        address: 'شارع النيل، ود مدني',
        phone: '+249 91 540 8820',
        services: ['عيادة الأطفال وحديثي الولادة', 'طب الأسرة', 'النساء والتوليد', 'التحصين والمتابعة'],
        workingHours: '09:00 صباحاً - 08:00 مساءً',
        photoKey: 'clinic',
        approvalStatus: 'approved',
        reviewReason: 'تم التحقق من السجل الطبي لولاية الجزيرة',
        reviewedByUid: adminUid,
        ratingAvg: 4.8,
        ratingCount: 24,
      },
      {
        id: 'clinic_redsea_portsudan',
        ownerUid: adminUid,
        name: 'عيادات الميناء التخصصية للقلب والباطنية',
        centerType: 'clinic',
        licenseNumber: 'SD-RS-CL-3091',
        state: 'البحر الأحمر',
        locality: 'بورتسودان',
        area: 'حي المطار - ديم مدينة',
        address: 'وسط بورتسودان، جوار المستشفى التعليمي',
        phone: '+249 92 110 7744',
        services: ['تخطيط القلب', 'أمراض القلب والأوعية', 'الباطنية والجهاز الهضمي'],
        workingHours: '09:00 صباحاً - 08:30 مساءً',
        photoKey: 'clinic',
        approvalStatus: 'approved',
        reviewReason: 'ترخيص ساري ومعتمد من الإدارة المركزية',
        reviewedByUid: adminUid,
        ratingAvg: 4.7,
        ratingCount: 19,
      },
      {
        id: 'clinic_rivernile_pending',
        ownerUid: adminUid,
        name: 'مركز عطبرة الجراحي التخصصي',
        centerType: 'hospital',
        licenseNumber: 'SD-RN-HS-4410',
        state: 'نهر النيل',
        locality: 'عطبرة',
        area: 'حي الداخلة',
        address: 'شارع المستشفى، عطبرة',
        phone: '+249 91 887 2201',
        services: ['الجراحة العامة', 'العظام والمفاصل', 'الطوارئ والمناظير'],
        workingHours: 'على مدار 24 ساعة',
        photoKey: 'clinic',
        approvalStatus: 'pending',
        reviewReason: '',
        reviewedByUid: '',
        ratingAvg: 0,
        ratingCount: 0,
      },
    ];

    for (const c of clinicsSeed) {
      batch.set(doc(db, 'clinics', c.id), {
        ...c,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const doctorsSeed = [
      {
        uid: 'doc_sd_amna_cardio',
        ownerUid: adminUid,
        fullName: 'د. آمنة محمد الطيب',
        gender: 'female',
        specialty: 'أمراض القلب والأوعية الدموية',
        qualifications: 'دكتوراه أمراض القلب - المجلس الطبي السوداني، زمالة الكلية الملكية',
        experienceYears: 14,
        licenseNumber: 'SMC-11948',
        state: 'الخرطوم',
        locality: 'الخرطوم',
        area: 'العمارات شارع 15',
        workplaceName: 'مركز النيل التخصصي للطب الباطني والتغذية العلاجية',
        clinicId: 'clinic_khartoum_nutricare',
        consultationFeeSdg: 25000,
        services: ['تخطيط القلب الكهربائي', 'الإيكو القلبي', 'متابعة ارتفاع ضغط الدم'],
        workingDays: ['السبت', 'الأحد', 'الثلاثاء', 'الأربعاء'],
        workingHours: '09:00 صباحاً - 02:00 ظهراً',
        bio: 'استشارية أمراض القلب والأوعية الدموية، خبرة واسعة في تشخيص وعلاج ارتفاع ضغط الدم وقصور القلب في السودان.',
        photoKey: 'female',
        approvalStatus: 'approved',
        reviewReason: 'تم التحقق من قيد المجلس الطبي السوداني',
        reviewedByUid: adminUid,
        ratingAvg: 4.9,
        ratingCount: 31,
      },
      {
        uid: 'doc_sd_ahmed_nutri',
        ownerUid: adminUid,
        fullName: 'د. أحمد السر التوم',
        gender: 'male',
        specialty: 'التغذية العلاجية والسكري',
        qualifications: 'ماجستير التغذية الإكلينيكية والسكري - جامعة الخرطوم',
        experienceYears: 11,
        licenseNumber: 'SMC-14205',
        state: 'الخرطوم',
        locality: 'أم درمان',
        area: 'المهندسين',
        workplaceName: 'مركز النيل التخصصي للطب الباطني والتغذية العلاجية',
        clinicId: 'clinic_khartoum_nutricare',
        consultationFeeSdg: 18000,
        services: ['خطط التغذية العلاجية لمرضى السكري', 'إدارة الوزن والرياضة العلاجية', 'متابعة السمنة والأيض'],
        workingDays: ['الأحد', 'الاثنين', 'الأربعاء', 'الخميس'],
        workingHours: '04:00 عصراً - 08:30 مساءً',
        bio: 'متخصص في برامج التغذية العلاجية والسكري وخطط النشاط البدني المخصصة وفق النمط الغذائي السوداني.',
        photoKey: 'male',
        approvalStatus: 'approved',
        reviewReason: 'معتمد وفق معايير التغذية العلاجية',
        reviewedByUid: adminUid,
        ratingAvg: 4.8,
        ratingCount: 27,
      },
      {
        uid: 'doc_sd_salma_peds',
        ownerUid: adminUid,
        fullName: 'د. سلمى عبد الله النور',
        gender: 'female',
        specialty: 'طب الأطفال وحديثي الولادة',
        qualifications: 'اختصاصي طب الأطفال - جامعة الجزيرة، عضوية جمعية أطباء الأطفال السودانية',
        experienceYears: 9,
        licenseNumber: 'SMC-16832',
        state: 'الجزيرة',
        locality: 'ود مدني الكبرى',
        area: 'حي المطار',
        workplaceName: 'مجمع الجزيرة التخصصي لطب الأسرة والأطفال',
        clinicId: 'clinic_gezira_madani',
        consultationFeeSdg: 15000,
        services: ['متابعة نمو الأطفال', 'أمراض الجهاز التنفسي للأطفال', 'استشارات تغذية الرضع'],
        workingDays: ['السبت', 'الاثنين', 'الثلاثاء', 'الخميس'],
        workingHours: '09:30 صباحاً - 03:00 عصراً',
        bio: 'طبيبة أطفال متخصصة في رعاية حديثي الولادة ومتابعة النمو والتغذية الوقائية للأطفال بولاية الجزيرة.',
        photoKey: 'female',
        approvalStatus: 'approved',
        reviewReason: 'ترخيص مزاولة ساري ومعتمد',
        reviewedByUid: adminUid,
        ratingAvg: 4.9,
        ratingCount: 22,
      },
      {
        uid: 'doc_sd_mohamed_internal',
        ownerUid: adminUid,
        fullName: 'د. محمد الفاتح إدريس',
        gender: 'male',
        specialty: 'الطب الباطني',
        qualifications: 'دكتوراه الطب الباطني - البورد السوداني للتخصصات الطبية',
        experienceYears: 12,
        licenseNumber: 'SMC-13077',
        state: 'البحر الأحمر',
        locality: 'بورتسودان',
        area: 'حي المطار - ديم مدينة',
        workplaceName: 'عيادات الميناء التخصصية للقلب والباطنية',
        clinicId: 'clinic_redsea_portsudan',
        consultationFeeSdg: 20000,
        services: ['تشخيص الأمراض الباطنية المزمنة', 'متابعة الكبد والجهاز الهضمي', 'الفحص الدوري الشامل'],
        workingDays: ['السبت', 'الأحد', 'الأربعاء', 'الخميس'],
        workingHours: '05:00 مساءً - 09:00 مساءً',
        bio: 'استشاري الباطنية في بورتسودان، يركز على الرعاية الشاملة للأمراض المزمنة والتنسيق المستمر عبر الملف الطبي الإلكتروني.',
        photoKey: 'male',
        approvalStatus: 'approved',
        reviewReason: 'معتمد من لجنة التوثيق المركزية',
        reviewedByUid: adminUid,
        ratingAvg: 4.7,
        ratingCount: 18,
      },
      {
        uid: 'doc_sd_khalid_pending',
        ownerUid: adminUid,
        fullName: 'د. خالد عمر البشير',
        gender: 'male',
        specialty: 'جراحة العظام والمفاصل',
        qualifications: 'ماجستير جراحة العظام والكسور - مجلس التخصصات الطبية',
        experienceYears: 7,
        licenseNumber: 'SMC-21409',
        state: 'كسلا',
        locality: 'كسلا',
        area: 'الختمية',
        workplaceName: 'عيادة كسلا التخصصية للعظام',
        clinicId: '',
        consultationFeeSdg: 22000,
        services: ['كسور العظام وإصابات الملاعب', 'آلام المفاصل والعمود الفقري'],
        workingDays: ['السبت', 'الاثنين', 'الأربعاء'],
        workingHours: '04:00 عصراً - 08:00 مساءً',
        bio: 'طبيب جراحة عظام بانتظار المراجعة والاعتماد المركزي لنشر الملف المهني في ولاية كسلا.',
        photoKey: 'male',
        approvalStatus: 'pending',
        reviewReason: '',
        reviewedByUid: '',
        ratingAvg: 0,
        ratingCount: 0,
      },
      {
        uid: 'doc_sd_nada_pending',
        ownerUid: adminUid,
        fullName: 'د. ندى حسن الصادق',
        gender: 'female',
        specialty: 'أمراض النساء والتوليد',
        qualifications: 'البورد السوداني في أمراض النساء والتوليد',
        experienceYears: 8,
        licenseNumber: 'SMC-19884',
        state: 'شمال كردفان',
        locality: 'شيكان (الأبيض)',
        area: 'حي القبة',
        workplaceName: 'مستوصف الأبيض التخصصي',
        clinicId: '',
        consultationFeeSdg: 19000,
        services: ['متابعة الحمل والولادة', 'الفحص بالموجات الصوتية', 'صحة المرأة'],
        workingDays: ['الأحد', 'الثلاثاء', 'الخميس'],
        workingHours: '10:00 صباحاً - 03:00 عصراً',
        bio: 'أخصائية النساء والتوليد في مدينة الأبيض بانتظار اعتماد الإدارة المركزية.',
        photoKey: 'female',
        approvalStatus: 'pending',
        reviewReason: '',
        reviewedByUid: '',
        ratingAvg: 0,
        ratingCount: 0,
      },
    ];

    for (const d of doctorsSeed) {
      batch.set(doc(db, 'doctors', d.uid), {
        ...d,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    await writeAuditLog({
      actorUid: adminUid,
      actorName: adminName,
      actorRole: 'central_admin',
      action: 'تهيئة البيانات المرجعية للمنصة',
      targetCollection: 'system',
      targetId: 'seed_sudan_v1',
      details: 'إضافة عيادات وأطباء معتمدين وطلبات قيد المراجعة عبر ولايات السودان',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedSudanPlatformData');
  }
}

// ------------------------------------------------------------------
// Secure Patient-Doctor Real-Time Messaging (Chat)
// ------------------------------------------------------------------
function timestampMs(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
    return Number((ts as { seconds: number }).seconds) * 1000;
  }
  return 0;
}

export function getConversationId(patientUid: string, doctorUid: string): string {
  const cleanP = patientUid.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanD = doctorUid.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `conv_${cleanP}_${cleanD}`.slice(0, 128);
}

export function subscribePatientConversations(
  patientUid: string,
  onConversations: (conversations: Conversation[]) => void
): Unsubscribe {
  const q = query(collection(db, 'conversations'), where('patientUid', '==', patientUid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as Conversation)
        .sort((a, b) => timestampMs(b.lastMessageAt) - timestampMs(a.lastMessageAt));
      onConversations(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'conversations')
  );
}

export function subscribeDoctorConversations(
  doctorUid: string,
  onConversations: (conversations: Conversation[]) => void
): Unsubscribe {
  const q = query(collection(db, 'conversations'), where('doctorUid', '==', doctorUid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as Conversation)
        .sort((a, b) => timestampMs(b.lastMessageAt) - timestampMs(a.lastMessageAt));
      onConversations(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'conversations')
  );
}

export function subscribeConversationMessages(
  conversationId: string,
  viewerRole: 'patient' | 'doctor',
  viewerUid: string,
  onMessages: (messages: ChatMessage[]) => void
): Unsubscribe {
  const filterField = viewerRole === 'doctor' ? 'doctorUid' : 'patientUid';
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    where(filterField, '==', viewerUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as ChatMessage)
        .sort((a, b) => timestampMs(a.createdAt) - timestampMs(b.createdAt));
      onMessages(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `conversations/${conversationId}/messages`)
  );
}

export async function sendDoctorPatientMessage(params: {
  patientUid: string;
  patientName: string;
  doctorUid: string;
  doctorName: string;
  doctorSpecialty: string;
  senderUid: string;
  senderName: string;
  senderRole: 'patient' | 'doctor';
  text: string;
  appointmentId?: string;
  appointmentDate?: string;
  appointmentRef?: string;
}): Promise<string> {
  const cleanText = clampStr(params.text, 1000);
  if (!cleanText) {
    throw new Error('يرجى كتابة نص الرسالة قبل الإرسال.');
  }

  const conversationId = getConversationId(params.patientUid, params.doctorUid);
  const convRef = doc(db, 'conversations', conversationId);
  const msgId = makeSafeId('msg');
  const msgRef = doc(db, 'conversations', conversationId, 'messages', msgId);

  try {
    const convSnap = await getDoc(convRef);
    const cleanPatientName = clampStr(params.patientName, 120) || 'مريض';
    const cleanDoctorName = clampStr(params.doctorName, 120) || 'طبيب';
    const cleanSpecialty = clampStr(params.doctorSpecialty, 100) || 'استشارة طبية';
    const cleanSenderName = clampStr(params.senderName, 120) || (params.senderRole === 'doctor' ? cleanDoctorName : cleanPatientName);

    if (!convSnap.exists()) {
      await setDoc(convRef, {
        id: conversationId,
        patientUid: params.patientUid,
        patientName: cleanPatientName,
        doctorUid: params.doctorUid,
        doctorName: cleanDoctorName,
        doctorSpecialty: cleanSpecialty,
        appointmentId: clampStr(params.appointmentId, 128),
        appointmentDate: clampStr(params.appointmentDate, 20),
        lastMessageText: cleanText,
        lastSenderUid: params.senderUid,
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const batch = writeBatch(db);
    batch.set(msgRef, {
      id: msgId,
      conversationId,
      patientUid: params.patientUid,
      doctorUid: params.doctorUid,
      senderUid: params.senderUid,
      senderName: cleanSenderName,
      senderRole: params.senderRole,
      text: cleanText,
      appointmentRef: clampStr(params.appointmentRef, 160),
      createdAt: serverTimestamp(),
    });

    if (convSnap.exists()) {
      batch.update(convRef, {
        lastMessageText: cleanText,
        lastSenderUid: params.senderUid,
        lastMessageAt: serverTimestamp(),
        appointmentId: clampStr(params.appointmentId, 128),
        appointmentDate: clampStr(params.appointmentDate, 20),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return conversationId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `conversations/${conversationId}/messages/${msgId}`);
  }
}

// ------------------------------------------------------------------
// Patient Current Medications & Dose Alerts
// ------------------------------------------------------------------
export async function fetchPatientMedications(patientUid: string): Promise<PatientMedication[]> {
  try {
    const q = query(collection(db, 'patientMedications'), where('patientUid', '==', patientUid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as PatientMedication)
      .sort((a, b) => timestampMs(b.updatedAt || b.createdAt) - timestampMs(a.updatedAt || a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'patientMedications');
  }
}

export function subscribePatientMedications(
  patientUid: string,
  onMedications: (meds: PatientMedication[]) => void
): Unsubscribe {
  const q = query(collection(db, 'patientMedications'), where('patientUid', '==', patientUid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as PatientMedication)
        .sort((a, b) => timestampMs(b.updatedAt || b.createdAt) - timestampMs(a.updatedAt || a.createdAt));
      onMedications(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'patientMedications')
  );
}

export async function addPatientMedication(
  patientUid: string,
  actorName: string,
  input: {
    name: string;
    dosage: string;
    frequency: string;
    scheduleTimes: string[];
    status: MedicationStatus;
    prescribedBy?: string;
    sourceRecordId?: string;
    notes?: string;
    reminderEnabled: boolean;
  }
): Promise<string> {
  const cleanName = clampStr(input.name, 160);
  if (!cleanName) {
    throw new Error('يرجى إدخال اسم الدواء.');
  }
  const medId = makeSafeId('med');
  const path = `patientMedications/${medId}`;
  try {
    await setDoc(doc(db, 'patientMedications', medId), {
      id: medId,
      patientUid,
      name: cleanName,
      dosage: clampStr(input.dosage, 120),
      frequency: clampStr(input.frequency, 120),
      scheduleTimes: cleanStringList(input.scheduleTimes, 6, 16),
      status: input.status,
      prescribedBy: clampStr(input.prescribedBy, 120),
      sourceRecordId: clampStr(input.sourceRecordId, 128),
      notes: clampStr(input.notes, 400),
      reminderEnabled: Boolean(input.reminderEnabled),
      lastTakenKey: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: patientUid,
      actorName,
      actorRole: 'patient',
      action: 'إضافة دواء حالي للملف الطبي',
      targetCollection: 'patientMedications',
      targetId: medId,
      details: `${cleanName} (${input.status})`,
    });
    return medId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePatientMedicationStatus(
  medicationId: string,
  patientUid: string,
  actorName: string,
  updates: {
    status?: MedicationStatus;
    reminderEnabled?: boolean;
    lastTakenKey?: string;
  }
): Promise<void> {
  const path = `patientMedications/${medicationId}`;
  try {
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.status !== undefined) {
      payload.status = updates.status;
    }
    if (updates.reminderEnabled !== undefined) {
      payload.reminderEnabled = Boolean(updates.reminderEnabled);
    }
    if (updates.lastTakenKey !== undefined) {
      payload.lastTakenKey = clampStr(updates.lastTakenKey, 40);
    }

    await updateDoc(doc(db, 'patientMedications', medicationId), payload);

    await writeAuditLog({
      actorUid: patientUid,
      actorName,
      actorRole: 'patient',
      action: 'تحديث حالة أو جرعة الدواء',
      targetCollection: 'patientMedications',
      targetId: medicationId,
      details: Object.keys(updates).join(', '),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updatePatientMedicationDetails(
  medicationId: string,
  patientUid: string,
  actorName: string,
  input: {
    name: string;
    dosage: string;
    frequency: string;
    scheduleTimes: string[];
    status: MedicationStatus;
    notes?: string;
    reminderEnabled: boolean;
  }
): Promise<void> {
  const path = `patientMedications/${medicationId}`;
  const cleanName = clampStr(input.name, 160);
  if (!cleanName) {
    throw new Error('يرجى إدخال اسم الدواء.');
  }
  try {
    await updateDoc(doc(db, 'patientMedications', medicationId), {
      name: cleanName,
      dosage: clampStr(input.dosage, 120),
      frequency: clampStr(input.frequency, 120),
      scheduleTimes: cleanStringList(input.scheduleTimes, 6, 16),
      status: input.status,
      notes: clampStr(input.notes, 400),
      reminderEnabled: Boolean(input.reminderEnabled),
      updatedAt: serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: patientUid,
      actorName,
      actorRole: 'patient',
      action: 'تعديل تفاصيل الدواء الحالي',
      targetCollection: 'patientMedications',
      targetId: medicationId,
      details: cleanName,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePatientMedication(
  medicationId: string,
  patientUid: string,
  actorName: string
): Promise<void> {
  const path = `patientMedications/${medicationId}`;
  try {
    await deleteDoc(doc(db, 'patientMedications', medicationId));
    await writeAuditLog({
      actorUid: patientUid,
      actorName,
      actorRole: 'patient',
      action: 'حذف دواء من قائمة الأدوية الحالية',
      targetCollection: 'patientMedications',
      targetId: medicationId,
      details: `Removed medication ${medicationId}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

