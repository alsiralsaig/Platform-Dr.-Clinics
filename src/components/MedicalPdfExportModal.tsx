import React from 'react';
import { Download, FileJson, FileText, Printer, X } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { getRecordTypeLabel } from '../data/sudanGeo';
import { useI18n } from '../i18n/I18nContext';
import type { EhrRecord, PatientMedicalProfile } from '../types/medical';

export interface PdfPastVisitItem {
  id: string;
  dateStr: string;
  timeLabel: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  location: string;
  visitTypeLabel: string;
  reasonOrTitle: string;
}

export interface PdfVitalItem {
  id: string;
  dateStr: string;
  source: string;
  title: string;
  systolic?: number;
  diastolic?: number;
  weightKg?: number;
  bloodGlucose?: number;
  heartRate?: number;
}

interface MedicalPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientEmail: string;
  patientProfile: PatientMedicalProfile | null;
  bmiValue: string | null;
  pastVisits: PdfPastVisitItem[];
  diagnosticReports: EhrRecord[];
  vitalsTimeline: PdfVitalItem[];
  onDownloadJson?: () => void;
}

function toRecordDate(ts: unknown, fallback: string): string {
  if (!ts) return fallback;
  let d: Date | null = null;
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toDate' in ts &&
    typeof (ts as { toDate: () => Date }).toDate === 'function'
  ) {
    d = (ts as { toDate: () => Date }).toDate();
  } else if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
    d = new Date(Number((ts as { seconds: number }).seconds) * 1000);
  }
  if (!d || Number.isNaN(d.getTime())) return fallback;
  return d.toISOString().slice(0, 10);
}

export const MedicalPdfExportModal: React.FC<MedicalPdfExportModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientEmail,
  patientProfile,
  bmiValue,
  pastVisits,
  diagnosticReports,
  vitalsTimeline,
  onDownloadJson,
}) => {
  const { lang, dir, t } = useI18n();
  const sheetRef = React.useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const todayIso = new Date().toISOString().slice(0, 10);

  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    setExporting(true);
    setExportError(null);
    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 2) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeFileName = `Medical_Record_${(patientProfile?.fullName || patientName || 'Patient')
        .replace(/\s+/g, '_')
        .slice(0, 32)}_${todayIso}.pdf`;
      pdf.save(safeFileName);
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : 'Could not generate PDF. Try using the Print button instead.'
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0" />
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {t.pdf.modalTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.pdf.modalSubtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>{t.pdf.printBtn}</span>
            </button>
            {onDownloadJson && (
              <button
                type="button"
                onClick={onDownloadJson}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <FileJson className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>{t.pdf.downloadJsonBtn}</span>
              </button>
            )}
            <button
              type="button"
              disabled={exporting}
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? t.pdf.generatingBtn : t.pdf.downloadBtn}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {exportError && (
          <div className="mx-5 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs">
            {exportError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
          <div
            id="medical-pdf-sheet"
            ref={sheetRef}
            dir={dir}
            className="bg-white border border-slate-200 mx-auto p-6 sm:p-8 space-y-6 text-slate-900"
            style={{ maxWidth: '794px' }}
          >
            <header className="border-b-2 border-teal-700 pb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-teal-800">{t.pdf.headerEyebrow}</p>
                <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
                  {t.pdf.reportTitle}
                </h1>
                <p className="text-xs text-slate-600 mt-1">{t.pdf.reportSubtitle}</p>
              </div>
              <div className="text-end text-xs text-slate-600 space-y-1 font-mono tabular-nums">
                <p>
                  <span className="font-sans font-semibold text-slate-800">
                    {t.pdf.exportDateLabel}{' '}
                  </span>
                  {todayIso}
                </p>
                <p>{patientEmail}</p>
              </div>
            </header>

            <section className="space-y-3">
              <h2 className="font-display text-sm font-bold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded">
                {t.pdf.sec1Title}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-200 rounded-lg p-3.5">
                <div>
                  <span className="text-slate-500 block">{t.pdf.fullNameLabel}</span>
                  <strong className="text-slate-900">
                    {patientProfile?.fullName || patientName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">{t.pdf.dobLabel}</span>
                  <strong className="font-mono tabular-nums text-slate-900">
                    {patientProfile?.dateOfBirth || t.pdf.notRecorded}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">{t.pdf.bloodTypeLabel}</span>
                  <strong className="font-mono text-slate-900">
                    {patientProfile?.bloodType && patientProfile.bloodType !== 'unknown'
                      ? patientProfile.bloodType
                      : t.pdf.notSpecified}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">{t.pdf.heightWeightBmiLabel}</span>
                  <strong className="font-mono tabular-nums text-slate-900">
                    {patientProfile?.heightCm
                      ? `${patientProfile.heightCm} ${t.pdf.cmUnit}`
                      : '—'}{' '}
                    ·{' '}
                    {patientProfile?.weightKg
                      ? `${patientProfile.weightKg} ${t.pdf.kgUnit}`
                      : '—'}
                    {bmiValue ? ` (${bmiValue})` : ''}
                  </strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">{t.pdf.allergiesLabel}</span>
                  <strong className="text-slate-900">
                    {patientProfile?.allergies && patientProfile.allergies.length > 0
                      ? patientProfile.allergies.join(', ')
                      : t.pdf.noAllergies}
                  </strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">{t.pdf.chronicLabel}</span>
                  <strong className="text-slate-900">
                    {patientProfile?.chronicConditions &&
                    patientProfile.chronicConditions.length > 0
                      ? patientProfile.chronicConditions.join(', ')
                      : t.pdf.noChronic}
                  </strong>
                </div>
                {patientProfile?.emergencyContact && (
                  <div className="col-span-2 sm:col-span-4 border-t border-slate-100 pt-2">
                    <span className="text-slate-500">{t.pdf.emergencyLabel} </span>
                    <strong className="text-slate-900">{patientProfile.emergencyContact}</strong>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-2.5">
              <h2 className="font-display text-sm font-bold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded">
                {t.pdf.sec2Title} ({pastVisits.length})
              </h2>
              {pastVisits.length === 0 ? (
                <p className="text-xs text-slate-500 border border-slate-200 rounded-lg p-3">
                  {t.pdf.noPastVisits}
                </p>
              ) : (
                <table className="w-full text-start text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="py-2 px-3 font-semibold text-start">{t.pdf.colDate}</th>
                      <th className="py-2 px-3 font-semibold text-start">
                        {t.pdf.colDoctorSpec}
                      </th>
                      <th className="py-2 px-3 font-semibold text-start">
                        {t.pdf.colClinicLoc}
                      </th>
                      <th className="py-2 px-3 font-semibold text-start">
                        {t.pdf.colTypeReason}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastVisits.map((v) => (
                      <tr key={v.id}>
                        <td className="py-2 px-3 font-mono tabular-nums whitespace-nowrap">
                          {v.dateStr}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-900">{v.doctorName}</span>
                          <span className="block text-slate-500">{v.specialty}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {v.clinicName} · {v.location}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {v.visitTypeLabel} — {v.reasonOrTitle}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="space-y-2.5">
              <h2 className="font-display text-sm font-bold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded">
                {t.pdf.sec3Title} ({diagnosticReports.length})
              </h2>
              {diagnosticReports.length === 0 ? (
                <p className="text-xs text-slate-500 border border-slate-200 rounded-lg p-3">
                  {t.pdf.noReports}
                </p>
              ) : (
                <div className="space-y-3">
                  {diagnosticReports.map((rec) => (
                    <div
                      key={rec.id}
                      className="border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{rec.title}</span>
                          <span className="text-teal-800 font-semibold ms-2">
                            ({getRecordTypeLabel(rec.recordType, lang)})
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-slate-500">
                          {toRecordDate(rec.createdAt, t.pdf.notSpecified)} · {rec.doctorName}
                        </span>
                      </div>
                      {rec.chiefComplaint && (
                        <p>
                          <strong>{t.pdf.complaintPrefix} </strong>
                          {rec.chiefComplaint}
                        </p>
                      )}
                      {rec.diagnosis && (
                        <p className="bg-slate-50 p-2 rounded border border-slate-100">
                          <strong>{t.pdf.diagnosisPrefix} </strong>
                          {rec.diagnosis}
                        </p>
                      )}
                      {rec.medications && rec.medications.length > 0 && (
                        <p>
                          <strong>{t.pdf.medsPrefix} </strong>
                          {rec.medications.join(' · ')}
                        </p>
                      )}
                      {rec.clinicalNotes && (
                        <p className="text-slate-700">
                          <strong>{t.pdf.notesPrefix} </strong>
                          {rec.clinicalNotes}
                        </p>
                      )}
                      {rec.nutritionPlan?.goal && (
                        <p className="text-teal-900">
                          <strong>{t.pdf.nutritionPrefix} </strong>
                          {rec.nutritionPlan.goal}
                          {rec.nutritionPlan.mealGuidelines
                            ? ` — ${rec.nutritionPlan.mealGuidelines}`
                            : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2.5">
              <h2 className="font-display text-sm font-bold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded">
                {t.pdf.sec4Title} ({vitalsTimeline.length})
              </h2>
              {vitalsTimeline.length === 0 ? (
                <p className="text-xs text-slate-500 border border-slate-200 rounded-lg p-3">
                  {t.pdf.noVitals}
                </p>
              ) : (
                <table className="w-full text-start text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="py-2 px-3 font-semibold text-start">{t.pdf.colDate}</th>
                      <th className="py-2 px-3 font-semibold text-start">{t.pdf.colSource}</th>
                      <th className="py-2 px-3 font-semibold text-start">{t.pdf.colBp}</th>
                      <th className="py-2 px-3 font-semibold text-start">{t.pdf.colWeight}</th>
                      <th className="py-2 px-3 font-semibold text-start">{t.pdf.colGlucose}</th>
                      <th className="py-2 px-3 font-semibold text-start">{t.pdf.colHr}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vitalsTimeline.map((vt) => (
                      <tr key={vt.id}>
                        <td className="py-2 px-3 font-mono tabular-nums whitespace-nowrap">
                          {vt.dateStr}
                        </td>
                        <td className="py-2 px-3">
                          {vt.title} · <span className="text-slate-500">{vt.source}</span>
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums">
                          {vt.systolic && vt.diastolic ? `${vt.systolic}/${vt.diastolic}` : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums">
                          {typeof vt.weightKg === 'number' ? vt.weightKg : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums">
                          {vt.bloodGlucose || '—'}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums">
                          {vt.heartRate || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <footer className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span>{t.pdf.footerNote}</span>
              <span className="font-mono tabular-nums">{todayIso}</span>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};
