import React from 'react';
import { Layers, Sparkles, RefreshCw, Radio, CheckCircle2, AlertCircle } from 'lucide-react';
import type { SettingsStatus, AnkiStatus } from '../types';

interface NavbarProps {
  currentTab: 'studio' | 'library';
  onTabChange: (tab: 'studio' | 'library') => void;
  settings: SettingsStatus | null;
  ankiStatus: AnkiStatus;
  onRefreshStatus: () => void;
  savedDeckCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  settings,
  ankiStatus,
  onRefreshStatus,
  savedDeckCount
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#222638] bg-[#0d0f17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('studio')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#12141f] rounded-[11px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-lg tracking-tight text-white">Anki Maker</span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal">AI Flashcard Studio</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center p-1 bg-[#161824] rounded-xl border border-[#272b3f]">
          <button
            onClick={() => onTabChange('studio')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'studio'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2334]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => onTabChange('library')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'library'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2334]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Library</span>
            {savedDeckCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                currentTab === 'library' ? 'bg-blue-800 text-blue-100' : 'bg-[#2a2f45] text-slate-300'
              }`}>
                {savedDeckCount}
              </span>
            )}
          </button>
        </nav>

        {/* Integration Badges */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Gemini Status */}
          <div 
            title={settings?.gemini_configured ? `Gemini Active (${settings.gemini_model})` : 'Set GEMINI_API_KEY in backend/.env'}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              settings?.gemini_configured
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                : 'bg-amber-950/40 text-amber-400 border-amber-800/40 animate-pulse'
            }`}
          >
            {settings?.gemini_configured ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{settings?.gemini_configured ? 'Gemini Ready' : 'Key Missing'}</span>
          </div>

          {/* AnkiConnect Status */}
          <div 
            title={ankiStatus.connected ? 'AnkiConnect Connected (localhost:8765)' : 'Start Anki with AnkiConnect add-on to enable direct sync'}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
              ankiStatus.connected
                ? 'bg-blue-950/40 text-blue-400 border-blue-800/40'
                : 'bg-slate-900/60 text-slate-400 border-slate-800'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${ankiStatus.connected ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{ankiStatus.connected ? 'Anki Desktop' : 'Anki Offline'}</span>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={onRefreshStatus}
            title="Refresh status"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1b1e2c] border border-transparent hover:border-[#282d42] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
