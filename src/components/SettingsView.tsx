import React, { useState } from 'react';
import { 
  InsulinIncrement, 
  InsulinSettings 
} from '../types';
import { defaultHourlyMap, saveInsulinSettings } from '../utils/storage';
import { 
  Check, 
  Download, 
  Upload, 
  AlertCircle,
  Activity,
  Wheat,
  Clock,
  ChevronsUpDown
} from 'lucide-react';
import { 
  exportAllDataAsJSON, 
  importAllDataFromJSON 
} from '../utils/storage';

interface SettingsViewProps {
  settings: InsulinSettings;
  onSaveSettings: (newSettings: InsulinSettings) => void;
  onRefreshAllData: () => void;
}

// Target range dropdown elevator options (10 in 10 steps)
const MIN_TARGET_OPTIONS = [70, 80, 90, 100, 110, 120, 130, 140];
const MAX_TARGET_OPTIONS = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onRefreshAllData,
}) => {
  // Ensure default values are within valid options
  const initialMin = settings.singleMinTarget && MIN_TARGET_OPTIONS.includes(settings.singleMinTarget)
    ? settings.singleMinTarget
    : 70;
  const initialMax = settings.singleMaxTarget && MAX_TARGET_OPTIONS.includes(settings.singleMaxTarget)
    ? settings.singleMaxTarget
    : 180;

  const initialSettings: InsulinSettings = {
    ...settings,
    fseMode: settings.fseMode || 'all_day',
    ratioMode: settings.ratioMode || 'all_day',
    singleCorrectionFactor: settings.singleCorrectionFactor ?? 40,
    hourlyCorrectionFactor: settings.hourlyCorrectionFactor || defaultHourlyMap(settings.singleCorrectionFactor ?? 40),
    singleCarbRatio: settings.singleCarbRatio ?? 15,
    hourlyCarbRatio: settings.hourlyCarbRatio || defaultHourlyMap(settings.singleCarbRatio ?? 15),
    singleMinTarget: initialMin,
    singleMaxTarget: initialMax,
  };

  const [current, setCurrent] = useState<InsulinSettings>(initialSettings);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Quick batch apply helpers
  const [batchFseValue, setBatchFseValue] = useState<string>('40');
  const [batchRatioValue, setBatchRatioValue] = useState<string>('15');

  const handleApplyBatchFse = () => {
    const val = parseFloat(batchFseValue);
    if (!isNaN(val) && val > 0) {
      setCurrent((prev) => ({
        ...prev,
        hourlyCorrectionFactor: defaultHourlyMap(val),
      }));
    }
  };

  const handleApplyBatchRatio = () => {
    const val = parseFloat(batchRatioValue);
    if (!isNaN(val) && val > 0) {
      setCurrent((prev) => ({
        ...prev,
        hourlyCarbRatio: defaultHourlyMap(val),
      }));
    }
  };

  const handleHourlyFseChange = (hour: number, val: string) => {
    const num = parseFloat(val);
    setCurrent((prev) => ({
      ...prev,
      hourlyCorrectionFactor: {
        ...prev.hourlyCorrectionFactor,
        [hour]: isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleHourlyRatioChange = (hour: number, val: string) => {
    const num = parseFloat(val);
    setCurrent((prev) => ({
      ...prev,
      hourlyCarbRatio: {
        ...prev.hourlyCarbRatio,
        [hour]: isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleSave = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    const settingsToSave: InsulinSettings = {
      ...current,
      singleMinTarget: current.singleMinTarget ?? 70,
      singleMaxTarget: current.singleMaxTarget ?? 180,
    };

    // Save directly to localStorage and notify parent (navigates to home)
    saveInsulinSettings(settingsToSave);
    onSaveSettings(settingsToSave);
    setShowConfirmModal(false);
  };

  const handleExportJSON = () => {
    const jsonStr = exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezdt1_config_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security validation: file size limit 2MB
    if (file.size > 2 * 1024 * 1024) {
      setImportStatus({ success: false, message: 'O ficheiro excede o limite máximo permitido (2MB).' });
      e.target.value = '';
      setTimeout(() => setImportStatus(null), 5000);
      return;
    }

    // Security validation: file extension check
    if (!file.name.toLowerCase().endsWith('.json')) {
      setImportStatus({ success: false, message: 'Formato inválido. Apenas ficheiros .json são permitidos.' });
      e.target.value = '';
      setTimeout(() => setImportStatus(null), 5000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = importAllDataFromJSON(content);
      if (res.success) {
        setImportStatus({ success: true, message: 'Dados e configurações importados com sucesso!' });
        onRefreshAllData();
      } else {
        setImportStatus({ success: false, message: res.error || 'Erro ao importar ficheiro.' });
      }
      e.target.value = '';
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => i);

  // Format 00:00h - 01:00h ... 23:00h - 24:00h
  const formatHourInterval = (hour: number) => {
    const startStr = `${String(hour).padStart(2, '0')}:00h`;
    const endStr = `${String(hour + 1).padStart(2, '0')}:00h`;
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="max-w-xl md:max-w-3xl mx-auto px-4 py-6 space-y-6 pb-20">
      
      {/* Title Bar (Without Guardar button at top-right, as requested) */}
      <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Configuração dos Parâmetros
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Define o Fator de Sensibilidade (FSE) e o Rácio de Hidratos para todo o dia ou hora a hora.
        </p>
      </div>

      {saveStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      <div className="space-y-6">
        
        {/* QUADRO 1: FATOR DE SENSIBILIDADE / CORREÇÃO (FSE / FC) */}
        <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-50 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Fator de Sensibilidade à Insulina (FSE / FC)
                </h2>
                <div className="text-[11px] text-slate-500">
                  Quantos mg/dL baixa 1 unidade de insulina (mg/dL/U)
                </div>
              </div>
            </div>

            {/* Toggle: Todo o dia vs Hora a hora */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrent({ ...current, fseMode: 'all_day' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  current.fseMode === 'all_day'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todo o dia
              </button>
              <button
                type="button"
                onClick={() => setCurrent({ ...current, fseMode: 'hourly' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  current.fseMode === 'hourly'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hora a hora
              </button>
            </div>
          </div>

          {/* Option A: Todo o dia */}
          {current.fseMode === 'all_day' ? (
            <div className="p-4 bg-sky-50/40 rounded-xl border border-sky-100 max-w-sm space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                FSE para todo o dia (mg/dL/U)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="250"
                  placeholder=""
                  value={current.singleCorrectionFactor ?? ''}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      singleCorrectionFactor: e.target.value === '' ? null : parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-11 px-3 text-base font-mono font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                  mg/dL/U
                </span>
              </div>
            </div>
          ) : (
            /* Option B: Hora a hora - 1 por linha seguidos para baixo */
            <div className="space-y-3">
              {/* Batch apply tool */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-sky-50/50 rounded-xl border border-sky-100 text-xs">
                <span className="text-slate-600 font-medium">Definir valor base para todas as horas:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={batchFseValue}
                    onChange={(e) => setBatchFseValue(e.target.value)}
                    className="w-16 h-8 px-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-center"
                    placeholder=""
                  />
                  <button
                    type="button"
                    onClick={handleApplyBatchFse}
                    className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Aplicar a todas
                  </button>
                </div>
              </div>

              {/* 24 Hours List: 1 por linha seguidos para baixo */}
              <div className="flex flex-col divide-y divide-sky-100/80 bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-2xs">
                {hoursList.map((hour) => {
                  const hourLabel = formatHourInterval(hour);
                  const val = current.hourlyCorrectionFactor?.[hour] ?? current.singleCorrectionFactor ?? 40;
                  return (
                    <div
                      key={hour}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-sky-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="text-xs sm:text-sm font-mono font-bold text-slate-800">
                          {hourLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          max="250"
                          placeholder=""
                          value={val === 0 ? '' : val}
                          onChange={(e) => handleHourlyFseChange(hour, e.target.value)}
                          className="w-20 h-9 px-2 text-center font-mono font-bold text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                        <span className="text-xs font-medium text-slate-500 w-16 text-left">
                          mg/dL/U
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* QUADRO 2: RÁCIO DE CARBOIDRATOS / INSULINA */}
        <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-50 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Wheat className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Rácio de Carboidratos / Insulina
                </h2>
                <div className="text-[11px] text-slate-500">
                  Quantos gramas de carboidratos correspondem a 1 unidade de insulina (g/U)
                </div>
              </div>
            </div>

            {/* Toggle: Todo o dia vs Hora a hora */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrent({ ...current, ratioMode: 'all_day' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  current.ratioMode === 'all_day'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todo o dia
              </button>
              <button
                type="button"
                onClick={() => setCurrent({ ...current, ratioMode: 'hourly' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  current.ratioMode === 'hourly'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hora a hora
              </button>
            </div>
          </div>

          {/* Option A: Todo o dia */}
          {current.ratioMode === 'all_day' ? (
            <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100 max-w-sm space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Rácio para todo o dia (g/U)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="100"
                  placeholder=""
                  value={current.singleCarbRatio ?? ''}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      singleCarbRatio: e.target.value === '' ? null : parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-11 px-3 text-base font-mono font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                  g Carboidratos por 1 U
                </span>
              </div>
            </div>
          ) : (
            /* Option B: Hora a hora - 1 por linha seguidos para baixo */
            <div className="space-y-3">
              {/* Batch apply tool */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-50/40 rounded-xl border border-amber-100 text-xs">
                <span className="text-slate-600 font-medium">Definir valor base para todas as horas:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={batchRatioValue}
                    onChange={(e) => setBatchRatioValue(e.target.value)}
                    className="w-16 h-8 px-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-center"
                    placeholder=""
                  />
                  <button
                    type="button"
                    onClick={handleApplyBatchRatio}
                    className="px-2.5 py-1.5 bg-[#b57d28] hover:bg-[#9a6921] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Aplicar a todas
                  </button>
                </div>
              </div>

              {/* 24 Hours List: 1 por linha seguidos para baixo */}
              <div className="flex flex-col divide-y divide-amber-100/80 bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-2xs">
                {hoursList.map((hour) => {
                  const hourLabel = formatHourInterval(hour);
                  const val = current.hourlyCarbRatio?.[hour] ?? current.singleCarbRatio ?? 15;
                  return (
                    <div
                      key={hour}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-amber-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs sm:text-sm font-mono font-bold text-slate-800">
                          {hourLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="100"
                          placeholder=""
                          value={val === 0 ? '' : val}
                          onChange={(e) => handleHourlyRatioChange(hour, e.target.value)}
                          className="w-20 h-9 px-2 text-center font-mono font-bold text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <span className="text-xs font-medium text-slate-500 w-16 text-left">
                          g/U
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* QUADRO 3: INTERVALO ALVO DE GLICEMIA (Elevador de 10 em 10: Min 70 a 140, Max 180 a 220) */}
        <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs space-y-4">
          <div className="border-b border-sky-50 pb-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              🎯 Intervalo Alvo de Glicemia
            </h2>
            <div className="text-[11px] text-slate-500">
              Seleciona os limites do intervalo alvo no elevador que varia de 10 em 10 mg/dL
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Alvo Mínimo: 70 a 140 de 10 em 10 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Alvo Mínimo</span>
                <span className="text-[10px] text-sky-600 font-mono font-bold">70 a 140 mg/dL</span>
              </label>
              <div className="relative">
                <select
                  value={current.singleMinTarget ?? 70}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      singleMinTarget: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-12 px-3.5 pr-10 text-base font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none appearance-none cursor-pointer text-slate-900"
                >
                  {MIN_TARGET_OPTIONS.map((val) => (
                    <option key={val} value={val}>
                      {val} mg/dL
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sky-600 flex items-center">
                  <ChevronsUpDown className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Alvo Máximo: 100 a 220 de 10 em 10 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Alvo Máximo</span>
                <span className="text-[10px] text-sky-600 font-mono font-bold">100 a 220 mg/dL</span>
              </label>
              <div className="relative">
                <select
                  value={current.singleMaxTarget ?? 180}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      singleMaxTarget: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-12 px-3.5 pr-10 text-base font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none appearance-none cursor-pointer text-slate-900"
                >
                  {MAX_TARGET_OPTIONS.map((val) => (
                    <option key={val} value={val}>
                      {val} mg/dL
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sky-600 flex items-center">
                  <ChevronsUpDown className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QUADRO 4: TIPO DE INSULINA & INCREMENTO */}
        <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs space-y-4">
          <div className="border-b border-sky-50 pb-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              💉 Tipo de Insulina & Incremento
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Nome ou Tipo de Insulina</label>
              <input
                type="text"
                value={current.insulinName}
                onChange={(e) => setCurrent({ ...current, insulinName: e.target.value })}
                placeholder=""
                className="w-full h-11 px-3 text-sm font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Incremento / Arredondamento da Dose</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 1.0, label: '1 U' },
                  { val: 0.5, label: '0,5 U' },
                  { val: 0.1, label: '0,1 U' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setCurrent({ ...current, increment: opt.val as InsulinIncrement })}
                    className={`h-11 px-2 rounded-xl text-xs font-bold font-mono flex items-center justify-center transition-all cursor-pointer ${
                      current.increment === opt.val
                        ? 'bg-sky-500 text-white shadow-xs ring-2 ring-sky-500 ring-offset-1'
                        : 'bg-slate-50 text-slate-700 hover:bg-sky-50 border border-slate-200'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cópia de Segurança */}
        <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">💾 Cópia de Segurança (JSON)</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar Configurações (JSON)</span>
            </button>

            <label className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Importar Ficheiro JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {importStatus.success ? (
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Primary Save Action at bottom with immediate visual feedback */}
        <div className="space-y-3 pt-2">
          {saveStatus && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveStatus}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className={`w-full sm:w-auto px-8 h-12 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-sky-500 hover:bg-sky-600 active:scale-[0.99]'
              }`}
            >
              <Check className="w-5 h-5" />
              <span>
                {isSaved ? 'Parâmetros Guardados com Sucesso!' : 'Guardar Parâmetros Configurados'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Modal: Confirma guardar? com OK e Cancelar */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-sky-100 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-14 h-14 mx-auto bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner">
              ⚙️
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                Confirma guardar?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                As configurações serão atualizadas e voltarás ao ecrã inicial.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
