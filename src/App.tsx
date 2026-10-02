import React, { useState } from 'react';
import { 
  ActiveTab, 
  CalculationResult, 
  HistoryEntry, 
  InsulinSettings, 
  UserProfile 
} from './types';
import { 
  addHistoryEntry, 
  clearAllHistory, 
  deleteHistoryEntry, 
  loadHistory, 
  loadInsulinSettings, 
  loadUserProfile, 
  saveInsulinSettings, 
  saveUserProfile 
} from './utils/storage';
import { Header } from './components/Header';
import { DiaryView } from './components/DiaryView';
import { CalculatorView } from './components/CalculatorView';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { HistoryView } from './components/HistoryView';
import { TestCasesView } from './components/TestCasesView';
import { NewEntryModal } from './components/NewEntryModal';
import { EntryDetailModal } from './components/EntryDetailModal';
import { EmbedGuideModal } from './components/EmbedGuideModal';
import { MedicalDisclaimerModal } from './components/MedicalDisclaimerModal';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('diary');
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile);
  const [settings, setSettings] = useState<InsulinSettings>(loadInsulinSettings);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  // Modals
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<HistoryEntry | null>(null);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isDisclaimerModalOpen, setIsDisclaimerModalOpen] = useState(false);

  // Quick prefill from Test Cases to Calculator
  const [prefilledScenario, setPrefilledScenario] = useState<{
    carbs: number;
    glucose: number;
    meal: any;
  } | null>(null);

  // Sync state changes with storage
  const handleSaveProfile = (newProfile: UserProfile) => {
    saveUserProfile(newProfile);
    setUserProfile(newProfile);
  };

  const handleSaveSettings = (newSettings: InsulinSettings) => {
    saveInsulinSettings(newSettings);
    setSettings(newSettings);
    setActiveTab('diary'); // Passa automaticamente para o início ao guardar
  };

  const handleSaveToHistory = (result: CalculationResult) => {
    const entry: HistoryEntry = {
      ...result,
      savedAt: new Date().toISOString(),
    };
    const updated = addHistoryEntry(entry);
    setHistory(updated);
  };

  const handleDeleteHistoryEntry = (id: string) => {
    const updated = deleteHistoryEntry(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    clearAllHistory();
    setHistory([]);
  };

  const handleRefreshAllData = () => {
    setUserProfile(loadUserProfile());
    setSettings(loadInsulinSettings());
    setHistory(loadHistory());
  };

  const handleLoadScenarioToCalculator = (carbs: number, glucose: number, meal: any) => {
    setPrefilledScenario({ carbs, glucose, meal });
    setActiveTab('calculator');
  };

  // Check if initial parameters need setup
  const isUnconfigured =
    !settings.useScheduleSlots &&
    (settings.singleCarbRatio === null ||
      settings.singleCorrectionFactor === null ||
      settings.singleMinTarget === null ||
      settings.singleMaxTarget === null);

  return (
    <div className="min-h-screen bg-[#f0f7fc] text-slate-900 flex flex-col font-sans">
      
      {/* Header with ONLY + and Settings */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onOpenNewEntryModal={() => setIsNewEntryModalOpen(true)}
      />

      {/* Setup notification banner if parameters not configured */}
      {isUnconfigured && activeTab !== 'settings' && (
        <div className="bg-sky-50 border-b border-sky-200 px-4 py-2.5">
          <div className="max-w-xl md:max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-sky-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                <strong>Atenção:</strong> Falta configurar os parâmetros do teu plano (rácio HC, fator de correção e intervalo alvo).
              </span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="self-start sm:self-center px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer text-xs"
            >
              Configurar Agora
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16 md:pb-8">
        
        {/* TAB 1: DIARY / TENDÊNCIA (Matching the screenshot layout) */}
        {activeTab === 'diary' && (
          <DiaryView
            entries={history}
            settings={settings}
            userProfile={userProfile}
            onOpenNewEntryModal={() => setIsNewEntryModalOpen(true)}
            onSelectEntry={(entry) => setSelectedDetailEntry(entry)}
          />
        )}

        {/* TAB 2: DEDICATED FULL CALCULATOR */}
        {activeTab === 'calculator' && (
          <CalculatorView
            settings={settings}
            userProfile={userProfile}
            history={history}
            onSaveToHistory={handleSaveToHistory}
            onNavigateToSettings={() => setActiveTab('settings')}
            prefilledScenario={prefilledScenario}
            onClearPrefilledScenario={() => setPrefilledScenario(null)}
          />
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onRefreshAllData={handleRefreshAllData}
          />
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <ProfileView profile={userProfile} onSaveProfile={handleSaveProfile} />
        )}

        {/* TAB 5: HISTORY / REPORTS */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onDeleteEntry={handleDeleteHistoryEntry}
            onClearHistory={handleClearHistory}
          />
        )}

        {/* TAB 6: TESTS */}
        {activeTab === 'tests' && (
          <TestCasesView
            settings={settings}
            onLoadScenarioToCalculator={handleLoadScenarioToCalculator}
          />
        )}
      </main>

      {/* Footer with Creator Attribution */}
      <footer className="border-t border-sky-100 bg-white py-4 px-4 text-slate-700 shadow-2xs">
        <div className="max-w-xl mx-auto flex items-center justify-center text-center">
          {/* Creator Attribution */}
          <div className="text-xs font-medium text-slate-600">
            Criado por: <strong className="text-slate-900 font-bold">José Miguel Fernandes Nave</strong>
          </div>
        </div>
      </footer>

      {/* New Entry / Insulin Calculator Modal (+ button) */}
      <NewEntryModal
        isOpen={isNewEntryModalOpen}
        onClose={() => setIsNewEntryModalOpen(false)}
        settings={settings}
        userProfile={userProfile}
        history={history}
        onSaveEntry={handleSaveToHistory}
        onNavigateToSettings={() => {
          setIsNewEntryModalOpen(false);
          setActiveTab('settings');
        }}
      />

      {/* Entry Detail & Math Explanation Modal */}
      <EntryDetailModal
        entry={selectedDetailEntry}
        onClose={() => setSelectedDetailEntry(null)}
        onDelete={handleDeleteHistoryEntry}
      />

      {/* Embed Guide Modal */}
      <EmbedGuideModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
      />

      {/* Medical Disclaimer Modal */}
      <MedicalDisclaimerModal
        isOpen={isDisclaimerModalOpen}
        onClose={() => setIsDisclaimerModalOpen(false)}
      />

    </div>
  );
}
