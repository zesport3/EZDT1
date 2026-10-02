/**
 * Core Insulin Calculation Engine
 * 
 * STRICT CLINICAL & USER CONSTRAINTS:
 * 1. NO Insulin on Board (IOB) / active insulin calculations.
 * 2. NO automatic clinical guessing or fabricated parameters.
 * 3. Pure deterministic mathematics based exclusively on user-configured values.
 * 4. Transparent step-by-step breakdown.
 */

import {
  CalculationInput,
  CalculationResult,
  CalculationStepExplanation,
  InsulinIncrement,
  InsulinSettings,
  TimeSlotConfig,
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Resolves the active calculation parameters based on current time or slot settings.
 */
export function resolveActiveParameters(
  settings: InsulinSettings,
  timeString: string
): {
  carbRatio: number | null;
  correctionFactor: number | null;
  minTarget: number | null;
  maxTarget: number | null;
  slotName?: string;
  error?: string;
} {
  // Parse hour from timeString "HH:mm"
  const parts = timeString ? timeString.split(':') : [];
  const hour = parts.length > 0 ? parseInt(parts[0], 10) : new Date().getHours();
  const validHour = !isNaN(hour) && hour >= 0 && hour <= 23 ? hour : 0;
  const hourFormatted = `${String(validHour).padStart(2, '0')}:00`;

  // 1. Resolve Rácio
  let carbRatio: number | null = null;
  let ratioDesc = '';
  if (settings.ratioMode === 'hourly') {
    carbRatio = settings.hourlyCarbRatio?.[validHour] ?? settings.singleCarbRatio;
    ratioDesc = `Rácio (${hourFormatted}): ${carbRatio ?? '--'} g/U`;
  } else {
    carbRatio = settings.singleCarbRatio;
    ratioDesc = `Rácio: ${carbRatio ?? '--'} g/U`;
  }

  // 2. Resolve FSE / Fator de Correção
  let correctionFactor: number | null = null;
  let fseDesc = '';
  if (settings.fseMode === 'hourly') {
    correctionFactor = settings.hourlyCorrectionFactor?.[validHour] ?? settings.singleCorrectionFactor;
    fseDesc = `FSE (${hourFormatted}): ${correctionFactor ?? '--'} mg/dL/U`;
  } else {
    correctionFactor = settings.singleCorrectionFactor;
    fseDesc = `FSE: ${correctionFactor ?? '--'} mg/dL/U`;
  }

  // 3. Resolve Alvo
  const minTarget = settings.singleMinTarget;
  const maxTarget = settings.singleMaxTarget;

  return {
    carbRatio,
    correctionFactor,
    minTarget,
    maxTarget,
    slotName: `${ratioDesc} · ${fseDesc}`,
  };
}

/**
 * Rounds a dose value to the specified insulin increment (1.0, 0.5, or 0.1) based on settings.
 */
export function roundToIncrement(val: number, increment: InsulinIncrement = 1.0): number {
  if (val <= 0) return 0;
  const inc = Number(increment) || 1.0;
  if (inc === 1.0) {
    return Math.round(val);
  }
  if (inc === 0.5) {
    return Math.round(val * 2) / 2;
  }
  if (inc === 0.1) {
    return Number((Math.round(val * 10) / 10).toFixed(1));
  }
  const inv = 1 / inc;
  return Number((Math.round(val * inv) / inv).toFixed(2));
}

export function formatDoseValue(val: number, increment: InsulinIncrement = 1.0): string {
  if (val === 0) return '0';
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const inc = Number(increment) || 1.0;
  let formatted = '';
  if (inc === 1.0) {
    formatted = String(Math.round(absVal));
  } else if (inc === 0.5) {
    const rounded = Math.round(absVal * 2) / 2;
    formatted = String(rounded).replace('.', ',');
  } else if (inc === 0.1) {
    formatted = absVal.toFixed(1).replace('.', ',');
  } else {
    formatted = String(absVal).replace('.', ',');
  }
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Validates inputs and configuration prior to calculation.
 */
export function validateCalculation(
  input: CalculationInput,
  settings: InsulinSettings
): ValidationResult {
  const errors: string[] = [];

  // Check input values
  if (input.carbs === undefined || input.carbs === null || isNaN(input.carbs)) {
    errors.push('Introduz a quantidade de carboidratos (em gramas).');
  } else if (input.carbs < 0) {
    errors.push('A quantidade de carboidratos não pode ser negativa.');
  } else if (input.carbs > 350) {
    errors.push('A quantidade de carboidratos introduzida é anormalmente alta (> 350g). Confirma o valor.');
  }

  if (input.currentGlucose === undefined || input.currentGlucose === null || isNaN(input.currentGlucose)) {
    errors.push('Introduz o valor da glicemia atual.');
  } else if (input.currentGlucose <= 0) {
    errors.push('O valor da glicemia atual deve ser superior a zero.');
  } else if (input.currentGlucose < 30 || input.currentGlucose > 650) {
    errors.push('O valor da glicemia introduzido está fora do intervalo fisiológico mensurável comum (30 a 650 mg/dL).');
  }

  if (!input.calculationTime) {
    errors.push('Indica a hora do cálculo.');
  }

  // Check parameters
  const params = resolveActiveParameters(settings, input.calculationTime);
  if (params.error) {
    errors.push(params.error);
  } else {
    if (!params.carbRatio || params.carbRatio <= 0) {
      errors.push('Falta configurar o rácio de hidratos de carbono (quantos gramas por 1 unidade de insulina).');
    }
    if (!params.correctionFactor || params.correctionFactor <= 0) {
      errors.push('Falta configurar o fator de correção (quantos mg/dL baixa 1 unidade de insulina).');
    }
    if (params.minTarget === null || params.minTarget === undefined || params.minTarget <= 0) {
      errors.push('Falta configurar o valor mínimo do intervalo alvo de glicemia.');
    }
    if (params.maxTarget === null || params.maxTarget === undefined || params.maxTarget <= 0) {
      errors.push('Falta configurar o valor máximo do intervalo alvo de glicemia.');
    }
    if (
      params.minTarget !== null &&
      params.maxTarget !== null &&
      params.minTarget >= params.maxTarget
    ) {
      errors.push('O valor mínimo do intervalo alvo deve ser inferior ao valor máximo.');
    }
  }

  if (!settings.increment || ![1.0, 0.5, 0.1].includes(settings.increment)) {
    errors.push('Falta configurar o incremento mínimo da insulina (ex: 1 U, 0.5 U ou 0.1 U).');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Executes the complete insulin dose calculation based strictly on user configuration.
 * When active insulin is present, it is subtracted from the sum of carb and correction doses.
 */
export function calculateInsulinDose(
  input: CalculationInput,
  settings: InsulinSettings,
  activeInsulin: number = 0
): {
  result: CalculationResult | null;
  errors: string[];
} {
  const validation = validateCalculation(input, settings);
  if (!validation.isValid) {
    return { result: null, errors: validation.errors };
  }

  const params = resolveActiveParameters(settings, input.calculationTime);
  const carbRatio = params.carbRatio!;
  const correctionFactor = params.correctionFactor!;
  const minTarget = params.minTarget!;
  const maxTarget = params.maxTarget!;
  const increment = settings.increment;

  // 1. Carb dose: Carbs / Carb Ratio
  const carbInsulinRaw = input.carbs > 0 ? input.carbs / carbRatio : 0;
  const carbInsulinRounded = Number(carbInsulinRaw.toFixed(2));
  const carbCalculationText =
    input.carbs > 0
      ? `${input.carbs} g HC ÷ ${carbRatio} g/U = ${carbInsulinRounded} U`
      : 'Sem carboidratos introduzidos (0 g) → 0.0 U';

  // 2. Glucose correction: strictly calculated against target value of 100 mg/dL
  // If currentGlucose < 100: correction is negative and subtracts from carbs!
  // If currentGlucose < 70: 12g of fast-acting carbs are recommended!
  const targetReference = 100;
  let correctionNeeded = false;
  let correctionType: 'high' | 'in_target' | 'low' = 'in_target';
  let glucoseDiff = 0;
  let correctionInsulinRaw = 0;
  let correctionCalculationText = '';

  if (input.currentGlucose > 100) {
    correctionNeeded = true;
    correctionType = 'high';
    glucoseDiff = input.currentGlucose - 100;
    correctionInsulinRaw = glucoseDiff / correctionFactor;
    correctionCalculationText = `(${input.currentGlucose} - 100) ÷ ${correctionFactor} = +${correctionInsulinRaw.toFixed(2)} U`;
  } else if (input.currentGlucose < 100) {
    correctionNeeded = true;
    correctionType = input.currentGlucose < 70 ? 'low' : 'in_target';
    glucoseDiff = input.currentGlucose - 100; // Negative difference!
    correctionInsulinRaw = glucoseDiff / correctionFactor; // Negative dose!
    correctionCalculationText = `(${input.currentGlucose} - 100) ÷ ${correctionFactor} = ${correctionInsulinRaw.toFixed(2)} U (subtração)`;
  } else {
    correctionNeeded = false;
    correctionType = 'in_target';
    glucoseDiff = 0;
    correctionInsulinRaw = 0;
    correctionCalculationText = `Glicemia no alvo (100 mg/dL) → 0 U de correção`;
  }

  const correctionInsulinRounded = Number(correctionInsulinRaw.toFixed(2));
  const safeActiveInsulin = Math.max(0, activeInsulin || 0);

  // Active insulin is strictly subtracted from correction insulin
  // Rule: "para o inicio apenas vai a insulina administrada isto é: deu 10 de correcao mas tinha ativa 7 vai para a pag inicial 3"
  let administeredCorrectionRaw = correctionInsulinRaw;
  if (correctionInsulinRaw > 0) {
    administeredCorrectionRaw = Math.max(0, correctionInsulinRaw - safeActiveInsulin);
  }
  const administeredCorrectionRounded = Number(administeredCorrectionRaw.toFixed(2));

  // 3. Subtotal of carbs + administered correction
  const totalRaw = Math.max(0, carbInsulinRaw + administeredCorrectionRaw);
  const finalDose = roundToIncrement(totalRaw, increment);

  const roundingExplanation =
    increment === 1.0
      ? `Dose = ${totalRaw.toFixed(2)} U → Arredondado a ${increment} U = ${finalDose} U`
      : `Dose = ${totalRaw.toFixed(2)} U → Arredondado a ${increment} U = ${finalDose} U`;

  const explanationCorrectionText =
    safeActiveInsulin > 0 && correctionInsulinRaw > 0
      ? `(${input.currentGlucose} - 100) ÷ ${correctionFactor} = +${correctionInsulinRaw.toFixed(2)} U − ${safeActiveInsulin.toFixed(2)} U ativa = +${administeredCorrectionRounded.toFixed(2)} U administrada`
      : correctionCalculationText;

  const explanation: CalculationStepExplanation = {
    carbInsulinRaw,
    carbInsulinRounded,
    carbCalculationText,
    correctionNeeded,
    correctionType,
    glucoseDiff,
    correctionInsulinRaw: administeredCorrectionRaw,
    correctionInsulinRounded: administeredCorrectionRounded,
    correctionCalculationText: explanationCorrectionText,
    totalRaw: Number(totalRaw.toFixed(2)),
    finalDose,
    incrementApplied: increment,
    roundingExplanation,
  };

  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = input.calculationTime;

  const result: CalculationResult = {
    id: `calc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    formattedDate,
    formattedTime,
    meal: input.meal,
    carbs: input.carbs,
    currentGlucose: input.currentGlucose,
    appliedCarbRatio: carbRatio,
    appliedCorrectionFactor: correctionFactor,
    appliedMinTarget: minTarget,
    appliedMaxTarget: maxTarget,
    appliedInsulinName: settings.insulinName || 'Insulina Rápida',
    appliedIncrement: increment,
    slotName: params.slotName,
    carbDose: carbInsulinRounded,
    correctionDose: administeredCorrectionRounded,
    rawCorrectionDose: correctionInsulinRounded,
    totalRawDose: Number(totalRaw.toFixed(2)),
    finalRoundedDose: finalDose,
    estimatedActiveInsulin: safeActiveInsulin,
    hypoCarbsRecommended: input.currentGlucose < 70 ? 12 : undefined,
    explanation,
  };

  return {
    result,
    errors: [],
  };
}
