import React, { useState, useEffect } from 'react';
import { 
  X, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowUpRight 
} from 'lucide-react';
import { api } from '../services/api';
import type { Card, AnkiStatus } from '../types';

interface AnkiSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  defaultDeckTitle: string;
  ankiStatus: AnkiStatus;
}

export const AnkiSyncModal: React.FC<AnkiSyncModalProps> = ({
  isOpen,
  onClose,
  cards,
  defaultDeckTitle,
  ankiStatus
}) => {
  const [existingDecks, setExistingDecks] = useState<string[]>([]);
  const [targetDeck, setTargetDeck] = useState(defaultDeckTitle);
  const [isCustomDeck, setIsCustomDeck] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; notesAdded: number; deck: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetDeck(defaultDeckTitle);
      setSyncResult(null);
      setErrorMessage(null);

      // Fetch Anki decks if connected
      if (ankiStatus.connected) {
        api.getAnkiDecks()
          .then((decks) => {
            setExistingDecks(decks);
            if (decks.length > 0 && !defaultDeckTitle) {
              setTargetDeck(decks[0]);
              setIsCustomDeck(false);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, defaultDeckTitle, ankiStatus.connected]);

  if (!isOpen) return null;

  const handleSync = async () => {
    if (!targetDeck.trim()) {
      setErrorMessage('Please enter or select a deck name.');
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    setSyncResult(null);

    try {
      const res = await api.syncToAnki({
        target_deck_name: targetDeck.trim(),
        cards
      });

      setSyncResult({
        success: true,
        notesAdded: res.notes_added,
        deck: res.deck_name
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during AnkiConnect sync');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 rounded-3xl bg-[#141622] border border-[#272b3f] shadow-2xl space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1d2133] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Sync with Desktop Anki</h3>
            <p className="text-xs text-slate-400">Direct integration via AnkiConnect (localhost:8765)</p>
          </div>
        </div>

        {/* Anki Connection Status Banner */}
        {!ankiStatus.connected ? (
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-200 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Anki Desktop is not detected</span>
            </div>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              1. Open Anki on your computer.<br />
              2. Ensure the <strong>AnkiConnect</strong> add-on (code <code className="bg-amber-900/60 px-1 rounded font-mono">2055492159</code>) is installed in Tools → Add-ons.<br />
              3. You can still export as a standalone <strong>.apkg</strong> file below without Anki running!
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Connected to Anki v{ankiStatus.version ?? '6'} on desktop!</span>
          </div>
        )}

        {/* Target Deck Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Target Anki Deck
          </label>

          {existingDecks.length > 0 && (
            <div className="flex items-center space-x-3 text-xs mb-2">
              <button
                type="button"
                onClick={() => setIsCustomDeck(false)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  !isCustomDeck
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-[#1a1d2c] border-[#292e42] text-slate-400 hover:text-slate-200'
                }`}
              >
                Existing Deck
              </button>
              <button
                type="button"
                onClick={() => setIsCustomDeck(true)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  isCustomDeck
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-[#1a1d2c] border-[#292e42] text-slate-400 hover:text-slate-200'
                }`}
              >
                New Deck Name
              </button>
            </div>
          )}

          {!isCustomDeck && existingDecks.length > 0 ? (
            <select
              value={targetDeck}
              onChange={(e) => setTargetDeck(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0e1017] border border-[#24293c] text-slate-200 text-sm focus:outline-none focus:border-blue-500"
            >
              {existingDecks.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={targetDeck}
              onChange={(e) => setTargetDeck(e.target.value)}
              placeholder="e.g. Neuroscience::Cellular"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0e1017] border border-[#24293c] text-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          )}

          <p className="text-[11px] text-slate-500">
            If the deck does not exist in Anki, AnkiConnect will automatically create it for you.
          </p>
        </div>

        {/* Sync Success Message */}
        {syncResult && (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-200 space-y-1">
            <div className="flex items-center space-x-2 text-sm font-semibold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Synced Successfully!</span>
            </div>
            <p className="text-xs text-emerald-300/80">
              Added <strong>{syncResult.notesAdded}</strong> cards to deck "<strong>{syncResult.deck}</strong>".
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#222638]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSync}
            disabled={isSyncing || !ankiStatus.connected || cards.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Pushing Cards...</span>
              </>
            ) : (
              <>
                <span>Push {cards.length} Cards to Anki</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
