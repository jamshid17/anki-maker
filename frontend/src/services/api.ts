import type {
  Card,
  Deck,
  SettingsStatus,
  AnkiStatus,
  ExtractResult,
  GenerateCardsRequest,
  GenerateCardsResponse,
  RefineCardsRequest,
  AnkiSyncResponse
} from '../types';

const API_BASE = '/api';

export const api = {
  // Settings & Status
  async getSettingsStatus(): Promise<SettingsStatus> {
    const res = await fetch(`${API_BASE}/settings/status`);
    if (!res.ok) throw new Error('Failed to fetch settings status');
    return res.json();
  },

  // Extraction
  async extractUrl(url: string): Promise<ExtractResult> {
    const res = await fetch(`${API_BASE}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Extraction failed' }));
      throw new Error(err.detail || 'Failed to extract content from URL');
    }
    return res.json();
  },

  // LLM Generation & Refinement
  async generateCards(req: GenerateCardsRequest): Promise<GenerateCardsResponse> {
    const res = await fetch(`${API_BASE}/cards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Card generation failed' }));
      throw new Error(err.detail || 'Failed to generate flashcards');
    }
    return res.json();
  },

  async refineCards(req: RefineCardsRequest): Promise<GenerateCardsResponse> {
    const res = await fetch(`${API_BASE}/cards/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Refinement failed' }));
      throw new Error(err.detail || 'Failed to refine flashcards');
    }
    return res.json();
  },

  // Decks Management
  async getDecks(): Promise<Deck[]> {
    const res = await fetch(`${API_BASE}/decks`);
    if (!res.ok) throw new Error('Failed to fetch decks');
    return res.json();
  },

  async getDeck(id: string): Promise<Deck> {
    const res = await fetch(`${API_BASE}/decks/${id}`);
    if (!res.ok) throw new Error('Deck not found');
    return res.json();
  },

  async saveDeck(payload: {
    title: string;
    source_type: string;
    source_content?: string;
    cards: Card[];
  }): Promise<Deck> {
    const res = await fetch(`${API_BASE}/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to save deck' }));
      throw new Error(err.detail || 'Failed to save deck');
    }
    return res.json();
  },

  async updateDeckTitle(id: string, title: string): Promise<Deck> {
    const res = await fetch(`${API_BASE}/decks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!res.ok) throw new Error('Failed to update deck title');
    return res.json();
  },

  async deleteDeck(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/decks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete deck');
  },

  // Anki Integration
  async testAnkiConnection(): Promise<AnkiStatus> {
    try {
      const res = await fetch(`${API_BASE}/anki/test`, { method: 'POST' });
      return await res.json();
    } catch {
      return { connected: false, error: 'Could not contact server' };
    }
  },

  async getAnkiDecks(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/anki/decks`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'AnkiConnect unreachable' }));
      throw new Error(err.detail || 'Failed to fetch Anki desktop decks');
    }
    const data = await res.json();
    return data.decks || [];
  },

  async syncToAnki(payload: {
    target_deck_name: string;
    deck_id?: string;
    cards?: Card[];
  }): Promise<AnkiSyncResponse> {
    const res = await fetch(`${API_BASE}/anki/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Sync failed' }));
      throw new Error(err.detail || 'Failed to sync to Anki');
    }
    return res.json();
  },

  // Direct Exports
  async downloadRawApkg(deckTitle: string, cards: Card[]) {
    const res = await fetch(`${API_BASE}/export/raw/apkg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deck_title: deckTitle, cards })
    });
    if (!res.ok) throw new Error('Failed to generate .apkg package');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deckTitle || 'Flashcards'}.apkg`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async downloadRawCsv(deckTitle: string, cards: Card[]) {
    const res = await fetch(`${API_BASE}/export/raw/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deck_title: deckTitle, cards })
    });
    if (!res.ok) throw new Error('Failed to generate CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deckTitle || 'Flashcards'}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadSavedDeckApkg(deckId: string) {
    window.location.href = `${API_BASE}/export/deck/${deckId}/apkg`;
  },

  downloadSavedDeckCsv(deckId: string) {
    window.location.href = `${API_BASE}/export/deck/${deckId}/csv`;
  }
};
