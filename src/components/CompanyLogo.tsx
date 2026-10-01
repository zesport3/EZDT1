import React from 'react';

interface CompanyLogoProps {
  className?: string;
  size?: number; // width/height for mark
  showFull?: boolean; // whether to show full logo with text
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  className = '', 
  size = 38,
  showFull = true 
}) => {
  // SVG of the exact stylized "N" with the rising arrow and swoosh ribbon from IMG_8831.png
  const SymbolIcon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label="Símbolo L. & D. Nave"
    >
      {/* Outer loop / swoosh curve on the left */}
      <path
        d="M 52 40 C 32 40 18 64 16 92 C 14 116 26 138 38 138 C 48 138 58 126 72 104 L 84 84 L 98 108 C 114 136 128 138 140 126 C 148 118 148 108 140 96 C 128 80 110 92 102 106 C 96 116 90 120 84 116 C 78 112 70 94 62 82 L 48 124 C 42 128 36 124 32 112 C 28 96 36 68 48 52 C 54 44 60 48 60 52 C 60 62 48 94 44 110 C 52 98 62 76 72 64 L 90 92 C 94 84 112 48 130 32 L 126 24 L 154 22 L 150 50 L 140 42 C 122 62 106 94 100 106 L 86 82 L 68 112 C 78 88 88 64 96 46 L 88 42 L 52 40 Z"
        fill="#0f172a"
      />
      {/* The clean high-fidelity vector matching the image */}
      <g fill="#000000">
        {/* Left curve stroke */}
        <path d="M 38 42 C 20 45 10 70 8 98 C 6 120 16 138 28 138 C 38 138 48 126 62 102 L 74 122 C 86 140 106 142 122 130 C 132 122 136 108 128 96 C 120 84 106 88 98 100 C 92 108 86 112 80 104 L 56 68 C 62 58 72 48 84 38 L 124 104 C 118 112 110 116 104 112 L 86 82 L 64 116 C 68 100 76 78 84 62 L 74 58 C 64 74 54 98 48 116 L 36 122 C 28 118 24 102 26 86 C 30 62 44 46 54 44 C 58 43 56 41 38 42 Z" />
        {/* Right arrow upward trend */}
        <path d="M 76 108 L 118 42 L 106 34 L 152 26 L 146 72 L 134 62 L 96 120 Z" />
      </g>
    </svg>
  );

  if (!showFull) {
    return <div className={`inline-flex items-center ${className}`}>{SymbolIcon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Visual icon from logo */}
      <div className="shrink-0 p-1 bg-white rounded-lg border border-sky-100 shadow-2xs">
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          {/* Exact stylized Rising W/N with arrow and loop from user logo */}
          <path
            d="M 28 26 C 18 30 10 46 8 64 C 6 80 14 92 22 92 C 30 92 38 82 48 66 L 56 78 C 64 90 76 92 86 84 C 92 78 94 70 88 62 C 82 54 74 56 68 64 C 64 70 60 72 56 68 L 44 48 C 50 40 58 34 66 26 L 82 52 L 78 38 L 94 18 L 90 44 L 84 38 L 68 62 L 56 44 L 42 66 C 46 54 52 40 58 28 L 50 26 C 42 38 36 54 32 66 L 26 70 C 22 66 20 54 22 44 C 24 32 30 26 36 24 Z"
            fill="#0284c7"
          />
          {/* Distinct accent arrow */}
          <path
            d="M 52 66 L 76 28 L 68 22 L 96 16 L 92 44 L 84 38 L 64 74 Z"
            fill="#0369a1"
          />
        </svg>
      </div>

      {/* Typography: L. & D. Nave */}
      <div className="text-left font-serif leading-none">
        <div className="flex items-center gap-1.5">
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-serif">
            L. & D. Nave
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="w-2.5 h-[1.5px] bg-sky-600 inline-block" />
          <span className="text-[9px] sm:text-[10px] uppercase font-sans font-semibold tracking-wider text-slate-700">
            Gabinete de Contabilidade, Lda
          </span>
        </div>
        <div className="text-[8px] sm:text-[8.5px] uppercase font-sans font-medium text-slate-700 tracking-wider mt-0.5">
          Contabilidade · Fiscalidade · Salários
        </div>
      </div>
    </div>
  );
};
