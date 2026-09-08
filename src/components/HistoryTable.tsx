import { useState, useMemo } from 'react';
import type { BloodPressureReading } from '../types/bloodPressure';
import { 
  classifyBloodPressure, 
  calculateMAP, 
  calculatePulsePressure, 
  formatDateTime, 
  getTimeOfDayLabel, 
  getArmLabel 
} from '../utils/bpClassifier';
import { 
  History, 
  Search, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Sunset, 
  Sparkles,
  Heart
} from 'lucide-react';

interface HistoryTableProps {
  readings: BloodPressureReading[];
  onEdit: (reading: BloodPressureReading) => void;
  onDelete: (id: string) => void;
  hasDemoReadings?: boolean;
  onRemoveDemo?: () => void;
}

const ITEMS_PER_PAGE = 8;

export function HistoryTable({ 
  readings, 
  onEdit, 
  onDelete,
  hasDemoReadings,
  onRemoveDemo
}: HistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter readings by search and category
  const filtered = useMemo(() => {
    return readings.filter(r => {
      const cat = classifyBloodPressure(r.systolic, r.diastolic);
      
      if (selectedCategoryFilter !== 'all' && cat.category !== selectedCategoryFilter) {
        return false;
      }

      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      const matchNotes = (r.notes || '').toLowerCase().includes(lower);
      const matchTags = r.tags.some(t => t.toLowerCase().includes(lower));
      const matchDate = formatDateTime(r.timestamp).toLowerCase().includes(lower);
      const matchCat = cat.label.toLowerCase().includes(lower);

      return matchNotes || matchTags || matchDate || matchCat;
    });
  }, [readings, searchTerm, selectedCategoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const getTimeIcon = (tod: string) => {
    switch (tod) {
      case 'morning': return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'afternoon': return <Sunset className="w-3.5 h-3.5 text-orange-400" />;
      case 'evening':
      case 'night': return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header with Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Historial de Mediciones
            </h2>
            <p className="text-xs text-slate-400">
              {filtered.length} registro(s) encontrado(s)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar fecha, nota o síntoma..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 w-44 sm:w-56"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => {
              setSelectedCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Todas las categorías</option>
            <option value="normal">Normal</option>
            <option value="elevated">Elevada</option>
            <option value="stage1">HTA Grado 1</option>
            <option value="stage2">HTA Grado 2</option>
            <option value="crisis">Crisis Hipertensiva</option>
            <option value="hypotension">Hipotensión</option>
          </select>

          {hasDemoReadings && onRemoveDemo && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas quitar los registros de prueba y quedarte solo con tus tomas reales?')) {
                  onRemoveDemo();
                }
              }}
              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition flex items-center gap-1"
              title="Quitar tomas de ejemplo"
            >
              <span>Quitar datos demo</span>
            </button>
          )}
        </div>
      </div>

      {/* List / Table */}
      {paginated.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <History className="w-8 h-8 stroke-1 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">No se encontraron tomas con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5 rounded-l-xl">Fecha y Hora</th>
                <th className="px-3 py-2.5">Presión (PAS / PAD)</th>
                <th className="px-3 py-2.5">Pulso</th>
                <th className="px-3 py-2.5">PAM / PP</th>
                <th className="px-3 py-2.5">Estado Clínico</th>
                <th className="px-3 py-2.5">Detalles / Brazo</th>
                <th className="px-3 py-2.5 rounded-r-xl text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginated.map(r => {
                const cat = classifyBloodPressure(r.systolic, r.diastolic);
                const map = calculateMAP(r.systolic, r.diastolic);
                const pp = calculatePulsePressure(r.systolic, r.diastolic);

                return (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition group">
                    {/* Timestamp & TimeOfDay */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-semibold text-white">
                        {formatDateTime(r.timestamp)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        {getTimeIcon(r.timeOfDay)}
                        <span>{getTimeOfDayLabel(r.timeOfDay)}</span>
                      </div>
                    </td>

                    {/* Blood Pressure */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-white">
                          {r.systolic} / {r.diastolic}
                        </span>
                        <span className="text-[10px] text-slate-500">mmHg</span>
                      </div>
                    </td>

                    {/* Pulse */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-emerald-400">
                        <Heart className="w-3.5 h-3.5" />
                        <span>{r.pulse} <span className="text-[10px] text-slate-400">lpm</span></span>
                      </div>
                    </td>

                    {/* MAP & Pulse Pressure */}
                    <td className="px-3 py-3 whitespace-nowrap text-slate-400">
                      <div>PAM: <strong className="text-slate-200">{map}</strong></div>
                      <div className="text-[10px] text-slate-500">PP: {pp} mmHg</div>
                    </td>

                    {/* Category Badge */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cat.badgeBg}`}>
                        {cat.label}
                      </span>
                    </td>

                    {/* Details / Tags / Notes */}
                    <td className="px-3 py-3 max-w-xs">
                      <div className="text-[11px] text-slate-400 mb-1">
                        {getArmLabel(r.arm)}
                      </div>
                      {r.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {r.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.2 text-[9.5px] rounded bg-slate-800 text-slate-300">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {r.notes && (
                        <div className="text-[11px] text-slate-300 italic truncate" title={r.notes}>
                          "{r.notes}"
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(r)}
                          title="Editar toma"
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('¿Seguro/a de que deseas eliminar esta toma?')) {
                              onDelete(r.id);
                            }
                          }}
                          title="Eliminar toma"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
