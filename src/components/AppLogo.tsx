import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number; // Height in pixels for the full logo or width/height for mark
  showSubtitle?: boolean;
  variant?: 'full' | 'mark' | 'header';
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 38,
  showSubtitle = true,
  variant = 'full',
}) => {
  // SVG Graphic Symbol: Cyan-to-Blue Crescent Ring + Teardrop + Plus Sign
  const SymbolGraphic = (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 overflow-visible"
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label="Símbolo EZDT1"
    >
      <defs>
        {/* Outer crescent ring gradient (light cyan-blue to deep royal blue) */}
        <linearGradient id="ezdt1-ring-gradient" x1="85%" y1="15%" x2="15%" y2="85%">
          <stop offset="0%" stopColor="#48b7f8" />
          <stop offset="45%" stopColor="#1e88e5" />
          <stop offset="100%" stopColor="#0046b8" />
        </linearGradient>

        {/* Droplet contour gradient */}
        <linearGradient id="ezdt1-drop-gradient" x1="70%" y1="10%" x2="20%" y2="90%">
          <stop offset="0%" stopColor="#4fc3f7" />
          <stop offset="50%" stopColor="#1e88e5" />
          <stop offset="100%" stopColor="#0250bb" />
        </linearGradient>
      </defs>

      {/* Outer open crescent ring */}
      <path
        d="M 86 34 A 41 41 0 1 0 86 68"
        stroke="url(#ezdt1-ring-gradient)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Inside Droplet Contour */}
      <path
        d="M 50 24 C 47 30 33 46 33 60 C 33 72 40.5 79 50 79 C 59.5 79 67 72 67 60 C 67 46 53 30 50 24 Z"
        stroke="url(#ezdt1-drop-gradient)"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="#ffffff"
      />

      {/* Medical Plus Sign inside the Droplet */}
      <g fill="#0250bb">
        {/* Horizontal bar */}
        <rect x="41" y="56.75" width="18" height="6.5" rx="3.25" />
        {/* Vertical bar */}
        <rect x="46.75" y="51" width="6.5" height="18" rx="3.25" />
      </g>
    </svg>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{SymbolGraphic}</div>;
  }

  // Header variant with clean proportions for navbar
  if (variant === 'header') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {SymbolGraphic}
        <div className="flex flex-col text-left leading-none select-none">
          <div className="flex items-center tracking-tight font-extrabold text-xl sm:text-2xl font-sans">
            <span style={{ color: '#0250bb' }}>EZ</span>
            <span style={{ color: '#229ee6' }}>DT1</span>
          </div>
          {showSubtitle && (
            <span
              className="text-[8.5px] sm:text-[9.5px] font-bold tracking-wider uppercase mt-0.5"
              style={{ color: '#229ee6' }}
            >
              Controlo de Diabetes Tipo 1
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full detailed logo (matches IMG_9511.jpeg)
  return (
    <div className={`inline-flex items-center gap-3 sm:gap-4 ${className}`}>
      {SymbolGraphic}
      <div className="flex flex-col text-left leading-none select-none">
        <div className="flex items-center font-extrabold text-2xl sm:text-3xl tracking-tight font-sans">
          <span style={{ color: '#0250bb' }}>EZ</span>
          <span style={{ color: '#229ee6' }}>DT1</span>
        </div>
        {showSubtitle && (
          <span
            className="text-[9.5px] sm:text-[11px] font-bold tracking-[0.14em] uppercase mt-1"
            style={{ color: '#229ee6' }}
          >
            Controlo de Diabetes Tipo 1
          </span>
        )}
      </div>
    </div>
  );
};
