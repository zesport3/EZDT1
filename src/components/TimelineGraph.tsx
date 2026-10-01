import React, { useMemo, useRef, useState } from 'react';
import { HistoryEntry } from '../types';
import { groupHistoryByDays } from '../utils/dateGrouping';

interface TimelineGraphProps {
  entries: HistoryEntry[];
  targetMin?: number;
  targetMax?: number;
  onSelectEntry?: (entry: HistoryEntry) => void;
}

export const TimelineGraph: React.FC<TimelineGraphProps> = ({
  entries,
  targetMin = 70,
  targetMax = 180,
  onSelectEntry,
}) => {
  // Graph height and boundaries
  const graphHeight = 180;
  const paddingTop = 16;
  const paddingBottom = 16;
  const usableHeight = graphHeight - paddingTop - paddingBottom;
  const maxGlucose = 300;
  const minGlucose = 0;

  // Group entries by day to allow sideways dragging between days
  const dayGroups = useMemo(() => {
    const groups = groupHistoryByDays(entries);
    if (groups.length === 0) {
      return [
        {
          dateKey: new Date().toISOString().slice(0, 10),
          displayLabel: 'Hoje',
          rawDate: new Date(),
          entries: [],
        },
      ];
    }
    return groups;
  }, [entries]);

  // Current active day index (0 = most recent, 1 = previous day, etc.)
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const currentDayGroup = dayGroups[Math.min(activeDayIdx, dayGroups.length - 1)] || dayGroups[0];
  const dayEntries = currentDayGroup.entries;

  // Touch and mouse drag states for sideways swiping
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startXRef = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startXRef.current;
    setDragOffset(diff);
  };

  const handlePointerEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Dragged to the right (> 45px) -> go to previous day
    if (dragOffset > 45 && activeDayIdx < dayGroups.length - 1) {
      setActiveDayIdx((prev) => prev + 1);
    }
    // Dragged to the left (< -45px) -> go to newer day
    else if (dragOffset < -45 && activeDayIdx > 0) {
      setActiveDayIdx((prev) => prev - 1);
    }
    setDragOffset(0);
  };

  // Convert glucose value to exact Y pixel position (300 at top, 0 at bottom)
  const getY = (val: number) => {
    const clamped = Math.max(minGlucose, Math.min(maxGlucose, val));
    const ratio = (maxGlucose - clamped) / (maxGlucose - minGlucose);
    return paddingTop + ratio * usableHeight;
  };

  // Convert time "HH:mm" to X percentage (0% at 00:00 to 100% at 24:00)
  const getX = (timeStr: string) => {
    const [h, m] = (timeStr || '12:00').split(':').map((v) => parseInt(v, 10) || 0);
    const totalMinutes = Math.max(0, Math.min(24 * 60, h * 60 + m));
    return (totalMinutes / (24 * 60)) * 100;
  };

  const yTargetMax = getY(targetMax);

  // Chronological sort for the trend line
  const chronologicalEntries = [...dayEntries].sort((a, b) => {
    const [ah, am] = (a.formattedTime || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
    const [bh, bm] = (b.formattedTime || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
    return ah * 60 + am - (bh * 60 + bm);
  });

  // SVG polyline points for the connecting trend curve
  const polylinePoints = chronologicalEntries
    .map((e) => `${getX(e.formattedTime)},${getY(e.currentGlucose)}`)
    .join(' ');

  return (
    <div className="bg-white border-b border-sky-100 relative select-none">
      
      {/* Top micro-bar with date context & day navigation */}
      <div className="px-3 py-1.5 bg-sky-50/50 border-b border-sky-100/70 flex items-center justify-between text-xs text-slate-600">
        <button
          type="button"
          onClick={() => setActiveDayIdx((prev) => Math.min(dayGroups.length - 1, prev + 1))}
          disabled={activeDayIdx >= dayGroups.length - 1}
          className="px-2 py-0.5 rounded-lg text-slate-700 hover:bg-sky-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold flex items-center gap-0.5 transition-colors cursor-pointer text-xs"
          title="Ver dia anterior"
        >
          ‹ Anterior
        </button>

        <div className="flex items-center gap-1.5 font-medium">
          <span className="font-bold text-slate-800">
            {currentDayGroup.displayLabel}
          </span>
          {dayEntries.length > 0 ? (
            <span className="text-emerald-700 font-mono text-[10px] font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full">
              {dayEntries.length} {dayEntries.length === 1 ? 'leitura' : 'leituras'}
            </span>
          ) : (
            <span className="text-slate-400 text-[10px]">Sem leituras</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setActiveDayIdx((prev) => Math.max(0, prev - 1))}
          disabled={activeDayIdx <= 0}
          className="px-2 py-0.5 rounded-lg text-slate-700 hover:bg-sky-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold flex items-center gap-0.5 transition-colors cursor-pointer text-xs"
          title="Ver dia seguinte"
        >
          Seguinte ›
        </button>
      </div>

      {/* Main Canvas Area with Drag to Side Gesture Support */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
        style={{
          height: `${graphHeight}px`,
        }}
        title="Arrasta para o lado para ver outros dias"
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translateX(${dragOffset * 0.35}px)`,
            transition: isDragging ? 'none' : 'transform 0.25s ease-out',
          }}
        >
          {/* Faixa Amarela Superior: targetMax a 250 */}
          <div
            className="absolute left-0 right-11 bg-amber-50/50 pointer-events-none"
            style={{
              top: `${getY(250)}px`,
              height: `${Math.max(0, yTargetMax - getY(250))}px`,
            }}
          />

          {/* Faixa Verde Alvo (85 até targetMax) */}
          <div
            className="absolute left-0 right-11 bg-emerald-50/70 border-y border-emerald-200/70 pointer-events-none transition-all"
            style={{
              top: `${yTargetMax}px`,
              height: `${Math.max(0, getY(85) - yTargetMax)}px`,
            }}
          />

          {/* Faixa Amarela Inferior (70 a 85) */}
          <div
            className="absolute left-0 right-11 bg-amber-50/50 pointer-events-none"
            style={{
              top: `${getY(85)}px`,
              height: `${Math.max(0, getY(70) - getY(85))}px`,
            }}
          />

          {/* Faixa Vermelha Inferior: < 70 */}
          <div
            className="absolute left-0 right-11 bg-rose-50/40 pointer-events-none"
            style={{
              top: `${getY(70)}px`,
              height: `${Math.max(0, usableHeight + paddingTop - getY(70))}px`,
            }}
          />

          {/* Linha 250 mg/dL (Vermelho Lisa - sem ponteado) */}
          <div
            className="absolute left-0 right-11 border-b-2 border-solid border-rose-500 pointer-events-none"
            style={{ top: `${getY(250)}px` }}
          />

          {/* Linha 70 mg/dL (Vermelho Lisa - sem ponteado) */}
          <div
            className="absolute left-0 right-11 border-b-2 border-solid border-rose-500 pointer-events-none"
            style={{ top: `${getY(70)}px` }}
          />

          {/* Plotting Area with precise left and right margins */}
          <div className="absolute top-0 bottom-0 left-4 right-11 pointer-events-none">
            
            {/* Connecting trend line between points */}
            {chronologicalEntries.length > 1 && (
              <svg
                className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                viewBox={`0 0 100 ${graphHeight}`}
                preserveAspectRatio="none"
              >
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.6"
                />
              </svg>
            )}

            {/* Glucose Values Placed Exactly at their Correct (X, Y) Coordinates */}
            {dayEntries.map((entry) => {
              const xPercent = getX(entry.formattedTime);
              const yGlucose = getY(entry.currentGlucose);
              
              // Color logic:
              // < 70: Vermelho
              // 70 a 85: Amarelo
              // 85 a targetMax (ex: 180): Verde
              // > targetMax e < 250: Amarelo
              // >= 250: Vermelho
              let badgeColorClass = 'bg-emerald-500 ring-2 ring-emerald-300 text-white font-bold';
              if (entry.currentGlucose < 70) {
                badgeColorClass = 'bg-rose-600 ring-2 ring-rose-400 text-white font-bold';
              } else if (entry.currentGlucose < 85) {
                badgeColorClass = 'bg-amber-400 ring-2 ring-amber-300 text-amber-950 font-bold';
              } else if (entry.currentGlucose <= targetMax) {
                badgeColorClass = 'bg-emerald-500 ring-2 ring-emerald-300 text-white font-bold';
              } else if (entry.currentGlucose < 250) {
                badgeColorClass = 'bg-amber-500 ring-2 ring-amber-300 text-white font-bold';
              } else {
                badgeColorClass = 'bg-rose-600 ring-2 ring-rose-400 text-white font-bold';
              }

              return (
                <div
                  key={entry.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectEntry) onSelectEntry(entry);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto z-10 transition-transform hover:scale-115"
                  style={{
                    left: `${xPercent}%`,
                    top: `${yGlucose}px`,
                  }}
                  title={`${entry.meal} às ${entry.formattedTime}: ${entry.currentGlucose} mg/dL`}
                >
                  {/* Value Badge placed strictly at the mathematical Y coordinate */}
                  <div
                    className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shadow-sm flex items-center justify-center border-2 border-white select-none transition-shadow group-hover:shadow-md ${badgeColorClass}`}
                  >
                    {entry.currentGlucose}
                  </div>

                  {/* Floating tooltip showing meal and time */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 font-medium shadow-md">
                    {entry.meal} · {entry.formattedTime}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Y-Axis Scale Values — Perfectly mapped to the same getY coordinates */}
          <div className="absolute right-0 top-0 bottom-0 w-11 pointer-events-none text-right pr-2">
            {[300, 250, targetMax, 85, 70, 0].map((val) => {
              const isRed = val === 250 || val === 70;
              const isYellow = val === targetMax;
              const isGreen = val === 85;
              return (
                <div
                  key={val}
                  className="absolute right-2 -translate-y-1/2 text-[10px] font-mono leading-none flex items-center gap-1"
                  style={{ top: `${getY(val)}px` }}
                >
                  <span
                    className={
                      isRed
                        ? 'font-bold text-rose-600'
                        : isGreen
                        ? 'font-bold text-emerald-600'
                        : isYellow
                        ? 'font-bold text-amber-600'
                        : 'text-slate-400 font-medium'
                    }
                  >
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time Axis Bar (00:00, 06:00, 12:00, 18:00, 24:00) */}
      <div className="border-t border-sky-100 bg-sky-50/30 pl-4 pr-11 py-1 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <div className="flex flex-col items-center">
          <div className="w-[1px] h-1.5 bg-sky-300 mb-0.5" />
          <span>00:00</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[1px] h-1.5 bg-sky-300 mb-0.5" />
          <span>06:00</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[1px] h-1.5 bg-sky-300 mb-0.5" />
          <span>12:00</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[1px] h-1.5 bg-sky-300 mb-0.5" />
          <span>18:00</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[1px] h-1.5 bg-sky-300 mb-0.5" />
          <span>24:00</span>
        </div>
      </div>
    </div>
  );
};
