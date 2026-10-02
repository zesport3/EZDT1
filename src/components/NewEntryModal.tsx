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
import { X, Clock, Check, AlertTriangle, Calculator, Info } from 'lucide-react';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: InsulinSettings;
  userProfile: UserProfile;
  history?: HistoryEntry[];
  onSaveEntry: (result: CalculationResult) => void;
  onNavigateToSettings: () => void;
}

const MAIN_MEALS: { type: MealType; label: string; icon: string }[] = [
  { type: 'Pequeno-almoço', label: 'Pequeno-almoço', icon: '🌅' },
  { type: 'Almoço', label: 'Almoço', icon: '☀️' },
  { type: 'Lanche', label: 'Lanche', icon: '🥪' },
  { type: 'Jantar', label: 'Jantar', icon: '🌙' },
  { type: 'Correção sem refeição', label: 'Correção', icon: '💉' },
];

export const NewEntryModal: React.FC<NewEntryModalProps> = ({
  isOpen,
  onClose,
  settings,
  history = [],
  onSaveEntry,
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
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [currentTick, setCurrentTick] = useState<Date>(new Date());

  const handleCarbsChange = (val: string) => {
    setCarbsInput(val);
    setCalculationResult(null);
  };

  const handleGlucoseChange = (val: string) => {
    setGlucoseInput(val);
    setCalculationResult(null);
  };

  // Automatic live update of elapsed time (every 30 seconds or on modal open)
  useEffect(() => {
    if (!isOpen) return;
    setCurrentTick(new Date());
    const interval = setInterval(() => {
      setCurrentTick(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Compute active insulin automatically based on history and calculation time
  const activeInsulinInfo = useMemo(() => {
    return calculateActiveInsulin(history, calculationTime, currentTick);
  }, [history, calculationTime, currentTick]);

  if (!isOpen) return null;

  const handleCalculate = (autoSave = false) => {
    if (!meal) {
      setErrorMessages(['Por favor, seleciona a refeição antes de calcular.']);
      setCalculationResult(null);
      return null;
    }

    const carbsVal = carbsInput.trim() === '' ? 0 : parseFloat(carbsInput.replace(',', '.'));
    const glucoseVal = parseFloat(glucoseInput.replace(',', '.'));

    // Quando passa dos 250 dá o erro só depois de carregar no calcular
    if (!isNaN(carbsVal) && carbsVal > 250) {
      setShowPizzaModal(true);
      setCalculationResult(null);
      return null;
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
      return null;
    }

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

    if (autoSave && result) {
      onSaveEntry(result);
      onClose();
    }
    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCalculate(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-sky-100 overflow-hidden my-auto flex flex-col">
        
        {/* Top Header */}
        <div className="bg-sky-500 px-5 py-3.5 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-base">
              💉
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Calcular Insulina</h2>
              <div className="text-[11px] text-white/80">
                Arredondamento: passo de {settings.increment} U
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form Body - Simple & Clean */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-800">
          
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
              {MAIN_MEALS.map((m) => (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => {
                    setMeal(m.type);
                    if (m.type === 'Correção sem refeição') setCarbsInput('0');
                  }}
                  className={`py-2 px-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    meal === m.type
                      ? 'bg-sky-500 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-sky-50'
                  }`}
                >
                  <span className="text-sm">{m.icon}</span>
                  <span className="truncate text-[10px] sm:text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Glicemia & Hidratos Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            
            {/* Glicemia (mg/dL) */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-3 space-y-1.5">
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
                className="w-full h-11 px-3 text-xl font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
                autoFocus
              />
              <div className="text-[10px] text-slate-500">
                Correção a partir de 100 mg/dL
              </div>
            </div>

            {/* Carboidratos (g) */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-1.5">
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
                className="w-full h-11 px-3 text-xl font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                <span>Confirma os dados:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] pl-1 space-y-0.5">
                {errorMessages.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Valor Final da Dose e Sub-valores */}
          {calculationResult && (
            <div className="bg-gradient-to-b from-sky-50 to-white border-2 border-sky-400 rounded-2xl p-4 text-center shadow-xs animate-in fade-in duration-150 space-y-2">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block">
                Dose a Administrar
              </span>
              
              <div className="flex items-baseline justify-center gap-2 py-0.5">
                <span className="text-5xl sm:text-6xl font-extrabold font-mono text-sky-950 tracking-tight">
                  {formatDoseValue(calculationResult.finalRoundedDose, settings.increment)}
                </span>
                <span className="text-2xl font-bold text-sky-700">U</span>
              </div>

              {/* Sub-valores compactos */}
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-slate-700 font-medium pt-1.5 border-t border-sky-100">
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
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            {!calculationResult ? (
              <button
                type="button"
                onClick={() => handleCalculate(false)}
                className="w-full h-12 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>CALCULAR INSULINA</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleCalculate(false)}
                  className="w-full sm:w-1/3 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Recalcular
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-2/3 h-12 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>GUARDAR NO DIÁRIO</span>
                </button>
              </>
            )}
          </div>

        </form>
      </div>

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
