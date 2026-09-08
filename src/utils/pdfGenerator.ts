import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BloodPressureReading, PatientProfile, BPStatistics } from '../types/bloodPressure';
import { 
  classifyBloodPressure, 
  calculateMAP, 
  formatDateTime, 
  formatDate,
  formatTime,
  getTimeOfDayLabel 
} from './bpClassifier';

interface GeneratePdfOptions {
  readings: BloodPressureReading[];
  patientProfile: PatientProfile;
  statistics: BPStatistics;
  chartCanvas?: HTMLCanvasElement | null;
  periodLabel: string;
}

/**
 * Genera un lienzo (canvas) clínico de alta resolución optimizado para impresión
 * Dibuja las curvas de Sistólica, Diastólica, Pulso y las líneas guía clínicas AHA/ESC
 */
function createClinicalChartCanvas(readings: BloodPressureReading[]): HTMLCanvasElement | null {
  if (readings.length === 0) return null;

  // Ordenar cronológicamente (más antiguo al más reciente)
  const data = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Fondo blanco nítido
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bordes del área de trazado
  const padLeft = 130;
  const padRight = 60;
  const padTop = 90;
  const padBottom = 80;
  const plotW = canvas.width - padLeft - padRight;
  const plotH = canvas.height - padTop - padBottom;

  // Rango del eje Y (mmHg)
  const maxSys = Math.max(...data.map(d => d.systolic), 150);
  const minDia = Math.min(...data.map(d => d.diastolic), 60);
  const yMax = Math.max(190, Math.ceil((maxSys + 15) / 20) * 20);
  const yMin = Math.min(40, Math.floor((minDia - 15) / 20) * 20);

  const getY = (val: number) => {
    return padTop + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
  };

  const getX = (index: number) => {
    if (data.length === 1) return padLeft + plotW / 2;
    return padLeft + (index / (data.length - 1)) * plotW;
  };

  // --- 1. LEYENDA CLÍNICA SUPERIOR ---
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  let legX = padLeft;
  const legY = 48;

  // Sistólica (PAS)
  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.arc(legX + 8, legY - 6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Sistólica (PAS)', legX + 24, legY);
  legX += 200;

  // Diastólica (PAD)
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(legX + 8, legY - 6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Diastólica (PAD)', legX + 24, legY);
  legX += 210;

  // Pulso (lpm)
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(legX + 8, legY - 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Pulso (lpm)', legX + 24, legY);
  legX += 180;

  // Línea 140
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(legX, legY - 6);
  ctx.lineTo(legX + 30, legY - 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#b91c1c';
  ctx.font = '17px -apple-system, sans-serif';
  ctx.fillText('Límite HTA (140)', legX + 38, legY);
  legX += 200;

  // Línea 120 / 80
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(legX, legY - 6);
  ctx.lineTo(legX + 30, legY - 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#047857';
  ctx.fillText('Normal (120 / 80)', legX + 38, legY);

  // --- 2. LÍNEAS DE CUADRÍCULA Y EJE Y ---
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.font = '17px -apple-system, sans-serif';
  ctx.textAlign = 'right';

  for (let val = yMin; val <= yMax; val += 20) {
    const y = getY(val);

    // Línea de cuadrícula
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + plotW, y);
    ctx.stroke();

    // Etiqueta de mmHg
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${val} mmHg`, padLeft - 14, y + 5);
  }

  // --- 3. LÍNEAS GUÍA DE REFERENCIA CLÍNICA (140, 120, 80) ---
  const drawThreshold = (val: number, color: string, bgColor: string, textColor: string, label: string) => {
    if (val < yMin || val > yMax) return;
    const y = getY(val);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + plotW, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Etiqueta tipo badge
    ctx.font = 'bold 15px -apple-system, sans-serif';
    const textW = ctx.measureText(label).width;
    const badgeW = textW + 16;
    const badgeH = 24;
    const badgeX = padLeft + plotW - badgeW - 10;
    const badgeY = y - 12;

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(label, badgeX + 8, badgeY + 17);
  };

  drawThreshold(140, '#ef4444', '#fef2f2', '#dc2626', '140 mmHg - Límite Hipertensión');
  drawThreshold(120, '#10b981', '#ecfdf5', '#059669', '120 mmHg - Normal Sistólica');
  drawThreshold(80, '#0ea5e9', '#f0f9ff', '#0284c7', '80 mmHg - Normal Diastólica');

  // --- 4. ÁREA SOMBREADA ENTRE SISTÓLICA Y DIASTÓLICA ---
  if (data.length > 1) {
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.systolic);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    for (let i = data.length - 1; i >= 0; i--) {
      const x = getX(i);
      const y = getY(data[i].diastolic);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(2, 132, 199, 0.07)';
    ctx.fill();
  }

  // --- 5. CURVA DE PULSO (FRECUENCIA CARDÍACA) ---
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.pulse);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Puntos de pulso
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.pulse);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- 6. CURVA DIASTÓLICA (PAD) ---
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 4;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.diastolic);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Puntos diastólicos
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.diastolic);

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Valores debajo del punto (si hay 16 o menos tomas)
    if (data.length <= 16) {
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${d.diastolic}`, x, y + 23);
    }
  });

  // --- 7. CURVA SISTÓLICA (PAS) ---
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 4;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.systolic);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Puntos sistólicos
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.systolic);
    const cat = classifyBloodPressure(d.systolic, d.diastolic);

    ctx.fillStyle = cat.color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Valores arriba del punto (si hay 16 o menos tomas)
    if (data.length <= 16) {
      ctx.fillStyle = '#9f1239';
      ctx.font = 'bold 17px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${d.systolic}`, x, y - 14);
    }
  });

  // --- 8. EJE X Y FECHAS / HORAS ---
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop + plotH);
  ctx.lineTo(padLeft + plotW, padTop + plotH);
  ctx.stroke();

  // Marcas de tiempo en el eje X
  const step = Math.max(1, Math.ceil(data.length / 10));
  ctx.textAlign = 'center';
  ctx.font = '15px -apple-system, sans-serif';

  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      const x = getX(i);
      const y = padTop + plotH + 22;

      // Pequeño tick vertical
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, padTop + plotH);
      ctx.lineTo(x, padTop + plotH + 6);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.fillText(formatDate(d.timestamp), x, y);
      ctx.fillStyle = '#64748b';
      ctx.font = '13.5px -apple-system, sans-serif';
      ctx.fillText(formatTime(d.timestamp), x, y + 18);
      ctx.font = '15px -apple-system, sans-serif';
    }
  });

  return canvas;
}

export async function generateDoctorReportPdf({
  readings,
  patientProfile,
  statistics,
  periodLabel
}: GeneratePdfOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // --- HEADER DECORATIVO Y MÉDICO ---
  doc.setFillColor(2, 132, 199); // Sky-600
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('INFORME CLÍNICO DE PRESIÓN ARTERIAL', margin, currentY + 4);

  // Subtítulo con autoría
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('CardioLog • Desarrollado por Daniel Arráiz • Monitoreo Clínico Ambulatorio', margin, currentY + 9);

  // Fecha de emisión
  const now = new Date();
  const fechaEmision = now.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha de emisión: ${fechaEmision}`, pageWidth - margin, currentY + 4, { align: 'right' });
  doc.text(`Período evaluado: ${periodLabel}`, pageWidth - margin, currentY + 9, { align: 'right' });

  currentY += 15;

  // Línea divisoria
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // --- CUADRO DE INFORMACIÓN DEL PACIENTE ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('DATOS DEL PACIENTE', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  // Columna 1
  doc.text(`Paciente: `, margin + 4, currentY + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${patientProfile.name || 'Sin especificar'}`, margin + 20, currentY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Edad: `, margin + 4, currentY + 17);
  doc.text(`${patientProfile.age ? `${patientProfile.age} años` : 'N/D'}`, margin + 14, currentY + 17);

  doc.text(`Identificación / DNI: `, margin + 4, currentY + 22.5);
  doc.text(`${patientProfile.idNumber || 'N/D'}`, margin + 35, currentY + 22.5);

  // Columna 2
  const col2X = margin + 85;
  doc.text(`Médico tratante: `, col2X, currentY + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${patientProfile.doctorName || 'No indicado'}`, col2X + 26, currentY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Medicación actual: `, col2X, currentY + 17);
  const medText = patientProfile.currentMedication || 'Sin medicación registrada';
  const medLines = doc.splitTextToSize(medText, pageWidth - margin - col2X - 30);
  doc.text(medLines, col2X + 28, currentY + 17);

  currentY += 31;

  // --- RESUMEN ESTADÍSTICO PARA EL DOCTOR ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMEN CLÍNICO Y PROMEDIOS', margin, currentY);
  currentY += 3;

  // Tarjetas métricas
  const cardWidth = (pageWidth - (margin * 2) - 9) / 4;
  const cardHeight = 16;

  drawStatBox(
    doc,
    margin,
    currentY,
    cardWidth,
    cardHeight,
    'PROMEDIO GLOBAL',
    `${statistics.avgSystolic} / ${statistics.avgDiastolic}`,
    'mmHg'
  );

  drawStatBox(
    doc,
    margin + cardWidth + 3,
    currentY,
    cardWidth,
    cardHeight,
    'PULSO MEDIO',
    `${statistics.avgPulse}`,
    'lpm'
  );

  drawStatBox(
    doc,
    margin + (cardWidth * 2) + 6,
    currentY,
    cardWidth,
    cardHeight,
    'P.A. MEDIA (PAM)',
    `${statistics.avgMAP}`,
    'mmHg'
  );

  drawStatBox(
    doc,
    margin + (cardWidth * 3) + 9,
    currentY,
    cardWidth,
    cardHeight,
    'EN CONTROL',
    `${statistics.inControlPercent}%`,
    `${statistics.totalCount} tomas`
  );

  currentY += cardHeight + 4;

  // Sub-bloque: Desglose Matutino vs Vespertino y Extremos
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 12, 1.5, 1.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Comparativa Horaria:', margin + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const morningStr = statistics.morningAvg.count > 0 
    ? `${statistics.morningAvg.systolic}/${statistics.morningAvg.diastolic} mmHg (${statistics.morningAvg.pulse} lpm, ${statistics.morningAvg.count} tomas)`
    : 'Sin datos';
  doc.text(`Matutino: ${morningStr}`, margin + 36, currentY + 5);

  const eveningStr = statistics.eveningAvg.count > 0 
    ? `${statistics.eveningAvg.systolic}/${statistics.eveningAvg.diastolic} mmHg (${statistics.eveningAvg.pulse} lpm, ${statistics.eveningAvg.count} tomas)`
    : 'Sin datos';
  doc.text(`Tarde/Noche: ${eveningStr}`, margin + 112, currentY + 5);

  // Picos
  const maxStr = statistics.maxReading 
    ? `${statistics.maxReading.systolic}/${statistics.maxReading.diastolic} mmHg (${formatDateTime(statistics.maxReading.timestamp)})`
    : 'N/D';
  const minStr = statistics.minReading 
    ? `${statistics.minReading.systolic}/${statistics.minReading.diastolic} mmHg (${formatDateTime(statistics.minReading.timestamp)})`
    : 'N/D';
  doc.text(`Registro Más Alto: ${maxStr}  •  Registro Más Bajo: ${minStr}`, margin + 3, currentY + 9.5);

  currentY += 16;

  // --- GRÁFICO CLÍNICO DE ALTA RESOLUCIÓN PARA EL INFORME ---
  const printChartCanvas = createClinicalChartCanvas(readings);
  if (printChartCanvas) {
    try {
      const chartImgData = printChartCanvas.toDataURL('image/png', 1.0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('EVOLUCIÓN TEMPORAL Y TENDENCIAS CLÍNICAS', margin, currentY);
      currentY += 3;

      const chartW = pageWidth - (margin * 2);
      // Mantener proporción matemática exacta del lienzo (1600x640)
      const chartH = (chartW / printChartCanvas.width) * printChartCanvas.height;
      doc.addImage(chartImgData, 'PNG', margin, currentY, chartW, chartH);
      currentY += chartH + 5;
    } catch (e) {
      console.warn('Error al estampar gráfico en PDF:', e);
    }
  }

  // --- TABLA DETALLADA DE REGISTROS (jspdf-autotable) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('REGISTRO CRONOLÓGICO DE TOMAS', margin, currentY);
  currentY += 2;

  const tableHeaders = [
    'Fecha / Hora',
    'Momento',
    'PAS',
    'PAD',
    'Pulso',
    'PAM',
    'Clasificación AHA/ESC',
    'Brazo',
    'Notas / Medicación'
  ];

  const tableData = readings.map(r => {
    const cat = classifyBloodPressure(r.systolic, r.diastolic);
    const map = calculateMAP(r.systolic, r.diastolic);
    const notesStr = [
      r.tags.length > 0 ? `[${r.tags.join(', ')}]` : '',
      r.notes || ''
    ].filter(Boolean).join(' ');

    return [
      formatDateTime(r.timestamp),
      getTimeOfDayLabel(r.timeOfDay),
      `${r.systolic}`,
      `${r.diastolic}`,
      `${r.pulse}`,
      `${map}`,
      cat.shortLabel,
      r.arm === 'left' ? 'Izq.' : 'Der.',
      notesStr || '-'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableData,
    margin: { left: margin, right: margin, bottom: 22 },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.6,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 26, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 'auto' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const text = String(data.cell.raw);
        if (text.includes('Crisis')) {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('Grado 2')) {
          data.cell.styles.fillColor = [254, 202, 202];
          data.cell.styles.textColor = [185, 28, 28];
        } else if (text.includes('Grado 1')) {
          data.cell.styles.fillColor = [255, 237, 213];
          data.cell.styles.textColor = [194, 65, 12];
        } else if (text.includes('Elevada')) {
          data.cell.styles.fillColor = [254, 249, 195];
          data.cell.styles.textColor = [161, 98, 7];
        } else if (text.includes('Normal')) {
          data.cell.styles.fillColor = [209, 250, 229];
          data.cell.styles.textColor = [4, 120, 87];
        } else if (text.includes('Baja')) {
          data.cell.styles.fillColor = [207, 250, 254];
          data.cell.styles.textColor = [14, 116, 144];
        }
      }
    }
  });

  // --- PIE DE PÁGINA Y AVISO CLÍNICO EN CADA PÁGINA ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Si es la última página, añadir caja de notas médicas y firma
    if (i === totalPages) {
      const finalY = (doc as any).lastAutoTable?.finalY || (pageHeight - 45);
      if (finalY < pageHeight - 35) {
        const boxY = Math.max(finalY + 4, pageHeight - 32);
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, boxY, pageWidth - (margin * 2), 17, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('NOTAS Y RECOMENDACIONES DEL MÉDICO:', margin + 3, boxY + 4.5);

        doc.text('Firma y Sello Profesional: _______________________________', pageWidth - margin - 85, boxY + 13);
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'CardioLog (por Daniel Arráiz) • Registro de automonitoreo para soporte en la toma de decisiones clínicas y no reemplaza el diagnóstico presencial.',
      margin,
      pageHeight - 5
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 5,
      { align: 'right' }
    );
  }

  // Guardar / Descargar PDF
  const sanitizedName = (patientProfile.name || 'Paciente').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = now.toISOString().slice(0, 10);
  doc.save(`CardioLog_Reporte_${sanitizedName}_${dateStr}.pdf`);
}

function drawStatBox(
  doc: jsPDF, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  title: string, 
  value: string, 
  unit: string
) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(title, x + (w / 2), y + 4, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text(value, x + (w / 2), y + 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text(unit, x + (w / 2), y + 14, { align: 'center' });
}
