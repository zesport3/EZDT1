import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalculationInput, 
  CalculationResult, 
  HistoryEntry, 
  InsulinSettings, 
  MealType, 
  UserProfile 
} from '../types';
import { calculateInsulinDose, formatDoseValue, resolveActiveParameters } from '../utils/calculator';
import { calculateActiveInsulin } from '../utils/activeInsulin';
import { 
  Calculator, 
  Clock, 
  AlertTriangle, 
  Save, 
  RotateCcw, 
  Check,
  Info
} from 'lucide-react';

interface CalculatorViewProps {
  settings: InsulinSettings;
  userProfile: UserProfile;
  history?: HistoryEntry[];
  onSaveToHistory: (result: CalculationResult) => void;
  onNavigateToSettings: () => void;
  prefilledScenario?: { carbs: number; glucose: number; meal: MealType } | null;
  onClearPrefilledScenario?: () => void;
}

const MEALS: { type: MealType; label: string; icon: string }[] = [
  { type: 'Pequeno-almoço', label: 'Pequeno-almoço', icon: '🌅' },
  { type: 'Almoço', label: 'Almoço', icon: '☀️' },
  { type: 'Lanche', label: 'Lanche', icon: '🥪' },
  { type: 'Jantar', label: 'Jantar', icon: '🌙' },
  { type: 'Correção sem refeição', label: 'Correção', icon: '💉' },
];

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  settings,
  history = [],
  onSaveToHistory,
  prefilledScenario,
  onClearPrefilledScenario,
}) => {
  const getNowTimeString = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const [calculationTime, setCalculationTime] = useState<string>(getNowTimeString());
  const [meal, setMeal] = useState<MealType | null>(null);
  const [carbsInput, setCarbsInput] = useState<string>('');
  const [glucoseInput, setGlucoseInput] = useState<string>('');
  const [showPizzaModal, setShowPizzaModal] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [currentTick, setCurrentTick] = useState<Date>(new Date());

  const handleCarbsChange = (val: string) => {
    setCarbsInput(val);
    setCalculationResult(null);
  };

  const handleGlucoseChange = (val: string) => {
    setGlucoseInput(val);
    setCalculationResult(null);
  };

  // Automatic live update of elapsed time (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTick(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute active insulin automatically based on history and calculation time
  const activeInsulinInfo = useMemo(() => {
    return calculateActiveInsulin(history, calculationTime, currentTick);
  }, [history, calculationTime, currentTick]);

  useEffect(() => {
    if (prefilledScenario) {
      setCarbsInput(String(prefilledScenario.carbs));
      setGlucoseInput(String(prefilledScenario.glucose));
      setMeal(prefilledScenario.meal);
      if (onClearPrefilledScenario) onClearPrefilledScenario();
    }
  }, [prefilledScenario, onClearPrefilledScenario]);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavedSuccess(false);

    if (!meal) {
      setErrorMessages(['Por favor, seleciona a refeição antes de calcular.']);
      setCalculationResult(null);
      return;
    }

    const carbsVal = carbsInput.trim() === '' ? 0 : parseFloat(carbsInput.replace(',', '.'));
    const glucoseVal = parseFloat(glucoseInput.replace(',', '.'));

    // Quando passa dos 250 dá o erro só depois de carregar no calcular
    if (!isNaN(carbsVal) && carbsVal > 250) {
      setShowPizzaModal(true);
      setCalculationResult(null);
      return;
    }

    const input: CalculationInput = {
      meal,
      carbs: isNaN(carbsVal) ? 0 : carbsVal,
      currentGlucose: glucoseVal,
      calculationTime,
    };

    const { result, errors } = calculateInsulinDose(input, settings, activeInsulinInfo.activeInsulin);

    if (errors.length > 0) {
      setErrorMessages(errors);
      setCalculationResult(null);
    } else {
      setErrorMessages([]);
      if (result) {
        result.estimatedActiveInsulin = activeInsulinInfo.activeInsulin;
        result.activeInsulinDetails = {
          lastDose: activeInsulinInfo.lastDose,
          lastTime: activeInsulinInfo.lastTimeFormatted,
          lastDate: activeInsulinInfo.lastDateFormatted,
          elapsedFormatted: activeInsulinInfo.elapsedFormatted,
          explanation: activeInsulinInfo.explanationText,
        };
      }
      setCalculationResult(result);
    }
  };

  const handleSaveResult = () => {
    if (!calculationResult) return;
    onSaveToHistory(calculationResult);
    setSavedSuccess(true);
  };

  const handleReset = () => {
    setCarbsInput('');
    setGlucoseInput('');
    setCalculationResult(null);
    setErrorMessages([]);
    setSavedSuccess(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5 pb-16">
      
      {/* Title Card */}
      <div className="bg-white rounded-2xl border border-sky-100 p-4 sm:p-5 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Calcular Insulina
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Escolhe a refeição, introduz a glicemia e os hidratos para obter a dose.
        </p>
      </div>

      {/* Main Calculation Form */}
      <form
        onSubmit={handleCalculate}
        className="bg-white rounded-2xl border border-sky-100 shadow-xs p-5 space-y-4 text-slate-800"
      >
        {/* Refeição Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Refeição
            </label>
            <div className="flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100 text-xs font-mono font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <input
                type="time"
                value={calculationTime}
                onChange={(e) => setCalculationTime(e.target.value)}
                className="bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {MEALS.map((m) => (
              <button
                key={m.type}
                type="button"
                onClick={() => {
                  setMeal(m.type);
                  if (m.type === 'Correção sem refeição') setCarbsInput('0');
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  meal === m.type
                    ? 'bg-sky-500 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-sky-50'
                }`}
              >
                <span className="text-sm">{m.icon}</span>
                <span className="truncate text-[11px] sm:text-xs">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Glicemia & Hidratos Inputs */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          
          {/* Glicemia */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-sky-800">
              <span>GLICEMIA</span>
              <span className="font-mono text-[10px]">mg/dL</span>
            </div>
            <input
              type="number"
              step="1"
              min="30"
              max="650"
              placeholder=""
              value={glucoseInput}
              onChange={(e) => handleGlucoseChange(e.target.value)}
              className="w-full h-12 px-3 text-2xl font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
            <div className="text-[10px] text-slate-500">
              Correção a partir de 100 mg/dL
            </div>
          </div>

          {/* Carboidratos */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-amber-800">
              <span>CARBOIDRATOS</span>
              <span className="font-mono text-[10px]">máx 250g</span>
            </div>
            <input
              type="number"
              step="0.5"
              min="0"
              max="500"
              placeholder=""
              value={carbsInput}
              onChange={(e) => handleCarbsChange(e.target.value)}
              className="w-full h-12 px-3 text-2xl font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <div className="text-[10px] text-slate-500">
              0 g se for apenas correção
            </div>
          </div>

        </div>

        {/* Validation Errors */}
        {errorMessages.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Confirma os dados introduzidos:</span>
            </div>
            <ul className="list-disc list-inside text-[11px] pl-1 space-y-0.5">
              {errorMessages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Prominent Action Button: CALCULAR INSULINA */}
        <div className="pt-1">
          <button
            type="submit"
            className="w-full h-13 bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white font-bold text-sm tracking-wide rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calculator className="w-5 h-5" />
            <span>CALCULAR INSULINA</span>
          </button>
        </div>
      </form>

      {/* Prominent Calculation Result Display */}
      {calculationResult && (
        <div className="bg-gradient-to-b from-sky-50 to-white border-2 border-sky-400 rounded-2xl p-6 shadow-xs text-center space-y-3 animate-in fade-in duration-150">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-800 block">
            Dose a Administrar
          </span>

          {/* Large Clean Dose */}
          <div className="py-1 inline-flex items-baseline justify-center gap-2">
            <span className="text-5xl sm:text-6xl font-extrabold text-sky-950 font-mono tracking-tight">
              {formatDoseValue(calculationResult.finalRoundedDose, settings.increment)}
            </span>
            <span className="text-2xl font-bold text-sky-700">U</span>
          </div>

          {/* Sub-valores compactos */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-700 font-medium pt-2 border-t border-sky-100">
            <span>Carboidratos: <strong>{formatDoseValue(calculationResult.carbDose, settings.increment)} U</strong></span>
            <span>·</span>
            <span>Correção: <strong>{formatDoseValue(calculationResult.correctionDose, settings.increment)} U</strong></span>
            {(calculationResult.estimatedActiveInsulin ?? 0) > 0 && (
              <>
                <span>·</span>
                <span className="text-sky-700 font-semibold">
                  Ativa: <strong>- {formatDoseValue(calculationResult.estimatedActiveInsulin || 0, settings.increment)} U</strong>
                </span>
              </>
            )}
          </div>

          {/* Nota clínica sobre insulina ativa (apenas de correção) */}
          {(calculationResult.estimatedActiveInsulin ?? 0) > 0 && (
            <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl p-2.5 text-[11px] text-sky-950 leading-relaxed text-left flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                <strong>Nota:</strong> Só a insulina de correção é considerada insulina ativa. A insulina alimentar não é tida em consideração porque já é usada para cobrir os hidratos de carbono ingeridos e não tem potencial para baixar ainda mais a glicemia.
              </span>
            </div>
          )}

          {/* Ingerir 12g de carboidratos (apenas depois de calcular) */}
          {(calculationResult.currentGlucose < 70 || calculationResult.hypoCarbsRecommended) && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-900 font-bold flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
              <span>🍬</span>
              <span>Ingerir 12g de carboidratos</span>
            </div>
          )}

          {/* Actions: Save to history, reset */}
          <div className="flex items-center justify-center gap-3 pt-3 border-t border-sky-100">
            <button
              type="button"
              onClick={handleSaveResult}
              disabled={savedSuccess}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardado no Histórico!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar no Histórico</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Novo Cálculo</span>
            </button>
          </div>
        </div>
      )}

      {/* Pizza Warning Modal (> 250g de hidratos) */}
      {showPizzaModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
              🍕
            </div>
            <p className="text-base font-bold text-slate-800 leading-snug">
              vais mesmo comer o equivalente a 4 pizzas inteiras ou foi so engano?
            </p>
            <button
              type="button"
              onClick={() => {
                setCarbsInput('250');
                setShowPizzaModal(false);
              }}
              className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
