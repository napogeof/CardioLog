import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import type { BloodPressureReading, FilterRange } from '../types/bloodPressure';
import { classifyBloodPressure, formatDate, formatTime } from '../utils/bpClassifier';
import { Activity, Heart, BarChart3, TrendingUp } from 'lucide-react';

// Register Chart.js plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

interface BloodPressureChartProps {
  readings: BloodPressureReading[];
  filterRange: FilterRange;
  onFilterChange: (range: FilterRange) => void;
}

export interface ChartRefHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

export const BloodPressureChart = forwardRef<ChartRefHandle, BloodPressureChartProps>(
  ({ readings, filterRange, onFilterChange }, ref) => {
    const [chartMode, setChartMode] = useState<'pressure' | 'pulse' | 'distribution'>('pressure');
    const chartRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getCanvas: () => {
        if (chartRef.current) {
          return chartRef.current.canvas || null;
        }
        return null;
      }
    }));

    // Data sorted chronological (oldest to newest) for chart timeline
    const chronological = [...readings].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const labels = chronological.map(r => `${formatDate(r.timestamp)} ${formatTime(r.timestamp)}`);
    const systolicData = chronological.map(r => r.systolic);
    const diastolicData = chronological.map(r => r.diastolic);
    const pulseData = chronological.map(r => r.pulse);

    // Dynamic point colors based on medical category
    const pointColorsSys = chronological.map(r => classifyBloodPressure(r.systolic, r.diastolic).color);

    // Chart.js configuration for Blood Pressure
    const pressureChartData = {
      labels,
      datasets: [
        {
          label: 'Sistólica (PAS)',
          data: systolicData,
          borderColor: '#f43f5e', // Rose 500
          backgroundColor: 'rgba(244, 63, 94, 0.12)',
          pointBackgroundColor: pointColorsSys,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Diastólica (PAD)',
          data: diastolicData,
          borderColor: '#0284c7', // Sky 600
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          pointBackgroundColor: '#0284c7',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4.5,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: true
        }
      ]
    };

    const pressureChartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: '#94a3b8',
            font: { size: 12, weight: '500' },
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            afterBody: (context: any) => {
              const idx = context[0].dataIndex;
              const r = chronological[idx];
              const cat = classifyBloodPressure(r.systolic, r.diastolic);
              return [
                `Pulso: ${r.pulse} lpm`,
                `Estado: ${cat.label}`,
                r.tags.length ? `Contexto: ${r.tags.join(', ')}` : '',
                r.notes ? `Nota: ${r.notes}` : ''
              ].filter(Boolean);
            }
          }
        },
        annotation: {
          annotations: {
            sysNormalLine: {
              type: 'line',
              yMin: 120,
              yMax: 120,
              borderColor: 'rgba(16, 185, 129, 0.55)',
              borderWidth: 1.5,
              borderDash: [5, 5],
              label: {
                display: true,
                content: 'Límite Normal (120 PAS)',
                position: 'end',
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                color: '#fff',
                font: { size: 9, weight: 'bold' }
              }
            },
            sysStage2Line: {
              type: 'line',
              yMin: 140,
              yMax: 140,
              borderColor: 'rgba(239, 68, 68, 0.65)',
              borderWidth: 1.5,
              borderDash: [4, 4],
              label: {
                display: true,
                content: 'Alerta HTA (140 PAS)',
                position: 'end',
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                color: '#fff',
                font: { size: 9, weight: 'bold' }
              }
            },
            diaNormalLine: {
              type: 'line',
              yMin: 80,
              yMax: 80,
              borderColor: 'rgba(16, 185, 129, 0.45)',
              borderWidth: 1.5,
              borderDash: [5, 5],
              label: {
                display: true,
                content: 'Límite Normal (80 PAD)',
                position: 'start',
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                color: '#fff',
                font: { size: 9, weight: 'bold' }
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', maxTicksLimit: 8, font: { size: 10 } }
        },
        y: {
          min: 40,
          max: 190,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { 
            color: '#64748b', 
            stepSize: 20,
            callback: (val: any) => `${val} mmHg`
          }
        }
      }
    };

    // Pulse Chart
    const pulseChartData = {
      labels,
      datasets: [
        {
          label: 'Frecuencia Cardíaca (Pulso)',
          data: pulseData,
          borderColor: '#10b981', // Emerald 500
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          tension: 0.3,
          fill: true
        }
      ]
    };

    const pulseChartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: { color: '#94a3b8', font: { size: 12 } }
        },
        annotation: {
          annotations: {
            normalHigh: {
              type: 'line',
              yMin: 100,
              yMax: 100,
              borderColor: 'rgba(239, 68, 68, 0.4)',
              borderWidth: 1.5,
              borderDash: [4, 4],
              label: {
                display: true,
                content: 'Taquicardia (>100)',
                position: 'end',
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                color: '#fff',
                font: { size: 9 }
              }
            },
            normalLow: {
              type: 'line',
              yMin: 60,
              yMax: 60,
              borderColor: 'rgba(6, 182, 212, 0.4)',
              borderWidth: 1.5,
              borderDash: [4, 4],
              label: {
                display: true,
                content: 'Bradicardia (<60)',
                position: 'end',
                backgroundColor: 'rgba(6, 182, 212, 0.8)',
                color: '#fff',
                font: { size: 9 }
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', maxTicksLimit: 8, font: { size: 10 } }
        },
        y: {
          min: 40,
          max: 130,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', callback: (val: any) => `${val} lpm` }
        }
      }
    };

    // Distribution breakdown
    const categoryCounts: Record<string, number> = {
      'Normal (<120/80)': 0,
      'Elevada (120-129)': 0,
      'HTA Grado 1 (130-139)': 0,
      'HTA Grado 2 (≥140)': 0,
      'Crisis (>180)': 0,
      'Hipotensión (<90)': 0
    };

    readings.forEach(r => {
      const cat = classifyBloodPressure(r.systolic, r.diastolic);
      if (cat.category === 'normal') categoryCounts['Normal (<120/80)']++;
      else if (cat.category === 'elevated') categoryCounts['Elevada (120-129)']++;
      else if (cat.category === 'stage1') categoryCounts['HTA Grado 1 (130-139)']++;
      else if (cat.category === 'stage2') categoryCounts['HTA Grado 2 (≥140)']++;
      else if (cat.category === 'crisis') categoryCounts['Crisis (>180)']++;
      else if (cat.category === 'hypotension') categoryCounts['Hipotensión (<90)']++;
    });

    const distChartData = {
      labels: Object.keys(categoryCounts),
      datasets: [
        {
          label: 'Cantidad de mediciones',
          data: Object.values(categoryCounts),
          backgroundColor: [
            'rgba(16, 185, 129, 0.75)',  // Normal - green
            'rgba(234, 179, 8, 0.75)',   // Elevated - yellow
            'rgba(249, 115, 22, 0.75)',  // Stage 1 - orange
            'rgba(239, 68, 68, 0.75)',   // Stage 2 - red
            'rgba(220, 38, 38, 0.85)',   // Crisis - dark red
            'rgba(6, 182, 212, 0.75)'    // Hypo - cyan
          ],
          borderColor: [
            '#10b981',
            '#eab308',
            '#f97316',
            '#ef4444',
            '#dc2626',
            '#06b6d4'
          ],
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    };

    const distChartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', stepSize: 1 }
        }
      }
    };

    const filterOptions: { id: FilterRange; label: string }[] = [
      { id: '7d', label: '7 días' },
      { id: '14d', label: '14 días' },
      { id: '30d', label: '30 días' },
      { id: '90d', label: '90 días' },
      { id: 'all', label: 'Todo' }
    ];

    return (
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Evolución y Tendencias
              </h2>
              <p className="text-xs text-slate-400">
                {readings.length} tomas registradas en el período
              </p>
            </div>
          </div>

          {/* Mode Tabs and Range Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setChartMode('pressure')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  chartMode === 'pressure'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Presión</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMode('pulse')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  chartMode === 'pulse'
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Pulso</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMode('distribution')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  chartMode === 'distribution'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Rangos</span>
              </button>
            </div>

            {/* Time Filter Pills */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {filterOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onFilterChange(opt.id)}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                    filterRange === opt.id
                      ? 'bg-slate-800 text-sky-400 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="relative h-72 sm:h-80 w-full">
          {readings.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <Activity className="w-8 h-8 stroke-1 text-slate-600" />
              <p className="text-sm">No hay registros suficientes en este rango de fechas</p>
            </div>
          ) : chartMode === 'pressure' ? (
            <Line ref={chartRef} data={pressureChartData} options={pressureChartOptions} />
          ) : chartMode === 'pulse' ? (
            <Line ref={chartRef} data={pulseChartData} options={pulseChartOptions} />
          ) : (
            <Bar ref={chartRef} data={distChartData} options={distChartOptions} />
          )}
        </div>

        {/* Quick Clinical Thresholds Legend */}
        {chartMode === 'pressure' && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Objetivo Clínico (&lt;120/80)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Límite de Hipertensión (≥140/90)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 italic">
              Guías de consenso AHA / ESC
            </span>
          </div>
        )}
      </div>
    );
  }
);
