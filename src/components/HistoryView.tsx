import React, { useState, useMemo } from 'react';
import { HistoryEntry, MealType } from '../types';
import { 
  History, 
  Trash2, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Activity, 
  Clock, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { exportHistoryAsCSV } from '../utils/storage';

interface HistoryViewProps {
  history: HistoryEntry[];
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onDeleteEntry,
  onClearHistory,
}) => {
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filtered entries
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesMeal = selectedMealFilter === 'all' || item.meal === selectedMealFilter;
      const matchesSearch =
        searchQuery === '' ||
        item.formattedDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.formattedTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.meal.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMeal && matchesSearch;
    });
  }, [history, selectedMealFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const avgGlucose = Math.round(
      history.reduce((acc, curr) => acc + curr.currentGlucose, 0) / history.length
    );
    const avgCarbs = Math.round(
      history.reduce((acc, curr) => acc + curr.carbs, 0) / history.length
    );
    const totalDoses = Number(
      history.reduce((acc, curr) => acc + curr.finalRoundedDose, 0).toFixed(1)
    );
    return { avgGlucose, avgCarbs, totalDoses, count: history.length };
  }, [history]);

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const csv = exportHistoryAsCSV(history);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezdt1_historico_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-20 md:pb-12">
      {/* Title & Actions */}
      <div className="bg-white rounded-2xl border border-sky-100 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-800">
            <History className="w-3.5 h-3.5" />
            <span>Registo Cronológico</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Histórico de Cálculos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Consulta os cálculos efetuados anteriormente. O histórico não altera os parâmetros configurados.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clearing History */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <AlertCircle className="w-5 h-5" />
              <span>Limpar Histórico?</span>
            </div>
            <p className="text-xs text-slate-600">
              Esta ação apagará todos os registos guardados no navegador. Os parâmetros configurados não serão afetados.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Total de Cálculos</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
              {stats.count}
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Média de Glicemia</div>
            <div className="text-xl font-bold font-mono text-sky-700 mt-0.5 tabular-nums">
              {stats.avgGlucose} <span className="text-xs font-normal text-slate-500">mg/dL</span>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Média de Hidratos</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
              {stats.avgCarbs} <span className="text-xs font-normal text-slate-500">g HC</span>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Total Doses Calculadas</div>
            <div className="text-xl font-bold font-mono text-sky-950 mt-0.5 tabular-nums">
              {stats.totalDoses} <span className="text-xs font-normal text-slate-500">U</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {history.length > 0 && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Meal Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {['all', 'Pequeno-almoço', 'Almoço', 'Lanche', 'Jantar', 'Ceia / Noite'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedMealFilter(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedMealFilter === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {cat === 'all' ? 'Todas' : cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 mx-auto flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div className="text-base font-semibold text-slate-800">
            {history.length === 0 ? 'Ainda não existem cálculos registados' : 'Nenhum cálculo corresponde aos filtros'}
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {history.length === 0
              ? 'Faz o teu primeiro cálculo no ecrã principal e clica em "Guardar no Histórico" para o consultar aqui.'
              : 'Tenta alterar o termo de pesquisa ou selecionar outra refeição.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-sky-200 transition-colors shadow-xs overflow-hidden"
              >
                {/* Main Row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-800 flex flex-col items-center justify-center shrink-0 border border-sky-100 font-mono font-bold text-xs">
                      {item.meal.includes('Pequeno')
                        ? 'PA'
                        : item.meal.includes('Almoço')
                        ? 'ALM'
                        : item.meal.includes('Jantar')
                        ? 'JAN'
                        : item.meal.includes('Lanche')
                        ? 'LAN'
                        : item.meal.includes('Ceia')
                        ? 'CEI'
                        : item.meal.includes('Correção')
                        ? 'COR'
                        : item.meal.slice(0, 3).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-sky-900 bg-sky-100/70 px-2 py-0.5 rounded-md border border-sky-200/60">
                          {item.meal}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">·</span>
                        <span className="text-xs text-slate-500 font-mono">{item.formattedDate} às {item.formattedTime}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                        <span>Glicemia: <strong className="font-mono text-slate-900">{item.currentGlucose} mg/dL</strong></span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>Hidratos: <strong className="font-mono text-slate-900">{item.carbs}g</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Dose Pill & Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Dose Calculada</div>
                      <div className="text-lg font-bold font-mono text-sky-800 tabular-nums">
                        {item.finalRoundedDose} U
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEntry(item.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Apagar registo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="p-1 text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100 text-xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <div className="font-semibold text-slate-900">Dose para Hidratos:</div>
                        <div className="font-mono text-[11px] text-slate-600 mt-0.5">
                          {item.explanation.carbCalculationText}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <div className="font-semibold text-slate-900">Correção de Glicemia:</div>
                        <div className="font-mono text-[11px] text-slate-600 mt-0.5">
                          {item.explanation.correctionCalculationText}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 font-mono">
                      <div>
                        Arredondamento: {item.explanation.roundingExplanation}
                      </div>
                      <div>
                        Insulina: {item.appliedInsulinName} · Passo: {item.appliedIncrement} U
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
