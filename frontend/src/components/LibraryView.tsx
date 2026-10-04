import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Trash2, 
  Download, 
  FileSpreadsheet, 
  Play, 
  Radio, 
  Calendar, 
  FileText, 
  Globe, 
  Loader2,
  Edit2
} from 'lucide-react';
import type { Deck, AnkiStatus, Card } from '../types';
import { api } from '../services/api';
import { AnkiSyncModal } from './AnkiSyncModal';

interface LibraryViewProps {
  onOpenDeckInStudio: (deck: Deck) => void;
  onOpenDeckInFlipMode: (deck: Deck) => void;
  ankiStatus: AnkiStatus;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onOpenDeckInStudio,
  onOpenDeckInFlipMode,
  ankiStatus
}) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeckForSync, setSelectedDeckForSync] = useState<Deck | null>(null);
  const [syncCards, setSyncCards] = useState<Card[]>([]);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const data = await api.getDecks();
      setDecks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete deck "${title}"?`)) return;
    try {
      await api.deleteDeck(id);
      setDecks(decks.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete deck');
    }
  };

  const handleSyncClick = async (deck: Deck) => {
    try {
      const fullDeck = await api.getDeck(deck.id);
      setSelectedDeckForSync(fullDeck);
      setSyncCards(fullDeck.cards || []);
    } catch (err: any) {
      alert(err.message || 'Failed to load deck cards for sync');
    }
  };

  const handleStudyClick = async (deck: Deck) => {
    try {
      const fullDeck = await api.getDeck(deck.id);
      onOpenDeckInFlipMode(fullDeck);
    } catch (err: any) {
      alert(err.message || 'Failed to load deck cards');
    }
  };

  const handleEditClick = async (deck: Deck) => {
    try {
      const fullDeck = await api.getDeck(deck.id);
      onOpenDeckInStudio(fullDeck);
    } catch (err: any) {
      alert(err.message || 'Failed to load deck');
    }
  };

  const filteredDecks = decks.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Deck Library</h2>
          <p className="text-xs text-slate-400">
            {decks.length} saved {decks.length === 1 ? 'deck' : 'decks'} stored locally in SQLite
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decks..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141622] border border-[#24293c] text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-xs">Loading deck library...</span>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#131520] border border-[#222638] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1b1e2c] flex items-center justify-center mx-auto text-slate-500">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            {searchQuery ? 'No matching decks found' : 'No saved decks yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? 'Try adjusting your search query.' 
              : 'Create flashcards in the Studio using raw notes or web articles and click "Save Library".'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              className="p-5 rounded-2xl bg-[#141622] border border-[#222638] hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center space-x-1.5 font-medium">
                    {deck.source_type === 'url' ? (
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="capitalize">{deck.source_type}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[11px] font-semibold">
                    {deck.card_count} cards
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                  {deck.title}
                </h3>
              </div>

              {/* Date & Meta */}
              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(deck.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#1e2233] flex items-center justify-between">
                
                {/* Study & Edit buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStudyClick(deck)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition-all"
                  >
                    <Play className="w-3 h-3 fill-indigo-400" />
                    <span>Flip</span>
                  </button>

                  <button
                    onClick={() => handleEditClick(deck)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#1b1e2c] hover:bg-[#252a3d] border border-[#282d42] text-slate-300 text-xs font-medium transition-all"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Export & Actions */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleSyncClick(deck)}
                    title="Push to Anki"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-950/30 transition-colors"
                  >
                    <Radio className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => api.downloadSavedDeckApkg(deck.id)}
                    title="Download .apkg"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2334] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => api.downloadSavedDeckCsv(deck.id)}
                    title="Download CSV"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2334] transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(deck.id, deck.title)}
                    title="Delete Deck"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Sync Modal */}
      {selectedDeckForSync && (
        <AnkiSyncModal
          isOpen={!!selectedDeckForSync}
          onClose={() => setSelectedDeckForSync(null)}
          cards={syncCards}
          defaultDeckTitle={selectedDeckForSync.title}
          ankiStatus={ankiStatus}
        />
      )}

    </div>
  );
};
