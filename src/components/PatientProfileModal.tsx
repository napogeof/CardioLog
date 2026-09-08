import React, { useState, useEffect } from 'react';
import type { PatientProfile } from '../types/bloodPressure';
import { X, User, Stethoscope, Pill, Check } from 'lucide-react';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PatientProfile;
  onSave: (updated: PatientProfile) => void;
}

export function PatientProfileModal({
  isOpen,
  onClose,
  profile,
  onSave
}: PatientProfileModalProps) {
  const [name, setName] = useState(profile.name || '');
  const [age, setAge] = useState(profile.age || '');
  const [idNumber, setIdNumber] = useState(profile.idNumber || '');
  const [doctorName, setDoctorName] = useState(profile.doctorName || '');
  const [currentMedication, setCurrentMedication] = useState(profile.currentMedication || '');
  const [notes, setNotes] = useState(profile.notes || '');

  useEffect(() => {
    if (isOpen) {
      setName(profile.name || '');
      setAge(profile.age || '');
      setIdNumber(profile.idNumber || '');
      setDoctorName(profile.doctorName || '');
      setCurrentMedication(profile.currentMedication || '');
      setNotes(profile.notes || '');
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || 'Paciente',
      age: age ? Number(age) : undefined,
      idNumber: idNumber.trim() || undefined,
      doctorName: doctorName.trim() || undefined,
      currentMedication: currentMedication.trim() || undefined,
      notes: notes.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ficha del Paciente</h2>
              <p className="text-[11px] text-slate-400">Datos para el membrete del informe médico PDF</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs text-slate-300 font-medium mb-1 block">
              Nombre Completo del Paciente *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Carlos Alberto Rodríguez"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium mb-1 block">
                Edad
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ej: 58"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium mb-1 block">
                DNI / Cédula / ID
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Ej: 28.450.912"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
              Médico Tratante / Especialista
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Ej: Dra. Mariana Gómez (Cardiología)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-slate-400" />
              Medicación Actual y Dosis
            </label>
            <textarea
              rows={2}
              value={currentMedication}
              onChange={(e) => setCurrentMedication(e.target.value)}
              placeholder="Ej: Losartán 50mg (1x mañana), Amlodipina 5mg (noche)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium mb-1 block">
              Observaciones adicionales
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Control previo a consulta trimestral"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

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
              className="px-5 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg shadow-sky-600/30 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Perfil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
