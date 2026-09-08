import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BloodPressureReading, PatientProfile, BPStatistics } from '../types/bloodPressure';
import { 
  classifyBloodPressure, 
  calculateMAP, 
  formatDateTime, 
  getTimeOfDayLabel 
} from './bpClassifier';

interface GeneratePdfOptions {
  readings: BloodPressureReading[];
  patientProfile: PatientProfile;
  statistics: BPStatistics;
  chartCanvas?: HTMLCanvasElement | null;
  periodLabel: string;
}

export async function generateDoctorReportPdf({
  readings,
  patientProfile,
  statistics,
  chartCanvas,
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
  // Barra superior azul médico
  doc.setFillColor(2, 132, 199); // Sky-600
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text('INFORME CLÍNICO DE PRESIÓN ARTERIAL', margin, currentY + 4);

  // Subtítulo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('CardioLog • Monitoreo Ambulatorio y Frecuencia Cardíaca', margin, currentY + 9);

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
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(203, 213, 225); // Slate-300
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
  // Split medication if long
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

  // Tarjeta 1: Promedio Presión
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

  // Tarjeta 2: Promedio Pulso
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

  // Tarjeta 3: Presión Media (PAM)
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

  // Tarjeta 4: En Rango / Control
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
  doc.text(`Vespertino/Noche: ${eveningStr}`, margin + 112, currentY + 5);

  // Picos
  const maxStr = statistics.maxReading 
    ? `${statistics.maxReading.systolic}/${statistics.maxReading.diastolic} mmHg (${formatDateTime(statistics.maxReading.timestamp)})`
    : 'N/D';
  const minStr = statistics.minReading 
    ? `${statistics.minReading.systolic}/${statistics.minReading.diastolic} mmHg (${formatDateTime(statistics.minReading.timestamp)})`
    : 'N/D';
  doc.text(`Registro Más Alto: ${maxStr}  •  Registro Más Bajo: ${minStr}`, margin + 3, currentY + 9.5);

  currentY += 16;

  // --- GRÁFICO INCRUSTADO (Si está disponible) ---
  if (chartCanvas) {
    try {
      const chartImgData = chartCanvas.toDataURL('image/png', 1.0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('EVOLUCIÓN TEMPORAL Y TENDENCIAS', margin, currentY);
      currentY += 3;

      const chartW = pageWidth - (margin * 2);
      const chartH = 50;
      doc.addImage(chartImgData, 'PNG', margin, currentY, chartW, chartH);
      currentY += chartH + 6;
    } catch (e) {
      console.warn('No se pudo añadir la imagen del gráfico al PDF:', e);
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
    margin: { left: margin, right: margin, bottom: 20 },
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
      // Pintar sutilmente la celda de clasificación
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
        const boxY = Math.max(finalY + 4, pageHeight - 34);
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, boxY, pageWidth - (margin * 2), 18, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('NOTAS Y RECOMENDACIONES DEL MÉDICO:', margin + 3, boxY + 4.5);

        doc.text('Firma y Sello Profesional: _______________________________', pageWidth - margin - 85, boxY + 14);
      }
    }

    // Pie de página fijo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(
      'Aviso: Este informe es un registro de automonitoreo para soporte en la toma de decisiones clínicas y no reemplaza el diagnóstico presencial.',
      margin,
      pageHeight - 6
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
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
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(title, x + (w / 2), y + 4, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199); // Sky-600
  doc.text(value, x + (w / 2), y + 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text(unit, x + (w / 2), y + 14, { align: 'center' });
}
