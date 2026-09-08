import type { BloodPressureReading, PatientProfile } from '../types/bloodPressure';

export const DEMO_PATIENT: PatientProfile = {
  name: 'Carlos Alberto Rodríguez',
  age: 58,
  idNumber: '28.450.912',
  doctorName: 'Dra. Mariana Gómez (Cardióloga)',
  currentMedication: 'Losartán 50mg (1 vez al día por la mañana), Amlodipina 5mg (por la noche)',
  notes: 'Control ambulatorio sugerido por médico de cabecera tras ajuste de dosis.'
};

export function generateDemoReadings(): BloodPressureReading[] {
  const readings: BloodPressureReading[] = [];
  const now = new Date();
  
  // Generate 20 realistic readings over the last 12 days
  const baseData = [
    { daysAgo: 11, hour: 8, min: 15, sys: 138, dia: 86, pulse: 74, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['En reposo'], notes: 'Inicio de nuevo registro' },
    { daysAgo: 11, hour: 20, min: 30, sys: 134, dia: 84, pulse: 72, tod: 'evening', arm: 'left', pos: 'sitting', tags: ['Post medicación'], notes: '' },
    { daysAgo: 10, hour: 8, min: 0, sys: 132, dia: 83, pulse: 71, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['En reposo'], notes: '' },
    { daysAgo: 10, hour: 21, min: 10, sys: 129, dia: 82, pulse: 69, tod: 'evening', arm: 'right', pos: 'sitting', tags: ['En reposo'], notes: 'Cena ligera' },
    { daysAgo: 9, hour: 8, min: 20, sys: 130, dia: 82, pulse: 75, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['En reposo'], notes: '' },
    { daysAgo: 9, hour: 19, min: 45, sys: 126, dia: 80, pulse: 68, tod: 'evening', arm: 'left', pos: 'sitting', tags: ['Post medicación'], notes: '' },
    { daysAgo: 8, hour: 8, min: 5, sys: 128, dia: 79, pulse: 70, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['En reposo'], notes: '' },
    { daysAgo: 8, hour: 20, min: 50, sys: 125, dia: 78, pulse: 66, tod: 'evening', arm: 'right', pos: 'sitting', tags: ['En reposo'], notes: '' },
    { daysAgo: 7, hour: 8, min: 30, sys: 136, dia: 85, pulse: 78, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['Estrés'], notes: 'Mala noche de sueño' },
    { daysAgo: 7, hour: 20, min: 15, sys: 131, dia: 82, pulse: 72, tod: 'evening', arm: 'left', pos: 'sitting', tags: ['Post medicación'], notes: '' },
    { daysAgo: 6, hour: 8, min: 10, sys: 124, dia: 78, pulse: 68, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['En reposo'], notes: 'Caminata previa hace 2 horas' },
    { daysAgo: 6, hour: 21, min: 0, sys: 122, dia: 77, pulse: 67, tod: 'evening', arm: 'right', pos: 'sitting', tags: ['En reposo'], notes: '' },
    { daysAgo: 5, hour: 8, min: 25, sys: 121, dia: 76, pulse: 69, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['En reposo'], notes: '' },
    { daysAgo: 5, hour: 19, min: 30, sys: 125, dia: 79, pulse: 71, tod: 'evening', arm: 'left', pos: 'sitting', tags: ['Post medicación'], notes: '' },
    { daysAgo: 4, hour: 8, min: 15, sys: 120, dia: 75, pulse: 66, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['En reposo'], notes: '' },
    { daysAgo: 4, hour: 20, min: 40, sys: 119, dia: 74, pulse: 65, tod: 'evening', arm: 'right', pos: 'sitting', tags: ['En reposo'], notes: 'Valores excelentes' },
    { daysAgo: 3, hour: 8, min: 0, sys: 123, dia: 76, pulse: 68, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['En reposo'], notes: '' },
    { daysAgo: 3, hour: 20, min: 10, sys: 121, dia: 75, pulse: 67, tod: 'evening', arm: 'left', pos: 'sitting', tags: ['Post medicación'], notes: '' },
    { daysAgo: 2, hour: 8, min: 30, sys: 118, dia: 74, pulse: 64, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['En reposo'], notes: '' },
    { daysAgo: 1, hour: 8, min: 15, sys: 119, dia: 75, pulse: 66, tod: 'morning', arm: 'left', pos: 'sitting', tags: ['En reposo'], notes: 'Control pre-consulta' }
  ];

  baseData.forEach((item, index) => {
    const d = new Date(now.getTime() - item.daysAgo * 24 * 60 * 60 * 1000);
    d.setHours(item.hour, item.min, 0, 0);

    readings.push({
      id: `demo-${index + 1}`,
      systolic: item.sys,
      diastolic: item.dia,
      pulse: item.pulse,
      timestamp: d.toISOString(),
      timeOfDay: item.tod as any,
      arm: item.arm as any,
      position: item.pos as any,
      tags: item.tags,
      notes: item.notes
    });
  });

  // Sort descending by timestamp
  return readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
