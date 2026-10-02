/**
 * Automatic Active Insulin (IOB) Estimator
 * 
 * Clinical Rule:
 * "A insulina ativa que vai para o cálculo é apenas a da insulina de correção.
 *  Só a insulina de correção é considerada insulina ativa. A insulina alimentar não é tida
 *  em consideração porque já é usada para cobrir os hidratos de carbono ingeridos e não
 *  tem potencial para baixar ainda mais a glicemia."
 * 
 * Rules strictly according to specification:
 * 1. Automatically looks up the most recent CORRECTION insulin administration from history (correctionDose > 0).
 * 2. Compares timestamp of the last correction record with the calculation time.
 * 3. Checks if less than 3 hours have passed.
 * 4. Formula:
 *    Insulina Ativa Estimada = Dose de Correção Inicial × (1 − Tempo Decorrido ÷ 3 horas)
 * 5. If elapsed >= 3 hours: Insulina Ativa Estimada = 0 U
 * 6. Minimum = 0 U (never negative).
 * 7. If no previous correction dose:
 *    Insulina Ativa Estimada = 0 U
 */

import { HistoryEntry } from '../types';

export const ACTIVE_INSULIN_CLINICAL_NOTE =
  'Só a insulina de correção é considerada insulina ativa. A insulina alimentar não é tida em consideração porque já é usada para cobrir os hidratos de carbono ingeridos e não tem potencial para baixar ainda mais a glicemia.';

export interface ActiveInsulinCalculation {
  hasPreviousDose: boolean;
  lastDose: number; // Dose Inicial de Correção (X U)
  lastTimeFormatted: string; // HH:mm
  lastDateFormatted: string; // DD/MM/AAAA
  lastMeal?: string;
  lastInsulinName?: string;
  elapsedMinutes: number;
  elapsedHours: number;
  elapsedFormatted: string; // "X h XX min" or "XX min"
  activeInsulin: number; // Raw number
  activeInsulinFormatted: string; // "X,XX U"
  isWithinThreeHours: boolean;
  explanationText: string;
  clinicalNote: string;
  statusMessage?: string;
}

/**
 * Calculates the estimated active insulin from history automatically.
 * Strictly considers ONLY correction insulin (correctionDose > 0).
 * 
 * @param history List of history records
 * @param calculationTime Optional time string "HH:mm" specified for the calculation
 * @param referenceDate Optional Date instance (defaults to new Date())
 */
export function calculateActiveInsulin(
  history: HistoryEntry[],
  calculationTime?: string,
  referenceDate: Date = new Date()
): ActiveInsulinCalculation {
  // 1. Identify records where CORRECTION insulin was administered (correctionDose > 0)
  // Food insulin (carbDose) covers consumed carbohydrates and is NOT considered active for blood glucose lowering.
  const entriesWithCorrection = history
    .filter((entry) => {
      const correction = entry.correctionDose ?? 0;
      return correction > 0;
    })
    .sort((a, b) => {
      const timeA = new Date(a.savedAt || a.timestamp).getTime();
      const timeB = new Date(b.savedAt || b.timestamp).getTime();
      return timeB - timeA;
    });

  // 2. If no prior correction insulin administration exists in history
  if (entriesWithCorrection.length === 0) {
    return {
      hasPreviousDose: false,
      lastDose: 0,
      lastTimeFormatted: '--:--',
      lastDateFormatted: '--/--/----',
      elapsedMinutes: 0,
      elapsedHours: 0,
      elapsedFormatted: '0 min',
      activeInsulin: 0,
      activeInsulinFormatted: '0,00 U',
      isWithinThreeHours: false,
      explanationText: 'Não existe um registo anterior de insulina de correção para calcular a insulina ativa.',
      clinicalNote: ACTIVE_INSULIN_CLINICAL_NOTE,
      statusMessage: 'Sem insulina de correção prévia ativa.',
    };
  }

  const lastEntry = entriesWithCorrection[0];
  // Strictly the correction dose
  const initialDose = Math.max(0, lastEntry.correctionDose || 0);

  // 3. Resolve the exact moment of the last administration
  let lastMoment: Date;
  if (lastEntry.savedAt || lastEntry.timestamp) {
    lastMoment = new Date(lastEntry.savedAt || lastEntry.timestamp);
  } else {
    // Fallback parsing formattedDate (DD/MM/YYYY) and formattedTime (HH:mm)
    const [d, m, y] = (lastEntry.formattedDate || '').split('/').map(Number);
    const [hh, mm] = (lastEntry.formattedTime || '00:00').split(':').map(Number);
    lastMoment = new Date(y || 2026, (m || 1) - 1, d || 1, hh, mm, 0);
  }

  // 4. Resolve calculation moment
  const calcMoment = new Date(referenceDate);
  if (calculationTime) {
    const [ch, cm] = calculationTime.split(':').map(Number);
    if (!isNaN(ch) && !isNaN(cm)) {
      calcMoment.setHours(ch, cm, 0, 0);
    }
  }

  // 5. Calculate elapsed time in minutes and hours
  const diffMs = calcMoment.getTime() - lastMoment.getTime();
  const rawElapsedMinutes = diffMs / (1000 * 60);

  // If time was set in the past relative to the dose (e.g. negative), clamp to 0
  const elapsedMinutes = Math.max(0, rawElapsedMinutes);
  const elapsedHours = elapsedMinutes / 60;

  // 6. Format elapsed time: "X h XX min" or "XX min"
  const hoursPart = Math.floor(elapsedMinutes / 60);
  const minutesPart = Math.round(elapsedMinutes % 60);
  let elapsedFormatted = '';
  if (hoursPart >= 1) {
    elapsedFormatted = `${hoursPart} h ${String(minutesPart).padStart(2, '0')} min`;
  } else {
    elapsedFormatted = `${minutesPart} min`;
  }

  // 7. Apply 3-hour rule
  // Insulina Ativa Estimada = Dose de Correção Inicial × (1 − Tempo Decorrido ÷ 3 horas)
  let activeInsulin = 0;
  const isWithinThreeHours = elapsedHours < 3;

  if (isWithinThreeHours) {
    const remainingFraction = 1 - elapsedHours / 3;
    activeInsulin = initialDose * remainingFraction;
    // Bound minimum at 0 U and avoid floating point inaccuracies
    activeInsulin = Math.max(0, Number(activeInsulin.toFixed(2)));
  } else {
    activeInsulin = 0;
  }

  const activeInsulinFormatted = `${String(activeInsulin.toFixed(2)).replace('.', ',')} U`;

  const explanationText = isWithinThreeHours
    ? `Dose de Correção (${initialDose} U) × (1 - ${elapsedHours.toFixed(2)} h ÷ 3 h) = ${activeInsulinFormatted}`
    : `Passaram mais de 3 horas (${elapsedFormatted}) desde a última correção → 0,00 U de insulina ativa.`;

  return {
    hasPreviousDose: true,
    lastDose: initialDose,
    lastTimeFormatted: lastEntry.formattedTime,
    lastDateFormatted: lastEntry.formattedDate,
    lastMeal: lastEntry.meal,
    lastInsulinName: lastEntry.appliedInsulinName,
    elapsedMinutes: Math.round(elapsedMinutes),
    elapsedHours: Number(elapsedHours.toFixed(2)),
    elapsedFormatted,
    activeInsulin,
    activeInsulinFormatted,
    isWithinThreeHours,
    explanationText,
    clinicalNote: ACTIVE_INSULIN_CLINICAL_NOTE,
  };
}
