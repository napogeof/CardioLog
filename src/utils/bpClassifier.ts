import type { 
  BPCategory, 
  CategoryDetails, 
  TimeOfDay, 
  BodyArm, 
  BodyPosition 
} from '../types/bloodPressure';

export const CATEGORY_DEFINITIONS: Record<BPCategory, CategoryDetails> = {
  crisis: {
    category: 'crisis',
    label: 'Crisis Hipertensiva',
    shortLabel: 'Crisis',
    description: 'Sistólica > 180 o Diastólica > 120 mmHg',
    advice: '¡Consulte a un servicio de urgencias médicas de inmediato!',
    color: '#dc2626', // Red 600
    badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-600/70',
    badgeText: 'text-rose-400',
    borderColor: 'border-rose-600',
    glowColor: 'rgba(220, 38, 38, 0.4)'
  },
  stage2: {
    category: 'stage2',
    label: 'Hipertensión Grado 2',
    shortLabel: 'HTA Grado 2',
    description: 'Sistólica ≥ 140 o Diastólica ≥ 90 mmHg',
    advice: 'Requiere evaluación médica periódica y posiblemente ajuste de medicación.',
    color: '#ef4444', // Red 500
    badgeBg: 'bg-red-950/70 text-red-300 border-red-500/60',
    badgeText: 'text-red-400',
    borderColor: 'border-red-500',
    glowColor: 'rgba(239, 68, 68, 0.3)'
  },
  stage1: {
    category: 'stage1',
    label: 'Hipertensión Grado 1',
    shortLabel: 'HTA Grado 1',
    description: 'Sistólica 130-139 o Diastólica 80-89 mmHg',
    advice: 'Monitoree con frecuencia, reduzca el consumo de sal y consulte a su doctor.',
    color: '#f97316', // Orange 500
    badgeBg: 'bg-orange-950/70 text-orange-300 border-orange-500/60',
    badgeText: 'text-orange-400',
    borderColor: 'border-orange-500',
    glowColor: 'rgba(249, 115, 22, 0.3)'
  },
  elevated: {
    category: 'elevated',
    label: 'Presión Elevada',
    shortLabel: 'Elevada',
    description: 'Sistólica 120-129 y Diastólica < 80 mmHg',
    advice: 'Adopte hábitos saludables (dieta DASH, actividad física regular y descanso).',
    color: '#eab308', // Yellow 500
    badgeBg: 'bg-yellow-950/70 text-yellow-300 border-yellow-500/60',
    badgeText: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    glowColor: 'rgba(234, 179, 8, 0.3)'
  },
  normal: {
    category: 'normal',
    label: 'Presión Normal / Óptima',
    shortLabel: 'Normal',
    description: 'Sistólica 90-119 y Diastólica 60-79 mmHg',
    advice: '¡Excelente! Sus valores se encuentran en el rango cardiosaludable ideal.',
    color: '#10b981', // Emerald 500
    badgeBg: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60',
    badgeText: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    glowColor: 'rgba(16, 185, 129, 0.3)'
  },
  hypotension: {
    category: 'hypotension',
    label: 'Hipotensión (Baja)',
    shortLabel: 'Baja',
    description: 'Sistólica < 90 o Diastólica < 60 mmHg',
    advice: 'Mantenga una buena hidratación. Consulte si siente mareos o debilidad.',
    color: '#06b6d4', // Cyan 500
    badgeBg: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/60',
    badgeText: 'text-cyan-400',
    borderColor: 'border-cyan-500',
    glowColor: 'rgba(6, 182, 212, 0.3)'
  }
};

/**
 * Clasifica la medición según las guías AHA / ESC
 */
export function classifyBloodPressure(systolic: number, diastolic: number): CategoryDetails {
  if (systolic > 180 || diastolic > 120) {
    return CATEGORY_DEFINITIONS.crisis;
  }
  if (systolic >= 140 || diastolic >= 90) {
    return CATEGORY_DEFINITIONS.stage2;
  }
  if (systolic >= 130 || diastolic >= 80) {
    return CATEGORY_DEFINITIONS.stage1;
  }
  if (systolic >= 120 && diastolic < 80) {
    return CATEGORY_DEFINITIONS.elevated;
  }
  if (systolic < 90 || diastolic < 60) {
    return CATEGORY_DEFINITIONS.hypotension;
  }
  return CATEGORY_DEFINITIONS.normal;
}

/**
 * Calcula la Presión Arterial Media (PAM / MAP)
 * Fórmula estándar clínica: (PAS + 2*PAD) / 3
 */
export function calculateMAP(systolic: number, diastolic: number): number {
  return Math.round(((systolic + 2 * diastolic) / 3) * 10) / 10;
}

/**
 * Calcula la Presión de Pulso (PP)
 * PP = Sistólica - Diastólica (mmHg)
 */
export function calculatePulsePressure(systolic: number, diastolic: number): number {
  return systolic - diastolic;
}

/**
 * Determina automáticamente el momento del día a partir de una fecha
 */
export function getTimeOfDayFromDate(date: Date): TimeOfDay {
  const hours = date.getHours();
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 19) return 'afternoon';
  if (hours >= 19 && hours < 23) return 'evening';
  return 'night';
}

export function getTimeOfDayLabel(tod: TimeOfDay): string {
  switch (tod) {
    case 'morning': return 'Mañana';
    case 'afternoon': return 'Tarde';
    case 'evening': return 'Noche';
    case 'night': return 'Madrugada';
  }
}

export function getArmLabel(arm: BodyArm): string {
  return arm === 'left' ? 'Brazo Izquierdo' : 'Brazo Derecho';
}

export function getPositionLabel(pos: BodyPosition): string {
  switch (pos) {
    case 'sitting': return 'Sentado/a';
    case 'lying': return 'Acostado/a';
    case 'standing': return 'De pie';
  }
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
