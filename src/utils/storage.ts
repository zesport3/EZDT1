/**
 * Local Storage and Data Persistence
 * 
 * Strict Privacy: Health and personal data remain stored solely in the user's browser localStorage.
 * No telemetry, no remote transmission. Includes export and import capabilities.
 * Audited for OWASP Top 10, prototype pollution protection, and strict schema validation.
 */

import { DiabetesType, HistoryEntry, InsulinIncrement, InsulinSettings, MealType, UserProfile } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'ezdt1_user_profile',
  SETTINGS: 'ezdt1_settings',
  HISTORY: 'ezdt1_history',
};

const LEGACY_STORAGE_KEYS = {
  PROFILE: 'insucalc_user_profile',
  SETTINGS: 'insucalc_settings',
  HISTORY: 'insucalc_history',
};

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  diabetesType: 'Tipo 1',
  diagnosedYearOrDate: '',
  doctorName: '',
  hospitalClinic: '',
  emergencyContact: '',
  additionalNotes: '',
};

// Generate 24 hour defaults helper
export const defaultHourlyMap = (val: number): Record<number, number> => {
  const map: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    map[i] = val;
  }
  return map;
};

export const DEFAULT_SETTINGS: InsulinSettings = {
  insulinName: 'Humalog / NovoRapid',
  increment: 0.5,
  glucoseUnit: 'mg/dL',
  
  // FSE / Fator de Correção
  fseMode: 'all_day',
  singleCorrectionFactor: 40,
  hourlyCorrectionFactor: defaultHourlyMap(40),

  // Rácio de Hidratos / Insulina
  ratioMode: 'all_day',
  singleCarbRatio: 15,
  hourlyCarbRatio: defaultHourlyMap(15),

  // Alvo de glicemia
  singleMinTarget: 70,
  singleMaxTarget: 180,
  correctionMethod: 'above_max',
};

/**
 * Sanitizes input string to prevent script injection or extreme length payloads
 */
function sanitizeString(val: unknown, maxLength = 300): string {
  if (typeof val !== 'string') return '';
  // Truncate to safe length and remove dangerous control chars
  return val.slice(0, maxLength).replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
}

/**
 * Sanitizes numeric values within expected ranges
 */
function sanitizeNumber(val: unknown, min: number, max: number, defaultVal: number): number {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return defaultVal;
  }
  return Math.min(Math.max(val, min), max);
}

/**
 * Validates a profile object
 */
function sanitizeProfile(raw: unknown): UserProfile {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_PROFILE;
  }
  const obj = raw as Record<string, unknown>;
  const validTypes: DiabetesType[] = ['Tipo 1', 'Tipo 2', 'LADA', 'MODY', 'Gestacional', 'Outro'];
  const diabetesType = validTypes.includes(obj.diabetesType as DiabetesType)
    ? (obj.diabetesType as DiabetesType)
    : 'Tipo 1';

  return {
    name: sanitizeString(obj.name, 100),
    diabetesType,
    diagnosedYearOrDate: sanitizeString(obj.diagnosedYearOrDate, 50),
    doctorName: sanitizeString(obj.doctorName, 100),
    hospitalClinic: sanitizeString(obj.hospitalClinic, 100),
    emergencyContact: sanitizeString(obj.emergencyContact, 100),
    additionalNotes: sanitizeString(obj.additionalNotes, 1000),
  };
}

/**
 * Validates hourly map
 */
function sanitizeHourlyMap(raw: unknown, defaultVal: number, min: number, max: number): Record<number, number> {
  const result: Record<number, number> = {};
  const isObj = raw && typeof raw === 'object' && !Array.isArray(raw);
  for (let i = 0; i < 24; i++) {
    if (isObj && i in (raw as Record<number, unknown>)) {
      result[i] = sanitizeNumber((raw as Record<number, unknown>)[i], min, max, defaultVal);
    } else {
      result[i] = defaultVal;
    }
  }
  return result;
}

/**
 * Validates settings object
 */
function sanitizeSettings(raw: unknown): InsulinSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_SETTINGS;
  }
  const obj = raw as Record<string, unknown>;
  const validIncrements: InsulinIncrement[] = [0.1, 0.5, 1.0];
  const increment = validIncrements.includes(obj.increment as InsulinIncrement)
    ? (obj.increment as InsulinIncrement)
    : 0.5;

  const fseMode = obj.fseMode === 'hourly' ? 'hourly' : 'all_day';
  const ratioMode = obj.ratioMode === 'hourly' ? 'hourly' : 'all_day';

  const singleCorrectionFactor = obj.singleCorrectionFactor !== null && obj.singleCorrectionFactor !== undefined
    ? sanitizeNumber(obj.singleCorrectionFactor, 1, 500, 40)
    : null;

  const singleCarbRatio = obj.singleCarbRatio !== null && obj.singleCarbRatio !== undefined
    ? sanitizeNumber(obj.singleCarbRatio, 0.5, 200, 15)
    : null;

  const singleMinTarget = obj.singleMinTarget !== null && obj.singleMinTarget !== undefined
    ? sanitizeNumber(obj.singleMinTarget, 40, 300, 70)
    : null;

  const singleMaxTarget = obj.singleMaxTarget !== null && obj.singleMaxTarget !== undefined
    ? sanitizeNumber(obj.singleMaxTarget, 50, 400, 180)
    : null;

  return {
    insulinName: sanitizeString(obj.insulinName, 60) || 'Insulina Rápida',
    increment,
    glucoseUnit: 'mg/dL',
    fseMode,
    singleCorrectionFactor,
    hourlyCorrectionFactor: sanitizeHourlyMap(obj.hourlyCorrectionFactor, singleCorrectionFactor ?? 40, 1, 500),
    ratioMode,
    singleCarbRatio,
    hourlyCarbRatio: sanitizeHourlyMap(obj.hourlyCarbRatio, singleCarbRatio ?? 15, 0.5, 200),
    singleMinTarget,
    singleMaxTarget,
    correctionMethod: 'above_max',
  };
}

/**
 * Validates history entry
 */
function sanitizeHistoryEntry(raw: unknown): HistoryEntry | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const validMeals: MealType[] = [
    'Pequeno-almoço',
    'Almoço',
    'Lanche',
    'Jantar',
    'Ceia / Noite',
    'Correção sem refeição',
    'Outra',
  ];
  const meal = validMeals.includes(obj.meal as MealType) ? (obj.meal as MealType) : 'Outra';

  const id = sanitizeString(obj.id, 50) || String(Date.now());
  const currentGlucose = sanitizeNumber(obj.currentGlucose, 20, 800, 120);
  const carbs = sanitizeNumber(obj.carbs, 0, 500, 0);
  const carbDose = sanitizeNumber(obj.carbDose, 0, 100, 0);
  const correctionDose = sanitizeNumber(obj.correctionDose, -50, 100, 0);
  const totalRawDose = sanitizeNumber(obj.totalRawDose, 0, 150, 0);
  const finalRoundedDose = sanitizeNumber(obj.finalRoundedDose, 0, 150, 0);

  const exp = (obj.explanation && typeof obj.explanation === 'object')
    ? (obj.explanation as Record<string, unknown>)
    : {};

  const correctionTypeRaw = String(exp.correctionType || '');
  const correctionType: 'high' | 'in_target' | 'low' =
    correctionTypeRaw === 'high' || correctionTypeRaw === 'low' ? correctionTypeRaw : 'in_target';

  return {
    id,
    timestamp: sanitizeString(obj.timestamp, 40) || new Date().toISOString(),
    formattedDate: sanitizeString(obj.formattedDate, 50),
    formattedTime: sanitizeString(obj.formattedTime, 10) || '12:00',
    meal,
    currentGlucose,
    carbs,
    carbDose,
    correctionDose,
    totalRawDose,
    finalRoundedDose,
    appliedCarbRatio: sanitizeNumber(obj.appliedCarbRatio, 0.5, 200, 15),
    appliedCorrectionFactor: sanitizeNumber(obj.appliedCorrectionFactor, 1, 500, 40),
    appliedMinTarget: sanitizeNumber(obj.appliedMinTarget, 40, 300, 70),
    appliedMaxTarget: sanitizeNumber(obj.appliedMaxTarget, 50, 400, 180),
    appliedIncrement: [0.1, 0.5, 1.0].includes(obj.appliedIncrement as InsulinIncrement)
      ? (obj.appliedIncrement as InsulinIncrement)
      : 0.5,
    appliedInsulinName: sanitizeString(obj.appliedInsulinName, 60) || 'Insulina',
    explanation: {
      carbInsulinRaw: sanitizeNumber(exp.carbInsulinRaw, 0, 100, carbDose),
      carbInsulinRounded: sanitizeNumber(exp.carbInsulinRounded, 0, 100, carbDose),
      carbCalculationText: sanitizeString(exp.carbCalculationText, 200),
      correctionNeeded: Boolean(exp.correctionNeeded ?? (correctionDose > 0)),
      correctionType,
      glucoseDiff: sanitizeNumber(exp.glucoseDiff, -300, 500, 0),
      correctionInsulinRaw: sanitizeNumber(exp.correctionInsulinRaw, -50, 100, correctionDose),
      correctionInsulinRounded: sanitizeNumber(exp.correctionInsulinRounded, -50, 100, correctionDose),
      correctionCalculationText: sanitizeString(exp.correctionCalculationText, 200),
      totalRaw: sanitizeNumber(exp.totalRaw, 0, 150, totalRawDose),
      finalDose: sanitizeNumber(exp.finalDose, 0, 150, finalRoundedDose),
      incrementApplied: sanitizeNumber(exp.incrementApplied, 0.1, 1.0, 0.5),
      roundingExplanation: sanitizeString(exp.roundingExplanation, 200),
    },
    savedAt: sanitizeString(obj.savedAt, 40) || new Date().toISOString(),
  };
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE) || localStorage.getItem(LEGACY_STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return sanitizeProfile(JSON.parse(raw));
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    const sanitized = sanitizeProfile(profile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(sanitized));
  } catch {
    // Graceful silent fallback if localStorage quota exceeded
  }
}

export function loadInsulinSettings(): InsulinSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem(LEGACY_STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveInsulinSettings(settings: InsulinSettings): void {
  try {
    const sanitized = sanitizeSettings(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(sanitized));
  } catch {
    // Graceful silent fallback
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY) || localStorage.getItem(LEGACY_STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map(sanitizeHistoryEntry)
        .filter((entry): entry is HistoryEntry => entry !== null)
        .slice(0, 300);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveHistory(history: HistoryEntry[]): void {
  try {
    const sanitized = history
      .map(sanitizeHistoryEntry)
      .filter((entry): entry is HistoryEntry => entry !== null)
      .slice(0, 300);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sanitized));
  } catch {
    // Graceful silent fallback
  }
}

export function addHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const current = loadHistory();
  const sanitized = sanitizeHistoryEntry(entry);
  if (!sanitized) return current;
  const updated = [sanitized, ...current].slice(0, 300);
  saveHistory(updated);
  return updated;
}

export function deleteHistoryEntry(id: string): HistoryEntry[] {
  const current = loadHistory();
  const updated = current.filter((item) => item.id !== id);
  saveHistory(updated);
  return updated;
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch {
    // Graceful silent fallback
  }
}

export function exportAllDataAsJSON(): string {
  const data = {
    app: 'EZDT1',
    exportedAt: new Date().toISOString(),
    profile: loadUserProfile(),
    settings: loadInsulinSettings(),
    history: loadHistory(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Safe JSON import with prototype pollution defense and schema verification
 */
export function importAllDataFromJSON(jsonString: string): { success: boolean; error?: string } {
  try {
    // Limit payload size to avoid memory exhaustion
    if (jsonString.length > 2 * 1024 * 1024) {
      return { success: false, error: 'Ficheiro demasiado grande (limite de 2MB).' };
    }

    // Prototype pollution prevention: check for __proto__ and constructor in raw text
    if (/("__proto__"|"constructor"|"prototype")\s*:/i.test(jsonString)) {
      return { success: false, error: 'Ficheiro rejeitado: estrutura inválida detectada.' };
    }

    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { success: false, error: 'Ficheiro JSON com formato inválido.' };
    }

    if (data.profile) {
      saveUserProfile(sanitizeProfile(data.profile));
    }
    if (data.settings) {
      saveInsulinSettings(sanitizeSettings(data.settings));
    }
    if (Array.isArray(data.history)) {
      const sanitizedHistory = data.history
        .map(sanitizeHistoryEntry)
        .filter((e: unknown): e is HistoryEntry => e !== null)
        .slice(0, 300);
      saveHistory(sanitizedHistory);
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Ficheiro corrompido ou formato JSON inválido.' };
  }
}

export function exportHistoryAsCSV(history: HistoryEntry[]): string {
  const headers = [
    'ID',
    'Data',
    'Hora',
    'Refeicao',
    'Glicemia_mg_dL',
    'Hidratos_g',
    'Racio_g_U',
    'Fator_Correcao',
    'Alvo_Min',
    'Alvo_Max',
    'Dose_Hidratos_U',
    'Dose_Correcao_U',
    'Dose_Total_Calculada_U',
    'Insulina',
    'Incremento_U',
  ];

  const escapeCSV = (str: unknown) => {
    const s = String(str ?? '').replace(/"/g, '""');
    // Prevent CSV formula injection: prefix with single quote if starts with =, +, -, @, \t, \r
    if (/^[=+\-@\t\r]/.test(s)) {
      return `"'${s}"`;
    }
    return `"${s}"`;
  };

  const rows = history.map((item) => [
    escapeCSV(item.id),
    escapeCSV(item.formattedDate),
    escapeCSV(item.formattedTime),
    escapeCSV(item.meal),
    item.currentGlucose,
    item.carbs,
    item.appliedCarbRatio,
    item.appliedCorrectionFactor,
    item.appliedMinTarget,
    item.appliedMaxTarget,
    item.carbDose,
    item.correctionDose,
    item.finalRoundedDose,
    escapeCSV(item.appliedInsulinName),
    item.appliedIncrement,
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}
