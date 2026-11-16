import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  Camera,
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileCheck2,
  Printer,
  QrCode,
  Search,
  Upload,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import type { Appointment, AppointmentStatus } from '../types/medical';
import { formatSdg, getAppointmentStatusLabel, translateTimeSlot } from '../data/sudanGeo';
import { fetchAppointmentById } from '../lib/firestoreService';
import { useI18n } from '../i18n/I18nContext';

export interface QrAppointmentPayload {
  v: 1;
  t: 'apt';
  id: string;
  pUid: string;
  pName: string;
  dUid: string;
  dName: string;
  cId?: string;
  cName?: string;
  date: string;
  slot: string;
  st: AppointmentStatus;
  fee: number;
}

export interface QrEhrPayload {
  v: 1;
  t: 'ehr';
  pUid: string;
  name: string;
  dob: string;
  blood: string;
  phone?: string;
  allergies: string[];
  chronic: string[];
  meds: string[];
  emergency?: string;
  reportsCount: number;
}

export type DecodedQrPayload = QrAppointmentPayload | QrEhrPayload;

export function buildAppointmentQrPayload(apt: Appointment): string {
  const payload: QrAppointmentPayload = {
    v: 1,
    t: 'apt',
    id: apt.id,
    pUid: apt.patientUid,
    pName: apt.patientName,
    dUid: apt.doctorUid,
    dName: apt.doctorName,
    cId: apt.clinicId || '',
    cName: apt.clinicName || '',
    date: apt.appointmentDate,
    slot: apt.timeSlot,
    st: apt.status,
    fee: apt.feeSdg,
  };
  return JSON.stringify(payload);
}

export function buildEhrQrPayload(input: Omit<QrEhrPayload, 'v' | 't'>): string {
  const payload: QrEhrPayload = {
    v: 1,
    t: 'ehr',
    pUid: input.pUid,
    name: input.name.slice(0, 80),
    dob: input.dob.slice(0, 20),
    blood: input.blood.slice(0, 10),
    phone: (input.phone || '').slice(0, 24),
    allergies: input.allergies.slice(0, 6).map((a) => a.slice(0, 40)),
    chronic: input.chronic.slice(0, 6).map((c) => c.slice(0, 40)),
    meds: input.meds.slice(0, 6).map((m) => m.slice(0, 50)),
    emergency: (input.emergency || '').slice(0, 80),
    reportsCount: input.reportsCount,
  };
  return JSON.stringify(payload);
}

export function parseQrText(rawText: string): DecodedQrPayload | { rawAptId: string } | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<DecodedQrPayload>;
      if (parsed.t === 'apt' && typeof parsed.id === 'string' && parsed.id) {
        return parsed as QrAppointmentPayload;
      }
      if (parsed.t === 'ehr' && typeof parsed.pUid === 'string' && parsed.pUid) {
        return parsed as QrEhrPayload;
      }
    } catch {
      return null;
    }
  }
  if (/^[a-zA-Z0-9_-]{6,128}$/.test(trimmed)) {
    return { rawAptId: trimmed };
  }
  return null;
}

interface QRCodeDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  badgeText: string;
  payloadString: string;
  summaryRows: Array<{ label: string; value: string }>;
  filenamePrefix: string;
}

export const QRCodeDisplayModal: React.FC<QRCodeDisplayModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badgeText,
  payloadString,
  summaryRows,
  filenamePrefix,
}) => {
  const { t } = useI18n();
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !payloadString) return;
    let active = true;
    QRCode.toDataURL(payloadString, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [isOpen, payloadString]);

  if (!isOpen) return null;

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(payloadString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">
              <QrCode className="h-3.5 w-3.5" />
              {badgeText}
            </span>
            <h3 className="mt-1.5 text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={t.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/60">
            {dataUrl ? (
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <img src={dataUrl} alt={title} className="h-56 w-56 object-contain" />
              </div>
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-xs text-slate-500">
                {t.qr.generating}
              </div>
            )}
            <p className="mt-3 text-center text-xs text-slate-600 dark:text-slate-300">
              {t.patient.qrScanHint}
            </p>
          </div>

          {summaryRows.length > 0 && (
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3.5 text-xs dark:border-slate-700 dark:bg-slate-800/60 sm:grid-cols-2">
              {summaryRows.map((row) => (
                <div key={row.label} className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-400">{row.label}</div>
                  <div className="truncate font-bold text-slate-800 dark:text-slate-100">
                    {row.value || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCopyPayload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
              {copied ? t.qr.copied : t.patient.qrCopyPayloadBtn}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Printer className="h-3.5 w-3.5" />
              {t.patient.printEhrBtn}
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={!dataUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {t.patient.qrDownloadPngBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
  onCheckInByProvider?: (appointmentId: string) => Promise<void>;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  appointments,
  onUpdateStatus,
  onCheckInByProvider,
}) => {
  const { lang, t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const [scannedApt, setScannedApt] = useState<Appointment | null>(null);
  const [scannedAptFallback, setScannedAptFallback] = useState<QrAppointmentPayload | null>(null);
  const [scannedEhr, setScannedEhr] = useState<QrEhrPayload | null>(null);

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const resolveDecodedText = async (rawText: string) => {
    setLookupError('');
    setActionSuccess('');
    const parsed = parseQrText(rawText);
    if (!parsed) {
      setLookupError(t.qr.invalidPayload);
      return;
    }

    if ('rawAptId' in parsed) {
      await resolveAppointmentById(parsed.rawAptId, null);
      return;
    }

    if (parsed.t === 'ehr') {
      setScannedApt(null);
      setScannedAptFallback(null);
      setScannedEhr(parsed);
      stopCamera();
      return;
    }

    if (parsed.t === 'apt') {
      await resolveAppointmentById(parsed.id, parsed);
    }
  };

  const resolveAppointmentById = async (
    appointmentId: string,
    fallbackPayload: QrAppointmentPayload | null,
  ) => {
    setIsLookingUp(true);
    setScannedEhr(null);
    try {
      const localMatch = appointments.find((a) => a.id === appointmentId) || null;
      if (localMatch) {
        setScannedApt(localMatch);
        setScannedAptFallback(fallbackPayload);
        stopCamera();
        return;
      }

      const remoteMatch = await fetchAppointmentById(appointmentId);
      if (remoteMatch) {
        setScannedApt(remoteMatch);
        setScannedAptFallback(fallbackPayload);
        stopCamera();
        return;
      }

      if (fallbackPayload) {
        setScannedApt(null);
        setScannedAptFallback(fallbackPayload);
        stopCamera();
      } else {
        setScannedApt(null);
        setScannedAptFallback(null);
        setLookupError(t.qr.notFoundError);
      }
    } catch {
      if (fallbackPayload) {
        setScannedApt(null);
        setScannedAptFallback(fallbackPayload);
        stopCamera();
      } else {
        setLookupError(t.qr.notFoundError);
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setLookupError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(t.qr.cameraUnavailable);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          scanFrameLoop();
        }
      }, 120);
    } catch {
      setCameraError(t.qr.cameraPermissionDenied);
      stopCamera();
    }
  };

  const scanFrameLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code && code.data) {
          resolveDecodedText(code.data);
          return;
        }
      }
    }

    rafRef.current = requestAnimationFrame(scanFrameLoop);
  };

  const handleUploadQrImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLookupError('');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setLookupError(t.qr.decodeImageFailed);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (code && code.data) {
          resolveDecodedText(code.data);
        } else {
          setLookupError(t.qr.decodeImageFailed);
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resolveDecodedText(manualInput);
  };

  const handleQuickAction = async (
    nextAction: 'confirm' | 'arrived' | 'completed' | 'no_show',
  ) => {
    const targetId = scannedApt?.id || scannedAptFallback?.id;
    if (!targetId) return;
    setActionBusy(true);
    setActionSuccess('');
    try {
      if (nextAction === 'arrived' && onCheckInByProvider) {
        await onCheckInByProvider(targetId);
      } else {
        const statusMap: Record<'confirm' | 'arrived' | 'completed' | 'no_show', AppointmentStatus> = {
          confirm: 'confirmed',
          arrived: 'arrived',
          completed: 'completed',
          no_show: 'no_show',
        };
        await onUpdateStatus(targetId, statusMap[nextAction]);
      }
      const nextStatus: AppointmentStatus =
        nextAction === 'confirm' ? 'confirmed' : nextAction;
      if (scannedApt) {
        setScannedApt({ ...scannedApt, status: nextStatus });
      }
      if (scannedAptFallback) {
        setScannedAptFallback({ ...scannedAptFallback, st: nextStatus });
      }
      setActionSuccess(t.qr.statusUpdatedMsg);
    } finally {
      setActionBusy(false);
    }
  };

  if (!isOpen) return null;

  const activeAptStatus: AppointmentStatus | undefined =
    scannedApt?.status ?? scannedAptFallback?.st;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300">
              <QrCode className="h-3.5 w-3.5" />
              {t.qr.scannerBadge}
            </span>
            <h3 className="mt-1.5 text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {t.qr.scannerTitle}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t.qr.scannerDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={t.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Capture / Upload / Manual Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800"
              >
                <Camera className="h-4 w-4" />
                {t.qr.startCameraBtn}
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                <XCircle className="h-4 w-4" />
                {t.qr.stopCameraBtn}
              </button>
            )}

            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              <Upload className="h-4 w-4" />
              {t.qr.uploadImageBtn}
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadQrImage}
                className="hidden"
              />
            </label>
          </div>

          {cameraError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              {cameraError}
            </div>
          )}

          {cameraActive && (
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-700">
              <video
                ref={videoRef}
                playsInline
                muted
                className="mx-auto max-h-64 w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-40 rounded-xl border-2 border-teal-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Manual Lookup / Paste QR Code */}
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={t.qr.manualPlaceholder}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={isLookingUp || !manualInput.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-700"
            >
              <Search className="h-3.5 w-3.5" />
              {isLookingUp ? t.qr.lookingUp : t.qr.lookupBtn}
            </button>
          </form>

          {lookupError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
              {lookupError}
            </div>
          )}

          {actionSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
              {actionSuccess}
            </div>
          )}

          {/* Decoded Appointment Result */}
          {(scannedApt || scannedAptFallback) && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 dark:border-teal-800 dark:bg-teal-950/20">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-3 dark:border-teal-900">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {t.qr.retrievedAppointmentTitle}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      #{scannedApt?.id || scannedAptFallback?.id}
                    </div>
                  </div>
                </div>
                {activeAptStatus && (
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-teal-800 shadow-2xs dark:bg-slate-800 dark:text-teal-300">
                    {getAppointmentStatusLabel(activeAptStatus, lang)}
                  </span>
                )}
              </div>

              <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <div className="text-[11px] text-slate-500">{t.qr.patientLabel}</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {scannedApt?.patientName || scannedAptFallback?.pName}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">{t.qr.doctorLabel}</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {scannedApt?.doctorName || scannedAptFallback?.dName}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">{t.qr.clinicLabel}</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {scannedApt?.clinicName || scannedAptFallback?.cName || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">{t.qr.dateTimeLabel}</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {scannedApt?.appointmentDate || scannedAptFallback?.date} ·{' '}
                    {translateTimeSlot(
                      scannedApt?.timeSlot || scannedAptFallback?.slot || '',
                      lang
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">{t.qr.feeLabel}</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {formatSdg(scannedApt?.feeSdg ?? scannedAptFallback?.fee ?? 0, lang)}
                  </div>
                </div>
                {scannedApt?.reason && (
                  <div>
                    <div className="text-[11px] text-slate-500">{t.qr.reasonLabel}</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {scannedApt.reason}
                    </div>
                  </div>
                )}
              </div>

              {activeAptStatus !== 'completed' && activeAptStatus !== 'cancelled' && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-teal-100 pt-3 dark:border-teal-900">
                  {activeAptStatus === 'pending' && (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => handleQuickAction('confirm')}
                      className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50"
                    >
                      {t.tasks.confirmBtn}
                    </button>
                  )}
                  {(activeAptStatus === 'pending' || activeAptStatus === 'confirmed') && (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => handleQuickAction('arrived')}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      {t.qr.markArrivedBtn}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => handleQuickAction('completed')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.tasks.attendedBtn}
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => handleQuickAction('no_show')}
                    className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-300"
                  >
                    {t.tasks.noShowBtn}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Decoded Patient EHR Summary Result */}
          {scannedEhr && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3 dark:border-indigo-900">
                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    {t.qr.retrievedEhrTitle}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {scannedEhr.name}
                  </div>
                </div>
                <span className="rounded-md bg-rose-100 px-2.5 py-1 text-xs font-extrabold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  {t.patient.bloodTypeLabel}: {scannedEhr.blood || '—'}
                </span>
              </div>

              <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <div className="text-[11px] text-slate-500">{t.patient.dobLabel}</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {scannedEhr.dob || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">{t.patient.emergencyLabel}</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {scannedEhr.emergency || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">{t.pdf.allergiesLabel}</div>
                  <div className="font-semibold text-rose-700 dark:text-rose-300">
                    {scannedEhr.allergies.length > 0
                      ? scannedEhr.allergies.join(', ')
                      : t.pdf.noAllergies}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">{t.pdf.chronicLabel}</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {scannedEhr.chronic.length > 0
                      ? scannedEhr.chronic.join(', ')
                      : t.pdf.noChronic}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-[11px] text-slate-500">
                    {t.patient.medicationsSectionTitle}
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {scannedEhr.meds.length > 0 ? scannedEhr.meds.join(' · ') : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
