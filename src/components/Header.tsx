import React from 'react';
import { ActiveTab, UserProfile } from '../types';
import { Plus, Settings } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userProfile: UserProfile;
  onOpenNewEntryModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewEntryModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-2xs">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Left: Official EZDT1 Logo matching IMG_9511.jpeg */}
        <button
          onClick={() => setActiveTab('diary')}
          className="text-left flex items-center group focus:outline-none cursor-pointer"
          title="Ir para o Diário EZDT1"
        >
          <AppLogo variant="header" size={32} showSubtitle={true} />
        </button>

        {/* Right: ONLY Settings and the Light Blue + Button */}
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'settings' ? 'diary' : 'settings')}
            title="Configurações"
            aria-label="Configurações"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-sky-100 text-sky-700'
                : 'text-slate-700 hover:text-sky-600 hover:bg-sky-50'
            }`}
          >
            <Settings className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Light Blue + Button */}
          <button
            type="button"
            onClick={onOpenNewEntryModal}
            title="Nova entrada e calcular insulina"
            aria-label="Nova entrada e calcular insulina"
            className="w-10 h-10 rounded-full flex items-center justify-center text-sky-500 hover:bg-sky-50 transition-colors cursor-pointer"
          >
            <Plus className="w-7 h-7 stroke-[2.4]" />
          </button>
        </div>

      </div>
    </header>
  );
};
