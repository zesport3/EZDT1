import React from 'react';
import { ActiveInsulinCalculation } from '../utils/activeInsulin';
import { Clock, Info, ShieldAlert, Sparkles, Syringe } from 'lucide-react';

interface ActiveInsulinCardProps {
  info: ActiveInsulinCalculation;
  className?: string;
}

export const ActiveInsulinCard: React.FC<ActiveInsulinCardProps> = ({
  info,
  className = '',
}) => {
  const formatDecimal = (num: number) => {
    return String(num.toFixed(2)).replace('.', ',');
  };

  return (
    <div
      className={`rounded-2xl border transition-all p-3.5 sm:p-4 ${
        !info.hasPreviousDose
          ? 'bg-slate-50 border-slate-200'
          : info.isWithinThreeHours && info.activeInsulin > 0
          ? 'bg-gradient-to-br from-sky-50/80 to-blue-50/50 border-sky-200 shadow-2xs'
          : 'bg-slate-50/80 border-slate-200'
      } ${className}`}
    >
      {/* Header with Title and Current Active Insulin Badge */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-sky-100/80">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
              info.isWithinThreeHours && info.activeInsulin > 0
                ? 'bg-sky-500 text-white shadow-2xs'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Insulina Ativa Estimada</span>
              <span className="text-[10px] font-semibold text-sky-600 bg-sky-100/60 px-1.5 py-0.2 rounded font-mono">
                Regra das 3h
              </span>
            </div>
            <div className="text-[10.5px] text-slate-500">
              Calculada automaticamente a partir do histórico
            </div>
          </div>
        </div>

        {/* Primary Value Pill */}
        <div
          className={`px-3 py-1 rounded-xl font-mono font-bold text-sm shadow-2xs ${
            info.isWithinThreeHours && info.activeInsulin > 0
              ? 'bg-sky-600 text-white'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {info.hasPreviousDose ? `${formatDecimal(info.activeInsulin)} U` : '0 U'}
        </div>
      </div>

      {/* Case A: No previous record in history */}
      {!info.hasPreviousDose ? (
        <div className="pt-2.5 flex items-start gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-slate-700">
              Não existe um registo anterior de insulina para calcular a insulina ativa.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Insulina ativa estimada: <strong className="font-mono text-slate-700">0 U</strong>.
            </p>
          </div>
        </div>
      ) : (
        /* Case B: Previous record found - Display all required items automatically */
        <div className="pt-2.5 space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* 1. Última dose registada */}
            <div className="bg-white/90 p-2 rounded-xl border border-sky-100/70">
              <span className="text-[10px] text-slate-500 font-medium block">
                Última dose registada:
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {info.lastDose} U
              </span>
              {info.lastMeal && (
                <span className="text-[10px] text-sky-700 font-medium block truncate">
                  {info.lastMeal}
                </span>
              )}
            </div>

            {/* 2. Hora da última dose */}
            <div className="bg-white/90 p-2 rounded-xl border border-sky-100/70">
              <span className="text-[10px] text-slate-500 font-medium block">
                Hora da última dose:
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {info.lastTimeFormatted}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {info.lastDateFormatted}
              </span>
            </div>

            {/* 3. Tempo decorrido */}
            <div className="bg-white/90 p-2 rounded-xl border border-sky-100/70">
              <span className="text-[10px] text-slate-500 font-medium block">
                Tempo decorrido:
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {info.elapsedFormatted}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                {info.isWithinThreeHours ? 'Menos de 3h' : '≥ 3h decorridas'}
              </span>
            </div>

            {/* 4. Insulina ativa estimada */}
            <div className="bg-white/90 p-2 rounded-xl border border-sky-100/70">
              <span className="text-[10px] text-slate-500 font-medium block">
                Insulina ativa estimada:
              </span>
              <span className="font-mono font-bold text-sky-700 text-sm">
                {formatDecimal(info.activeInsulin)} U
              </span>
              <span className="text-[10px] text-slate-400 block">
                {info.isWithinThreeHours ? 'Ativa no corpo' : 'Efeito esgotado'}
              </span>
            </div>
          </div>

          {/* Mathematical Formula breakdown note */}
          <div className="bg-white/80 p-2 rounded-xl border border-sky-100/80 text-[11px] text-slate-600 font-mono flex items-center justify-between gap-2">
            <span className="text-slate-500 truncate">
              {info.isWithinThreeHours
                ? `${info.lastDose} U × (1 − ${info.elapsedHours} h ÷ 3 h) = ${formatDecimal(info.activeInsulin)} U`
                : 'Tempo decorrido ≥ 3 horas → 0,00 U de insulina ativa'}
            </span>
            <span className="text-[10px] text-slate-400 shrink-0 font-sans italic">
              Informativo
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
