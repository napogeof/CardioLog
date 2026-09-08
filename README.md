# ❤️ CardioLog - Monitoreo Clínico de Presión Arterial & Pulso

Aplicación Web Progresiva (PWA) privada, moderna y 100% offline para registrar mediciones de presión arterial y frecuencia cardíaca, visualizar promedios y tendencias en gráficos interactivos, y generar informes médicos en PDF de alta resolución listos para imprimir o compartir con el doctor.

---

## 🚀 Características Principales

- 🩺 **Registro Clínico Rápido**:
  - Presión Sistólica (PAS), Presión Diastólica (PAD) y Pulso (lpm).
  - Selector de momento del día (Mañana / Tarde / Noche / Madrugada), brazo y posición corporal.
  - Etiquetas contextuales (*En reposo*, *Post medicación*, *Estrés*, etc.) y notas médicas.
- ⚡ **Diagnóstico Instantáneo en Vivo**:
  - Clasificación automática bajo las guías clínicas de consenso **AHA / ESC**: Normal, Elevada, HTA Grado 1, HTA Grado 2, Crisis Hipertensiva e Hipotensión.
- 📊 **Gráficos Claros y Tendencias**:
  - Curvas de Sistólica y Diastólica con líneas guía de umbrales médicos (120/80 y 140/90 mmHg).
  - Curva de frecuencia cardíaca (lpm) con zonas de bradicardia/taquicardia.
  - Desglose por rangos y filtros de 7, 14, 30, 90 días o todo el historial.
- 📈 **Métricas y Patrón Circadiano**:
  - Promedios generales, Presión Arterial Media (PAM / MAP) y Presión de Pulso (PP).
  - **Comparativa Matutina vs Vespertina** para control de hipertensión matutina.
  - Detección de tomas pico (más alta y más baja).
- 📄 **Informe Clínico PDF para el Doctor**:
  - Membrete con datos del paciente y medicación actual.
  - Resumen ejecutivo de estadísticas.
  - Gráfico de evolución temporal incrustado en alta fidelidad.
  - Tabla cronológica completa con código de color.
  - Recuadro para observaciones y firma del médico tratante.
- 🔒 **Privacidad Total & Offline**:
  - Los datos nunca salen del dispositivo (almacenamiento local privado).
  - Instalable como PWA en Android, iOS (iPhone/iPad) y PC.
  - Exportación e importación de copias de seguridad en JSON y exportación a Excel (CSV).

---

## 🛠️ Tecnologías

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4**
- **Chart.js + react-chartjs-2 + chartjs-plugin-annotation**
- **jsPDF + jspdf-autotable**
- **Lucide Icons**
- **PWA Service Worker + Web Manifest**

---

## 📦 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (accesible en red local)
npm run dev

# Compilar para producción
npm run build
```
