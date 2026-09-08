import { useState } from 'react';
import type { BloodPressureReading, PatientProfile, BPStatistics, FilterRange } from '../types/bloodPressure';
import { generateDoctorReportPdf } from '../utils/pdfGenerator';
import { 
  X, 
  FileDown, 
  User, 
  Calendar, 
  CheckCircle, 
  Loader2, 
  Info,
  Sparkles 
} from 'lucide-react';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  readings: BloodPressureReading[];
  patientProfile: PatientProfile;
  statistics: BPStatistics;
  getChartCanvas: () => HTMLCanvasElement | null;
  onOpenProfile: () => void;
}

export function PdfReportModal({
  isOpen,
  onClose,
  readings,
  patientProfile,
  statistics,
  getChartCanvas,
  onOpenProfile
}: PdfReportModalProps) {
  const [selectedRange, setSelectedRange] = useState<FilterRange>('30d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  // Filter the readings according to selected range
  const now = new Date();
  const daysMap: Record<FilterRange, number> = {
    '7d': 7,
    '14d': 14,
    '30d': 30,
    '90d': 90,
    'all': 999999
  };
  const maxDays = daysMap[selectedRange] || 30;
  const cutoff = now.getTime() - maxDays * 24 * 60 * 60 * 1000;
  const exportReadings = selectedRange === 'all' 
    ? readings 
    : readings.filter(r => new Date(r.timestamp).getTime() >= cutoff);

  const rangeLabels: Record<FilterRange, string> = {
    '7d': 'Últimos 7 días',
    '14d': 'Últimos 14 días',
    '30d': 'Últimos 30 días',
    '90d': 'Últimos 3 meses (90 días)',
    'all': 'Historial Completo'
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = getChartCanvas();
      await generateDoctorReportPdf({
        readings: exportReadings,
        patientProfile,
        statistics,
        chartCanvas: canvas,
        periodLabel: rangeLabels[selectedRange]
      });
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3500);
    } catch (e) {
      console.error('Error al generar PDF:', e);
      alert('Ocurrió un problema al generar el PDF. Por favor reintenta.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Generar Reporte Médico en PDF</h2>
              <p className="text-[11px] text-slate-400">Formato clínico listo para imprimir o compartir</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Patient Card Preview */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                Membrete del Paciente
              </span>
              <button
                type="button"
                onClick={onOpenProfile}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                Modificar datos
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-white font-bold text-sm">
                {patientProfile.name} {patientProfile.age ? `(${patientProfile.age} años)` : ''}
              </div>
              {patientProfile.doctorName && (
                <div className="text-slate-400">
                  Médico: <strong className="text-slate-300">{patientProfile.doctorName}</strong>
                </div>
              )}
              {patientProfile.currentMedication && (
                <div className="text-slate-400 truncate">
                  Medicación: <span className="text-slate-300">{patientProfile.currentMedication}</span>
                </div>
              )}
            </div>
          </div>

          {/* Range Selector */}
          <div>
            <label className="text-xs text-slate-300 font-medium mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Período a Incluir en el Informe
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['7d', '14d', '30d', '90d', 'all'] as FilterRange[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRange(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                    selectedRange === r
                      ? 'bg-sky-600/20 text-sky-300 border-sky-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {rangeLabels[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Included Features List */}
          <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60 space-y-2 text-xs text-slate-300">
            <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Contenido incluido en el informe:
            </span>
            <ul className="space-y-1 text-slate-400 text-[11.5px] pl-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Resumen de <strong>{exportReadings.length} tomas</strong> con promedios y PAM</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Comparativa matutina vs vespertina y valores extremos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Gráfico visual de evolución temporal y líneas de riesgo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Tabla cronológica detallada con código de color clínico</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Espacio para observaciones y firma del médico</span>
              </li>
            </ul>
          </div>

          {exportReadings.length === 0 && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>No hay mediciones en el período seleccionado. Elige otro rango.</span>
            </div>
          )}

          {isDone && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>¡PDF generado y descargado correctamente! Ya puedes enviarlo a tu doctor.</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={isGenerating || exportReadings.length === 0}
              onClick={handleDownload}
              className="px-6 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Construyendo PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Descargar Reporte PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
