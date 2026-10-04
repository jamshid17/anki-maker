import React from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';

interface GeminiKeyNoticeProps {
  onRefresh: () => void;
}

export const GeminiKeyNotice: React.FC<GeminiKeyNoticeProps> = ({ onRefresh }) => {
  return (
    <div className="mb-6 p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-amber-900/40 text-amber-400 mt-0.5 sm:mt-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-300">Google Gemini API Key Needed</h4>
            <p className="text-xs text-amber-300/80 mt-0.5">
              Set <code className="bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-200 font-mono text-[11px]">GEMINI_API_KEY=AIzaSy...</code> in your <code className="bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-200 font-mono text-[11px]">backend/.env</code> file.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors"
          >
            <span>Get Free Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
          >
            Reload Key
          </button>
        </div>
      </div>
    </div>
  );
};
