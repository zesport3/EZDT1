import React from 'react';
import { X, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

interface MedicalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MedicalDisclaimerModal: React.FC<MedicalDisclaimerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Aviso de Segurança e Informação Clínica</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
            ⚠️ <strong>Aviso Importante:</strong> Esta aplicação é estritamente uma ferramenta de apoio ao cálculo numérico. Não constitui aconselhamento médico e não substitui a orientação do teu médico, endocrinologista ou equipa de saúde.
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs">Princípios de Funcionamento:</h4>
            
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong>Sem Parâmetros Inventados:</strong> Todos os fatores de correção, rácios de hidratos e intervalos alvo derivam 100% dos valores introduzidos por ti nas configurações.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong>Sem Insulina Ativa (Zero IOB):</strong> Por desenho estrito de segurança, a aplicação não deduz qualquer valor de insulina ativa de injeções anteriores.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong>Sem Algoritmos Ocultos ou Aprendizagem Automática:</strong> A matemática é linear, previsível e apresentada passo-a-passo.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong>Privacidade Local:</strong> Os teus dados não saem do teu navegador. Não há ligação a servidores externos de saúde.
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
            Em caso de sintomas de hipoglicemia (tremores, suores, confusão, tonturas) ou valores inferiores a 70 mg/dL, trata imediatamente a hipoglicemia com hidratos de absorção rápida (regra dos 15g) de acordo com o teu plano de emergência médica.
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Compreendi e Aceito
          </button>
        </div>
      </div>
    </div>
  );
};
