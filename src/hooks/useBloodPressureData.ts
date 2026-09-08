import { useState, useEffect, useMemo } from 'react';
import type { 
  BloodPressureReading, 
  PatientProfile, 
  FilterRange, 
  BPStatistics, 
  BPCategory,
  AverageSet
} from '../types/bloodPressure';
import { 
  loadReadings, 
  saveReadings, 
  loadPatientProfile, 
  savePatientProfile 
} from '../utils/storage';
import { calculateMAP, calculatePulsePressure, classifyBloodPressure } from '../utils/bpClassifier';
import { DEMO_PATIENT, generateDemoReadings } from '../utils/demoData';

export function useBloodPressureData() {
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile>(DEMO_PATIENT);
  const [filterRange, setFilterRange] = useState<FilterRange>('30d');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load from storage
  useEffect(() => {
    const loadedReadings = loadReadings();
    const loadedProfile = loadPatientProfile();
    setReadings(loadedReadings);
    setPatientProfile(loadedProfile);
    setIsLoaded(true);
  }, []);

  // Sync readings when updated
  const updateAndPersistReadings = (newReadings: BloodPressureReading[]) => {
    setReadings(newReadings);
    saveReadings(newReadings);
  };

  const addReading = (readingData: Omit<BloodPressureReading, 'id'>) => {
    const newReading: BloodPressureReading = {
      ...readingData,
      id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
    const updated = [newReading, ...readings].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    updateAndPersistReadings(updated);
    return newReading;
  };

  const updateReading = (id: string, updatedData: Partial<BloodPressureReading>) => {
    const updated = readings.map(r => r.id === id ? { ...r, ...updatedData } : r).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    updateAndPersistReadings(updated);
  };

  const deleteReading = (id: string) => {
    const updated = readings.filter(r => r.id !== id);
    updateAndPersistReadings(updated);
  };

  const updateProfile = (profile: PatientProfile) => {
    setPatientProfile(profile);
    savePatientProfile(profile);
  };

  const resetToDemoData = () => {
    const demo = generateDemoReadings();
    updateAndPersistReadings(demo);
    setPatientProfile(DEMO_PATIENT);
    savePatientProfile(DEMO_PATIENT);
  };

  const removeDemoReadings = () => {
    const userOnly = readings.filter(r => !r.id.startsWith('demo-'));
    updateAndPersistReadings(userOnly);
  };

  const clearAllData = (clearProfile: boolean = false) => {
    updateAndPersistReadings([]);
    if (clearProfile) {
      const cleanProfile: PatientProfile = {
        name: 'Mi Perfil',
        age: undefined,
        idNumber: undefined,
        doctorName: undefined,
        currentMedication: undefined,
        notes: undefined
      };
      setPatientProfile(cleanProfile);
      savePatientProfile(cleanProfile);
    }
  };

  const importData = (newReadings: BloodPressureReading[], newProfile?: PatientProfile) => {
    updateAndPersistReadings(newReadings);
    if (newProfile) {
      updateProfile(newProfile);
    }
  };

  // Filter readings based on filterRange
  const filteredReadings = useMemo(() => {
    if (filterRange === 'all') return readings;
    
    const now = new Date();
    const daysMap: Record<FilterRange, number> = {
      '7d': 7,
      '14d': 14,
      '30d': 30,
      '90d': 90,
      'all': 999999
    };
    
    const maxDays = daysMap[filterRange] || 30;
    const cutoffTime = now.getTime() - maxDays * 24 * 60 * 60 * 1000;
    
    return readings.filter(r => new Date(r.timestamp).getTime() >= cutoffTime);
  }, [readings, filterRange]);

  // Compute comprehensive statistics
  const statistics = useMemo<BPStatistics>(() => {
    const total = filteredReadings.length;
    const initialCategories: Record<BPCategory, number> = {
      crisis: 0,
      stage2: 0,
      stage1: 0,
      elevated: 0,
      normal: 0,
      hypotension: 0
    };

    if (total === 0) {
      return {
        totalCount: 0,
        avgSystolic: 0,
        avgDiastolic: 0,
        avgPulse: 0,
        avgMAP: 0,
        avgPulsePressure: 0,
        morningAvg: { systolic: 0, diastolic: 0, pulse: 0, count: 0 },
        eveningAvg: { systolic: 0, diastolic: 0, pulse: 0, count: 0 },
        maxReading: null,
        minReading: null,
        categoryDistribution: initialCategories,
        inControlPercent: 0
      };
    }

    let sumSys = 0;
    let sumDia = 0;
    let sumPulse = 0;
    let maxReading: BloodPressureReading = filteredReadings[0];
    let minReading: BloodPressureReading = filteredReadings[0];

    const morningSet: AverageSet = { systolic: 0, diastolic: 0, pulse: 0, count: 0 };
    const eveningSet: AverageSet = { systolic: 0, diastolic: 0, pulse: 0, count: 0 };

    filteredReadings.forEach(r => {
      sumSys += r.systolic;
      sumDia += r.diastolic;
      sumPulse += r.pulse;

      const cat = classifyBloodPressure(r.systolic, r.diastolic);
      initialCategories[cat.category] += 1;

      // Check max/min systolic
      if (r.systolic > maxReading.systolic) {
        maxReading = r;
      }
      if (r.systolic < minReading.systolic) {
        minReading = r;
      }

      // Morning vs Evening
      if (r.timeOfDay === 'morning') {
        morningSet.systolic += r.systolic;
        morningSet.diastolic += r.diastolic;
        morningSet.pulse += r.pulse;
        morningSet.count += 1;
      } else if (r.timeOfDay === 'evening' || r.timeOfDay === 'night') {
        eveningSet.systolic += r.systolic;
        eveningSet.diastolic += r.diastolic;
        eveningSet.pulse += r.pulse;
        eveningSet.count += 1;
      }
    });

    const avgSys = Math.round(sumSys / total);
    const avgDia = Math.round(sumDia / total);
    const avgPulse = Math.round(sumPulse / total);

    const morningAvg: AverageSet = {
      systolic: morningSet.count > 0 ? Math.round(morningSet.systolic / morningSet.count) : 0,
      diastolic: morningSet.count > 0 ? Math.round(morningSet.diastolic / morningSet.count) : 0,
      pulse: morningSet.count > 0 ? Math.round(morningSet.pulse / morningSet.count) : 0,
      count: morningSet.count
    };

    const eveningAvg: AverageSet = {
      systolic: eveningSet.count > 0 ? Math.round(eveningSet.systolic / eveningSet.count) : 0,
      diastolic: eveningSet.count > 0 ? Math.round(eveningSet.diastolic / eveningSet.count) : 0,
      pulse: eveningSet.count > 0 ? Math.round(eveningSet.pulse / eveningSet.count) : 0,
      count: eveningSet.count
    };

    const controlledCount = initialCategories.normal + initialCategories.elevated;
    const inControlPercent = Math.round((controlledCount / total) * 100);

    return {
      totalCount: total,
      avgSystolic: avgSys,
      avgDiastolic: avgDia,
      avgPulse,
      avgMAP: calculateMAP(avgSys, avgDia),
      avgPulsePressure: calculatePulsePressure(avgSys, avgDia),
      morningAvg,
      eveningAvg,
      maxReading,
      minReading,
      categoryDistribution: initialCategories,
      inControlPercent
    };
  }, [filteredReadings]);

  const hasDemoReadings = readings.some(r => r.id.startsWith('demo-'));

  return {
    readings,
    filteredReadings,
    patientProfile,
    filterRange,
    statistics,
    isLoaded,
    hasDemoReadings,
    setFilterRange,
    addReading,
    updateReading,
    deleteReading,
    updateProfile,
    resetToDemoData,
    removeDemoReadings,
    clearAllData,
    importData
  };
}
