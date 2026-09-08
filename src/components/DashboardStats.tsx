import type { BPStatistics } from '../types/bloodPressure';
import { classifyBloodPressure, formatDateTime } from '../utils/bpClassifier';
import { 
  Activity, 
  Heart, 
  Sun, 
  Moon, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Gauge 
} from 'lucide-react';

interface DashboardStatsProps {
  statistics: BPStatistics;
}

export function DashboardStats({ statistics }: DashboardStatsProps) {
  if (statistics.totalCount === 0) {
    return null;
  }

  const avgCategory = classifyBloodPressure(statistics.avgSystolic, statistics.avgDiastolic);

  return (
    <div className="space-y-4">
      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Promedio Presión */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Promedio General
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {statistics.avgSystolic}/{statistics.avgDiastolic}
            </span>
            <span className="text-xs text-slate-400 font-medium">mmHg</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${avgCategory.badgeBg}`}>
              {avgCategory.shortLabel}
            </span>
            <span className="text-[11px] text-slate-400">
              {statistics.totalCount} tomas
            </span>
          </div>
        </div>

        {/* Card 2: Pulso Promedio */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pulso Promedio
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Heart className="w-4 h-4 animate-pulse" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {statistics.avgPulse}
            </span>
            <span className="text-xs text-slate-400 font-medium">lpm (bpm)</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
              statistics.avgPulse >= 60 && statistics.avgPulse <= 100
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60'
                : 'bg-amber-950/70 text-amber-300 border-amber-500/60'
            }`}>
              {statistics.avgPulse >= 60 && statistics.avgPulse <= 100 ? 'Normocárdico' : 'Revisar'}
            </span>
            <span className="text-[11px] text-slate-400">Rango ideal: 60-100</span>
          </div>
        </div>

        {/* Card 3: P.A. Media (PAM) y Presión de Pulso */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Presión Media (PAM)
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {statistics.avgMAP}
            </span>
            <span className="text-xs text-slate-400 font-medium">mmHg</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>P. Pulso: <strong className="text-slate-200">{statistics.avgPulsePressure} mmHg</strong></span>
            <span className="text-[11px] text-slate-500">Ref: 70-105 PAM</span>
          </div>
        </div>

        {/* Card 4: Control Clínico */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              En Rango Objetivo
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {statistics.inControlPercent}%
            </span>
            <span className="text-xs text-slate-400 font-medium">de las tomas</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                statistics.inControlPercent >= 70 ? 'bg-emerald-500' : statistics.inControlPercent >= 50 ? 'bg-yellow-500' : 'bg-rose-500'
              }`}
              style={{ width: `${statistics.inControlPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Desglose Matutino vs Vespertino + Picos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Morning vs Evening breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              Patrón Circadiano (Mañana vs Noche)
            </span>
            <span className="text-[11px] text-slate-500">Relevante para el médico</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Morning */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                <Sun className="w-4 h-4" />
                <span className="text-xs font-semibold">Tomas Matutinas</span>
              </div>
              {statistics.morningAvg.count > 0 ? (
                <div>
                  <div className="text-xl font-bold text-white">
                    {statistics.morningAvg.systolic}/{statistics.morningAvg.diastolic}
                    <span className="text-xs text-slate-400 font-normal ml-1">mmHg</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex justify-between">
                    <span>Pulso: {statistics.morningAvg.pulse} lpm</span>
                    <span>({statistics.morningAvg.count} tomas)</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-1">Sin registros matutinos</p>
              )}
            </div>

            {/* Evening */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-indigo-400 mb-1">
                <Moon className="w-4 h-4" />
                <span className="text-xs font-semibold">Tomas Nocturnas</span>
              </div>
              {statistics.eveningAvg.count > 0 ? (
                <div>
                  <div className="text-xl font-bold text-white">
                    {statistics.eveningAvg.systolic}/{statistics.eveningAvg.diastolic}
                    <span className="text-xs text-slate-400 font-normal ml-1">mmHg</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex justify-between">
                    <span>Pulso: {statistics.eveningAvg.pulse} lpm</span>
                    <span>({statistics.eveningAvg.count} tomas)</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-1">Sin registros vespertinos</p>
              )}
            </div>
          </div>
        </div>

        {/* Extreme Readings (Max & Min) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Valores Extremos del Período
            </span>
            <span className="text-[11px] text-slate-500">Picos registrados</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Max reading */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-rose-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold">Toma Más Alta</span>
              </div>
              {statistics.maxReading ? (
                <div>
                  <div className="text-xl font-bold text-white">
                    {statistics.maxReading.systolic}/{statistics.maxReading.diastolic}
                    <span className="text-xs text-slate-400 font-normal ml-1">mmHg</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    {formatDateTime(statistics.maxReading.timestamp)}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-1">Sin registros</p>
              )}
            </div>

            {/* Min reading */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-semibold">Toma Más Baja</span>
              </div>
              {statistics.minReading ? (
                <div>
                  <div className="text-xl font-bold text-white">
                    {statistics.minReading.systolic}/{statistics.minReading.diastolic}
                    <span className="text-xs text-slate-400 font-normal ml-1">mmHg</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    {formatDateTime(statistics.minReading.timestamp)}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-1">Sin registros</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
