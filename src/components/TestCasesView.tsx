import React, { useState } from 'react';
import { InsulinSettings } from '../types';
import { calculateInsulinDose } from '../utils/calculator';
import { FlaskConical, Play, CheckCircle2, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

interface TestCasesViewProps {
  settings: InsulinSettings;
  onLoadScenarioToCalculator: (carbs: number, glucose: number, meal: any) => void;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  carbs: number;
  glucose: number;
  meal: string;
  expectedBehavior: string;
  rationale: string;
}

export const TestCasesView: React.FC<TestCasesViewProps> = ({
  settings,
  onLoadScenarioToCalculator,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario_1');

  const scenarios: Scenario[] = [
    {
      id: 'scenario_1',
      title: 'Cenário 1: Refeição com Glicemia no Alvo',
      description: 'Ingestão de 60g de hidratos de carbono com glicemia de 115 mg/dL (dentro do intervalo alvo).',
      carbs: 60,
      glucose: 115,
      meal: 'Almoço',
      expectedBehavior: 'Dose calculada apenas para os hidratos ingeridos. Dose de correção deve ser 0.0 U.',
      rationale: 'Quando a glicemia está dentro do intervalo alvo configurado, nenhuma unidade adicional de correção é necessária.',
    },
    {
      id: 'scenario_2',
      title: 'Cenário 2: Hiperglicemia Moderada antes da Refeição',
      description: 'Ingestão de 45g de hidratos com glicemia de 220 mg/dL (acima do limite máximo configurado).',
      carbs: 45,
      glucose: 220,
      meal: 'Jantar',
      expectedBehavior: 'Soma da dose de hidratos com a dose de correção calculada a partir do fator de correção.',
      rationale: 'A insulina total deve cobrir tanto os hidratos a consumir como a redução da glicemia elevada até ao intervalo seguro.',
    },
    {
      id: 'scenario_3',
      title: 'Cenário 3: Correção Isolada sem Consumo de Alimentos',
      description: 'Glicemia de 250 mg/dL 3 horas após a refeição, com 0g de hidratos de carbono.',
      carbs: 0,
      glucose: 250,
      meal: 'Correção sem refeição',
      expectedBehavior: 'Dose para hidratos = 0.0 U. O cálculo fornece apenas a insulina de correção.',
      rationale: 'Corrige a glicemia elevada sem somar dose alimentar.',
    },
    {
      id: 'scenario_4',
      title: 'Cenário 4: Glicemia Baixa / Alerta de Hipoglicemia',
      description: 'Glicemia de 65 mg/dL antes do pequeno-almoço com 40g de hidratos.',
      carbs: 40,
      glucose: 65,
      meal: 'Pequeno-almoço',
      expectedBehavior: 'Apresenta alerta visual de hipoglicemia e 0 U de correção (não deduz automaticamente sem orientação médica).',
      rationale: 'Evita a administração de insulina de correção em situações de hipoglicemia e alerta para tratamento imediato da baixa de açúcar.',
    },
    {
      id: 'scenario_5',
      title: 'Cenário 5: Verificação de Arredondamento e Incremento',
      description: 'Refeição de 27g de hidratos com glicemia de 165 mg/dL.',
      carbs: 27,
      glucose: 165,
      meal: 'Lanche',
      expectedBehavior: 'Verificação do arredondamento matemático para o incremento configurado (ex: 0.5 U ou 1.0 U).',
      rationale: 'Garante que a caneta ou bomba recebe uma dose executável conforme a graduação mecânica do dispositivo.',
    },
  ];

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  // Run calculation simulation on current settings
  const simulated = calculateInsulinDose(
    {
      meal: currentScenario.meal as any,
      carbs: currentScenario.carbs,
      currentGlucose: currentScenario.glucose,
      calculationTime: '13:00',
    },
    settings
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-20 md:pb-12">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-sky-100 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-800">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>#CasosDeTeste & Verificação Clínica</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Ambiente de Simulação e Validação
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Testa cenários comuns com os teus parâmetros antes de utilizares a calculadora com dados do dia-a-dia. Confirma se os resultados batem certo com o teu método de cálculo.
        </p>
      </div>

      {/* Scenario Selector & Live Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Scenario List */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Seleciona o Cenário
          </div>
          {scenarios.map((sc) => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                  isSelected
                    ? 'bg-sky-50/90 border-sky-400 text-sky-950 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">{sc.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {sc.glucose} mg/dL · {sc.carbs}g HC
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Simulation Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">{currentScenario.title}</h2>
                <div className="text-xs text-slate-500 mt-0.5">{currentScenario.description}</div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onLoadScenarioToCalculator(
                    currentScenario.carbs,
                    currentScenario.glucose,
                    currentScenario.meal
                  )
                }
                className="self-start sm:self-center px-3.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Testar na Calculadora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expected Behavior */}
            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">Comportamento Esperado:</div>
              <div className="text-slate-700">{currentScenario.expectedBehavior}</div>
              <div className="text-[11px] text-slate-500 mt-1 italic">
                {currentScenario.rationale}
              </div>
            </div>

            {/* Simulation with user's active parameters */}
            <div className="pt-2 space-y-3">
              <div className="text-xs font-bold text-slate-900">
                Resultado com os Teus Parâmetros Configurados:
              </div>

              {simulated.errors.length > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Falta configurar parâmetros para efetuar a simulação:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5">
                    {simulated.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : simulated.result ? (
                <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-600">Dose Final Simulada:</div>
                    <div className="text-2xl font-bold font-mono text-sky-900 tabular-nums">
                      {simulated.result.finalRoundedDose} U
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[11px] text-slate-500">Dose Hidratos ({currentScenario.carbs}g)</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {simulated.result.carbDose} U
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[11px] text-slate-500">Correção ({currentScenario.glucose} mg/dL)</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {simulated.result.correctionDose} U
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    {simulated.result.explanation.roundingExplanation}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Zero IOB confirmation */}
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Restrição respeitada: nenhum desconto de insulina ativa (IOB) é executado.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
