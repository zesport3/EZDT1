import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code } from 'lucide-react';

interface EmbedGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedGuideModal: React.FC<EmbedGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;
  const embedCode = `<iframe 
  src="${currentUrl}" 
  width="100%" 
  height="900" 
  style="border: 0; border-radius: 16px; overflow: hidden; max-width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" 
  title="Calculadora de Insulina Personalizada"
  allow="clipboard-write">
</iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Code className="w-5 h-5 text-sky-600" />
            <span>Incorporar no Google Sites</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Podes integrar esta calculadora diretamente numa página do Google Sites através de um bloco de incorporação iframe.
        </p>

        {/* Step by step guide */}
        <div className="space-y-2 text-xs text-slate-700 bg-sky-50/60 p-3.5 rounded-xl border border-sky-100">
          <div className="font-bold text-sky-900">Passos para o Google Sites:</div>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Abre o teu projeto no <strong>Google Sites</strong> em modo de edição.</li>
            <li>No painel lateral direito, clica em <strong>"Inserir"</strong> &gt; <strong>"Incorporar"</strong>.</li>
            <li>Escolhe o separador <strong>"Incorporar código"</strong> (ou "Por URL").</li>
            <li>Cola o código HTML abaixo e clica em <strong>"Seguinte"</strong> e <strong>"Inserir"</strong>.</li>
            <li>Ajusta o tamanho do bloco na página como preferires.</li>
          </ol>
        </div>

        {/* Code Block */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Código de Incorporação (HTML)</span>
            <button
              onClick={handleCopy}
              className="text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-tight select-all">
            {embedCode}
          </pre>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
