# Security Specification — المنصة الطبية السودانية الذكية

## 1. Data Invariants
1. **Approval Gate Invariant**: Doctor (`/doctors/{doctorId}`) and Clinic (`/clinics/{clinicId}`) profiles MUST start with `approvalStatus: "pending"`. Unapproved profiles cannot be listed or queried by patients or anonymous visitors, and appointments can only be created against doctors with `approvalStatus == "approved"`.
2. **Clinic Isolation Invariant**: Staff and linked doctors inside `/clinics/{clinicId}/staff/{staffId}` are strictly scoped to the parent clinic owner (`clinics/{clinicId}.ownerUid == request.auth.uid`) or central admin. Linking a doctor into clinic staff requires that the doctor document exists and has `approvalStatus == "approved"`.
3. **PII Isolation Invariant**: Personal contact fields (`email`, `phone`) reside in `/users/{userId}` and are readable only by the owner (`request.auth.uid == userId`) or Central Admin.
4. **EHR Confidentiality Invariant**: `/patients/{patientId}` and `/ehrRecords/{recordId}` can only be read by the patient, the authoring doctor, doctors explicitly authorized in `authorizedDoctorUids` / `sharedWithDoctorUids`, or Central Admin. Patients control sharing permissions (`sharedWithDoctorUids`).
5. **Anti-Privilege-Escalation Invariant**: Users cannot self-assign `role: "central_admin"` or `accountStatus: "active"` after suspension. Only Central Admin (`alsiralsaig@gmail.com` with `email_verified == true` or `/admins/{uid}`) can approve, reject, or suspend accounts.
6. **Temporal & Audit Integrity Invariant**: All `createdAt` and `updatedAt` timestamps are enforced as `request.time`. `/auditLogs/{logId}` is strictly append-only (`update` and `delete` denied even for admins).

## 2. Adversarial "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Self-Approval Injection**: Doctor creates `/doctors/{uid}` with `approvalStatus: "approved"`.
2. **Shadow Admin Escalation**: Patient updates `/users/{uid}` setting `role: "central_admin"`.
3. **Ghost Field Poisoning**: User updates `/doctors/{uid}` including an undeclared field `isVerified: true`.
4. **Booking Unapproved Doctor**: Patient creates `/appointments/{id}` targeting a doctor whose `approvalStatus == "pending"`.
5. **Unverified Email Admin Spoof**: Token with `email == "alsiralsaig@gmail.com"` and `email_verified == false` attempts admin read/write.
6. **Cross-Clinic Staff Hijack**: Clinic A owner attempts to create or read `/clinics/{clinicB}/staff/{staffId}`.
7. **Linking Unapproved Doctor to Clinic**: Clinic owner adds `staffRole: "doctor"` with `doctorId` pointing to a `pending` doctor.
8. **EHR Snooping**: Unrelated doctor attempts `get` or `list` on `/ehrRecords/{recordId}` without `doctorUid` or `sharedWithDoctorUids` match.
9. **Audit Log Tampering**: Any user or admin attempts `update` or `delete` on `/auditLogs/{logId}`.
10. **Terminal Appointment Reopening**: Doctor or patient attempts to update an appointment with `status == "cancelled"` back to `"confirmed"`.
11. **Review Forgery Before Visit**: Patient attempts to create `/reviews/{id}` for a `"pending"` appointment.
12. **Resource Exhaustion / ID Poisoning**: User attempts `create` with a 200-character document ID or a 5,000-character `title` string.
