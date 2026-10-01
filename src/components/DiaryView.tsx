import React from 'react';
import { HistoryEntry, InsulinSettings, UserProfile } from '../types';
import { groupHistoryByDays } from '../utils/dateGrouping';
import { formatDoseValue } from '../utils/calculator';
import { TimelineGraph } from './TimelineGraph';
import { ChevronRight } from 'lucide-react';

interface DiaryViewProps {
  entries: HistoryEntry[];
  settings: InsulinSettings;
  userProfile: UserProfile;
  onOpenNewEntryModal: () => void;
  onSelectEntry: (entry: HistoryEntry) => void;
}

export const DiaryView: React.FC<DiaryViewProps> = ({
  entries,
  settings,
  onOpenNewEntryModal,
  onSelectEntry,
}) => {
  // Group by day and sort descending by time
  const dayGroups = groupHistoryByDays(entries);

  const formatDecimal = (num: number) => {
    return formatDoseValue(num, settings.increment);
  };

  const getGlucoseBadgeColor = (val: number) => {
    const maxTarget = settings.singleMaxTarget || 180;
    if (val < 70) return 'bg-rose-600 text-white font-bold'; // Vermelho (< 70)
    if (val < 85) return 'bg-amber-400 text-amber-950 font-bold'; // Amarelo (70 - 84)
    if (val <= maxTarget) return 'bg-emerald-500 text-white font-bold'; // Verde (85 - targetMax)
    if (val < 250) return 'bg-amber-500 text-white font-bold'; // Amarelo (> targetMax até 249)
    return 'bg-rose-600 text-white font-bold'; // Vermelho (>= 250)
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white min-h-[calc(100vh-70px)] shadow-md border-x border-sky-100">
      
      {/* Daily Timeline Glucose Graph at top */}
      <TimelineGraph
        entries={entries}
        targetMin={settings.singleMinTarget || 70}
        targetMax={settings.singleMaxTarget || 180}
        onSelectEntry={onSelectEntry}
      />

      {/* Empty State */}
      {dayGroups.length === 0 ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-500 mx-auto flex items-center justify-center font-bold text-2xl">
            +
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Sem entradas registadas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Clica no botão <span className="font-bold text-sky-500">+</span> no canto superior direito para calcular a insulina e registar a tua primeira entrada.
            </p>
          </div>
          <button
            onClick={onOpenNewEntryModal}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            + Adicionar Entrada Agora
          </button>
        </div>
      ) : (
        /* Diary Groups List */
        <div className="divide-y divide-sky-100">
          {dayGroups.map((group) => (
            <div key={group.dateKey} className="border-b border-sky-100">
              
              {/* Day Header Banner (Serene Light Blue matching new palette) */}
              <div className="bg-sky-500 px-4 py-2 text-white flex items-center justify-between select-none shadow-xs">
                <span className="font-semibold text-sm capitalize tracking-wide">
                  {group.displayLabel}
                </span>
                <div className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Rows inside this day, ordered by hour descending */}
              <div className="bg-white divide-y divide-slate-100">
                {group.entries.map((entry) => {
                  return (
                    <div
                      key={entry.id}
                      onClick={() => onSelectEntry(entry)}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-sky-50/50 transition-colors cursor-pointer select-none group"
                    >
                      {/* Left: Time & Selected Meal (Pequeno-almoço, Almoço, Jantar, etc.) */}
                      <div className="flex flex-col justify-center min-w-[110px] sm:min-w-[140px] max-w-[180px] pr-2 shrink-0">
                        <span className="font-mono text-base font-bold text-slate-900 leading-tight">
                          {entry.formattedTime}
                        </span>
                        <span
                          className="text-xs font-semibold text-sky-700 leading-tight mt-0.5 truncate"
                          title={entry.meal}
                        >
                          {entry.meal}
                        </span>
                      </div>

                      {/* Right: Badges Row (Glucose, Carbs, Insulin 1, Insulin 2) */}
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        
                        {/* 1. Glucose Circle Badge */}
                        <div
                          className={`w-12 h-12 rounded-full ${getGlucoseBadgeColor(
                            entry.currentGlucose
                          )} text-white flex flex-col items-center justify-center shrink-0 shadow-xs`}
                          title={`Glicemia: ${entry.currentGlucose} mg/dL`}
                        >
                          <span className="text-sm font-bold font-mono leading-none tracking-tight">
                            {entry.currentGlucose}
                          </span>
                          <span className="text-[8px] font-normal leading-none mt-0.5">
                            mg/dL
                          </span>
                        </div>

                        {/* 2. Carbs Square Badge (Warm caramel contrast) */}
                        <div
                          className="w-11 h-12 rounded-md bg-[#b77d28] text-white flex flex-col items-center justify-center shrink-0 shadow-xs"
                          title={`Carboidratos: ${entry.carbs}g`}
                        >
                          <span className="text-sm font-bold font-mono leading-none tracking-tight">
                            {entry.carbs}
                          </span>
                          <span className="text-[9px] font-normal leading-none mt-0.5">
                            g
                          </span>
                        </div>

                        {/* 3. Insulin Dose 1 (Meal/Carb Dose) */}
                        <div
                          className="w-11 h-12 rounded-t-md rounded-b-sm bg-sky-600 text-white flex flex-col items-center justify-center shrink-0 shadow-xs"
                          title={`Insulina Carboidratos: ${formatDecimal(entry.carbDose)} U`}
                        >
                          <span className="text-sm font-bold font-mono leading-none tracking-tight">
                            {formatDecimal(entry.carbDose)}
                          </span>
                          <span className="text-[9px] font-normal leading-none mt-0.5">
                            U
                          </span>
                        </div>

                        {/* 4. Insulin Dose 2 (Correction or Additional Dose) */}
                        {entry.correctionDose > 0 ? (
                          <div
                            className="w-11 h-12 rounded-t-md rounded-b-sm bg-sky-600 text-white flex flex-col items-center justify-center shrink-0 shadow-xs"
                            title={`Insulina Correção: ${formatDecimal(entry.correctionDose)} U`}
                          >
                            <span className="text-sm font-bold font-mono leading-none tracking-tight">
                              {formatDecimal(entry.correctionDose)}
                            </span>
                            <span className="text-[9px] font-normal leading-none mt-0.5">
                              U
                            </span>
                          </div>
                        ) : (
                          /* If no correction, maintain clean spacing */
                          <div className="w-11 h-12 opacity-0 pointer-events-none" />
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
