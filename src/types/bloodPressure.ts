export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type BodyArm = 'left' | 'right';
export type BodyPosition = 'sitting' | 'lying' | 'standing';

export type BPCategory = 
  | 'hypotension'
  | 'normal'
  | 'elevated'
  | 'stage1'
  | 'stage2'
  | 'crisis';

export interface BloodPressureReading {
  id: string;
  systolic: number;     // mmHg (PAS)
  diastolic: number;    // mmHg (PAD)
  pulse: number;        // lpm / bpm
  timestamp: string;    // ISO string
  timeOfDay: TimeOfDay;
  arm: BodyArm;
  position: BodyPosition;
  tags: string[];
  notes?: string;
}

export interface CategoryDetails {
  category: BPCategory;
  label: string;
  shortLabel: string;
  description: string;
  advice: string;
  color: string;           // Hex color for charts
  badgeBg: string;         // Tailwind class
  badgeText: string;       // Tailwind class
  borderColor: string;     // Tailwind class
  glowColor: string;
}

export interface PatientProfile {
  name: string;
  age?: number | string;
  idNumber?: string;
  doctorName?: string;
  currentMedication?: string;
  notes?: string;
}

export type FilterRange = '7d' | '14d' | '30d' | '90d' | 'all';

export interface AverageSet {
  systolic: number;
  diastolic: number;
  pulse: number;
  count: number;
}

export interface BPStatistics {
  totalCount: number;
  avgSystolic: number;
  avgDiastolic: number;
  avgPulse: number;
  avgMAP: number;            // Presión Arterial Media
  avgPulsePressure: number;   // Presión de Pulso (PAS - PAD)
  morningAvg: AverageSet;
  eveningAvg: AverageSet;
  maxReading: BloodPressureReading | null;
  minReading: BloodPressureReading | null;
  categoryDistribution: Record<BPCategory, number>;
  inControlPercent: number;  // Porcentaje en rango normal/óptimo
}
