import React, { useState } from 'react';
import { DiabetesType, UserProfile } from '../types';
import { 
  User, 
  Calendar, 
  HeartHandshake, 
  Phone, 
  Building2, 
  FileText, 
  ShieldCheck, 
  Check, 
  Lock,
  AlertTriangle 
} from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  onSaveProfile: (newProfile: UserProfile) => void;
}

const DIABETES_TYPES: DiabetesType[] = [
  'Tipo 1',
  'Tipo 2',
  'LADA',
  'MODY',
  'Gestacional',
  'Outro',
  'Não especificado',
];

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onSaveProfile }) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-20 md:pb-12">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-sky-100 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-800">
            <User className="w-3.5 h-3.5" />
            <span>Identificação Pessoal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Perfil do Utilizador
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gere as tuas informações clínicas de identificação e contactos de suporte.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="self-start sm:self-center px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Guardar Perfil</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Perfil atualizado com sucesso!</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Details */}
        <div className="bg-white rounded-2xl border border-sky-100 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <span>👤 Dados Pessoais e Diagnóstico</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Nome do Utilizador</label>
              <input
                type="text"
                placeholder=""
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Tipo de Diabetes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Tipo de Diabetes</label>
              <select
                value={formData.diabetesType}
                onChange={(e) => setFormData({ ...formData, diabetesType: e.target.value as DiabetesType })}
                className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
              >
                {DIABETES_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Ano ou data de diagnóstico */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Data ou Ano de Diagnóstico</label>
              <input
                type="text"
                placeholder=""
                value={formData.diagnosedYearOrDate}
                onChange={(e) => setFormData({ ...formData, diagnosedYearOrDate: e.target.value })}
                className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Contacto de emergência */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Contacto de Emergência</label>
              <input
                type="text"
                placeholder=""
                value={formData.emergencyContact || ''}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

          </div>
        </div>

        {/* Clinical / Medical Team Details */}
        <div className="bg-white rounded-2xl border border-sky-100 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🏥 Acompanhamento Médico & Notas Clínicas</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Médico Assistente */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Médico / Endocrinologista</label>
              <input
                type="text"
                placeholder=""
                value={formData.doctorName || ''}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Hospital / Centro de Saúde */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Hospital / Unidade de Saúde</label>
              <input
                type="text"
                placeholder=""
                value={formData.hospitalClinic || ''}
                onChange={(e) => setFormData({ ...formData, hospitalClinic: e.target.value })}
                className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notas Adicionais */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700">
              Informações Pessoais Relevantes & Notas do Plano
            </label>
            <textarea
              rows={3}
              placeholder=""
              value={formData.additionalNotes || ''}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Privacy & Health Data Guarantee Card */}
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-sky-900">
            <Lock className="w-4 h-4 text-sky-600" />
            <span>Privacidade e Segurança dos Teus Dados de Saúde</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Todos os teus dados pessoais, medições de glicemia e histórico de cálculos são guardados <strong>exclusivamente na memória local deste navegador (localStorage)</strong>. Nenhuma informação pessoal ou clínica é transmitida para servidores externos, nuvens de dados terceiras ou sistemas de inteligência artificial.
          </p>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Podes apagar todos os teus dados ou exportar um backup a qualquer momento nas Definições ou no Histórico.</span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 h-12 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Perfil</span>
          </button>
        </div>

      </form>
    </div>
  );
};
