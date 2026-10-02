/**
 * Types for the Personal Insulin Calculator
 * Strictly follows user-defined parameters without any IOB / active insulin calculation.
 */

export type DiabetesType =
  | 'Tipo 1'
  | 'Tipo 2'
  | 'LADA'
  | 'MODY'
  | 'Gestacional'
  | 'Outro'
  | 'Não especificado';

export type MealType =
  | 'Pequeno-almoço'
  | 'Almoço'
  | 'Lanche'
  | 'Jantar'
  | 'Ceia / Noite'
  | 'Correção sem refeição'
  | 'Outra';

export type InsulinIncrement = 1.0 | 0.5 | 0.1;

export interface TimeSlotConfig {
  id: string;
  name: string;
  startHour: number; // 0 - 23
  endHour: number; // 0 - 23
  carbRatio: number; // grams of carbs per 1 unit of insulin
  correctionFactor: number; // mg/dL drop per 1 unit of insulin
  minTarget: number; // min target glucose in mg/dL
  maxTarget: number; // max target glucose in mg/dL
}

export interface UserProfile {
  name: string;
  diabetesType: DiabetesType;
  diagnosedYearOrDate: string;
  doctorName?: string;
  hospitalClinic?: string;
  emergencyContact?: string;
  additionalNotes?: string;
}

export interface InsulinSettings {
  insulinName: string; // e.g. Humalog, NovoRapid, Fiasp, Apidra, Lyumjev
  increment: InsulinIncrement; // 1.0, 0.5, or 0.1
  glucoseUnit: 'mg/dL';
  
  // FSE / Fator de Sensibilidade / Correção (FC)
  fseMode: 'all_day' | 'hourly'; // "todo o dia" ou "hora a hora"
  singleCorrectionFactor: number | null; // mg/dL per U
  hourlyCorrectionFactor: Record<number, number>; // hour 0..23 -> FSE

  // Rácio de Hidratos / Insulina
  ratioMode: 'all_day' | 'hourly'; // "todo o dia" ou "hora a hora"
  singleCarbRatio: number | null; // g/U
  hourlyCarbRatio: Record<number, number>; // hour 0..23 -> Carb Ratio

  // Intervalo Alvo
  singleMinTarget: number | null; // mg/dL
  singleMaxTarget: number | null; // mg/dL

  // Scheduled slots (optional legacy backward compatibility)
  useScheduleSlots?: boolean;
  timeSlots?: TimeSlotConfig[];

  // Correction calculation method
  correctionMethod: 'above_max' | 'to_midpoint'; // calculate correction from maxTarget or from midpoint ((min+max)/2)
}

export interface CalculationInput {
  meal: MealType;
  carbs: number; // grams
  currentGlucose: number; // mg/dL
  calculationTime: string; // HH:mm or ISO string
}

export interface CalculationStepExplanation {
  carbInsulinRaw: number;
  carbInsulinRounded: number;
  carbCalculationText: string;
  
  correctionNeeded: boolean;
  correctionType: 'high' | 'in_target' | 'low';
  glucoseDiff: number;
  correctionInsulinRaw: number;
  correctionInsulinRounded: number;
  correctionCalculationText: string;

  totalRaw: number;
  finalDose: number;
  incrementApplied: number;
  roundingExplanation: string;
}

export interface CalculationResult {
  id: string;
  timestamp: string; // ISO string
  formattedDate: string;
  formattedTime: string;
  meal: MealType;
  carbs: number;
  currentGlucose: number;
  
  // Applied parameters
  appliedCarbRatio: number;
  appliedCorrectionFactor: number;
  appliedMinTarget: number;
  appliedMaxTarget: number;
  appliedInsulinName: string;
  appliedIncrement: InsulinIncrement;
  slotName?: string;

  // Computed doses
  carbDose: number;
  correctionDose: number; // Dose de correção efetivamente administrada (ex: 10 calculada - 7 ativa = 3 U administrada)
  rawCorrectionDose?: number; // Dose de correção bruta calculada antes de subtrair insulina ativa (ex: 10 U)
  totalRawDose: number;
  finalRoundedDose: number;

  explanation: CalculationStepExplanation;
  notes?: string;

  // Active insulin tracking (IOB)
  estimatedActiveInsulin?: number;
  activeInsulinDetails?: {
    lastDose?: number;
    lastTime?: string;
    lastDate?: string;
    elapsedFormatted?: string;
    explanation?: string;
  };
  hypoCarbsRecommended?: number;
}

export interface HistoryEntry extends CalculationResult {
  savedAt: string;
}

export type ActiveTab = 'diary' | 'calculator' | 'settings' | 'profile' | 'history' | 'tests';
