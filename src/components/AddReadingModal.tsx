import React, { useState, useEffect } from 'react';
import type { 
  BloodPressureReading, 
  TimeOfDay, 
  BodyArm, 
  BodyPosition 
} from '../types/bloodPressure';
import { 
  classifyBloodPressure, 
  getTimeOfDayFromDate 
} from '../utils/bpClassifier';
import confetti from 'canvas-confetti';
import { 
  X, 
  Heart, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Tag, 
  FileText, 
  Plus, 
  Minus 
} from 'lucide-react';

interface AddReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reading: Omit<BloodPressureReading, 'id'>) => void;
  initialReading?: BloodPressureReading | null;
}

const COMMON_TAGS = [
  'En reposo',
  'Post medicación',
  'Post ejercicio',
  'Estrés / Preocupación',
  'Con dolor de cabeza',
  'Mareo / Fatiga',
  'Antes del desayuno',
  'Antes de dormir'
];

export function AddReadingModal({
  isOpen,
  onClose,
  onSave,
  initialReading
}: AddReadingModalProps) {
  // Form State
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(70);
  const [dateTimeStr, setDateTimeStr] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [arm, setArm] = useState<BodyArm>('left');
  const [position, setPosition] = useState<BodyPosition>('sitting');
  const [selectedTags, setSelectedTags] = useState<string[]>(['En reposo']);
  const [notes, setNotes] = useState<string>('');

  // Sync with initial reading or defaults
  useEffect(() => {
    if (isOpen) {
      if (initialReading) {
        setSystolic(initialReading.systolic);
        setDiastolic(initialReading.diastolic);
        setPulse(initialReading.pulse);
        
        const d = new Date(initialReading.timestamp);
        // Format for datetime-local (YYYY-MM-DDTHH:mm)
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDateTimeStr(localIso);
        setTimeOfDay(initialReading.timeOfDay);
        setArm(initialReading.arm);
        setPosition(initialReading.position);
        setSelectedTags(initialReading.tags || []);
        setNotes(initialReading.notes || '');
      } else {
        const now = new Date();
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDateTimeStr(localIso);
        setTimeOfDay(getTimeOfDayFromDate(now));
        setSystolic(120);
        setDiastolic(80);
        setPulse(70);
        setArm('left');
        setPosition('sitting');
        setSelectedTags(['En reposo']);
        setNotes('');
      }
    }
  }, [isOpen, initialReading]);

  if (!isOpen) return null;

  const currentCategory = classifyBloodPressure(systolic, diastolic);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = dateTimeStr ? new Date(dateTimeStr).toISOString() : new Date().toISOString();

    onSave({
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      pulse: Number(pulse),
      timestamp,
      timeOfDay,
      arm,
      position,
      tags: selectedTags,
      notes: notes.trim() || undefined
    });

    if (currentCategory.category === 'normal') {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              {initialReading ? 'Editar Medición' : 'Registrar Presión y Pulso'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Category Preview Banner */}
        <div className={`px-6 py-3 border-b flex items-start gap-3 transition-colors ${currentCategory.badgeBg}`}>
          {currentCategory.category === 'crisis' || currentCategory.category === 'stage2' ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400 animate-bounce" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
          )}
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              <span>{currentCategory.label}</span>
              <span className="text-xs font-normal opacity-80">({currentCategory.description})</span>
            </div>
            <p className="text-xs mt-0.5 opacity-90">{currentCategory.advice}</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Main Numbers: Systolic, Diastolic, Pulse */}
          <div className="grid grid-cols-3 gap-3">
            {/* Systolic (PAS) */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-center">
              <label className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                Sistólica (PAS)
              </label>
              <div className="flex items-center justify-center gap-1 my-1">
                <button
                  type="button"
                  onClick={() => setSystolic(s => Math.max(60, s - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="50"
                  max="280"
                  value={systolic}
                  onChange={(e) => setSystolic(Number(e.target.value))}
                  className="w-16 text-center text-2xl font-black bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-rose-500 rounded"
                  required
                />
                <button
                  type="button"
                  onClick={() => setSystolic(s => Math.min(260, s + 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-slate-500">mmHg (Alta)</span>
            </div>

            {/* Diastolic (PAD) */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-center">
              <label className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block mb-1">
                Diastólica (PAD)
              </label>
              <div className="flex items-center justify-center gap-1 my-1">
                <button
                  type="button"
                  onClick={() => setDiastolic(d => Math.max(40, d - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="40"
                  max="160"
                  value={diastolic}
                  onChange={(e) => setDiastolic(Number(e.target.value))}
                  className="w-16 text-center text-2xl font-black bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-sky-500 rounded"
                  required
                />
                <button
                  type="button"
                  onClick={() => setDiastolic(d => Math.min(160, d + 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-slate-500">mmHg (Baja)</span>
            </div>

            {/* Pulse */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-center">
              <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Pulso
              </label>
              <div className="flex items-center justify-center gap-1 my-1">
                <button
                  type="button"
                  onClick={() => setPulse(p => Math.max(30, p - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="30"
                  max="220"
                  value={pulse}
                  onChange={(e) => setPulse(Number(e.target.value))}
                  className="w-16 text-center text-2xl font-black bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPulse(p => Math.min(220, p + 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-slate-500">lpm (bpm)</span>
            </div>
          </div>

          {/* Date, Time and TimeOfDay */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Fecha y Hora
              </label>
              <input
                type="datetime-local"
                value={dateTimeStr}
                onChange={(e) => {
                  setDateTimeStr(e.target.value);
                  if (e.target.value) {
                    setTimeOfDay(getTimeOfDayFromDate(new Date(e.target.value)));
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">
                Momento del Día
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="morning">🌅 Mañana</option>
                <option value="afternoon">☀️ Tarde</option>
                <option value="evening">🌙 Noche</option>
                <option value="night">🌌 Madrugada</option>
              </select>
            </div>
          </div>

          {/* Body Details: Arm & Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">
                Brazo Utilizado
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setArm('left')}
                  className={`py-1.5 rounded-lg font-medium transition ${
                    arm === 'left' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Izquierdo
                </button>
                <button
                  type="button"
                  onClick={() => setArm('right')}
                  className={`py-1.5 rounded-lg font-medium transition ${
                    arm === 'right' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Derecho
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">
                Posición Corporal
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as BodyPosition)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="sitting">Sentado/a (Recomendado)</option>
                <option value="lying">Acostado/a</option>
                <option value="standing">De pie</option>
              </select>
            </div>
          </div>

          {/* Contextual Tags */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Etiquetas y Contexto
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSelected 
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50' 
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes / Medication */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notas u Observaciones para el Médico
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Dosis de Losartán tomada hace 1 hora, leve cefalea, buen descanso..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-xl shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
            >
              <span>{initialReading ? 'Actualizar Medición' : 'Guardar Medición'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
