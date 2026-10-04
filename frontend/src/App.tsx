import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CreateStudio } from './components/CreateStudio';
import { ReviewStudio } from './components/ReviewStudio';
import { LibraryView } from './components/LibraryView';
import { FlipMode } from './components/FlipMode';
import { GeminiKeyNotice } from './components/GeminiKeyNotice';
import type { Card, Deck, SettingsStatus, AnkiStatus } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'studio' | 'library'>('studio');
  const [settings, setSettings] = useState<SettingsStatus | null>(null);
  const [ankiStatus, setAnkiStatus] = useState<AnkiStatus>({ connected: false });
  const [savedDeckCount, setSavedDeckCount] = useState<number>(0);

  // Studio Flow State
  const [activeCards, setActiveCards] = useState<Card[] | null>(null);
  const [activeDeckTitle, setActiveDeckTitle] = useState<string>('');
  const [activeSource, setActiveSource] = useState<{ type: 'text' | 'url'; content: string }>({
    type: 'text',
    content: ''
  });

  // Dedicated Flip mode from Library
  const [directFlipDeck, setDirectFlipDeck] = useState<{ cards: Card[]; title: string } | null>(null);

  // Load Status & Saved Count
  const loadAppStatus = async () => {
    try {
      const s = await api.getSettingsStatus();
      setSettings(s);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }

    try {
      const anki = await api.testAnkiConnection();
      setAnkiStatus(anki);
    } catch {
      setAnkiStatus({ connected: false, error: 'Unreachable' });
    }

    try {
      const decks = await api.getDecks();
      setSavedDeckCount(decks.length);
    } catch (e) {
      console.error('Failed to load decks count:', e);
    }
  };

  useEffect(() => {
    loadAppStatus();
    // Poll Anki status every 15 seconds so if user opens Anki desktop, it detects automatically
    const interval = setInterval(() => {
      api.testAnkiConnection().then(setAnkiStatus).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // When cards are generated from CreateStudio
  const handleCardsGenerated = (
    cards: Card[],
    title: string,
    source: { type: 'text' | 'url'; content: string }
  ) => {
    setActiveCards(cards);
    setActiveDeckTitle(title);
    setActiveSource(source);
    setCurrentTab('studio');
  };

  // Open deck from library in Studio
  const handleOpenDeckInStudio = (deck: Deck) => {
    setActiveCards(deck.cards || []);
    setActiveDeckTitle(deck.title);
    setActiveSource({
      type: (deck.source_type as 'text' | 'url') || 'text',
      content: deck.source_content || ''
    });
    setDirectFlipDeck(null);
    setCurrentTab('studio');
  };

  // Open deck from library in Flip Mode
  const handleOpenDeckInFlipMode = (deck: Deck) => {
    setDirectFlipDeck({
      cards: deck.cards || [],
      title: deck.title
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0d14] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setDirectFlipDeck(null);
        }}
        settings={settings}
        ankiStatus={ankiStatus}
        onRefreshStatus={loadAppStatus}
        savedDeckCount={savedDeckCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner if Gemini Key is missing */}
        {settings && !settings.gemini_configured && (
          <GeminiKeyNotice onRefresh={loadAppStatus} />
        )}

        {/* If user clicked direct Flip Mode from library */}
        {directFlipDeck ? (
          <FlipMode
            cards={directFlipDeck.cards}
            deckTitle={directFlipDeck.title}
            onExit={() => setDirectFlipDeck(null)}
          />
        ) : currentTab === 'library' ? (
          <LibraryView
            onOpenDeckInStudio={handleOpenDeckInStudio}
            onOpenDeckInFlipMode={handleOpenDeckInFlipMode}
            ankiStatus={ankiStatus}
          />
        ) : activeCards && activeCards.length > 0 ? (
          <ReviewStudio
            initialCards={activeCards}
            initialTitle={activeDeckTitle}
            source={activeSource}
            ankiStatus={ankiStatus}
            onReset={() => {
              setActiveCards(null);
              setActiveDeckTitle('');
            }}
            onSaveDeck={() => {
              loadAppStatus();
            }}
          />
        ) : (
          <CreateStudio
            onCardsGenerated={handleCardsGenerated}
            isConfigured={!!settings?.gemini_configured}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e2233] py-6 text-center text-xs text-slate-500">
        <p>Anki Maker MVP • Standalone .apkg generator & AnkiConnect sync</p>
      </footer>
    </div>
  );
};

export default App;
