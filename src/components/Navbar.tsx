import React, { useState, useRef } from 'react';
import type { PatientProfile } from '../types/bloodPressure';
import { 
  Heart, 
  Plus, 
  FileDown, 
  User, 
  Download, 
  HelpCircle, 
  MoreVertical, 
  FileSpreadsheet, 
  RotateCcw, 
  Upload, 
  Save,
  Trash2 
} from 'lucide-react';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenPdfModal: () => void;
  onOpenProfileModal: () => void;
  onOpenTipsModal: () => void;
  onResetDemo: () => void;
  onClearAllData: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
  patientProfile: PatientProfile;
  isInstallable: boolean;
  onInstallPwa: () => void;
}

export function Navbar({
  onOpenAddModal,
  onOpenPdfModal,
  onOpenProfileModal,
  onOpenTipsModal,
  onResetDemo,
  onClearAllData,
  onExportCsv,
  onExportJson,
  onImportJsonFile,
  patientProfile,
  isInstallable,
  onInstallPwa
}: NavbarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportJsonFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-rose-500 to-rose-400 p-0.5 shadow-lg shadow-rose-500/20 flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/30" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                CardioLog
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Monitoreo Clínico de Presión & Pulso
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* PWA Install Button */}
          {isInstallable && (
            <button
              type="button"
              onClick={onInstallPwa}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-sky-300 bg-sky-950/80 hover:bg-sky-900/80 border border-sky-600/50 rounded-xl transition shadow-sm"
              title="Instalar CardioLog en tu pantalla de inicio"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Instalar</span>
            </button>
          )}

          {/* Quick Tips (hidden on mobile, inside menu) */}
          <button
            type="button"
            onClick={onOpenTipsModal}
            className="hidden md:flex p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-800 transition"
            title="Guía de toma correcta"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Patient Profile */}
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition"
            title="Configurar datos del paciente para el PDF"
          >
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span className="max-w-[80px] sm:max-w-[100px] truncate hidden sm:inline">
              {patientProfile.name || 'Paciente'}
            </span>
          </button>

          {/* PDF Report Export Button */}
          <button
            type="button"
            onClick={onOpenPdfModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/25 transition"
            title="Generar y descargar informe PDF para el médico"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">PDF</span>
          </button>

          {/* Add Reading Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg shadow-sky-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Medición</span>
          </button>

          {/* More Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white bg-slate-900 sm:bg-transparent hover:bg-slate-800 rounded-xl border border-slate-800 sm:border-transparent transition"
              title="Más opciones"
            >
              <MoreVertical className="w-4 h-4 text-slate-300" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenProfileModal();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-left transition text-white font-medium"
                  >
                    <User className="w-4 h-4 text-sky-400" />
                    <span>Ficha del Paciente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenTipsModal();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-left transition"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>Cómo medirse correctamente</span>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    type="button"
                    onClick={() => {
                      onExportCsv();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-left transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Exportar a Excel (CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onExportJson();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-left transition"
                  >
                    <Save className="w-4 h-4 text-sky-400" />
                    <span>Copia de seguridad (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-left transition"
                  >
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>Restaurar copia (JSON)</span>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Deseas recargar los datos médicos de ejemplo?')) {
                        onResetDemo();
                      }
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-left text-amber-300 transition"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Cargar datos de ejemplo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Deseas vaciar todas las mediciones y perfil para empezar de cero con tus propios datos?')) {
                        onClearAllData();
                      }
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-950/40 text-left text-rose-400 hover:text-rose-300 transition"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Vaciar datos (Empezar de cero)</span>
                  </button>
                </div>
              </>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
