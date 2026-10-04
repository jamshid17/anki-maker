import React, { useState } from 'react';
import { 
  Globe, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  Sliders, 
  FileCheck2
} from 'lucide-react';
import { api } from '../services/api';
import type { GenerateCardsRequest, Card } from '../types';

interface CreateStudioProps {
  onCardsGenerated: (cards: Card[], deckTitle: string, source: { type: 'text' | 'url'; content: string }) => void;
  isConfigured: boolean;
}

export const CreateStudio: React.FC<CreateStudioProps> = ({ onCardsGenerated, isConfigured }) => {
  const [sourceType, setSourceType] = useState<'text' | 'url'>('text');
  const [rawText, setRawText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<{ title: string; content: string; wordCount: number } | null>(null);
  
  // Options
  const [cardFormat, setCardFormat] = useState<'mixed' | 'basic' | 'cloze'>('mixed');
  const [cardQuantity, setCardQuantity] = useState<number>(10);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // URL Extract Handler
  const handleExtractUrl = async () => {
    if (!urlInput.trim()) return;
    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const data = await api.extractUrl(urlInput.trim());
      setExtractedData({
        title: data.title,
        content: data.content,
        wordCount: data.word_count
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to extract content from URL');
    } finally {
      setIsExtracting(false);
    }
  };

  // Generate Flashcards Handler
  const handleGenerate = async () => {
    const activeContent = sourceType === 'url' ? extractedData?.content : rawText;

    if (!activeContent || activeContent.trim().length < 20) {
      setErrorMessage('Please provide sufficient text content (at least a couple of sentences) to generate flashcards.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const req: GenerateCardsRequest = {
        content: activeContent.trim(),
        source_type: sourceType,
        source_url: sourceType === 'url' ? urlInput : undefined,
        format: cardFormat,
        quantity: cardQuantity,
        custom_prompt: customPrompt.trim() ? customPrompt.trim() : undefined
      };

      const result = await api.generateCards(req);

      onCardsGenerated(
        result.cards,
        result.deck_title || (extractedData?.title ?? 'Generated Flashcards'),
        {
          type: sourceType,
          content: sourceType === 'url' ? urlInput : activeContent.slice(0, 500)
        }
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate flashcards');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Context to Flashcards in Seconds
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Paste notes, articles, or any web URL. Gemini synthesizes atomic questions and cloze deletions ready for Anki.
        </p>
      </div>

      {/* Input Container Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#131520] border border-[#222638] shadow-2xl relative overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Source Mode Tabs */}
        <div className="flex items-center justify-between border-b border-[#222638] pb-4 mb-6">
          <div className="flex items-center space-x-2 bg-[#1b1e2c] p-1 rounded-xl border border-[#292f45]">
            <button
              onClick={() => { setSourceType('text'); setErrorMessage(null); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sourceType === 'text'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Raw Text / Notes</span>
            </button>

            <button
              onClick={() => { setSourceType('url'); setErrorMessage(null); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sourceType === 'url'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Web Article URL</span>
            </button>
          </div>

          <span className="hidden sm:inline-block text-xs text-slate-500 font-mono">
            {sourceType === 'text' ? `${rawText.split(/\s+/).filter(Boolean).length} words` : 'Trafilatura Extractor'}
          </span>
        </div>

        {/* Tab 1: Text Input */}
        {sourceType === 'text' && (
          <div className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Source Material
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste lecture notes, book summaries, code concepts, Wikipedia text, or study material here..."
              className="w-full p-4 rounded-2xl bg-[#0e1017] border border-[#24293c] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm leading-relaxed resize-y"
            />
          </div>
        )}

        {/* Tab 2: URL Input & Extractor */}
        {sourceType === 'url' && (
          <div className="space-y-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Article or Documentation URL
            </label>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExtractUrl()}
                  placeholder="https://en.wikipedia.org/wiki/Mitochondrion"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e1017] border border-[#24293c] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
                />
              </div>

              <button
                onClick={handleExtractUrl}
                disabled={isExtracting || !urlInput.trim()}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#22273b] hover:bg-[#2b3149] disabled:opacity-50 text-slate-200 text-sm font-medium border border-[#2f354f] transition-all"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Content</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </>
                )}
              </button>
            </div>

            {/* Extracted Preview */}
            {extractedData && (
              <div className="p-4 rounded-2xl bg-[#0f111a] border border-blue-900/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-400">
                  <div className="flex items-center space-x-1.5 font-medium">
                    <FileCheck2 className="w-4 h-4 text-blue-400" />
                    <span>Extracted Successfully</span>
                  </div>
                  <span className="text-slate-400 font-mono">{extractedData.wordCount} words</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">{extractedData.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {extractedData.content}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Options & Configuration Bar */}
        <div className="mt-6 pt-6 border-t border-[#222638] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Format Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Card Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['mixed', 'basic', 'cloze'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setCardFormat(fmt)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border capitalize transition-all ${
                      cardFormat === fmt
                        ? 'bg-blue-600/15 border-blue-500/50 text-blue-400 shadow-sm'
                        : 'bg-[#161824] border-[#272b3f] text-slate-400 hover:text-slate-200 hover:border-[#353b54]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Target Quantity
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setCardQuantity(qty)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                      cardQuantity === qty
                        ? 'bg-blue-600/15 border-blue-500/50 text-blue-400 shadow-sm'
                        : 'bg-[#161824] border-[#272b3f] text-slate-400 hover:text-slate-200 hover:border-[#353b54]'
                    }`}
                  >
                    {qty} Cards
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Collapsible Advanced Directives */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Custom Directives' : 'Add Custom Directives (Optional)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. 'Focus on biochemical reaction pathways and enzymes', 'Keep cloze deletions on technical jargon'"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0e1017] border border-[#24293c] text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Generate Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 transition-all transform active:scale-[0.98]"
            title={isConfigured ? 'Ready to generate' : 'Gemini key required'}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Synthesizing Flashcards with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Generate Flashcards</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
