export type CardType = 'basic' | 'cloze';

export interface Card {
  id?: string;
  deck_id?: string;
  card_type: CardType;
  front: string;
  back: string;
  tags: string[];
  source_context?: string;
  order_index?: number;
}

export interface Deck {
  id: string;
  title: string;
  source_type: string;
  source_content?: string;
  created_at: string;
  updated_at: string;
  card_count: number;
  cards?: Card[];
}

export interface SettingsStatus {
  gemini_configured: boolean;
  gemini_masked_key?: string;
  gemini_model: string;
  anki_url: string;
}

export interface AnkiStatus {
  connected: boolean;
  version?: number;
  error?: string;
}

export interface ExtractResult {
  url: string;
  title: string;
  content: string;
  word_count: number;
}

export interface GenerateCardsRequest {
  content: string;
  source_type: 'text' | 'url';
  source_url?: string;
  format: 'basic' | 'cloze' | 'mixed';
  quantity: number;
  custom_prompt?: string;
}

export interface GenerateCardsResponse {
  deck_title: string;
  cards: Card[];
}

export interface RefineCardsRequest {
  cards: Card[];
  instructions: string;
  deck_title?: string;
}

export interface AnkiSyncResponse {
  success: boolean;
  notes_added: number;
  deck_name: string;
  error?: string;
}
