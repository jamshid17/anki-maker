import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Shuffle, 
  Tag
} from 'lucide-react';
import type { Card } from '../types';

interface FlipModeProps {
  cards: Card[];
  deckTitle: string;
  onExit: () => void;
}

export const FlipMode: React.FC<FlipModeProps> = ({ cards, deckTitle, onExit }) => {
  const [deckCards, setDeckCards] = useState<Card[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Sync state if cards change
  useEffect(() => {
    setDeckCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  const handleNext = () => {
    if (currentIndex < deckCards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 100);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev - 1), 100);
    }
  };

  // Keyboard Navigation: Space to flip, Arrows to navigate, Esc to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyL') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyH') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, deckCards.length, onExit]);

  const handleShuffle = () => {
    const shuffled = [...deckCards].sort(() => Math.random() - 0.5);
    setDeckCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentCard = deckCards[currentIndex];
  if (!currentCard) return null;

  // Format Cloze for Front and Back
  const renderClozeFront = (text: string) => {
    return text.replace(/\{\{c\d+::(.*?)\}\}/g, '<span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">[...]</span>');
  };

  const renderClozeBack = (text: string) => {
    return text.replace(/\{\{c\d+::(.*?)\}\}/g, '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">$1</span>');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onExit}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Card Editor</span>
          </button>
          <h2 className="text-xl font-bold text-white mt-1">{deckTitle}</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShuffle}
            title="Shuffle Deck"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1a1d2b] hover:bg-[#23273a] border border-[#272b3f] text-xs font-medium text-slate-300 transition-all"
          >
            <Shuffle className="w-3.5 h-3.5 text-slate-400" />
            <span>Shuffle</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-400 font-mono text-xs font-medium">
            {currentIndex + 1} / {deckCards.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#1b1e2b] h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-blue-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / deckCards.length) * 100}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div 
        className="w-full h-80 sm:h-96 perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={`relative w-full h-full preserve-3d transition-transform duration-500 rounded-3xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          
          {/* FRONT SIDE */}
          <div className="absolute inset-0 backface-hidden rounded-3xl bg-[#141622] border border-[#282d42] p-8 flex flex-col justify-between shadow-2xl hover:border-blue-500/40 transition-colors">
            
            {/* Front Header */}
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wider uppercase ${
                currentCard.card_type === 'cloze'
                  ? 'bg-purple-950/50 text-purple-300 border border-purple-800/40'
                  : 'bg-blue-950/50 text-blue-300 border border-blue-800/40'
              }`}>
                {currentCard.card_type === 'cloze' ? 'Cloze Deletion' : 'Question'}
              </span>

              <span className="text-xs text-slate-500">Click or Space to flip</span>
            </div>

            {/* Front Content */}
            <div className="my-auto text-center px-4">
              {currentCard.card_type === 'cloze' ? (
                <div 
                  className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderClozeFront(currentCard.front) }}
                />
              ) : (
                <p className="text-lg sm:text-2xl font-medium text-slate-100 leading-relaxed">
                  {currentCard.front}
                </p>
              )}
            </div>

            {/* Front Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-1.5 flex-wrap">
                {currentCard.tags.map((tag) => (
                  <span key={tag} className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#1c1f2e] text-slate-400 text-[10px]">
                    <Tag className="w-2.5 h-2.5" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
              <span className="text-[11px] text-blue-400 font-medium">Front</span>
            </div>

          </div>

          {/* BACK SIDE */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-[#151928] border border-blue-500/50 p-8 flex flex-col justify-between shadow-2xl shadow-blue-500/5">
            
            {/* Back Header */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wider uppercase bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
                Answer / Explanation
              </span>

              <span className="text-xs text-slate-500">Click to flip back</span>
            </div>

            {/* Back Content */}
            <div className="my-auto text-center px-4 space-y-4">
              {currentCard.card_type === 'cloze' ? (
                <>
                  <div 
                    className="text-base sm:text-lg font-normal text-slate-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderClozeBack(currentCard.front) }}
                  />
                  {currentCard.back && (
                    <div className="pt-3 border-t border-[#29304a] text-sm text-slate-300">
                      {currentCard.back}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-lg sm:text-xl font-medium text-emerald-200 leading-relaxed">
                  {currentCard.back}
                </div>
              )}

              {currentCard.source_context && (
                <p className="text-xs text-slate-500 italic max-w-md mx-auto">
                  "{currentCard.source_context}"
                </p>
              )}
            </div>

            {/* Back Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="text-slate-400 text-xs">Press Space to flip</span>
              <span className="text-[11px] text-emerald-400 font-medium">Back</span>
            </div>

          </div>

        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#1a1d2b] hover:bg-[#23273a] disabled:opacity-30 border border-[#272b3f] text-sm font-medium text-slate-200 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous (←)</span>
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all"
        >
          <RotateCw className="w-4 h-4" />
          <span>{isFlipped ? 'Show Front' : 'Flip Card (Space)'}</span>
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === deckCards.length - 1}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#1a1d2b] hover:bg-[#23273a] disabled:opacity-30 border border-[#272b3f] text-sm font-medium text-slate-200 transition-all"
        >
          <span>Next (→)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-center text-xs text-slate-500 font-mono pt-2">
        <span>Space: Flip</span> • <span>← / →: Prev / Next</span> • <span>Esc: Exit</span>
      </div>

    </div>
  );
};
