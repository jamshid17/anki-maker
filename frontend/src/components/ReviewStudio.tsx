import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  FileSpreadsheet, 
  Radio, 
  Play, 
  Check, 
  Edit3, 
  Loader2, 
  ArrowLeft
} from 'lucide-react';
import type { Card, AnkiStatus, CardType } from '../types';
import { api } from '../services/api';
import { FlipMode } from './FlipMode';
import { AnkiSyncModal } from './AnkiSyncModal';

interface ReviewStudioProps {
  initialCards: Card[];
  initialTitle: string;
  source: { type: 'text' | 'url'; content: string };
  ankiStatus: AnkiStatus;
  onReset: () => void;
  onSaveDeck: (savedDeckTitle: string) => void;
}

export const ReviewStudio: React.FC<ReviewStudioProps> = ({
  initialCards,
  initialTitle,
  source,
  ankiStatus,
  onReset,
  onSaveDeck
}) => {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [deckTitle, setDeckTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'flip'>('editor');

  // AI Refinement State
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Saving / Exporting states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Tag input state per card
  const [activeTagInputs, setActiveTagInputs] = useState<{ [index: number]: string }>({});

  // Quick Refine Prompt presets
  const quickPrompts = [
    'Make answers more concise',
    'Convert into cloze deletions',
    'Make questions more atomic',
    'Add bullet points to explanations'
  ];

  // AI Refine Handler
  const handleRefine = async (instructionToUse?: string) => {
    const instruction = instructionToUse || refinePrompt;
    if (!instruction.trim() || isRefining) return;

    setIsRefining(true);
    setRefineError(null);

    try {
      const res = await api.refineCards({
        cards,
        instructions: instruction.trim(),
        deck_title: deckTitle
      });

      setCards(res.cards);
      if (res.deck_title) {
        setDeckTitle(res.deck_title);
      }
      setRefinePrompt('');
    } catch (err: any) {
      setRefineError(err.message || 'Failed to refine cards with AI');
    } finally {
      setIsRefining(false);
    }
  };

  // Card Operations
  const handleCardChange = (index: number, field: keyof Card, value: any) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], [field]: value };
    setCards(updated);
  };

  const handleCardTypeToggle = (index: number) => {
    const current = cards[index].card_type;
    const nextType: CardType = current === 'basic' ? 'cloze' : 'basic';
    handleCardChange(index, 'card_type', nextType);
  };

  const handleDeleteCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const handleAddCard = () => {
    const newCard: Card = {
      card_type: 'basic',
      front: '',
      back: '',
      tags: [],
      order_index: cards.length
    };
    setCards([...cards, newCard]);
  };

  const handleAddTag = (cardIndex: number) => {
    const tagText = (activeTagInputs[cardIndex] || '').trim();
    if (!tagText) return;

    const currentTags = cards[cardIndex].tags || [];
    if (!currentTags.includes(tagText)) {
      handleCardChange(cardIndex, 'tags', [...currentTags, tagText]);
    }
    setActiveTagInputs({ ...activeTagInputs, [cardIndex]: '' });
  };

  const handleRemoveTag = (cardIndex: number, tagToRemove: string) => {
    const currentTags = cards[cardIndex].tags || [];
    handleCardChange(cardIndex, 'tags', currentTags.filter(t => t !== tagToRemove));
  };

  // Save to Library
  const handleSaveToLibrary = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await api.saveDeck({
        title: deckTitle || 'Untitled Deck',
        source_type: source.type,
        source_content: source.content,
        cards
      });
      setSaveSuccess(true);
      onSaveDeck(deckTitle);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save deck');
    } finally {
      setIsSaving(false);
    }
  };

  // Export APKG
  const handleExportApkg = async () => {
    try {
      await api.downloadRawApkg(deckTitle || 'Flashcards', cards);
    } catch (err: any) {
      alert(err.message || 'Export to APKG failed');
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      await api.downloadRawCsv(deckTitle || 'Flashcards', cards);
    } catch (err: any) {
      alert(err.message || 'Export to CSV failed');
    }
  };

  if (viewMode === 'flip') {
    return (
      <FlipMode
        cards={cards}
        deckTitle={deckTitle}
        onExit={() => setViewMode('editor')}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Top Bar: Title, View Switcher & Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-[#131520] border border-[#222638] shadow-lg">
        
        {/* Left: Back & Editable Title */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={onReset}
            title="Create another deck"
            className="p-2 rounded-xl bg-[#1b1e2c] hover:bg-[#25293d] border border-[#272b3f] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 md:flex-initial">
            {isEditingTitle ? (
              <input
                type="text"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="text-lg font-bold bg-[#0e1017] px-3 py-1 rounded-xl border border-blue-500 text-white focus:outline-none w-full md:w-80"
              />
            ) : (
              <div 
                className="flex items-center space-x-2 group cursor-pointer"
                onClick={() => setIsEditingTitle(true)}
              >
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                  {deckTitle}
                </h2>
                <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium">
                  {cards.length} cards
                </span>
              </div>
            )}
            <p className="text-xs text-slate-400">
              Source: <span className="capitalize">{source.type}</span> • Click card text to inline edit
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end flex-wrap gap-y-2">
          
          {/* Flip Mode Preview Button */}
          <button
            onClick={() => setViewMode('flip')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-400" />
            <span>Test in Flip Mode</span>
          </button>

          {/* Sync to Anki */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-medium transition-all"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Sync to Anki</span>
          </button>

          {/* Export APKG */}
          <button
            onClick={handleExportApkg}
            title="Download .apkg file"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#1b1e2c] hover:bg-[#25293d] border border-[#272b3f] text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.apkg</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            title="Download CSV"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#1b1e2c] hover:bg-[#25293d] border border-[#272b3f] text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {/* Save to Library */}
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Saved!</span>
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Library</span>
              </>
            )}
          </button>

        </div>

      </div>

      {/* AI Refinement Studio Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#131520] border border-blue-900/30 shadow-lg space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>AI Refinement Bar</span>
          <span className="text-slate-500 font-normal">• Instruct Gemini to transform the entire deck</span>
        </div>

        {/* Preset quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {quickPrompts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleRefine(preset)}
              disabled={isRefining}
              className="px-2.5 py-1 rounded-lg bg-[#1b1e2c] hover:bg-[#262b3e] border border-[#2a3047] text-slate-300 hover:text-white text-xs transition-colors disabled:opacity-50"
            >
              + {preset}
            </button>
          ))}
        </div>

        {/* Custom refinement input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
            disabled={isRefining}
            placeholder="Type custom instruction (e.g. 'Make card 2 simpler', 'Add examples to backs', 'Remove acronyms')..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#0e1017] border border-[#24293c] text-slate-200 placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={() => handleRefine()}
            disabled={isRefining || !refinePrompt.trim()}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shrink-0"
          >
            {isRefining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Refine</span>
          </button>
        </div>

        {refineError && (
          <p className="text-xs text-red-400">{refineError}</p>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#141622] border border-[#222638] hover:border-[#2f354f] transition-all flex flex-col justify-between space-y-4 shadow-md group"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-[#1c2030] text-slate-400 text-xs font-mono font-medium flex items-center justify-center">
                  #{idx + 1}
                </span>

                {/* Card Type Badge & Toggle */}
                <button
                  type="button"
                  onClick={() => handleCardTypeToggle(idx)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border transition-colors ${
                    card.card_type === 'cloze'
                      ? 'bg-purple-950/60 text-purple-300 border-purple-800/50 hover:bg-purple-900/60'
                      : 'bg-blue-950/60 text-blue-300 border-blue-800/50 hover:bg-blue-900/60'
                  }`}
                  title="Click to toggle Basic / Cloze"
                >
                  {card.card_type === 'cloze' ? 'Cloze' : 'Basic'}
                </button>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDeleteCard(idx)}
                className="opacity-40 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-all"
                title="Delete Card"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Front Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {card.card_type === 'cloze' ? 'Cloze Text (use {{c1::keyword}})' : 'Question (Front)'}
              </label>
              <textarea
                rows={2}
                value={card.front}
                onChange={(e) => handleCardChange(idx, 'front', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0e1017] border border-[#24293c] text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500 resize-y"
              />
            </div>

            {/* Back Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {card.card_type === 'cloze' ? 'Extra Explanation (Back)' : 'Answer (Back)'}
              </label>
              <textarea
                rows={2}
                value={card.back}
                onChange={(e) => handleCardChange(idx, 'back', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0e1017] border border-[#24293c] text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-blue-500 resize-y"
              />
            </div>

            {/* Tags Section */}
            <div className="pt-2 border-t border-[#1e2233] space-y-2">
              <div className="flex items-center flex-wrap gap-1.5">
                {(card.tags || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#1c2030] text-slate-400 text-[10px]"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx, t)}
                      className="hover:text-red-400 text-slate-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Tag Input */}
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={activeTagInputs[idx] || ''}
                  onChange={(e) => setActiveTagInputs({ ...activeTagInputs, [idx]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag(idx)}
                  placeholder="+ tag (press Enter)"
                  className="px-2.5 py-1 rounded-lg bg-[#0e1017] border border-[#24293c] text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

          </div>
        ))}

        {/* Add Card Tile */}
        <button
          type="button"
          onClick={handleAddCard}
          className="min-h-[220px] rounded-2xl border-2 border-dashed border-[#24293c] hover:border-blue-500/50 hover:bg-blue-600/5 transition-all flex flex-col items-center justify-center space-y-2 text-slate-400 hover:text-blue-400 p-6"
        >
          <div className="w-10 h-10 rounded-full bg-[#1b1e2c] flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Add Custom Card</span>
        </button>

      </div>

      {/* Anki Sync Modal */}
      <AnkiSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        cards={cards}
        defaultDeckTitle={deckTitle}
        ankiStatus={ankiStatus}
      />

    </div>
  );
};
