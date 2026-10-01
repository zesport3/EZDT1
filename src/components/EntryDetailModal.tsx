import React from 'react';
import { HistoryEntry } from '../types';
import { X, Trash2 } from 'lucide-react';

interface EntryDetailModalProps {
  entry: HistoryEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onDelete,
}) => {
  if (!entry) return null;

  const formatDecimal = (num: number) => {
    return String(num).replace('.', ',');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-sky-100 overflow-hidden space-y-4">
        
        {/* Header in Serene Light Sky Blue */}
        <div className="bg-sky-500 px-5 py-4 text-white flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs uppercase tracking-wider text-sky-100 font-bold">{entry.meal}</div>
            <h3 className="text-lg font-bold">
              {entry.formattedDate} às {entry.formattedTime}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-slate-800">
          
          {/* Badges presentation row */}
          <div className="flex items-center justify-center gap-3 py-2 bg-sky-50/40 rounded-2xl border border-sky-100">
            {/* Glucose Badge */}
            <div className="flex flex-col items-center">
              <div className="w-13 h-13 rounded-full bg-sky-500 text-white flex flex-col items-center justify-center shadow-xs font-mono font-bold text-base">
                {entry.currentGlucose}
                <span className="text-[8px] font-normal leading-none mt-0.5">mg/dL</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Glicemia</span>
            </div>

            {/* Carbs Badge */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-13 rounded-lg bg-[#b57d28] text-white flex flex-col items-center justify-center shadow-xs font-mono font-bold text-base">
                {entry.carbs}
                <span className="text-[9px] font-normal leading-none mt-0.5">g</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Hidratos</span>
            </div>

            {/* Insulin Dose 1 (Meal) */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-13 rounded-t-lg rounded-b-sm bg-sky-600 text-white flex flex-col items-center justify-center shadow-xs font-mono font-bold text-base">
                {formatDecimal(entry.carbDose)}
                <span className="text-[9px] font-normal leading-none mt-0.5">U</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Refeição</span>
            </div>

            {/* Insulin Dose 2 (Correction) */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-13 rounded-t-lg rounded-b-sm bg-sky-600 text-white flex flex-col items-center justify-center shadow-xs font-mono font-bold text-base">
                {formatDecimal(entry.correctionDose)}
                <span className="text-[9px] font-normal leading-none mt-0.5">U</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Correção</span>
            </div>
          </div>

          {/* Mathematical Explanation */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900">Cálculo Matemático Realizado:</div>
            <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100 space-y-2 font-mono text-[11px] text-slate-700">
              <div>
                <strong>Hidratos:</strong> {entry.explanation.carbCalculationText}
              </div>
              <div>
                <strong>Correção:</strong> {entry.explanation.correctionCalculationText}
              </div>
              <div className="pt-1 border-t border-sky-200/60 font-bold text-sky-700">
                {entry.explanation.roundingExplanation}
              </div>
            </div>
          </div>

          {/* Applied Settings info */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>Rácio: 1 U = {entry.appliedCarbRatio}g HC</div>
            <div>FC / FSE: 1 U = {entry.appliedCorrectionFactor} mg/dL</div>
            <div>Alvo: {entry.appliedMinTarget} - {entry.appliedMaxTarget} mg/dL</div>
            <div>Insulina: {entry.appliedInsulinName} ({entry.appliedIncrement} U)</div>
          </div>

          {/* Active Insulin at calculation moment */}
          {entry.estimatedActiveInsulin !== undefined && (
            <div className="bg-sky-50/50 p-2.5 rounded-xl border border-sky-100 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-800 font-semibold">
                <span>Insulina Ativa Estimada no momento:</span>
                <span className="font-mono text-sky-700 font-bold">
                  {String(entry.estimatedActiveInsulin.toFixed(2)).replace('.', ',')} U
                </span>
              </div>
              {entry.activeInsulinDetails && entry.activeInsulinDetails.lastDose !== undefined && (
                <div className="text-[11px] font-mono text-slate-500">
                  Última dose anterior: {entry.activeInsulinDetails.lastDose} U às {entry.activeInsulinDetails.lastTime} ({entry.activeInsulinDetails.elapsedFormatted} decorridos)
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onDelete(entry.id);
                onClose();
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Apagar Entrada</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
