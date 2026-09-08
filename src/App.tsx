import { useState, useRef } from 'react';
import { useBloodPressureData } from './hooks/useBloodPressureData';
import { usePwaInstall } from './hooks/usePwaInstall';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { BloodPressureChart } from './components/BloodPressureChart';
import type { ChartRefHandle } from './components/BloodPressureChart';
import { HistoryTable } from './components/HistoryTable';
import { AddReadingModal } from './components/AddReadingModal';
import { PdfReportModal } from './components/PdfReportModal';
import { PatientProfileModal } from './components/PatientProfileModal';
import { QuickTipsModal } from './components/QuickTipsModal';
import { exportToCsv, exportToJson, importFromJsonFile } from './utils/storage';
import type { BloodPressureReading } from './types/bloodPressure';
import { classifyBloodPressure, formatDateTime } from './utils/bpClassifier';
import { 
  Heart, 
  Plus, 
  FileDown, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  CheckCircle2,
  AlertTriangle 
} from 'lucide-react';

export function App() {
  const {
    readings,
    filteredReadings,
    patientProfile,
    filterRange,
    statistics,
    isLoaded,
    hasDemoReadings,
    setFilterRange,
    addReading,
    updateReading,
    deleteReading,
    updateProfile,
    resetToDemoData,
    removeDemoReadings,
    clearAllData,
    importData
  } = useBloodPressureData();

  const { isInstallable, installApp } = usePwaInstall();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<BloodPressureReading | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);

  // Chart reference for PDF generation
  const chartRef = useRef<ChartRefHandle>(null);

  const handleEditClick = (reading: BloodPressureReading) => {
    setEditingReading(reading);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingReading(null);
  };

  const handleSaveReading = (data: Omit<BloodPressureReading, 'id'>) => {
    if (editingReading) {
      updateReading(editingReading.id, data);
    } else {
      addReading(data);
    }
  };

  const handleImportJson = async (file: File) => {
    try {
      const result = await importFromJsonFile(file);
      importData(result.readings, result.profile);
      alert(`¡Éxito! Se importaron ${result.readings.length} mediciones correctamente.`);
    } catch (err: any) {
      alert(`Error al importar archivo: ${err.message || 'Formato no soportado'}`);
    }
  };

  const latestReading = readings.length > 0 ? readings[0] : null;
  const latestCategory = latestReading ? classifyBloodPressure(latestReading.systolic, latestReading.diastolic) : null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 animate-pulse" />
          <span>Cargando CardioLog...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenAddModal={() => {
          setEditingReading(null);
          setIsAddModalOpen(true);
        }}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenTipsModal={() => setIsTipsModalOpen(true)}
        onResetDemo={resetToDemoData}
        onClearAllData={clearAllData}
        onExportCsv={() => exportToCsv(readings)}
        onExportJson={() => exportToJson(readings, patientProfile)}
        onImportJsonFile={handleImportJson}
        patientProfile={patientProfile}
        isInstallable={isInstallable}
        onInstallPwa={installApp}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome & Latest Reading Hero Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Monitoreo Continuo</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Hola, {patientProfile.name.split(' ')[0]} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Lleva el control de tu presión arterial y pulso. Los datos se guardan de forma privada en tu dispositivo y puedes generar informes en PDF para tu médico en cualquier momento.
              </p>
            </div>

            {/* Latest Reading Badge or Quick Action */}
            {latestReading && latestCategory ? (
              <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Heart className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Última toma ({formatDateTime(latestReading.timestamp)})</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-black text-white">
                      {latestReading.systolic}/{latestReading.diastolic}
                    </span>
                    <span className="text-xs text-slate-400">mmHg</span>
                    <span className="text-xs font-medium text-emerald-400 ml-1">
                      {latestReading.pulse} lpm
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10.5px] font-semibold border ${latestCategory.badgeBg}`}>
                      {latestCategory.label}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold text-xs shadow-lg transition"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar primera toma</span>
              </button>
            )}
          </div>
        </section>

        {/* Banner para limpiar tomas de ejemplo si están presentes */}
        {hasDemoReadings && (
          <section className="bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">
                  Actualmente hay datos de ejemplo en el gráfico
                </h3>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  ¿Deseas quitarlos para ver únicamente tus tomas reales en el gráfico y estadísticas?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas borrar las tomas de ejemplo y conservar solo tus mediciones reales?')) {
                    removeDemoReadings();
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-xl shadow-lg transition"
              >
                Eliminar tomas de ejemplo
              </button>
            </div>
          </section>
        )}

        {/* Clinical Statistics Cards */}
        <section>
          <DashboardStats statistics={statistics} />
        </section>

        {/* Interactive Charts */}
        <section>
          <BloodPressureChart
            ref={chartRef}
            readings={filteredReadings}
            filterRange={filterRange}
            onFilterChange={setFilterRange}
          />
        </section>

        {/* History Table */}
        <section>
          <HistoryTable
            readings={readings}
            onEdit={handleEditClick}
            onDelete={deleteReading}
            hasDemoReadings={hasDemoReadings}
            onRemoveDemo={removeDemoReadings}
          />
        </section>

        {/* Bottom Fast Action Banner */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                ¿Tienes cita con tu doctor pronto?
              </h3>
              <p className="text-xs text-slate-400">
                Descarga el informe completo en PDF con tus promedios, PAM y gráficos en alta resolución.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsTipsModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Cómo medirse</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
            >
              <FileDown className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            100% Privado y Offline
          </span>
          <span>•</span>
          <span>Guías Clínicas AHA / ESC</span>
          <span>•</span>
          <span>PWA Instalable</span>
        </div>
        <p className="text-[11px] text-slate-600 max-w-2xl mx-auto">
          CardioLog es una herramienta de registro personal y apoyo clínico. No sustituye la consulta médica profesional, el diagnóstico ni la prescripción facultativa. En caso de cifras críticas (&gt;180/120 mmHg) o síntomas agudos, acuda a urgencias.
        </p>
      </footer>

      {/* Modals */}
      <AddReadingModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveReading}
        initialReading={editingReading}
      />

      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        readings={readings}
        patientProfile={patientProfile}
        statistics={statistics}
        onOpenProfile={() => {
          setIsPdfModalOpen(false);
          setIsProfileModalOpen(true);
        }}
      />

      <PatientProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={patientProfile}
        onSave={updateProfile}
      />

      <QuickTipsModal
        isOpen={isTipsModalOpen}
        onClose={() => setIsTipsModalOpen(false)}
      />
    </div>
  );
}

export default App;
