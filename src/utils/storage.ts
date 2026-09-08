import type { BloodPressureReading, PatientProfile } from '../types/bloodPressure';
import { DEMO_PATIENT, generateDemoReadings } from './demoData';
import { classifyBloodPressure, formatDateTime, getArmLabel, getPositionLabel, getTimeOfDayLabel } from './bpClassifier';

const READINGS_KEY = 'cardiolog_readings_v1';
const PATIENT_KEY = 'cardiolog_patient_v1';
const INITIALIZED_KEY = 'cardiolog_initialized_v1';

export function loadReadings(): BloodPressureReading[] {
  try {
    const isInitialized = localStorage.getItem(INITIALIZED_KEY);
    const raw = localStorage.getItem(READINGS_KEY);

    if (!isInitialized) {
      // Primera vez absoluta en el dispositivo: marcar como inicializado y cargar demo
      localStorage.setItem(INITIALIZED_KEY, 'true');
      const initial = generateDemoReadings();
      saveReadings(initial);
      return initial;
    }

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Error al cargar mediciones desde localStorage:', e);
    return [];
  }
}

export function saveReadings(readings: BloodPressureReading[]): void {
  try {
    localStorage.setItem(READINGS_KEY, JSON.stringify(readings));
  } catch (e) {
    console.error('Error al guardar mediciones en localStorage:', e);
  }
}

export function loadPatientProfile(): PatientProfile {
  try {
    const raw = localStorage.getItem(PATIENT_KEY);
    if (!raw) {
      // Default profile
      savePatientProfile(DEMO_PATIENT);
      return DEMO_PATIENT;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al cargar perfil de paciente:', e);
    return { name: 'Paciente' };
  }
}

export function savePatientProfile(profile: PatientProfile): void {
  try {
    localStorage.setItem(PATIENT_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error al guardar perfil de paciente:', e);
  }
}

/**
 * Exporta todas las mediciones a un archivo JSON descargable
 */
export function exportToJson(readings: BloodPressureReading[], profile: PatientProfile): void {
  const data = {
    exportedAt: new Date().toISOString(),
    patient: profile,
    readings
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CardioLog_Respaldo_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta el historial a CSV para abrir en Excel o Google Sheets
 */
export function exportToCsv(readings: BloodPressureReading[]): void {
  const headers = ['ID', 'Fecha y Hora', 'Momento', 'Sistolica (mmHg)', 'Diastolica (mmHg)', 'Pulso (lpm)', 'Categoria', 'Brazo', 'Posicion', 'Etiquetas', 'Notas'];
  
  const rows = readings.map(r => {
    const cat = classifyBloodPressure(r.systolic, r.diastolic);
    return [
      r.id,
      formatDateTime(r.timestamp),
      getTimeOfDayLabel(r.timeOfDay),
      r.systolic,
      r.diastolic,
      r.pulse,
      cat.label,
      getArmLabel(r.arm),
      getPositionLabel(r.position),
      `"${r.tags.join(', ')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CardioLog_Mediciones_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo JSON y devuelve las lecturas parseadas
 */
export function importFromJsonFile(file: File): Promise<{ readings: BloodPressureReading[]; profile?: PatientProfile }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          resolve({ readings: parsed });
        } else if (parsed && Array.isArray(parsed.readings)) {
          resolve({ readings: parsed.readings, profile: parsed.patient });
        } else {
          reject(new Error('Formato de archivo inválido'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}
